import { useState } from "react";
import { ICON_MOON, ICON_SUN } from "@legacy/data.js";
import { useI18n } from "./i18n";
import { trustedHtml } from "./trustedHtml";
import { useAccount } from "./useAccount";
import { useHeaderFit } from "./useHeaderFit";
import { useTheme } from "./useTheme";
import { SiteNav } from "./SiteNav";

/** `label` is for text from a page dictionary, already translated. */
export type HeaderAction = { href: string; labelKey: string } | { href: string; label: string };

interface SiteHeaderProps {
  active?: string;
  action?: HeaderAction;
  hideServices?: boolean;
  hasSessionActions?: boolean;
  isGroupHighlighted?: boolean;
}

export function SiteHeader({
  active,
  action,
  hideServices,
  hasSessionActions = true,
  isGroupHighlighted,
}: SiteHeaderProps) {
  const { lang, t, cycleLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { panelUrl, logout } = useAccount();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { headerInnerRef, isCollapsed, isBarCollapsed, isCompact } = useHeaderFit(`${lang}:${panelUrl ?? ""}`);

  /* The .nav.open rules exist only while collapsed. A leftover class would be
     invisible on the wide bar, then drop the panel open by itself the next
     time the header collapses. Keyed on the settled value: a phone's address
     bar fires resize while scrolling, and must not shut an open menu. */
  const [wasBarCollapsed, setWasBarCollapsed] = useState(isBarCollapsed);
  if (wasBarCollapsed !== isBarCollapsed) {
    setWasBarCollapsed(isBarCollapsed);
    if (!isBarCollapsed) setIsMenuOpen(false);
  }

  const isSignedIn = hasSessionActions && panelUrl !== null;
  /* Someone already signed in has no use for the sign-in link. */
  const visibleAction = isSignedIn && action?.href === "assistant.html" ? undefined : action;
  const buttonClass = isCollapsed ? "btn btn-ghost nav-action" : "btn btn-ghost";

  const actionButtons = (
    <>
      {visibleAction && (
        <a className={buttonClass} href={visibleAction.href}>
          {"label" in visibleAction ? visibleAction.label : t(visibleAction.labelKey)}
        </a>
      )}
      {isSignedIn && (
        <button id="globalLogout" type="button" className={buttonClass} onClick={logout}>
          {t("asst_logout")}
        </button>
      )}
    </>
  );

  return (
    <header className={isCompact ? "site-header is-compact" : "site-header"}>
      <div className="container header-inner" ref={headerInnerRef}>
        <a className="brand" href="index.html">
          <span className="brand-text">
            <strong>TIJORAT MARKAZI</strong>
          </span>
        </a>
        <SiteNav
          active={active}
          isMenuOpen={isMenuOpen}
          isCollapsed={isCollapsed}
          hideServices={hideServices}
          isGroupHighlighted={isGroupHighlighted}
          onLinkClick={() => setIsMenuOpen(false)}
        >
          {isCollapsed && actionButtons}
        </SiteNav>
        <div className="header-actions">
          <button
            className="icon-btn"
            id="themeBtn"
            type="button"
            title="Tema"
            aria-label="Tema"
            onClick={toggleTheme}
            dangerouslySetInnerHTML={trustedHtml(theme === "dark" ? ICON_SUN : ICON_MOON)}
          />
          <button className="lang-btn" id="langBtn" type="button" title="Til" onClick={cycleLang}>
            {lang.toUpperCase()}
          </button>
          {!isCollapsed && actionButtons}
        </div>
        <button className="burger" id="burger" aria-label="Menyu" onClick={() => setIsMenuOpen(open => !open)}>
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
