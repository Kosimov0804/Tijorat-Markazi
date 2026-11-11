import { moliyaApi, withIdentity } from "../api";
import type { ApiAnswer } from "../api";
import { toUsdEquivalent } from "../engine/engine";
import type {
  Institution,
  InstitutionMatch,
  Passport,
  Project,
  RoutingStatus,
  Scoring,
  Suggestion,
  Track,
} from "../engine/types";
import type { Kit } from "../kit";
import { display, isRecord, list, numberOr, numberOrNull, record, text, texts } from "../narrow";
import { toPassport, toProject, toRoutingStatus, toScoring } from "../parse";

/* ---------- shapes the scoring API answers with ---------- */

export interface ListItem {
  id: string;
  status: string;
  updated: number;
  passport: Passport;
  score: { total: number; isKnockout: boolean; routingStatus: RoutingStatus | null } | null;
}

export interface Stats {
  total: number;
  scored: number;
  ready: number;
  blocked: number;
  avgScore: number | null;
}

export interface AuditEntry {
  t: number;
  user: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface InterestEntry {
  state: string;
  providerName: string;
}

export interface Opened {
  project: Project;
  scoring: Scoring;
  suggestions: Suggestion[];
  matches: InstitutionMatch[];
  unlocked: boolean;
  interest: InterestEntry[];
  audit: AuditEntry[];
}

export interface Home {
  role: string;
  items: ListItem[];
  stats: Stats;
}

function toListItem(value: unknown): ListItem {
  const source = record(value);
  const score = record(source.score);
  return {
    id: text(source.id),
    status: text(source.status),
    updated: numberOr(source.updated, 0),
    passport: toPassport(source.passport),
    score: isRecord(source.score)
      ? { total: numberOr(score.total, 0), isKnockout: score.isKnockout === true, routingStatus: toRoutingStatus(score.routingStatus) }
      : null,
  };
}

function toInstitution(value: unknown): Institution {
  const source = record(value);
  const name = record(source.nomi);
  const email = text(source.aloqa_email);
  return {
    id: text(source.id),
    seed: source.seed === true,
    nomi: { uz: text(name.uz), ru: text(name.ru), en: text(name.en) },
    turi: text(source.turi),
    min_summa: numberOr(source.min_summa, 0),
    max_summa: numberOr(source.max_summa, 0),
    valyutalar: texts(source.valyutalar),
    sektorlar: texts(source.sektorlar),
    max_muddat: numberOr(source.max_muddat, 0),
    min_ball: numberOr(source.min_ball, 0),
    ...(email ? { aloqa_email: email } : {}),
  };
}

function toMatch(value: unknown): InstitutionMatch {
  const source = record(value);
  const checks = record(source.checks);
  return {
    inst: toInstitution(source.inst),
    checks: {
      summa: checks.summa === true,
      valyuta: checks.valyuta === true,
      sektor: checks.sektor === true,
      muddat: checks.muddat === true,
      ball: checks.ball === true,
    },
    matchPercent: numberOr(source.matchPercent, 0),
    fullMatch: source.fullMatch === true,
  };
}

const toAudit = (value: unknown): AuditEntry => {
  const source = record(value);
  return {
    t: numberOr(source.t, 0),
    user: text(source.user),
    field: text(source.field),
    oldValue: display(source.oldValue),
    newValue: display(source.newValue),
  };
};

export function toHome(answer: ApiAnswer): Home {
  const source = record(answer);
  const stats = record(source.stats);
  return {
    role: text(source.role) || "tashabbuskor",
    items: list(source.items).map(toListItem),
    stats: {
      total: numberOr(stats.total, 0),
      scored: numberOr(stats.scored, 0),
      ready: numberOr(stats.ready, 0),
      blocked: numberOr(stats.blocked, 0),
      avgScore: numberOrNull(stats.avgScore),
    },
  };
}

/** null when the answer carries no usable score to show. */
export function toOpened(answer: ApiAnswer): Opened | null {
  const source = record(answer);
  const scoring = toScoring(source.scoring);
  if (!scoring) return null;
  return {
    project: toProject(source.project),
    scoring,
    suggestions: list(source.suggestions).map(item => ({ gap: numberOr(record(item).gap, 0), key: text(record(item).key) })),
    matches: list(source.matches).map(toMatch),
    unlocked: source.unlocked === true,
    interest: list(source.interest).map(item => ({ state: text(record(item).state), providerName: text(record(item).providerName) })),
    audit: list(source.audit).map(toAudit),
  };
}

/* ---------- requests ---------- */

const post = (action: string, body: object): Promise<ApiAnswer> =>
  moliyaApi(`/api/moliya/scoring/${action}`, withIdentity(body));

/* The track goes to the server as a FILTER: the stat tiles are computed
   after it, so cutting the list here would leave tiles and rows disagreeing. */
export const fetchHome = (track: Track): Promise<ApiAnswer> => post("home", { loyihaTuri: track });
export const fetchProject = (id: string): Promise<ApiAnswer> => post("open", { id });
export const submitProject = (id: string): Promise<ApiAnswer> => post("submit", { id });

/**
 * The body is sent FLAT: the form sections next to the identity. The status
 * goes only when finishing, because the one transition an owner may make is
 * draft -> scored; sending it with a draft would pull a scored project back.
 */
export function saveProject(draft: Project, isFinishing: boolean): Promise<ApiAnswer> {
  const { id, passport, startupInfo, financialHistory, financialModel, dueDiligence, documents } = draft;
  return post("save", {
    ...(id ? { id } : {}),
    ...(isFinishing ? { status: "scored" } : {}),
    passport,
    startupInfo,
    financialHistory,
    financialModel,
    dueDiligence,
    documents,
  });
}

/* ---------- the list: search, filter, sort ---------- */

export type SortKey = "nomi" | "summa" | "ball" | "status" | "updated";

export interface ListQuery {
  search: string;
  status: string;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
}

function sortValue(item: ListItem, key: SortKey): string | number {
  switch (key) {
    case "nomi":
      return (item.passport.nomi || "").toLowerCase();
    case "summa":
      return toUsdEquivalent(item.passport.soralayotganSumma, item.passport.valyuta);
    case "ball":
      return item.score ? item.score.total : -1;
    case "status":
      return item.status;
    default:
      return item.updated || 0;
  }
}

/** The list is small, so it is searched and sorted here, not on the server. */
export function visibleItems(items: readonly ListItem[], query: ListQuery, kit: Pick<Kit, "sectorName" | "regionName">): ListItem[] {
  const needle = query.search.trim().toLowerCase();
  const matching = items.filter(item => {
    if (query.status && item.status !== query.status) return false;
    if (!needle) return true;
    const { passport } = item;
    const haystack = [passport.nomi, passport.stir, kit.sectorName(passport), kit.regionName(passport)].join(" ").toLowerCase();
    return haystack.includes(needle);
  });
  const direction = query.sortDir === "asc" ? 1 : -1;
  return [...matching].sort((a, z) => {
    const left = sortValue(a, query.sortKey);
    const right = sortValue(z, query.sortKey);
    return (left > right ? 1 : left < right ? -1 : 0) * direction;
  });
}
