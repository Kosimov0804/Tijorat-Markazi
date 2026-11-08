/* ============================================================
   MOLIYA BOZORI — Kapital · THE STATE MACHINE AND THE GATE-1
   ELIGIBILITY SCREEN

   Everything in this file is deterministic and runs with no API
   key. That is the whole point: the two things a founder cannot
   argue with — which status a deal may move to, and whether the
   submission is eligible to be judged at all — must not depend on
   a network call, a vendor or a bill. srv/kapital-ai.js adds
   judgement ON TOP of what is decided here and can only ever move
   a verdict downward.

   THE TRADE, stated once: a gate failure is NOT a rejection. It
   leaves the deal in `draft`, spends no quota, touches no counter
   and returns `{error:"gates_failed", gates:[…]}`. The word
   `rejected` is reserved for a judgement a human wrote down, and
   `submissionCount` has to keep counting judgements to stay
   meaningful — the moment a typo costs a founder one of three
   lifetime submissions, the limit stops protecting the oversight
   queue and starts punishing people for using a form.

   Four decisions in here are load-bearing:

   1  Claude NEVER issues a gate-1 verdict. There is no
      screening → qualified system transition in TRANSITIONS, no
      timeout sweep and no deterministic auto-qualification. The
      earlier design failed OPEN on three reachable paths, which
      made the cheapest route to a `pass` be making the model fail
      rather than answer. A human rules on the queue, always, and
      with no API key the advisory block is simply absent.

   2  The cooldown is NOT a gate. A 24-hour time lock rendered
      with "this is a form error — complete it and submit again"
      is exactly the wrong advice, so cooldownCheck() runs before
      runGates() and carries its own error code. Every other gate
      runs unconditionally, without short-circuiting, so a founder
      fixes one form instead of seven in sequence.

   3  Gate 4 CHECKS consent before it records it. legal.js's
      consentRecord(req, given) unconditionally constructs
      {given: given === true, …}, so a gate that only recorded
      would stamp a fabricated consent on a founder who never
      ticked the box — a compliance control that cannot fail is
      not a control.

   4  Nothing here reads a narrative field off the deal row.
      `deal.problem` / `.solution` / `.market` / `.team` do not
      exist: rubric content lives in `deal.answers` under the
      rubric's own field keys. Reading the row returned undefined
      four times, so gate 2 failed for every deal forever and
      inputHash was a constant across the whole platform — which
      in turn locked every declined founder out permanently under
      `unchanged_since_decline`, however much they rewrote.

   The gate table is numbered 1–8 with slot 7 (cooldown) moved out
   per decision 2, so SEVEN gates actually run. The numbering is
   kept because the error codes, the i18n keys and the stored
   verdict rows are all written against it.
   ============================================================ */
const crypto = require("crypto");
const H  = require("./store");
const KS = require("./kapital-standard");
const L  = require("./legal");

/* srv/kapital.js re-exports apply() so callers keep one import, which makes the
   dependency mutual. Resolving it at CALL time rather than at load time is what
   stops whichever module Node happens to load second from capturing a half-built
   exports object — the classic circular-require silent undefined. */
let _kp = null;
const KP = () => _kp || (_kp = require("./kapital"));

/* register.js declares this regex at line 76 and does not export it yet; the file
   manifest adds the export later. Read it through the module when it lands and
   fall back to the identical literal until then, so the two cannot drift apart
   without someone noticing they were ever two. */
const EMAIL = require("./register").EMAIL || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ---------- constants ---------- */
const MAX_SUBMISSIONS = 3;
const MAX_OPEN_DEALS = 3;
const DECLINE_COOLDOWN_H = 24;
const REVISE_COOLDOWN_H = 1;
const HOUR_MS = 3600000;
const HISTORY_CAP = 60;

/* ---------- the ask band, one per currency ----------
   00-README §6.6 rules that a rate table must NOT be wired into the gate-1 ask
   bounds, because a bound that moves with the market makes yesterday's decisions
   unreproducible. What stood here was a rate table wearing another name: four
   floats called FX_USD, multiplied into `deal.ask` and compared against a single
   USD floor and ceiling. Every non-USD ask was therefore priced off a number
   nobody had ratified, nothing versioned it, and the one thing §6.6 forbids is
   the thing it did.
   This is the other half of §6.6's own sentence: a STATIC, VERSIONED band per
   currency, floors and ceilings written down AS THEMSELVES. They are round
   numbers a human chose and reviewed — not conversions — and they change only
   when somebody edits ASK_BANDS_VERSION beside them, which is exactly what makes
   a gate decision taken today reproducible in a year.
   A currency with no band is NOT waved through and NOT priced at 1:1 (which
   would admit a 50-million-som ask as a 50-million-dollar one): the ask fails
   the gate with the currency named, because an ask nobody can size is an ask
   nobody can judge. */
const ASK_BANDS_VERSION = "2026-09-10";
const ASK_BANDS = {
  USD: { min: 5000,     max: 50000000 },
  EUR: { min: 5000,     max: 50000000 },
  RUB: { min: 400000,   max: 4000000000 },
  UZS: { min: 60000000, max: 600000000000 },
};
/* Spec §2.2 names these two by name. They ARE the USD row above rather than a
   second pair of literals beside it — two spellings of one bound are how the two
   come to disagree. */
