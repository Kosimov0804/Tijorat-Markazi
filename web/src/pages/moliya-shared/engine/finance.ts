import { CONFIG } from "./config";
import type { DscrRow, HistoryMetrics, HistoryYear, ProjectInput } from "./types";

/* The legacy engine does arithmetic on blank cells and relies on JavaScript
   reading null as 0. The cast keeps that exact behaviour under strict types. */
const raw = (value: number | null | undefined): number => value as number;

const npvAt = (cashflows: readonly number[], rate: number): number =>
  cashflows.reduce((sum, flow, year) => sum + flow / Math.pow(1 + rate, year), 0);

const npvSlopeAt = (cashflows: readonly number[], rate: number): number =>
  cashflows.reduce((sum, flow, year) => sum - (year * flow) / Math.pow(1 + rate, year + 1), 0);

/** Newton-Raphson from 10%; null when it does not settle. */
function newtonIrr(cashflows: readonly number[]): number | null {
  let rate = 0.1;
  for (let i = 0; i < 60; i++) {
    const slope = npvSlopeAt(cashflows, rate);
    if (Math.abs(slope) < 1e-10) return null;
    const next = rate - npvAt(cashflows, rate) / slope;
    if (!isFinite(next) || next < -0.999) return null;
    if (Math.abs(next - rate) < 1e-8) return next;
    rate = next;
  }
  return null;
}

/** Slower but dependable; null when the sign never changes in the bracket. */
function bisectionIrr(cashflows: readonly number[]): number | null {
  let low = -0.99;
  let high = 10;
  let atLow = npvAt(cashflows, low);
  const atHigh = npvAt(cashflows, high);
  if (isNaN(atLow) || isNaN(atHigh) || atLow * atHigh > 0) return null;
  for (let i = 0; i < 200; i++) {
    const middle = (low + high) / 2;
    const atMiddle = npvAt(cashflows, middle);
    if (Math.abs(atMiddle) < 1e-6) return middle;
    if (atLow < 0 === atMiddle < 0) {
      low = middle;
      atLow = atMiddle;
    } else {
      high = middle;
    }
  }
  return (low + high) / 2;
}

/**
 * IRR in percent. cashflows[0] is the initial investment, then yearly FCF.
 * An IRR exists only when the flow changes sign; otherwise null.
 */
export function calcIRR(cashflows: readonly number[] | null | undefined): number | null {
  if (!cashflows || cashflows.length < 2) return null;
  const nonZero = cashflows.filter(value => value !== 0);
  if (nonZero.length < 2) return null;
  if (!(nonZero.some(value => value > 0) && nonZero.some(value => value < 0))) return null;
  const rate = newtonIrr(cashflows) ?? bisectionIrr(cashflows);
  return rate === null ? null : rate * 100;
}

export function calcNPV(cashflows: readonly number[] | null | undefined, ratePct: number | null | undefined): number | null {
  if (!cashflows) return null;
  return npvAt(cashflows, raw(ratePct) / 100);
}

/** Years until cumulative FCF first turns positive, with a fraction. */
export function calcPayback(cashflows: readonly number[] | null | undefined): number | null {
  if (!cashflows || !cashflows.length) return null;
  let cumulative = cashflows[0];
  if (cumulative >= 0) return 0;
  for (let year = 1; year < cashflows.length; year++) {
    const before = cumulative;
    cumulative += cashflows[year];
    if (cumulative >= 0) {
      const fraction = cashflows[year] === 0 ? 0 : -before / cashflows[year];
      return year - 1 + fraction;
    }
  }
  return null;
}

export function calcHistoryMetrics(history: readonly Partial<HistoryYear>[] | null | undefined): HistoryMetrics {
  const source = history ?? [];
  const rows = source.map((year, index) => {
    const previous = source[index - 1];
    return {
      ...year,
      ros: year.tushum ? (raw(year.sofFoyda) / year.tushum) * 100 : null,
      roe: year.ozKapital ? (raw(year.sofFoyda) / year.ozKapital) * 100 : null,
      growth: previous && previous.tushum ? ((raw(year.tushum) - previous.tushum) / previous.tushum) * 100 : null,
      rentabelmi: (year.sofFoyda || 0) > 0,
    };
  });
  return {
    rows,
    profitableYears: rows.filter(row => row.rentabelmi).length,
    filledYears: rows.filter(row => row.tushum || row.sofFoyda || row.ebitda).length,
  };
}

/** DSCR per year: CFADS / (principal + interest). */
export function calcDSCRSeries(model: ProjectInput["financialModel"] | null | undefined): DscrRow[] {
  return (model?.yillar ?? []).map(year => {
    const debtService = (year.principal || 0) + (year.interest || 0);
    return {
      yil: year.yil,
      cfads: year.cfads,
      principal: year.principal,
      interest: year.interest,
      debtService,
      dscr: debtService > 0 ? (year.cfads || 0) / debtService : null,
    };
  });
}

export function calcDebtEbitda(history: readonly Partial<HistoryYear>[] | null | undefined): number | null {
  const list = history ?? [];
  const last = list[list.length - 1];
  if (!last || !last.ebitda) return null;
  return (last.jamiQarz || 0) / last.ebitda;
}

/** Year 0 is minus the requested amount, then the FCF row. */
export function buildFcfCashflows(project: ProjectInput): number[] {
  const invest = -(project.passport?.soralayotganSumma || 0);
  return [invest, ...(project.financialModel?.yillar ?? []).map(year => year.fcf || 0)];
}

/** 10% in foreign currency; the central bank rate plus 8 points in UZS. */
export function getHurdle(project: ProjectInput): number {
  if (project.passport?.valyuta !== "UZS") return CONFIG.macro.hurdleForeignCcy;
  const stored = project.financialModel?.mbStavkasi;
  const centralBankRate = stored === null || stored === undefined ? CONFIG.macro.cbRateUZS : stored;
  return centralBankRate + CONFIG.macro.hurdleLocalSpreadPp;
}
