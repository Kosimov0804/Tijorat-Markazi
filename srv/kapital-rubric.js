/* ============================================================
   MOLIYA BOZORI — Kapital · THE RUBRIC TABLES

   This file is data. It holds the ten sections of the universal
   investment standard, the 125 field descriptors underneath them,
   the closed enum sets, the table column definitions, the branch
   predicates and the thirteen cross-field consistency tests. It
   computes no percentage; srv/kapital-standard.js does that, and
   it is the only module anyone else may require.

   THE TRADE THIS FILE MAKES, and the reason it is a table rather
   than code: the SECTIONS are universal and their weights are
   frozen, while the FIELDS inside a section are conditional. A
   pre-revenue startup has no churn and a solar SPV has no CAC, so
   if the rubric asked anyway 100% would be unreachable, the meter
   would be a liar, and founders would stop filling it in. But if
   a startup and a project were scored by two different rubrics,
   a 91% would mean two different things and an investor could not
   sort one feed by it. The resolution is a `when` predicate per
   field: a field that does not apply leaves its section's
   DENOMINATOR rather than counting as missing — same question,
   same weight, different evidence.

   That resolution only holds if every branch of every section
   still sums to exactly 100. Four holes in the first draft did
   not (S1 pre-seed, S4 and S5 pre-revenue, S10 unregulated), and
   each was closed by a counterpart field at equal weight rather
   than by reweighting the survivors — reweighting would have
   moved the meaning of a percentage that founders were already
   being judged against. Every mutually-exclusive pair below is
   therefore complementary over ONE variable, so no combination
   of answers can leave a section short. assertRubric() in
   kapital-standard.js proves it at module load.

   The trilingual labels do NOT live here. The server ships a
   `labelKey` and the Uzbek fallback; kapital-rubric-i18n.js on
   the client owns the ru/en rows. That is what keeps this file
   readable and under the ceiling.
   ============================================================ */
const H = require("./store");
const M = require("./moliya");

const RUBRIC_VERSION = "1.0.0";
const DEAL_KINDS = ["startup", "project"];

/* Stage lives inside the kind — a startup and a capital project do not share a
   ladder. moliya-capital.js exports a FLAT `STAGES` array that investor
   passports and matchInvestors() already speak, so this object is named
   differently on purpose: `const { STAGES } = require(...)` yielded two
   incompatible shapes depending on which module you happened to import. */
const KAP_STAGES = {
  startup: ["pre-seed", "seed", "series-a", "growth"],
  project: ["feasibility", "structuring", "construction", "operating", "expansion"],
};
/* → moliya-capital.js STAGES, so matchInvestors() can score a kapital deal.
   `growth` maps to "mature": an investor whose passport lists only `mature`
   previously matched nothing kapital would ever produce. */
const LEGACY_STAGE = {
  "pre-seed": "pre-seed", seed: "seed", "series-a": "growth", growth: "mature",
  feasibility: "project", structuring: "project", construction: "project",
  operating: "project", expansion: "project",
};

/* An OBJECT, deliberately. `GATE = 90` invites `score >= GATE` somewhere and
   `cap` invites nothing at all; with two named numbers a caller has to say
   which one it means. Nothing anywhere compares against GATE itself —
   PUBLISH_MIN is the one number every caller may use. */
const GATE = { threshold: 90, cap: 89.999 };
const PUBLISH_MIN = GATE.threshold;

/* ---------- closed sets ----------
   An enum's unset value is "" and "" is a MEMBER of every answers-side set,
   with "" as the default passed to H.ONE. H.ONE falls back to allowed[0] when
   no default is given, which would silently fabricate an answer the founder
   never gave — the one place its convenience would lie. */
const LEGAL_FORMS = ["", "mchj", "aj", "yatt", "xk", "qk", "fx", "np", "boshqa"];
const REGIONS = ["", "qoraqalpogiston", "andijon", "buxoro", "jizzax", "qashqadaryo", "navoiy",
  "namangan", "samarqand", "surxondaryo", "sirdaryo", "toshkent-viloyat", "toshkent-shahar",
  "fargona", "xorazm"];
const PRODUCT_STAGES = ["", "idea", "prototype", "mvp", "pilot", "live", "scaling"];
const IP_STATUS      = ["", "none", "pending", "registered", "licensed", "secret"];
const REVENUE_MODELS = ["", "subscription", "transaction", "marketplace", "licence", "product",
  "service", "tariff", "offtake", "concession", "other"];
/* Identical to copilot.js investorReady's riskRegister categories, so an
   AI-drafted risk row lands in a rubric row with no translation of the
   category itself. The row SHAPES still differ — see RISK_COLS. */
const RISK_CATEGORIES = ["commercial", "financial", "operational", "legal", "esg", "execution"];
const COMMITMENT  = ["", "fulltime", "parttime", "advisory"];
const LITIGATION  = ["", "none", "pending", "resolved"];
const TAX_DEBT    = ["", "none", "restructured", "overdue"];
const AUDIT_STATUS= ["", "none", "review", "audited"];
const YESNO       = ["", "yes", "no"];
const FEASIBILITY = ["", "none", "prefeasibility", "bankable"];
const CURRENCIES  = M.CURRENCIES;

/* ROW_INSTRUMENTS is what the deal row carries and is pinned equal to
   moliya-capital.js — a kapital deal and a moliya project must not disagree
   about what an instrument is called. The rubric keeps a "" member for the
   ANSWERS copy only, because an answers object exists before the header is
   written. The row itself refuses `instrument_required`, which is what makes
   S7's 68-denominator case unreachable. */
const ROW_INSTRUMENTS = ["equity", "convertible", "mezzanine", "debt", "jv", "project-equity"];
const INSTRUMENTS = [""].concat(ROW_INSTRUMENTS);
const EQUITY_LIKE = ["equity", "convertible", "jv", "project-equity"];
const DEBT_LIKE   = ["mezzanine", "debt"];

const DOC_KINDS = ["reg-cert", "charter", "tin-cert", "financials", "tax-report", "bank-statement",
  "cap-table", "pitch-deck", "model", "contracts", "licence", "ip", "audit", "valuation",
  "feasibility", "kyc", "other"];

/* Keyed by kind AND stage. Keying it by kind alone made `requiredDocsPresent`
   — a GATE-CRITICAL field — unanswerable at project/feasibility, where signed
   contracts and audited financials do not exist yet. That capped an entire
   branch at 89.999 forever and taught founders to falsify a compliance field
   to escape it, which is the exact opposite of what the field is for. */
const DOCS_STARTUP = ["reg-cert", "charter", "financials", "cap-table", "pitch-deck", "model"];
const DOCS_PROJECT = ["reg-cert", "charter", "financials", "cap-table", "model",
                      "feasibility", "contracts"];
const REQUIRED_DOCS = {
  startup: { "pre-seed": DOCS_STARTUP, seed: DOCS_STARTUP,
             "series-a": DOCS_STARTUP, growth: DOCS_STARTUP },
  project: {
    feasibility:  ["reg-cert", "charter", "cap-table", "model", "feasibility"],
    structuring:  ["reg-cert", "charter", "financials", "cap-table", "model", "feasibility"],
    construction: DOCS_PROJECT, operating: DOCS_PROJECT, expansion: DOCS_PROJECT,
  },
};
const requiredDocs = c => ((REQUIRED_DOCS[c.kind] || {})[c.stage] || DOCS_STARTUP);

/* ---------- table column sets ----------
   Every column carries its own sanitiser type and its own storage cap, so a
   row is rebuilt column by column and an unknown column from a client body is
   dropped rather than stored. `req` here means "this cell must be filled for
   the row to count as complete" — the table validator grades on that. */
