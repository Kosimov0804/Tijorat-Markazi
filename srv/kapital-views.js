/* ============================================================
   KAPITAL — THE PROJECTIONS, AND THE DISCOVERY SORT

   Four functions and one rule: EVERY PROJECTION IS BUILT, NOT STRIPPED. They
   live in their own file because srv/kapital.js's header states that rule and
   then stood at the 800-line ceiling, and a rule with no room left to obey it is
   how the next field added to the deal row ships itself to somebody who should
   not have it.

   A spread-then-delete projection — Object.assign({}, deal, …) followed by
   `delete out.claimHash` — is a whitelist written backwards: it ships every
   field the row has today AND every field it grows tomorrow, and it is correct
   only for as long as nobody edits the row shape. founderView() was written that
   way, which is how it came to hand the founder `viewers[]`: up to 500
   {id, day} rows naming every investor account that had opened the deal.
   srv/investor.js states the reason that must not happen — who is watching a
   deal is a market signal the platform has not earned the right to hand out —
   and the founder is not an exception to it. The count is the honest answer to
   "is anyone looking", and it is all this file returns.

   Everything kept is deep-copied. store.js's load() hands back the live objects
   the cache is holding, so a shallow copy of `answers`, `contact` or `history`
   is the store's own object travelling out through a JSON response, where a
   caller mutating it mutates the database.
   ============================================================ */
const H = require("./store");
/* One implementation of gate 1's deterministic half, in the file that owns the
   gates. reviewView recomputes it rather than reading the stored {score, at},
   because oversight is deciding NOW and the stored pair is only what the
   founder's last save happened to see. */
const GATES = require("./kapital-gates");

const deep = v => JSON.parse(JSON.stringify(v == null ? null : v));
const now = () => Date.now();

/**
 * The founder's own deal — an EXPLICIT WHITELIST, the same shape feedView has
 * always had, for the same reason. `claimHash` is the secret that proves
 * ownership of a person-tier deal and never leaves the server; `viewers` is
 * projected down to `viewerCount`; a person-tier deal is held on an e-mail claim
 * rather than a verified account, so it carries neither the contact block nor
 * oversight's candid note.
 */
function founderView(d){
  const r = d || {}, screen = r.screen || {};
  const out = {
    id: r.id,
    ownerId: r.ownerId, ownerTier: r.ownerTier, ownerName: r.ownerName, ownerEmail: r.ownerEmail,
    kind: r.kind, stage: r.stage, sector: r.sector, region: r.region,
    instrument: r.instrument, currency: r.currency, ask: H.N(r.ask), valuation: H.N(r.valuation),
    name: r.name, oneLiner: r.oneLiner, summary: r.summary,
    website: r.website, deck: r.deck, marketNote: r.marketNote,
    founders: (r.founders || []).map(f => ({ name: (f || {}).name, role: (f || {}).role })),
    answers: deep(r.answers || {}),
    evidence: (r.evidence || []).map(e => ({ id: e.id, section: e.section, label: e.label,
      url: e.url, t: e.t })),
    score: deep(r.score || null), scorePrev: deep(r.scorePrev || null),
    progressLog: (r.progressLog || []).map(p => ({ d: p.d, overall: p.overall })),
    screen: { score: H.N(screen.score), at: H.N(screen.at) },
    submissionCount: H.N(r.submissionCount), qualify: deep(r.qualify || null),
    status: r.status,
    publishedSnapshot: deep(r.publishedSnapshot || null),
    publishHistory: (r.publishHistory || []).map(h => ({ v: h.v, at: h.at, overallExact: h.overallExact })),
    publishedAt: H.N(r.publishedAt), driftSince: H.N(r.driftSince),
    frozen: r.frozen === true, adminNote: r.adminNote, adminBy: r.adminBy, adminAt: H.N(r.adminAt),
    closeReason: r.closeReason,
    restricted: r.restricted === true, restrictedClearedBy: r.restrictedClearedBy,
    contact: Object.assign({ name: "", email: "", phone: "", telegram: "" }, r.contact || {}),
    consent: deep(r.consent || null), origin: deep(r.origin || null),
    /* The count, never the roster. */
    views: H.N(r.views), viewerCount: (r.viewers || []).length,
    watchers: H.N(r.watchers), talkCount: H.N(r.talkCount),
    history: (r.history || []).map(h => ({ from: h.from, to: h.to, by: h.by, byTier: h.byTier,
      note: h.note, t: h.t })),
    submitted: H.N(r.submitted), created: H.N(r.created), updated: H.N(r.updated),
  };
  if(r.ownerTier === "person"){
    delete out.contact;
    if(out.qualify) out.qualify = Object.assign({}, out.qualify, { note: "" });
  }
  return out;
}

