import { blankProject } from "./engine/engine";
import type {
  DscrRow,
  FinancialModel,
  HistoryYear,
  Kpis,
  LocalizedName,
  ModelYear,
  Passport,
  Project,
  ProjectDocument,
  Reason,
  ReasonParam,
  RefItem,
  RoutingStatus,
  ScoreBlock,
  Scoring,
  StartupInfo,
  SubBlock,
} from "./engine/types";
import { isRecord, list, numberOr, numberOrNull, record, text } from "./narrow";
import type { Json } from "./narrow";

/* Everything the server sends is narrowed here before a component sees it.
   A missing or malformed field falls back to the blank form's value. */

/** Every field of `base`, taken from `source` when it holds the same kind of value. */
function overlay<T extends object>(base: T, source: Json): T {
  const entries = Object.entries(base).map(([key, fallback]): [string, unknown] => {
    const value = source[key];
    if (typeof fallback === "string") return [key, text(value, fallback)];
    if (typeof fallback === "boolean") return [key, typeof value === "boolean" ? value : fallback];
    if (typeof fallback === "number") return [key, numberOr(value, fallback)];
    return [key, numberOrNull(value)];
  });
  return Object.fromEntries(entries) as T;
}

const names = (value: unknown): LocalizedName => {
  const source = record(value);
  return { uz: text(source.uz), ru: text(source.ru), en: text(source.en) };
};

const refEntry = (value: unknown): RefItem => ({ id: text(record(value).id), ...names(value) });

export function toRoutingStatus(value: unknown): RoutingStatus | null {
  return isRecord(value) ? { status: text(value.status), ...names(value) } : null;
}

const HISTORY_BLANK: HistoryYear = { yil: 0, tushum: null, ebitda: null, sofFoyda: null, jamiQarz: null, jamiAktivlar: null, ozKapital: null };
const MODEL_BLANK: ModelYear = { yil: 0, fcf: null, cfads: null, principal: null, interest: null };

function toModel(value: unknown, blank: FinancialModel): FinancialModel {
  const source = record(value);
  const years = Array.isArray(source.yillar)
    ? source.yillar.map((year, index) => overlay({ ...MODEL_BLANK, yil: index + 1 }, record(year)))
    : blank.yillar;
  return {
    diskontStavkasi: numberOr(source.diskontStavkasi, blank.diskontStavkasi),
    mbStavkasi: source.mbStavkasi === undefined ? blank.mbStavkasi : numberOrNull(source.mbStavkasi),
    yillar: years,
  };
}

function toDueDiligence(value: unknown, blank: Project["dueDiligence"]): Project["dueDiligence"] {
  const source = record(value);
  const areas = Object.entries(record(source.ddYonalishlari)).map(([id, area]): [string, { status: string; performer: string }] => [
    id,
    { status: text(record(area).status, "none"), performer: text(record(area).performer) },
  ]);
  return {
    teoTayyorlovchi: overlay(blank.teoTayyorlovchi, record(source.teoTayyorlovchi)),
    audit: overlay(blank.audit, record(source.audit)),
    ddYonalishlari: { ...blank.ddYonalishlari, ...Object.fromEntries(areas) },
    torTasdiqlangan: source.torTasdiqlangan === true,
    yuridikKompaniya: text(source.yuridikKompaniya),
    exit: overlay(blank.exit, record(source.exit)),
  };
}

const toDocument = (value: unknown): ProjectDocument => {
  const source = record(value);
  return { name: text(source.name), size: numberOr(source.size, 0), type: text(source.type), uploadedAt: numberOr(source.uploadedAt, 0) };
};

export function toPassport(value: unknown): Passport {
  return overlay(blankProject().passport, record(value));
}