const ASK_MIN_USD = ASK_BANDS.USD.min;
const ASK_MAX_USD = ASK_BANDS.USD.max;

/* A hard fail. The declared sector is a closed enum on the row, so it can be
   judged — free text defeated this list by typing "Weapons" or "qurol". */
const PROHIBITED_SECTORS = [
  "weapons", "munitions", "narcotics", "gambling", "betting", "adult",
  "unlicensed-lending", "deposit-taking", "pyramid", "mlm", "hyip",
  "crypto-issuance", "crypto-exchange", "tobacco-manufacture",
  "wildlife-trade", "counterfeit", "labour-brokering",
];
/* Passes, but is stamped restricted:true and cannot be PUBLISHED until oversight
   clears it. A licence-bound business is legitimate; an unexamined one is not. */
const RESTRICTED_SECTORS = [
  "alcohol", "pharma", "medical-devices", "banking", "insurance", "microfinance",
  "education-licensed", "mining", "energy-generation", "aviation", "security-services",
];
/* The soft scan, enumerated rather than left as a name with no list. A hit NEVER
   hard-fails: keyword matching on free text has false positives, and a false
   accusation of running a pyramid scheme is worse than a missed one. It raises a
   flag that routes the deal to a human, which is the only honest use of it.
   Matched as phrases against the normalised text, so multi-word terms work and
   the uz/ru/en spellings of one activity sit together. */
const SECTOR_KEYWORDS = {
  weapons: ["qurol", "oʻq dori", "oruzhie", "weapon", "ammunition", "firearm"],
  narcotics: ["giyohvand", "narkotik", "narcotic", "cannabis", "opiate"],
  gambling: ["qimor", "azart", "kazino", "casino", "gambling", "betting", "bukmeker"],
  pyramid: ["piramida", "piramid", "ponzi", "matrix marketing", "network marketing", "mlm"],
  lending: ["nasiya berish", "mikroqarz", "kredit berish", "payday", "lending licence"],
  crypto: ["kripto", "token sotish", "ico", "crypto exchange", "stablecoin"],
  adult: ["erotik", "porno", "adult content", "escort"],
  tobacco: ["tamaki", "tabak", "tobacco", "vape ishlab"],
  wildlife: ["yovvoyi hayvon savdosi", "ivory", "wildlife trade"],
  counterfeit: ["qalbaki", "kontrafakt", "counterfeit", "replica brand"],
};

/* The things that, if they change, make an existing qualification a judgement of
   another deal. `country` is NOT here because it does not exist on the row — the
   row has `region`, a closed enum.

   `kind` and `stage` were missing, and they are the two that branch the MOST:
   KS.scoreDeal() switches on both through isStartup/isProject/preRevenue,
   KAP_STAGES and REQUIRED_DOCS, so flipping kind from "startup" to "project"
   after qualification swaps every conditional field in sections 1, 4, 5 and 6 and
   the entire required-document set — a different rubric, a different set of
   answers, scored under a human verdict issued against the other shape. Nothing
   else on the header branches the rubric: `currency` and `ask` are scored fields
   rather than selectors (and a doubled or halved ask is caught below),
   `sector` and `region` are judged facts, and every remaining branch input
   (productStage, revenueLast12m, regulated, litigation) lives in `answers`,
   where changing it moves the score the founder is watching rather than
   redefining the question. */
const MATERIAL = ["kind", "stage", "sector", "region", "instrument"];

/* The exact fields the verdict is a judgement OF. Adding one invalidates every
   stored hash, which is correct: it means the decision was made on a different
   question. `kind` is here for the reason MATERIAL names it: a resubmission that
   changed nothing but the track is not "unchanged since decline". */
const JUDGED_FIELDS = ["name", "kind", "sector", "region", "stage", "instrument", "currency",
                       "ask", "valuation", "oneLiner", "summary"];

const GATE_KEYS = ["identity", "narrative", "ask", "legal", "sector", "duplicate", "links"];

/* ---------- small shared readers ---------- */
const answers = d => (d && d.answers) || {};
const txt = (d, key, cap) => H.S(answers(d)[key], cap || 6000);
const table = (d, key) => { const v = answers(d)[key]; return Array.isArray(v) ? v : []; };
const norm = s => H.S(s, 400).toLowerCase().replace(/\s+/g, " ").trim();

/** The static band for a currency, or null when none is declared. Null is the
 *  honest answer and the caller fails the gate on it — see ASK_BANDS. */
const askBand = currency => ASK_BANDS[H.S(currency, 5).toUpperCase()] || null;

/* ============================================================
   1. THE STATE MACHINE
   ============================================================ */

/* Expanded from compact rows so the table stays readable: `from` may be a list.
   TRANSITIONS is a plain array on purpose — it is read, unit-tested and rendered
   in the oversight view, and an assertion sweeps it to prove invariant I5 (no
   transition anywhere is triggerable by an investor identity). */
