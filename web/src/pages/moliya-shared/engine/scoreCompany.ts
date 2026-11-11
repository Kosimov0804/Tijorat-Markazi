import { CONFIG, REF } from "./config";
import {
  buildFcfCashflows,
  calcDSCRSeries,
  calcDebtEbitda,
  calcHistoryMetrics,
  calcIRR,
  calcNPV,
  calcPayback,
  getHurdle,
} from "./finance";
import { KNOCKOUT_STATUS, reasonOf as R, routingTierFor } from "./refs";
import type { HistoryMetrics, ProjectInput, Reason, ScoreBlock, Scoring, SubBlock } from "./types";

const S = CONFIG.scoring;
const isBig5 = (name: string | undefined): boolean => REF.consultants.big5.indexOf(name as string) !== -1;

function scoreTeo(project: ProjectInput): SubBlock {
  const teo = project.dueDiligence?.teoTayyorlovchi ?? {};
  const max = S.teo.big5;
  if (teo.category === "big5") return { score: S.teo.big5, max, reason: R("ms_sc_teo_big5", { name: teo.name }) };
  if (teo.category === "recognized")
    return { score: S.teo.recognized, max, reason: R("ms_sc_teo_recognized", { name: teo.name }) };
  if (teo.category === "internal") return { score: S.teo.internal, max, reason: R("ms_sc_teo_internal") };
  return { score: S.teo.none, max, reason: R("ms_sc_teo_none") };
}

function scoreAudit(project: ProjectInput): SubBlock {
  const audit = project.dueDiligence?.audit ?? {};
  const max = S.audit.threeYearCleanBig5;
  const years = audit.yillarSoni || 0;
  if (years >= 3 && audit.xulosaTuri === "toza" && isBig5(audit.auditor))
    return { score: S.audit.threeYearCleanBig5, max, reason: R("ms_sc_audit_b5", { name: audit.auditor }) };
  if (years >= 3 && audit.xulosaTuri === "toza")
    return { score: S.audit.threeYearCleanOther, max, reason: R("ms_sc_audit_other", { name: audit.auditor || "—" }) };
  if (years >= 1) return { score: S.audit.oneToTwoYear, max, reason: R("ms_sc_audit_years", { n: audit.yillarSoni }) };
  if (audit.contractSigned) return { score: S.audit.contractSignedInProgress, max, reason: R("ms_sc_audit_signed") };
  return { score: S.audit.none, max, reason: R("ms_sc_audit_none") };
}

function scoreContinuity(project: ProjectInput, hist: HistoryMetrics): SubBlock {
  const tiers = S.continuity;
  const max = tiers.threeYearsThreeProfitable;
  const years = project.passport?.faoliyatYillari || 0;
  if (years < 1 && hist.filledYears === 0) return { score: tiers.greenfield, max, reason: R("ms_sc_cont_none") };
  if (years >= 3 && hist.profitableYears === 3)
    return { score: tiers.threeYearsThreeProfitable, max, reason: R("ms_sc_cont_33", { n: years }) };
  if (years >= 3 && hist.profitableYears === 2)
    return { score: tiers.threeYearsTwoProfitable, max, reason: R("ms_sc_cont_32", { n: years }) };
  if (hist.profitableYears >= 1) return { score: tiers.oneYearProfitable, max, reason: R("ms_sc_cont_1") };
  return { score: tiers.greenfield, max, reason: R("ms_sc_cont_unconfirmed") };
}

function scoreNetProfit(hist: HistoryMetrics): SubBlock {
  const tiers = S.netProfit;
  const max = tiers.threeYears;
  if (hist.profitableYears === 3) return { score: tiers.threeYears, max, reason: R("ms_sc_np_3") };
  if (hist.profitableYears === 2) return { score: tiers.twoYears, max, reason: R("ms_sc_np_2") };
  if (hist.profitableYears === 1) return { score: tiers.oneYear, max, reason: R("ms_sc_np_1") };
  return { score: tiers.none, max, reason: R("ms_sc_np_0") };
}

