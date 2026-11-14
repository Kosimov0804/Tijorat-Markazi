import { useCallback, useEffect, useState } from "react";
import { cabinetPost, formatDateTime, mailHref, phoneHref } from "../../shell/cabinet";
import type { CabinetCredentials } from "../../shell/cabinet";
import { dialogs } from "../../shell/dialogs";
import { useI18n } from "../../shell/i18n";
import { amount, listOf, record, text } from "../../shell/market/narrow";
import type { CompanyTextKey } from "./text";
import type { CompanyText, ViewProps } from "./types";

type Reply = { by: string; text: string };
type Inquiry = {
  id: string;
  status: string;
  productId: string;
  productName: string;
  message: string;
  buyerName: string;
  buyerEmail: string;
  company: string;
  country: string;
  contact: string;
  qty: string;
  unit: string;
  created: string | number;
  replies: Reply[];
};
type Inbox = { unread: number; items: Inquiry[] };
type Tab = "active" | "archive";
type Change = { text: string } | { status: "closed" | "reopen" };

const STATUS: Readonly<Record<string, { label: CompanyTextKey; className: string } | undefined>> = {
  new: { label: "iq_new", className: "is-new" },
  answered: { label: "iq_answered", className: "is-answered" },
  closed: { label: "iq_closed", className: "is-closed" },
};

function parseInquiry(value: unknown): Inquiry {
  const item = record(value);
  const field = (key: string): string => text(item[key]);
  return {
    id: field("id"),
    status: field("status"),
    productId: field("productId"),
    productName: field("productName"),
    message: field("message"),
    buyerName: field("buyerName"),
    buyerEmail: field("buyerEmail"),
    company: field("company"),
    country: field("country"),
    contact: field("contact"),
    qty: field("qty"),
    unit: field("unit"),
    created: typeof item.created === "number" ? item.created : field("created"),
    replies: listOf(item.replies, entry => ({ by: text(record(entry).by), text: text(record(entry).text) })),
  };
}

/* An error must not read as "no enquiries": that would blank the list and
   silently zero the badge while messages sit unanswered. Null means failed. */
export async function fetchInquiries(credentials: CabinetCredentials): Promise<Inbox | null> {
  const answer = await cabinetPost("/api/bozor/inquiries", credentials);
  if (!answer.isOk || answer.body.error) return null;
  return { unread: amount(answer.body.unread), items: listOf(answer.body.items, parseInquiry) };
}

function Contact({ inquiry, ot }: { inquiry: Inquiry; ot: CompanyText }) {
  const mail = mailHref(inquiry.buyerEmail);
  const phone = phoneHref(inquiry.contact);
  return (
    <div className="iq-contact">
      {inquiry.buyerEmail && (mail ? <a href={mail}>✉ {inquiry.buyerEmail}</a> : <span>✉ {inquiry.buyerEmail}</span>)}
      {inquiry.contact && (phone ? <a href={phone}>📞 {inquiry.contact}</a> : <span>📞 {inquiry.contact}</span>)}
      {inquiry.productId && (
        <a href={`mahsulot.html?id=${encodeURIComponent(inquiry.productId)}`} target="_blank" rel="noopener">
          {ot("iq_open_product")} →
        </a>
      )}
    </div>
  );
}

type CardProps = { inquiry: Inquiry; ot: CompanyText; onChange: (change: Change) => Promise<void> };