const ROWS = [
  /* gate 1 — submission and the human verdict */
  { from: ["draft", "rejected"], to: "screening", trigger: "submit", actor: "founder" },
  { from: "screening", to: "qualified", trigger: "qualify", actor: "oversight", verdict: "pass" },
  { from: "screening", to: "draft", trigger: "qualify", actor: "oversight", verdict: "revise" },
  { from: "screening", to: "rejected", trigger: "qualify", actor: "oversight", verdict: "decline" },
  /* The founder's only exit from the queue. There is no SLA and no auto-qualify
     timeout — the one that existed granted a pass on a network event — so the
     founder may pull the submission back rather than wait indefinitely. */
  { from: "screening", to: "draft", trigger: "withdrawSubmission", actor: "founder" },

  /* gate 2 — the rubric. Editing is free; only submitting costs. */
  { from: ["draft", "rejected"], to: "draft", trigger: "sectionSave", actor: "founder" },
  { from: "qualified", to: "standardizing", trigger: "sectionSave", actor: "founder" },
  { from: ["standardizing", "ready", "published", "paused"], to: "=",
    trigger: "sectionSave", actor: "founder" },

  /* settleTail() in kapital.js — the automatic promotion and demotion, both
     directions, and the ONLY implementation of the rule. A one-way
     gate left a 62%-complete deal sitting in `ready`, and a deal qualified at 95
     with nothing left to type stranded in `qualified` with no way out. */
  { from: ["qualified", "standardizing"], to: "ready", trigger: "settle", actor: "system" },
  { from: ["ready", "paused"], to: "standardizing", trigger: "settle", actor: "system" },

  /* publication. `published` is never demoted by settle: an investor reads the
     frozen snapshot, which genuinely met the bar, and a live listing must not
     flicker out mid-conversation. Drift and the withdraw triggers pull it. */
  { from: ["qualified", "standardizing", "ready", "paused"], to: "published",
    trigger: "publish", actor: "founder" },
  { from: "published", to: "paused", trigger: "unpublish", actor: "founder" },
  { from: "published", to: "paused", trigger: "drift", actor: "system" },
  /* `ready` is here because a ZRU-547 consent withdrawal pauses everything that
     is published OR publishable, and with only `published` on this row every
     `ready` deal came back bad_transition, was skipped by the loop, and the
     withdrawal reported a paused-count that was silently short. A consent
     withdrawal that under-reports what it did is a compliance defect, not a
     cosmetic one - the number is the receipt the subject is handed. */
  { from: ["published", "ready"], to: "paused", trigger: "withdrawTrigger", actor: "system" },

  /* re-screening after a material change, and the terminal move */
  { from: ["qualified", "standardizing", "ready", "published", "paused"], to: "screening",
    trigger: "screenRerun", actor: "founder" },
  { from: ["qualified", "standardizing", "ready", "published", "paused"], to: "screening",
    trigger: "screenRerun", actor: "oversight" },
  { from: ["draft", "rejected", "qualified", "standardizing", "ready", "published", "paused"],
    to: "closed", trigger: "close", actor: "founder" },

  /* oversight. Three distinct powers, deliberately not one. */
  { from: ["draft", "screening", "rejected", "qualified", "standardizing", "ready",
           "published", "paused"], to: "suspended", trigger: "suspend", actor: "oversight" },
  { from: "suspended", to: "*", trigger: "unsuspend", actor: "oversight" },
  { from: "rejected", to: "qualified", trigger: "override", actor: "oversight" },
  /* There is NO `reject` row, and there must not be one. A second rejection
     route lived here and the oversight surface ran it as a PURE STATUS MOVE: it
     wrote no deal.qualify, left the pending verdict row pending and stamped no
     inputHash, so lastVerdict() returned null, cooldownCheck() short-circuited on
     `if(!last) return {ok:true}` and NEITHER the 24-hour DECLINE_COOLDOWN_H NOR
     unchanged_since_decline applied to anything rejected through it. Oversight's
     reject IS dealQualify({verdict:"decline"}) now - one path, one finalisation,
     both controls, and this row would silently re-open the bypass. */
  { from: "rejected", to: "draft", trigger: "reopen", actor: "oversight" },
  { from: "published", to: "paused", trigger: "unpublish", actor: "oversight" },
  { from: "paused", to: "published", trigger: "republish", actor: "oversight" },
];

/* Two targets are dynamic: `"="` is a same-status save, and `"*"` is unsuspend
   restoring whatever deal.restoredTo recorded. Expanding either against D_STATUS
   at load time would freeze a copy of the vocabulary in this file, which is the
   thing D_STATUS living in kapital.js exists to prevent. */
const TRANSITIONS = ROWS.reduce((out, r) => {
  for(const from of (Array.isArray(r.from) ? r.from : [r.from]))
    out.push({ from, to: r.to, trigger: r.trigger, actor: r.actor, verdict: r.verdict || "" });
  return out;
}, []);

/** Map a resolved identity onto the three actor roles the table names. Anything
 *  else — investor, buyer, assoc, analyst — matches no row, so invariant I5 is
 *  enforced by the shape of the table rather than by a rule someone must
 *  remember to write into every handler. */
function actorRole(actor){
  if(!actor) return "system";
  const t = H.S(actor.type || actor.tier, 20);
  if(t === "founder" || t === "company") return "founder";
  if(t === "admin" || t === "rais" || t === "oversight") return "oversight";
  return t || "system";
}

