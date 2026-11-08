/* ============================================================
   MOLIYA BOZORI — loyiha skoringi: HISOB-KITOB YADROSI
   (moliyaviy dvigatel + 8 blokli ball + yo'naltirish)

   Bu fayl ATAYLAB loyiha ildizida turadi, srv/ ichida emas.
   Sabab: metodika maxfiy emas — u "Metodika" sahifasida to'liq
   ochiq ko'rsatiladi, va mijoz tomoni uni sehrgar ichida real
   vaqtda hisoblab turishi kerak (KPI plitkalari, simulyator)
   server bilan har bir tugmada gaplashmasdan.

   Vakolat taqsimoti — srv/moliya-scoring.js bilan bir xil:
     • mijozdagi hisob   → faqat UX tezligi uchun, ko'rsatuv;
     • serverdagi hisob  → yakuniy, rasmiy ball. Saqlanadigan
       yagona ball — server hisoblagani.
   Ikkalasi ham AYNAN shu faylni chaqiradi, shuning uchun
   metodika ikki joyda ayri-ayri yozilib qolmaydi.

   Matnlar: bu yadro tayyor jumla qaytarmaydi. U i18n KALITI va
   parametrlarini qaytaradi ({ key, params }) — moliya-scoring-i18n.js
   dagi ms_* lug'ati uni uz/ru/en ga aylantiradi. Shu sababli til
   almashganda ballarni qayta hisoblash shart emas (havola modulida
   har bir til almashuvida hamma loyiha qayta baholanardi).

   Yuklash tartibi MUHIM: moliya-scoring-config.js DAN KEYIN.
   ============================================================ */
(function (factory) {
  const CONFIG = (typeof module !== "undefined" && module.exports)
    ? require("./moliya-scoring-config.js")
    : (typeof window !== "undefined" ? window.MS_CONFIG : null);
  const api = factory(CONFIG);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.MSCORE = api;
})(function (CONFIG) {
"use strict";

/* =========================================================================
   2-BO'LIM. KICHIK YORDAMCHILAR
   ========================================================================= */
const REF = CONFIG.references;

/** Ro'yxatdan id bo'yicha yozuvni topadi ({uz,ru,en} obyektini qaytaradi). */
function refItem(list, id) {
  return (list || []).find(o => o.id === id) || null;
}
/** Ma'lumotnoma yozuvining berilgan tildagi nomi. */
function L(item, lang) {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item[lang] || item.uz || item.en || "";
}
/** Ball bo'yicha yo'naltirish bosqichini topadi. */
function routingTierFor(total) {
  const list = CONFIG.routing.thresholds;
  return list.find(tr => total >= tr.min && total <= tr.max) || list[list.length - 1];
}
/** Knockout holati — yo'naltirish bosqichlaridan tashqarida turadigan status. */
const KNOCKOUT_STATUS = {
  status: "knockout", color: "rose", action: "reject",
  uz: "MEZONLARGA MOS EMAS", ru: "НЕ СООТВЕТСТВУЕТ КРИТЕРИЯМ", en: "DOES NOT MEET CRITERIA",
};

/* Blok natijasi har doim shu shaklda: matn emas, i18n kaliti + parametrlar.
   Tayyor jumlani mijoz tomoni yasaydi — shuning uchun bitta ball uchta tilda
   bir xil bo'ladi va til almashganda qayta hisoblash kerak emas. */
const R = (key, params) => ({ key: key, params: params || {} });

/* =========================================================================
   3-BO'LIM. MOLIYAVIY HISOB-KITOB DVIGATELI
   ========================================================================= */

/**
 * IRR — Newton-Raphson, konvergensiya bo'lmasa bisection'ga o'tadi.
 * cashflows[0] — boshlang'ich investitsiya (odatda manfiy), keyin yillik FCF.
 * Ishora o'zgarmasa (hammasi musbat yoki hammasi manfiy) IRR mavjud emas → null.
 */
function calcIRR(cashflows) {
  if (!cashflows || cashflows.length < 2) return null;
  /* Aynigan (degenerate) oqim qo'riqchisi. Havola modulida bu yo'q edi va
     bo'sh shakl IRR = 450,5% ko'rsatardi: barcha oqim nol bo'lganda NPV ham
     nol, bisection esa birinchi o'rtadan "ildiz topdim" deb qaytaradi.
     IRR faqat ishora o'zgarganda mavjud — shuni oldindan tekshiramiz. */
  const nz = cashflows.filter(v => v !== 0);
  if (nz.length < 2) return null;
  if (!(nz.some(v => v > 0) && nz.some(v => v < 0))) return null;
  const npvAt = r => cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + r, t), 0);
  const dnpvAt = r => cashflows.reduce((s, cf, t) => s - (t * cf) / Math.pow(1 + r, t + 1), 0);

  let r = 0.1, converged = false;
  for (let i = 0; i < 60; i++) {
    const f = npvAt(r), df = dnpvAt(r);
    if (Math.abs(df) < 1e-10) break;
    const rNext = r - f / df;
    if (!isFinite(rNext) || rNext < -0.999) break;
    if (Math.abs(rNext - r) < 1e-8) { r = rNext; converged = true; break; }
    r = rNext;
  }
  if (converged) return r * 100;

  // Bisection fallback — ishonchli, lekin sekinroq
  let lo = -0.99, hi = 10;
  let flo = npvAt(lo), fhi = npvAt(hi);
  if (isNaN(flo) || isNaN(fhi) || flo * fhi > 0) return null;  // ishora o'zgarmagan
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2, fmid = npvAt(mid);
    if (Math.abs(fmid) < 1e-6) return mid * 100;
    if ((flo < 0) === (fmid < 0)) { lo = mid; flo = fmid; } else { hi = mid; fhi = fmid; }
  }
  return ((lo + hi) / 2) * 100;
}

