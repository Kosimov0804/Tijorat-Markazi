import { LANGS } from "@legacy/data.js";
import type { Lang } from "@legacy/data.js";
import { safeMediaUrl } from "../../shell/chat/urls";
import type { CabinetCredentials } from "../../shell/cabinet";
import { useI18n } from "../../shell/i18n";
import { listOf, record, text } from "../../shell/market/narrow";
import { AT } from "./text";
import type { AssocTextKey } from "./text";

export const SESSION_KEY = "kg_as";

export type AssocText = (key: AssocTextKey) => string;

/** The association cabinet's own dictionary, in the reader's language. */
export function useAssocText(): AssocText {
  const { pick } = useI18n();
  return key => pick(AT[key]);
}

/** What every cabinet view is handed. */
export type ViewProps = { credentials: CabinetCredentials; at: AssocText };

export type Product = { name: string; price: string; desc: string; img: string };

export type MemberCompany = {
  id: string;
  name: string;
  sector: string;
  login: string;
  created: string | number | null;
  showroom: Product[];
};

export type Association = { id: string; name: string; chairman: string; i18n: Partial<Record<Lang, string>> };
export type Account = { assoc: Association; companies: MemberCompany[] };

function parseProduct(value: unknown): Product {
  const item = record(value);
  return { name: text(item.name), price: text(item.price), desc: text(item.desc), img: safeMediaUrl(item.img) };
}

function parseCompany(value: unknown): MemberCompany {
  const item = record(value);
  const created = typeof item.created === "number" || typeof item.created === "string" ? item.created : null;
  return {
    id: text(item.id),
    name: text(item.name),
    sector: text(item.sector),
    login: text(item.login),
    created: created || null,
    showroom: listOf(item.showroom, parseProduct),
  };
}

export const parseCompanies = (value: unknown): MemberCompany[] => listOf(value, parseCompany);

export function parseAssociation(value: unknown): Association {
  const item = record(value);
  const names = record(item.i18n);
  return {
    id: text(item.id),
    name: text(item.name),
    chairman: text(item.chairman),
    i18n: Object.fromEntries(LANGS.map(lang => [lang, text(names[lang])])),
  };
}

/** An association's name in the reader's language. */
export const assocName = (assoc: Association, lang: Lang): string => assoc.i18n[lang] || assoc.name;
