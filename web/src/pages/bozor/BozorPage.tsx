import { useState } from "react";
import { T_BOZOR } from "@legacy/markets-i18n.js";
import { useI18n } from "../../shell/i18n";
import {
  formatNumber,
  formatPercent,
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
import { CatalogPanel } from "./CatalogPanel";
import { IntelPanel } from "./IntelPanel";
import { RfqPanel } from "./RfqPanel";
import { SellerPanel } from "./SellerPanel";
import type { Product, RfqPrefill } from "./types";

type BozorTab = "catalog" | "rfq" | "seller" | "intel";

function BozorPulse({ t }: { t: Translate }) {
  const { lang } = useI18n();
  const pulse = usePulse();
  const bozor = record(pulse?.bozor);
  /* A figure the server sends as text is shown as it came. */
  const figure = (value: unknown): string =>
    typeof value === "number" ? formatNumber(value, lang, 0) : typeof value === "string" ? value : "";
  const items = pulse
    ? [
        { value: figure(bozor.products), label: t("bz_k_products") },
        { value: figure(bozor.rfqs), label: t("bz_k_rfqs") },
        { value: figure(bozor.deals), label: t("bz_fn_deal") },
        { value: formatPercent(bozor.matchRate, lang), label: t("bz_k_match") },
      ]
    : [];
  return <PulseStats id="bzPulse" items={items} />;
}

export function BozorPage() {
  const t = useMarketText(T_BOZOR);
  const tabs = useTabs<BozorTab>("catalog");
  const [prefill, setPrefill] = useState<RfqPrefill | null>(null);

  const requestQuote = (product: Product): void => {
    setPrefill({
      title: product.title,
      category: product.category,
      unit: product.unit,
      channel: product.channels[0] ?? "b2b",
      certificates: product.certificates.join(", "),
    });
    tabs.open("rfq");
  };

  return (
    <PublicPage
      active="bozor.html"
      action={{ href: "index.html", labelKey: "d_home" }}
      footer={<SiteFooter hasRegisterLink />}
    >
      <main>
        <MarketHero
          index="01"
          eyebrow={t("bz_eyebrow")}
          headingHtml={t("bz_h1")}
          lead={t("bz_lead")}
          cta={{ href: "#bzTabs", label: t("bz_cta") }}
        >
          <BozorPulse t={t} />
        </MarketHero>
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <MarketTabs
              id="bzTabs"
              active={tabs.active}
              onChange={tabs.open}
              tabs={[
                { value: "catalog", label: t("bz_tab_catalog") },
                { value: "rfq", label: t("bz_tab_rfq") },
                { value: "seller", label: t("bz_tab_seller") },
                { value: "intel", label: t("bz_tab_intel") },
              ]}
            />
            <TabPanel name="catalog" tabs={tabs}>
              <CatalogPanel t={t} onRequestQuote={requestQuote} />
            </TabPanel>
            <TabPanel name="rfq" tabs={tabs}>
              <RfqPanel t={t} prefill={prefill} />
            </TabPanel>
            <TabPanel name="seller" tabs={tabs}>
              <SellerPanel t={t} />
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