function calcNPV(cashflows, ratePct) {
  if (!cashflows) return null;
  const r = ratePct / 100;
  return cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + r, t), 0);
}

/** Payback — kumulyativ FCF birinchi marta musbat bo'lgan yilgacha (kasr bilan). */
function calcPayback(cashflows) {
  if (!cashflows || !cashflows.length) return null;
  let cum = cashflows[0];
  if (cum >= 0) return 0;
  for (let t = 1; t < cashflows.length; t++) {
    const prevCum = cum;
    cum += cashflows[t];
    if (cum >= 0) {
      const frac = cashflows[t] === 0 ? 0 : (-prevCum) / cashflows[t];
      return (t - 1) + frac;
    }
  }
  return null;  // muddat ichida qoplanmaydi
}

/** Korxona moliyaviy tarixi bo'yicha avtomatik ko'rsatkichlar. */
function calcHistoryMetrics(history) {
  const src = history || [];
  const rows = src.map((y, i) => {
    const ros = y.tushum ? (y.sofFoyda / y.tushum) * 100 : null;
    const roe = y.ozKapital ? (y.sofFoyda / y.ozKapital) * 100 : null;
    const prev = src[i - 1];
    const growth = (prev && prev.tushum) ? ((y.tushum - prev.tushum) / prev.tushum) * 100 : null;
    return Object.assign({}, y, { ros: ros, roe: roe, growth: growth, rentabelmi: (y.sofFoyda || 0) > 0 });
  });
  return {
    rows: rows,
    profitableYears: rows.filter(r => r.rentabelmi).length,
    filledYears: rows.filter(r => r.tushum || r.sofFoyda || r.ebitda).length,
  };
}

/** DSCR qatorlari: CFADS / (Principal + Interest) har bir yil uchun. */
function calcDSCRSeries(model) {
  const years = (model && model.yillar) || [];
  return years.map(y => {
    const debtService = (y.principal || 0) + (y.interest || 0);
    return {
      yil: y.yil, cfads: y.cfads, principal: y.principal, interest: y.interest,
      debtService: debtService,
      dscr: debtService > 0 ? (y.cfads || 0) / debtService : null,
    };
  });
}

function calcDebtEbitda(history) {
  const list = history || [];
  const last = list[list.length - 1];
  if (!last || !last.ebitda) return null;
  return (last.jamiQarz || 0) / last.ebitda;
}

/** Loyihaning FCF qatoridan tuzilgan kassa oqimi (0-yil = -so'ralayotgan summa). */
function buildFcfCashflows(project) {
  const invest = -((project.passport && project.passport.soralayotganSumma) || 0);
  const years = ((project.financialModel && project.financialModel.yillar) || []).map(y => y.fcf || 0);
  return [invest].concat(years);
}