const CAP_COLS = [{ key: "holder", type: "text", req: true, max: 160 },
                  { key: "sharePct", type: "pct", req: true },
                  { key: "role", type: "text", req: true, max: 80 },
                  { key: "note", type: "text", req: false, max: 200 }];
const ROUND_COLS = [{ key: "round", type: "text", req: true, max: 60 },
                    { key: "year", type: "year", req: true },
                    { key: "amount", type: "money", req: true },
                    { key: "investor", type: "text", req: true, max: 160 }];
const COMP_COLS = [{ key: "name", type: "text", req: true, max: 160 },
                   { key: "type", type: "text", req: true, max: 80 },
                   { key: "strength", type: "text", req: true, max: 200 },
                   { key: "weakness", type: "text", req: true, max: 200 }];
const OFFTAKE_COLS = [{ key: "counterparty", type: "text", req: true, max: 160 },
                      { key: "volume", type: "text", req: true, max: 80 },
                      { key: "tenorMonths", type: "int", req: true },
                      { key: "status", type: "text", req: true, max: 60 }];
const GROWTH_COLS = [{ key: "period", type: "text", req: true, max: 20 },
                     { key: "metric", type: "text", req: true, max: 40 },
                     { key: "value", type: "num", req: true }];
const PILOT_COLS = [{ key: "partner", type: "text", req: true, max: 160 },
                    { key: "scope", type: "text", req: true, max: 200 },
                    { key: "result", type: "text", req: true, max: 300 },
                    { key: "year", type: "year", req: true }];
const FIN_COLS = [{ key: "year", type: "year", req: true },
                  { key: "revenue", type: "money", req: true },
                  { key: "cogs", type: "money", req: true },
                  { key: "opex", type: "money", req: true },
                  { key: "ebitda", type: "money", req: true },
                  { key: "netProfit", type: "money", req: false }];
const USE_COLS = [{ key: "bucket", type: "text", req: true, max: 120 },
                  { key: "amount", type: "money", req: true },
                  { key: "outcome", type: "text", req: true, max: 200 }];
const MILE_COLS = [{ key: "milestone", type: "text", req: true, max: 200 },
                   { key: "byMonth", type: "int", req: true },
                   { key: "metric", type: "text", req: true, max: 120 }];
const TEAM_COLS = [{ key: "name", type: "text", req: true, max: 160 },
                   { key: "role", type: "text", req: true, max: 120 },
                   { key: "yearsExp", type: "int", req: true },
                   { key: "priorCompany", type: "text", req: true, max: 160 },
                   { key: "founder", type: "bool", req: false },
                   { key: "fullTime", type: "bool", req: false }];
const HIRE_COLS = [{ key: "role", type: "text", req: true, max: 120 },
                   { key: "byMonth", type: "int", req: true },
                   { key: "cost", type: "money", req: true }];
const ADV_COLS = [{ key: "name", type: "text", req: true, max: 160 },
                  { key: "expertise", type: "text", req: true, max: 160 },
                  { key: "engagement", type: "text", req: true, max: 80 }];
/* copilot.js emits {risk, category, mitigation, severity}; this wants
   likelihood and impact separately. The mapper is stated rather than
   discovered: severity → impact, likelihood and owner left empty, and the row
   then scores as `partial` (0.4). On a 46-weight field that is worth saying
   out loud, which is also why `owner` is req:false. */
const RISK_COLS = [{ key: "risk", type: "text", req: true, max: 200 },
                   { key: "category", type: "enum", set: RISK_CATEGORIES, req: true },
                   { key: "likelihood", type: "enum", set: ["low", "medium", "high"], req: true },
                   { key: "impact", type: "enum", set: ["low", "medium", "high"], req: true },
                   { key: "mitigation", type: "text", req: true, max: 300 },
                   { key: "owner", type: "text", req: false, max: 120 }];
const SENS_COLS = [{ key: "variable", type: "text", req: true, max: 120 },
                   { key: "down20", type: "text", req: true, max: 120 },
                   { key: "base", type: "text", req: true, max: 120 },
                   { key: "up20", type: "text", req: true, max: 120 }];
const DOC_COLS = [{ key: "kind", type: "enum", set: DOC_KINDS, req: true },
                  { key: "label", type: "text", req: true, max: 160 },
                  { key: "url", type: "url", req: true }];
const LIC_COLS = [{ key: "name", type: "text", req: true, max: 160 },
                  { key: "authority", type: "text", req: true, max: 160 },
                  { key: "number", type: "text", req: true, max: 60 },
                  { key: "validTo", type: "text", req: true, max: 20 }];

/* ---------- reading an answers object ----------
   Numeric emptiness is `null`, never 0. H.N collapses undefined, "" and []
   all to 0, so before this distinction existed an untouched form scored ~11%:
   revenueLast12m, cashOnHand, keyMetricValue and npv all read as the honest
   answer "zero", and useOfFundsBalances — a gate-critical check — read green
   because Σ0 equals an ask of 0 within ±1%. */
const num = (c, k) => { const x = c.a[k]; return x === "" || x == null ? null : H.N(x); };
const str = (c, k) => H.S(c.a[k], 6000);
const rows = (c, k) => (Array.isArray(c.a[k]) ? c.a[k] : []);
const r2 = x => Math.round(100 * x) / 100;

/* ---------- branch predicates ----------
   NOT a self-declaration: revenueLast12m overrides productStage, so declaring
   "pilot" to shed `retention` and `churnPct` while booking revenue is
   impossible, and `stageConsistent` fails outright in that case. */
const preRevenue = c => c.kind === "startup"
  && !["pilot", "live", "scaling"].includes(c.a.productStage)
  && !(c.a.revenueLast12m > 0);
const isStartup = c => c.kind === "startup";
const isProject = c => c.kind === "project";
const hasRevenue = c => c.kind === "startup" && !preRevenue(c);
const equityDeal = c => EQUITY_LIKE.includes(c.a.instrument);
const debtDeal   = c => DEBT_LIKE.includes(c.a.instrument);

/* ---------- the thirteen cross-field tests ----------
   A check cannot be typed into. It turns green only when separate numbers
   agree with each other, which is why it is worth a third of the arithmetic
   credibility of the whole rubric — and why every one of them declares
   `inputs[]` and returns null (state `blocked`) when any input is still
   empty. A check that read `true` on an untouched deal would be worse than no
   check at all: it would certify a blank form. */
const CHK = {};

