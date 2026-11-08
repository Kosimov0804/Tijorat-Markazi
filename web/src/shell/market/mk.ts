import { LANGS, T } from "@legacy/data.js";
import type { Lang, Localized } from "@legacy/data.js";
import { useI18n } from "../i18n";
import { readStored, removeStored, writeStored } from "../storage";

export type Dictionary = Readonly<Record<string, Localized | undefined>>;
export type Translate = (key: string, fallback?: string) => string;

/** Page strings first, then the shared dictionary, then the fallback or key. */
export function useMarketText(dictionary: Dictionary): Translate {
  const { lang } = useI18n();
  const index = LANGS.indexOf(lang);
  return (key, fallback) => (dictionary[key] ?? T[key])?.[index] ?? fallback ?? key;
}

const LOCALE: Record<Lang, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };

export function formatNumber(value: unknown, lang: Lang, digits?: number): string {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number.toLocaleString(LOCALE[lang], {
    minimumFractionDigits: digits ?? 0,
    maximumFractionDigits: digits ?? 2,
  });
}

export function formatDay(timestamp: unknown, lang: Lang): string {
  const date = new Date(Number(timestamp) || 0);
  return Number.isFinite(date.getTime()) && timestamp ? date.toLocaleDateString(LOCALE[lang]) : "—";
}

export const safeHttpUrl = (url: string | undefined): string =>
  url && /^https?:\/\//i.test(url) ? url : "";

/** Also allows same-origin uploads, but not "//host/x.jpg", which loads from another server. */
export function safeImageUrl(url: string | undefined): string {
  if (!url) return "";
  if (safeHttpUrl(url)) return url;
  return url.startsWith("/") && !url.startsWith("//") ? url : "";
}

export function queryString(params: Record<string, string>): string {
  return Object.entries(params)
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

type ApiResult<T> = Partial<T> & { ok?: boolean; error?: string };

/** Never rejects: a network or parse failure comes back as `{ error }`. */
export async function marketApi<T extends object>(path: string, body?: object): Promise<ApiResult<T>> {
  try {
    const options = body
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      : undefined;
    const response = await fetch(path, options);
    return (await response.json()) as ApiResult<T>;
  } catch {
    return { error: "network" } as ApiResult<T>;
  }
}

/* The e-mail identity is not a credential and persists like the language. */
export const identity = {
  email: (): string => readStored("localStorage", "mk_email") ?? "",
  name: (): string => readStored("localStorage", "mk_name") ?? "",
  viewKey: (): string => readStored("localStorage", "mk_iqkey") ?? "",
  setViewKey: (key: string): void => writeStored("localStorage", "mk_iqkey", key),
  setPerson(email: string, name: string): void {
    if (email) writeStored("localStorage", "mk_email", email);
    else removeStored("localStorage", "mk_email");
    if (name) writeStored("localStorage", "mk_name", name);
  },
};