/** Daromadlilik chegarasi: valyutada 10%, UZS'da MB stavkasi + 8 f.p. */
function getHurdle(project) {
  const m = project.financialModel || {};
  if (project.passport && project.passport.valyuta === "UZS") {
    const mb = (m.mbStavkasi === null || m.mbStavkasi === undefined) ? CONFIG.macro.cbRateUZS : m.mbStavkasi;
    return mb + CONFIG.macro.hurdleLocalSpreadPp;
  }
  return CONFIG.macro.hurdleForeignCcy;
}

/* =========================================================================
   4-BO'LIM. SKORING DVIGATELI — korxona yo'li (8 blok, jami 100 ball)
   ========================================================================= */

function scoreTeo(project) {
  // Diqqat: o'zgaruvchi nomi `teo` — hech qanday global funksiyani to'smaydi.
  const teo = (project.dueDiligence && project.dueDiligence.teoTayyorlovchi) || {};
  const S = CONFIG.scoring.teo;
  if (teo.category === "big5") return { score: S.big5, max: S.big5, reason: R("ms_sc_teo_big5", { name: teo.name }) };
  if (teo.category === "recognized") return { score: S.recognized, max: S.big5, reason: R("ms_sc_teo_recognized", { name: teo.name }) };
  if (teo.category === "internal") return { score: S.internal, max: S.big5, reason: R("ms_sc_teo_internal") };
  return { score: S.none, max: S.big5, reason: R("ms_sc_teo_none") };
}

function scoreAudit(project) {
  const a = (project.dueDiligence && project.dueDiligence.audit) || {};
  const S = CONFIG.scoring.audit;
  const isBig5Auditor = REF.consultants.big5.indexOf(a.auditor) !== -1;
  if ((a.yillarSoni || 0) >= 3 && a.xulosaTuri === "toza" && isBig5Auditor)
    return { score: S.threeYearCleanBig5, max: S.threeYearCleanBig5, reason: R("ms_sc_audit_b5", { name: a.auditor }) };
  if ((a.yillarSoni || 0) >= 3 && a.xulosaTuri === "toza")
    return { score: S.threeYearCleanOther, max: S.threeYearCleanBig5, reason: R("ms_sc_audit_other", { name: a.auditor || "—" }) };
  if ((a.yillarSoni || 0) >= 1)
    return { score: S.oneToTwoYear, max: S.threeYearCleanBig5, reason: R("ms_sc_audit_years", { n: a.yillarSoni }) };
  if (a.contractSigned)
    return { score: S.contractSignedInProgress, max: S.threeYearCleanBig5, reason: R("ms_sc_audit_signed") };
  return { score: S.none, max: S.threeYearCleanBig5, reason: R("ms_sc_audit_none") };
}

function scoreContinuity(project, hist) {
  const S = CONFIG.scoring.continuity;
  const opYears = (project.passport && project.passport.faoliyatYillari) || 0;
  const max = S.threeYearsThreeProfitable;
  if (opYears < 1 && hist.filledYears === 0) return { score: S.greenfield, max: max, reason: R("ms_sc_cont_none") };
  if (opYears >= 3 && hist.profitableYears === 3) return { score: S.threeYearsThreeProfitable, max: max, reason: R("ms_sc_cont_33", { n: opYears }) };
  if (opYears >= 3 && hist.profitableYears === 2) return { score: S.threeYearsTwoProfitable, max: max, reason: R("ms_sc_cont_32", { n: opYears }) };
  if (hist.profitableYears >= 1) return { score: S.oneYearProfitable, max: max, reason: R("ms_sc_cont_1") };
  return { score: S.greenfield, max: max, reason: R("ms_sc_cont_unconfirmed") };
}

function scoreNetProfit(hist) {
  const S = CONFIG.scoring.netProfit;
  const n = hist.profitableYears;
  if (n === 3) return { score: S.threeYears, max: S.threeYears, reason: R("ms_sc_np_3") };
  if (n === 2) return { score: S.twoYears, max: S.threeYears, reason: R("ms_sc_np_2") };
  if (n === 1) return { score: S.oneYear, max: S.threeYears, reason: R("ms_sc_np_1") };
  return { score: S.none, max: S.threeYears, reason: R("ms_sc_np_0") };
}