CHK.capTable = c => {
  const list = rows(c, "capTable");
  if(!list.length) return null;
  return r2(list.reduce((t, r) => t + H.N(r.sharePct), 0));
};
CHK.nesting = c => {
  const tam = num(c, "tam"), sam = num(c, "sam"), som = num(c, "som");
  if(tam == null || sam == null || som == null) return null;
  /* SPLIT deliberately. TAM ≥ SAM ≥ SOM is arithmetic: violating it is a
     contradiction and blocks. "SOM under half of SAM" is a heuristic about
     ambition, and a founder with a legitimately dominant niche must not be
     barred from publishing forever over it — so it grades to 0.6 instead. */
  if(!(tam >= sam && sam >= som && som > 0)) return false;
  return som <= 0.5 * sam ? true : 0.6;
};
CHK.stage = c => {
  const rev = num(c, "revenueLast12m"), st = H.S(c.a.productStage, 20);
  if(rev == null || !st) return null;
  return !(rev > 0 && !["pilot", "live", "scaling"].includes(st));
};
CHK.ltvCac = c => {
  const ltv = num(c, "ltv"), cac = num(c, "cac");
  if(ltv == null || cac == null || cac <= 0) return null;
  return ltv / cac;
};
CHK.unitEcon = c => {
  const arpu = num(c, "targetArpu"), cac = num(c, "targetCac"), gm = num(c, "grossMarginPct");
  if(arpu == null || cac == null || gm == null || cac <= 0) return null;
  return arpu * (gm / 100) / cac;      // annual gross profit per customer, over CAC
};
CHK.runway = c => {
  const cash = num(c, "cashOnHand"), burn = num(c, "monthlyBurn"), stated = num(c, "runwayMonths");
  if(cash == null || stated == null || burn == null || burn <= 0) return null;
  return cash / burn;
};
CHK.useOfFunds = c => {
  const ask = num(c, "askAmount"), list = rows(c, "useOfFunds");
  if(ask == null || ask <= 0 || !list.length) return null;
  return list.reduce((t, r) => t + H.N(r.amount), 0);
};
CHK.equityMath = c => {
  const pre = num(c, "preMoneyValuation"), ask = num(c, "askAmount");
  const offered = num(c, "equityOfferedPct");
  if(pre == null || ask == null || offered == null || pre + ask <= 0) return null;
  return 100 * ask / (pre + ask);
};
CHK.riskCats = c => {
  const list = rows(c, "risks");
  if(!list.length) return null;
  const set = new Set(list.map(r => H.S(r.category, 40)).filter(Boolean));
  return set.size;
};
/* Three sub-tests, all hard. A mean would have let an EBITDA row that
   contradicts its own revenue through the gate at 0.667 while a founder who
   simply had not typed a table yet was told their answer was "invalid". */
function finDiagnose(c){
  const h = rows(c, "historicals"), p = rows(c, "projections");
  if(!h.length || !p.length) return { v: null, detail: "" };
  const all = h.concat(p);
  const neg = all.find(r => H.N(r.revenue) < 0 || H.N(r.cogs) < 0 || H.N(r.opex) < 0);
  if(neg) return { v: false, detail: "manfiy tushum/tannarx/xarajat: " + H.N(neg.year) };
  const bad = all.find(r => Math.abs(H.N(r.ebitda) - (H.N(r.revenue) - H.N(r.cogs) - H.N(r.opex)))
                            > Math.max(1, 0.02 * Math.abs(H.N(r.revenue))));
  if(bad) return { v: false, detail: "EBITDA tushum − tannarx − xarajatga teng emas: " + H.N(bad.year) };
  const years = all.map(r => H.N(r.year));
  for(let i = 1; i < years.length; i++){
    if(years[i] !== years[i - 1] + 1) return { v: false, detail: "yillar ketma-ket emas: " + years[i] };
  }
  return { v: true, detail: "" };
}
/* With links rather than uploads there is no way to prove a document exists,
   so distinctness and shape are the only integrity checks available. This is
   a known, stated weakness of a gate-critical field, not an oversight. */
