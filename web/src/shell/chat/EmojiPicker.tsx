import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { EMOJI_CATEGORIES } from "./emoji";

interface EmojiPickerProps {
  isOpen: boolean;
  /** The button that toggles the panel; a click on it is not an outside click. */
  toggleRef: RefObject<HTMLElement | null>;
  onPick: (emoji: string) => void;
  onClose: () => void;
}

/** The emoji panel. Built on first opening, then kept so its tab is remembered. */
export function EmojiPicker({ isOpen, toggleRef, onPick, onClose }: EmojiPickerProps) {
  const [hasOpened, setHasOpened] = useState(isOpen);
  const [category, setCategory] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  if (isOpen && !hasOpened) setHasOpened(true);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target) || toggleRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isOpen, onClose, toggleRef]);

  if (!hasOpened) return null;
  return (
    <div className={isOpen ? "ck-emoji open" : "ck-emoji"} ref={panelRef}>
      <div className="ck-emoji-tabs">
        {EMOJI_CATEGORIES.map((item, index) => (
          <button
            key={item.tab}
            type="button"
            className={index === category ? "ck-tab on" : "ck-tab"}
            onClick={() => setCategory(index)}
          >
            {item.tab}
          </button>
        ))}
      </div>
      <div className="ck-emoji-grid">
        {EMOJI_CATEGORIES[category].glyphs.map((glyph, index) => (
          <button key={index} type="button" className="ck-e" onClick={() => onPick(glyph)}>
            {glyph}
          </button>
        ))}
      </div>
    </div>
  );
}
