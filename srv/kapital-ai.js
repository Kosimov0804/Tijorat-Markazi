/* ============================================================
   KAPITAL — the AI layer over the two-step verification

   Two calls, and one rule that shapes both: the model never produces a number.
   Step 1 judges qualification on six ordinal dimensions — ordinal precisely so
   nobody can average them into a rival percentage next to the rubric's. Step 2
   coaches per section and is handed the rubric's own score to echo back, which
   the code then verifies, so a model drifting toward "this section looks done"
   fails closed instead of quietly contradicting the gate investors are promised.

   The reviewer also never drafts the founder's text. The rubric scores substance,
   so a model that writes the section is a model inflating the very number it was
   told not to touch. That is why rewriteHint is cut to 240 characters here and
   not merely discouraged in the prompt.

   Both calls are ADVISORY. Neither changes a status, opens a gate or writes a
   row: screen() and review() take a deal and return a payload, and every write —
   verdict row, quota, event — happens in the caller. A human rules on gate 1.

   Guardrails, JSON contract and the review notice all come from copilot.js —
   there is one AI output contract on this platform and this is not a second one.

   TWO RULES FOR THE CALLER, both learned the hard way and neither enforceable
   from inside this file:

   1  NEVER HOLD A LOADED STORE ACROSS AN AWAIT. store.js load() hands back the
      live cached arrays and every writer replaces them wholesale, so an `st`
      held across a 30–60 s model call overwrites kapital.json with a minute-old
      snapshot and silently destroys every save that landed in between. Check
      quota on a freshly loaded st and discard it; await holding nothing; then
      load() again immediately before mutating and re-read the row by id.

   2  QUOTA TRACKS MONEY SPENT, NOT ANSWERS RECEIVED. `ai_off` and `transport`
      never reached Anthropic and cost nothing; `refused`, `empty` and `bad_json`
      were billed and are charged. That distinction is only computable because
      claude.js send() returns a discriminated failure, so `error` is passed
      through this file verbatim rather than collapsed to a single word.
   ============================================================ */
const AI = require("../claude");
const CP = require("./copilot");          // structured, lang (+ JSON_RULES / parseJson, used by structured)
const KS = require("./kapital-standard"); // SECTIONS and sectionText — the rubric owns the narrative
const H  = require("./store");

/* copilot.js is widened by the lead in the same step that wires the routes, and
   this module is written first. Requiring it must therefore never throw at boot:
   the server has to start at every step of the build. Until the four names are
   exported, both calls degrade to `ai_off` — the same answer as a missing key,
   which every caller already handles — rather than crashing the process. */
const WIRED = typeof CP.structured === "function" && typeof CP.lang === "function";
/* Not a second language table: copilot.js owns LANG_NAME. This keeps the
   exported prompt builders callable (a test asserts on them) while unwired. */
const lang = l => (typeof CP.lang === "function" ? CP.lang(l) : "Uzbek (Latin script)");

/* ---------- vocabulary ---------- */
const DIMENSIONS = ["problemReality", "marketExistence", "solutionCredibility",
                    "teamCapability", "unitEconomics", "regulatoryFeasibility"];
const SIGNALS  = ["strong", "adequate", "weak", "unsupported"];
const VERDICTS = ["pass", "revise", "decline"];
/* The only per-section status the schema offers. There is deliberately no
   `complete`, no `done` and no percentage: the lie is unrepresentable, not
   merely forbidden. `would_accept` is a claim about an investor, not the gate. */
const REACTIONS = ["would_challenge", "needs_evidence", "would_accept"];
const LEVELS = ["low", "medium", "high"];        // concern severity and action effort

const MAX_SECTIONS = 4;   // §3.2 — a founder acts on three things at a time, not ten
const CAP = 12;           // every model array is truncated to this before storage
const TXT = 400;          // every model string is truncated to this before storage
const GAP_CAP = 8;        // rubric gaps quoted back into the prompt, per section

/* Medium effort for a qualification: it is worth deliberating over and runs at
   most three times in a deal's life. Low for the coach: structured commentary
   over supplied text, run many times a day, where the cost of a mediocre
   sentence is a mediocre sentence. Thinking tokens count against max_tokens
   (claude.js's own header), which is why these budgets are generous. */
const SCREEN_CALL = { effort: "medium", maxTokens: 6000, where: "kapital.screen" };
const REVIEW_CALL = { effort: "low",    maxTokens: 8000, where: "kapital.review" };

