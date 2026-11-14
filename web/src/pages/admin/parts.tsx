import { useCallback, useEffect, useState } from "react";
import type { CSSProperties, DependencyList, ReactNode } from "react";

export const CENTER: CSSProperties = { textAlign: "center" };
export const SMALL_BUTTON: CSSProperties = { padding: "5px 11px", fontSize: 13 };
export const LETTER_BUTTON: CSSProperties = { padding: "6px 12px", fontSize: 13 };

/** The muted paragraph under a panel heading. */
export function Intro({ gap = 16, children }: { gap?: number; children: ReactNode }) {
  return <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: gap }}>{children}</p>;
}

/** A value, or the dash the old tables printed for an empty one. */
export const orDash = (value: string): string => value || "—";

export { classToken, localDateTime } from "../../shell/cabinet";

interface Loader<T> {
  /** Null until the first answer arrives, and after a request that failed. */
  data: T | null;
  setData: (data: T) => void;
  reload: () => void;
}

/* Loads when the view opens and whenever a dependency changes. A failed
   request leaves the view on its empty state, as the old panel did. */
export function useLoader<T>(load: () => Promise<T>, deps: DependencyList): Loader<T> {
  const [data, setData] = useState<T | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    load()
      .then(answer => {
        if (isCurrent) setData(answer);
      })
      .catch(() => {
        if (isCurrent) setData(null);
      });
    return () => {
      isCurrent = false;
    };
    // The loader is rebuilt on every render; the caller lists what it reads.
  }, [...deps, round]);

  const reload = useCallback(() => setRound(current => current + 1), []);
  return { data, setData, reload };
}
