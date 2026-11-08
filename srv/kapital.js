/* ============================================================
   KAPITAL — the deal lifecycle, and the one declaration of kapital.json

   A founder writes a deal, a human screens it, the founder fills a deterministic
   ten-section standard, and at 90% a Publish action unlocks that puts a FROZEN copy in
   front of admin-approved investors. Four decisions shape this file, and each is the
   answer to a way it could have failed quietly.
   1  ONE COLLECTION DECLARATION, HERE. store.js's loader builds a fresh object from ITS
      key list and save() writes the whole document, so a second H.collection() on this
      file elsewhere erases the arrays this one does not know about — silently, forever.
   2  deal.score IS A CACHE, NEVER AN INPUT TO A DECISION. It is stored so the cabinet can
      draw a delta without rescoring 125 fields on a read; publication asks
      KS.standardMet(), which recomputes from `answers` unconditionally. A cached 91
      written before a rubric weight moved must never open a gate.
   3  THE STORE BOUNDARY IS ABSOLUTE. This file never requires investor.js, buyer.js, core
      or orgs — it knows ids and nothing about how they authenticate, as bozor.js knows a
      buyerId without having heard of buyer.js. api.js is the only place the two stores meet,
      which lets investor.watchToggle(…, isPublished) take a boolean rather than open a cycle.
   4  EVERY PROJECTION IS BUILT, NOT STRIPPED — and they now live in srv/kapital-views.js,
      with the reason spelled out in that file's header. A copy-minus-a-few-keys ships
      whatever the row grows next: the worst failure available here, and it happened twice.

   Ownership is resolved from credentials by api.js and handed in; nothing below reads an
   owner id out of a request body.
   ============================================================ */
const H = require("./store"), KS = require("./kapital-standard");
const M = require("./moliya"), PW = require("./passwords");
/* The room requires THIS file lazily, from inside its functions, so the import below closes no
   cycle: kapital-room.js finishes loading before this module's exports object is built. */
const ROOM = require("./kapital-room");
/* Required DIRECTLY and unconditionally. kapital-gates.js reaches back for D_STATUS, SECTORS and
   VERDICTS through a lazy KP() resolved at CALL time, so these imports close no cycle either. */
const GATES = require("./kapital-gates");
const V = require("./kapital-views");
/* The oversight surface — the queue, the dashboard and every privileged override
   — moved out whole when this file reached its ceiling. It reaches back through a
   lazy KP() resolved at CALL time, so this direct require closes no cycle. */
const OV = require("./kapital-oversight");

/* ---------- the collection ----------
   Six arrays. `verdicts`, `reviews` and `throttle` belong to the verification modules
   and `events` to the intelligence layer; they are declared here anyway, because the
   alternative is two declarations, which is failure 1 above. */
const KAPITAL_KEYS = ["deals", "talks", "verdicts", "reviews", "throttle", "events"];
const col = H.collection("kapital.json", KAPITAL_KEYS), load = col.load, save = col.save;

/* ---------- vocabulary ---------- */
const D_STATUS = ["draft", "screening", "rejected", "qualified", "standardizing",
                  "ready", "published", "paused", "closed", "suspended"];
const TERMINAL = ["closed"], INVESTOR_VISIBLE = ["published"];
/* `screening` is frozen because a founder editing underneath a reviewer is how a
   reviewer approves something that no longer exists. */
const FOUNDER_FROZEN = ["screening", "closed", "suspended"];
const CLOSE_REASONS = ["funded", "withdrawn", "expired", "admin"];
const VERDICTS = ROOM.VERDICTS, SCREEN_MIN = 60;
/* Not deadlines — nothing is auto-rejected — but the point at which a human should ask why. They
   differ because the work differs: screening is a same-week decision, standardizing a month of real
   writing. `draft`, `rejected` and `closed` are absent on purpose; `paused` is here because a deal
   withdrawn from the feed with live talks attached is the case oversight most needs to see. */
const STUCK_DAYS = { screening: 3, qualified: 14, standardizing: 30, ready: 7, published: 60, paused: 30 };
/* A published deal whose WORKING copy falls below the gate does not delist: the investor is reading a frozen
   snapshot that genuinely met the bar, and a listing that flickers mid-conversation is worse than one that lags. */
const DRIFT_GRACE_DAYS = 30;
/* One source for the gate, re-exported so no caller has to remember which file owns it. */
const SECTIONS = KS.SECTIONS, GATE = KS.GATE, PUBLISH_MIN = KS.PUBLISH_MIN;
const SECTION_KEYS = SECTIONS.map(s => s.key);
const SECTION_META = SECTIONS.map(s => ({ key: s.key, weight: s.weight, labelKey: "kap_sec_" + s.key }));
/* A CLOSED sector enum, declared here and published by /api/kapital/meta. Everywhere else on the
   platform `sector` is 120 free-text characters, which defeats the verification layer's one
   hard-fail: "qurol" walks straight past PROHIBITED_SECTORS. The gates declare their lists as
   SUBSETS of this one, so prohibited members stay selectable — an undeclarable sector is unjudgeable. */
const SECTORS = ["", "agriculture", "food-processing", "textiles", "chemicals", "pharma", "medical-devices", "machinery",
  "automotive", "electronics", "construction-materials", "construction", "mining", "energy-generation",
  "energy-renewable", "oil-gas", "water-utilities", "transport-logistics", "aviation", "retail", "wholesale",
  "ecommerce", "hospitality", "tourism", "education", "education-licensed", "healthcare", "it-software",
  "it-services", "telecom", "media", "fintech", "banking", "insurance", "microfinance", "real-estate",
  "professional-services", "security-services", "waste-recycling", "alcohol", "tobacco-manufacture", "gambling",
  "betting", "adult", "weapons", "munitions", "narcotics", "unlicensed-lending", "deposit-taking", "pyramid", "mlm",
  "hyip", "crypto-issuance", "crypto-exchange", "wildlife-trade", "counterfeit", "labour-brokering", "other"];
/* Fail loudly at require() rather than silently empty an oversight panel the day
   somebody renames a status or re-declares the document. */
KS.assertStatusDays(STUCK_DAYS, D_STATUS);
/* ONE DECLARATION, PROVEN RATHER THAN ASSUMED. The test that stood here compared
   col.keys against KAPITAL_KEYS — and store.js's collection() returns the very
   array it was handed, so both sides were the same object and the comparison
   could never be false. The defence against "the worst failure available here"
   detected precisely nothing.
   A second H.collection("kapital.json", …) in another file is invisible from
   inside this one; it is somebody else's call. Its EFFECT is not invisible: the
   stored document would carry arrays this declaration does not name, and the next
   save() from here — which writes the WHOLE document — would erase them, silently
   and forever. So the check reads the document as it actually is and refuses to
   boot when it holds an array we do not declare. It reads db.js directly because
   store.js exposes no raw accessor and a stripped read is exactly what hides the
   foreign key; a failed read yields no evidence, which is not the same as
   evidence of nothing, so it stays silent rather than throwing on it. */