function scoreDueDiligence(project) {
  const S = CONFIG.scoring.dueDiligence;
  const dd = project.dueDiligence || {};
  const areas = dd.ddYonalishlari || {};
  const areaIds = REF.ddAreas.map(a => a.id);
  const doneAreas = areaIds.filter(id => areas[id] && areas[id].status === "done");
  const doneBig5 = doneAreas.filter(id => REF.consultants.big5.indexOf(areas[id].performer) !== -1);
  const legalDone = areas.legal && areas.legal.status === "done";
  const teoRecognized = ["big5", "recognized"].indexOf((dd.teoTayyorlovchi || {}).category) !== -1;
  const anyPlanned = areaIds.some(id => areas[id] && areas[id].status === "planned");

  if (doneBig5.length === 6) return { score: S.allSixBig5, max: S.allSixBig5, reason: R("ms_sc_dd_all") };
  if (doneAreas.length >= 3) return { score: S.threeToFive, max: S.allSixBig5, reason: R("ms_sc_dd_some", { n: doneAreas.length }) };
  if (doneAreas.length < 3 && legalDone && teoRecognized) return { score: S.onlyConsultingLegal, max: S.allSixBig5, reason: R("ms_sc_dd_legal") };
  if (dd.torTasdiqlangan && anyPlanned) return { score: S.plannedApproved, max: S.allSixBig5, reason: R("ms_sc_dd_planned") };
  return { score: S.none, max: S.allSixBig5, reason: R("ms_sc_dd_none") };
}

function scoreIrr(irr, hurdle) {
  const S = CONFIG.scoring.irr;
  const max = S.hurdlePlus8pp;
  if (irr === null) return { score: S.belowMore, max: max, reason: R("ms_sc_irr_failed") };
  const diff = irr - hurdle;
  if (diff >= 8) return { score: S.hurdlePlus8pp, max: max, reason: R("ms_sc_irr_above", { irr: irr, hurdle: hurdle, diff: diff }) };
  if (diff >= 4) return { score: S.hurdlePlus4pp, max: max, reason: R("ms_sc_irr_above", { irr: irr, hurdle: hurdle, diff: diff }) };
  if (diff >= 0) return { score: S.atHurdle, max: max, reason: R("ms_sc_irr_at", { irr: irr, hurdle: hurdle }) };
  if (diff >= -2) return { score: S.belowUpTo2pp, max: max, reason: R("ms_sc_irr_below", { irr: irr, diff: -diff }) };
  return { score: S.belowMore, max: max, reason: R("ms_sc_irr_below_more", { irr: irr, hurdle: hurdle }) };
}

function scoreDebtBurden(debtEbitda, dscrMin) {
  const S = CONFIG.scoring.debtBurden;
  let deScore, deReason;
  if (debtEbitda === null) { deScore = 0; deReason = R("ms_sc_de_na"); }
  else if (debtEbitda <= 1.5) { deScore = S.debtEbitda.le1_5; deReason = R("ms_sc_de_below", { v: debtEbitda, limit: 1.5 }); }
  else if (debtEbitda <= 2.5) { deScore = S.debtEbitda.le2_5; deReason = R("ms_sc_de_below", { v: debtEbitda, limit: 2.5 }); }
  else if (debtEbitda <= 3.0) { deScore = S.debtEbitda.le3_0; deReason = R("ms_sc_de_below", { v: debtEbitda, limit: 3 }); }
  else { deScore = S.debtEbitda.above3_0; deReason = R("ms_sc_de_above", { v: debtEbitda }); }

  let dsScore, dsReason;
  if (dscrMin === null) { dsScore = 0; dsReason = R("ms_sc_dscr_na"); }
  else if (dscrMin >= 1.8) { dsScore = S.dscr.ge1_8; dsReason = R("ms_sc_dscr_above", { v: dscrMin, limit: 1.8 }); }
  else if (dscrMin >= 1.5) { dsScore = S.dscr.ge1_5; dsReason = R("ms_sc_dscr_above", { v: dscrMin, limit: 1.5 }); }
  else if (dscrMin >= 1.2) { dsScore = S.dscr.ge1_2; dsReason = R("ms_sc_dscr_above", { v: dscrMin, limit: 1.2 }); }
  else { dsScore = S.dscr.below1_2; dsReason = R("ms_sc_dscr_below", { v: dscrMin }); }

  return {
    score: deScore + dsScore,
    max: S.debtEbitda.le1_5 + S.dscr.ge1_8,
    sub: {
      debtEbitda: { score: deScore, max: S.debtEbitda.le1_5, reason: deReason },
      dscr: { score: dsScore, max: S.dscr.ge1_8, reason: dsReason },
    },
    /* Ikki yarim blok bitta kartochkada ko'rsatiladi — izoh ham ikkitasi. */
    reason: deReason, reason2: dsReason,
  };
}

