import { useEffect } from "react";
import { T_BIZID } from "@legacy/markets-i18n.js";
import { useI18n } from "../../shell/i18n";
import { queryString, useMarketText } from "../../shell/market/mk";
import type { Translate } from "../../shell/market/mk";
import { PublicPage } from "../../shell/PublicPage";
import { SiteFooter } from "../../shell/SiteFooter";
import { useApiJson } from "../../shell/useApiJson";
import { BusinessCard } from "./BusinessCard";
import type { Card } from "./BusinessCard";
import { BusinessLookup } from "./BusinessLookup";

function CardView({ id, t }: { id: string; t: Translate }) {
  const { lang } = useI18n();
  const state = useApiJson<Card>(`/api/business-id?${queryString({ id })}`);
  const card = state.status === "ready" && state.data.ok ? state.data : null;
  const title = card ? `${card.i18n?.[lang] || card.name} — Business ID` : "";

  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  if (state.status === "loading") return <p className="mk-loading">{t("mk_loading", "Yuklanmoqda…")}</p>;
  if (card) return <BusinessCard card={card} t={t} />;
  return (
    <>
      <div className="bid-lead">
        <h1>{t("bid_title")}</h1>
      </div>
      <p className="mk-empty">{t("bid_notfound")}</p>
      <p className="bid-actions">
        <a className="btn btn-ghost" href="biznes-id.html">
          {t("bid_lookup")}
        </a>
      </p>
    </>
  );
}

export function BiznesIdPage() {
  const t = useMarketText(T_BIZID);
  /* ?id= shows the card itself; no id shows the lookup and directory. */
  const id = new URLSearchParams(window.location.search).get("id") ?? "";
  return (
    <PublicPage
      active="biznes-id.html"
      isGroupHighlighted={false}
      action={{ href: "index.html", labelKey: "d_home" }}
      footer={
        <>
          <footer className="site-footer">
            <div className="container footer-inner">
              <div className="footer-brand">
                <strong>TIJORAT MARKAZI</strong>
              </div>
            </div>
          </footer>
          <SiteFooter />
        </>
      }
    >
      <main className="section">
        <div className="container">
          <div id="bidRoot">{id ? <CardView id={id} t={t} /> : <BusinessLookup t={t} />}</div>
        </div>
      </main>
    </PublicPage>
  );
}