/**
 * What an approved investor sees: an explicit WHITELIST. The omissions are the
 * feature — no answers, no contact, no ownerId/ownerEmail/ownerName, no qualify,
 * no history, no screen, no status. Numbers come from the FROZEN snapshot, never
 * from the working copy the founder may be editing right now.
 */
const feedView = (d, snap) => ({
  id: d.id, kind: d.kind, name: d.name, sector: d.sector, region: d.region, stage: d.stage,
  oneLiner: d.oneLiner, summary: d.summary, website: d.website, deck: d.deck, ask: d.ask,
  currency: d.currency, instrument: d.instrument, valuation: d.valuation, overall: snap.overall,
  overallExact: snap.overallExact, evidenceShare: snap.evidence, publishedV: snap.v,
  sections: (snap.sections || []).map(s => ({ key: s.key, labelKey: "kap_sec_" + s.key, pct: s.pct })),
  evidence: (d.evidence || []).map(e => ({ section: e.section, label: e.label, url: e.url })),
  publishedAt: d.publishedAt, views: d.views, watchers: d.watchers, talkCount: d.talkCount,
});

/** Oversight's view: the founder's document plus the queue metadata. */
const reviewView = d => Object.assign(founderView(d), {
  screen: GATES.screenScore(d),
  idleDays: Math.floor((now() - H.N(d && d.updated)) / 864e5),
});

/* ---------- the discovery sort ----------
   Why this deal, for this investor. It orders the feed; it never decides what is
   IN the feed — the 90% rubric does that. Two traps are closed here.
   H.listFit(need, have) computes 0/1 at FULL confidence when `have` is empty, so
   an investor who declared no sectors lost 40 of 100 fit weight as a hard
   mismatch on every deal, and was told their focus excluded a sector they never
   declared: an undeclared preference is unknown, not a mismatch. And
   coverage(need, have) divides by need.size, so passing the thesis as `need`
   punished a long thesis for its own denominator — the DEAL is the need. */
function feedFit(investorRow, deal){
  /* The thesis block lives on `.raw`. api.js has passed both the raw row and its own wrapper at
     different times, and the wrapper does not crash — it just sorts on nothing and returns every
     deal at one score with confident gap text, which is worse than crashing. Accept either shape. */
  const iv = (investorRow && investorRow.raw) || investorRow || {};
  const has = (list, v) => (list || []).some(x => String(x).toLowerCase() === String(v).toLowerCase());
  const one = (declared, hit) => (declared ? { value: hit, known: true } : { value: 0.5, known: false });
  const tok = H.tokens(iv.thesis || "");
  const f = {
    /* A UZS ask against a USD ticket range is scored unknown, not wrongly: a rate table
       is a separate decision and must not sit under a number a founder is judged by. */
    ticket: deal.currency === iv.currency
      ? H.rangeFit(deal.ask, deal.ask, iv.ticketMin, iv.ticketMax) : { value: 0.5, known: false },
    sector: one((iv.sectors || []).length && deal.sector, has(iv.sectors, deal.sector) ? 1 : 0.25),
    stage: one((iv.stages || []).length, (iv.stages || []).includes(deal.stage) ? 1 : 0.25),
    geo: one((iv.geos || []).length && deal.region, has(iv.geos, deal.region) ? 1 : 0.25),
    instr: one((iv.instruments || []).length, (iv.instruments || []).includes(deal.instrument) ? 1 : 0.3),
    thesis: one(tok.size >= 8, tok.size >= 8
      ? H.coverage(H.tokens([deal.name, deal.oneLiner, deal.summary, deal.sector].join(" ")), tok) : 0),
  };
  const w = (k, weight, why, gap) => ({ weight, value: f[k].value, known: f[k].known, why, gap });
  return H.score([
    w("sector", 25, "Sektor investor fokusiga mos", "Sektor investor fokusidan tashqarida"),
    w("stage", 20, "Bosqich mos", "Bosqich investor mandatidan tashqarida"),
    w("ticket", 20, "So'ralayotgan summa ticket diapazonida", "Summa ticket diapazonidan tashqarida"),
    w("geo", 15, "Hudud qamrovda", "Hudud investor geografiyasidan tashqarida"),
    w("instr", 10, "Instrument mos", "Instrument investor amaliyotiga mos emas"),
    w("thesis", 10, "Tezis bilan mazmunan mos", "Investor tezisi bilan matnli mos kelish topilmadi"),
  ]);
}

module.exports = { founderView, feedView, reviewView, feedFit, deep };
