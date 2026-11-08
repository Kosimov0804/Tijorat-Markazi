import { useEffect, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { flushSync } from "react-dom";
import { useI18n } from "./i18n";

interface NavLinkDef {
  href: string;
  labelKey: string;
}

interface NavGroupDef {
  id: string;
  labelKey: string;
  links: readonly NavLinkDef[];
}

type NavEntry = NavLinkDef | NavGroupDef;

const NAV: readonly NavEntry[] = [
  { href: "index.html", labelKey: "nav_home" },
  {
    id: "markets",
    labelKey: "nav_markets",
    links: [
      { href: "bozor.html", labelKey: "nav_bozor" },
      { href: "moliya.html", labelKey: "nav_moliya" },
      { href: "mehnat.html", labelKey: "nav_mehnat" },
    ],
  },
  { href: "showroom.html", labelKey: "nav_showroom" },
  {
    id: "services",
    labelKey: "nav_services",
    links: [
      { href: "xizmatlar.html", labelKey: "nav_svc_members" },
      { href: "davlat-xizmatlari.html", labelKey: "nav_gov_services" },
      { href: "biznes-id.html", labelKey: "nav_bizid" },
    ],
  },
  { href: "associations.html", labelKey: "nav_uyush" },
  { href: "about.html", labelKey: "nav_about" },
];

const pointerIsFine = (): boolean => window.matchMedia("(hover:hover) and (pointer:fine)").matches;

interface SiteNavProps {
  /** Filename of the current page, marked active in the bar. */
  active?: string;
  isMenuOpen: boolean;
  isCollapsed: boolean;
  /** The legal and sign-up pages carry a shorter bar. */
  hideServices?: boolean;
  /** Whether the group holding the current page is highlighted too. */
  isGroupHighlighted?: boolean;
  onLinkClick: () => void;
  /** Action buttons, which sit at the bottom of the menu while collapsed. */
  children?: ReactNode;
}

export function SiteNav({
  active,
  isMenuOpen,
  isCollapsed,
  hideServices,
  isGroupHighlighted = true,
  onLinkClick,
  children,
}: SiteNavProps) {
  const { t } = useI18n();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: globalThis.MouseEvent) => {
      if (!(event.target as Element).closest(".nav-group")) setOpenGroup(null);
    };
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const button = navRef.current?.querySelector<HTMLElement>(".nav-group.is-open .nav-gbtn");
      if (!button) return;
      setOpenGroup(null);
      button.focus();
    };
    const closeOnResize = () => setOpenGroup(null);
    document.addEventListener("click", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnResize, { passive: true });
    return () => {
      document.removeEventListener("click", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnResize);
    };
  }, []);

  /* Leaving the burger menu collapses every group, so reopening it does not
     reveal whatever was expanded last time. */
  useEffect(() => {
    if (!isMenuOpen) setOpenGroup(null);
  }, [isMenuOpen]);

  const handleGroupClick = (event: MouseEvent<HTMLButtonElement>, id: string) => {
    event.preventDefault();
    /* A touch tap sends mouseenter first, so the menu is already open when the
       click lands. Only a pointer really hovering counts as "close". */
    const isHovering = event.currentTarget.closest(".nav-group")?.matches(":hover") ?? false;
    const shouldClose = openGroup === id && (!isHovering || pointerIsFine());
    setOpenGroup(shouldClose ? null : id);
  };

  const handleGroupKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    /* The menu is visibility:hidden until is-open lands, and a hidden link
       cannot take focus. */
    flushSync(() => setOpenGroup(id));
    event.currentTarget.closest(".nav-group")?.querySelector<HTMLElement>(".nav-menu a")?.focus();
  };

  const handleGroupBlur = (event: FocusEvent<HTMLDivElement>, id: string) => {
    if (isCollapsed || event.currentTarget.contains(event.relatedTarget)) return;
    setOpenGroup(current => (current === id ? null : current));
  };

  /* Hover only where a menu really floats; in the burger it expands inline. */
  const hoverOpens = () => pointerIsFine() && !isCollapsed;

  const renderLink = ({ href, labelKey }: NavLinkDef) => (
    <a key={href} href={href} className={href === active ? "active" : undefined}>
      {t(labelKey)}
    </a>
  );

  return (
    <nav
      ref={navRef}
      id="nav"
      className={isMenuOpen ? "nav open" : "nav"}
      onClick={event => {
        if ((event.target as Element).closest("a")) onLinkClick();
      }}
    >
      {NAV.filter(entry => !(hideServices && "id" in entry && entry.id === "services")).map(entry => {
        if (!("links" in entry)) return renderLink(entry);
        const isOpen = openGroup === entry.id;
        const holdsCurrentPage = isGroupHighlighted && entry.links.some(link => link.href === active);
        const groupClass = ["nav-group", isOpen && "is-open", holdsCurrentPage && "is-active"]
          .filter(Boolean)
          .join(" ");
        return (
          <div
            key={entry.id}
            className={groupClass}
            onMouseEnter={() => {
              if (hoverOpens()) setOpenGroup(entry.id);
            }}
            onMouseLeave={() => {
              if (hoverOpens()) setOpenGroup(current => (current === entry.id ? null : current));
            }}
            onBlur={event => handleGroupBlur(event, entry.id)}
          >
            <button
              className="nav-gbtn"
              type="button"
              aria-expanded={isOpen}
              aria-haspopup="true"
              onClick={event => handleGroupClick(event, entry.id)}
              onKeyDown={event => handleGroupKeyDown(event, entry.id)}
            >
              {t(entry.labelKey)}
            </button>
            <div className="nav-menu">{entry.links.map(renderLink)}</div>
          </div>
        );
      })}
      {children}
    </nav>
  );
}