function scoreExit(project) {
  const e = (project.dueDiligence && project.dueDiligence.exit) || {};
  const S = CONFIG.scoring.exit;
  const max = S.fullContractFormulaTerm;
  if (!e.turi) return { score: S.none, max: max, reason: R("ms_sc_exit_none") };
  if (e.shartnomaLoyihasi && e.narxFormulasi && e.muddat) return { score: S.fullContractFormulaTerm, max: max, reason: R("ms_sc_exit_full") };
  if (e.narxFormulasi) return { score: S.generalDescriptionNoFormula, max: max, reason: R("ms_sc_exit_formula") };
  if (e.muddat || e.tavsif) return { score: S.generalDescriptionNoFormula, max: max, reason: R("ms_sc_exit_general") };
  return { score: S.intentOnly, max: max, reason: R("ms_sc_exit_intent") };
}

/** Company-level (korxona) metodikasi — 8 blok, qattiq knockout mezonlari bilan. */
function scoreCompanyProject(project) {
  const hist = calcHistoryMetrics(project.financialHistory);
  const cashflows = buildFcfCashflows(project);
  const model = project.financialModel || {};
  const irr = calcIRR(cashflows);
  const npv = calcNPV(cashflows, model.diskontStavkasi);
  const payback = calcPayback(cashflows);
  const hurdle = getHurdle(project);
  const debtEbitda = calcDebtEbitda(project.financialHistory);
  const dscrSeries = calcDSCRSeries(model);
  const dscrValues = dscrSeries.map(d => d.dscr).filter(v => v !== null && isFinite(v));
  const dscrMin = dscrValues.length ? Math.min.apply(null, dscrValues) : null;
  const dscrAvg = dscrValues.length ? dscrValues.reduce((a, b) => a + b, 0) / dscrValues.length : null;

  const block = (labelKey, res) => Object.assign({ labelKey: labelKey }, res);
  const breakdown = {
    teo: block("ms_block_teo", scoreTeo(project)),
    audit: block("ms_block_audit", scoreAudit(project)),
    continuity: block("ms_block_continuity", scoreContinuity(project, hist)),
    netProfit: block("ms_block_net_profit", scoreNetProfit(hist)),
    dueDiligence: block("ms_block_dd", scoreDueDiligence(project)),
    irr: block("ms_block_irr", scoreIrr(irr, hurdle)),
    debtBurden: block("ms_block_debt_burden", scoreDebtBurden(debtEbitda, dscrMin)),
    exit: block("ms_block_exit", scoreExit(project)),
  };

  const rawTotal = Object.keys(breakdown).reduce((s, k) => s + breakdown[k].score, 0);

  const knockouts = [];
  if (irr === null || irr < hurdle) knockouts.push("irr_below_hurdle");
  if (debtEbitda === null || debtEbitda > 3.0) knockouts.push("debt_ebitda_high");
  if (dscrMin === null || dscrMin < 1.2) knockouts.push("dscr_low");
  if (hist.profitableYears === 0) knockouts.push("no_net_profit_3y");
  if (!project.dueDiligence || !project.dueDiligence.exit || !project.dueDiligence.exit.turi) knockouts.push("no_exit_strategy");

  const isKnockout = knockouts.length > 0;
  const total = isKnockout ? Math.min(rawTotal, CONFIG.knockout.capScore) : rawTotal;
  const tier = routingTierFor(total);

  return {
    total: total, rawTotal: rawTotal, breakdown: breakdown,
    knockouts: knockouts.map(id => CONFIG.knockout.rules.find(r => r.id === id)),
    isKnockout: isKnockout,
    routingStatus: isKnockout ? KNOCKOUT_STATUS : tier,
    kpis: { irr: irr, npv: npv, payback: payback, debtEbitda: debtEbitda,
            dscrMin: dscrMin, dscrAvg: dscrAvg, hurdle: hurdle, dscrSeries: dscrSeries },
    hist: hist, projectType: "company",
  };
}