function scoreDueDiligence(project: ProjectInput): SubBlock {
  const tiers = S.dueDiligence;
  const max = tiers.allSixBig5;
  const dd = project.dueDiligence ?? {};
  const areas = dd.ddYonalishlari ?? {};
  const areaIds = REF.ddAreas.map(area => area.id);
  const done = areaIds.filter(id => areas[id]?.status === "done");
  const doneBig5 = done.filter(id => isBig5(areas[id]?.performer));
  const isLegalDone = areas.legal?.status === "done";
  const isTeoRecognized = ["big5", "recognized"].indexOf(dd.teoTayyorlovchi?.category as string) !== -1;
  const isAnyPlanned = areaIds.some(id => areas[id]?.status === "planned");

  if (doneBig5.length === 6) return { score: tiers.allSixBig5, max, reason: R("ms_sc_dd_all") };
  if (done.length >= 3) return { score: tiers.threeToFive, max, reason: R("ms_sc_dd_some", { n: done.length }) };
  if (isLegalDone && isTeoRecognized) return { score: tiers.onlyConsultingLegal, max, reason: R("ms_sc_dd_legal") };
  if (dd.torTasdiqlangan && isAnyPlanned) return { score: tiers.plannedApproved, max, reason: R("ms_sc_dd_planned") };
  return { score: tiers.none, max, reason: R("ms_sc_dd_none") };
}

function scoreIrr(irr: number | null, hurdle: number): SubBlock {
  const tiers = S.irr;
  const max = tiers.hurdlePlus8pp;
  if (irr === null) return { score: tiers.belowMore, max, reason: R("ms_sc_irr_failed") };
  const diff = irr - hurdle;
  if (diff >= 8) return { score: tiers.hurdlePlus8pp, max, reason: R("ms_sc_irr_above", { irr, hurdle, diff }) };
  if (diff >= 4) return { score: tiers.hurdlePlus4pp, max, reason: R("ms_sc_irr_above", { irr, hurdle, diff }) };
  if (diff >= 0) return { score: tiers.atHurdle, max, reason: R("ms_sc_irr_at", { irr, hurdle }) };
  if (diff >= -2) return { score: tiers.belowUpTo2pp, max, reason: R("ms_sc_irr_below", { irr, diff: -diff }) };
  return { score: tiers.belowMore, max, reason: R("ms_sc_irr_below_more", { irr, hurdle }) };
}

function debtEbitdaHalf(value: number | null): SubBlock {
  const tiers = S.debtBurden.debtEbitda;
  const max = tiers.le1_5;
  if (value === null) return { score: 0, max, reason: R("ms_sc_de_na") };
  if (value <= 1.5) return { score: tiers.le1_5, max, reason: R("ms_sc_de_below", { v: value, limit: 1.5 }) };
  if (value <= 2.5) return { score: tiers.le2_5, max, reason: R("ms_sc_de_below", { v: value, limit: 2.5 }) };
  if (value <= 3.0) return { score: tiers.le3_0, max, reason: R("ms_sc_de_below", { v: value, limit: 3 }) };
  return { score: tiers.above3_0, max, reason: R("ms_sc_de_above", { v: value }) };
}

function dscrHalf(value: number | null): SubBlock {
  const tiers = S.debtBurden.dscr;
  const max = tiers.ge1_8;
  if (value === null) return { score: 0, max, reason: R("ms_sc_dscr_na") };
  if (value >= 1.8) return { score: tiers.ge1_8, max, reason: R("ms_sc_dscr_above", { v: value, limit: 1.8 }) };
  if (value >= 1.5) return { score: tiers.ge1_5, max, reason: R("ms_sc_dscr_above", { v: value, limit: 1.5 }) };
  if (value >= 1.2) return { score: tiers.ge1_2, max, reason: R("ms_sc_dscr_above", { v: value, limit: 1.2 }) };
  return { score: tiers.below1_2, max, reason: R("ms_sc_dscr_below", { v: value }) };
}

type DebtBlock = SubBlock & { sub: NonNullable<ScoreBlock["sub"]>; reason2: Reason };

function scoreDebtBurden(debtEbitda: number | null, dscrMin: number | null): DebtBlock {
  const de = debtEbitdaHalf(debtEbitda);
  const ds = dscrHalf(dscrMin);
  return {
    score: de.score + ds.score,
    max: de.max + ds.max,
    sub: { debtEbitda: de, dscr: ds },
    reason: de.reason,
    reason2: ds.reason,
  };
}

