import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { LANGS, T } from "@legacy/data.js";
import type { Lang, Localized } from "@legacy/data.js";
import { useI18n } from "../../shell/i18n";
import { formatDay, formatNumber } from "../../shell/market/mk";
import { REF, labelOf, refItem } from "./engine/engine";
import type { LocalizedName, Passport, RefItem } from "./engine/types";

export type Dictionary = Readonly<Record<string, Localized | undefined>>;

const MONEY_UNITS: Record<Lang, readonly [string, string]> = {
  uz: ["mln", "mlrd"],
  ru: ["млн", "млрд"],
  en: ["M", "B"],
};

/** What market-kit.js and the scoring atoms offered, bound to the current language. */
export interface Kit {
  lang: Lang;
  /** Page dictionary first, then the shared one, then the fallback or the key. */
  t: (key: string, fallback?: string) => string;
  num: (value: unknown, digits?: number) => string;
  /** Big sums stay readable: 3 200 000 000 UZS reads "3.2 mlrd UZS". Zero reads "—". */
  money: (value: unknown, currency: string | undefined) => string;
  pctTxt: (value: unknown) => string;
  /** One decimal place: the IRR is compared with its hurdle to a tenth of a point. */
  pct1: (value: number | null | undefined) => string;
  day: (timestamp: unknown) => string;
  label: (item: Partial<LocalizedName> | string | null | undefined) => string;
  refName: (items: readonly RefItem[], id: unknown) => string;
  sectorName: (passport: Partial<Passport>) => string;
  regionName: (passport: Partial<Passport>) => string;
}

const DictionaryContext = createContext<Dictionary | null>(null);

export function MoliyaText({ dictionary, children }: { dictionary: Dictionary; children: ReactNode }) {
  return <DictionaryContext.Provider value={dictionary}>{children}</DictionaryContext.Provider>;
}

function buildKit(lang: Lang, dictionary: Dictionary): Kit {
  const index = LANGS.indexOf(lang);
  const num: Kit["num"] = (value, digits) => formatNumber(value, lang, digits);
  const label: Kit["label"] = item => labelOf(item, lang);
  const refName: Kit["refName"] = (items, id) => label(refItem(items, id)) || "";
  return {
    lang,
    t: (key, fallback) => (dictionary[key] ?? T[key])?.[index] ?? fallback ?? key,
    num,
    money(value, currency) {
      const amount = Number(value);
      if (!Number.isFinite(amount) || !amount) return "—";
      const suffix = currency ? ` ${currency}` : "";
      const [million, billion] = MONEY_UNITS[lang];
      if (Math.abs(amount) >= 1e9) return `${num(amount / 1e9, 2)} ${billion}${suffix}`;
      if (Math.abs(amount) >= 1e6) return `${num(amount / 1e6, 2)} ${million}${suffix}`;
      return num(amount) + suffix;
    },
    pctTxt: value => (Number.isFinite(Number(value)) ? `${num(value, 0)}%` : "—"),
    pct1: value => (value == null || !isFinite(value) ? "—" : `${num(value, 1)}%`),
    day: timestamp => formatDay(timestamp, lang),
    label,
    refName,
    sectorName: passport => refName(REF.sectors, passport.sektor) || passport.sektor || "",
    regionName: passport => refName(REF.regions, passport.hudud) || passport.hudud || "",
  };
}

export function useKit(): Kit {
  const { lang } = useI18n();
  const dictionary = useContext(DictionaryContext);
  if (!dictionary) throw new Error("useKit must be used inside MoliyaText");
  return useMemo(() => buildKit(lang, dictionary), [lang, dictionary]);
}

/** Fills {name} placeholders of a dictionary sentence with plain text. */
export function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((out, [name, value]) => out.split(`{${name}}`).join(value), template);
}
