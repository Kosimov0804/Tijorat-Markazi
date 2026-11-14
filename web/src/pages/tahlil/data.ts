/*
 * The analyst API and the shapes it answers with. Every endpoint is a POST
 * carrying the login pair and the period, and every one returns aggregates.
 */
import type { Lang } from "@legacy/data.js";
import { amount, formatMoney, formatNumber, listOf, marketJson, record, text, texts } from "../../shell/market";
import type { Json } from "../../shell/market";
import type { CabinetCredentials } from "../../shell/cabinet";

export const SESSION_KEY = "kg_an";
export const PERIODS = [30, 90, 180, 365] as const;
export const DEFAULT_DAYS = 90;
export const BUCKETS = ["day", "week", "month"] as const;

export type AnalystView = "overview" | "segments" | "trends" | "reports";
export type Analyst = { name: string; org: string; scopes: string[] };
export type AnalystSession = { credentials: CabinetCredentials; analyst: Analyst; modules: string[] };
/** What every data request needs: who is asking and for which period. */
export type Query = { credentials: CabinetCredentials; days: number };

export const analystPost = (path: string, query: Query, extra?: object): Promise<Json> =>
  marketJson(`/api/analyst/${path}`, { ...query.credentials, days: query.days, ...extra });

/** Resolves to the session, or null when these are not an analyst's credentials. */
export async function analystLogin(login: string, password: string): Promise<AnalystSession | null> {
  const answer = await marketJson("/api/analyst/login", { login, password });
  if (!answer.ok) return null;
  const profile = record(answer.analyst);
  const scopes = texts(profile.scopes);
  return {
    credentials: { login, password },
    analyst: { name: text(profile.name), org: text(profile.org), scopes },
    /* An analyst sees only the markets their account is scoped to. */
    modules: texts(answer.modules).filter(module => scopes.includes(module)),
  };
}

/* ---------- figures ---------- */

/** Sums below a million are whole numbers here; zero reads as "—". */
export function formatSum(value: unknown, lang: Lang): string {
  const number = Number(value);
  if (!Number.isFinite(number) || !number) return "—";
  return Math.abs(number) >= 1e6 ? formatMoney(number, "", lang) : formatNumber(number, lang, 0);
}

/** Unlike the kit's percent, a missing figure is "—" and not "0%". */
export const formatShare = (value: unknown, lang: Lang): string =>
  value == null || !Number.isFinite(Number(value)) ? "—" : `${formatNumber(value, lang, 0)}%`;

/* ---------- answers ---------- */

export type Cohort = { p25: number; median: number; p75: number } | null;

/** A cohort too small to publish arrives suppressed, and reads as null. */
export function parseCohort(value: unknown): Cohort {
  const cohort = record(value);
  if (cohort.suppressed || !cohort.stats) return null;
  const stats = record(cohort.stats);
  return { p25: amount(stats.p25), median: amount(stats.median), p75: amount(stats.p75) };
}

export type FunnelData = { module: string; steps: { label: string; n: number }[] };

export function parseFunnel(value: unknown): FunnelData {
  const funnel = record(value);
  return {
    module: text(funnel.module),
    steps: listOf(funnel.steps, step => ({ label: text(record(step).label), n: amount(record(step).n) })),
  };
}

export type SeriesPoint = { from: number; to: number; n: number };

export function parsePoint(value: unknown): SeriesPoint {
  const point = record(value);
  return { from: amount(point.from), to: amount(point.to), n: amount(point.n) };
}

/** The file name out of a Content-Disposition header, kept to a bare name. */
function fileNameFrom(header: string | null, kind: string): string {
  const name = /filename="([^"]+)"/.exec(header ?? "")?.[1] ?? "";
  return /^[\w.\- ]+$/.test(name) ? name : `tahlil.${kind}`;
}

const REVOKE_DELAY_MS = 4000;

/** A POST download needs the response as a blob, not a navigation. Resolves to false on failure. */
export async function downloadReport(query: Query, kind: string): Promise<boolean> {
  try {
    const response = await fetch("/api/analyst/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...query.credentials, days: query.days, kind }),
    });
    if (!response.ok) return false;
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = fileNameFrom(response.headers.get("Content-Disposition"), kind);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
    return true;
  } catch {
    return false;
  }
}