/** Is this move legal? Pure lookup, so the admin view can render the table and a
 *  test can sweep every cell of it. */
function can(from, to, trigger, actorType){
  const f = H.S(from, 40), t = H.S(to, 40), g = H.S(trigger, 40), a = H.S(actorType, 20);
  if(!KP().D_STATUS.includes(t)) return false;
  return TRANSITIONS.some(r => {
    if(r.from !== f || r.trigger !== g || r.actor !== a) return false;
    if(r.to === "=") return t === f;
    /* An unsuspend may restore any status the deal left, but it may never mint a
       terminal one or re-enter suspension — the exit from `suspended` is not the
       place to close a raise on a founder's behalf. */
    if(r.to === "*") return t !== "suspended" && t !== "closed";
    return r.to === t;
  });
}

/**
 * The ONLY writer of deal.status anywhere in the module. Everything else calls
 * this, which is what turns invariant I6 from an aspiration into something a
 * grep test can prove. Returns a NEW row — a stored row is never mutated, so a
 * refused transition cannot leave half a write behind.
 */
function apply(deal, to, trigger, actor, patch){
  if(!deal) return { error: "not_found" };
  const role = actorRole(actor);
  if(deal.frozen === true && role === "founder") return { error: "frozen" };
  if(!can(deal.status, to, trigger, role)) return { error: "bad_transition" };
  const t = Date.now();
  const entry = { from: H.S(deal.status, 40), to: H.S(to, 40), by: H.S(actor && actor.name, 160),
                  byTier: role, note: H.S(patch && patch.note, 400), t };
  const history = (Array.isArray(deal.history) ? deal.history : []).concat([entry]).slice(-HISTORY_CAP);
  const next = Object.assign({}, deal, patch || {},
    { status: H.S(to, 40), history, updated: t });
  /* `note` rides in the patch to reach the history entry above; it is not a deal
     row field (that is `adminNote`) and must not become one by accident. */
  delete next.note;
  return { ok: true, deal: next };
}

/* There is deliberately no settle() here. One lived at this spot, exported, with
   no caller anywhere in the tree, while the rule it claimed to implement actually
   ran in kapital.js settleTail() — and the two disagreed: this one moved under an
   actor of {type:"system"} and wrote a `readyAt` field §2.6 does not declare,
   where the live one hands the FOUNDER's own first save out of `qualified` and
   writes no such field. That is the exact shape of the duplicate screenScore()
   already collapsed here: two implementations of one rule, one of which is not
   the one that runs, and a reader who fixes the wrong one. The promotion and
   demotion rule has ONE implementation and it is settleTail(). */

/**
 * THE ONE AUTHORIZATION CHECKPOINT for oversight's privileged writes.
 *
 * apply() asserts actorRole on every STATUS move, which quietly left every
 * oversight power that changes NO status — freeze, unfreeze, resetSubmissions,
 * clearRestriction and the two investor overrides — carrying no in-module
 * authorization whatsoever: each wrote privileged state through a bare put() or
 * Object.assign and never once asked who the caller was. clearRestriction is the
 * single field standing between the eleven RESTRICTED_SECTORS and publication,
 * and it was the least guarded write in the module.
 *
 * Returns an ERROR OBJECT or null rather than a boolean, so a caller that forgets
 * to read the answer gets a truthy value it cannot mistake for a permit.
 */
function oversightOnly(actor){
  return actorRole(actor) === "oversight" ? null : { error: "forbidden" };
}

/* ============================================================
   2. THE DETERMINISTIC ELIGIBILITY GATES
   ============================================================ */

/** One shape for every gate, so the client renders one card and the verdict row
 *  stores one table. The hint is an i18n key: the client renders the sentence,
 *  the server never ships Uzbek prose it cannot translate. */
const gate = (key, ok, code, fields, extra) => Object.assign(
  { key, ok: ok === true, code: ok === true ? "" : (code || key + "_failed"),
    fields: fields || [], i18n: "kp_gate_" + key + "_hint" }, extra || {});

/* --- gate 1 · identity. An anonymous ask is not a deal. --- */
function gateIdentity(deal, orgs){
  const bad = [];
  const owner = H.S(deal.ownerId, 60);
  const roster = (orgs && Array.isArray(orgs.companies)) ? orgs.companies : null;
  if(!owner) bad.push("ownerId");
  /* Ownership itself was proven by the credentials long before this ran; the
     roster buys the re-check that the account has not been SUSPENDED SINCE — by
     a ZRU-547 consent withdrawal above all.
     The roster is REQUIRED, not optional. It used to be "checked when supplied,
     silent when not", so any route that built a ctx without `orgs` disabled the
     check with no error, no log and no test failing, and a suspended company kept
     submitting deals under an ok gate. A requirement nothing announces is not a
     requirement. It now fails the gate under its own code and says so on stderr,
     because the fault is a wiring bug in the CALLER and no founder can fix it by
     editing their form. srv/api.js must pass ctx = { orgs: core.getOrgs(), req }
     on every route that reaches runGates(); the export list says so too. */
  else if(deal.ownerTier === "company" && !roster){
    console.error("[kapital-gates] gateIdentity: no orgs roster — pass ctx {orgs: core.getOrgs(), req}");
    return gate("identity", false, "identity_unverified", ["ownerId"]);
  }
  else if(deal.ownerTier === "company"
          && !roster.some(c => c && String(c.id) === owner && !c.suspended))
    bad.push("ownerId");
  if(txt(deal, "legalName", 200).length < 3) bad.push("legalName");
  const email = H.S((deal.contact && deal.contact.email) || deal.ownerEmail, 200).toLowerCase();
  if(!EMAIL.test(email)) bad.push("contactEmail");
  /* Both closed sets carry "" as a member so an unanswered rubric field can be
     stored — so membership alone is not a test. The gate wants a CHOICE. */
  const region = H.S(deal.region, 120);
  if(!region || !KS.REGIONS.includes(region)) bad.push("region");
  return gate("identity", !bad.length, "identity_incomplete", bad);
}