/* =========================================================================
   5-BO'LIM. SKORING DVIGATELI — startup yo'li
   MUHIM: bu yerda QATTIQ KNOCKOUT MEXANIZMI YO'Q. Startup xususiyatidan
   kelib chiqib (moliyaviy tarix, audit, DSCR talab qilinmaydi) faqat 8 ta
   sifat mezonining tanlangan darajasi ballga ta'sir qiladi. Natija hech
   qachon "MEZONLARGA MOS EMAS" bloklanishiga uchramaydi.
   ========================================================================= */
function scoreStartupProject(project) {
  const si = project.startupInfo || {};
  const S = CONFIG.startupScoring;

  /* Tanlangan darajaga qarab ball va asoslash kaliti. */
  const pick = (table, key, max, refList, labelKey, valueLabelKey) => {
    const k = key || "none";
    const score = table[k] === undefined ? 0 : table[k];
    const item = refItem(refList, k);
    return {
      score: score, max: max,
      reason: R("ms_sc_startup_reason", { label: valueLabelKey, valueRef: item ? item.id : "", value: item }),
      labelKey: labelKey,
    };
  };

  const B = (blockKey, labelKey, table, key, max, refList, valueLabelKey) =>
    Object.assign({ labelKey: labelKey }, pick(table, key, max, refList, labelKey, valueLabelKey));

  const breakdown = {
    team:      B("team", "ms_block_team", S.team, si.jamoaTajribasi, S.weights.team, REF.teamExperience, "ms_sc_label_team"),
    product:   B("product", "ms_block_product", S.product, si.mahsulotBosqichi, S.weights.product, REF.productStage, "ms_sc_label_product"),
    market:    B("market", "ms_block_market", S.market, si.bozorValidatsiyasi, S.weights.market, REF.marketValidation, "ms_sc_label_market"),
    funding:   B("funding", "ms_block_funding", S.funding, si.moliyalashtirishTarixi, S.weights.funding, REF.fundingHistory, "ms_sc_label_funding"),
    finModel:  B("finModel", "ms_block_fin_model", S.finModel, si.moliyaviyModelSifati, S.weights.finModel, REF.startupFinModelQuality, "ms_sc_label_fin_model"),
    potential: B("potential", "ms_block_potential", S.potential, si.daromadlilikSalohiyati, S.weights.potential, REF.potentialTiers, "ms_sc_label_potential"),
    legal:     B("legal", "ms_block_legal", S.legal, si.huquqiyIpHolati, S.weights.legal, REF.legalIpStatus, "ms_sc_label_legal"),
    exit:      B("exit", "ms_block_next_exit", S.exit, si.keyingiBosqichExit, S.weights.exit, REF.nextStageExit, "ms_sc_label_exit"),
  };

  const total = Object.keys(breakdown).reduce((s, k) => s + breakdown[k].score, 0);
  const tier = routingTierFor(total);

  /* Moliyaviy model (agar to'ldirilgan bo'lsa) — faqat ma'lumot uchun, ballga
     ta'sir qilmaydi. */
  const model = project.financialModel || {};
  const cashflows = buildFcfCashflows(project);
  const hasModel = (model.yillar || []).some(y => y.fcf !== null && y.fcf !== undefined);

  return {
    total: total, rawTotal: total, breakdown: breakdown,
    knockouts: [], isKnockout: false, routingStatus: tier,
    kpis: {
      irr: hasModel ? calcIRR(cashflows) : null,
      npv: hasModel ? calcNPV(cashflows, model.diskontStavkasi) : null,
      payback: hasModel ? calcPayback(cashflows) : null,
      debtEbitda: null, dscrMin: null, dscrAvg: null, hurdle: null, dscrSeries: [],
    },
    hist: null, projectType: "startup",
  };
}

/** Asosiy kirish nuqtasi — loyiha turiga qarab mos metodikaga yo'naltiradi. */
function scoreProject(project) {
  if (project && project.passport && project.passport.loyihaTuri === "startup") return scoreStartupProject(project);
  return scoreCompanyProject(project);
}

