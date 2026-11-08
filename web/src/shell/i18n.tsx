import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { LANGS, T } from "@legacy/data.js";
import type { Lang, Localized } from "@legacy/data.js";
import { readStored, writeStored } from "./storage";

const LANG_KEY = "kg_lang";

interface I18nValue {
  lang: Lang;
  /** Translates a key from the shared T dictionary. */
  t: (key: string) => string;
  /** Reads the current language out of a [uz, ru, en] tuple. */
  pick: (values: Localized) => string;
  cycleLang: () => void;
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLang(): Lang {
  const stored = readStored("localStorage", LANG_KEY);
  return LANGS.find(lang => lang === stored) ?? "uz";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18nValue>(() => {
    const index = LANGS.indexOf(lang);
    return {
      lang,
      t: key => T[key]?.[index] ?? "",
      pick: values => values[index],
      cycleLang: () => {
        const next = LANGS[(index + 1) % LANGS.length];
        writeStored("localStorage", LANG_KEY, next);
        setLang(next);
      },
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