/* --- gate 2 · narrative. --- */
const NARRATIVE = [
  { key: "problemStatement", min: 200 }, { key: "solution", min: 200 },
  { key: "marketSizingMethod", min: 120 }, { key: "whyThisTeam", min: 120 },
];
const MIN_DISTINCT_TOKENS = 60;
const PAD_LIMIT = 0.9;

/**
 * Four answers, each long enough to judge, and no two of them the same paragraph
 * twice. The anti-padding clause is SYMMETRIC and pairwise: the one-way form it
 * replaces hard-failed a legitimate solution that opens by restating the problem
 * — the most common way founders write that section — and caught padding of
 * `market` or `team` not at all. The four are tokenised SEPARATELY because
 * H.tokens() caps its input at 6000 characters, so a concatenation silently
 * dropped the last two fields out of the distinct-word count.
 */
function gateNarrative(deal){
  const bad = [], union = new Set(), toks = {};
  for(const f of NARRATIVE){
    const s = txt(deal, f.key, 6000);
    if(s.length < f.min) bad.push(f.key);
    toks[f.key] = H.tokens(s);
    for(const w of toks[f.key]) union.add(w);
  }
  /* Only reported when every field cleared its length: a founder with a short
     answer already has a field to fix, and "your vocabulary is thin" on top of
     that is noise, not help. */
  if(union.size < MIN_DISTINCT_TOKENS && !bad.length) bad.push("distinct");
  for(let i = 0; i < NARRATIVE.length; i++) for(let j = i + 1; j < NARRATIVE.length; j++){
    const a = NARRATIVE[i].key, b = NARRATIVE[j].key;
    if(!toks[a].size || !toks[b].size) continue;
    if(Math.min(H.coverage(toks[a], toks[b]), H.coverage(toks[b], toks[a])) >= PAD_LIMIT){
      if(!bad.includes(a)) bad.push(a);
      if(!bad.includes(b)) bad.push(b);
    }
  }
  return gate("narrative", !bad.length, "narrative_thin", bad);
}

/* --- gate 3 · ask. --- */
const EQUITY_RATIO_MIN = 0.005;
const EQUITY_RATIO_MAX = 0.6;

/**
 * An ask above 60% of the stated valuation is not an equity round; an ask of
 * 0.3% is a rounding error. Either way the numbers do not describe the deal the
 * founder thinks they are describing. The use-of-funds test asks only whether
 * there is a plan for the money AT ALL — one complete row. Whether it is a good
 * plan is the rubric's question, and the rubric wants three.
 */
function gateAsk(deal){
  const bad = [];
  /* Compared inside the deal's OWN currency, against that currency's own band.
     No conversion happens anywhere on this path, which is the point. */
  const band = askBand(deal.currency), ask = H.N(deal.ask);
  if(!band || ask < band.min || ask > band.max) bad.push("ask");
  const instrument = H.S(deal.instrument, 40);
  if(!KS.ROW_INSTRUMENTS.includes(instrument)) bad.push("instrument");
  const planned = table(deal, "useOfFunds")
    .filter(r => r && H.S(r.bucket, 120) && H.N(r.amount) > 0);
  if(!planned.length) bad.push("useOfFunds");
  const val = H.N(deal.valuation);
  if(KS.EQUITY_LIKE.includes(instrument) && H.N(deal.ask) > 0 && val > 0){
    const share = H.N(deal.ask) / val;
    if(share < EQUITY_RATIO_MIN || share > EQUITY_RATIO_MAX) bad.push("valuation");
  }
  return gate("ask", !bad.length, "ask_out_of_bounds", bad);
}

/* --- gate 4 · legal. --- */
const TIN = /^\d{9}$/;
const INCORPORATION_PLAN_MIN = 80;

/**
 * Consent is CHECKED here and only then recorded. legal.js's
 * consentRecord(req, given) unconditionally constructs {given: given === true},
 * so calling it with a literal `true` can never fail — a gate written that way
 * stamps a compliant-looking record on a founder who never ticked the box. The
 * correct pattern is two files away in register.consentGate().
 */