/* ---------- sanitising primitives ---------- */
const str  = (v, n) => H.S(v, n || TXT);
const strs = (v, max, n) => (Array.isArray(v) ? v : []).slice(0, max || CAP)
  .map(x => str(x, n)).filter(Boolean);
const rows = (v, max, fn) => (Array.isArray(v) ? v : []).slice(0, max || CAP)
  .map(fn).filter(Boolean);

/** The rubric's overall figure, whatever the caller's progress object calls it. */
const overallOf = r => H.N(r && r.overall, H.N(r && r.score));

/* Text fields carry the founder's narrative; a list is a short one. Everything
   else in a section is a number, an enum or a table and belongs to the rubric. */
const TEXTY = ["text", "list"];
/**
 * All of a section's founder text, joined — the ONLY way this file reads
 * narrative. KS.sectionText() is the canonical accessor; while it is missing the
 * fallback joins the same section's text answers straight off the rubric's own
 * declared field table, so this is one source of truth read locally, never a
 * hand-kept second list of field keys.
 */
function sectionText(deal, key){
  if(typeof KS.sectionText === "function") return KS.sectionText(deal, key);
  const sec = (KS.SECTIONS || []).find(s => s && s.key === key);
  if(!sec) return "";
  const a = (deal && deal.answers) || {};
  return (sec.fields || []).filter(f => TEXTY.includes(f.type))
    .map(f => (Array.isArray(a[f.key]) ? a[f.key].join(", ") : H.S(a[f.key], 4000)))
    .filter(Boolean).join("\n");
}

/* ---------- STEP 1 — the qualification prompt ---------- */
const screenSystem = l => `You are the Qualification Reviewer of TIJORAT MARKAZI "Moliya bozori — Kapital".
A founder has submitted a project to be listed for investors. Judge ONE question, in ${lang(l)}:
does this submission show a business with a plausible future, or does it not yet show one?

You are not the scorer. A separate deterministic rubric owns the readiness percentage and the 90%
publishing gate. Never state, imply or estimate a percentage, a score, a grade or a rating.

Judge only what the submission contains. You have no web access, no company registry, no market
data and no knowledge of this founder. If a fact is not in the text it does not exist for you: put
it in "evidenceMissing", never in "evidenceSeen", and never close a gap by supplying the missing
fact yourself. A confident sentence built on a number nobody gave you is the one failure mode that
makes this whole review worthless.

Judge six dimensions. Each gets exactly one signal: strong | adequate | weak | unsupported.
- problemReality        Is there a described problem someone actually pays to solve?
- marketExistence       Are there named buyers, a segment, a size or a channel — or only a claim?
- solutionCredibility   Does the described solution plausibly address that problem, at this stage?
- teamCapability        Do the named people have anything to do with this problem?
- unitEconomics         Do the stated numbers hold together — price, cost, volume, burn?
- regulatoryFeasibility Does the activity need a licence, permit or regime the founder has not mentioned?
Use "unsupported" when the submission gives you nothing to judge the dimension on at all. It is
not a criticism of the business — it is a statement about the submission, and saying so plainly is
more useful than guessing.

verdict, one of three:
- "pass"     the submission shows a plausible business, worth standardising for investors.
- "revise"   the idea may well be sound, but the submission does not yet show it. Say exactly what
             is missing, in "missing", specifically enough to act on this week.
- "decline"  what is described cannot work as stated, or the problem it names is not real.
Use "decline" against the PROJECT, never against a thin write-up. A thin write-up is "revise".

Do NOT produce investment advice, a valuation, a recommendation to invest, a legal opinion, a
credit assessment or a Sharia ruling. Where a licensed expert must rule, name the item in
"expertReview" instead. Write "investorQuestions" as the questions a diligent investor would
actually ask in a first meeting — not rhetorical ones.

Schema: {"verdict":"pass|revise|decline","verdictReason":"",
"dimensions":[{"dimension":"problemReality","signal":"strong|adequate|weak|unsupported",
  "reasoning":"","evidenceSeen":[],"evidenceMissing":[]}],
"strengths":[],
"concerns":[{"concern":"","severity":"low|medium|high","dimension":""}],
"investorQuestions":[{"q":"","why":"","dimension":""}],
"expertReview":[],
"missing":[],
"assumptions":[{"field":"","assumed":"","why":""}]}
All six dimensions must appear in "dimensions", in the order listed above.`;

