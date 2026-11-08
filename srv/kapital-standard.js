/* ============================================================
   MOLIYA BOZORI — Kapital · THE UNIVERSAL INVESTMENT STANDARD

   The engine, and the only public surface of the standard: every
   other module requires THIS file and never kapital-rubric.js.
   It requires ./kapital-rubric and ./store and nothing else, so
   it is a leaf — it cannot join a cycle with kapital.js, and a
   unit test of the percentage needs no database, no session and
   no network.

   THE TRADE, stated once: this module is PURE. No Date.now(), no
   Math.random(), no I/O, no Claude. `snapshot(deal, at)` takes
   the timestamp as an argument and `score.at` is stamped by the
   caller, because the moment a scoring function reads the clock
   two runs of the same answers stop being comparable and the
   number stops being a standard. That purity is also the whole
   argument for coding the rubric instead of prompting it: with
   no ANTHROPIC_API_KEY the meter, the missing list and the 90%
   gate all still work, identically, on any machine.

   Three decisions in here are load-bearing and easy to undo by
   accident:

   1  `rawExact` is the arithmetic truth and `overallExact` is a
      DISPLAY figure capped at 89.999 while a gate-critical field
      is open. delta, progressLog and gate.toGo are all computed
      from rawExact. When the cap fed the arithmetic, a founder
      who filled thirty fields saw delta 0.000 on every save and
      a toGo of 0.001 on a deal genuinely missing a sanctions
      attestation — the exact failure the meter exists to prevent,
      inverted, and aimed at the founders furthest from done.

   2  Quantisation is Math.floor(1000·x)/1000, DOWNWARD. Rounding
      turns 89.9996 into 90.000 and opens the gate on a floating
      point artefact.

   3  Nothing here trusts `deal.score`. It is a row field, so a
      POST body carrying score:{overallExact:99} would otherwise
      open the gate; and after any rubric edit every deal would
      keep publishing against weights nobody scored it under.
      standardMet() and snapshot() both recompute. deal.score is
      a CACHE for display and delta, never an input to a decision.
   ============================================================ */
const H = require("./store");
const R = require("./kapital-rubric");

const clamp01 = x => Math.max(0, Math.min(1, x));
/* DOWNWARD, three decimal places — see decision 2 in the header. */
const q3 = x => Math.floor(1000 * x) / 1000;
/* Deltas are differences of two already-quantised figures, so nearest is
   correct there; floor would bias every negative delta a thousandth low. */
const d3 = x => Math.round(1000 * x) / 1000;
const r2 = x => Math.round(100 * x) / 100;

/* A field descriptor keeps validator options under `v` and storage caps under
   `store`; a table COLUMN carries its caps flat, because a column has no
   validator of its own. One accessor so neither shape has to be remembered. */
const capOf = (f, k) => (f && f.store && f.store[k] != null ? f.store[k] : (f ? f[k] : null));
/* `documents` and `historicals` take their minimum from the deal's own kind and
   stage, so a minimum may be a function of the context rather than a constant. */
const minOf = (f, c) => (typeof f.v.min === "function" ? f.v.min(c) : f.v.min);

/* ---------- sanitising: nothing reaches the store unvalidated ----------
   The rubric is the allowlist. Unknown body keys are dropped, and every field
   key is present in the result even when it does not apply to this deal, so
   switching `instrument` from equity to debt stops COUNTING what was typed
   into the equity branch without destroying it. */
