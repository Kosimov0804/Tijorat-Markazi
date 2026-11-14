import { useState } from "react";
import type { ReactNode } from "react";
import { ICON_MOON, ICON_SUN } from "@legacy/data.js";
import { CabinetIcon, useCabinetDrawer } from "../../shell/cabinet";
import { useI18n } from "../../shell/i18n";
import { trustedHtml } from "../../shell/trustedHtml";
import { NAV, VIEW_TITLE } from "./navItems";
import type { ViewId } from "./navItems";
import { useOrgsStore } from "./orgs";
import type { OrgsStore } from "./orgs";
import { useText } from "./useText";
import { Analysts } from "./views/Analysts";
import { Appeals } from "./views/Appeals";
import { Associations } from "./views/Associations";
import { Buyers } from "./views/Buyers";
import { Companies } from "./views/Companies";
import { Conference } from "./views/Conference";
import { Dashboard } from "./views/Dashboard";
import { Dsr } from "./views/Dsr";
import { Leads } from "./views/Leads";
import { Members } from "./views/Members";
import { ProjectChat } from "./views/ProjectChat";
import { Projects } from "./views/Projects";
import { Questions } from "./views/Questions";
import { Report } from "./views/Report";
import { Settings } from "./views/Settings";

export type Theme = "light" | "dark";

type AdminShellProps = {
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
  /** The view to open on; the dashboard, as in the old panel. */
  initialView?: ViewId;
};

const SIDE_ID = "cabSide";

type ViewProps = { view: ViewId; store: OrgsStore; theme: Theme; onToggleTheme: () => void };

function renderView({ view, store, theme, onToggleTheme }: ViewProps): ReactNode {
  switch (view) {
    case "dashboard":
      return <Dashboard store={store} />;
    case "associations":
      return <Associations store={store} />;
    case "members":
      return <Members store={store} />;
    case "companies":
      return <Companies />;
    case "leads":
      return <Leads />;
    case "questions":
      return <Questions />;
    case "projects":
      return <Projects />;
    case "chat":
      return <ProjectChat />;
    case "report":
      return <Report />;
    case "conference":
      return <Conference store={store} />;
    case "appeals":
      return <Appeals />;
    case "dsr":
      return <Dsr />;
    case "analysts":
      return <Analysts />;
    case "buyers":
      return <Buyers />;
    case "settings":
      return <Settings theme={theme} onToggleTheme={onToggleTheme} />;
  }
}

/* The .admin-shell frame. The shared CabinetShell keeps its own theme state,
   and here the settings view has theme buttons of its own, so the frame is
   built from the shared drawer and icon with the theme owned by the page. */
export function AdminShell({ theme, onToggleTheme, onLogout, initialView = "dashboard" }: AdminShellProps) {
  const { tx } = useText();
  const { lang, cycleLang } = useI18n();
  const drawer = useCabinetDrawer();
  const store = useOrgsStore();
  const [view, setView] = useState<ViewId>(initialView);
  /* Pressing a sidebar entry again reopened its view from the start. */
  const [visit, setVisit] = useState(0);

  const open = (next: ViewId) => {
    setView(next);
    setVisit(current => current + 1);
  };

  return (
    <div className={drawer.isOpen ? "admin-shell side-open" : "admin-shell"} id="adminShell">
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
            <span>Admin</span>
          </div>
        </div>
        <nav className="admin-nav" id="adminNav">
          {NAV.map(item => (
            <button
              type="button"
              key={item.view}
              className={item.view === view ? "active" : ""}
              aria-current={item.view === view ? "page" : undefined}
              onClick={() => open(item.view)}
            >
              <CabinetIcon markup={item.icon} />
              <span>{tx(item.textKey)}</span>
            </button>
          ))}
        </nav>
        <a className="admin-back" href="index.html" id="backSite">
          {tx("back")}
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
          <h1 id="viewTitle">{tx(VIEW_TITLE[view])}</h1>
          <button
            className="icon-btn"
            id="themeBtn"
            type="button"
            title="Tema"
            onClick={onToggleTheme}
            dangerouslySetInnerHTML={trustedHtml(theme === "dark" ? ICON_SUN : ICON_MOON)}
          />
          <button className="lang-btn" id="langBtn" type="button" onClick={cycleLang}>
            {lang.toUpperCase()}
          </button>
          <button className="btn btn-ghost" id="logoutBtn" type="button" onClick={onLogout}>
            {tx("logout")}
          </button>
        </div>
        <section className="admin-view active" id={`view-${view}`} key={`${view}:${visit}`}>
          {renderView({ view, store, theme, onToggleTheme })}
        </section>
      </main>
      <div className="cab-scrim" hidden={!drawer.isOpen} onClick={() => drawer.close(true)} />
    </div>
  );
}
