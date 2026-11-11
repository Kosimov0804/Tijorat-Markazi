import { useI18n } from "../../shell/i18n";
import {
  amount,
  Empty,
  formatNumber,
  formatPercent,
  Funnel,
  Kpi,
  listOf,
  Loading,
  marketJson,
  parseRank,
  Ranks,
  record,
  text,
  useKitText,
  useLoad,
} from "../../shell/market";
import type { Json, RankRow, Translate } from "../../shell/market";
import { INTEL_NOTE } from "./intelNote";

function parseSupplyGap(value: unknown, format: (value: unknown, digits: number) => string): RankRow {
  const row = record(value);
  return {
    label: text(row.label),
    value: amount(row.ratio),
    display: `${format(row.demand, 1)}↔${format(row.supply, 0)}`,
  };
}

function Headline({ headline, t }: { headline: Json; t: Translate }) {
  const { lang } = useI18n();
  const verified = text(headline.verifiedSellers);
  const firstQuote = record(headline.timeToFirstQuoteHours);
  return (
    <div className="mk-kpis" style={{ marginBottom: "var(--mk-gap)" }}>
      <Kpi value={formatNumber(headline.liveProducts, lang, 0)} label={t("bz_k_products")} isHero />
      <Kpi
        value={formatNumber(headline.sellers, lang, 0)}
        label={t("bz_k_sellers")}
        note={amount(verified) ? `${verified} ${t("bz_verified")}` : ""}
      />
      <Kpi value={formatNumber(headline.rfqs, lang, 0)} label={t("bz_k_rfqs")} />
      <Kpi value={formatNumber(headline.quotes, lang, 0)} label={t("bz_k_quotes")} />
      <Kpi value={formatPercent(headline.matchRate, lang)} label={t("bz_k_match")} />
      <Kpi
        value={
          headline.timeToFirstQuoteHours
            ? `${formatNumber(firstQuote.median, lang, 0)} ${t("bz_hours")}`
            : "—"
        }
        label={t("bz_k_ttfq")}
      />
    </div>
  );
}

function Board({ intel, t }: { intel: Json; t: Translate }) {
  const { lang } = useI18n();
  const funnel = record(intel.funnel);
  const headline = record(intel.headline);
  const format = (value: unknown, digits: number): string => formatNumber(value, lang, digits);
  const channels = listOf(intel.channels, value => ({
    label: text(record(value).id).toUpperCase(),
    value: amount(record(value).products),
  }));
  return (
    <div className="mk-bento">
      <div className="mk-box w8 is-lead">
        <h3>{t("bz_funnel")}</h3>
        <Funnel
          steps={[
            { n: funnel.search, label: t("bz_fn_search") },
            { n: funnel.rfq, label: "RFQ" },
            { n: funnel.quote, label: t("bz_fn_quote") },
            { n: funnel.deal, label: t("bz_fn_deal") },
            { n: funnel.won, label: t("bz_fn_won") },
          ]}
        />
        <p className="mk-note">
          {t("bz_trade_value")}: <b>{formatNumber(headline.tradeValue, lang, 0)}</b>
        </p>
      </div>
      <div className="mk-box w4">
        <h3>{t("bz_channels")}</h3>
        <Ranks rows={channels} limit={3} />
      </div>
      <div className="mk-box w6">
        <h3>{t("bz_supply_gap")}</h3>
        <Ranks rows={listOf(intel.supplyGaps, value => parseSupplyGap(value, format))} digits={1} isGap />
        <p className="mk-note">{t("bz_gap_note")}</p>
      </div>
      <div className="mk-box w6">
        <h3>{t("bz_top_search")}</h3>
        <Ranks rows={listOf(intel.topSearches, parseRank)} />
      </div>
      <div className="mk-box w4">
        <h3>{t("bz_top_cat")}</h3>
        <Ranks rows={listOf(intel.topCategories, parseRank)} limit={7} />
      </div>
      <div className="mk-box w4">
        <h3>{t("bz_regions")}</h3>
        <Ranks rows={listOf(intel.regions, parseRank)} limit={7} />
      </div>
      <div className="mk-box w4">
        <h3>{t("bz_export_markets")}</h3>
        <Ranks rows={listOf(intel.exportMarkets, parseRank)} limit={7} />
      </div>
    </div>
  );
}

/* Figures computed from real search, RFQ, quote and deal events. */
export function IntelPanel({ t }: { t: Translate }) {
  const kit = useKitText();
  const intel = useLoad("intel", () => marketJson("/api/bozor/intel"));
  return (
    <>
      <p className="mk-sub">{INTEL_NOTE}</p>
      <div id="bzIntel">
        {(intel.isLoading || !intel.data) && <Loading />}
        {!intel.isLoading && intel.data?.error !== undefined && <Empty>{kit("mk_nodata")}</Empty>}
        {!intel.isLoading && intel.data && intel.data.error === undefined && (
          <>
            <Headline headline={record(intel.data.headline)} t={t} />
            <Board intel={intel.data} t={t} />
          </>
        )}
      </div>
    </>
  );
}
