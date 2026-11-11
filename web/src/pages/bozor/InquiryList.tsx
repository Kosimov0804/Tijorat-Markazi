import { useState } from "react";
import type { CSSProperties } from "react";
import { useI18n } from "../../shell/i18n";
import { Chip, Empty, formatDay, formatNumber } from "../../shell/market";
import type { Translate } from "../../shell/market";
import type { Inquiry } from "./types";

const REPLY_INPUT: CSSProperties = {
  flex: "1 1 200px",
  padding: "8px 11px",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-sm)",
  background: "var(--card)",
  color: "var(--ink)",
  font: "inherit",
  fontSize: 14,
};
const SMALL_BUTTON: CSSProperties = { padding: "6px 14px", fontSize: 13 };
const REPLY_BUBBLE: CSSProperties = {
  padding: "9px 12px",
  background: "var(--mk-soft)",
  borderRadius: "var(--radius-sm)",
  fontSize: 13.5,
};
const MAIL_LINK: CSSProperties = { color: "var(--mk)", fontWeight: 600 };

/* Only a plain address becomes a mailto: link; anything else stays text. */
const EMAIL_PATTERN = /^[^\s@<>"'?&]+@[^\s@<>"'?&]+$/;

const statusKind = (status: string): string =>
  status === "new" ? "warn" : status === "answered" ? "good" : "ghost";

type InquiryCardProps = {
  inquiry: Inquiry;
  t: Translate;
  onReply: (text: string) => void;
  onClose: () => void;
};

function InquiryCard({ inquiry, t, onReply, onClose }: InquiryCardProps) {
  const { lang } = useI18n();
  const [reply, setReply] = useState("");
  const sendReply = (): void => {
    const text = reply.trim();
    if (text) onReply(text);
  };
  return (
    <div className="mk-card" style={{ gap: 8 }}>
      <div className="mk-chips">
        <Chip kind={statusKind(inquiry.status)}>{t(`bz_iq_${inquiry.status}`, inquiry.status)}</Chip>
        {inquiry.source && <Chip kind="ghost">{inquiry.source}</Chip>}
      </div>
      <h3>{inquiry.productName || t("bz_iq_general")}</h3>
      {inquiry.message && <p className="mk-desc">{inquiry.message}</p>}
      <div className="mk-meta">
        <span>
          <b>{inquiry.buyerName}</b>
          {inquiry.company && ` · ${inquiry.company}`}
        </span>
        {inquiry.country && <span>🌍 {inquiry.country}</span>}
        {inquiry.qty > 0 && (
          <span>
            {formatNumber(inquiry.qty, lang, 0)} {inquiry.unit}
          </span>
        )}
        <span>{formatDay(inquiry.created, lang)}</span>
      </div>
      <div className="mk-meta" style={{ fontSize: 13.5 }}>
        {inquiry.buyerEmail && (
          <span>
            ✉{" "}
            {EMAIL_PATTERN.test(inquiry.buyerEmail) ? (
              <a href={`mailto:${inquiry.buyerEmail}`} style={MAIL_LINK}>
                {inquiry.buyerEmail}
              </a>
            ) : (
              inquiry.buyerEmail
            )}
          </span>
        )}
        {inquiry.contact && (
          <span>
            📞 <b>{inquiry.contact}</b>
          </span>
        )}
      </div>
      {inquiry.replies.map((item, index) => (
        <div style={REPLY_BUBBLE} key={index}>
          <b>{item.by}</b> — {item.text}
        </div>
      ))}
      {inquiry.status !== "closed" && (
        <div className="mk-row">
          <input
            data-reply-for={inquiry.id}
            placeholder={t("bz_iq_reply_ph")}
            style={REPLY_INPUT}
            value={reply}
            onChange={event => setReply(event.target.value)}
          />
          <button className="btn btn-ghost" type="button" data-reply={inquiry.id} style={SMALL_BUTTON} onClick={sendReply}>
            {t("bz_iq_reply")}
          </button>
          <button className="btn btn-ghost" type="button" data-close-iq={inquiry.id} style={SMALL_BUTTON} onClick={onClose}>
            {t("bz_iq_close")}
          </button>
        </div>
      )}
    </div>
  );
}

type InquiryListProps = {
  inquiries: readonly Inquiry[];
  t: Translate;
  onReply: (id: string, text: string) => void;
  onClose: (id: string) => void;
};

/* Direct enquiries from the showroom product pages. A company that never opens
   Bozor still gets its leads here, because this is where its cabinet lives. */
export function InquiryList({ inquiries, t, onReply, onClose }: InquiryListProps) {
  if (!inquiries.length) return <Empty>{t("bz_no_inquiries")}</Empty>;
  return (
    <>
      {inquiries.map(inquiry => (
        <InquiryCard
          key={inquiry.id}
          inquiry={inquiry}
          t={t}
          onReply={text => onReply(inquiry.id, text)}
          onClose={() => onClose(inquiry.id)}
        />
      ))}
    </>
  );
}