function gateLegal(deal, body, req){
  if(!H.BOOL(body.consent)) return { key: "legal", ok: false, code: "consent_required" };
  const bad = [];
  const form = txt(deal, "legalForm", 40);            // "" is a LEGAL_FORMS member
  if(!form || !KS.LEGAL_FORMS.includes(form)) bad.push("legalForm");
  /* A company that does not exist yet may still be judged — but it must say so
     and say what it is doing about it, rather than leaving the field blank. */
  const preInc = H.BOOL(body.preIncorporation)
    && H.S(body.incorporationPlan, 2000).length >= INCORPORATION_PLAN_MIN;
  if(!TIN.test(txt(deal, "tin", 20)) && !preInc) bad.push("tin");
  if(!table(deal, "capTable").length) bad.push("capTable");
  if(answers(deal).sanctionsAttest !== true) bad.push("sanctionsAttest");
  return gate("legal", !bad.length, "legal_incomplete", bad,
    bad.length ? {} : { consent: L.consentRecord(req, true) });
}

/* --- gate 5 · sector. --- */
/** The declared sector is the only thing that may hard-fail, and only because it
 *  is a closed enum. The keyword scan over the founder's own prose runs beside
 *  it and never blocks: it raises a flag that routes the deal to a human. */
function gateSector(deal){
  const sector = H.S(deal.sector, 120);
  const flagged = scanSector(deal);
  /* SECTORS carries "" so an unset row is storable; an unset row is not a
     submission. Without the emptiness test the whole prohibited list is walked
     past by simply never choosing — the same hole free text left. */
  if(!sector || !KP().SECTORS.includes(sector))
    return gate("sector", false, "sector_required", ["sector"], { flagged });
  if(PROHIBITED_SECTORS.includes(sector))
    return gate("sector", false, "sector_prohibited", ["sector"], { flagged });
  return gate("sector", true, "", [],
    { restricted: RESTRICTED_SECTORS.includes(sector), flagged });
}

/** Which themes the narrative mentions. Phrase matching over the normalised text
 *  rather than token matching, so "network marketing" and "qimor" both work. */
function scanSector(deal){
  const hay = " " + H.norm(NARRATIVE.map(f => txt(deal, f.key, 4000)).join(" ")) + " ";
  const hit = [];
  for(const theme of Object.keys(SECTOR_KEYWORDS))
    if(SECTOR_KEYWORDS[theme].some(w => hay.includes(" " + H.norm(w) + " "))) hit.push(theme);
  return hit;
}

/* --- gate 6 · duplicate. --- */
const NEAR_DUPLICATE = 0.85;
const OPEN_EXCLUDED = ["closed", "suspended"];

/**
 * Counts the owner's other open deals EXCLUDING the subject: counting the deal
 * in hand made MAX_OPEN_DEALS = 3 really two, with the third created, filled in,
 * and then permanently un-submittable under an error naming a limit the founder
 * had not exceeded. `suspended` is excluded as well, or three suspensions would
 * end a founder's ability to submit anything ever again.
 *
 * A near-duplicate under a DIFFERENT owner cannot be proven — two people may
 * genuinely be solving one problem — so it raises a flag instead of blocking.
 */
function gateDuplicate(deal, st){
  const deals = (st && Array.isArray(st.deals)) ? st.deals : [];
  const owner = H.S(deal.ownerId, 60);
  const mine = deals.filter(d => d && d.id !== deal.id && H.S(d.ownerId, 60) === owner
    && !OPEN_EXCLUDED.includes(H.S(d.status, 40)));
  const problem = H.tokens(txt(deal, "problemStatement", 6000));
  const name = norm(deal.name);
  const twin = mine.find(d => (name && norm(d.name) === name)
    || (problem.size && H.coverage(H.tokens(txt(d, "problemStatement", 6000)), problem) >= NEAR_DUPLICATE));
  if(twin) return gate("duplicate", false, "duplicate_submission", ["name", "problemStatement"]);
  if(mine.length >= MAX_OPEN_DEALS)
    return gate("duplicate", false, "too_many_open", ["status"], { open: mine.length });
  const stranger = problem.size && deals.some(d => d && d.id !== deal.id
    && H.S(d.ownerId, 60) !== owner && !OPEN_EXCLUDED.includes(H.S(d.status, 40))
    && H.coverage(H.tokens(txt(d, "problemStatement", 6000)), problem) >= NEAR_DUPLICATE);
  return gate("duplicate", true, "", [], { flagged: stranger ? ["possible_duplicate"] : [] });
}

/* --- gate 8 · links. --- */
const URL_MAX = 400;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/** These links are shown to investors and the model never fetches them — there
 *  is no web access on this path — so nothing validates them but this. An absent
 *  link is not invalid: presence is the rubric's business, shape is ours. */
