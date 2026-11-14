import type { ReactNode } from "react";
import { useI18n } from "../../shell/i18n";
import { dialogs } from "../../shell/dialogs";
import { Chip, Drawer, Empty, formatMoney, formatNumber, listOf, Loading, record, text, useLoad } from "../../shell/market";
import type { Translate } from "../../shell/market";
import { buyerPost, parseQuote } from "./types";
import type { Cabinet, Quote } from "./types";

type QuotesDrawerProps = {
  rfqId: string;
  cabinet: Cabinet;
  t: Translate;
  onClose: () => void;
  /** Called once a quote has been accepted and the order exists. */
  onAccepted: () => void;
};

function QuoteCard({ quote, t, onAccept }: { quote: Quote; t: Translate; onAccept: () => void }) {
  const { lang } = useI18n();
  const count = (value: number): string => formatNumber(value, lang, 0);
  return (
    <article className="rq-card is-pending">
      <div className="rq-top">
        <b>{quote.sellerName}</b>
        {quote.isBestPrice && <Chip>{t("xr_q_best_p")}</Chip>}
        {quote.isBestLead && <Chip>{t("xr_q_best_l")}</Chip>}
      </div>
      <dl className="rq-kv">
        <dt>{t("xr_q_price")}</dt>
        <dd>
          {formatMoney(quote.price, quote.currency, lang)}
          {quote.qty > 0 && ` × ${count(quote.qty)}`}
        </dd>
        {quote.leadTime > 0 && (
          <>
            <dt>{t("xr_q_lead")}</dt>
            <dd>
              {count(quote.leadTime)} {t("xr_days")}
            </dd>
          </>
        )}
        {quote.validity && (
          <>
            <dt>{t("xr_q_valid")}</dt>
            <dd>{quote.validity}</dd>
          </>
        )}
        {quote.incoterm && (
          <>
            <dt>Incoterm</dt>
            <dd>{quote.incoterm}</dd>
          </>
        )}
      </dl>
      {quote.terms && <p className="rq-about">{quote.terms}</p>}
      <div className="rq-actions">
        <button className="btn btn-primary" type="button" onClick={onAccept}>
          {t("xr_q_accept")}
        </button>
      </div>
    </article>
  );
}

/** Compares the offers on one request, and turns the chosen one into an order. */
export function QuotesDrawer({ rfqId, cabinet, t, onClose, onAccepted }: QuotesDrawerProps) {
  const { credentials } = cabinet;
  const { data, isLoading } = useLoad(`quotes|${rfqId}`, () => buyerPost("/api/buyer/quotes", credentials, { rfqId }));
  const isReady = !isLoading && Boolean(data?.ok);
  const quotes = isReady ? listOf(data?.quotes, parseQuote) : [];
  const rfqTitle = isReady ? text(record(data?.rfq).title) : "";

  const handleAccept = async (quoteId: string): Promise<void> => {
    if (!(await dialogs.confirm(t("xr_q_accept_q")))) return;
    const answer = await buyerPost("/api/buyer/deal", credentials, { quoteId });
    if (!answer.ok) {
      void dialogs.alert(t("xr_e_forbidden"));
      return;
    }
    onClose();
    onAccepted();
    await cabinet.refresh();
  };

  const body = (): ReactNode => {
    if (isLoading) return <Loading />;
    if (!isReady) return <Empty>{t("xr_e_forbidden")}</Empty>;
    if (!quotes.length) return <Empty>{t("xr_rfq_none")}</Empty>;
    return (
      <div className="rq-list">
        {quotes.map(quote => (
          <QuoteCard key={quote.id} quote={quote} t={t} onAccept={() => void handleAccept(quote.id)} />
        ))}
      </div>
    );
  };

  return (
    <Drawer title={isReady ? `${t("xr_q_h")} — ${rfqTitle}` : t("xr_q_h")} onClose={onClose}>
      {body()}
    </Drawer>
  );
}
