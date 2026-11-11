import { useI18n } from "../../shell/i18n";
import { dialStyle, Empty, formatMoney, formatNumber } from "../../shell/market";
import type { Translate } from "../../shell/market";
import type { InboxItem } from "./types";

const MAX_ITEMS = 5;
const MAX_REASONS = 2;

type SellerInboxProps = { items: readonly InboxItem[]; t: Translate; onQuote: (item: InboxItem) => void };

/* Open requests that match this seller's products, best fit first. */
export function SellerInbox({ items, t, onQuote }: SellerInboxProps) {
  const { lang } = useI18n();
  if (!items.length) {
    return (
      <div className="mk-stack">
        <Empty>{t("bz_inbox_empty")}</Empty>
      </div>
    );
  }
  return (
    <div className="mk-stack">
      {items.slice(0, MAX_ITEMS).map(item => (
        <div className="mk-match" key={item.id}>
          <div className="mk-dial" style={dialStyle(item.score)}>
            <b>{formatNumber(item.score, lang, 0)}</b>
          </div>
          <div>
            <div className="mk-h">{item.title}</div>
            <div className="mk-meta">
              <span>{item.buyerName}</span>
              {item.qty > 0 && (
                <span>
                  {formatNumber(item.qty, lang, 0)} {item.unit}
                </span>
              )}
              {item.budget > 0 && <span>{formatMoney(item.budget, item.currency, lang)}</span>}
            </div>
            <ul className="mk-why">
              {item.reasons.slice(0, MAX_REASONS).map((reason, index) => (
                <li key={`r${index}`}>{reason}</li>
              ))}
              {item.gaps.slice(0, 1).map((gap, index) => (
                <li className="is-gap" key={`g${index}`}>
                  {gap}
                </li>
              ))}
            </ul>
            <div className="mk-actions" style={{ marginTop: 8 }}>
              <button className="btn btn-ghost" type="button" data-quote={item.id} onClick={() => onQuote(item)}>
                {t("bz_send_quote")}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