function httpsOk(url){
  const s = H.S(url, 500);
  if(!s) return true;
  if(s.length > URL_MAX || !/^https:\/\//i.test(s)) return false;
  const host = s.slice(8).split(/[/?#]/)[0].split("@").pop().split(":")[0];
  return !!host && !IPV4.test(host) && !host.startsWith("[") && host.includes(".");
}

/* The row's website and the rubric's are two stores of one fact, so they report
   under one field name: whichever is malformed, the founder fixes a web address.
   The data-room tables are not scanned here — their `url` columns are typed and
   validated by the rubric itself, and duplicating that would give one bad link
   two different error messages. */
function gateLinks(deal){
  const a = answers(deal);
  const bad = [];
  for(const [key, url] of [["website", deal.website], ["website", a.website],
                           ["deck", deal.deck], ["demoUrl", a.demoUrl]])
    if(!httpsOk(url) && !bad.includes(key)) bad.push(key);
  return gate("links", !bad.length, "link_invalid", bad);
}

/**
 * All seven gates, always, without short-circuiting — a founder should fix one
 * form, not seven in sequence. `body` is here because gate 4 needs `consent`,
 * `preIncorporation` and `incorporationPlan`; `req` because gate 4 records the
 * consent it just checked; `orgs` because gate 1 re-resolves the owner account;
 * `st` because gate 6 counts the owner's other deals. None of them is trusted
 * for ownership: that came from the credentials before this was ever called.
 */
function runGates(deal, body, st, orgs, req){
  const b = body || {};
  /* Re-shaped through gate() so every row carries `fields` and an i18n key even
     when the gate returned the bare three-key form the consent clause uses. */
  const gates = [
    gateIdentity(deal, orgs), gateNarrative(deal), gateAsk(deal),
    gateLegal(deal, b, req), gateSector(deal), gateDuplicate(deal, st), gateLinks(deal),
  ].map(g => gate(g.key, g.ok, g.code, g.fields, g));
  const legal = gates.find(g => g.key === "legal");
  const sector = gates.find(g => g.key === "sector");
  const dupe = gates.find(g => g.key === "duplicate");
  /* Soft signals, never blockers: they route the deal to a human rather than
     answering it. `sectorThemes` says WHICH words were hit, because a flag an
     approver cannot audit is a flag they will learn to ignore. */
  const flags = [];
  if(sector && (sector.flagged || []).length) flags.push("sector_flagged");
  for(const f of ((dupe && dupe.flagged) || [])) if(!flags.includes(f)) flags.push(f);
  return {
    ok: gates.every(g => g.ok),
    gates, flags,
    sectorThemes: (sector && sector.flagged) || [],
    restricted: !!(sector && sector.restricted),
    consent: (legal && legal.consent) || null,
  };
}

/* ============================================================
   3. THE PRE-GATE TIME LOCK, THE HASH AND THE SCREEN SCORE
   ============================================================ */

/**
 * The latest FINALISED verdict for a deal. Pending rows are not decisions and
 * must not start a cooldown — a founder waiting on the queue is not serving a
 * penalty.
 *
 * Finalisation is tested by "a verdict word is written on the row", not by the
 * lifecycle field, because spec 02 names that field `state` ("pending"/"final")
 * and the domain module writes `status` ("pending"/"decided"). Reading the
 * VERDICTS vocabulary instead is correct under either spelling and does not
 * quietly pick a winner between two files this one does not own.
 */
function lastVerdict(deal, st){
  const words = KP().VERDICTS;
  const rows = (st && Array.isArray(st.verdicts) ? st.verdicts : [])
    .filter(v => v && v.dealId === deal.id && words.includes(H.S(v.verdict, 20)));
  return rows.length ? rows.reduce((a, b) => (H.N(b.decided) >= H.N(a.decided) ? b : a)) : null;
}

/**
 * Runs BEFORE the gates and carries its own error code, never `gates_failed`.
 * The client renders a gate failure with "this is a form error, not a rejection
 * — complete it and submit again", which is exactly the wrong advice for a
 * 24-hour time lock. A time lock is not a form error.
 */
function cooldownCheck(deal, st){
  if(H.N(deal.submissionCount) >= MAX_SUBMISSIONS)
    return { error: "submission_limit_reached", limit: MAX_SUBMISSIONS };
  const last = lastVerdict(deal, st);
  if(!last) return { ok: true };
  const hours = last.verdict === "decline" ? DECLINE_COOLDOWN_H
    : last.verdict === "revise" ? REVISE_COOLDOWN_H : 0;
  const until = H.N(last.decided) + hours * HOUR_MS;
  if(hours && Date.now() < until) return { error: "cooldown_active", until };
  /* Content lock. Resubmitting byte-identical text after a decline costs nothing
     and gets the same answer, so it is refused rather than queued for a human.
     The hash it compares against is stamped onto the verdict row at the moment a
     HUMAN finalises it — kapital.js dealQualify — computed from the deal as it
     stood at that decision. For a long while nothing wrote `inputHash` onto a
     verdict row at all, so this branch could never fire and the control was
     decorative: a declined founder waited out DECLINE_COOLDOWN_H and re-queued
     the identical text for free, which is the exact thing it exists to stop.
     The emptiness test is the guard. It cuts both ways: an UNSTAMPED legacy row
     is no evidence that nothing changed, so it must let the founder through
     rather than refuse them on a blank; and a stamped row must never be matched
     by a "" === "" comparison if inputHash() ever returns nothing. */
  const stamped = H.S(last.inputHash, 80);
  if(last.verdict === "decline" && stamped && inputHash(deal) === stamped)
    return { error: "unchanged_since_decline" };
  return { ok: true };
}

/* Hashing `answers` WHOLE is what makes "you changed nothing" track what the
   founder actually edits. Key order is normalised by sorting, so the hash is
   stable across Node versions and insertion order. */
function inputHash(deal){
  const a = answers(deal);
  return crypto.createHash("sha256").update(JSON.stringify([
    JUDGED_FIELDS.map(k => H.S(deal[k], 6000)),
    Object.keys(a).sort().map(k => [k, a[k]]),
  ])).digest("hex");
}

/**
 * Which MATERIAL facts changed between two versions of a header. A verdict
 * judges a specific submission; changing the sector or tripling the ask after
 * qualification makes that verdict a judgement of something else.
 */
function materialChange(prev, next){
  const out = [];
  for(const k of MATERIAL) if(H.S(prev[k], 120) !== H.S(next[k], 120)) out.push(k);
  const a = H.N(prev.ask), b = H.N(next.ask);
  if(a && b && (b > a * 2 || b < a / 2)) out.push("ask");
  /* coverage() is asymmetric on purpose: `need` is the OLD problem statement. If
     fewer than half the words that used to describe the problem survive, the
     founder is describing a different problem, whatever the section is still
     called. GUARDED, because H.coverage returns 0 on an empty `need` — unguarded
     it reported "problem" as materially changed on every save of a deal whose
     previous statement was blank, permanently demanding a re-screen nobody had
     budget for. */
  const was = H.tokens(H.S((prev.answers || {}).problemStatement, 6000));
  if(was.size && H.coverage(was, H.tokens(H.S((next.answers || {}).problemStatement, 6000))) < 0.5)
    out.push("problem");
  return out;
}

/**
 * Gate 1's deterministic half, explainable via H.score like every other number
 * on this platform: it returns the reasons and the gaps, not a verdict. Below
 * SCREEN_MIN a deal may not be submitted at all, so oversight never opens an
 * empty form and the founder is told what is missing now rather than in a week.
 *
 * THE ONLY implementation. srv/kapital.js carried a second one against the same
 * SCREEN_MIN threshold that disagreed on two of five factors — it took any
 * founder row with a name, and any ask with a one-liner, where this one wants a
 * role beside the name and a use-of-funds plan beside the ask. The two could
 * differ by 45 of 100 points on one deal and straddle SCREEN_MIN in BOTH
 * directions, so whether a founder could submit depended on which file the
 * caller happened to import from. kapital.js now re-exports this one.
 *
 * Every factor reads a field that EXISTS at the moment this runs. The first
 * draft drew 35 of these 100 points from `answers.team_founders` and
 * `answers.market_size` — keys the rubric does not declare — so the ceiling was
 * 65 and a founder with no website or deck topped out at 50 against a minimum of
 * 60: permanently locked out by a gap list telling them to fill a form nobody
 * could open. `founders` and `marketNote` are top-level row fields written by
 * /api/kapital/deal precisely so this function can read them, and useOfFunds is
 * read from `answers` because there is no such field on the row.
 */
function screenScore(deal){
  const d = deal || {};
  const planned = table(d, "useOfFunds").filter(r => r && H.S(r.bucket, 120) && H.N(r.amount) > 0);
  return H.score([
    { weight: 25, value: (d.name && d.sector && d.region
                          && H.S(d.summary, 3000).length >= 400) ? 1 : 0,
      why: "Loyiha taʼrifi toʻliq",
      gap: "Nom, sektor, hudud va kamida 400 belgilik mazmun kerak" },
    { weight: 25, value: (H.N(d.ask) > 0 && d.instrument && planned.length) ? 1 : 0,
      why: "Kapital soʻrovi aniq",
      gap: "Soʻraladigan summa, instrument va mablagʻdan foydalanish rejasi kerak" },
    { weight: 20, value: Math.min(1, (d.founders || []).filter(f => f && f.name && f.role).length),
      why: "Asoschilar koʻrsatilgan",
      gap: "Kamida bitta asoschi ismi va roli bilan kiritilsin" },
    { weight: 15, value: (d.website || d.deck || (d.evidence || []).length) ? 1 : 0,
      why: "Tashqi dalil mavjud",
      gap: "Sayt, taqdimot yoki hujjat havolasini qoʻshing" },
    { weight: 15, value: H.S(d.marketNote, 600).length >= 120 ? 1 : 0,
      why: "Bozor daʼvosi bor",
      gap: "Bozor hajmi yoki maqsadli mijozni taʼriflang" },
  ]);
}

module.exports = {
  TRANSITIONS, can, apply, actorRole,
  /** The one authorization checkpoint for every privileged oversight write.
   *  (actor) -> {error:"forbidden"} | null. */
  oversightOnly,
  GATE_KEYS, runGates, screenScore,
  cooldownCheck, lastVerdict,
  inputHash, JUDGED_FIELDS, materialChange, MATERIAL,
  PROHIBITED_SECTORS, RESTRICTED_SECTORS, SECTOR_KEYWORDS,
  /* The static, versioned ask band. No rate table, per 00-README §6.6. */
  ASK_BANDS, ASK_BANDS_VERSION, askBand, ASK_MIN_USD, ASK_MAX_USD,
  MAX_SUBMISSIONS, MAX_OPEN_DEALS, DECLINE_COOLDOWN_H, REVISE_COOLDOWN_H,
};