/* =========================================================================
   6-BO'LIM. KAMCHILIKLAR VA TAVSIYALAR (gap analysis)
   Har bir blok bo'yicha "keyingi pog'onaga o'tish" tavsiyasi, eng katta
   yutuq beradigan tavsiya birinchi bo'lib turadi.
   ========================================================================= */
/* Bloklarning KO'RSATILISH tartibi — metodikadagi 1..8 raqamlash.
   Object.keys(breakdown) ga tayanib bo'lmaydi: ball serverda JSONB
   ustunida saqlanadi va Postgres obyekt kalitlarini uzunlik, keyin bayt
   bo'yicha qayta tartiblab qaytaradi. */
const BLOCK_ORDER = {
  company: ["teo", "audit", "continuity", "netProfit", "dueDiligence", "irr", "debtBurden", "exit"],
  startup: ["team", "product", "market", "funding", "finModel", "potential", "legal", "exit"],
};

/** Bloklar [kalit, blok] juftliklari ko'rinishida, TO'G'RI tartibda. */
function orderedBlocks(scoring) {
  const order = BLOCK_ORDER[scoring.projectType === "startup" ? "startup" : "company"];
  const b = scoring.breakdown || {};
  const seen = {};
  const out = [];
  order.forEach(k => { if (b[k]) { seen[k] = 1; out.push([k, b[k]]); } });
  /* Ro'yxatdan tashqarida qolgani bo'lsa ham tushib qolmasin. */
  Object.keys(b).forEach(k => { if (!seen[k]) out.push([k, b[k]]); });
  return out;
}

const COMPANY_GAP_KEYS = [
  ["teo", "ms_sg_teo"], ["audit", "ms_sg_audit"], ["continuity", "ms_sg_continuity"],
  ["netProfit", "ms_sg_net_profit"], ["dueDiligence", "ms_sg_dd"], ["irr", "ms_sg_irr"],
  ["exit", "ms_sg_exit"],
];
const STARTUP_GAP_KEYS = [
  ["team", "ms_sg_s_team"], ["product", "ms_sg_s_product"], ["market", "ms_sg_s_market"],
  ["funding", "ms_sg_s_funding"], ["finModel", "ms_sg_s_fin_model"], ["potential", "ms_sg_s_potential"],
  ["legal", "ms_sg_s_legal"], ["exit", "ms_sg_s_exit"],
];

function nextTierSuggestions(scoring) {
  const b = scoring.breakdown, list = [];
  const add = (block, key) => { if (block && block.score < block.max) list.push({ gap: block.max - block.score, key: key }); };

  if (scoring.projectType === "startup") {
    STARTUP_GAP_KEYS.forEach(p => add(b[p[0]], p[1]));
  } else {
    COMPANY_GAP_KEYS.forEach(p => add(b[p[0]], p[1]));
    /* Qarz yuki bitta blok, ikkita yarim mezon — tavsiyalar ham alohida. */
    if (b.debtBurden && b.debtBurden.sub) {
      add(b.debtBurden.sub.debtEbitda, "ms_sg_debt_ebitda");
      add(b.debtBurden.sub.dscr, "ms_sg_dscr");
    }
  }
  return list.sort((a, z) => z.gap - a.gap);
}

/* =========================================================================
   7-BO'LIM. MOSLASHTIRISH (ROUTING) DVIGATELI
   ========================================================================= */
function toUsdEquivalent(amount, ccy) {
  const rate = CONFIG.macro.fxToUsd[ccy] || 1;
  return (amount || 0) * rate;
}

/**
 * Loyihani institutlar reyestriga solishtiradi. `registry` berilmasa
 * CONFIG.institutions (urug' ro'yxat) ishlatiladi; server jonli
 * provayderlarni qo'shib to'ldirilgan reyestrni uzatadi.
 * Har bir institut 5 ta mezon bo'yicha tekshiriladi — natija foizda.
 */