const PLACEHOLDER = /(example\.(com|org|net)|localhost|127\.0\.0\.1|test\.test|foo\.bar|placeholder|todo|xxx)/i;
CHK.docs = c => {
  const list = rows(c, "documents");
  if(!list.length) return null;
  const need = requiredDocs(c);
  const seen = new Set(), dup = [];
  for(const d of list){
    const k = H.S(d.url, 400).toLowerCase().replace(/^https?:\/\//, "").replace(/[?#].*$/, "")
                .replace(/\/+$/, "");
    if(!k || PLACEHOLDER.test(k)) dup.push(k || "?");
    else if(seen.has(k)) dup.push(k);
    else seen.add(k);
  }
  const have = new Set(list.map(d => H.S(d.kind, 40)));
  return { missing: need.filter(k => !have.has(k)), dup };
};

/* ---------- the field descriptors ----------
   Validator options under `v`, storage caps under `store`. They were one
   ambiguous `max` in the first draft, which meant `oneLiner {max:200}` was
   truncated at 6000 characters and then scored a clean 1.0 at that length.
   `v.max` is the validator's ceiling; `store.max` is the sanitiser's
   truncation, and store.max is deliberately the larger of the two so an
   over-long answer survives storage long enough to be reported as invalid.

   `v.min`/`v.max` are HARD bounds and `v.plaus` is a BAND, and the gap
   between them is the gap between a contradiction and a judgement. vNum
   returns state "invalid" outside a hard bound, and kapital-standard.js bars
   publication on an "invalid" state anywhere in the pack — so a hard bound
   that merely encodes an expectation permanently blocks a founder whose
   honest number sits outside it, and tells them their true answer is wrong.
   The first draft was full of them: grossMarginPct capped at 95 blocked every
   software-licence and IP-royalty business, askHorizonMonths capped at 60
   blocked every infrastructure build, registeredYear floored at 1991 blocked
   every Soviet-era plant that re-registered after independence, dscr capped
   at 10 blocked every unlevered project, and equityOfferedPct capped at 60
   blocked every founder selling control. Every hard bound that survives below
   is either an arithmetic impossibility — a share of a whole above 100%, a
   market shrinking by more than the whole of itself, an EBITDA larger than
   the revenue it is subtracted out of — or an anchor no truthful answer can
   reach, such as a company registered before 1900. Every expectation moved to
   `plaus`, where missing it costs points and says why without ever shutting
   the gate. When a quantity has no arithmetic ceiling at all, it declares
   none: a band grades it, and gate 1 and a human reader catch the absurd. */
const SECTIONS_RAW = [{
  key: "identity", weight: 12,
  labelKey: "kap_sec_identity", labelUz: "Yuridik shaxs va ulushlar",
  why: "Yuridik shaxs va egalik tuzilmasi hujjatlangan",
  gap: "Yuridik shaxs va ulushlar boʻlimi toʻldirilmagan",
  fields: [
    { key:"legalName", label:"Toʻliq yuridik nom", type:"text", w:10, v:{min:3,good:8}, store:{max:200}, hint:"Roʻyxatdan oʻtgan toʻliq yuridik nomni yozing" },
    { key:"legalForm", label:"Tashkiliy-huquqiy shakl", type:"enum", w:8, store:{set:LEGAL_FORMS}, hint:"Tashkiliy-huquqiy shaklni tanlang (MChJ, AJ, YaTT…)" },
    { key:"tin", label:"STIR", type:"text", w:12, v:{min:9,good:9,max:9,needs:[{re:/^\d{9}$/,why:"9 raqam"}]}, store:{max:20}, hint:"9 raqamli STIR raqamini kiriting" },
    /* The spec wrote `max: thisYear`. A rule that reads the clock makes
       scoreAnswers() non-deterministic across a new year, which §4.4 forbids
       outright — so the hard ceiling is fixed and a future year is `weak`.
       The floor was 1991, which read independence as an arithmetic fact: a
       1962 plant that re-registered as a JSC was told its founding year was
       invalid and could never publish. Independence is now the band. */
    { key:"registeredYear", label:"Roʻyxatdan oʻtgan yil", type:"year", w:6, v:{min:1900,max:2100,plaus:[1991,2035]}, store:{}, hint:"Roʻyxatdan oʻtgan yilni koʻrsating" },
    { key:"region", label:"Hudud", type:"enum", w:6, store:{set:REGIONS}, hint:"Hududni tanlang" },
    { key:"website", label:"Veb-sayt", type:"url", req:false, w:4, store:{max:400}, hint:"Veb-sayt yoki ijtimoiy sahifa havolasini qoʻshing" },
    { key:"capTable", label:"Egalik tuzilmasi", type:"table", w:20, v:{min:1}, store:{cols:CAP_COLS,maxRows:24}, hint:"Egalik tuzilmasini kiriting: kim, necha foiz, qaysi rolda" },
    { key:"capTableBalances", label:"Ulushlar balansi", type:"check", w:10, inputs:["capTable"],
      test: c => { const s = CHK.capTable(c); return s == null ? null : Math.abs(s - 100) <= 0.5; },
      args: c => ({ sum: CHK.capTable(c) == null ? 0 : CHK.capTable(c) }),
      hint:"Ulushlar yigʻindisi 100% boʻlishi kerak — hozir {sum}%" },
    { key:"foundersEquityPct", label:"Asoschilar ulushi, %", type:"pct", w:8, when:isStartup, v:{min:0,max:100,plaus:[15,100]}, store:{}, hint:"Asoschilar qoʻlidagi umumiy ulushni foizda yozing" },
    { key:"foundingStory", label:"Asos solish tarixi", type:"text", w:8, when: c => c.kind === "startup" && c.stage === "pre-seed", v:{min:200,good:450}, store:{max:3000}, hint:"Kompaniya qanday paydo boʻlgan — asoschilar tarixi va nega aynan siz bu ishni qilyapsiz" },
    { key:"priorRounds", label:"Oldingi raundlar", type:"table", w:8, when: c => c.kind === "startup" && c.stage !== "pre-seed", v:{min:1}, store:{cols:ROUND_COLS,maxRows:20}, hint:"Oldingi raundlarni kiriting: sana, summa, investor" },
    { key:"sponsorEquityPct", label:"Sponsor ulushi, %", type:"pct", w:8, when:isProject, v:{min:0,max:100,plaus:[10,100]}, store:{}, hint:"Sponsor/bosh kompaniya ulushini foizda yozing" },
    { key:"groupStructure", label:"Guruh tuzilmasi", type:"text", w:8, when:isProject, v:{min:120,good:300}, store:{max:2500}, hint:"Guruh tuzilmasini tavsiflang: bosh kompaniya, SPV, shoʻba korxonalar" },
    { key:"encumbranceFree", label:"Ulushlar erkin (garov yoʻq)", type:"bool", w:8, store:{}, hint:"Ulushlar garov/hibsda emasligini tasdiqlang" },
  ],
}, {
  key: "problem", weight: 8,
  labelKey: "kap_sec_problem", labelUz: "Muammo va yechim",
  why: "Muammo va yechim aniq bayon qilingan",
  gap: "Muammo va yechim boʻlimi toʻldirilmagan",
  fields: [
    { key:"oneLiner", label:"Bir jumlali taʼrif", type:"text", w:6, v:{min:40,good:90,max:200}, store:{max:400}, hint:"Loyihani bitta jumlada tushuntiring" },
    { key:"problemStatement", label:"Muammo bayoni", type:"text", w:22, v:{min:200,good:500}, store:{max:4000}, hint:"Qanday muammoni hal qilyapsiz — aniq va batafsil yozing" },
    { key:"whoSuffers", label:"Kim uchun muammo", type:"text", w:14, v:{min:120,good:300}, store:{max:2500}, hint:"Bu muammo aynan kimga tegishli — mijoz segmentini aniqlang" },
    { key:"evidenceOfPain", label:"Muammo dalili", type:"text", w:18, v:{min:120,good:300,needs:[{re:/\d/,why:"raqam"}]}, store:{max:2500}, hint:"Muammo borligini isbotlovchi dalil keltiring — kamida bitta raqam bilan" },
    { key:"alternativeToday", label:"Hozirgi muqobil", type:"text", w:8, v:{min:80,good:200}, store:{max:2000}, hint:"Mijozlar hozir bu muammoni qanday hal qilishmoqda" },
    { key:"solution", label:"Yechim", type:"text", w:22, v:{min:200,good:500}, store:{max:4000}, hint:"Yechimingizni tushuntiring: nima qiladi, qanday ishlaydi" },
    { key:"whyNow", label:"Nega hozir", type:"text", w:10, v:{min:100,good:250}, store:{max:2000}, hint:"Nega aynan hozir — qanday oʻzgarish bu imkonni ochdi" },
  ],
}, {
  key: "market", weight: 10,
  labelKey: "kap_sec_market", labelUz: "Bozor va raqobat",
  why: "Bozor hajmi va raqobat asoslangan",
  gap: "Bozor va raqobat boʻlimi toʻldirilmagan",
  fields: [
    { key:"tam", label:"TAM", type:"money", w:14, v:{gt0:true}, store:{}, hint:"TAM — umumiy bozor hajmini kiriting" },
    { key:"sam", label:"SAM", type:"money", w:12, v:{gt0:true}, store:{}, hint:"SAM — siz xizmat koʻrsata oladigan bozor hajmi" },
    { key:"som", label:"SOM", type:"money", w:12, v:{gt0:true}, store:{}, hint:"SOM — 3–5 yilda real egallash mumkin boʻlgan ulush" },
    { key:"marketSizingMethod", label:"Hisoblash metodikasi", type:"text", w:14, v:{min:150,good:350,needs:[{re:/\d/,why:"raqam"}]}, store:{max:3000}, hint:"TAM/SAM/SOM qanday hisoblangan — manba va formulani yozing" },
    { key:"marketNesting", label:"TAM/SAM/SOM izchilligi", type:"check", w:10, inputs:["tam","sam","som"], test: CHK.nesting,
      args: c => ({ tam: num(c,"tam") || 0, sam: num(c,"sam") || 0, som: num(c,"som") || 0 }),
      hint:"TAM ≥ SAM ≥ SOM boʻlishi kerak; SOM SAMning yarmidan oshmasin" },
    { key:"growthRatePct", label:"Bozor oʻsishi, %/yil", type:"pct", w:8, v:{min:-100,plaus:[0,60]}, store:{}, hint:"Bozorning yillik oʻsish surʼatini foizda koʻrsating" },
    { key:"geoScope", label:"Geografiya", type:"list", w:6, v:{min:1,itemMin:2}, store:{max:10,itemMax:120}, hint:"Qaysi hududlar/davlatlarda ishlaysiz" },
    { key:"competitors", label:"Raqobatchilar", type:"table", w:16, v:{min:3}, store:{cols:COMP_COLS,maxRows:20}, hint:"Kamida 3 ta raqobatchini kuchli va zaif tomonlari bilan kiriting" },
    { key:"differentiation", label:"Farqlanish", type:"text", w:8, v:{min:150,good:350}, store:{max:3000}, hint:"Sizni raqobatchidan nima ajratib turadi" },
  ],
}, {
  key: "product", weight: 12,
  labelKey: "kap_sec_product", labelUz: "Mahsulot va traction",
  why: "Mahsulot bosqichi va traction dalillangan",
  gap: "Mahsulot va traction boʻlimi toʻldirilmagan",
  fields: [
    { key:"productStage", label:"Mahsulot bosqichi", type:"enum", w:8, store:{set:PRODUCT_STAGES}, hint:"Mahsulot bosqichini tanlang: gʻoya, prototip, MVP, pilot, ishlayapti, kengaymoqda" },
    { key:"productDescription", label:"Mahsulot tavsifi", type:"text", w:12, v:{min:200,good:450}, store:{max:4000}, hint:"Mahsulot nima qiladi va qanday ishlaydi — texnik tavsif" },
    { key:"demoUrl", label:"Demo havolasi", type:"url", req:false, w:4, store:{max:400}, hint:"Demo, video yoki ilova havolasini qoʻshing" },
    { key:"revenueLast12m", label:"Soʻnggi 12 oy tushumi", type:"money", w:10, v:{min:0}, store:{}, hint:"Soʻnggi 12 oydagi tushumni kiriting" },
    { key:"customers", label:"Mijozlar soni", type:"int", w:10, when:isStartup, v:{min:0,plaus:[0,1e7]}, store:{}, hint:"Hozirgi mijozlar/foydalanuvchilar sonini kiriting" },
    { key:"growth", label:"Oʻsish dinamikasi", type:"table", w:12, when:isStartup, v:{min:3}, store:{cols:GROWTH_COLS,maxRows:24}, hint:"Kamida 3 davr uchun oʻsish raqamlarini kiriting" },
    { key:"retention", label:"Mijoz saqlanishi, %", type:"pct", w:8, when:hasRevenue, v:{min:0,max:100,plaus:[30,100]}, store:{}, hint:"12 oylik mijoz saqlanish darajasini foizda kiriting" },
    { key:"earlyRetentionPlan", label:"Saqlanish rejasi", type:"text", w:8, when:preRevenue, v:{min:150,good:350}, store:{max:2500}, hint:"Mijozni qanday ushlab qolasiz — saqlanish rejasi va uni qanday oʻlchaysiz" },
    { key:"offtakers", label:"Offtaker shartnomalari", type:"table", w:10, when:isProject, v:{min:1}, store:{cols:OFFTAKE_COLS,maxRows:20}, hint:"Xaridor/offtaker shartnomalarini kiriting (LOI ham boʻladi)" },
    { key:"capacityUtilPct", label:"Quvvatdan foydalanish, %", type:"pct", w:12, when:isProject, v:{min:0,plaus:[30,100]}, store:{}, hint:"Quvvatdan foydalanish darajasini foizda koʻrsating" },
    { key:"feasibilityDone", label:"Feasibility holati", type:"enum", w:8, when:isProject, store:{set:FEASIBILITY}, hint:"TEA/feasibility holatini tanlang" },
    { key:"keyMetricName", label:"Asosiy koʻrsatkich", type:"text", w:4, v:{min:3,good:12}, store:{max:80}, hint:"Biznesingiz yashaydigan asosiy koʻrsatkich nomi" },
    { key:"keyMetricValue", label:"Koʻrsatkich qiymati", type:"num", w:4, v:{}, store:{}, hint:"Shu koʻrsatkichning joriy qiymati" },
    { key:"pilots", label:"Pilotlar", type:"table", w:10, v:{min:1}, store:{cols:PILOT_COLS,maxRows:20}, hint:"Pilot yoki sinov natijalarini kiriting" },
    { key:"ipStatus", label:"Intellektual mulk", type:"enum", w:6, store:{set:IP_STATUS}, hint:"Intellektual mulk holatini tanlang" },
    { key:"tractionEvidence", label:"Traction dalillari", type:"docs", w:6, v:{min:1}, store:{maxRows:40}, hint:"Traction dalilini biriktiring: shartnoma, hisobot, skrinshot" },
    { key:"stageConsistent", label:"Bosqich izchilligi", type:"check", w:6, inputs:["revenueLast12m","productStage"], test: CHK.stage,
      args: c => ({ stage: H.S(c.a.productStage, 20), revenue: num(c,"revenueLast12m") || 0 }),
      hint:"Tushum bor, lekin mahsulot bosqichi undan orqada — bosqichni toʻgʻrilang" },
  ],
}, {
  key: "model", weight: 12,
  labelKey: "kap_sec_model", labelUz: "Biznes-model va birlik iqtisodiyoti",
  why: "Birlik iqtisodiyoti raqamlar bilan koʻrsatilgan",
  gap: "Biznes-model va birlik iqtisodiyoti toʻldirilmagan",
  fields: [
    { key:"revenueModel", label:"Daromad modeli", type:"enum", w:8, store:{set:REVENUE_MODELS}, hint:"Daromad modelini tanlang" },
    { key:"pricing", label:"Narx siyosati", type:"text", w:10, v:{min:120,good:280,needs:[{re:/\d/,why:"narx"}]}, store:{max:2500}, hint:"Narx siyosatini raqam bilan tushuntiring" },
    /* The hard max was 95 and made a software-licence or IP-royalty business
       at a genuine 100% "invalid", which bars publication from any field: an
       honest number, refused. 100 is the real ceiling (cost of goods cannot
       be negative) and −100 the floor a real books error would have to cross.
       The band's ceiling moved with it: a band that stopped at 90 taxed the
       same founder 0.43 points forever, which is the same defect one size
       smaller. Its floor, 15, is where the judgement still lives. */
    { key:"grossMarginPct", label:"Yalpi marja, %", type:"pct", w:12, v:{min:-100,max:100,plaus:[15,100]}, store:{}, hint:"Yalpi marjani foizda kiriting" },
    { key:"costStructure", label:"Xarajat tuzilmasi", type:"text", w:10, v:{min:150,good:350}, store:{max:3000}, hint:"Xarajat tuzilmasini yozing: nima doimiy, nima oʻzgaruvchan" },
    { key:"salesChannels", label:"Sotuv kanallari", type:"list", w:4, v:{min:1,itemMin:3}, store:{max:10,itemMax:120}, hint:"Sotuv kanallarini sanang" },
    { key:"arpu", label:"ARPU", type:"money", w:8, when:hasRevenue, v:{gt0:true}, store:{}, hint:"Bitta mijozdan oʻrtacha yillik daromadni kiriting" },
    { key:"cac", label:"CAC", type:"money", w:12, when:hasRevenue, v:{gt0:true}, store:{}, hint:"Bitta mijozni jalb qilish xarajatini (CAC) kiriting" },
    { key:"ltv", label:"LTV", type:"money", w:12, when:hasRevenue, v:{gt0:true}, store:{}, hint:"Mijozning umrbod qiymatini (LTV) kiriting" },
    { key:"ltvCacRatio", label:"LTV/CAC nisbati", type:"check", w:10, when:hasRevenue, inputs:["ltv","cac"],
      test: c => { const r = CHK.ltvCac(c); return r == null ? null : (r >= 3 ? true : (r >= 1 ? 0.6 : 0.2)); },
      args: c => ({ ratio: r2(CHK.ltvCac(c) || 0) }),
      hint:"LTV/CAC nisbati {ratio} — investorlar odatda 3 dan yuqorisini kutadi" },
    { key:"cacPaybackMonths", label:"CAC qaytish muddati, oy", type:"num", w:8, when:hasRevenue, v:{min:0,plaus:[1,24]}, store:{}, hint:"CAC necha oyda qaytadi" },
    { key:"churnPct", label:"Churn, %", type:"pct", w:6, when:hasRevenue, v:{min:0,max:100,plaus:[0,40]}, store:{}, hint:"Yillik churn darajasini foizda kiriting" },
    { key:"targetArpu", label:"Maqsadli ARPU", type:"money", w:8, when:preRevenue, v:{gt0:true}, store:{}, hint:"Bitta mijozdan kutilayotgan yillik daromadni kiriting (maqsadli ARPU)" },
    { key:"targetCac", label:"Maqsadli CAC", type:"money", w:12, when:preRevenue, v:{gt0:true}, store:{}, hint:"Bitta mijozni jalb qilishning maqsadli xarajatini kiriting" },
    { key:"unitEconomicsBasis", label:"Birlik iqtisodiyoti asosi", type:"text", w:12, when:preRevenue, v:{min:200,good:450,needs:[{re:/\d/,why:"raqam"}]}, store:{max:3000}, hint:"Birlik iqtisodiyoti nimaga asoslangan — raqamlar qayerdan olingan va qanday hisoblangan" },
    { key:"unitEconomicsSanity", label:"Birlik iqtisodiyoti izchilligi", type:"check", w:10, when:preRevenue, inputs:["targetArpu","targetCac","grossMarginPct"],
      test: c => { const r = CHK.unitEcon(c); return r == null ? null : (r >= 1 ? true : (r >= 0.5 ? 0.6 : 0.2)); },
      args: c => ({ ratio: r2(CHK.unitEcon(c) || 0) }),
      hint:"Maqsadli ARPU × yalpi marja CAC ni bir yilda qoplashi kerak — hozirgi nisbat {ratio}" },
    { key:"paybackAssumption", label:"Qaytish farazi", type:"text", w:8, when:preRevenue, v:{min:120,good:280,needs:[{re:/\d/,why:"raqam"}]}, store:{max:2000}, hint:"CAC qancha vaqtda qaytishini va bu faraz nimaga asoslanganini raqam bilan yozing" },
    { key:"churnAssumption", label:"Churn farazi", type:"text", w:6, when:preRevenue, v:{min:120,good:280}, store:{max:2000}, hint:"Kutilayotgan churn darajasi va u qanday farazga asoslanganini yozing" },
    { key:"unitPrice", label:"Birlik narxi", type:"money", w:8, when:isProject, v:{gt0:true}, store:{}, hint:"Bir birlik mahsulot/xizmat narxini kiriting" },
    { key:"unitCost", label:"Birlik tannarxi", type:"money", w:12, when:isProject, v:{gt0:true}, store:{}, hint:"Bir birlik ishlab chiqarish tannarxini kiriting" },
    { key:"contractedRevenuePct", label:"Shartnoma bilan qoplangan tushum, %", type:"pct", w:12, when:isProject, v:{min:0,plaus:[30,100]}, store:{}, hint:"Prognoz tushumning necha foizi imzolangan shartnoma bilan qoplangan" },
    { key:"ebitdaMarginPct", label:"EBITDA marjasi, %", type:"pct", w:10, when:isProject, v:{max:100,plaus:[5,60]}, store:{}, hint:"EBITDA marjasini foizda kiriting" },
    { key:"breakevenUtilPct", label:"Zararsizlik yuklamasi, %", type:"pct", w:8, when:isProject, v:{min:0,plaus:[20,85]}, store:{}, hint:"Zararsizlik nuqtasidagi quvvat yuklamasini foizda kiriting" },
    { key:"demandRisk", label:"Talab riski", type:"text", w:6, when:isProject, v:{min:120,good:280}, store:{max:2500}, hint:"Talab riski va uni qanday yumshatayotganingizni yozing" },
  ],
}, {
  key: "financials", weight: 14,
  labelKey: "kap_sec_financials", labelUz: "Moliya: tarix va prognoz",
  why: "Moliyaviy tarix va prognoz izchil",
  gap: "Moliya boʻlimi toʻldirilmagan",
  fields: [
    { key:"currency", label:"Valyuta", type:"enum", w:4, store:{set:[""].concat(CURRENCIES)}, hint:"Loyiha valyutasini tanlang — barcha raqamlar shu valyutada" },
    { key:"historicals", label:"Oʻtgan yillar", type:"table", w:18, v:{min: c => (c.kind === "project" ? 2 : 1)}, store:{cols:FIN_COLS,maxRows:15}, hint:"Oʻtgan yillar moliyaviy natijalarini kiriting" },
    { key:"projections", label:"Prognoz", type:"table", w:18, v:{min:3}, store:{cols:FIN_COLS,maxRows:15}, hint:"Kamida 3 yillik prognozni kiriting" },
    { key:"projectionAssumptions", label:"Prognoz farazlari", type:"text", w:12, v:{min:250,good:600,needs:[{re:/\d/,why:"raqam"},{re:/%/,why:"foiz"}]}, store:{max:5000}, hint:"Prognoz nimaga asoslangan — oʻsish, narx, xarajat farazlarini raqam bilan yozing" },
    { key:"cashOnHand", label:"Kassadagi mablagʻ", type:"money", w:8, v:{min:0}, store:{}, hint:"Hozirgi kassa/hisobvaraq qoldigʻini kiriting" },
    { key:"breakEvenMonth", label:"Zararsizlik oyi", type:"num", w:8, v:{min:1,plaus:[6,60]}, store:{}, hint:"Zararsizlikka necha oyda chiqasiz" },
    { key:"monthlyBurn", label:"Oylik burn", type:"money", w:8, when:isStartup, v:{gt0:true}, store:{}, hint:"Oylik sof burn (chiqim − kirim) summasini kiriting" },
    { key:"runwayMonths", label:"Runway, oy", type:"num", w:4, when:isStartup, v:{min:0,plaus:[3,36]}, store:{}, hint:"Mavjud mablagʻ necha oyga yetadi" },
    { key:"runwayConsistent", label:"Runway izchilligi", type:"check", w:4, when:isStartup, inputs:["cashOnHand","monthlyBurn","runwayMonths"],
      test: c => { const calc = CHK.runway(c); return calc == null ? null : Math.abs(calc - num(c,"runwayMonths")) <= 1; },
      args: c => ({ calc: r2(CHK.runway(c) || 0), stated: num(c,"runwayMonths") || 0 }),
      hint:"Runway kassa/burn bilan mos emas: hisob {calc} oy, siz {stated} oy yozdingiz" },
    { key:"nextRoundPlan", label:"Keyingi raund rejasi", type:"text", w:8, when:isStartup, v:{min:120,good:300}, store:{max:2500}, hint:"Keyingi raund rejasi: qachon, qancha, nima uchun" },
    { key:"monthlyOpex", label:"Oylik OPEX", type:"money", w:8, when:isProject, v:{gt0:true}, store:{}, hint:"Oylik operatsion xarajatni kiriting" },
    { key:"dscr", label:"DSCR", type:"num", w:4, when:isProject, v:{min:0,plaus:[1.1,3]}, store:{}, hint:"DSCR koʻrsatkichini kiriting" },
    { key:"dscrAcceptable", label:"DSCR yetarliligi", type:"check", w:4, when:isProject, inputs:["dscr"],
      test: c => { const d = num(c,"dscr"); return d == null ? null : (d >= 1.2 ? true : (d >= 1 ? 0.6 : 0.2)); },
      args: c => ({ dscr: num(c,"dscr") || 0 }),
      hint:"DSCR {dscr} — qarz xizmatini qoplash uchun odatda 1.2 dan yuqori talab qilinadi" },
    { key:"irr", label:"IRR, %", type:"pct", w:4, when:isProject, v:{min:-100,plaus:[8,35]}, store:{}, hint:"IRR ni foizda kiriting" },
    { key:"npv", label:"NPV", type:"money", w:4, when:isProject, v:{}, store:{}, hint:"NPV ni kiriting (diskont stavkasini farazlarda yozing)" },
    { key:"financialsConsistent", label:"Moliyaviy izchillik", type:"check", w:8, inputs:["historicals","projections"],
      test: c => finDiagnose(c).v,
      args: c => ({ detail: finDiagnose(c).detail }),
      hint:"Moliyaviy jadvallarda nomuvofiqlik bor: {detail}" },
  ],
}, {
  key: "ask", weight: 10,
  labelKey: "kap_sec_ask", labelUz: "Soʻrov va mablagʻdan foydalanish",
  why: "Soʻrov summasi va sarflar bir-biriga mos",
  gap: "Soʻrov va mablagʻdan foydalanish toʻldirilmagan",
  fields: [
    /* No plausibility band, deliberately. askAmount is denominated in
       deal.currency, so any static pair of numbers grades a UZS raise as
       though it were dollars: the old [1e4, 1e9] called a 1e9 UZS ask — about
       $79 000, squarely inside the platform's range — implausible, and called
       a $5 000 raise that gate 3 explicitly admits at ASK_MIN_USD
       implausible too. Because askAmount is gate-critical, that band then
       pinned overallExact at 89.999 and shut publication for good, with
       nothing the founder could type to reopen it. The real bounds are
       ASK_MIN_USD/ASK_MAX_USD in kapital-gates.js, which convert to USD
       first; the only thing left that is true in every currency is that an
       ask of nothing is not an ask. */
    { key:"askAmount", label:"Soʻralayotgan summa", type:"money", w:14, v:{gt0:true}, store:{}, hint:"Soʻralayotgan summani kiriting" },
    { key:"askHorizonMonths", label:"Mablagʻ gorizonti, oy", type:"num", w:4, v:{min:1,plaus:[12,36]}, store:{}, hint:"Bu mablagʻ necha oyga yetishi kerak" },
    { key:"instrument", label:"Instrument", type:"enum", w:8, store:{set:INSTRUMENTS}, hint:"Moliyalashtirish instrumentini tanlang" },
    { key:"useOfFunds", label:"Mablagʻdan foydalanish", type:"table", w:20, v:{min:3}, store:{cols:USE_COLS,maxRows:20}, hint:"Mablagʻ qayerga sarflanishini kamida 3 yoʻnalishda yozing" },
    { key:"useOfFundsBalances", label:"Sarflar balansi", type:"check", w:10, inputs:["useOfFunds","askAmount"],
      test: c => { const s = CHK.useOfFunds(c); return s == null ? null : Math.abs(s - num(c,"askAmount")) <= 0.01 * num(c,"askAmount"); },
      args: c => ({ sum: r2(CHK.useOfFunds(c) || 0), ask: num(c,"askAmount") || 0 }),
      hint:"Sarflar yigʻindisi soʻrovga teng emas: {sum} ≠ {ask}" },
    { key:"milestones", label:"Bosqichli natijalar", type:"table", w:12, v:{min:3}, store:{cols:MILE_COLS,maxRows:20}, hint:"Bu mablagʻ bilan erishiladigan 3 ta oʻlchanadigan natijani yozing" },
    { key:"preMoneyValuation", label:"Pre-money baholash", type:"money", w:8, when:equityDeal, v:{gt0:true}, store:{}, hint:"Pre-money baholashni kiriting" },
    /* gt0 rather than min:0.1: offering nothing in exchange for money is the
       contradiction, while offering 70% is a founder handing over control —
       a decision an investor should read on the card, not one the rubric may
       refuse to publish. equityMathConsistent already catches a stake that
       does not match the ask and the pre-money. */
    { key:"equityOfferedPct", label:"Taklif etilayotgan ulush, %", type:"pct", w:8, when:equityDeal, v:{gt0:true,max:100,plaus:[5,35]}, store:{}, hint:"Taklif etilayotgan ulushni foizda kiriting (konvertatsiyada — taxminiy)" },
    { key:"valuationBasis", label:"Baholash asosi", type:"text", w:6, when:equityDeal, v:{min:150,good:350,needs:[{re:/\d/,why:"raqam"}]}, store:{max:3000}, hint:"Baholash nimaga asoslangan — usul va taqqoslamalarni yozing" },
    { key:"exitPaths", label:"Chiqish yoʻllari", type:"list", w:6, when:equityDeal, v:{min:2,itemMin:8}, store:{max:6,itemMax:160}, hint:"Investor qanday chiqadi — kamida 2 ta yoʻlni sanang" },
    { key:"equityMathConsistent", label:"Ulush matematikasi", type:"check", w:4, when:equityDeal, inputs:["preMoneyValuation","askAmount","equityOfferedPct"],
      test: c => { const im = CHK.equityMath(c); return im == null ? null : Math.abs(num(c,"equityOfferedPct") - im) <= 2; },
      args: c => ({ implied: r2(CHK.equityMath(c) || 0), stated: num(c,"equityOfferedPct") || 0 }),
      hint:"Ulush matematikasi mos emas: soʻrov/(pre-money + soʻrov) = {implied}%, siz {stated}% yozdingiz" },
    { key:"securityPackage", label:"Taʼminot paketi", type:"text", w:12, when:debtDeal, v:{min:150,good:350}, store:{max:3000}, hint:"Taʼminot paketini tavsiflang: nima, qancha, kim baholagan" },
    { key:"covenantsAccepted", label:"Kovenantlar", type:"list", w:12, when:debtDeal, v:{min:2,itemMin:8}, store:{max:10,itemMax:200}, hint:"Qabul qilishga tayyor kovenantlarni sanang" },
    { key:"repaymentSource", label:"Qaytarish manbasi", type:"text", w:8, when:debtDeal, v:{min:120,good:280}, store:{max:2500}, hint:"Qarz qaysi pul oqimidan qaytariladi" },
  ],
}, {
  key: "team", weight: 8,
  labelKey: "kap_sec_team", labelUz: "Jamoa va boshqaruv",
  why: "Jamoa tajribasi va boshqaruv tartibi koʻrsatilgan",
  gap: "Jamoa va boshqaruv boʻlimi toʻldirilmagan",
  fields: [
    { key:"team", label:"Jamoa", type:"table", w:26, v:{min:2}, store:{cols:TEAM_COLS,maxRows:24}, hint:"Kamida 2 ta asosiy jamoa aʼzosini tajribasi bilan kiriting" },
    { key:"founderFullTime", label:"Toʻliq bandlikdagi asoschi", type:"check", w:12, inputs:["team"],
      test: c => { const t = rows(c,"team"); return t.length ? t.some(r => r.founder === true && r.fullTime === true) : null; },
      args: c => ({ n: rows(c,"team").filter(r => r.founder === true && r.fullTime === true).length }),
      hint:"Kamida bitta asoschi toʻliq bandligini jadvalda belgilang" },
    { key:"founderCommitment", label:"Asoschilar bandligi", type:"enum", w:10, store:{set:COMMITMENT}, hint:"Asoschilarning bandlik darajasini tanlang" },
    { key:"whyThisTeam", label:"Nega bu jamoa", type:"text", w:14, v:{min:180,good:400}, store:{max:3000}, hint:"Nega aynan bu jamoa buni uddalaydi" },
    { key:"keyGaps", label:"Jamoadagi boʻshliqlar", type:"list", w:10, v:{min:1,itemMin:5}, store:{max:8,itemMax:160}, hint:"Jamoada yetishmayotgan asosiy rollarni sanang" },
    { key:"hiringPlan", label:"Yollash rejasi", type:"table", w:10, v:{min:1}, store:{cols:HIRE_COLS,maxRows:20}, hint:"Yollash rejasini kiriting: rol, qachon, xarajat" },
    { key:"governance", label:"Boshqaruv", type:"text", w:10, v:{min:120,good:280}, store:{max:2500}, hint:"Qarorlar qanday qabul qilinadi — kengash, ovoz, veto huquqlari" },
    { key:"advisors", label:"Maslahatchilar", type:"table", req:false, w:8, v:{min:1}, store:{cols:ADV_COLS,maxRows:15}, hint:"Maslahatchilar/mentorlarni kiriting" },
  ],
}, {
  key: "risk", weight: 6,
  labelKey: "kap_sec_risk", labelUz: "Risk reyestri",
  why: "Risklar toifalari boʻyicha ochiq yozilgan",
  gap: "Risk reyestri toʻldirilmagan",
  fields: [
    { key:"risks", label:"Risklar", type:"table", w:46, v:{min:5}, store:{cols:RISK_COLS,maxRows:30}, hint:"Kamida 5 ta riskni ehtimoli, taʼsiri va yumshatish chorasi bilan kiriting" },
    { key:"riskCategoriesCovered", label:"Risk toifalari qamrovi", type:"check", w:18, inputs:["risks"],
      test: c => { const n = CHK.riskCats(c); return n == null ? null : n >= 4; },
      args: c => ({ n: CHK.riskCats(c) || 0 }),
      hint:"Risklar 4 xil toifani qamrashi kerak — hozir {n} ta toifa" },
    { key:"topRisk", label:"Eng katta risk", type:"text", w:14, v:{min:150,good:320}, store:{max:2500}, hint:"Loyihani oʻldira oladigan bitta asosiy riskni ochiq yozing" },
    { key:"sensitivity", label:"Sezuvchanlik tahlili", type:"table", w:14, v:{min:2}, store:{cols:SENS_COLS,maxRows:15}, hint:"Kamida 2 ta oʻzgaruvchi boʻyicha sezuvchanlik tahlilini kiriting" },
    { key:"insurance", label:"Sugʻurta", type:"text", req:false, w:8, v:{min:60,good:180}, store:{max:1500}, hint:"Sugʻurta qoplamasini tavsiflang (yoki yoʻqligini ayting)" },
  ],
}, {
  key: "dataroom", weight: 8,
  labelKey: "kap_sec_dataroom", labelUz: "Data room va komplayens",
  why: "Data room va komplayens hujjatlari joyida",
  gap: "Data room va komplayens toʻldirilmagan",
  fields: [
    { key:"documents", label:"Hujjatlar", type:"docs", w:26, v:{min: c => requiredDocs(c).length}, store:{maxRows:40}, hint:"Data room hujjatlarini havolasi bilan kiriting" },
    { key:"requiredDocsPresent", label:"Majburiy hujjatlar", type:"check", w:14, inputs:["documents"],
      test: c => { const d = CHK.docs(c); return d == null ? null : (!d.missing.length && !d.dup.length); },
      args: c => { const d = CHK.docs(c); return { missing: d ? d.missing.join(", ") : "", dup: d ? d.dup.length : 0 }; },
      hint:"Majburiy hujjatlar yetishmayapti yoki havolalar takrorlangan: {missing}" },
    { key:"regulated", label:"Litsenziyalanadigan faoliyat", type:"enum", w:6, store:{set:YESNO}, hint:"Faoliyatingiz litsenziyalanadimi" },
    { key:"licences", label:"Litsenziyalar", type:"table", w:10, when: c => c.a.regulated === "yes", v:{min:1}, store:{cols:LIC_COLS,maxRows:20}, hint:"Litsenziya/ruxsatnomalarni raqami va amal muddati bilan kiriting" },
    /* The complement is `!== "yes"`, not `=== "no"`. An unanswered `regulated`
       must still leave the section at 100 — under `=== "no"` the two arms were
       not exact complements and the denominator fell to 90. */
    { key:"noLicenceBasis", label:"Litsenziya talab etilmasligi asosi", type:"text", w:10, when: c => c.a.regulated !== "yes", v:{min:80,good:200}, store:{max:1500}, hint:"Faoliyatingiz nega litsenziyalanmasligini asoslang — qaysi qoidaga koʻra" },
    { key:"litigation", label:"Sud jarayonlari", type:"enum", w:6, store:{set:LITIGATION}, hint:"Sud jarayonlari holatini tanlang" },
    { key:"litigationDetail", label:"Sud jarayoni tafsiloti", type:"text", w:4, v:{min:40,good:120}, store:{max:1500}, hint:"Sud jarayoni mohiyatini va summasini yozing; yoʻq boʻlsa — yoʻqligini yozing" },
    { key:"taxDebt", label:"Soliq qarzi", type:"enum", w:6, store:{set:TAX_DEBT}, hint:"Soliq qarzi holatini tanlang" },
    { key:"relatedParty", label:"Affillangan bitimlar", type:"text", w:6, v:{min:60,good:180}, store:{max:2000}, hint:"Affillangan shaxslar bilan bitimlarni yozing (yoʻq boʻlsa — shunday deb yozing)" },
    { key:"auditStatus", label:"Audit holati", type:"enum", w:6, store:{set:AUDIT_STATUS}, hint:"Audit holatini tanlang" },
    { key:"sanctionsAttest", label:"Sanksiya boʻyicha tasdiq", type:"bool", w:8, store:{}, hint:"Sanksiya roʻyxatlarida emasligingizni tasdiqlang" },
    { key:"dataConsent", label:"Maʼlumot ulashishga rozilik", type:"bool", w:8, store:{}, hint:"Paketni investorlarga koʻrsatishga roziligingizni tasdiqlang" },
  ],
}];

/* One pass fills the defaults and stamps each field with its section, so no
   consumer has to remember that `when` may be undefined or hunt for a field's
   parent. Built as new objects — the literals above are never mutated. */
const SECTIONS = SECTIONS_RAW.map(s => Object.assign({}, s, {
  fields: s.fields.map(f => Object.assign(
    { req: true, when: null, inputs: null, args: null, v: {}, store: {} },
    f, { section: s.key })),
}));

const ALL_FIELDS = SECTIONS.reduce((a, s) => a.concat(s.fields), []);
const FIELDS_BY_KEY = ALL_FIELDS.reduce((m, f) => { m[f.key] = f; return m; }, {});

/* Eight answers without which a pack must not reach investors, whatever the
   arithmetic says. All eight are unconditional, so no branch can dodge one. */
const CRITICAL_FIELDS = ["tin", "encumbranceFree", "capTableBalances", "askAmount",
  "useOfFundsBalances", "requiredDocsPresent", "sanctionsAttest", "dataConsent"];

/* Falsifying one of these is not an edit, it is a retraction of the basis on
   which the pack was shown to anyone — so it pulls the published snapshot
   immediately rather than waiting for the drift timeout. Deliberately short. */
const WITHDRAW_TRIGGERS = ["dataConsent", "sanctionsAttest", "encumbranceFree"];

const OBJECTIVE = new Set(["num", "pct", "money", "int", "year", "enum", "bool",
                           "list", "table", "docs", "check"]);

module.exports = {
  RUBRIC_VERSION, DEAL_KINDS, KAP_STAGES, LEGACY_STAGE, GATE, PUBLISH_MIN,
  SECTIONS, ALL_FIELDS, FIELDS_BY_KEY, CRITICAL_FIELDS, WITHDRAW_TRIGGERS, OBJECTIVE,
  LEGAL_FORMS, REGIONS, PRODUCT_STAGES, IP_STATUS, REVENUE_MODELS, RISK_CATEGORIES,
  COMMITMENT, LITIGATION, TAX_DEBT, AUDIT_STATUS, YESNO, FEASIBILITY, CURRENCIES,
  INSTRUMENTS, ROW_INSTRUMENTS, EQUITY_LIKE, DEBT_LIKE, DOC_KINDS, REQUIRED_DOCS,
  requiredDocs, preRevenue,
  CAP_COLS, ROUND_COLS, COMP_COLS, OFFTAKE_COLS, GROWTH_COLS, PILOT_COLS, FIN_COLS,
  USE_COLS, MILE_COLS, TEAM_COLS, HIRE_COLS, ADV_COLS, RISK_COLS, SENS_COLS,
  DOC_COLS, LIC_COLS,
};
