import { useI18n } from "../../shell/i18n";
import {
  Chip,
  Drawer,
  Empty,
  formatDay,
  formatMoney,
  formatNumber,
  KeyValues,
  listOf,
  Loading,
  marketJson,
  marketQuery,
  MatchCard,
  MatchTitle,
  useLoad,
} from "../../shell/market";
import type { Translate } from "../../shell/market";
import { channelLabel } from "./parts";
import { parseProductMatch, parseQuote, parseRfq } from "./types";
import type { ProductMatch, Quote, Rfq } from "./types";

const MAX_MATCHES = 6;

type RfqDetail = { rfq: Rfq; matches: ProductMatch[]; quotes: Quote[] } | null;

async function loadDetail(id: string): Promise<RfqDetail> {
  const [matched, quoted] = await Promise.all([
    marketJson(`/api/bozor/rfq/matches?${marketQuery({ id })}`),
    marketJson(`/api/bozor/quotes?${marketQuery({ rfqId: id })}`),
  ]);
  if (matched.error) return null;
  return {
    rfq: parseRfq(matched.rfq),
    matches: listOf(matched.matches, parseProductMatch),
    quotes: listOf(quoted.quotes, parseQuote),
  };
}

function QuoteTable({ quotes, t }: { quotes: readonly Quote[]; t: Translate }) {
  const { lang } = useI18n();
  return (
    <>
      <h3 className="mk-h">{t("bz_quote_compare")}</h3>
      <div className="mk-tablewrap">
        <table className="mk-table">
          <thead>
            <tr>
              <th>{t("bz_seller")}</th>
              <th className="num">{t("bz_price")}</th>
              <th className="num">{t("bz_lead_label")}</th>
              <th>Incoterm</th>
              <th>{t("bz_validity")}</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote, index) => (
              <tr className={quote.isBestPrice ? "is-best" : ""} key={`${quote.sellerName}|${index}`}>
                <td>{quote.sellerName}</td>
                <td className="num">
                  {formatNumber(quote.price, lang, 2)} {quote.currency}
                  {quote.isBestPrice && " ★"}
                </td>
                <td className="num">{quote.leadTime ? formatNumber(quote.leadTime, lang, 0) : "—"}</td>
                <td>{quote.incoterm || "—"}</td>
                <td>{quote.validity || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RfqBody({ detail, t }: { detail: NonNullable<RfqDetail>; t: Translate }) {
  const { lang } = useI18n();
  const { rfq, matches, quotes } = detail;
  const rows = [
    [t("bz_f_qty"), rfq.qty ? `${formatNumber(rfq.qty, lang, 0)} ${rfq.unit}` : ""],
    [t("bz_f_budget"), rfq.budget ? formatMoney(rfq.budget, rfq.currency, lang) : ""],
    [t("bz_f_maxlead"), rfq.maxLead ? `${formatNumber(rfq.maxLead, lang, 0)} ${t("bz_days")}` : ""],
    [t("bz_f_country"), rfq.country],
    [t("bz_f_certs"), rfq.certificates.join(", ")],
    [t("bz_created"), formatDay(rfq.created, lang)],
  ] as const;
  return (
    <>
      <div className="mk-chips">
        <span className={`mk-chip is-${rfq.channel}`}>{channelLabel(rfq.channel, t)}</span>
        <Chip kind="ghost">{t(`status_${rfq.status}`)}</Chip>
      </div>
      <p className="mk-desc" style={{ WebkitLineClamp: 99 }}>
        {rfq.spec}
      </p>
      <KeyValues rows={rows} />
      <h3 className="mk-h">{t("bz_matched")}</h3>
      <div className="mk-stack">
        {matches.slice(0, MAX_MATCHES).map((match, index) => (
          <MatchCard
            key={index}
            match={match}
            title={<MatchTitle name={match.productTitle} by={match.productCompany} />}
          />
        ))}
        {!matches.length && <Empty>{t("bz_no_match")}</Empty>}
      </div>
      {quotes.length > 0 && <QuoteTable quotes={quotes} t={t} />}
    </>
  );
}

/* RFQ detail: matched suppliers with their reasons, plus the quote comparison. */
export function RfqDrawer({ id, t, onClose }: { id: string; t: Translate; onClose: () => void }) {
  const detail = useLoad(id, () => loadDetail(id));
  return (
    <Drawer title={detail.data?.rfq.title ?? ""} onClose={onClose}>
      {detail.isLoading && <Loading />}
      {!detail.isLoading && !detail.data && <Empty>{t("bz_rfq_empty")}</Empty>}
      {!detail.isLoading && detail.data && <RfqBody detail={detail.data} t={t} />}
    </Drawer>
  );
}
