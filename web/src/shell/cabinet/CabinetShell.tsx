/**
 * CABINET SHELL — the .admin-shell frame all cabinets share: sidebar with the
 * navigation, topbar with the view title, theme, language and sign-out, and
 * the small-screen drawer from cabinet-nav.js.
 *
 *   <CabinetShell
 *     id="asShell" navId="asNav"            // legacy ids, optional
 *     brandSub="Uyuşma"                     // the line under TIJORAT MARKAZI
 *     nav={[{ id: "dashboard", label, icon: NAV_ICONS.dashboard, badge: 3 },
 *           { id: "chats", label, icon, href: "chat.html" }]}
 *     activeId={view} onSelect={setView}    // an item with href navigates instead
 *     title="Dashboard"
 *     backLabel="← Back to site"            // links to index.html (backHref)
 *     actions={<a className="btn btn-primary" …/>}   // sits between title and theme
 *     logoutLabel="Logout" onLogout={…}
 *   >
 *     <section className="admin-view active">…</section>
 *   </CabinetShell>
 *
 * `icon` is bundled inner svg markup (see CabinetIcon). A badge of 0 is hidden.
 * Theme and language are handled here. Needs the I18nProvider and styles.css.
 */
import type { ReactNode } from "react";
import { ICON_MOON, ICON_SUN } from "@legacy/data.js";
import { useI18n } from "../i18n";
import { goTo } from "../navigate";
import { trustedHtml } from "../trustedHtml";
import { useTheme } from "../useTheme";
import { CabinetIcon } from "./CabinetIcon";
import { useCabinetDrawer } from "./useCabinetDrawer";

export type CabinetNavItem = {
  id: string;
  label: string;
  /** Bundled inner svg markup; never API data. */
  icon: string;
  badge?: number;
  /** A full page of its own (the chat), opened instead of a view. */
  href?: string;
};

type CabinetShellProps = {
  id?: string;
  navId?: string;
  brandSub: string;
  brandSubId?: string;
  nav: readonly CabinetNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  title: string;
  backLabel: string;
  backHref?: string;
  actions?: ReactNode;
  logoutLabel: string;
  onLogout: () => void;
  children: ReactNode;
};

const SIDE_ID = "cabSide";

export function CabinetShell(props: CabinetShellProps) {
  const { nav, activeId, onSelect, backHref = "index.html" } = props;
  const { lang, cycleLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const drawer = useCabinetDrawer();

  return (
    <div className={drawer.isOpen ? "admin-shell side-open" : "admin-shell"} id={props.id}>
      <aside
        className="admin-side"
        id={SIDE_ID}
        ref={drawer.sideRef}
        onClick={drawer.handleSideClick}
        onKeyDown={drawer.handleSideKeyDown}
      >
        <div className="admin-brand">
          <div>
            <b>TIJORAT MARKAZI</b>
            <span id={props.brandSubId} title={props.brandSub}>
              {props.brandSub}
            </span>
          </div>
        </div>
        <nav className="admin-nav" id={props.navId}>
          {nav.map(item => (
            <button
              key={item.id}
              type="button"
              className={item.id === activeId ? "active" : ""}
              aria-current={item.id === activeId ? "page" : undefined}
              onClick={() => (item.href ? goTo(item.href) : onSelect(item.id))}
            >
              <CabinetIcon markup={item.icon} />
              <span>{item.label}</span>
              {item.badge ? <em className="co-badge">{item.badge}</em> : null}
            </button>
          ))}
        </nav>
        <a className="admin-back" href={backHref} id="backSite">
          {props.backLabel}
        </a>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <button
            type="button"
            className="cab-burger"
            aria-label="Menyu"
            aria-expanded={drawer.isOpen}
            aria-controls={SIDE_ID}
            ref={drawer.burgerRef}
            onClick={drawer.toggle}
          >
            <span />
            <span />
            <span />
          </button>
          <h1 id="viewTitle">{props.title}</h1>
          {props.actions}
          <button
            className="icon-btn"
            id="themeBtn"
            type="button"
            title="Tema"
            onClick={toggleTheme}
            dangerouslySetInnerHTML={trustedHtml(theme === "dark" ? ICON_SUN : ICON_MOON)}
          />
          <button className="lang-btn" id="langBtn" type="button" onClick={cycleLang}>
            {lang.toUpperCase()}
          </button>
          <button className="btn btn-ghost" id="logoutBtn" type="button" onClick={props.onLogout}>
            {props.logoutLabel}
          </button>
        </div>
        {props.children}
      </main>
      <div className="cab-scrim" hidden={!drawer.isOpen} onClick={() => drawer.close(true)} />
    </div>
  );
}
