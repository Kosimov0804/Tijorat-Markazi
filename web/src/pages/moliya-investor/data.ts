import { moliyaApi, withIdentity } from "../moliya-shared/api";
import type { ApiAnswer } from "../moliya-shared/api";
import type { Passport, Project, RoutingStatus } from "../moliya-shared/engine/types";
import { isRecord, list, numberOr, numberOrNull, record, text, texts } from "../moliya-shared/narrow";
import { hasDetail, toPassport, toProject, toRoutingStatus } from "../moliya-shared/parse";

/* ---------- shapes the investor API answers with ---------- */

export interface Interest {
  state: string;
  note: string;
  updated: number;
}

export interface InboxItem {
  id: string;
  status: string;
  ownerName: string;
  submitted: number;
  passport: Passport;
  score: number | null;
  routingStatus: RoutingStatus | null;
  matchedProducts: number;
  interest: Interest | null;
}

export interface InboxStats {
  total: number;
  fresh: number;
  shortlist: number;
  avgScore: number | null;
}

export type ActorKind = "guest" | "expert" | "institution";

export interface Inbox {
  actorKind: ActorKind;
  isInstitution: boolean;
  /** How many registry entries this company's products make up. */
  institutions: number;
  stats: InboxStats;
  items: InboxItem[];
}

export interface Dossier {
  project: Project;
  /** False when the project carries neither history, model nor startup profile. */
  hasDetail: boolean;
  interest: Interest | null;
  matchedProducts: number | null;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  currency: string;
  status: string;
  minAmount: number;
  maxAmount: number;
  tenorMax: number;
  sectors: string[];
  routable: boolean;
  minScore: number;
  eligible: boolean;
}

export interface RoutingSettings {
  products: Product[];
  institutions: number;
}

export type Filter = Record<"q" | "status" | "sektor" | "hudud" | "loyihaTuri" | "interest" | "minBall", string>;

export const EMPTY_FILTER: Filter = { q: "", status: "", sektor: "", hudud: "", loyihaTuri: "", interest: "", minBall: "" };

export const hasFilter = (filter: Filter): boolean => Object.values(filter).some(value => value !== "");

export function toInterest(value: unknown): Interest | null {
  if (!isRecord(value)) return null;
  return { state: text(value.state), note: text(value.note), updated: numberOr(value.updated, 0) };
}

function toInboxItem(value: unknown): InboxItem {
  const source = record(value);
  return {
    id: text(source.id),
    status: text(source.status),
    ownerName: text(source.ownerName),
    submitted: numberOr(source.submitted, 0),
    passport: toPassport(source.passport),
    score: numberOrNull(source.score),
    routingStatus: toRoutingStatus(source.routingStatus),
    matchedProducts: numberOr(source.matchedProducts, 0),
    interest: toInterest(source.interest),
  };
}

function actorKindOf(source: Record<string, unknown>): ActorKind {
  if (source.actorKind === "guest" || source.actorKind === "expert" || source.actorKind === "institution") return source.actorKind;
  return source.isInstitution === true ? "institution" : "expert";
}

export function toInbox(answer: ApiAnswer): Inbox {
  const source = record(answer);
  const stats = record(source.stats);
  return {
    actorKind: actorKindOf(source),
    isInstitution: source.isInstitution === true,
    institutions: numberOr(source.institutions, 0),
    stats: {
      total: numberOr(stats.total, 0),
      fresh: numberOr(stats.fresh, 0),
      shortlist: numberOr(stats.shortlist, 0),
      avgScore: numberOrNull(stats.avgScore),
    },
    items: list(source.items).map(toInboxItem),
  };
}

export function toDossier(answer: ApiAnswer): Dossier {
  const source = record(answer);
  return {
    project: toProject(source.project),
    hasDetail: hasDetail(source.project),
    interest: toInterest(source.interest),
    matchedProducts: numberOrNull(source.matchedProducts),
  };
}

function toProduct(value: unknown): Product {
  const source = record(value);
  return {
    id: text(source.id),
    name: text(source.name),
    category: text(source.category),
    currency: text(source.currency),
    status: text(source.status),
    minAmount: numberOr(source.minAmount, 0),
    maxAmount: numberOr(source.maxAmount, 0),
    tenorMax: numberOr(source.tenorMax, 0),
    sectors: texts(source.sectors),
    routable: source.routable === true,
    minScore: numberOr(source.minScore, 0),
    eligible: Boolean(source.eligible),
  };
}

export function toRoutingSettings(answer: ApiAnswer): RoutingSettings {
  const source = record(answer);
  return { products: list(source.items).map(toProduct), institutions: numberOr(source.institutions, 0) };
}

/* ---------- requests: identity travels in the body, the house way ---------- */

const post = (path: string, body: object): Promise<ApiAnswer> => moliyaApi(`/api/moliya/${path}`, withIdentity(body));

/* The queue and its tiles arrive already filtered: cutting again here would
   make the tiles say one number and the table another. */
export const fetchInbox = (filter: Filter): Promise<ApiAnswer> => post("investor/inbox", { filter });
export const fetchDossier = (id: string): Promise<ApiAnswer> => post("investor/open", { id });
export const saveInterest = (projectId: string, state: string, note: string): Promise<ApiAnswer> =>
  post("investor/interest", { projectId, state, note });
export const fetchRouting = (): Promise<ApiAnswer> => post("investor/routing", { op: "get" });
export const saveRouting = (productId: string, routable: boolean, minScore: number): Promise<ApiAnswer> =>
  post("investor/routing", { op: "set", productId, routable, minScore });
/** The transition rule is checked on the server; this only says which button was pressed. */
export const setProjectStatus = (id: string, status: string, comment: string): Promise<ApiAnswer> =>
  post("scoring/status", { id, status, comment });
