/*
 * LOCAL VARIANT of shell/cabinet's CabinetShell, to merge there later. The
 * shared shell takes bundled svg markup for its icons and fixes the topbar
 * ids; the buyer cabinet's menu uses emoji and its own xr* ids, so it keeps
 * this frame. The drawer behaviour is the shared useCabinetDrawer.
 *
 *   <BuyerShell id ids brandSub nav active onSelect title … onLogout>
 *     <section className="admin-view active">…</section>
 *   </BuyerShell>
 */
import type { ReactNode } from "react";
import { ICON_MOON, ICON_SUN } from "@legacy/data.js";
import { useI18n } from "../../shell/i18n";
import { trustedHtml } from "../../shell/trustedHtml";
import { useTheme } from "../../shell/useTheme";
import { useCabinetDrawer } from "../../shell/cabinet";
import type { CabinetDrawer } from "../../shell/cabinet";

export type BuyerNavItem<V extends string> = { value: V; label: string; icon: ReactNode; badge?: string };

type BuyerShellProps<V extends string> = {
  id: string;
  ids: { nav: string; brandSub: string; title: string; logout: string };
  brandSub: string;
  nav: readonly BuyerNavItem<V>[];
  active: V;
  onSelect: (view: V) => void;
  title: string;
  backLabel: string;
  logoutLabel: string;
  onLogout: () => void;
  /** Sits between the title and the theme button. */
  topbar?: ReactNode;
  children: ReactNode;
};

function Burger({ sideId, drawer }: { sideId: string; drawer: CabinetDrawer }) {
  return (
    <button
      type="button"
      className="cab-burger"
      aria-label="Menyu"
      aria-expanded={drawer.isOpen}
      aria-controls={sideId}
      ref={drawer.burgerRef}
      onClick={drawer.toggle}
    >
      <span />
      <span />
      <span />
    </button>
  );
}

export function BuyerShell<V extends string>(props: BuyerShellProps<V>) {
  const { ids, nav, active, onSelect } = props;
  const { lang, cycleLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const drawer = useCabinetDrawer();
  const sideId = `${props.id}Side`;

  return (
    <div className={drawer.isOpen ? "admin-shell side-open" : "admin-shell"} id={props.id}>
      <aside className="admin-side" id={sideId} ref={drawer.sideRef} onClick={drawer.handleSideClick} onKeyDown={drawer.handleSideKeyDown}>
        <div className="admin-brand">
          <div>
            <b>TIJORAT MARKAZI</b>
            <span id={ids.brandSub}>{props.brandSub}</span>
          </div>
        </div>
        <nav className="admin-nav" id={ids.nav}>
          {nav.map(item => (
            <button
              type="button"
              key={item.value}
              className={item.value === active ? "active" : ""}
              onClick={() => onSelect(item.value)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && <em className="co-badge">{item.badge}</em>}
            </button>
          ))}
        </nav>
        <a className="admin-back" href="index.html">
          {props.backLabel}
        </a>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <Burger sideId={sideId} drawer={drawer} />
          <h1 id={ids.title}>{props.title}</h1>
          {props.topbar}
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
          <button className="btn btn-ghost" id={ids.logout} type="button" onClick={props.onLogout}>
            {props.logoutLabel}
          </button>
        </div>
        {props.children}
      </main>
      <div className="cab-scrim" hidden={!drawer.isOpen} onClick={() => drawer.close(true)} />
    </div>
  );
}
