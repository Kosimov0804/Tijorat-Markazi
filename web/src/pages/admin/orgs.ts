import { useCallback, useMemo, useState } from "react";
import type { Lang } from "@legacy/data.js";
import { asArray, asString, isRecord } from "../../shell/chat";
import { adminPostSafe } from "./api";
import type { Body } from "./api";

export interface Association {
  id: string;
  name: string;
  i18n: Readonly<Record<string, string>>;
  chairman: string;
  login: string;
}

export interface Company {
  id: string;
  assocId: string;
  name: string;
  sector: string;
  login: string;
  /** A timestamp or a date string; the growth chart reads it. */
  created: unknown;
  productCount: number;
}

export interface Orgs {
  associations: readonly Association[];
  companies: readonly Company[];
  rais: { login: string; tgChat: string };
}

export const EMPTY_ORGS: Orgs = { associations: [], companies: [], rais: { login: "", tgChat: "" } };

function parseNames(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([lang, name]) => [lang, asString(name)]));
}

function parseAssociation(value: unknown): Association {
  const item = isRecord(value) ? value : {};
  return {
    id: asString(item.id),
    name: asString(item.name),
    i18n: parseNames(item.i18n),
    chairman: asString(item.chairman),
    login: asString(item.login),
  };
}

function parseCompany(value: unknown): Company {
  const item = isRecord(value) ? value : {};
  return {
    id: asString(item.id),
    assocId: asString(item.assocId),
    name: asString(item.name),
    sector: asString(item.sector),
    login: asString(item.login),
    created: item.created,
    productCount: asArray(item.showroom).length,
  };
}

/** The answer of /api/orgs, or null when it is an error or anything else. */
export function parseOrgs(value: unknown): Orgs | null {
  if (!isRecord(value) || value.error || !Array.isArray(value.associations)) return null;
  const rais = isRecord(value.rais) ? value.rais : {};
  return {
    associations: value.associations.map(parseAssociation),
    companies: asArray(value.companies).map(parseCompany),
    rais: { login: asString(rais.login), tgChat: asString(rais.tgChat) },
  };
}

/** An association's name in the active language. */
export const assocName = (association: Association | undefined, lang: Lang): string =>
  association?.i18n[lang] || association?.name || "";

/** The error code of an answer, or "" when it carries none. */
export const errorOf = (answer: unknown): string => (isRecord(answer) ? asString(answer.error) : "");

export interface OrgsStore {
  orgs: Orgs;
  /** Sends one /api/orgs operation. An answer shaped like the registry replaces it; the raw answer is returned. */
  send: (body: Body) => Promise<unknown>;
}

/* admin.js kept one ORGS object that every view read and every answer
   replaced. Here it lives in the shell and the views receive this store. */
export function useOrgsStore(): OrgsStore {
  const [orgs, setOrgs] = useState<Orgs>(EMPTY_ORGS);
  const send = useCallback(async (body: Body) => {
    const answer = await adminPostSafe("/api/orgs", body);
    const parsed = parseOrgs(answer);
    if (parsed) setOrgs(parsed);
    return answer;
  }, []);
  return useMemo(() => ({ orgs, send }), [orgs, send]);
}
