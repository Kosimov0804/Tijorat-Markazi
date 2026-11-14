/*
 * TAHLIL PANELI: the data analyst's cabinet (port of tahlil.js).
 *
 * Read-only by construction: every endpoint it calls returns aggregates.
 * Four views, each answering a different question:
 *
 *   Umumiy       what the whole platform looks like right now
 *   Segmentlar   which slice of it is moving
 *   Dinamika     how that slice has moved over time
 *   Hisobotlar   give me that as a file
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { T_ANALYST } from "@legacy/markets-i18n.js";
import { CabinetShell, clearCabinetSession, readCabinetSession, writeCabinetSession } from "../../shell/cabinet";
import type { CabinetNavItem } from "../../shell/cabinet";
import { useMarketText } from "../../shell/market";
import type { Translate } from "../../shell/market";
import { PageBackground } from "../../shell/PageBackground";
import { analystLogin, DEFAULT_DAYS, PERIODS, SESSION_KEY } from "./data";
import type { AnalystSession, AnalystView, Query } from "./data";
import { LoginCard } from "./LoginCard";
import { NAV_ICONS } from "./navIcons";
import { OverviewView } from "./OverviewView";
import { ReportsView } from "./ReportsView";
import { SegmentsView } from "./SegmentsView";
import type { SegmentChoice } from "./SegmentsView";
import { TrendsView } from "./TrendsView";
import type { TrendChoice } from "./TrendsView";

const VIEWS: readonly AnalystView[] = ["overview", "segments", "trends", "reports"];
const SITE = "TIJORAT MARKAZI";
/* The title the page ships with, shown until someone signs in. */
const SIGNED_OUT_TITLE = "Tahlil paneli";
const FALLBACK_MODULE = "bozor";

function PeriodBar({ days, onPick, t }: { days: number; onPick: (days: number) => void; t: Translate }) {
  return (
    <div className="an-period" id="anPeriod" style={{ marginLeft: "auto" }}>
      {PERIODS.map(period => (
        <button
          type="button"
          key={period}
          className={period === days ? "an-per is-on" : "an-per"}
          aria-pressed={period === days}
          onClick={() => onPick(period)}
        >
          {period}
          {t("an_days")}
        </button>
      ))}
    </div>
  );
}

type CabinetProps = { session: AnalystSession; t: Translate; onLogout: () => void };

function Cabinet({ session, t, onLogout }: CabinetProps) {
  const { analyst, modules } = session;
  const firstModule = analyst.scopes[0] ?? FALLBACK_MODULE;
  const [view, setView] = useState<AnalystView>("overview");
  const [days, setDays] = useState<number>(DEFAULT_DAYS);
  const [segment, setSegment] = useState<SegmentChoice>({ module: firstModule, dimension: "" });
  const [trend, setTrend] = useState<TrendChoice>({ module: firstModule, metric: "", bucket: "week" });
  const query: Query = { credentials: session.credentials, days };

  const nav: CabinetNavItem[] = VIEWS.map(id => ({ id, label: t(`an_nav_${id}`), icon: NAV_ICONS[id] }));
  const handleSelect = (id: string): void => {
    const next = VIEWS.find(name => name === id);
    if (next) setView(next);
  };
  const content: Record<AnalystView, () => ReactNode> = {
    overview: () => <OverviewView query={query} t={t} />,
    segments: () => <SegmentsView query={query} modules={modules} choice={segment} onChoose={setSegment} t={t} />,
    trends: () => <TrendsView query={query} modules={modules} choice={trend} onChoose={setTrend} t={t} />,
    reports: () => <ReportsView query={query} t={t} />,
  };

  return (
    <CabinetShell
      id="anShell"
      navId="anNav"
      brandSubId="anBrandSub"
      brandSub={analyst.org || analyst.name || t("an_brand")}
      nav={nav}
      activeId={view}
      onSelect={handleSelect}
      title={t(`an_nav_${view}`)}
      backLabel={t("an_back")}
      logoutLabel={t("an_logout")}
      onLogout={onLogout}
      actions={<PeriodBar days={days} onPick={setDays} t={t} />}
    >
      {VIEWS.map(name => (
        <section className={name === view ? "admin-view active" : "admin-view"} id={`view-${name}`} key={name}>
          {name === view && content[name]()}
        </section>
      ))}
    </CabinetShell>
  );
}

export function TahlilPage() {
  const t = useMarketText(T_ANALYST);
  const [session, setSession] = useState<AnalystSession | null>(null);
  const title = session ? session.analyst.name || t("an_title") : SIGNED_OUT_TITLE;

  useEffect(() => {
    /* A session kept from earlier in this browser tab signs straight back in. */
    const stored = readCabinetSession(SESSION_KEY);
    if (!stored) return;
    let isCurrent = true;
    void analystLogin(stored.login, stored.password).then(restored => {
      if (isCurrent && restored) setSession(restored);
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    document.title = `${title} — ${SITE}`;
  }, [title]);

  const handleSignedIn = (next: AnalystSession): void => {
    writeCabinetSession(SESSION_KEY, next.credentials);
    setSession(next);
  };
  const handleLogout = (): void => {
    clearCabinetSession(SESSION_KEY);
    setSession(null);
  };

  return (
    <>
      <PageBackground />
      {session ? (
        <Cabinet session={session} t={t} onLogout={handleLogout} />
      ) : (
        <LoginCard t={t} onSignedIn={handleSignedIn} />
      )}
    </>
  );
}
