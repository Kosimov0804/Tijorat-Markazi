/*
 * XARIDOR: the B2B buyer cabinet (port of xaridor.js).
 *
 * The one cabinet that belongs to the side doing the buying: the catalogue,
 * price requests and their offers, orders, message threads, the profile and
 * the rights panel. B2B is pinned server side and simply stated in the topbar.
 */
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useI18n } from "../../shell/i18n";
import { LegalPanel } from "../../shell/legal/LegalPanel";
import { clearCabinetSession, readCabinetSession } from "../../shell/cabinet";
import type { CabinetCredentials } from "../../shell/cabinet";
import { formatNumber, useMarketText } from "../../shell/market";
import type { Translate } from "../../shell/market";
import { goTo } from "../../shell/navigate";
import { PageBackground } from "../../shell/PageBackground";
import { resolveLogin } from "../../shell/resolveLogin";
import { BuyerShell } from "./BuyerShell";
import type { BuyerNavItem } from "./BuyerShell";
import { CatalogView } from "./CatalogView";
import { LoginCard } from "./LoginCard";
import { OrdersView } from "./OrdersView";
import { ProfileView } from "./ProfileView";
import { RfqView } from "./RfqView";
import { ThreadsView } from "./ThreadsView";
import { loadHome, OWN_PAGE, SESSION_KEY, XARIDOR_TEXT } from "./types";
import type { BuyerView, Cabinet, Home } from "./types";

const NAV: readonly { view: BuyerView; icon: string }[] = [
  { view: "catalog", icon: "🔎" },
  { view: "rfq", icon: "📩" },
  { view: "orders", icon: "📦" },
  { view: "threads", icon: "💬" },
  { view: "profile", icon: "🏢" },
  /* Rights under articles 21-22 of ZRU-547, where the account already is. */
  { view: "legal", icon: "⚙️" },
];
/* The order the sections sit in the page, which is not the menu's. */
const SECTIONS: readonly BuyerView[] = ["catalog", "rfq", "orders", "threads", "legal", "profile"];

/** Counts that answer "is there anything waiting for me here". */
function waitingCount(view: BuyerView, home: Home): number {
  if (view === "rfq") return home.rfqs.filter(rfq => rfq.quoteCount > 0).length;
  if (view === "orders") return home.deals.filter(deal => deal.stage !== "closed").length;
  if (view === "threads") return home.inquiries.filter(thread => thread.status === "answered").length;
  return 0;
}

type Session = { credentials: CabinetCredentials; home: Home };
type CabinetViewProps = {
  session: Session;
  t: Translate;
  onHome: (update: (home: Home) => Home) => void;
  onLogout: () => void;
};

function signOutHome(): void {
  clearCabinetSession(SESSION_KEY);
  goTo("index.html");
}

function CabinetView({ session, t, onHome, onLogout }: CabinetViewProps) {
  const { lang } = useI18n();
  const [view, setView] = useState<BuyerView>("catalog");
  const { credentials, home } = session;

  const refresh = useCallback(async (): Promise<void> => {
    const fresh = await loadHome(credentials);
    if (fresh) onHome(() => fresh);
  }, [credentials, onHome]);
  const cabinet: Cabinet = { credentials, home, refresh };

  const nav: BuyerNavItem<BuyerView>[] = NAV.map(item => {
    const waiting = waitingCount(item.view, home);
    return {
      value: item.view,
      label: t(`xr_v_${item.view}`),
      icon: <span aria-hidden="true">{item.icon}</span>,
      badge: waiting ? formatNumber(waiting, lang, 0) : undefined,
    };
  });
  const content: Record<Exclude<BuyerView, "catalog">, () => ReactNode> = {
    rfq: () => <RfqView cabinet={cabinet} t={t} onDealOpened={() => setView("orders")} />,
    orders: () => <OrdersView cabinet={cabinet} t={t} />,
    threads: () => <ThreadsView cabinet={cabinet} t={t} />,
    profile: () => (
      <ProfileView
        cabinet={cabinet}
        t={t}
        onBuyer={buyer => onHome(current => ({ ...current, buyer }))}
        onSaved={saved => onHome(current => ({ ...current, saved }))}
      />
    ),
    legal: () => (
      <LegalPanel credentials={() => credentials} panelClass="panel co-panel" showCorrection onWithdrawn={signOutHome} />
    ),
  };

  return (
    <BuyerShell
      id="xrShell"
      ids={{ nav: "xrNav", brandSub: "xrBrandSub", title: "xrViewTitle", logout: "xrLogout" }}
      brandSub={home.buyer.name || t("xr_brand")}
      nav={nav}
      active={view}
      onSelect={setView}
      title={t(`xr_v_${view}`)}
      backLabel={t("xr_back_site")}
      logoutLabel={t("xr_logout")}
      onLogout={onLogout}
      topbar={
        <span className="mk-badge" id="xrChannel" style={{ marginLeft: "auto" }} title={t("xr_b2b_note")}>
          {home.channel.toUpperCase()}
        </span>
      }
    >
      {SECTIONS.map(name => (
        <section className={name === view ? "admin-view active" : "admin-view"} id={`view-${name}`} key={name}>
          {name === "catalog" ? (
            <CatalogView cabinet={cabinet} t={t} onSaved={saved => onHome(current => ({ ...current, saved }))} />
          ) : (
            name === view && content[name]()
          )}
        </section>
      ))}
    </BuyerShell>
  );
}

export function XaridorPage() {
  const t = useMarketText(XARIDOR_TEXT);
  const [session, setSession] = useState<Session | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  /** Opens the cabinet for the stored session; false sends the buyer back to the form. */
  const start = useCallback(async (): Promise<boolean> => {
    const credentials = readCabinetSession(SESSION_KEY);
    const home = credentials ? await loadHome(credentials) : null;
    if (!credentials || !home) {
      /* A stale session key survives a server restart; it should send the buyer
         back to the form, not into an empty cabinet. */
      clearCabinetSession(SESSION_KEY);
      setErrorKey("xr_e_load");
      return false;
    }
    setSession({ credentials, home });
    return true;
  }, []);

  useEffect(() => {
    if (readCabinetSession(SESSION_KEY)) void start();
  }, [start]);

  const handleSignIn = async (login: string, password: string): Promise<boolean> => {
    setErrorKey(null);
    /* The shared resolver knows every tier. Someone who types a company or
       admin login here is sent to THEIR cabinet rather than refused. */
    const target = await resolveLogin(login, password);
    if (target === OWN_PAGE) return start();
    if (target) {
      goTo(target);
      return true;
    }
    setErrorKey("xr_login_err");
    return false;
  };

  const handleHome = useCallback((update: (home: Home) => Home): void => {
    setSession(current => (current ? { ...current, home: update(current.home) } : current));
  }, []);

  return (
    <>
      <PageBackground />
      {session ? (
        <CabinetView session={session} t={t} onHome={handleHome} onLogout={signOutHome} />
      ) : (
        <LoginCard t={t} errorKey={errorKey} onSubmit={handleSignIn} />
      )}
    </>
  );
}
