import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  companyIdentity,
  CURRENCIES,
  Drawer,
  Field,
  formValues,
  marketJson,
  Msg,
  OptionSelect,
} from "../../shell/market";
import type { Notice, Translate } from "../../shell/market";
import type { InboxItem } from "./types";

/* Long enough to read "Quote sent." before the drawer closes. */
const CLOSE_DELAY_MS = 900;

type QuoteDrawerProps = { item: InboxItem; t: Translate; onClose: () => void; onSent: () => void };

/* Quote form for one inbound RFQ. */
export function QuoteDrawer({ item, t, onClose, onSent }: QuoteDrawerProps) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const answer = await marketJson(
      "/api/bozor/quote",
      companyIdentity.withCompany({
        rfqId: item.id,
        productId: item.productId,
        unit: item.unit,
        ...formValues(event.currentTarget),
      }),
    );
    if (!answer.ok) {
      setNotice({ key: "bz_quote_fail", kind: "err" });
      return;
    }
    setNotice({ key: "bz_quote_ok", kind: "ok" });
    closeTimer.current = window.setTimeout(() => {
      onClose();
      onSent();
    }, CLOSE_DELAY_MS);
  };

  const currency = CURRENCIES.find(code => code === item.currency);
  return (
    <Drawer title={t("bz_send_quote")} onClose={onClose}>
      <form className="mk-form" id="bzQuoteForm" onSubmit={handleSubmit}>
        <Field label={t("bz_price")}>
          <input id="qPrice" name="price" type="number" step="0.01" required />
        </Field>
        <Field label={t("bz_f_currency")}>
          <OptionSelect id="qCurrency" name="currency" options={CURRENCIES} defaultValue={currency} />
        </Field>
        <Field label={t("bz_f_qty")}>
          <input id="qQty" name="qty" type="number" defaultValue={item.qty || ""} />
        </Field>
        <Field label={`${t("bz_lead_label")} (${t("bz_days")})`}>
          <input id="qLead" name="leadTime" type="number" />
        </Field>
        <Field label="Incoterm">
          <input id="qIncoterm" name="incoterm" />
        </Field>
        <Field label={t("bz_validity")}>
          <input id="qValidity" name="validity" type="date" />
        </Field>
        <Field label={t("bz_terms")} isWide>
          <textarea id="qTerms" name="terms" />
        </Field>
        <div className="mk-actions wide">
          <button className="btn btn-primary" type="submit">
            {t("bz_send_quote")}
          </button>
        </div>
        <Msg notice={notice} t={t} id="bzQMsg" />
      </form>
    </Drawer>
  );
}