export function toProject(value: unknown): Project {
  const source = record(value);
  const blank = blankProject();
  const history = Array.isArray(source.financialHistory)
    ? source.financialHistory.map(year => overlay(HISTORY_BLANK, record(year)))
    : blank.financialHistory;
  return {
    ...(source.id === undefined ? {} : { id: text(source.id) }),
    status: text(source.status, blank.status),
    passport: toPassport(source.passport),
    startupInfo: overlay<StartupInfo>(blank.startupInfo, record(source.startupInfo)),
    financialHistory: history,
    financialModel: toModel(source.financialModel, blank.financialModel),
    dueDiligence: toDueDiligence(source.dueDiligence, blank.dueDiligence),
    documents: list(source.documents).map(toDocument),
    scoring: toScoring(source.scoring),
    updated: numberOr(source.updated, 0),
    submitted: numberOr(source.submitted, 0),
    ownerName: text(source.ownerName),
  };
}

/** Whether the stored project carries the sections a dossier can show. */
export function hasDetail(value: unknown): boolean {
  const source = record(value);
  return Boolean(source.financialModel || list(source.financialHistory).length || source.startupInfo);
}

/* ---------- scoring ---------- */

function toParam(value: unknown): ReasonParam {
  if (typeof value === "string" || typeof value === "number") return value;
  return isRecord(value) ? refEntry(value) : null;
}

function toReason(value: unknown): Reason {
  const source = record(value);
  const params = Object.entries(record(source.params)).map(([key, param]): [string, ReasonParam] => [key, toParam(param)]);
  return { key: text(source.key), params: Object.fromEntries(params) };
}

const toSubBlock = (value: unknown): SubBlock => {
  const source = record(value);
  return { score: numberOr(source.score, 0), max: numberOr(source.max, 0), reason: toReason(source.reason) };
};

function toBlock(value: unknown): ScoreBlock {
  const source = record(value);
  const sub = record(source.sub);
  return {
    labelKey: text(source.labelKey),
    ...toSubBlock(source),
    ...(source.reason2 ? { reason2: toReason(source.reason2) } : {}),
    ...(isRecord(source.sub) ? { sub: { debtEbitda: toSubBlock(sub.debtEbitda), dscr: toSubBlock(sub.dscr) } } : {}),
  };
}

const toDscrRow = (value: unknown): DscrRow => {
  const source = record(value);
  return {
    yil: numberOrNull(source.yil) ?? undefined,
    cfads: numberOrNull(source.cfads),
    principal: numberOrNull(source.principal),
    interest: numberOrNull(source.interest),
    debtService: numberOr(source.debtService, 0),
    dscr: numberOrNull(source.dscr),
  };
};

function toKpis(value: unknown): Kpis {
  const source = record(value);
  return {
    irr: numberOrNull(source.irr),
    npv: numberOrNull(source.npv),
    payback: numberOrNull(source.payback),
    debtEbitda: numberOrNull(source.debtEbitda),
    dscrMin: numberOrNull(source.dscrMin),
    dscrAvg: numberOrNull(source.dscrAvg),
    hurdle: numberOrNull(source.hurdle),
    dscrSeries: list(source.dscrSeries).map(toDscrRow),
  };
}

export function toScoring(value: unknown): Scoring | null {
  if (!isRecord(value) || !isRecord(value.breakdown)) return null;
  const blocks = Object.entries(value.breakdown)
    .filter(([, block]) => isRecord(block))
    .map(([key, block]): [string, ScoreBlock] => [key, toBlock(block)]);
  return {
    total: numberOr(value.total, 0),
    rawTotal: numberOr(value.rawTotal, 0),
    breakdown: Object.fromEntries(blocks),
    knockouts: list(value.knockouts).filter(isRecord).map(refEntry),
    isKnockout: value.isKnockout === true,
    routingStatus: toRoutingStatus(value.routingStatus) ?? { status: "", uz: "", ru: "", en: "" },
    kpis: toKpis(value.kpis),
    hist: null,
    projectType: value.projectType === "startup" ? "startup" : "company",
  };
}
