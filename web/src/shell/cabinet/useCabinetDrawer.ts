/**
 * CABINET DRAWER — the sidebar as an off-canvas drawer below 900px
 * (port of cabinet-nav.js). CabinetShell wires it; use it directly only for a
 * cabinet that cannot use CabinetShell.
 *
 *   const drawer = useCabinetDrawer();
 *   <div className={drawer.isOpen ? "admin-shell side-open" : "admin-shell"}>
 *     <aside ref={drawer.sideRef} onClick={drawer.handleSideClick} onKeyDown={drawer.handleSideKeyDown}>
 *     <button ref={drawer.burgerRef} aria-expanded={drawer.isOpen} onClick={drawer.toggle}>
 *     <div className="cab-scrim" hidden={!drawer.isOpen} onClick={() => drawer.close(true)} />
 *
 * Opens only while the drawer is the layout. Closes on the scrim, Escape,
 * picking a destination, or the window growing past the breakpoint. While open
 * the page behind does not scroll and Tab stays inside the sidebar.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, RefObject } from "react";

const DRAWER_QUERY = "(max-width:900px)";
const FOCUSABLE = "button, a, input, select";

const isDrawerLayout = (): boolean => window.matchMedia(DRAWER_QUERY).matches;

export type CabinetDrawer = {
  isOpen: boolean;
  sideRef: RefObject<HTMLElement | null>;
  burgerRef: RefObject<HTMLButtonElement | null>;
  toggle: () => void;
  /** `returnFocus` puts the caret back where it was before the drawer opened. */
  close: (returnFocus: boolean) => void;
  handleSideClick: (event: MouseEvent<HTMLElement>) => void;
  handleSideKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
};

function focusableIn(side: HTMLElement): HTMLElement[] {
  return [...side.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    node => !node.hasAttribute("disabled") && node.offsetParent !== null,
  );
}

export function useCabinetDrawer(): CabinetDrawer {
  const [isOpen, setIsOpen] = useState(false);
  const sideRef = useRef<HTMLElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<Element | null>(null);
  const openRef = useRef(false);

  const close = useCallback((returnFocus: boolean) => {
    if (!openRef.current) return;
    openRef.current = false;
    setIsOpen(false);
    if (!returnFocus) return;
    const target = lastFocus.current instanceof HTMLElement ? lastFocus.current : burgerRef.current;
    target?.focus();
  }, []);

  const toggle = useCallback(() => {
    if (openRef.current) {
      close(true);
      return;
    }
    if (!isDrawerLayout()) return;
    lastFocus.current = document.activeElement;
    openRef.current = true;
    setIsOpen(true);
  }, [close]);

  /* The drawer covers the page, so the page behind it must not scroll. */
  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.style.overflow = "hidden";
    sideRef.current?.querySelector<HTMLElement>("button, a")?.focus();
    const handleKey = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") close(true);
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, close]);

  /* A drawer left open behind a resize would sit invisibly over the desktop
     layout and lock scrolling, so close it when it stops being the layout. */
  useEffect(() => {
    let wasDrawer = isDrawerLayout();
    const handleResize = (): void => {
      const isDrawer = isDrawerLayout();
      if (wasDrawer && !isDrawer) close(false);
      wasDrawer = isDrawer;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [close]);

  /* Picking a destination is the end of navigating: get out of the way. */
  const handleSideClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (event.target instanceof Element && event.target.closest("button, a")) close(false);
    },
    [close],
  );

  const handleSideKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab" || !openRef.current || !sideRef.current) return;
    const items = focusableIn(sideRef.current);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  return { isOpen, sideRef, burgerRef, toggle, close, handleSideClick, handleSideKeyDown };
}
