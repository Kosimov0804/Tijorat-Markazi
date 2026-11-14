import { useCallback, useEffect, useState } from "react";
import type { Lang } from "@legacy/data.js";
import { useI18n } from "../../shell/i18n";
import { AT } from "./text";
import type { AdminTextKey } from "./text";

export type Tx = (key: AdminTextKey) => string;

/** The panel's own dictionary in the active language. */
export function useText(): { tx: Tx; lang: Lang } {
  const { lang, pick } = useI18n();
  const tx = useCallback<Tx>(key => pick(AT[key]), [pick]);
  return { tx, lang };
}

export const isTextKey = (key: string): key is AdminTextKey => Object.hasOwn(AT, key);

/* The shared provider only steps to the next language. The settings view has
   one button per language, so this steps until the chosen one is reached. */
export function useChooseLang(): (lang: Lang) => void {
  const { lang, cycleLang } = useI18n();
  const [wanted, setWanted] = useState<Lang | null>(null);

  useEffect(() => {
    if (!wanted) return;
    if (wanted === lang) setWanted(null);
    else cycleLang();
  }, [wanted, lang, cycleLang]);

  return setWanted;
}