/* Headings are Uzbek because the founder wrote Uzbek; the instructions above are
   English because that is where the guardrails live and they must not drift in
   translation. Every field is capped explicitly — the narrative comes from
   `answers` through sectionText(), never off the deal row, which carries none. */
const screenUser = d => [
  `Loyiha: ${H.S(d.name, 200)}`,
  `Sektor: ${H.S(d.sector, 120)} · Hudud: ${H.S(d.region, 120)}`,
  `Tur: ${H.S(d.kind, 20)} · Bosqich: ${H.S(d.stage, 40)} · Instrument: ${H.S(d.instrument, 40)}`,
  `Soʻralayotgan kapital: ${H.N(d.ask)} ${H.S(d.currency, 5)}`,
  d.valuation ? `Baholash (founder aytgan): ${H.N(d.valuation)} ${H.S(d.currency, 5)}` : "",
  ``,
  `MUAMMO:\n${H.S(sectionText(d, "problem"), 4000)}`,
  `BOZOR:\n${H.S(sectionText(d, "market"), 3000)}`,
  `MAHSULOT VA TRAKSIYA:\n${H.S(sectionText(d, "product"), 3000)}`,
  `BIZNES-MODEL:\n${H.S(sectionText(d, "model"), 2500)}`,
  `JAMOA:\n${H.S(sectionText(d, "team"), 2000)}`,
  `MOLIYA:\n${H.S(sectionText(d, "financials"), 2000)}`,
  `SOʻROV:\n${H.S(sectionText(d, "ask"), 1500)}`,
  `RISKLAR:\n${H.S(sectionText(d, "risk"), 2000)}`,
].filter(Boolean).join("\n");

/* ---------- STEP 2 — the standardization prompt ---------- */
const reviewSystem = l => `You are the Standardization Reviewer of TIJORAT MARKAZI "Moliya bozori — Kapital".
A qualified project is being brought up to the platform's universal investor-readiness standard.
Answer in ${lang(l)}.

THE PERCENTAGE IS NOT YOURS. A deterministic rubric has already scored every section, and each
score is given to you below as rubricPct. Therefore:
- echo every section's rubricPct back UNCHANGED in your answer;
- never say or imply that a section is complete, sufficient, finished, strong enough or ready when
  its rubricPct is below 100 — the rubric decides that, you do not;
- never state a percentage, score or grade of your own, and never predict what the score will
  become if the founder follows your advice.

Your job is qualitative, and only qualitative. For each section you are given:
1. what a diligent investor would challenge in it,
2. what concrete action would strengthen it — an action the founder can take this week,
3. which claims in it need evidence attached before an investor believes them.

Do NOT write the section for the founder. Never return replacement text, a rewritten paragraph,
sample copy or a "here is how it should read" block. "rewriteHint" is ONE sentence of direction, at
most 240 characters — guidance, never prose. Text you write would be scored by the rubric as if the
founder had written it, and the percentage would then measure your output instead of their business.

Use only what the founder supplied. Never invent a customer, a competitor, a partner, a number or a
regulation. If a section is nearly empty, say what belongs in it — do not imagine what might.
Do NOT give investment advice, a valuation, a legal opinion or a Sharia ruling; put anything of
that kind in "expertReview".

Schema: {"sections":[{"section":"problem","rubricPct":0,
  "investorReaction":"would_challenge|needs_evidence|would_accept",
  "whatAnInvestorWouldChallenge":[""],
  "howToStrengthen":[{"action":"","effort":"low|medium|high","why":""}],
  "claimsNeedingEvidence":[{"claim":"","evidence":""}],
  "rewriteHint":""}],
"topThreeActions":[{"section":"","action":"","why":""}],
"expertReview":[],
"assumptions":[{"field":"","assumed":"","why":""}]}
"section" must be one of the section keys given below and nothing else.
Return one object per section you were asked about, and no others.`;

/** The rubric's own gaps for one section, off the flat ordered missing[] list. */
const gapsFor = (rubric, key) => ((rubric && rubric.missing) || [])
  .filter(m => m && m.section === key).slice(0, GAP_CAP)
  .map(m => H.S(m.labelUz || m.field, 120)).filter(Boolean);

