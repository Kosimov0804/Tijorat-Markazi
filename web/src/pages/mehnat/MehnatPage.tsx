import { T_MEHNAT } from "@legacy/markets-i18n.js";
import { useI18n } from "../../shell/i18n";
import {
  formatNumber,
  MarketHero,
  MarketTabs,
  PulseStats,
  record,
  TabPanel,
  useMarketText,
  usePulse,
  useTabs,
} from "../../shell/market";
import type { Translate } from "../../shell/market";
import { PublicPage } from "../../shell/PublicPage";
import { SiteFooter } from "../../shell/SiteFooter";
import { CandidatePanel } from "./CandidatePanel";
import { EmployerPanel } from "./EmployerPanel";
import { IntelPanel } from "./IntelPanel";
import { JobsPanel } from "./JobsPanel";
import { TalentPanel } from "./TalentPanel";

type MehnatTab = "jobs" | "talent" | "me" | "employer" | "intel";

function MehnatPulse({ t }: { t: Translate }) {
  const { lang } = useI18n();
  const pulse = usePulse();
  const mehnat = record(pulse?.mehnat);
  const items = pulse
    ? [
        { value: formatNumber(mehnat.vacancies, lang, 0), label: t("hc_k_vacancies") },
        { value: formatNumber(mehnat.candidates, lang, 0), label: t("hc_k_active") },
        { value: formatNumber(mehnat.applications, lang, 0), label: t("hc_k_apps") },
        { value: formatNumber(mehnat.hires, lang, 0), label: t("hc_fn_hired") },
      ]
    : [];
  return <PulseStats id="hcPulse" items={items} />;
}

export function MehnatPage() {
  const t = useMarketText(T_MEHNAT);
  const tabs = useTabs<MehnatTab>("jobs");
  return (
    <PublicPage
      active="mehnat.html"
      action={{ href: "index.html", labelKey: "d_home" }}
      footer={<SiteFooter hasRegisterLink />}
    >
      <main>
        <MarketHero
          index="03"
          eyebrow={t("hc_eyebrow")}
          headingHtml={t("hc_h1")}
          lead={t("hc_lead")}
          cta={{ href: "#hcTabs", label: t("hc_cta") }}
        >
          <MehnatPulse t={t} />
        </MarketHero>
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <MarketTabs
              id="hcTabs"
              active={tabs.active}
              onChange={tabs.open}
              tabs={[
                { value: "jobs", label: t("hc_tab_jobs") },
                { value: "talent", label: t("hc_tab_talent") },
                { value: "me", label: t("hc_tab_me") },
                { value: "employer", label: t("hc_tab_employer") },
                { value: "intel", label: t("hc_tab_intel") },
              ]}
            />
            <TabPanel name="jobs" tabs={tabs}>
              <JobsPanel t={t} />
            </TabPanel>
            <TabPanel name="talent" tabs={tabs}>
              <TalentPanel t={t} />
            </TabPanel>
            <TabPanel name="me" tabs={tabs}>
              <CandidatePanel t={t} />
            </TabPanel>
            <TabPanel name="employer" tabs={tabs}>
              <EmployerPanel t={t} />
            </TabPanel>
            <TabPanel name="intel" tabs={tabs}>
              <IntelPanel t={t} />
            </TabPanel>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}
