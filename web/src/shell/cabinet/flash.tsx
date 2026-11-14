/**
 * FLASH NOTE — the short "✓ Saved" line that fades out beside a cabinet form.
 *
 *   const flash = useFlash();                 // default 2200 ms on screen
 *   flash.show("✓ Saqlandi");                 // green
 *   flash.show("Error", false);               // gold: something went wrong
 *   <FlashNote id="confMsg" flash={flash} />  // <span class="ac-sub">, opacity 0 at rest
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

const DEFAULT_VISIBLE_MS = 2200;

export type Flash = {
  text: string;
  isOk: boolean;
  isVisible: boolean;
  show: (text: string, isOk?: boolean) => void;
};

export function useFlash(visibleMs: number = DEFAULT_VISIBLE_MS): Flash {
  const [note, setNote] = useState({ text: "", isOk: true, isVisible: false });
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const show = useCallback(
    (text: string, isOk = true) => {
      window.clearTimeout(timer.current);
      setNote({ text, isOk, isVisible: true });
      timer.current = window.setTimeout(() => setNote(current => ({ ...current, isVisible: false })), visibleMs);
    },
    [visibleMs],
  );

  return { ...note, show };
}

type FlashNoteProps = { id?: string; flash: Flash; style?: CSSProperties };

export function FlashNote({ id, flash, style }: FlashNoteProps) {
  const color = flash.isOk ? "var(--green)" : "var(--gold)";
  return (
    <span
      className="ac-sub"
      id={id}
      aria-live="polite"
      style={{ ...style, opacity: flash.isVisible ? 1 : 0, color: flash.text ? color : undefined }}
    >
      {flash.text}
    </span>
  );
}
