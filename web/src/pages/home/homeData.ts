import type { Lang } from "@legacy/data.js";

/* The three public responses the home page reads. Nothing here is trusted:
   every field is rendered as JSX text, and ids go through encodeURIComponent. */

export interface Association {
  id: string;
  name?: string;
  i18n?: Partial<Record<Lang, string>>;
  chairman?: string;
  companies?: number;
}

export interface DirectoryItem {
  bizId?: string;
  kind?: "assoc" | "company";
  name?: string;
  i18n?: Partial<Record<Lang, string>> | null;
  sector?: string;
}

export interface Directory {
  ok?: boolean;
  items?: DirectoryItem[];
}

export interface ShowroomItem {
  id: string;
  name?: string;
  price?: string;
  desc?: string;
  img?: string;
  company?: string;
  sector?: string;
}

export interface Showroom {
  items?: ShowroomItem[];
  companies?: string[];
  total?: number;
}

/** A name in the current language, with the stray leading dash some names carry removed. */
export function localName(row: { name?: string; i18n?: Partial<Record<Lang, string>> | null }, lang: Lang): string {
  return (row.i18n?.[lang] || row.name || "").replace(/^[-\s]+/, "");
}

export const initialOf = (name: string): string => name.charAt(0).toUpperCase();

/** Busiest first: a preview should lead with the associations that have members. */
export function byMembers(associations: readonly Association[]): Association[] {
  return [...associations].sort((a, b) => (b.companies ?? 0) - (a.companies ?? 0));
}

/** Photographed products first: a preview grid of placeholders sells nothing. */
export function byPhoto(items: readonly ShowroomItem[]): ShowroomItem[] {
  return [...items].sort((a, b) => Number(Boolean(b.img)) - Number(Boolean(a.img)));
}

export const companiesOf = (directory: Directory | null): DirectoryItem[] =>
  (directory?.items ?? []).filter(item => item.kind === "company" && Boolean(item.bizId));
