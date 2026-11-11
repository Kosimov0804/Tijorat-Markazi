import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { stamp } from "./format";

export interface LightboxItem {
  /** Already checked with safeMediaUrl. */
  url: string;
  name?: string;
  from?: string;
  time?: number;
}

interface LightboxProps {
  items: readonly LightboxItem[];
  /** Which item to show first, or null while the viewer is closed. */
  openAt: number | null;
  onClose: () => void;
}

const stopBubbling = (event: { stopPropagation: () => void }): void => event.stopPropagation();

/* The media viewer, the way Telegram does it: the photo carries who sent it
   and when, its place in the conversation, and arrows to walk the rest. */
export function Lightbox({ items, openAt, onClose }: LightboxProps) {
  const isOpen = openAt !== null && items.length > 0;
  const [position, setPosition] = useState(0);
  const [lastOpenAt, setLastOpenAt] = useState<number | null>(null);
  if (openAt !== lastOpenAt) {
    setLastOpenAt(openAt);
    if (openAt !== null) setPosition(openAt);
  }

  const count = items.length;
  const index = count ? ((position % count) + count) % count : 0;
  const item = count ? items[index] : undefined;

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") setPosition(current => current - 1);
      if (event.key === "ArrowRight") setPosition(current => current + 1);
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const step = (delta: number) => (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    setPosition(current => current + delta);
  };

  return createPortal(
    <div className={isOpen ? "ck-lb open" : "ck-lb"} onClick={onClose}>
      <div className="ck-lb-bar" onClick={stopBubbling}>
        <span className="ck-lb-who">
          <b>{item?.from ?? ""}</b>
          <em>{item?.time ? stamp(item.time) : ""}</em>
        </span>
        <a className="ck-lb-btn ck-lb-dl" href={item?.url} download={item?.name || "photo"} title="Yuklab olish">
          ⤓
        </a>
        <button className="ck-lb-btn ck-lb-x" type="button" aria-label="close" onClick={onClose}>
          ✕
        </button>
      </div>
      <button className="ck-lb-nav prev" type="button" aria-label="previous" hidden={count < 2} onClick={step(-1)}>
        ‹
      </button>
      <figure className="ck-lb-stage" onClick={stopBubbling}>
        <img alt="" src={isOpen ? item?.url : undefined} />
      </figure>
      <button className="ck-lb-nav next" type="button" aria-label="next" hidden={count < 2} onClick={step(1)}>
        ›
      </button>
      <div className="ck-lb-foot">
        <span className="ck-lb-count">{count > 1 ? `${index + 1} / ${count}` : ""}</span>
      </div>
    </div>,
    document.body,
  );
}
