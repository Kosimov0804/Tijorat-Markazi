/*
 * MK.drawer / MK.closeDrawer: the side panel for a card's detail.
 *
 *   <Drawer title onClose>…</Drawer>
 *
 * Render it while it should be open. It closes on the backdrop, the × button
 * and Escape, and holds the page still behind it.
 */
import { useEffect } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type DrawerProps = { title: string; onClose: () => void; children: ReactNode };

export function Drawer({ title, onClose, children }: DrawerProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div id="mkDrawer" className="mk-drawer is-open">
      <div className="mk-drawer-bg" onClick={onClose} />
      <aside className="mk-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="mkDrawerTitle">
        <div className="mk-drawer-head">
          <h2 id="mkDrawerTitle">{title}</h2>
          <button className="mk-x" type="button" aria-label="Yopish" onClick={onClose}>
            ×
          </button>
        </div>
        <div id="mkDrawerBody">{children}</div>
      </aside>
    </div>,
    document.body,
  );
}