function scoreExit(project: ProjectInput): SubBlock {
  const exit = project.dueDiligence?.exit ?? {};
  const tiers = S.exit;
  const max = tiers.fullContractFormulaTerm;
  if (!exit.turi) return { score: tiers.none, max, reason: R("ms_sc_exit_none") };
  if (exit.shartnomaLoyihasi && exit.narxFormulasi && exit.muddat)
    return { score: tiers.fullContractFormulaTerm, max, reason: R("ms_sc_exit_full") };
  if (exit.narxFormulasi) return { score: tiers.generalDescriptionNoFormula, max, reason: R("ms_sc_exit_formula") };
  if (exit.muddat || exit.tavsif)
    return { score: tiers.generalDescriptionNoFormula, max, reason: R("ms_sc_exit_general") };
  return { score: tiers.intentOnly, max, reason: R("ms_sc_exit_intent") };
}

interface Measures {
  irr: number | null;
  hurdle: number;
  debtEbitda: number | null;
  dscrMin: number | null;
}

function knockoutIds(project: ProjectInput, hist: HistoryMetrics, m: Measures): string[] {
  const ids: string[] = [];
  if (m.irr === null || m.irr < m.hurdle) ids.push("irr_below_hurdle");
  if (m.debtEbitda === null || m.debtEbitda > 3.0) ids.push("debt_ebitda_high");
  if (m.dscrMin === null || m.dscrMin < 1.2) ids.push("dscr_low");
  if (hist.profitableYears === 0) ids.push("no_net_profit_3y");
  if (!project.dueDiligence?.exit?.turi) ids.push("no_exit_strategy");
  return ids;
}

/** The company methodology: eight blocks with hard knockout criteria. */
export function scoreCompanyProject(project: ProjectInput): Scoring {
  const hist = calcHistoryMetrics(project.financialHistory);
  const cashflows = buildFcfCashflows(project);
  const model = project.financialModel ?? {};
  const irr = calcIRR(cashflows);
  const hurdle = getHurdle(project);
  const debtEbitda = calcDebtEbitda(project.financialHistory);
  const dscrSeries = calcDSCRSeries(model);
  const dscrValues = dscrSeries.map(row => row.dscr).filter((v): v is number => v !== null && isFinite(v));
  const dscrMin = dscrValues.length ? Math.min(...dscrValues) : null;
  const dscrAvg = dscrValues.length ? dscrValues.reduce((a, b) => a + b, 0) / dscrValues.length : null;

  const block = (labelKey: string, result: SubBlock): ScoreBlock => ({ labelKey, ...result });
  const breakdown: Record<string, ScoreBlock> = {
    teo: block("ms_block_teo", scoreTeo(project)),
    audit: block("ms_block_audit", scoreAudit(project)),
    continuity: block("ms_block_continuity", scoreContinuity(project, hist)),
    netProfit: block("ms_block_net_profit", scoreNetProfit(hist)),
    dueDiligence: block("ms_block_dd", scoreDueDiligence(project)),
    irr: block("ms_block_irr", scoreIrr(irr, hurdle)),
    debtBurden: block("ms_block_debt_burden", scoreDebtBurden(debtEbitda, dscrMin)),
    exit: block("ms_block_exit", scoreExit(project)),
  };

  const rawTotal = Object.values(breakdown).reduce((sum, item) => sum + item.score, 0);
  const knockouts = knockoutIds(project, hist, { irr, hurdle, debtEbitda, dscrMin });
  const isKnockout = knockouts.length > 0;
  const total = isKnockout ? Math.min(rawTotal, CONFIG.knockout.capScore) : rawTotal;

  return {
    total,
    rawTotal,
    breakdown,
    knockouts: knockouts.map(id => CONFIG.knockout.rules.find(rule => rule.id === id)),
    isKnockout,
    routingStatus: isKnockout ? KNOCKOUT_STATUS : routingTierFor(total),
    kpis: {
      irr,
      npv: calcNPV(cashflows, model.diskontStavkasi),
      payback: calcPayback(cashflows),
      debtEbitda,
      dscrMin,
      dscrAvg,
      hurdle,
      dscrSeries,
    },
    hist,
    projectType: "company",
  };
}
