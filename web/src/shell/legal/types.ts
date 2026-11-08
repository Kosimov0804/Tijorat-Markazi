export type DocLang = "uz" | "ru";
export type LocalizedText = Partial<Record<DocLang | "en", string>>;
export type OperatorField = string | LocalizedText | null | undefined;

export type LegalDocMeta = {
  title?: LocalizedText;
  version?: string;
  effective?: string;
};

type CollectedRow = LocalizedText & { purpose?: LocalizedText };
type TransferRow = LocalizedText & { to?: string; service?: string };

/** The /api/legal payload: requisites, versions and data-handling tables. */
export type LegalConfig = {
  ok: boolean;
  ready?: boolean;
  responseDays?: number | null;
  operator?: Record<string, OperatorField>;
  docs?: Record<string, LegalDocMeta | undefined>;
  collected?: CollectedRow[];
  retention?: Record<string, LocalizedText>;
  transfers?: TransferRow[];
};

export type LegalSection = {
  h: LocalizedText;
  p?: LocalizedText[];
  slot?: string;
  list?: LocalizedText[];
  after?: LocalizedText[];
  links?: string[];
};

/** One legal document as written in legal-text-*.js. */
export type LegalText = {
  lead?: LocalizedText;
  sections: LegalSection[];
};

export const toDocLang = (lang: string): DocLang => (lang === "ru" ? "ru" : "uz");

export const pickDocText = (text: LocalizedText | undefined, docLang: DocLang): string =>
  text?.[docLang] || text?.uz || "";

export function readOperatorField(field: OperatorField, docLang: DocLang): string {
  if (!field) return "";
  return typeof field === "object" ? pickDocText(field, docLang) : field;
}