/* Handing the model the rubric's own missing list is what keeps the two layers
   agreeing instead of competing: it elaborates on gaps the rubric already found
   rather than inventing a rival list next to a number it may not touch. */
const reviewUser = (deal, rubric, keys) => {
  const d = deal || {};
  const byKey = new Map(((rubric && rubric.sections) || []).map(s => [s.key, s]));
  const head = `Loyiha: ${H.S(d.name, 200)} · Sektor: ${H.S(d.sector, 120)}\n`
    + `Bosqich: ${H.S(d.stage, 40)} · Soʻrov: ${H.N(d.ask)} ${H.S(d.currency, 5)}\n`
    + `Umumiy tayyorlik (rubrika): ${overallOf(rubric)}% — bu raqam sizga maʼlumot uchun, uni oʻzgartirmang.\n`;
  return head + (keys || []).map(k => {
    const s = byKey.get(k) || {};
    return `\n--- BOʻLIM: ${k} (rubricPct: ${H.N(s.pct)}) ---\n`
      + `Rubrika topgan kamchiliklar: ${gapsFor(rubric, k).join("; ") || "—"}\n`
      + `Founder matni:\n${H.S(sectionText(d, k), 4000) || "(boʻsh)"}`;
  }).join("\n");
};

/* ---------- payload sanitising: nothing reaches a store unvalidated ---------- */
/**
 * Step-1 payload → a bounded, enum-checked object. An unbounded concerns[] would
 * otherwise go straight into a single JSONB document that is loaded whole into
 * memory on every read, with none of EVENT_CAP's discipline.
 */
function cleanScreen(ai){
  const a = ai || {};
  const byDim = new Map(rows(a.dimensions, CAP, d => (d && typeof d === "object" ? d : null))
    .map(d => [H.S(d.dimension, 40), d]));
  return {
    /* Fails closed to `revise`, exactly as clamp() does independently: a word
       outside the three is not a pass, whichever layer meets it first. */
    verdict: H.ONE(a.verdict, VERDICTS, "revise"),
    verdictReason: str(a.verdictReason, 1200),
    /* All six, in the declared order, whether the model sent them or not. An
       omitted dimension is not an absence of criticism — it is "we were told
       nothing", which is what `unsupported` means, and it must cost the same as
       saying so, or omitting one is strictly better for the deal than answering. */
    dimensions: DIMENSIONS.map(k => {
      const d = byDim.get(k) || {};
      return { dimension: k, signal: H.ONE(d.signal, SIGNALS, "unsupported"),
        reasoning: str(d.reasoning, 800),
        evidenceSeen: strs(d.evidenceSeen), evidenceMissing: strs(d.evidenceMissing) };
    }),
    strengths: strs(a.strengths),
    concerns: rows(a.concerns, CAP, c => (c && str(c.concern) ? {
      concern: str(c.concern), severity: H.ONE(c.severity, LEVELS, "medium"),
      dimension: H.ONE(c.dimension, DIMENSIONS, "") } : null)),
    investorQuestions: rows(a.investorQuestions, CAP, q => (q && str(q.q) ? {
      q: str(q.q), why: str(q.why), dimension: H.ONE(q.dimension, DIMENSIONS, "") } : null)),
    expertReview: strs(a.expertReview),
    missing: strs(a.missing),
    assumptions: rows(a.assumptions, CAP, x => (x && (str(x.field, 120) || str(x.assumed)) ? {
      field: str(x.field, 120), assumed: str(x.assumed), why: str(x.why) } : null)),
  };
}

/**
 * Step-2 payload → the same treatment, plus Rule C in code. `section` is left as
 * plain text rather than coerced into the section set: verifyEcho() is what rules
 * on it, and coercing here would make `unknown_section` unreachable. `rubricPct`
 * is kept numeric and unrounded for the same reason.
 */
