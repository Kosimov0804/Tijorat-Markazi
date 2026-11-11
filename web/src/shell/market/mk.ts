import { LANGS, T } from "@legacy/data.js";
import type { Lang, Localized } from "@legacy/data.js";
import { useI18n } from "../i18n";
import { readStored, removeStored, writeStored } from "../storage";
import { record, text } from "./narrow";
import type { Json } from "./narrow";

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

/* ------------------------------------------------------------------
   The rest of market-kit.js. What the kit offers, by legacy name:

     MK.t / setDict   useMarketText(dictionary)
     MK.num           formatNumber        MK.money     formatMoney
     MK.pctTxt        formatPercent       MK.day       formatDay
     MK.safeUrl       safeHttpUrl         MK.qs        queryString
     MK.api           marketJson (answers as an un-narrowed record)
     MK.ident         identity (the person) and companyIdentity (.company,
                      .setCompany, .withCompany = co, .withPerson = me)
     MK.companyLogin  companyLogin
     MK.esc / escA    not needed: JSX escapes text and attributes
     MK.chrome / applyStatic / $ / $$   replaced by PublicPage and i18n

   The painters (chip, match, ranks, drawer …) are the components beside
   this file; index.ts lists them all.
   ------------------------------------------------------------------ */

const MONEY_UNITS: Record<Lang, readonly [string, string]> = {
  uz: ["mln", "mlrd"],
  ru: ["млн", "млрд"],
  en: ["M", "B"],
};
const MILLION = 1e6;
const BILLION = 1e9;

/** Big sums stay readable: 3 200 000 000 UZS becomes "3.2 mlrd UZS". Zero reads as "—". */
export function formatMoney(value: unknown, currency: string, lang: Lang): string {
  const number = Number(value);
  if (!Number.isFinite(number) || !number) return "—";
  const suffix = currency ? ` ${currency}` : "";
  const [million, billion] = MONEY_UNITS[lang];
  if (Math.abs(number) >= BILLION) return `${formatNumber(number / BILLION, lang, 2)} ${billion}${suffix}`;
  if (Math.abs(number) >= MILLION) return `${formatNumber(number / MILLION, lang, 2)} ${million}${suffix}`;
  return formatNumber(number, lang) + suffix;
}

export const formatPercent = (value: unknown, lang: Lang): string =>
  Number.isFinite(Number(value)) ? `${formatNumber(value, lang, 0)}%` : "—";

type QueryValue = string | number | boolean | null | undefined;

/** As queryString, and also drops null, undefined and false, the way MK.qs does. */
export function marketQuery(params: Record<string, QueryValue>): string {
  return Object.entries(params)
    .filter(([, value]) => value !== "" && value != null && value !== false)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
}

/** Never rejects: failures come back as `{ error: "network" | "bad_response" }`. */
export async function marketJson(path: string, body?: object): Promise<Json> {
  try {
    const options = body
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      : undefined;
    const response = await fetch(path, options);
    try {
      return record(await response.json());
    } catch {
      return { error: "bad_response" };
    }
  } catch {
    return { error: "network" };
  }
}

export type CompanySession = { login: string; password: string; id: string; name: string; sector: string };

const COMPANY_KEY = "mk_co";

function storedCompany(): CompanySession | null {
  try {
    const stored = record(JSON.parse(readStored("sessionStorage", COMPANY_KEY) ?? "null"));
    if (!text(stored.login)) return null;
    return {
      login: text(stored.login),
      password: text(stored.password),
      id: text(stored.id),
      name: text(stored.name),
      sector: text(stored.sector),
    };
  } catch {
    return null;
  }
}

/* Company credentials last for the session only, so a shared machine does
   not leave a seller cabinet unlocked. */
export const companyIdentity = {
  company: storedCompany,
  setCompany(company: CompanySession | null): void {
    if (company) writeStored("sessionStorage", COMPANY_KEY, JSON.stringify(company));
    else removeStored("sessionStorage", COMPANY_KEY);
  },
  /** Credentials to attach to a request that needs a company (MK.ident.co). */
  withCompany<T extends object>(extra: T): T & { login?: string; password?: string } {
    const company = storedCompany();
    return company ? { ...extra, login: company.login, password: company.password } : { ...extra };
  },
  /** Identity to attach to a request that accepts a person (MK.ident.me). */
  withPerson<T extends object>(extra: T): T & { email: string; name: string } {
    return { ...extra, email: identity.email(), name: identity.name() };
  },
};

/** Signs in with the credentials company.html issues. Resolves to the session, or null. */
export async function companyLogin(login: string, password: string): Promise<CompanySession | null> {
  const answer = await marketJson("/api/company/login", { login, password });
  if (!answer.ok) return null;
  const company = record(answer.company);
  const session = { login, password, id: text(company.id), name: text(company.name), sector: text(company.sector) };
  companyIdentity.setCompany(session);
  return session;
}
