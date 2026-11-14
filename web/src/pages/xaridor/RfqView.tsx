import { useState } from "react";
import type { FormEvent } from "react";
import { useI18n } from "../../shell/i18n";
import { Empty, formatDay, formatMoney, formatNumber, formValues, list, OptionSelect } from "../../shell/market";
import type { Translate } from "../../shell/market";
import { QuotesDrawer } from "./QuotesDrawer";
import { buyerPost } from "./types";
import type { Cabinet, Rfq } from "./types";

type RfqViewProps = { cabinet: Cabinet; t: Translate; onDealOpened: () => void };
type FormNotice = { kind: "ok" | "err"; key: string; matched: number };

const FIELDS = ["title", "spec", "category", "qty", "unit", "budget", "currency", "region", "maxLead", "deadline"];

function RfqCard({ rfq, t, onOpenQuotes }: { rfq: Rfq; t: Translate; onOpenQuotes: () => void }) {
  const { lang } = useI18n();
  const count = (value: number): string => formatNumber(value, lang, 0);
  const offers = rfq.quoteCount ? t("xr_rfq_offers").replace("{n}", count(rfq.quoteCount)) : t("xr_rfq_none");
  return (
    <article className={`rq-card is-${rfq.status === "open" ? "pending" : "approved"}`}>
      <div className="rq-top">
        <span className="rq-badge">{t(`status_${rfq.status}`, rfq.status)}</span>
        <b>{rfq.title}</b>
        <span className="rq-ref">{formatDay(rfq.created, lang)}</span>
      </div>
      {rfq.spec && <p className="rq-about">{rfq.spec}</p>}
      <dl className="rq-kv">
        {rfq.qty > 0 && (
          <>
            <dt>{t("xr_rfq_qty")}</dt>
            <dd>
              {count(rfq.qty)} {rfq.unit}
            </dd>
          </>
        )}
        {rfq.budget > 0 && (
          <>
            <dt>{t("xr_rfq_budget")}</dt>
            <dd>{formatMoney(rfq.budget, rfq.currency, lang)}</dd>
          </>
        )}
        {rfq.maxLead > 0 && (
          <>
            <dt>{t("xr_rfq_lead")}</dt>
            <dd>
              {count(rfq.maxLead)} {t("xr_days")}
            </dd>
          </>
        )}
        <dt>{t("xr_q_h")}</dt>
        <dd>{offers}</dd>
      </dl>
      {rfq.quoteCount > 0 && (
        <div className="rq-actions">
          <button className="btn btn-primary" type="button" onClick={onOpenQuotes}>
            {t("xr_rfq_open")}
          </button>
        </div>
      )}
    </article>
  );
}

function RfqFields({ currencies, t }: { currencies: readonly string[]; t: Translate }) {
  const field = (id: string, name: string, labelKey: string, type = "text") => (
    <div className="mk-f">
      <label htmlFor={id}>{t(labelKey)}</label>
      <input id={id} name={name} type={type} min={type === "number" ? "0" : undefined} />
    </div>
  );
  return (
    <>
      <div className="mk-f wide">
        <label htmlFor="xrRqTitle">{t("xr_rfq_title")}</label>
        <input id="xrRqTitle" name="title" required />
      </div>
      <div className="mk-f wide">
        <label htmlFor="xrRqSpec">{t("xr_rfq_spec")}</label>
        <textarea id="xrRqSpec" name="spec" rows={3} />
      </div>
      {field("xrRqCat", "category", "xr_rfq_cat")}
      {field("xrRqQty", "qty", "xr_rfq_qty", "number")}
      {field("xrRqUnit", "unit", "xr_rfq_unit")}
      {field("xrRqBudget", "budget", "xr_rfq_budget", "number")}
      <div className="mk-f">
        <label htmlFor="xrRqCur">{t("xr_rfq_cur")}</label>
        <OptionSelect id="xrRqCur" name="currency" options={currencies} />
      </div>
      {field("xrRqRegion", "region", "xr_rfq_region")}
      {field("xrRqLead", "maxLead", "xr_rfq_lead", "number")}
      {field("xrRqDl", "deadline", "xr_rfq_dl", "date")}
    </>
  );
}

function noticeText(notice: FormNotice, t: Translate, format: (value: number) => string): string {
  const matched = notice.matched ? ` ${t("xr_rfq_matched").replace("{n}", format(notice.matched))}` : "";
  return t(notice.key) + matched;
}

/** One request, many offers: publish a price request and compare what comes back. */
export function RfqView({ cabinet, t, onDealOpened }: RfqViewProps) {
  const { lang } = useI18n();
  const [notice, setNotice] = useState<FormNotice | null>(null);
  const [openRfqId, setOpenRfqId] = useState<string | null>(null);
  const { rfqs, currencies } = cabinet.home;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(form);
    const body = Object.fromEntries(FIELDS.map(name => [name, (values[name] ?? "").trim()]));
    if (!body.title) {
      setNotice({ kind: "err", key: "xr_rfq_e_title", matched: 0 });
      return;
    }
    const answer = await buyerPost("/api/buyer/rfq", cabinet.credentials, body);
    if (!answer.ok) {
      setNotice({ kind: "err", key: "xr_e_save", matched: 0 });
      return;
    }
    /* The matcher already knows who fits. Saying so straight away is the
       difference between "published" and "published, and N sellers will see it". */
    setNotice({ kind: "ok", key: "xr_rfq_ok", matched: list(answer.matches).length });
    form.reset();
    await cabinet.refresh();
  };

  return (
    <>
      <div className="panel co-panel">
        <div className="co-panel-head">
          <span className="co-ic">📩</span>
          <h2>{t("xr_rfq_new")}</h2>
        </div>
        <p className="co-sub">{t("xr_rfq_sub")}</p>
        <form className="mk-form" id="xrRfqForm" onSubmit={handleSubmit}>
          <RfqFields currencies={currencies} t={t} />
          <div className="mk-actions">
            <button className="btn btn-primary" type="submit">
              {t("xr_rfq_send")}
            </button>
          </div>
        </form>
        <p className={notice ? `mk-msg is-${notice.kind}` : "mk-msg"} id="xrRqMsg" hidden={!notice}>
          {notice && noticeText(notice, t, value => formatNumber(value, lang, 0))}
        </p>
      </div>

      <div className="panel co-panel">
        <div className="co-panel-head">
          <span className="co-ic">📋</span>
          <h2>{t("xr_v_rfq")}</h2>
        </div>
        <div className="rq-list">
          {rfqs.length ? (
            rfqs.map(rfq => <RfqCard key={rfq.id} rfq={rfq} t={t} onOpenQuotes={() => setOpenRfqId(rfq.id)} />)
          ) : (
            <Empty>{t("xr_rfq_empty")}</Empty>
          )}
        </div>
      </div>
      {openRfqId && (
        <QuotesDrawer
          rfqId={openRfqId}
          cabinet={cabinet}
          t={t}
          onClose={() => setOpenRfqId(null)}
          onAccepted={onDealOpened}
        />
      )}
    </>
  );
}