function cleanReview(data){
  const d = data || {};
  return {
    sections: rows(d.sections, 10, s => (s && H.S(s.section, 60) ? {
      section: H.S(s.section, 60),
      rubricPct: H.N(s.rubricPct, -1),
      investorReaction: H.ONE(s.investorReaction, REACTIONS, "would_challenge"),
      whatAnInvestorWouldChallenge: strs(s.whatAnInvestorWouldChallenge),
      howToStrengthen: rows(s.howToStrengthen, CAP, x => (x && str(x.action) ? {
        action: str(x.action), effort: H.ONE(x.effort, LEVELS, "medium"), why: str(x.why) } : null)),
      claimsNeedingEvidence: rows(s.claimsNeedingEvidence, CAP, c => (c && str(c.claim) ? {
        claim: str(c.claim), evidence: str(c.evidence) } : null)),
      /* 240 characters is a sentence of direction. A paragraph would be prose the
         rubric then scores as if the founder had written it — the feedback loop
         that would let the model inflate the number it was told not to touch. */
      rewriteHint: H.S(s.rewriteHint, 240),
    } : null)),
    topThreeActions: rows(d.topThreeActions, 3, x => (x && str(x.action) ? {
      section: H.S(x.section, 60), action: str(x.action), why: str(x.why) } : null)),
    expertReview: strs(d.expertReview),
    assumptions: rows(d.assumptions, CAP, x => (x && (str(x.field, 120) || str(x.assumed)) ? {
      field: str(x.field, 120), assumed: str(x.assumed), why: str(x.why) } : null)),
  };
}

/* ---------- the code-side clamp ---------- */
/**
 * The model proposes; the code decides. A model that is chatty, agreeable or
 * simply wrong about its own confidence must not be able to wave a deal through
 * — so two rules override it downward and none override it upward.
 *
 * `ctx` is `{ restricted, flags }` from the gates, never from the model.
 */
function clamp(ai, ctx){
  /* GUARD FIRST, and fail CLOSED. clamp(null, ctx) is the exact state the
     ai_off and bad_json paths produce, and a model answering "approve" or
     "Pass" must not be recorded verbatim and later read as a pass. */
  if(!ai || !VERDICTS.includes(ai.verdict))
    return { verdict: "revise", source: "clamped", clampReason: "malformed_verdict" };

  /* Normalise before counting. A model that OMITS regulatoryFeasibility left
     reg.signal undefined, so rule 2 failed and omitting the dimension was
     strictly better for the deal than answering "unsupported" — backwards. A
     four-dimension response also made `unsupported >= 2` unreachable, which
     disabled rule 1 entirely. H.ONE additionally sends an invented signal word
     to "unsupported", which is the conservative reading of an unreadable answer. */
  const byDim = new Map(DIMENSIONS.map(k => [k, H.ONE(
    ((ai.dimensions || []).find(d => d && d.dimension === k) || {}).signal || "unsupported",
    SIGNALS, "unsupported")]));
  const unsupported = [...byDim.values()].filter(v => v === "unsupported").length;
  const reg = { signal: byDim.get("regulatoryFeasibility") };
  const c = ctx || {};

  // 1. Two or more dimensions the model could not judge is not a pass. It is "we cannot tell yet".
  if(ai.verdict === "pass" && unsupported >= 2)
    return { verdict: "revise", source: "clamped", clampReason: "unsupported_dimensions" };

  // 2. A restricted sector with a weak regulatory read goes back for the licence story, always.
  if(ai.verdict === "pass" && c.restricted
     && (reg.signal === "weak" || reg.signal === "unsupported"))
    return { verdict: "revise", source: "clamped", clampReason: "restricted_regulatory" };

  // 3. A decline is never softened here. Only oversight can lift one, on the record, with a
  //    reason — which is a different thing from the code quietly disagreeing.
  return { verdict: ai.verdict, source: "ai", clampReason: "" };
}

/* ---------- the echo check ---------- */
/**
 * Reject a Step-2 payload whose echoed rubricPct disagrees with the real one. A
 * model drifting on the number it was handed is a model that has started
 * reasoning about the score — exactly what it must not do.
 *
 * `keys` is the same array passed to review(). Set equality over it is what
 * catches a model that silently answers about a different section: an empty or
 * short sections[] used to pass vacuously, so a model returning nothing was
 * "verified" after the founder's quota had already been spent.
 */