function undeclaredArrays(){
  let raw = null;
  try { raw = require("../db").get(H.file("kapital.json"), null); } catch(e){ return []; }
  if(!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  return Object.keys(raw).filter(k => Array.isArray(raw[k]) && !KAPITAL_KEYS.includes(k));
}
const strays = undeclaredArrays();
if(strays.length) throw new Error("kapital: kapital.json carries arrays this declaration would erase - "
  + strays.join(",") + " - it is declared somewhere else too");

/* ---------- the transition writer ----------
   kapital-gates.js owns TRANSITIONS and is the only writer of deal.status, and this file requires
   it DIRECTLY. It used to be handed in by an api.js call to useGates() that nothing in the tree
   ever made: GATES stayed null, move() fell through to a permissive local copy of the legal edges,
   and dealSubmit skipped the gates and the cooldown because both ran inside `if(GATES && ...)`.
   The module looked healthy throughout — deals submitted, statuses moved, the cabinet rendered —
   while consent_required, PROHIBITED_SECTORS, the ask bounds, the TIN, cap-table and sanctions
   checks, the anti-padding test, the open-deal cap and the time lock all silently did not run.
   That is the fail-open the gate-1 redesign existed to remove, so the dependency is STRUCTURAL and
   the fallback is DELETED: no path here decides anything without the gates. */
if(!GATES || ["apply", "runGates", "cooldownCheck", "materialChange", "inputHash", "screenScore"]
     .some(fn => typeof GATES[fn] !== "function"))
  throw new Error("kapital: kapital-gates.js is not connected - refusing to run without the gates");
/* Kept only so a caller still wiring the gates by hand gets an answer rather than a TypeError. It
   cannot install them — the require did — and, far more important, cannot UNINSTALL them. */
const useGates = () => true;
/** Immutable status write plus the audit entry. Returns a NEW row. */
const move = (deal, to, trigger, actor, patch) => GATES.apply(deal, to, trigger, actor, patch);

/* ---------- small helpers ---------- */
const SYSTEM = { name: "TIZIM", tier: "system" };   // kapital-gates.js maps tier onto its three actor roles; only this one is uncredentialed
const now = () => Date.now(), dayOf = t => Math.floor(H.N(t) / 864e5), deep = v => JSON.parse(JSON.stringify(v == null ? null : v));
const put = (st, next) => { st.deals = st.deals.map(d => (d.id === next.id ? next : d)); return next; };
const url = (v, n) => (/^https:\/\//i.test(H.S(v, n)) ? H.S(v, n) : "");
/* ---------- THE ONE HEADER -> ANSWERS PROJECTION ----------
   Six rubric answers are mirrors of header fields, and the header is their SINGLE
   SOURCE. projectHeader() is the only place the mirror is written, HEADER_ANSWERS
   is the list every other writer must refuse, and dealStandardize() refuses them.

   Why it is a rule and not a convenience: /deal/standardize allowed a section's
   own field keys through, and `instrument`, `askAmount`, `preMoneyValuation`,
   `region`, `currency` and `oneLiner` ARE section fields — of sections 7, 1, 6 and
   2 respectively. So a founder could POST answers.instrument:"debt" to the `ask`
   section, section 7 would take the debt branch, and preMoneyValuation,
   equityOfferedPct, valuationBasis, exitPaths and equityMathConsistent — 32 of
   that section's 100 points — would stop being applicable at all. Publication at
   100% without ever answering a third of the ask, under a header that still said
   "equity" and a gate-1 verdict issued against it. That is a direct defeat of the
   publication gate, and it closes here rather than in each of the writers. */
const HEADER_ANSWERS = ["askAmount", "preMoneyValuation", "instrument", "currency", "region", "oneLiner"];
/** Row or header shape in, the six mirrored answers out. Nowhere else builds them. */
const projectHeader = src => ({ askAmount: H.N(src && src.ask), preMoneyValuation: H.N(src && src.valuation),
  instrument: (src || {}).instrument, currency: (src || {}).currency,
  region: (src || {}).region, oneLiner: (src || {}).oneLiner });

/* ---------- the restriction clearance ----------
   A clearance is a human's record of a licence check on ONE sector, so it is
   stored WITH the sector it was granted for and honoured only for that one.
   Before this pair existed the clearance was a bare name: submit as "pharma",
   have oversight inspect the licence and clear it, then re-save the header as
   "mining" or "banking" or "aviation" — the clearance survived the change and
   covered a sector nobody had ever looked at. Both halves are needed: this one
   drops a clearance the moment the sector moves, kapital-oversight.js records
   which sector each new one names. */
const cleared = d => !!H.S(d && d.restrictedClearedBy, 120)
  && H.S(d && d.restrictedClearedFor, 120) === H.S(d && d.sector, 120);
/** The clearance fields as they should stand for THIS row's current sector — an
    identity for a clearance that still matches, a reset for one that does not.
    Applied on every path that can write `sector` or refresh `restricted`. */
const clearanceOf = d => cleared(d)
  ? { restrictedClearedBy: H.S(d.restrictedClearedBy, 120), restrictedClearedFor: H.S(d.restrictedClearedFor, 120) }
  : { restrictedClearedBy: "", restrictedClearedFor: "", restrictedClearedAt: 0 };

/** [{name, role}] — gate 1 reads this, so gate 1 can collect it. */
const cleanFounders = v => (Array.isArray(v) ? v : []).slice(0, 8)
  .map(f => ({ name: H.S(f && f.name, 160), role: H.S(f && f.role, 120) })).filter(f => f.name);
/* A person-tier deal is owned by an e-mail claim, and a claim is not evidence. The first save mints
   a 32-character secret, returns it ONCE and keeps only a hash — the same evidentiary shape as
   register.makeRef(). Without it, anyone who guesses a founder's address reads their cap table. */
const claimOk = (d, f) => d.ownerTier !== "person" || !d.claimHash
  || PW.verify({ pwHash: d.claimHash }, H.S(f && f.claim, 64));
/** The one ownership resolver. `not_found` for every failure, a wrong claim included:
    `forbidden` confirms the id exists, and the set of ids that exist but are not
    published is the list of every company in the country quietly raising money. */
function ownDeal(st, founder, id){
  const d = st.deals.find(x => x.id === H.S(id, 40));
  if(!d || !founder || String(d.ownerId) !== String(founder.id)) return { error: "not_found" };
  return claimOk(d, founder) ? { deal: d } : { error: "not_found" };
}
/** Two different sentences, so two different codes. */
const writable = d => (FOUNDER_FROZEN.includes(d.status) ? { error: "locked" }
  : d.frozen ? { error: "frozen" } : null);
/** The stored cache: the score with a LIGHT sections list, the previous one for the delta, and one
    progress point per day. The per-field roster is a function of the rubric, so it is recomputed on
    read — storing it would bloat the document and go stale the first time a weight moved. */
function cached(deal, at){
  const s = KS.scoreDeal(deal), score = { version: s.version, kind: s.kind, stage: s.stage, rawExact: s.rawExact,
    overallExact: s.overallExact, overall: s.overall, evidence: s.evidence, at: H.N(at),
    criticalOpen: s.criticalOpen, capped: s.capped, sections: s.sections.map(x => ({ key: x.key, pct: x.pct })) };
  const log = (deal.progressLog || []).slice(), d = new Date(H.N(at)).toISOString().slice(0, 10);
  if(log.length && log[log.length - 1].d === d) log[log.length - 1] = { d, overall: s.overall }; else log.push({ d, overall: s.overall });
  return { score, scorePrev: deal.score || null, progressLog: log.slice(-60) };
}

/* ---------- gate 1's arithmetic, and the four projections ----------
   Both used to be written out again here. screenScore() existed TWICE against one SCREEN_MIN
   threshold and the two disagreed on two of five factors — this copy took any founder row carrying
   a name and any ask carrying a one-liner, where kapital-gates.js wants a role beside the name and
   a use-of-funds plan beside the ask — so one deal could score 45 of 100 points apart and straddle
   the minimum in BOTH directions depending on which file the caller imported from. One
   implementation, one export, one caller path: the gates own gate 1's arithmetic, kapital-views.js
   owns the projections (see its header for why), and this file re-exports both. */
const screenScore = GATES.screenScore, founderView = V.founderView;
const feedView = V.feedView, reviewView = V.reviewView, feedFit = V.feedFit;

/* ---------- create and update the header ---------- */
/* The statuses carrying a qualification — exactly the `screenRerun` `from` set in the gates. */
const QUALIFIED_STATES = ["qualified", "standardizing", "ready", "published", "paused"];

/** The header fields, and only the header fields — each sanitised through a closed enum or a length
    cap, each falling back to what the row already held rather than to a default, so a partial POST
    cannot blank a field it never mentioned. */
function headerOf(body, prev, kind, stage, name){
  return { kind, stage, name, oneLiner: H.S(body.oneLiner, 200), summary: H.S(body.summary, 3000),
    sector: H.ONE(body.sector, SECTORS, prev ? prev.sector : ""),
    region: H.ONE(body.region, KS.REGIONS, prev ? prev.region : ""),
    instrument: H.ONE(body.instrument, KS.ROW_INSTRUMENTS, prev ? prev.instrument : "equity"),
    currency: H.ONE(body.currency, M.CURRENCIES, prev ? prev.currency : "USD"),
    ask: H.N(body.ask, prev ? prev.ask : 0), valuation: H.N(body.valuation, prev ? prev.valuation : 0),
    website: url(body.website, 300), deck: url(body.deck, 400), marketNote: H.S(body.marketNote, 600),
    founders: cleanFounders(body.founders),
    contact: { name: H.S(body.contact && body.contact.name, 160), phone: H.S(body.contact && body.contact.phone, 60),
      email: H.S(body.contact && body.contact.email, 120).toLowerCase(),
      telegram: H.S(body.contact && body.contact.telegram, 60) } };
}

/** A new row, spelled out in full — §2.6 of the spec is this object. Nothing is left undefined:
    an absent field and a false one read the same to `||` and differently to `===`. */
function blankDeal(founder, tier, claim, at){
  return { id: H.uid("kd"), ownerId: H.S(founder && founder.id, 80), ownerTier: tier,
    ownerName: H.S(founder && founder.name, 200), ownerEmail: H.S(founder && founder.email, 120).toLowerCase(),
    claimHash: claim ? PW.hash(claim) : "", answers: {}, evidence: [], score: null, scorePrev: null,
    progressLog: [], screen: { score: 0, at: 0 }, submissionCount: 0, qualify: null, status: "draft",
    publishedSnapshot: null, publishHistory: [], publishedAt: 0, driftSince: 0, frozen: false,
    adminNote: "", adminBy: "", adminAt: 0, closeReason: "", restricted: false, restrictedClearedBy: "",
    /* The sector the clearance was granted FOR, and when. A clearance with no
       sector on it is a clearance for whatever the founder types next. */
    restrictedClearedFor: "", restrictedClearedAt: 0,
    /* Where an oversight suspension must put the deal back. Declared here rather
       than sprung into existence by the patch, because an absent field and an
       empty one read the same to `||` and differently to `===`. */
    restoredTo: "",
    consent: null, origin: null, views: 0, viewers: [], watchers: 0, talkCount: 0, history: [],
    submitted: 0, created: at, updated: at };
}

/** Create or update the header. Six of its fields are also rubric answers (ask, valuation,
    instrument, currency, region, oneLiner), projected into `answers` on the way through: one place
    to type a number, one number in the score. */
function dealSave(founder, body){
  const st = load(), id = H.S(body.id, 40); let prev = null;
  if(id){
    const r = ownDeal(st, founder, id); if(r.error) return r;
    prev = r.deal;
    const w = writable(prev); if(w) return w;
  }
  const name = H.S(body.name, 200); if(!name) return { error: "name_required" };
  const kind = KS.cleanKind(body.kind != null ? body.kind : prev && prev.kind);
  const stage = KS.cleanStage(body.stage != null ? body.stage : prev && prev.stage, kind);
  const at = now(), tier = H.ONE(founder && founder.tier, ["company", "person"], "person");
  const claim = (!prev && tier === "person") ? PW.generate(32) : "";
  const head = headerOf(body, prev, kind, stage, name);
  /* THE projection, through the one function that owns it. The answers-side enums
     allow "" where the row does not. */
  const answers = KS.cleanAnswers(projectHeader(head), prev);
  const base = Object.assign({}, prev || blankDeal(founder, tier, claim, at), head, { answers, updated: at });
  /* The sector may have just moved, and a licence clearance does not travel with
     it. Evaluated against the NEW header, so the reset is part of the same write. */
  const draft = Object.assign(base, clearanceOf(base));
  let row = Object.assign(draft, cached(draft, at));
  /* THE RE-SCREEN GUARD. This function rewrites sector, instrument, region and ask on any deal the
     founder may still edit — every status outside FOUNDER_FROZEN, `published` included — while
     gateSector() runs only inside dealSubmit and dealPublish re-checks nothing but standardMet and
     `restricted`. The route stood wide open: submit as "agriculture", be qualified by a human, then
     POST sector:"weapons" (a deliberately selectable member of SECTORS, since a sector that cannot
     be declared cannot be judged) and publish to approved investors under a verdict issued against
     a different project. Changing what the project IS must invalidate the verdict on it. */
  const changed = (prev && QUALIFIED_STATES.includes(prev.status)) ? GATES.materialChange(prev, row) : [];
  if(changed.length && !H.BOOL(body.confirmRescreen)) return { error: "rescreen_required", changed };
  st.deals = prev ? st.deals.map(d => (d.id === row.id ? row : d)) : st.deals.concat([row]);
  if(changed.length){
    const rr = rescreen(st, row, founder, changed, at); if(rr.error) return rr; row = rr.deal;
  } else if(prev && prev.status === "rejected"){
    /* Any edit of a rejected deal returns it to draft: the founder has answered the objection by
       changing something, and a rejected row nobody can move is a wall rather than a decision. */
    const mv = move(row, "draft", "sectionSave", founder, {});
    if(mv.ok) row = put(st, mv.deal);
  }
  /* The same drift-and-settle tail dealStandardize runs. Skipping it here is how a PUBLISHED deal
     whose founder emptied 32 of section 7's 100 points went on serving its snapshot with no drift
     clock and no demotion, invisible to the panel that exists to catch exactly that. */
  const out = { ok: true };
  row = put(st, settleTail(st, row, founder, out));
  save(st);
  Object.assign(out, { deal: founderView(row), screen: screenScore(row), standard: KS.progress(row) });
  if(claim) out.claim = claim;                          // said once, never again
  return out;
}

/** The material-change path. A confirmation, never a silent surprise: it costs a submission the way
    a first one does, re-queues a PENDING verdict row because the stored qualification now judges a
    different deal, and pulls a live listing from investors reading a snapshot of the old facts. */
function rescreen(st, row, founder, changed, at){
  const wasPublished = row.status === "published";
  const mv = move(row, "screening", "screenRerun", founder,
    Object.assign({ publishedSnapshot: null, driftSince: 0, submitted: at,
      submissionCount: H.N(row.submissionCount) + 1, note: "material:" + changed.join(",") },
      clearanceOf(row)));
  if(mv.error) return mv;
  const next = put(st, mv.deal);
  st.verdicts = (st.verdicts || []).filter(v => !(v.dealId === next.id && v.status === "pending"))
    .concat([{ id: H.uid("kv"), dealId: next.id, status: "pending", verdict: "", by: "", byTier: "",
      note: "", ai: null, aiError: "", created: at, decided: 0 }]).slice(-4000);
  H.logEvent(st, "kapital_submitted", { dealId: next.id, sector: next.sector, stage: next.stage,
    ask: next.ask, currency: next.currency, rescreen: changed });
  if(wasPublished) H.logEvent(st, "kapital_delisted",
    { dealId: next.id, sector: next.sector, reason: "rescreen" });
  return { ok: true, deal: next };
}

/** The drift clock and the settle promotion/demotion — the tail of every save that can move the
    score, shared so it cannot be written on one route and forgotten on the other. Returns the NEXT
    row and annotates `out`. */
function settleTail(st, deal, actor, out){
  const met = KS.standardMet(deal), at = H.N(deal.updated) || now();
  if(out) out.gate = { min: PUBLISH_MIN, open: met.ok };
  if(deal.status === "published"){
    /* Drift, not delisting: the snapshot an investor is reading met the bar, and the working copy
       is the founder's business until the grace period runs out. */
    const next = Object.assign({}, deal, { driftSince: met.ok ? 0 : (H.N(deal.driftSince) || at) });
    if(!met.ok && out) Object.assign(out, { drift: true,
      workingOverall: H.N((next.score || {}).overallExact),
      publishedOverall: H.N((deal.publishedSnapshot || {}).overallExact) });
    return next;
  }
  if(!["qualified", "standardizing", "ready", "paused"].includes(deal.status)) return deal;
  /* Both directions: a one-way gate leaves a 62%-complete deal in `ready` because it once touched
     90. Promotion and demotion are the system's, but the FIRST save after gate 1 is the founder's
     own sectionSave. A `draft` deal has no edge at all — the rail past gate 1 is a human's to open. */
  const to = met.ok ? "ready" : "standardizing", own = deal.status === "qualified" && !met.ok;
  if(deal.status === to) return deal;
  const mv = move(deal, to, own ? "sectionSave" : "settle", own ? actor : SYSTEM, {});
  if(!mv.ok) return deal;
  if(met.ok) H.logEvent(st, "kapital_gate_open", { dealId: deal.id });
  return mv.deal;
}

/** Copy a moliya project or startup the SAME account owns into a draft, so a founder
    does not retype what they already entered — retyping is how two records of one project
    come to disagree. Seeding COPIES; it does not link, and nothing writes back. */
function dealSeed(founder, body){
  const from = H.ONE(body.from, ["project", "startup"], ""); if(!from) return { error: "source_not_found" };
  const src = (from === "project" ? M.load().projects : M.load().startups).find(x => x.id === H.S(body.id, 40));
  if(!src) return { error: "source_not_found" };
  /* The id came from the client, so it proves nothing; ownership is the test. Without it, seeding is
     a read of ANY project into the caller's cabinet. The legacy e-mail path is deliberate — the same
     human who created a row as "u:<email>" before they had an account still owns it. */
  const em = String(founder && founder.email || "").toLowerCase();
  if(String(src.ownerId) !== String(founder && founder.id)
     && !(em && String(src.ownerId).toLowerCase() === "u:" + em)) return { error: "not_found" };
  const st = load();
  const prev = st.deals.find(d => d.origin && d.origin.id === src.id && String(d.ownerId) === String(founder.id));
  if(prev && prev.status !== "draft") return { error: "already_submitted" };
  if(prev && !H.BOOL(body.overwrite)) return { error: "already_seeded" };
  const pj = from === "project", pitch = pj ? src.summary : src.pitch;
  const r = dealSave(founder, { id: prev ? prev.id : "", kind: pj ? "project" : "startup",
    stage: pj ? "feasibility" : src.stage, name: src.name, sector: src.sector, region: src.region,
    summary: pitch, oneLiner: H.S(pitch, 200), marketNote: H.S(pitch, 600), ask: src.ask,
    currency: src.currency, valuation: pj ? 0 : src.valuation, deck: pj ? "" : src.deck,
    instrument: pj ? ((src.instruments || [])[0] || "project-equity") : src.instrument,
    founders: pj ? [] : (src.founders || []).map(n => ({ name: n, role: "" })) });
  if(r.error) return r;
  /* Only the numbers the moliya row genuinely knows. Everything else stays empty: an
     invented answer is worse than a blank one. */
  const a = pj ? { monthlyOpex: H.N(src.opex) / 12, irr: src.irr, npv: src.npv, dscr: src.dscr }
    : { revenueLast12m: H.N(src.mrr) * 12, customers: src.users, monthlyBurn: src.burn, runwayMonths: src.runway };
  const st2 = load(), row = st2.deals.find(d => d.id === r.deal.id), at = now();
  const seeded = Object.assign({}, row, { answers: KS.cleanAnswers(a, row), updated: at,
    origin: { kind: from, id: src.id, name: H.S(src.name, 200), seeded: at } });
  const next = put(st2, Object.assign(seeded, cached(seeded, at)));
  H.logEvent(st2, "kapital_status", { dealId: next.id, to: next.status, from, sector: next.sector }); save(st2);
  return { ok: true, deal: founderView(next), standard: KS.progress(next) };
}

/* ---------- gate 1 ---------- */
/** Submit for the oversight queue, or withdraw from it. Refuses below SCREEN_MIN so a human never opens an empty
    form: the founder is told exactly what is missing now, rather than waiting a week to be told it by a person.
    `ctx` is api.js's { orgs: core.getOrgs(), req } — gate 4 needs `req` to record the consent box it
    just checked, and gate 1 needs `orgs.companies` to re-check that the owning account has not been
    suspended since. BOTH are required: gate 1 now fails `identity_unverified` on a missing roster
    rather than skipping the check in silence, which is what a ctx built without `orgs` used to buy. */
function dealSubmit(founder, body, ctx){
  const st = load(), r = ownDeal(st, founder, body.id); if(r.error) return r;
  const d = r.deal; if(d.frozen) return { error: "frozen" };
  /* Without an exit, an unattended queue strands the record permanently: the founder can neither edit it nor
     pull it back, and it keeps accruing idle days against a threshold nobody is watching. */
  if(H.BOOL(body.withdraw)){
    if(d.status !== "screening") return { error: "not_in_screening" };
    const mv = move(d, "draft", "withdrawSubmission", founder, { note: H.S(body.note, 400) });
    if(mv.error) return mv; put(st, mv.deal);
    st.verdicts = (st.verdicts || []).filter(v => !(v.dealId === d.id && v.status === "pending"));
    save(st); return { ok: true, deal: founderView(mv.deal) };
  }
  if(d.status === "screening") return { error: "already_submitted" };
  if(!["draft", "rejected"].includes(d.status)) return { error: "bad_transition" };
  /* A time lock is not a form error, so it never rides inside gates_failed — the client renders that
     as "complete the form and submit again", exactly the wrong advice for a 24-hour wait. */
  const cd = GATES.cooldownCheck(d, st); if(cd && cd.error) return cd;
  /* runGates() answers with a REPORT — {ok, gates, flags, restricted, consent} — not a list, and
     `restricted` plus the consent record it produced are stamped onto the row here: gate 4 checks
     the box before it records, and nothing downstream sees the request again. Unconditional: the
     `if(GATES && GATES.runGates)` this replaced was never once true. */
  const g = GATES.runGates(d, body, st, ctx && ctx.orgs, ctx && ctx.req) || {};
  const failed = (g.gates || []).filter(x => x && !x.ok);
  if(!g.ok){
    H.logEvent(st, "kapital_gate_failed", { dealId: d.id, sector: d.sector, keys: failed.map(x => x.key) });
    save(st); return { error: "gates_failed", gates: failed, flags: g.flags || [] };
  }
  /* `restricted` is refreshed from gateSector on EVERY submission, so the clearance has to be
     re-examined in the same breath: a clearance names one sector, and this is the moment the row's
     sector is judged again. Without the clearanceOf() half, a pharma clearance granted before a
     switch to mining rode straight through this patch untouched. */
  const gated = Object.assign({ restricted: !!g.restricted, consent: g.consent || d.consent || null },
    clearanceOf(d));
  const screen = screenScore(d); if(screen.score < SCREEN_MIN) return { error: "screening_incomplete", screen };
  const at = now();
  const mv = move(d, "screening", "submit", founder, Object.assign({ screen: { score: screen.score, at },
    submitted: at, submissionCount: H.N(d.submissionCount) + 1 }, gated));
  if(mv.error) return mv; put(st, mv.deal);
  /* A PENDING verdict row, finalised by a human in dealQualify. The advisory Claude draft
     is attached to this row by /api/kapital/screen; it changes no status and opens no gate. */
  st.verdicts = (st.verdicts || []).concat([{ id: H.uid("kv"), dealId: d.id, status: "pending",
    verdict: "", by: "", byTier: "", note: "", ai: null, aiError: "", created: at, decided: 0 }]).slice(-4000);
  H.logEvent(st, "kapital_submitted", { dealId: d.id, sector: d.sector, stage: d.stage, ask: d.ask,
    currency: d.currency, screen: screen.score });
  save(st); return { ok: true, deal: founderView(mv.deal), screen };
}

/** Gate 1's human half. "Does this have a future" is a judgment about a person's livelihood, and the rule
    that AI produces no conclusions is not a style guide — this is the route where breaking it would matter
    most. Claude's opinion rides along on the row as a labelled draft and is never the verdict. */
function dealQualify(reviewer, body){
  const verdict = H.S(body.verdict, 20), note = H.S(body.note, 2000);
  if(!VERDICTS.includes(verdict)) return { error: "bad_verdict" };
  /* A refusal without a reason is not a decision, it is a wall. */
  if(verdict !== "pass" && !note) return { error: "reason_required" };
  const st = load(), d = st.deals.find(x => x.id === H.S(body.id, 40)); if(!d) return { error: "not_found" };
  if(d.status !== "screening") return { error: "not_in_screening" };
  const at = now(), to = verdict === "pass" ? "qualified" : (verdict === "revise" ? "draft" : "rejected");
  /* draft:true is forced server-side, so a stored AI opinion cannot lose its label. */
  const qualify = { verdict, by: H.S(reviewer && reviewer.name, 120), note, at,
    byTier: H.S(reviewer && reviewer.type, 20), ai: cleanAi(body.ai) };
  const mv = move(d, to, "qualify", reviewer, { qualify, note });
  if(mv.error) return mv; put(st, mv.deal);
  /* The content lock's other half. cooldownCheck() refuses a byte-identical resubmission after a
     decline by comparing inputHash(deal) with the hash on the last finalised verdict — and NO code
     path wrote that field, so a declined founder waited out DECLINE_COOLDOWN_H and re-queued the
     same text for free. It is stamped HERE, from the deal as it stood at the decision. */
  st.verdicts = (st.verdicts || []).map(v => (v.dealId === d.id && v.status === "pending")
    ? Object.assign({}, v, { status: "decided", verdict, by: qualify.by, byTier: qualify.byTier,
        note, decided: at, inputHash: GATES.inputHash(d) })
    : v);
  H.logEvent(st, "kapital_qualified", { dealId: d.id, verdict, byTier: qualify.byTier,
    sector: d.sector, stage: d.stage });
  save(st); return { ok: true, deal: reviewView(mv.deal) };
}

/** The reviewer's advisory block, SANITISED — never a deep copy of a request body.
    It used to be JSON.parse(JSON.stringify(body.ai)): no schema, no field caps, no
    array caps, no size limit, straight from a POST into the single kapital.json
    JSONB document that H.collection loads WHOLE into memory on every read of any
    deal, talk, verdict or event. One oversized paste degrades every read in the
    module, permanently. kapital-ai.js exports cleanScreen for exactly this — it
    bounds every string, caps every array and forces each of the six dimensions to
    a declared enum — and it is required lazily so a smoke test of this file does
    not pull the Anthropic SDK in behind it. If that require fails there is no
    sanitiser, so the block is DROPPED: an advisory annotation is worth nothing
    next to storing something nothing checked. */
let KAI = null;
function cleanAi(ai){
  if(!ai) return null;
  if(KAI === null) try { KAI = require("./kapital-ai"); } catch(e){ KAI = false; }
  if(!KAI || typeof KAI.cleanScreen !== "function") return null;
  return Object.assign({}, KAI.cleanScreen(ai), { draft: true });
}

/* ---------- gate 2 ---------- */
/** Save ONE section of the rubric and recompute. One section per call because the founder fills the
    standard section by section, and a whole-form save makes the per-save delta meaningless. The form
    opens in `draft`, before gate 1: a founder should be able to fill the standard before asking a
    human to read it, and the old `not_qualified` refusal here is what created the gate-1 deadlock. */
function dealStandardize(founder, body){
  const st = load(), r = ownDeal(st, founder, body.id); if(r.error) return r;
  const d = r.deal, w = writable(d); if(w) return w;
  const section = H.S(body.section, 40); if(!SECTION_KEYS.includes(section)) return { error: "unknown_section" };
  /* Only this section's keys are read out of the body. A save that named `identity` and carried `askAmount`
     would let the client write the whole rubric behind a per-section UI that promised it could not.
     The allowlist alone was not enough, because six of the rubric's own field keys ARE header mirrors
     and each one is a legitimate member of some section's field list: `region` in identity, `oneLiner`
     in problem, `currency` in financials, and askAmount / instrument / preMoneyValuation in ask. So
     this route could write answers.instrument directly, flip section 7 onto its debt branch and make
     32 points of the ask section inapplicable — a 100% deal that never answered a third of what it
     was scored on. This route writes NONE of the six; it reports what it ignored so the client can
     say where they are actually edited, and the header is re-projected over the patch so the answers
     agree with the row even if the two ever drifted in storage. */
  const own = new Set(SECTIONS.find(s => s.key === section).fields.map(f => f.key));
  const patch = {}, ignored = [], inbound = (body.answers && typeof body.answers === "object") ? body.answers : {};
  for(const k of Object.keys(inbound)){
    if(HEADER_ANSWERS.includes(k)){ if(!ignored.includes(k)) ignored.push(k); continue; }
    if(own.has(k)) patch[k] = inbound[k];
  }
  const answers = KS.cleanAnswers(Object.assign(patch, projectHeader(d)), d);
  /* Falsifying an attestation is a retraction, not an edit — it pulls the live listing
     before the score is even recomputed. The irreversible act is at least as guarded as
     the reversible one, so it takes a second confirmation and changes NOTHING without one. */
  const trigger = KS.withdrawTriggered(d.publishedSnapshot, answers);
  if(trigger && !H.BOOL(body.confirmWithdraw)) return { withdrawPending: trigger }; const at = now();
  const ev = (d.evidence || []).concat((Array.isArray(body.evidence) ? body.evidence : []).slice(0, 40)
    .map(e => ({ id: H.uid("ke"), section: H.ONE(e && e.section, SECTION_KEYS, section),
      label: H.S(e && e.label, 200), url: url(e && e.url, 400), t: at }))
    .filter(e => e.label && e.url)).slice(-40);
  let next = Object.assign({}, d, { answers, evidence: ev, updated: at });
  next = Object.assign(next, cached(next, at));
  const out = { ok: true };
  if(trigger){
    next = Object.assign({}, next, { publishedSnapshot: null, driftSince: 0 });
    const mv = move(next, "paused", "withdrawTrigger", SYSTEM, { note: trigger });
    if(mv.ok) next = mv.deal;
    H.logEvent(st, "kapital_withdrawn", { dealId: d.id, field: trigger, sector: d.sector });
    out.withdrawn = trigger;
    out.gate = { min: PUBLISH_MIN, open: KS.standardMet(next).ok };
  } else next = settleTail(st, next, founder, out);
  put(st, next); save(st);
  out.standard = KS.progress(next);
  out.deal = founderView(next);
  /* Named, never silent: a field the client thinks it saved and the server threw
     away is how a founder comes to trust a number that was never written. */
  if(ignored.length) out.headerIgnored = ignored;
  return out;
}

/* ---------- publication ---------- */
/** Put the deal in front of investors, or take it back out. It never publishes by itself: disclosing
    a cap table and a data room is an act of consent under Modda 21 ZRU-547, not a side effect of
    typing. `consentRec` is L.consentRecord(req, true), built by api.js — this module never sees a
    request object — and the gate rule holds here too: CHECK first, then record. */
function dealPublish(founder, body, consentRec){
  const st = load(), r = ownDeal(st, founder, body.id); if(r.error) return r;
  const d = r.deal, at = now(); if(d.frozen) return { error: "frozen" };
  if(!H.BOOL(body.on)){
    if(d.status !== "published") return { error: "bad_transition" };
    const mv = move(d, "paused", "unpublish", founder, { publishedSnapshot: null, driftSince: 0 });
    if(mv.error) return mv; put(st, mv.deal);
    /* publishedAt is NOT reset: it is the publication date, not a visibility flag, and the
       intel layer counts deals that have EVER published. */
    H.logEvent(st, "kapital_delisted", { dealId: d.id, sector: d.sector, reason: "founder" });
    save(st); return { ok: true, deal: founderView(mv.deal) };
  }
  /* Money is the line. A platform that let an unverified e-mail address raise capital from
     approved investors would be indefensible, and every downstream protection rests on the
     founder side of a talk being a checkable id. */
  if(d.ownerTier !== "company") return { error: "account_required" };
  if(!["qualified", "standardizing", "ready", "paused"].includes(d.status)) return { error: "bad_transition" };
  /* cleared() and not the bare name: a clearance granted for another sector is no
     clearance at all here. See clearanceOf() above for the whole of the trap. */
  if(d.restricted && !cleared(d)) return { error: "forbidden", restricted: true };
  if(!H.BOOL(body.consent)) return { error: "consent_required" };
  /* Recomputed, always, and THREE conditions rather than one: at or above the gate, no gate-critical
     field open, and no field in an `invalid` state — otherwise a deal whose cap table sums to 103%
     reaches 91 on everything else and publishes. The stored score is never asked. */
  const met = KS.standardMet(d); if(!met.ok) return { error: "below_gate", standard: KS.progress(d) };
  const snap = versioned(d, at);
  const mv = move(d, "published", "publish", founder, { publishedSnapshot: snap, driftSince: 0,
    publishHistory: (d.publishHistory || []).concat([{ v: snap.v, at, overallExact: snap.overallExact }]).slice(-20),
    publishedAt: H.N(d.publishedAt) || at, consent: consentRec ? deep(consentRec) : (d.consent || null) });
  if(mv.error) return mv; put(st, mv.deal);
  H.logEvent(st, "kapital_published", { dealId: d.id, sector: d.sector, ask: d.ask, currency: d.currency,
    overall: snap.overall, v: snap.v, days: Math.round((mv.deal.publishedAt - H.N(d.submitted)) / 864e5) });
  save(st); return { ok: true, deal: founderView(mv.deal) };
}

/** The frozen copy, numbered from publishHistory rather than from the live snapshot:
    unpublishing CLEARS publishedSnapshot, so KS.snapshot() would hand a re-listed deal a
    second v1 and the ledger would end up carrying two of them. */
function versioned(deal, at){ const snap = KS.snapshot(deal, at);
  const seen = (deal.publishHistory || []).reduce((m, x) => Math.max(m, H.N(x.v)), 0);
  return H.N(snap.v) > seen ? snap : Object.assign({}, snap, { v: seen + 1 }); }
/* A working copy below the gate does not delist, but nor does it sit there forever: after
   DRIFT_GRACE_DAYS the snapshot an investor is still reading is a promise nobody is keeping. Swept
   on the two reads that would otherwise serve it rather than on a timer — this module owns no
   scheduler, and a sweep that runs when somebody looks cannot fall behind a missed cron. */
function driftSweep(st){
  const at = now(), cut = DRIFT_GRACE_DAYS * 864e5;
  const dead = st.deals.filter(d => d.status === "published" && H.N(d.driftSince) && at - d.driftSince >= cut);
  for(const d of dead){
    const mv = move(d, "paused", "drift", SYSTEM, { publishedSnapshot: null, driftSince: 0, note: "drift_timeout" });
    if(mv.ok){ put(st, mv.deal); H.logEvent(st, "kapital_delisted", { dealId: d.id, sector: d.sector, reason: "drift_timeout" }); }
  }
  return dead.length;
}
/** Terminal, with a stated reason. `funded` is not a status — it is this. */
function dealClose(founder, body){
  const st = load(), r = ownDeal(st, founder, body.id); if(r.error) return r;
  const d = r.deal, reason = H.ONE(body.closeReason, CLOSE_REASONS, "");
  if(TERMINAL.includes(d.status)) return { error: "bad_transition" };
  if(!reason) return { error: "reason_required" };
  const mv = move(d, "closed", "close", founder,
    { closeReason: reason, publishedSnapshot: null, note: H.S(body.note, 400) });
  if(mv.error) return mv; put(st, mv.deal);
  H.logEvent(st, "kapital_status", { dealId: d.id, to: "closed", closeReason: reason, sector: d.sector });
  save(st); return { ok: true, deal: founderView(mv.deal) };
}

/** A company adopts a deal it drafted before it had an account. The proof is e-mail equality against
    the company record — that address was verified by the approval that minted the account, so it is
    evidence rather than a claim. `already_owned` and `email_mismatch` both collapse to `not_found`:
    either would confirm the id exists. The distinction is logged, not returned. */
function dealClaim(company, body){
  const st = load(), id = H.S(body.id, 40), d = st.deals.find(x => x.id === id);
  const email = H.S(company && company.email, 120).toLowerCase();
  const why = !d ? "missing" : d.ownerTier === "company" ? "already_owned"
    : (!email || d.ownerEmail !== email) ? "email_mismatch" : "";
  if(why){
    if(d){
      H.logEvent(st, "kapital_claim_failed", { dealId: id, reason: why, by: H.S(company && company.id, 40) }); save(st);
    }
    return { error: "not_found" };
  }
  const next = put(st, Object.assign({}, d, { ownerId: H.S(company.id, 80), ownerTier: "company",
    ownerName: H.S(company.name, 200), ownerEmail: email, claimHash: "", updated: now() }));
  H.logEvent(st, "kapital_owner_rekeyed", { dealId: id, to: next.ownerId });
  save(st); return { ok: true, deal: founderView(next) };
}

/* ---------- reading ---------- */
/** My deals only, resolved id, newest first. */
function dealList(founder, filter){
  const status = H.S(filter && filter.status, 20);
  const items = load().deals
    .filter(d => String(d.ownerId) === String(founder && founder.id) && claimOk(d, founder))
    .filter(d => !status || d.status === status)
    .sort((a, b) => H.N(b.updated) - H.N(a.updated)).map(founderView);
  return { ok: true, items, gate: { screenMin: SCREEN_MIN, publishMin: PUBLISH_MIN } };
}

/** Published only, scored against THIS investor's thesis, sorted by fit. The status string is the filter, never
    `publishedAt` — that stays set through `paused`, and a paused deal is a founder who asked to be left alone. */
function dealFeed(investorRow, filter){
  const f = filter || {}, iv = (investorRow && investorRow.raw) || investorRow || {};
  const watch = new Set(Array.isArray(iv.watchlist) ? iv.watchlist : []), q = H.S(f.q, 200).toLowerCase();
  const limit = Math.max(1, Math.min(60, H.N(f.limit, 30))), skip = Math.max(0, H.N(f.cursor, 0));
  const st = load(); if(driftSweep(st)) save(st);
  let rows = st.deals.filter(d => INVESTOR_VISIBLE.includes(d.status) && d.publishedSnapshot);
  if(H.BOOL(f.watched)) rows = rows.filter(d => watch.has(d.id));
  for(const k of ["sector", "stage", "instrument", "region"])
    if(f[k]) rows = rows.filter(d => d[k] === H.S(f[k], 60));
  if(H.N(f.minAsk)) rows = rows.filter(d => H.N(d.ask) >= H.N(f.minAsk));
  if(H.N(f.maxAsk)) rows = rows.filter(d => H.N(d.ask) <= H.N(f.maxAsk));
  if(q) rows = rows.filter(d => [d.name, d.oneLiner, d.summary, d.sector].join(" ").toLowerCase().includes(q));
  if(H.N(iv.minScore)) rows = rows.filter(d => H.N(d.publishedSnapshot.overall) >= H.N(iv.minScore));
  const items = rows.map(d => Object.assign(feedView(d, d.publishedSnapshot),
      { fit: feedFit(iv, d), watched: watch.has(d.id) }))
    .sort((a, b) => b.fit.score - a.fit.score || H.N(b.publishedAt) - H.N(a.publishedAt));
  const page = items.slice(skip, skip + limit);
  return { ok: true, items: page, total: items.length,
    nextCursor: skip + page.length < items.length ? skip + page.length : null };
}

/** One deal, for whoever is reading. The most leak-prone function in the module: the reader's rights
    come from `reader.type`, which api.js sets from RESOLVED credentials, and an investor asking
    about an unpublished deal gets `not_found` — `forbidden` would confirm the id exists. */
function dealOpen(reader, id){
  const st = load(), d = st.deals.find(x => x.id === H.S(id, 40)), type = H.S(reader && reader.type, 20);
  if(["admin", "rais"].includes(type)){
    if(!d) return { error: "not_found" };
    return { ok: true, deal: reviewView(d), standard: KS.progress(d) };
  }
  if(type === "investor"){
    if(!d || !INVESTOR_VISIBLE.includes(d.status) || !d.publishedSnapshot) return { error: "not_found" };
    /* A counter a founder is shown has to mean something, so the same investor reading the
       same deal twice in a day counts once. */
    const day = dayOf(now());
    if(!(d.viewers || []).some(v => v.id === reader.id && v.day === day)){
      put(st, Object.assign({}, d, { views: H.N(d.views) + 1,
        viewers: (d.viewers || []).concat([{ id: H.S(reader.id, 40), day }]).slice(-500) }));
      save(st);
    }
    const row = st.deals.find(x => x.id === d.id);
    return { ok: true, deal: feedView(row, row.publishedSnapshot), match: feedFit(reader, row), locked: false };
  }
  const r = ownDeal(st, reader, id);
  return r.error ? r : { ok: true, deal: founderView(r.deal), standard: KS.progress(r.deal) };
}

/* ---------- counters that cross the store boundary ----------
   Ids and integers only, which is what preserves the boundary. */
/** Cheap existence + visibility test, no side effects. investor.watchToggle's fifth argument is uncallable
    without it, and defaulting that argument to true turns the watchlist into an oracle over the unpublished set. */
const isPublished = id => { const d = load().deals.find(x => x.id === H.S(id, 40));
  return !!d && INVESTOR_VISIBLE.includes(d.status); };
/** api.js calls this straight after a successful IV.watchToggle(). The denormalised count
    has no other writer; without it every feed card shows 0 watchers forever. */
function watchCount(dealId, delta){
  const st = load(), d = st.deals.find(x => x.id === H.S(dealId, 40)); if(!d) return 0;
  const n = Math.max(0, H.N(d.watchers) + H.N(delta));
  put(st, Object.assign({}, d, { watchers: n })); save(st); return n;
}

/* ---------- ZRU-547 ---------- */
/** A subject-access answer that stopped at the account record would be incomplete in exactly the way the law
    is about. Only THIS subject's side: a counterparty's messages are their data, not this person's. */
function subjectExport(subject){
  const st = load(), id = String(subject && subject.id || "");
  const email = String(subject && subject.email || "").toLowerCase();
  const watched = new Set(Array.isArray(subject && subject.raw && subject.raw.watchlist) ? subject.raw.watchlist : []);
  return {
    deals: st.deals.filter(d => String(d.ownerId) === id || (email && d.ownerEmail === email)).map(founderView),
    talks: (st.talks || []).filter(t => String(t.founderId) === id || String(t.investorId) === id)
      .map(t => ROOM.talkView(t, String(t.founderId) === id ? "founder" : "investor")),
    watch: st.deals.filter(d => watched.has(d.id)).map(d => ({ id: d.id, name: d.name, status: d.status })),
  };
}

/* The statuses a consent withdrawal pulls out of sight. `published` is the one
   that matters and `ready` is the one that is one click from mattering; every
   member must have a withdrawTrigger row in TRANSITIONS or the count below lies. */
const WITHDRAWABLE = ["published", "ready"];

/** Suspending a login is not enough. A founder whose consent is withdrawn is locked out, but their PUBLISHED
    deal — financials, cap table, data room — stays in front of every investor, and they can no longer reach
    the publish route to pull it. The subject has withdrawn and the processing continues. */
function subjectWithdraw(subject){
  const st = load(), id = String(subject && subject.id || ""), mine = x => String(x) === id;
  const email = String(subject && subject.email || "").toLowerCase();
  let paused = 0; const blocked = [];
  /* WITHDRAWABLE and the transition table have to agree, and for a while they did
     not: this loop pauses `published` AND `ready`, while TRANSITIONS carried only
     `published -> paused` under trigger withdrawTrigger. Every `ready` deal came
     back bad_transition, the loop skipped it, and the call answered
     {ok:true, paused:n} with an n that was quietly short. A consent withdrawal
     that under-reports what it did is a compliance defect — the count is the
     receipt the subject is handed under ZRU-547 — so the gates row now names both
     statuses and anything still refused is REPORTED rather than dropped. */
  for(const d of st.deals.slice()){
    if(!(mine(d.ownerId) || (email && d.ownerEmail === email))) continue;
    if(!WITHDRAWABLE.includes(d.status)) continue;
    const mv = move(d, "paused", "withdrawTrigger", SYSTEM,
      { publishedSnapshot: null, driftSince: 0, note: "consent_withdraw" });
    if(mv.ok){ put(st, mv.deal); paused++; }
    else blocked.push({ id: d.id, status: d.status, error: mv.error || "bad_transition" });
  }
  st.talks = (st.talks || []).map(t => ((mine(t.founderId) || mine(t.investorId)) && t.status === "open")
    ? Object.assign({}, t, { status: "archived", stage: "closed", updated: now() }) : t);
  H.logEvent(st, "kapital_withdrawn", { subject: id, deals: paused, blocked: blocked.length, reason: "consent" });
  save(st); return blocked.length ? { ok: true, paused, blocked } : { ok: true, paused };
}

/* ---------- oversight ----------
   The queue, the dashboard and every privileged override live in
   srv/kapital-oversight.js and are re-exported below, so api.js keeps one import
   and this file keeps its ceiling. That file's header states the rule they all
   obey: every privileged write passes GATES.oversightOnly(actor) before it
   touches a row, including the four that change no status. */

/* ---------- cabinets in one call ----------
   Four round trips per tab switch is how a cabinet comes to feel slow. */
function founderHome(founder){
  const mine = load().deals.filter(d => String(d.ownerId) === String(founder && founder.id) && claimOk(d, founder));
  const talks = ROOM.talksFor(founder).items, unread = talks.reduce((t, x) => t + H.N(x.unread), 0);
  return { ok: true, talks, counts: { deals: mine.length, talks: talks.length, unread,
      published: mine.filter(d => d.status === "published").length },
    founder: { id: H.S(founder && founder.id, 80), name: H.S(founder && founder.name, 200),
      tier: H.ONE(founder && founder.tier, ["company", "person"], "person") },
    deals: mine.sort((a, b) => H.N(b.updated) - H.N(a.updated)).map(founderView),
    gate: { screenMin: SCREEN_MIN, publishMin: PUBLISH_MIN } };
}

function investorHome(investor){
  const iv = (investor && investor.raw) || investor || {};
  const feed = dealFeed(investor, { limit: 30 }), watch = dealFeed(investor, { limit: 60, watched: true });
  const talks = ROOM.talksFor(investor).items;
  /* Identity fields only: the full account projection is IV.view(), on the far side of the store boundary — api.js overlays it. */
  return { ok: true, feed: feed.items, watch: watch.items, talks, minScore: H.N(iv.minScore),
    investor: { id: H.S(investor && investor.id, 40), name: H.S(investor && investor.name, 200),
      login: H.S(investor && investor.login, 40) },
    counts: { feed: feed.total, watch: watch.total, talks: talks.length,
      unread: talks.reduce((t, x) => t + H.N(x.unread), 0) } };
}

/* Whether the advisory layer can run at all. Resolved lazily so this module does not pull the Anthropic SDK
   into a smoke test, and memoised because the key is read once per process. Everything above works when it
   is false — which is the entire reason the rubric is written rather than prompted. */
let AI = null;
function aiReady(){
  if(AI === null) try { AI = !!require("../claude").ready(); } catch(e){ AI = !!process.env.ANTHROPIC_API_KEY; }
  return AI;
}
module.exports = {
  KAPITAL_KEYS, col, load, save, useGates, D_STATUS, TERMINAL, INVESTOR_VISIBLE, FOUNDER_FROZEN,
  CLOSE_REASONS, VERDICTS, SECTORS, SECTIONS, SECTION_META, GATE, PUBLISH_MIN, SCREEN_MIN,
  STUCK_DAYS, DRIFT_GRACE_DAYS, driftSweep, dealSave, dealSeed, dealSubmit, dealQualify, dealStandardize,
  dealPublish, dealClose, dealClaim, dealList, dealFeed, dealOpen, founderView, feedView,
  reviewView, feedFit, screenScore, watchCount, isPublished, dealIsPublished: isPublished,
  subjectExport, subjectWithdraw,
  /* Read by kapital-oversight.js through its lazy KP(), and by api.js for the
     republish path. versioned() numbers a snapshot from publishHistory rather
     than from the live one, so a re-listed deal never gets a second v1. */
  versioned, put, projectHeader, HEADER_ANSWERS, cleared,
  /* the oversight surface, re-exported so api.js has one import */
  oversightQueue: OV.oversightQueue, oversightDashboard: OV.oversightDashboard,
  oversightDecide: OV.oversightDecide, oversight: OV.oversightDashboard,
  OV_ACTIONS: OV.OV_ACTIONS, OV_FLAGS: OV.OV_FLAGS, OV_INVESTOR: OV.OV_INVESTOR,
  founderHome, investorHome, aiReady,
  /* the deal room, re-exported so api.js has one import */
  TALK_STAGES: ROOM.TALK_STAGES, T_STATUS: ROOM.T_STATUS, partyToTalk: ROOM.partyToTalk,
  talkOpen: ROOM.talkOpen, talkRespond: ROOM.talkRespond, talkPost: ROOM.talkPost,
  talkStage: ROOM.talkStage, talkClose: ROOM.talkClose, talksFor: ROOM.talksFor,
  talkRead: ROOM.talkRead, talkView: ROOM.talkView, oversightTalk: ROOM.oversightTalk,
};
