import { useLayoutEffect, useRef } from "react";
import { useGroupText } from "./text";

export type MessageAction = "reply" | "edit" | "delete";

type MessageMenuProps = {
  canEdit: boolean;
  canDelete: boolean;
  onReact: (emoji: string) => void;
  onAction: (action: MessageAction) => void;
};

const QUICK_REACTIONS = ["👍", "❤️", "🔥", "👏", "😂", "🙏"] as const;
const EDGE_PAD = 8;

/* The menu is anchored to the message bubble, so on a narrow column it can
   hang past the edge of the scrolling area and get clipped. Nudge it back
   into view, and open it upwards when there is no room below. */
function fitMenu(menu: HTMLElement): void {
  const box = menu.closest(".tg-body");
  if (!box) return;
  const bounds = box.getBoundingClientRect();
  let rect = menu.getBoundingClientRect();

  let shift = 0;
  if (rect.width <= bounds.width - EDGE_PAD * 2) {
    if (rect.left < bounds.left + EDGE_PAD) shift = bounds.left + EDGE_PAD - rect.left;
    else if (rect.right > bounds.right - EDGE_PAD) shift = bounds.right - EDGE_PAD - rect.right;
  } else {
    /* Genuinely wider than the column: pin to the left edge and let it wrap. */
    shift = bounds.left + EDGE_PAD - rect.left;
    menu.style.maxWidth = `${Math.max(0, Math.round(bounds.width - EDGE_PAD * 2))}px`;
  }
  if (shift) menu.style.transform = `translateX(${Math.round(shift)}px)`;

  rect = menu.getBoundingClientRect();
  if (rect.bottom > bounds.bottom - EDGE_PAD && rect.height < bounds.height) {
    menu.style.top = "auto";
    menu.style.bottom = "24px";
  }
}

/** Reply, react, edit and delete for one message. */
export function MessageMenu({ canEdit, canDelete, onReact, onAction }: MessageMenuProps) {
  const text = useGroupText();
  const menuRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (menuRef.current) fitMenu(menuRef.current);
  }, []);

  return (
    <div className="tg-menu" ref={menuRef}>
      <div className="tg-menu-quick">
        {QUICK_REACTIONS.map(emoji => (
          <button key={emoji} type="button" onClick={() => onReact(emoji)}>
            {emoji}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => onAction("reply")}>
        {text("reply")}
      </button>
      {canEdit && (
        <button type="button" onClick={() => onAction("edit")}>
          {text("edit")}
        </button>
      )}
      {canDelete && (
        <button type="button" className="bad" onClick={() => onAction("delete")}>
          {text("del")}
        </button>
      )}
    </div>
  );
}
