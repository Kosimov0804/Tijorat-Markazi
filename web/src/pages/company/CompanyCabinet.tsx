import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BizIdPanel, CabinetShell, clearCabinetSession } from "../../shell/cabinet";
import type { CabinetCredentials, CabinetNavItem } from "../../shell/cabinet";
import { useI18n } from "../../shell/i18n";
import { LegalPanel } from "../../shell/legal/LegalPanel";
import { goTo } from "../../shell/navigate";
import { BizDataView } from "./BizDataView";
import { DashboardView } from "./DashboardView";
import { GovView } from "./GovView";
import { fetchInquiries, InquiriesView } from "./InquiriesView";
import { MeetingBanner } from "./MeetingBanner";
import { MeetingView } from "./MeetingView";
import { ModuleView } from "./ModuleView";
import { NewsView } from "./NewsView";
import { ShowroomView } from "./ShowroomView";
import { NAV_ICONS } from "./text";
import type { CompanyTextKey } from "./text";
import { SESSION_KEY, useCompanyText } from "./types";
import type { Company } from "./types";

type ViewId = Exclude<keyof typeof NAV_ICONS, "chats">;

/* Sidebar order, as the panel has always had it. One Chats entry, like the
   association cabinet: a full-screen page whose room list holds both the
   association group and the admin conversation. */
const NAV: readonly { id: keyof typeof NAV_ICONS; label: CompanyTextKey; href?: string }[] = [
  { id: "dashboard", label: "nav_dash" },
  { id: "showroom", label: "nav_show" },
  { id: "invest", label: "nav_invest" },
  { id: "bizdata", label: "nav_data" },
  { id: "news", label: "nav_news" },
  { id: "inquiries", label: "nav_inquiries" },
  { id: "bizid", label: "nav_bizid" },
  { id: "chats", label: "nav_chats", href: "chat.html" },
  { id: "meeting", label: "nav_meeting" },
  { id: "service", label: "nav_service" },
  { id: "rnd", label: "nav_rnd" },
  { id: "gov", label: "nav_gov" },
  { id: "legal", label: "nav_legal" },
];

const isViewId = (id: string): id is ViewId => id in NAV_ICONS && id !== "chats";

type CabinetProps = { company: Company; credentials: CabinetCredentials; onLogout: () => void };

export function CompanyCabinet({ company, credentials, onLogout }: CabinetProps) {
  const { lang } = useI18n();
  const ot = useCompanyText();
  const [view, setView] = useState<ViewId>("dashboard");
  const [showroom, setShowroom] = useState(company.showroom);
  const [bizrows, setBizrows] = useState(company.bizrows);
  const [unread, setUnread] = useState(0);

  /* The sidebar badge should be right the moment the cabinet opens. An error
     leaves the last known count standing. */
  useEffect(() => {
    let isCurrent = true;
    void fetchInquiries(credentials).then(result => {
      if (isCurrent && result) setUnread(result.unread);
    });
    return () => {
      isCurrent = false;
    };
  }, [credentials]);

  const handleWithdrawn = useCallback(() => {
    clearCabinetSession(SESSION_KEY);
    goTo("index.html");
  }, []);

  const nav: CabinetNavItem[] = NAV.map(item => ({
    id: item.id,
    label: ot(item.label),
    icon: NAV_ICONS[item.id],
    href: item.href,
    badge: item.id === "inquiries" ? unread : undefined,
  }));
  const shared = { credentials, ot };

  const views: Record<ViewId, () => ReactNode> = {
    dashboard: () => <DashboardView showroom={showroom} bizrows={bizrows} ot={ot} />,
    showroom: () => <ShowroomView {...shared} items={showroom} onItems={setShowroom} />,
    invest: () => <ModuleView {...shared} module="invest" companyId={company.id} />,
    bizdata: () => <BizDataView {...shared} saved={bizrows} onSaved={setBizrows} />,
    news: () => <NewsView {...shared} />,
    inquiries: () => <InquiriesView {...shared} onUnread={setUnread} />,
    bizid: () => (
      <div id="bizidHost">
        <BizIdPanel credentials={credentials} />
      </div>
    ),
    meeting: () => <MeetingView assocId={company.assocId} ot={ot} />,
    service: () => <ModuleView {...shared} module="service" companyId={company.id} />,
    rnd: () => <ModuleView {...shared} module="rnd" companyId={company.id} />,
    gov: () => <GovView {...shared} />,
    legal: () => (
      <div id="legalHost">
        <LegalPanel credentials={() => credentials} panelClass="panel co-panel" showCorrection onWithdrawn={handleWithdrawn} />
      </div>
    ),
  };

  return (
    <CabinetShell
      id="coApp"
      navId="coNav"
      brandSub="Company"
      nav={nav}
      activeId={view}
      onSelect={id => isViewId(id) && setView(id)}
      title={ot(NAV.find(item => item.id === view)?.label ?? "nav_dash")}
      backLabel={ot("back_site")}
      logoutLabel={ot("logout")}
      onLogout={onLogout}
      actions={
        <a
          className="btn btn-primary"
          id="aiNav"
          href={`assistant.html?panel=company&co=${encodeURIComponent(company.name)}`}
          style={{ marginLeft: "auto" }}
        >
          🤖 {ot("nav_ai")}
        </a>
      }
    >
      <div style={{ padding: "20px 26px 0" }}>
        <MeetingBanner assocId={company.assocId} ot={ot} />
        <div className="co-head">
          <div>
            <span className="co-eyebrow" id="coAssoc">
              {company.assocI18n[lang] || company.assocName}
            </span>
            <h2 className="co-name" id="coName" style={{ fontSize: 24 }}>
              {company.name || "—"}
            </h2>
            <span className="co-sector" id="coSector">
              {company.sector}
            </span>
          </div>
        </div>
      </div>
      <div className="admin-view active" id={`view-${view}`} key={view}>
        {views[view]()}
      </div>
    </CabinetShell>
  );
}