function verifyEcho(data, rubric, keys){
  const want = H.LIST(keys, MAX_SECTIONS, 60);
  if(!want.length) return { ok: false, error: "section_set_mismatch", missing: [] };
  const real = new Map(((rubric && rubric.sections) || []).map(s => [s.key, H.N(s.pct)]));
  const got = new Set(), dropped = [], kept = [];
  for(const s of (data && data.sections) || []){
    const key = H.S(s && s.section, 60);
    if(!real.has(key)) return { ok: false, error: "unknown_section", section: key };
    got.add(key);
    /* Compare integers: pct is floored to one in the rubric, and failing closed
       on a rounding difference the founder can neither see nor influence is a
       broken feature rather than a safeguard. */
    if(Math.round(H.N(s.rubricPct, -1)) !== Math.round(real.get(key))) dropped.push(key);
    else kept.push(s);
  }
  if(got.size !== want.length || !want.every(k => got.has(k)))
    return { ok: false, error: "section_set_mismatch", missing: want.filter(k => !got.has(k)) };
  /* Per-section drop, not whole-payload rejection: one bad echo must not discard
     three good sections, topThreeActions and half a day's budget with it. */
  return { ok: true, data: Object.assign({}, data, { sections: kept }), dropped };
}

/* ---------- the two calls ---------- */
/** Pass the failure through verbatim — the caller's quota rule reads `error`. */
const fail = r => ({ ok: false, error: H.S(r && r.error, 200) || "empty", status: H.N(r && r.status, 0) });

/** The sections this call may ask about, checked against the rubric it was handed. */
function sectionKeys(rubric, keys){
  const real = new Set(((rubric && rubric.sections) || []).map(s => H.S(s && s.key, 60)));
  const asked = H.LIST(keys, MAX_SECTIONS, 60);      // §3.2 caps one call at four sections
  const out = asked.filter(k => real.has(k));
  if(!asked.length || out.length !== asked.length)
    return { error: "rubric_mismatch", sections: [...real] };
  return { keys: out };
}

/**
 * Step 1. Judges the submission it is handed, never the store. Returns a labelled
 * draft: `draft:true` is written here, server-side, on our own object — a model
 * cannot clear a flag it never touches.
 */
async function screen(deal, opts){
  const l = H.S((opts || {}).lang, 4) || "uz";
  if(!WIRED) return { ok: false, error: "ai_off" };
  const r = await CP.structured(screenSystem(l), screenUser(deal || {}), l, SCREEN_CALL);
  if(!r.ok) return fail(r);
  return { ok: true, draft: true, review: r.review, model: AI.MODEL, data: cleanScreen(r.data) };
}

/**
 * Step 2. `rubric` is KS.progress(deal); `keys` names up to four of its sections.
 * The echo is verified here rather than left to the caller, because the rubric
 * and the requested keys are already in hand and a payload that failed the check
 * must never become a return value anyone could store.
 */
async function review(deal, rubric, keys, opts){
  const l = H.S((opts || {}).lang, 4) || "uz";
  const want = sectionKeys(rubric, keys);
  if(want.error) return { ok: false, error: want.error, sections: want.sections };
  if(!WIRED) return { ok: false, error: "ai_off" };
  const r = await CP.structured(reviewSystem(l), reviewUser(deal || {}, rubric, want.keys), l, REVIEW_CALL);
  if(!r.ok) return fail(r);
  const echo = verifyEcho(cleanReview(r.data), rubric, want.keys);
  if(!echo.ok) return echo;
  return { ok: true, draft: true, review: r.review, model: AI.MODEL,
           data: echo.data, dropped: echo.dropped, sections: want.keys };
}

/* Ready means "this module can produce a draft": a key AND the copilot contract.
   Reporting AI.ready() alone would offer the founder a button that answers
   `ai_off` on every press for a reason that has nothing to do with the key. */
const ready = () => WIRED && AI.ready();

module.exports = {
  DIMENSIONS, SIGNALS, VERDICTS, REACTIONS, LEVELS, MAX_SECTIONS,

  /** Step 1. async (deal, opts) -> { ok, draft, review, model, data } | { ok:false, error } */
  screen,
  /** Step 2. async (deal, rubric, keys, opts) -> { ok, draft, review, model, data, dropped } | { ok:false, error } */
  review,

  /* Run before clamp() and before any write. screen()/review() already apply
     them to what they return; they are exported and idempotent so a caller
     handling a payload from anywhere else sanitises it the same way. */
  cleanScreen, cleanReview,

  /** (ai, { restricted, flags }) -> { verdict, source, clampReason }. Pure. */
  clamp,
  /** (data, rubric, keys) -> { ok:true, data, dropped } | { ok:false, error, … } */
  verifyEcho,

  /* The prompt IS the contract, so it is exported and asserted on. */
  screenSystem, screenUser, reviewSystem, reviewUser, gapsFor, sectionText,

  ready, MODEL: AI.MODEL,
};