function InquiryCard({ inquiry, ot, onChange }: CardProps) {
  const { lang } = useI18n();
  const [reply, setReply] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const status = STATUS[inquiry.status];

  const run = async (change: Change): Promise<void> => {
    if (isBusy) return;
    setIsBusy(true);
    await onChange(change);
    setIsBusy(false);
  };
  const sendReply = (): void => {
    if (reply.trim()) void run({ text: reply.trim() });
  };

  return (
    <article className={`iq-card ${status?.className ?? "is-closed"}`}>
      <div className="iq-top">
        <span className="iq-badge">{status ? ot(status.label) : inquiry.status}</span>
        {inquiry.productName && <b className="iq-prod">{inquiry.productName}</b>}
        <span className="iq-date">{formatDateTime(inquiry.created, lang)}</span>
      </div>
      {inquiry.message && <p className="iq-msg">{inquiry.message}</p>}
      <div className="iq-meta">
        <span>
          {ot("iq_from")}: <b>{inquiry.buyerName}</b>
          {inquiry.company && ` · ${inquiry.company}`}
        </span>
        {inquiry.country && <span>🌍 {inquiry.country}</span>}
        {inquiry.qty && (
          <span>
            {ot("iq_qty")}:{" "}
            <b>
              {inquiry.qty} {inquiry.unit}
            </b>
          </span>
        )}
      </div>
      <Contact inquiry={inquiry} ot={ot} />
      {inquiry.replies.map((item, index) => (
        <div className="iq-reply" key={index}>
          <b>{item.by}</b>
          <p>{item.text}</p>
        </div>
      ))}
      {inquiry.status !== "closed" ? (
        <div className="iq-actions">
          <input
            className="iq-input"
            placeholder={ot("iq_reply_ph")}
            aria-label={ot("iq_reply_ph")}
            value={reply}
            onChange={event => setReply(event.target.value)}
          />
          <button className="btn btn-primary" type="button" disabled={isBusy} onClick={sendReply}>
            {ot("iq_reply")}
          </button>
          <button className="btn btn-ghost" type="button" disabled={isBusy} onClick={() => void run({ status: "closed" })}>
            {ot("iq_close")}
          </button>
        </div>
      ) : (
        <div className="iq-actions">
          <button className="btn btn-ghost" type="button" disabled={isBusy} onClick={() => void run({ status: "reopen" })}>
            {ot("iq_reopen")}
          </button>
        </div>
      )}
    </article>
  );
}

type InquiriesProps = ViewProps & { onUnread: (count: number) => void };
type ListState = { status: "loading" | "failed" } | { status: "ready"; items: Inquiry[] };

/* A visitor on a showroom product page fills in "contact the company"; it
   arrives here, with the contact details needed to answer directly. */
export function InquiriesView({ credentials, ot, onUnread }: InquiriesProps) {
  const [tab, setTab] = useState<Tab>("active");
  const [state, setState] = useState<ListState>({ status: "loading" });

  const load = useCallback(async (): Promise<void> => {
    const inbox = await fetchInquiries(credentials);
    setState(inbox ? { status: "ready", items: inbox.items } : { status: "failed" });
    if (inbox) onUnread(inbox.unread);
  }, [credentials, onUnread]);

  useEffect(() => {
    void load();
  }, [load]);

  const change = async (id: string, body: Change): Promise<void> => {
    const answer = await cabinetPost("/api/bozor/inquiry/reply", credentials, { id, ...body });
    if (!answer.isOk || answer.body.error || !answer.body.ok) await dialogs.alert(ot("iq_fail"));
    await load();
  };

  const all = state.status === "ready" ? state.items : [];
  /* A closed enquiry is done with, not deleted: it moves to the archive so the
     working list only holds what still needs an answer. */
  const lists: Record<Tab, Inquiry[]> = {
    active: all.filter(item => item.status !== "closed"),
    archive: all.filter(item => item.status === "closed"),
  };
  const tabButton = (id: Tab, label: CompanyTextKey) => (
    <button
      type="button"
      className={tab === id ? "iq-tab is-on" : "iq-tab"}
      data-iq-tab={id}
      role="tab"
      aria-selected={tab === id}
      onClick={() => setTab(id)}
    >
      {ot(label)} <em>{lists[id].length}</em>
    </button>
  );

  return (
    <div className="panel co-panel">
      <div className="co-panel-head">
        <span className="co-ic">📩</span>
        <h2 id="iqTitle">{ot("iq_title")}</h2>
      </div>
      <p className="co-sub" id="iqSub">
        {ot("iq_sub")}
      </p>
      <div className="iq-list" id="iqList">
        {state.status === "loading" && <p className="co-sub">{ot("news_loading")}</p>}
        {state.status === "failed" && <p className="empty-note">{ot("iq_fail")}</p>}
        {state.status === "ready" && (
          <>
            <div className="iq-tabs" role="tablist">
              {tabButton("active", "iq_tab_active")}
              {tabButton("archive", "iq_tab_archive")}
            </div>
            {lists[tab].map(inquiry => (
              <InquiryCard key={inquiry.id} inquiry={inquiry} ot={ot} onChange={body => change(inquiry.id, body)} />
            ))}
            {!lists[tab].length && <p className="empty-note">{ot(tab === "archive" ? "iq_empty_archive" : "iq_empty")}</p>}
          </>
        )}
      </div>
    </div>
  );
}