const CLEAN = {
  text:  (v, f) => H.S(v, capOf(f, "max") || 6000),
  url:   v => (/^https?:\/\//i.test(H.S(v, 400)) ? H.S(v, 400) : ""),
  /* The empty value for every numeric type is null, NOT 0. H.N collapses
     undefined, "" and [] all to 0, which made "absent" indistinguishable from
     the honest answer "zero" and floated an untouched startup to ~11%. */
  num:   v => (v === "" || v == null ? null : H.N(v)),
  pct:   v => (v === "" || v == null ? null : H.N(v)),
  money: v => (v === "" || v == null ? null : H.N(v)),
  int:   v => (v === "" || v == null ? null : Math.round(H.N(v))),
  year:  v => (v === "" || v == null ? null : Math.round(H.N(v))),
  bool:  v => H.BOOL(v),
  enum:  (v, f) => H.ONE(v, capOf(f, "set") || [""], ""),
  list:  (v, f) => H.LIST(v, capOf(f, "max") || 12, capOf(f, "itemMax") || 160),
  docs:  (v, f) => rowsOf(v, R.DOC_COLS, capOf(f, "maxRows") || 40),
  table: (v, f) => rowsOf(v, capOf(f, "cols") || [], capOf(f, "maxRows") || 24),
};

/** Table rows: bounded in count, every cell sanitised by its own column type,
    unknown columns dropped. A row object is rebuilt, never carried through. */
function rowsOf(v, cols, maxRows){
  const src = Array.isArray(v) ? v.slice(0, maxRows) : [];
  return src.map(r => {
    const row = {};
    for(const c of cols) row[c.key] = CLEAN[c.type](r && r[c.key], c);
    return row;
  });
}

/** Read `body` over `prev`, mutate neither, and return a complete answers
    object so downstream code never has to test for absence. */
function cleanAnswers(body, prev){
  const b = body || {};
  const p = (prev && prev.answers) || {};
  const out = {};
  for(const f of R.ALL_FIELDS){
    if(f.type === "check") continue;                 // computed, never stored
    const raw = b[f.key] !== undefined ? b[f.key] : p[f.key];
    out[f.key] = CLEAN[f.type](raw, f);
  }
  return out;
}
const cleanKind  = v => H.ONE(v, R.DEAL_KINDS, "startup");
const cleanStage = (v, kind) => {
  const ladder = R.KAP_STAGES[cleanKind(kind)];
  return H.ONE(v, ladder, ladder[0]);
};

/* ---------- validators ----------
   Every one returns { value: 0..1, state, detail }. `state` drives the colour
   and the sentence the founder reads; `value` is the only thing arithmetic
   ever touches. */
/* Frozen and shared: it is returned by reference dozens of times per score, and
   a consumer that mutated one `detail` would silently rewrite every other. */
const EMPTY = Object.freeze({ value: 0, state: "empty", detail: Object.freeze({}) });

/* Stepped, not continuous, and deliberately so: a `len/good` curve rewards
   padding, because every extra keystroke moves the meter and the fastest route
   to 90% becomes filler. Four rungs mean prose only pays at two thresholds,
   and a `needs` regex means the last 20% of a text field cannot be bought with
   words at all. */
function vText(f, c){
  const v = f.v, s = H.S(c.a[f.key], 100000), len = s.trim().length;
  if(!len) return EMPTY;
  if(v.max != null && len > v.max)
    return { value: 0.4, state: "invalid", detail: { len, max: v.max } };
  const min = v.min || 0, good = v.good || min;
  const ladder = len >= good ? 1 : (len >= min ? 0.7 : (len >= Math.ceil(0.4 * min) ? 0.35 : 0));
  if(!v.needs || !v.needs.length)
    return { value: ladder, state: ladder >= 1 ? "ok" : "weak", detail: { len } };
  const unmet = v.needs.filter(n => !n.re.test(s));
  const value = 0.8 * ladder + 0.2 * ((v.needs.length - unmet.length) / v.needs.length);
  return { value, state: value >= 1 ? "ok" : "weak",
           detail: { len, needs: unmet.map(n => n.why) } };
}

function vNum(f, c){
  const raw = c.a[f.key];
  const x = raw === "" || raw == null ? null : H.N(raw);
  /* Tested BEFORE any range test — an absent number is empty, not wrong. */
  if(x === null) return EMPTY;
  const v = f.v;
  if(v.gt0 && x <= 0) return { value: 0.4, state: "invalid", detail: { value: x } };
  if((v.min != null && x < v.min) || (v.max != null && x > v.max))
    return { value: 0.4, state: "invalid", detail: { value: x, min: v.min, max: v.max } };
  if(v.plaus && (x < v.plaus[0] || x > v.plaus[1]))
    return { value: 0.7, state: "weak", detail: { value: x, plaus: v.plaus } };
  return { value: 1, state: "ok", detail: { value: x } };
}

const cellFilled = (val, type) => {
  if(type === "bool") return true;                    // `false` is an answer
  if(["num", "pct", "money", "int", "year"].includes(type)) return val != null && val !== "";
  return H.S(val, 400).trim() !== "";
};

function vRows(f, c){
  const cols = f.type === "docs" ? R.DOC_COLS : (capOf(f, "cols") || []);
  const need = cols.filter(x => x.req);
  const list = Array.isArray(c.a[f.key]) ? c.a[f.key] : [];
  let complete = 0, partial = 0;
  for(const row of list){
    const got = need.filter(col => cellFilled(row ? row[col.key] : null, col.type)).length;
    if(got === need.length && need.length) complete++;
    else if(got > 0) partial++;
  }
  const min = minOf(f, c) || 1;
  const value = clamp01((complete + 0.4 * partial) / min);
  return { value, state: value >= 1 ? "ok" : (value ? "weak" : "empty"),
           detail: { complete, partial, min } };
}

function vList(f, c){
  const items = Array.isArray(c.a[f.key]) ? c.a[f.key] : [];
  const itemMin = f.v.itemMin || 1;
  const n = items.filter(x => H.S(x, 400).trim().length >= itemMin).length;
  const min = minOf(f, c) || 1;
  const value = clamp01(n / min);
  return { value, state: value >= 1 ? "ok" : (value ? "weak" : "empty"), detail: { n, min } };
}

/* Four shapes, four states. `blocked` (null) says "an input this reads is
   still empty" and names those inputs in `fixes`, so a check the founder
   cannot type into always points at a field they can. `invalid` (false) is an
   arithmetic contradiction and is the ONLY state that blocks publication — a
   band check that grades to 0.6 must never brick a normal deal. */
function vCheck(f, c){
  const detail = f.args ? f.args(c) : {};
  const r = f.test(c);
  if(r === null || r === undefined) return { value: 0, state: "blocked", detail };
  if(r === false) return { value: 0, state: "invalid", detail };
  if(r === true)  return { value: 1, state: "ok", detail };
  const n = H.N(r);
  if(n >= 1) return { value: 1, state: "ok", detail };
  if(n <= 0) return { value: 0, state: "invalid", detail };
  return { value: n, state: "weak", detail };
}

function validate(f, c){
  switch(f.type){
    case "text":  return vText(f, c);
    case "url":   return /^https?:\/\//i.test(H.S(c.a[f.key], 400))
                    ? { value: 1, state: "ok", detail: {} } : EMPTY;
    case "enum":  { const s = H.S(c.a[f.key], 60);
                    return s && (capOf(f, "set") || []).includes(s)
                      ? { value: 1, state: "ok", detail: { value: s } } : EMPTY; }
    case "bool":  return H.BOOL(c.a[f.key]) ? { value: 1, state: "ok", detail: {} } : EMPTY;
    case "list":  return vList(f, c);
    case "table":
    case "docs":  return vRows(f, c);
    case "check": return vCheck(f, c);
    default:      return vNum(f, c);
  }
}

/* ---------- roll-up ---------- */
function scoreSection(section, c){
  let num = 0, den = 0;
  const fields = [];
  for(const f of section.fields){
    if(f.when && !f.when(c)) continue;                // out of the DENOMINATOR
    const r = validate(f, c);
    num += f.w * r.value;
    den += f.w;
    fields.push({ key: f.key, weight: f.w, value: r.value, state: r.state, detail: r.detail });
  }
  /* den can only be 0 if assertRubric() was violated. Report it as broken —
     a rubric bug must read as a bug, never as a free 100% on a section nobody
     can see. */
  const ratio = den ? num / den : 0;
  return { key: section.key, weight: section.weight, ratio,
           pct: Math.floor(100 * ratio), applicable: den, earned: num, fields };
}

/* A field's `value` is how MUCH of its weight was earned; its `state` is what
   KIND of answer it is. Criticality is a question about the kind, never about
   the degree, and the twin that used to live here read `value < 1` — which
   made a plausibility band act as a contradiction. askAmount is gate-critical
   and declares its band in the deal's own currency, so a $5 000 raise that
   gate 3 admits at ASK_MIN_USD, and a 1e9 UZS raise worth about $79 000, both
   graded `weak`, both left a critical field "open" forever, and both pinned
   overallExact at 89.999 with no answer the founder could give to move it.
   A band is a judgement; only a contradiction may bar publication. */
const CRITICAL_OK = new Set(["ok", "weak"]);
/* Fails closed: a critical field missing from the sections at all — which
   invariant 4 forbids — reads as `empty` and keeps the gate shut. */
const fieldState = (sections, key) => {
  for(const s of sections) for(const f of s.fields) if(f.key === key) return f.state;
  return "empty";
};

/** A second, non-gating number: the share of applicable weight carried by
    OBJECTIVE field types that scored ≥ 0.7. A 92% built on prose and a 92%
    built on numbers are not the same pack, and the investor card shows both.
    Divided by the section denominator so evidence and overall share one basis. */
function evidenceShare(sections){
  let ok = 0, all = 0;
  for(const s of sections) for(const f of s.fields){
    const d = R.FIELDS_BY_KEY[f.key];
    if(!d || !R.OBJECTIVE.has(d.type) || !s.applicable) continue;
    const w = s.weight * f.weight / s.applicable;
    all += w;
    if(f.value >= 0.7) ok += w;
  }
  return all ? Math.round(100 * ok / all) : 0;
}

function scoreAnswers(kind, stage, answers){
  const c = { kind, stage, a: answers || {} };
  const sections = R.SECTIONS.map(s => scoreSection(s, c));
  /* Section weights sum to 100, so Σ Wₛ·ratioₛ is already the 0–100 figure.
     Kept general — a section whose weight ever left both sides would still
     renormalise correctly. */
  const W = sections.reduce((t, s) => t + (s.applicable ? s.weight : 0), 0) || 1;
  const raw = sections.reduce((t, s) => t + (s.applicable ? s.weight * s.ratio : 0), 0);
  const exact = q3(100 * raw / W);

  /* Empty, blocked and invalid cap; weak does not. A gate-critical field
     answered outside its band still costs its points in rawExact above — the
     founder is not being told it is fine, only that it is not a lie. */
  const criticalOpen = R.CRITICAL_FIELDS.filter(k => !CRITICAL_OK.has(fieldState(sections, k)));
  const capped = criticalOpen.length > 0;
  return {
    version: R.RUBRIC_VERSION, kind, stage,
    rawExact: exact,                                  // UNCAPPED — the truth
    overallExact: capped ? Math.min(exact, R.GATE.cap) : exact,   // DISPLAY only
    overall: Math.floor(capped ? Math.min(exact, R.GATE.cap) : exact),
    evidence: evidenceShare(sections),
    criticalOpen, capped, sections, at: 0,            // `at` is stamped by the caller
  };
}

const scoreDeal = deal => scoreAnswers(
  cleanKind(deal && deal.kind),
  cleanStage(deal && deal.stage, deal && deal.kind),
  (deal && deal.answers) || {});

/** The applicable field descriptors, in declaration order — what a route needs
    to reject a body carrying keys from a section it did not name. */
function sectionsOf(kind, stage, answers){
  const c = { kind, stage, a: answers || {} };
  return R.ALL_FIELDS.filter(f => !f.when || f.when(c));
}

/* ---------- the missing list ---------- */
const SEVERITY = { critical: 0, required: 1, optional: 2 };
const STATE_RANK = { invalid: 0, blocked: 1, empty: 2, weak: 3, ok: 4 };
const severityOf = f => (R.CRITICAL_FIELDS.includes(f.key) ? "critical"
                        : (f.req === false ? "optional" : "required"));

/** Built from an already-computed score so a save scores once, not twice.
    Total order per §5.2 — two saves of the same answers produce byte-identical
    lists, which is what lets the client diff them without flicker. */
function missingFrom(score){
  const out = [];
  score.sections.forEach((s, si) => {
    s.fields.forEach((fs, fi) => {
      if(fs.value >= 1) return;
      const f = R.FIELDS_BY_KEY[fs.key];
      out.push({
        section: s.key, sectionLabelKey: "kap_sec_" + s.key,
        field: f.key, labelKey: "kap_f_" + f.key, labelUz: f.label || f.key,
        hintKey: "kap_h_" + f.key, hintUz: f.hint,
        type: f.type, severity: severityOf(f), state: fs.state, value: fs.value,
        raw: s.applicable ? s.weight * f.w * (1 - fs.value) / s.applicable : 0,
        args: fs.detail || {},
        /* For a check these are its inputs: a `blocked` check names something
           the founder can actually type into. */
        fixes: f.type === "check" ? (f.inputs || []) : [f.key],
        si, fi,
      });
    });
  });
  out.sort((a, b) => (SEVERITY[a.severity] - SEVERITY[b.severity])
                  || (b.raw - a.raw)
                  || (STATE_RANK[a.state] - STATE_RANK[b.state])
                  || (a.si - b.si) || (a.fi - b.fi));
  /* `gain` is rounded for transport only and is never summed — summing the
     rounded figures is exactly how a fixture ends up 0.004 out. */
  return out.map(m => ({
    section: m.section, sectionLabelKey: m.sectionLabelKey, field: m.field,
    labelKey: m.labelKey, labelUz: m.labelUz, hintKey: m.hintKey, hintUz: m.hintUz,
    type: m.type, severity: m.severity, state: m.state, value: m.value,
    gain: r2(m.raw), args: m.args, fixes: m.fixes,
  }));
}
const fieldsMissing = deal => missingFrom(scoreDeal(deal));

/* ---------- the progress contract ---------- */
const NOTE = "Bu investitsiya tavsiyasi emas — universal investitsiya standarti "
  + "boʻyicha toʻliqlik koʻrsatkichi.";
const DISCLAIMER = "Foiz platformaning standart talablariga muvofiqlikni oʻlchaydi. "
  + "U kredit reytingi, baholash yoki investitsiya tavsiyasi emas.";

/* The same distinction as CRITICAL_OK, applied to the missing list — and the
   second half of the same defect, because `severity === "critical"` alone
   made every critical field below 1.0 a blocker no matter what state it was
   in, so fixing criticalOpen without fixing this would have moved the wall by
   one line. `invalid` is an arithmetic contradiction wherever it appears and
   always bars publication; a critical field bars it only when empty, blocked
   or invalid. Every field in `missing` scored below 1.0, so its state is one
   of empty · blocked · invalid · weak and this predicate is total. */
const isBlocker = m => m.state === "invalid"
  || (m.severity === "critical" && !CRITICAL_OK.has(m.state));

const gateOf = (score, missing) => {
  const blockers = missing.filter(isBlocker);
  const open = !score.capped && score.rawExact >= R.PUBLISH_MIN && !blockers.length;
  return {
    threshold: R.PUBLISH_MIN, open, capped: score.capped, cappedBy: score.criticalOpen,
    blockers,
    /* null, never a distance, while the display figure is capped — a capped
       0.001 to go on a deal missing a sanctions attestation is a lie. */
    toGo: score.capped ? null : Math.max(0, d3(R.PUBLISH_MIN - score.rawExact)),
  };
};

function progressSections(score, missing){
  const first = {};
  for(const m of missing) if(!first[m.section]) first[m.section] = m;
  return score.sections.map(s => {
    const d = R.SECTIONS.find(x => x.key === s.key);
    const top = first[s.key];
    return {
      key: s.key, labelKey: d.labelKey, labelUz: d.labelUz, weight: s.weight,
      pct: s.pct, ok: s.pct === 100, applicable: s.applicable,
      filled: s.fields.filter(f => f.value >= 1).length, of: s.fields.length,
      hint: top ? top.hintUz : "", hintKey: top ? top.hintKey : "",
      args: top ? top.args : {},
      /* The full roster, not just the gaps: it is what lets the client
         recompute a provisional percentage while the founder types. */
      fields: s.fields.map(f => ({ field: f.key, weight: f.weight, filled: f.value >= 1 })),
    };
  });
}

function deltaOf(score, prev, open){
  const was = prev ? (!prev.capped && H.N(prev.rawExact) >= R.PUBLISH_MIN) : false;
  if(!prev) return { since: 0, overall: 0, sections: [], gained: [], lost: [],
                     crossed: open };
  const before = {};
  for(const s of prev.sections || []) for(const f of s.fields || []) before[f.key] = f.value;
  const gained = [], lost = [];
  for(const s of score.sections) for(const f of s.fields){
    const b = before[f.key];
    if(b === undefined) continue;
    if(f.value >= 1 && b < 1) gained.push(f.key);
    if(f.value < 1 && b >= 1) lost.push(f.key);
  }
  const byKey = {};
  for(const s of prev.sections || []) byKey[s.key] = s.pct;
  return {
    since: H.N(prev.at),
    overall: d3(score.rawExact - H.N(prev.rawExact)),
    sections: score.sections.filter(s => byKey[s.key] !== undefined && byKey[s.key] !== s.pct)
                            .map(s => ({ key: s.key, from: byKey[s.key], to: s.pct })),
    gained, lost, crossed: open && !was,
  };
}

/** Returned by every save and by every founder read of their own deal. The
    baseline for the delta is `deal.scorePrev`, because the caller stamps the
    fresh score onto `deal.score` before answering — so scorePrev is always
    "the pack as it stood before this save". */
function progress(deal){
  const score = scoreDeal(deal);
  const missing = missingFrom(score);
  const gate = gateOf(score, missing);
  return {
    ok: true,
    rubric: { version: R.RUBRIC_VERSION, hash: rubricHash(),
              kind: score.kind, stage: score.stage },
    overall: score.overall, overallExact: score.overallExact,
    rawExact: score.rawExact, evidence: score.evidence,
    gate,
    sections: progressSections(score, missing),
    missing,
    delta: deltaOf(score, (deal && deal.scorePrev) || null, gate.open),
    history: ((deal && deal.progressLog) || []).slice(-60),
    note: NOTE, disclaimer: DISCLAIMER,
  };
}

/* ---------- the gate ---------- */
function standardMet(deal){
  const s = scoreDeal(deal);
  const blockers = missingFrom(s).filter(isBlocker);
  return {
    ok: s.overallExact >= R.PUBLISH_MIN && !s.capped && blockers.length === 0,
    overallExact: s.overallExact, rawExact: s.rawExact, threshold: R.PUBLISH_MIN,
    capped: s.capped, cappedBy: s.criticalOpen, blockers,
  };
}

/** The frozen copy an investor reads. A deep, plain-data copy on purpose:
    nothing an investor sees may change because a founder opened a form and
    started typing. `at` is a parameter — this module does not read the clock. */
function snapshot(deal, at){
  const s = scoreDeal(deal);
  return {
    at: H.N(at), v: (deal && deal.publishedSnapshot ? H.N(deal.publishedSnapshot.v) : 0) + 1,
    version: R.RUBRIC_VERSION, kind: s.kind, stage: s.stage,
    overall: s.overall, overallExact: s.overallExact, rawExact: s.rawExact,
    evidence: s.evidence,
    answers: JSON.parse(JSON.stringify((deal && deal.answers) || {})),
    sections: s.sections.map(x => ({ key: x.key, pct: x.pct })),
  };
}

/** Falsifying an attestation is a retraction, not an edit: it pulls the live
    listing before the score is even recomputed. Returns the trigger key so the
    lifecycle can log which statement was withdrawn. */
function withdrawTriggered(prevSnapshot, nextAnswers){
  const prev = (prevSnapshot && prevSnapshot.answers) || null;
  if(!prev) return "";
  const next = nextAnswers || {};
  for(const k of R.WITHDRAW_TRIGGERS){
    if(prev[k] === true && next[k] !== true) return k;
  }
  return "";
}

/* ---------- bridges ---------- */
/** One factor per section so a deal card renders through H.score() + MK.match()
    like every other match surface. RENDERING ONLY: H.score rounds and applies
    no critical cap, so it can differ from `overall` by a point. `overall` is
    authoritative for the gate; nothing may ever gate on this. */
const asFactors = deal => scoreDeal(deal).sections.map(s => {
  const d = R.SECTIONS.find(x => x.key === s.key);
  return { weight: s.weight, value: s.ratio, known: s.applicable > 0,
           why: d.why, gap: d.gap };
});

/** What kapital-ai.js may show Claude about one section. Values and states
    only — the advisory layer critiques, it never sets a number. */
function aiContext(deal, sectionKey){
  const s = scoreDeal(deal).sections.find(x => x.key === sectionKey);
  if(!s) return null;
  return { section: s.key, pct: s.pct, applicable: s.applicable,
    fields: s.fields.map(f => {
      const d = R.FIELDS_BY_KEY[f.key];
      return { key: f.key, type: d.type, weight: f.weight, state: f.state,
               value: f.value, hint: d.hint };
    }) };
}

/** FNV-1a over the shape of every field in declaration order. A weight edit
    without a RUBRIC_VERSION bump changes this, and a test pins it. Memoised:
    the rubric cannot change at runtime, and progress() would otherwise rebuild
    125 signature strings on every save. */
let HASH = "";
function rubricHash(){
  if(HASH) return HASH;
  let h = 0x811c9dc5;
  for(const s of R.SECTIONS){
    for(const f of s.fields){
      const v = f.v || {};
      const sig = [s.key, s.weight, f.key, f.type, f.w, f.req, f.when ? 1 : 0,
        v.min == null ? "" : (typeof v.min === "function" ? "fn" : v.min),
        v.good == null ? "" : v.good, v.max == null ? "" : v.max,
        v.gt0 ? 1 : 0, v.plaus ? v.plaus.join("-") : "",
        (v.needs || []).length, (f.inputs || []).join("+")].join("|");
      for(let i = 0; i < sig.length; i++){
        h ^= sig.charCodeAt(i);
        h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
      }
    }
  }
  HASH = h.toString(16);
  return HASH;
}

/* ============================================================
   assertRubric() — the invariants, checked once at module load.

   A rubric that cannot reach 100% is a silent, catastrophic bug:
   the founder fills in everything and the gate never opens. So
   this fails loudly at boot, the same posture register.js takes
   with its migration, rather than quietly at the gate months
   later.
   ============================================================ */
const fail = m => { throw new Error("kapital-rubric: " + m); };

/* The cross-product iterates ROW_INSTRUMENTS, not INSTRUMENTS: "" exists on
   the ANSWERS copy only, and /api/kapital/deal refuses `instrument_required`,
   so a stored deal never carries it. Were "" reachable on a row, S7 would run
   a 68 denominator and this assertion would be the thing that told you. */
function combos(fn){
  for(const kind of R.DEAL_KINDS)
    for(const stage of R.KAP_STAGES[kind])
      for(const instrument of R.ROW_INSTRUMENTS)
        for(const productStage of R.PRODUCT_STAGES)
          for(const revenue of [0, 500000])
            for(const regulated of R.YESNO)
              for(const litigation of R.LITIGATION)
                fn({ kind, stage, a: { instrument, productStage,
                     revenueLast12m: revenue, regulated, litigation } });
}

function assertWeights(){
  if(R.SECTIONS.reduce((t, s) => t + s.weight, 0) !== 100) fail("section weights ≠ 100");
  const keys = new Set();
  for(const f of R.ALL_FIELDS){
    if(keys.has(f.key)) fail("duplicate field key " + f.key);
    keys.add(f.key);
    if(!f.hint) fail("field " + f.key + " has no uz hint");
    if(f.type === "check"){
      if(!Array.isArray(f.inputs) || !f.inputs.length) fail("check " + f.key + " declares no inputs");
      for(const k of f.inputs) if(!R.FIELDS_BY_KEY[k]) fail("check " + f.key + " reads unknown " + k);
    }
  }
  combos(c => {
    for(const s of R.SECTIONS){
      const on = s.fields.filter(f => !f.when || f.when(c));
      const sum = on.reduce((t, f) => t + f.w, 0);
      if(sum !== 100) fail(s.key + " sums to " + sum + " at " + c.kind + "/" + c.stage
        + "/" + c.a.instrument + "/" + c.a.productStage + "/rev" + c.a.revenueLast12m
        + "/reg" + c.a.regulated);
      if(!on.some(f => f.req !== false)) fail(s.key + " has no required field applying");
    }
  });
}

function assertCritical(){
  for(const k of R.CRITICAL_FIELDS){
    const f = R.FIELDS_BY_KEY[k];
    if(!f) fail("critical field " + k + " does not exist");
    /* Applicable in EVERY combination — an unconditional field cannot be
       branched away, which is the cheapest possible proof of it. */
    if(f.when) fail("critical field " + k + " is conditional");
  }
  for(const k of R.WITHDRAW_TRIGGERS){
    const f = R.FIELDS_BY_KEY[k];
    if(!f || f.type !== "bool") fail("withdraw trigger " + k + " is not a bool field");
    if(!R.CRITICAL_FIELDS.includes(k)) fail("withdraw trigger " + k + " is not gate-critical");
  }
}

/* ---------- reachability ----------
   The invariant that actually protects the founder; the weight sums above are
   only its precondition. Every applicable field is answered at value 1 and the
   deal must score exactly 100.000 with the gate open — including the thirteen
   cross-field checks, which is why these values are coherent with each other
   rather than a wall of 1s. */
const DOC_URL = k => "https://hujjat.uz/d/" + k;
const TXT = (f) => {
  const good = f.v.good || f.v.min || 4;
  const len = f.v.max ? Math.min(good, f.v.max) : good;
  return ("1% " + "aa".repeat(len)).slice(0, Math.max(len, 4));
};
const ROW = (cols, i) => {
  const row = {};
  for(const col of cols){
    if(col.type === "enum") row[col.key] = col.set[Math.min(i, col.set.length - 1)] || col.set[0];
    else if(["num", "pct", "money", "int"].includes(col.type)) row[col.key] = 10 + i;
    else if(col.type === "year") row[col.key] = 2020 + i;
    else if(col.type === "bool") row[col.key] = true;
    else if(col.type === "url") row[col.key] = "https://hujjat.uz/r" + i;
    else row[col.key] = "qiymat-" + i;
  }
  return row;
};
const FIN = n => Array.from({ length: n }, (_, i) => ({
  year: 2020 + i, revenue: 1000, cogs: 300, opex: 200, ebitda: 500, netProfit: 400 }));

function coupled(kind, stage, instrument, pre){
  const rows = [0, 1, 2, 3, 4].map(i => ROW(R.RISK_COLS, i));
  rows.forEach((r, i) => { r.category = R.RISK_CATEGORIES[i % R.RISK_CATEGORIES.length]; });
  const team = [ROW(R.TEAM_COLS, 0), ROW(R.TEAM_COLS, 1)];
  team[0].founder = true; team[0].fullTime = true;
  const hist = FIN(3), proj = FIN(3).map((r, i) => Object.assign({}, r, { year: 2023 + i }));
  return {
    tin: "123456789", registeredYear: 2015,
    capTable: [{ holder: "Asoschi", sharePct: 100, role: "CEO", note: "" }],
    tam: 1e9, sam: 1e8, som: 4e7,
    productStage: pre ? "mvp" : "live", revenueLast12m: pre ? 0 : 500000,
    grossMarginPct: 70, arpu: 1200, cac: 300, ltv: 1500,
    targetArpu: 1200, targetCac: 400,
    historicals: hist, projections: proj,
    cashOnHand: 120000, monthlyBurn: 10000, runwayMonths: 12,
    dscr: 1.5, instrument, askAmount: 1000000,
    useOfFunds: [{ bucket: "A", amount: 400000, outcome: "x" },
                 { bucket: "B", amount: 400000, outcome: "y" },
                 { bucket: "C", amount: 200000, outcome: "z" }],
    preMoneyValuation: 9000000, equityOfferedPct: 10,
    team, risks: rows,
    documents: R.requiredDocs({ kind, stage })
      .map(k => ({ kind: k, label: k, url: DOC_URL(k) })),
  };
}

/** Every applicable field answered at value 1, with the cross-field numbers
    coherent so all thirteen checks read `ok`. assertReachable() below is its
    only production caller; it is exported because §10's reachability test is
    the one test an implementer must not have to re-derive by hand. */
function perfectFixture(kind, stage, instrument, pre, regulated){
  const c = { kind, stage, a: Object.assign({ regulated, litigation: "none" },
                                            coupled(kind, stage, instrument, pre)) };
  for(const f of R.ALL_FIELDS){
    if(f.type === "check" || c.a[f.key] !== undefined) continue;
    if(!f.when || f.when(c)) c.a[f.key] = ideal(f, c);
  }
  return c.a;
}

function ideal(f, c){
  switch(f.type){
    case "text": return TXT(f);
    case "url":  return "https://hujjat.uz/" + f.key;
    case "bool": return true;
    case "enum": { const set = capOf(f, "set") || [""]; return set[1] || set[0]; }
    case "list": return Array.from({ length: minOf(f, c) || 1 },
                                   (_, i) => "javob-" + i + "-toʻliq");
    case "docs": return Array.from({ length: minOf(f, c) || 1 },
                   (_, i) => ({ kind: R.DOC_KINDS[i], label: "L" + i, url: DOC_URL(f.key + i) }));
    case "table": return Array.from({ length: minOf(f, c) || 1 },
                                    (_, i) => ROW(capOf(f, "cols") || [], i));
    case "pct":  return f.v.plaus ? f.v.plaus[0] + 1 : 50;
    case "year": return 2022;
    default:     return f.v.plaus ? f.v.plaus[0] + 1 : 42;
  }
}

/* Reachability runs over the axes that can change a denominator or a check:
   kind, stage, instrument, pre/post revenue and `regulated`. `productStage`
   enters only through preRevenue() and stageConsistent(), and `litigation` no
   longer gates anything now that litigationDetail is unconditional, so both
   are pinned to a coherent value rather than multiplied out — the weight
   assertion above already walks the full product. */
function assertReachable(){
  for(const kind of R.DEAL_KINDS)
    for(const stage of R.KAP_STAGES[kind])
      for(const instrument of R.ROW_INSTRUMENTS)
        for(const pre of [true, false])
          for(const regulated of ["yes", "no"]){
            const a = perfectFixture(kind, stage, instrument, pre, regulated);
            const s = scoreAnswers(kind, stage, a);
            const met = standardMet({ kind, stage, answers: a });
            if(s.rawExact !== 100) fail("unreachable 100 at " + kind + "/" + stage + "/"
              + instrument + "/pre" + pre + "/reg" + regulated + " → " + s.rawExact
              + " · " + missingFrom(s).slice(0, 4).map(m => m.field + ":" + m.state).join(", "));
            if(!met.ok) fail("gate shut on a perfect " + kind + "/" + stage);
          }
}

/* ---------- the two edges reachability does not reach ----------
   perfectFixture() answers every field in the MIDDLE of its band, so it walks
   every branch and still cannot catch a rule that punishes an honest answer
   at the edge of one. These two are the answers that used to be punished
   forever, and they are asserted rather than described so nobody reintroduces
   the bound by tidying it back up. */
function assertEdges(){
  const kind = "startup", stage = "seed";
  /* A $5 000 raise — the smallest gate 3 admits, at ASK_MIN_USD — offered at
     a 100% gross margin, which is the truthful figure for a licence or
     royalty business. askAmount's band called the first implausible and, as a
     gate-critical field, shut publication permanently; grossMarginPct's hard
     max of 95 called the second invalid, which bars publication from any
     field at all. Both are answers a real founder gives. */
  const a = Object.assign(perfectFixture(kind, stage, "equity", false, "no"), {
    askAmount: 5000, preMoneyValuation: 45000, equityOfferedPct: 10,
    grossMarginPct: 100,
    useOfFunds: [{ bucket: "A", amount: 2000, outcome: "x" },
                 { bucket: "B", amount: 2000, outcome: "y" },
                 { bucket: "C", amount: 1000, outcome: "z" }],
  });
  const s = scoreAnswers(kind, stage, a);
  if(s.rawExact !== 100) fail("a $5 000 ask at 100% gross margin scores " + s.rawExact
    + " · " + missingFrom(s).slice(0, 4).map(m => m.field + ":" + m.state).join(", "));
  if(!standardMet({ kind, stage, answers: a }).ok) fail("gate shut on a $5 000 ask");

  /* And the state/value distinction itself, which no perfect fixture can
     exercise because a perfect fixture has no weak field. A gate-critical
     answer that is merely implausible must COST its points and must not cap:
     an 8-digit STIR is weak, not a contradiction, and under the old
     `value < 1` rule it pinned the deal at 89.999 for good. */
  const w = Object.assign({}, a, { tin: "12345678" });
  const ws = scoreAnswers(kind, stage, w);
  const wm = standardMet({ kind, stage, answers: w });
  if(ws.capped) fail("a weak gate-critical field still caps: " + ws.criticalOpen.join(","));
  if(!(ws.rawExact < 100)) fail("a weak gate-critical field cost no points");
  if(!wm.ok) fail("gate shut on a weak gate-critical field at " + ws.rawExact);
}

function assertRubric(){
  assertWeights();
  assertCritical();
  assertReachable();
  assertEdges();
  return true;
}

/** Invariant 9 belongs to srv/kapital.js, which owns both STUCK_DAYS and
    D_STATUS; this module is a leaf and may not require it. Exported so that
    file can assert it in one line at its own load, keeping the rule here. */
const assertStatusDays = (stuckDays, statuses) => {
  for(const k of Object.keys(stuckDays || {}))
    if(!(statuses || []).includes(k)) fail("STUCK_DAYS key " + k + " is not a deal status");
  return true;
};

assertRubric();

module.exports = {
  /* vocabulary — callers need one import */
  RUBRIC_VERSION: R.RUBRIC_VERSION, DEAL_KINDS: R.DEAL_KINDS, KAP_STAGES: R.KAP_STAGES,
  LEGACY_STAGE: R.LEGACY_STAGE, SECTIONS: R.SECTIONS, ALL_FIELDS: R.ALL_FIELDS,
  FIELDS_BY_KEY: R.FIELDS_BY_KEY, GATE: R.GATE, PUBLISH_MIN: R.PUBLISH_MIN,
  CRITICAL_FIELDS: R.CRITICAL_FIELDS, WITHDRAW_TRIGGERS: R.WITHDRAW_TRIGGERS,
  LEGAL_FORMS: R.LEGAL_FORMS, REGIONS: R.REGIONS, PRODUCT_STAGES: R.PRODUCT_STAGES,
  IP_STATUS: R.IP_STATUS, REVENUE_MODELS: R.REVENUE_MODELS, RISK_CATEGORIES: R.RISK_CATEGORIES,
  COMMITMENT: R.COMMITMENT, LITIGATION: R.LITIGATION, TAX_DEBT: R.TAX_DEBT,
  AUDIT_STATUS: R.AUDIT_STATUS, YESNO: R.YESNO, FEASIBILITY: R.FEASIBILITY,
  CURRENCIES: R.CURRENCIES, INSTRUMENTS: R.INSTRUMENTS, ROW_INSTRUMENTS: R.ROW_INSTRUMENTS,
  EQUITY_LIKE: R.EQUITY_LIKE, DEBT_LIKE: R.DEBT_LIKE, DOC_KINDS: R.DOC_KINDS,
  REQUIRED_DOCS: R.REQUIRED_DOCS, requiredDocs: R.requiredDocs, preRevenue: R.preRevenue,

  /* sanitising */
  CLEAN, cleanAnswers, cleanKind, cleanStage,

  /* scoring — pure, deterministic, AI-free */
  scoreAnswers, scoreDeal, sectionsOf, fieldsMissing, progress, evidenceShare,

  /* the gate */
  standardMet, snapshot, withdrawTriggered,

  /* bridges */
  asFactors, aiContext, rubricHash, assertRubric, assertStatusDays, perfectFixture,
};