function matchInstitutions(project, scoring, registry) {
  const p = project.passport || {};
  const list = registry && registry.length ? registry : CONFIG.institutions;
  const summaUsd = toUsdEquivalent(p.soralayotganSumma, p.valyuta);

  return list.map(inst => {
    const checks = {
      summa: summaUsd >= inst.min_summa && summaUsd <= inst.max_summa,
      valyuta: (inst.valyutalar || []).indexOf(p.valyuta) !== -1,
      sektor: !(inst.sektorlar || []).length || inst.sektorlar.indexOf(p.sektor) !== -1,
      muddat: (p.muddat || 0) <= inst.max_muddat,
      ball: scoring.total >= inst.min_ball,
    };
    const passed = Object.keys(checks).filter(k => checks[k]).length;
    return {
      inst: inst, checks: checks,
      matchPercent: Math.round((passed / 5) * 100),
      fullMatch: passed === 5 && !scoring.isKnockout,
    };
  }).sort((a, z) => z.matchPercent - a.matchPercent);
}

/** Yo'naltirish umuman ochiqmi: 75+ ball va knockout yo'q. */
function routingUnlocked(scoring) {
  return !scoring.isKnockout && scoring.total >= CONFIG.routing.unlockScore;
}

/* =========================================================================
   8-BO'LIM. BO'SH LOYIHA SHAKLI
   Bitta joyda turadi, chunki mijoz sehrgari ham, server validatsiyasi ham
   aynan shu maydonlar to'plamini kutadi.
   ========================================================================= */
function blankProject() {
  return {
    status: "draft",
    passport: {
      loyihaTuri: "company", nomi: "", stir: "",
      sektor: REF.sectors[0].id, hudud: REF.regions[0].id,
      umumiyQiymat: null, soralayotganSumma: null, valyuta: "UZS",
      muddat: 5, moliyalashtirishTuri: "kredit",
      tashabbuskorUlushi: null, faoliyatYillari: 0,
    },
    startupInfo: {
      jamoaTajribasi: "none", jamoaTavsifi: "",
      mahsulotBosqichi: "idea", mahsulotTavsifi: "",
      bozorValidatsiyasi: "none", moliyalashtirishTarixi: "none",
      moliyaviyModelSifati: "none", daromadlilikSalohiyati: "unclear",
      huquqiyIpHolati: "none", keyingiBosqichExit: "none",
    },
    financialHistory: [3, 2, 1].map(n => ({
      yil: n, tushum: null, ebitda: null, sofFoyda: null,
      jamiQarz: null, jamiAktivlar: null, ozKapital: null,
    })),
    financialModel: {
      diskontStavkasi: CONFIG.macro.defaultDiscountRate,
      mbStavkasi: CONFIG.macro.cbRateUZS,
      yillar: [1, 2, 3].map(y => ({ yil: y, fcf: null, cfads: null, principal: null, interest: null })),
    },
    dueDiligence: {
      teoTayyorlovchi: { category: "none", name: "" },
      audit: { yillarSoni: 0, auditor: "", xulosaTuri: "", contractSigned: false },
      ddYonalishlari: REF.ddAreas.reduce((o, a) => { o[a.id] = { status: "none", performer: "" }; return o; }, {}),
      torTasdiqlangan: false,
      yuridikKompaniya: "",
      exit: { turi: "", narxFormulasi: "", muddat: null, shartnomaLoyihasi: false, tavsif: "" },
    },
    documents: [],
    scoring: null,
  };
}

return {
  CONFIG: CONFIG,
  KNOCKOUT_STATUS: KNOCKOUT_STATUS,
  BLOCK_ORDER: BLOCK_ORDER, orderedBlocks: orderedBlocks,
  refItem: refItem, L: L,
  calcIRR: calcIRR, calcNPV: calcNPV, calcPayback: calcPayback,
  calcHistoryMetrics: calcHistoryMetrics, calcDSCRSeries: calcDSCRSeries,
  calcDebtEbitda: calcDebtEbitda, buildFcfCashflows: buildFcfCashflows,
  getHurdle: getHurdle, routingTierFor: routingTierFor,
  scoreProject: scoreProject,
  scoreCompanyProject: scoreCompanyProject,
  scoreStartupProject: scoreStartupProject,
  nextTierSuggestions: nextTierSuggestions,
  toUsdEquivalent: toUsdEquivalent,
  matchInstitutions: matchInstitutions,
  routingUnlocked: routingUnlocked,
  blankProject: blankProject,
};
});
