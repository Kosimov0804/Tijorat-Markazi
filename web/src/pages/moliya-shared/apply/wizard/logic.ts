import {
  buildFcfCashflows,
  calcDSCRSeries,
  calcDebtEbitda,
  calcIRR,
  calcNPV,
  calcPayback,
  getHurdle,
} from "../../engine/engine";
import type { Kpis, Project } from "../../engine/types";

export const LAST_STEP = 4;

export const isStartup = (project: Pick<Project, "passport">): boolean => project.passport.loyihaTuri === "startup";

/** Dictionary keys of the four step titles; steps 2-4 differ by track. */
export function stepLabelKeys(project: Pick<Project, "passport">): string[] {
  const track = isStartup(project) ? "startup" : "company";
  return ["ms_wiz_step1", `ms_wiz_step2_${track}`, `ms_wiz_step3_${track}`, `ms_wiz_step4_${track}`];
}

function passportErrors({ passport }: Project): string[] {
  const errors: string[] = [];
  if (!passport.nomi) errors.push("ms_v_name");
  if (!passport.stir) errors.push("ms_v_tin");
  if (!passport.soralayotganSumma || passport.soralayotganSumma <= 0) errors.push("ms_v_amount");
  if (!passport.muddat || passport.muddat <= 0) errors.push("ms_v_term");
  const share = passport.tashabbuskorUlushi;
  if (share != null && (share < 0 || share > 100)) errors.push("ms_v_owner_share");
  return errors;
}

/**
 * Dictionary keys of what a step still needs. On the startup track nothing
 * after the passport BLOCKS: a criterion left unchosen simply scores zero,
 * because a startup scores low for what it has not reached, not for a blank.
 */
export function validateStep(step: number, project: Project): string[] {
  if (step === 1) return passportErrors(project);
  if (isStartup(project)) return [];
  if (step === 2) {
    const last = project.financialHistory[project.financialHistory.length - 1];
    return last && last.tushum == null ? ["ms_v_revenue"] : [];
  }
  if (step === 3) return project.financialModel.yillar.some(year => year.fcf != null) ? [] : ["ms_v_fcf"];
  const teo = project.dueDiligence.teoTayyorlovchi;
  const needsName = teo.category === "big5" || teo.category === "recognized";
  return needsName && !teo.name ? ["ms_v_teo_org"] : [];
}

export const validateSteps = (from: number, to: number, project: Project): string[] =>
  Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => validateStep(from + index, project)).flat();

/** The KPIs shown live inside the wizard: for the eye only, never the official score. */
export function liveKpis(project: Project): Kpis {
  const cashflows = buildFcfCashflows(project);
  const cover = calcDSCRSeries(project.financialModel)
    .map(row => row.dscr)
    .filter((value): value is number => value != null && isFinite(value));
  return {
    irr: calcIRR(cashflows),
    npv: calcNPV(cashflows, project.financialModel.diskontStavkasi),
    payback: calcPayback(cashflows),
    debtEbitda: calcDebtEbitda(project.financialHistory),
    dscrMin: cover.length ? Math.min(...cover) : null,
    hurdle: getHurdle(project),
  };
}

/* ---------- immutable edits of the working copy ---------- */

export type Edit = (project: Project) => Project;

export const editPassport = (change: Partial<Project["passport"]>): Edit => project => ({
  ...project,
  passport: { ...project.passport, ...change },
});

export const editStartup = (change: Partial<Project["startupInfo"]>): Edit => project => ({
  ...project,
  startupInfo: { ...project.startupInfo, ...change },
});

export const editModel = (change: Partial<Project["financialModel"]>): Edit => project => ({
  ...project,
  financialModel: { ...project.financialModel, ...change },
});

export const editDueDiligence = (change: Partial<Project["dueDiligence"]>): Edit => project => ({
  ...project,
  dueDiligence: { ...project.dueDiligence, ...change },
});

const replaceAt = <T>(items: readonly T[], index: number, change: Partial<T>): T[] =>
  items.map((item, at) => (at === index ? { ...item, ...change } : item));

export const editHistoryCell = (row: number, field: string, value: number | null): Edit => project => ({
  ...project,
  financialHistory: replaceAt(project.financialHistory, row, { [field]: value }),
});

export const editModelCell = (row: number, field: string, value: number | null): Edit => project =>
  editModel({ yillar: replaceAt(project.financialModel.yillar, row, { [field]: value }) })(project);

export const addModelYear: Edit = project => {
  const years = project.financialModel.yillar;
  const added = { yil: years.length + 1, fcf: null, cfads: null, principal: null, interest: null };
  return editModel({ yillar: [...years, added] })(project);
};

/** Removing a year renumbers the ones after it. */
export const removeModelYear = (row: number): Edit => project => {
  const kept = project.financialModel.yillar.filter((_, at) => at !== row);
  return editModel({ yillar: kept.map((year, at) => ({ ...year, yil: at + 1 })) })(project);
};

/** Only the file's description is kept: the wizard never uploads the bytes. */
export const addDocuments = (files: readonly File[], now: number): Edit => project => ({
  ...project,
  documents: [
    ...project.documents,
    ...files.map(file => ({ name: file.name, size: file.size, type: file.type, uploadedAt: now })),
  ],
});

export const removeDocument = (row: number): Edit => project => ({
  ...project,
  documents: project.documents.filter((_, at) => at !== row),
});
