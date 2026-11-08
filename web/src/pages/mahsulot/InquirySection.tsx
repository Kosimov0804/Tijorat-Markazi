import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useI18n } from "../../shell/i18n";
import { formatDay, identity, marketApi } from "../../shell/market/mk";
import type { Translate } from "../../shell/market/mk";

type Reply = { by: string; t: number; text: string };
type Inquiry = {
  productId?: string;
  productName?: string;
  companyName?: string;
  status: string;
  created: number;
  message?: string;
  replies?: Reply[];
};

type SendResult = { viewKey?: string };
/* The key, not the text, so the message follows a language switch. */
type Notice = { key: string; kind: "ok" | "err" };

type InquirySectionProps = {
  companyId: string;
  companyName: string;
  productId: string;
  productName: string;
  t: Translate;
};

const statusChip = (status: string): string =>
  status === "answered" ? "good" : status === "closed" ? "ghost" : "warn";

export function InquirySection({ companyId, companyName, productId, productName, t }: InquirySectionProps) {
  const { lang } = useI18n();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [thread, setThread] = useState<Inquiry[]>([]);
  const isSending = useRef(false);
  const latestThreadLoad = useRef(0);

  /* The buyer's own inquiries to this company, with the company's replies. */
  const loadThread = useCallback(async () => {
    const email = identity.email();
    const viewKey = identity.viewKey();
    if (!email) return;
    if (!viewKey) {
      setThread([]);
      return;
    }
    const run = ++latestThreadLoad.current;
    const result = await marketApi<{ items: Inquiry[] }>("/api/bozor/inquiry/mine", {
      viewKey,
      email,
      name: identity.name(),
    });
    if (run !== latestThreadLoad.current) return;
    setThread((result.items ?? []).filter(item => item.productId === productId || item.companyName === companyName));
  }, [productId, companyName]);

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const read = (name: string): string => String(new FormData(form).get(name) ?? "").trim();
    const email = read("email");
    const contact = read("contact");
    if (!email && !contact) {
      setNotice({ key: "pd_need_contact", kind: "err" });
      return;
    }
    /* A double-click must not send the seller two inquiries. */
    if (isSending.current) return;
    isSending.current = true;
    const name = read("name");
    const result = await marketApi<SendResult>("/api/bozor/inquiry", {
      companyId,
      productId,
      source: "showroom",
      viewKey: identity.viewKey(),
      name,
      company: read("org"),
      email,
      contact,
      country: read("country"),
      qty: String(new FormData(form).get("qty") ?? ""),
      unit: read("unit"),
      message: read("message"),
    });
    isSending.current = false;
    if (!result.ok) {
      setNotice({ key: result.error === "contact_required" ? "pd_need_contact" : "pd_send_fail", kind: "err" });
      return;
    }
    /* Remember the address so the reply can be shown next time they visit. */
    if (email) identity.setPerson(email, name);
    /* The capability key that lets this browser read the thread back. */
    if (result.viewKey) identity.setViewKey(result.viewKey);
    setNotice({ key: "pd_send_ok", kind: "ok" });
    form.querySelector<HTMLTextAreaElement>("#pdMessage")!.value = "";
    void loadThread();
  };

  return (
    <section className="pd-connect" id="pdContact">
      <div className="pd-connect-head">
        <h2>{t("pd_contact_h")}</h2>
        <p>{t("pd_contact_p").replace("{co}", companyName)}</p>
      </div>
      <form className="mk-form" id="pdForm" onSubmit={handleSubmit}>
        <div className="mk-f">
          <label>{t("pd_f_name")}</label>
          <input id="pdName" name="name" defaultValue={identity.name()} required />
        </div>
        <div className="mk-f">
          <label>{t("pd_f_org")}</label>
          <input id="pdOrg" name="org" />
        </div>
        <div className="mk-f">
          <label>{t("pd_f_email")}</label>
          <input id="pdEmail" name="email" type="email" defaultValue={identity.email()} />
        </div>
        <div className="mk-f">
          <label>{t("pd_f_contact")}</label>
          <input id="pdContactVal" name="contact" placeholder="+998 …" />
        </div>
        <div className="mk-f">
          <label>{t("pd_f_country")}</label>
          <input id="pdCountry" name="country" />
        </div>
        <div className="mk-f">
          <label>{t("pd_f_qty")}</label>
          <input id="pdQty" name="qty" type="number" min="0" />
        </div>
        <div className="mk-f">
          <label>{t("pd_f_unit")}</label>
          <input id="pdUnit" name="unit" placeholder="kg / dona / tonna" />
        </div>
        <div className="mk-f wide">
          <label>{t("pd_f_message")}</label>
          <textarea id="pdMessage" name="message" placeholder={t("pd_msg_ph")} />
        </div>
        <div className="mk-actions wide">
          <button className="btn btn-primary" type="submit">
            {t("pd_send")}
          </button>
          <span className="pd-hint">{t("pd_contact_note")}</span>
        </div>
        <p className={notice ? `mk-msg is-${notice.kind}` : "mk-msg wide"} id="pdMsg" hidden={!notice}>
          {notice && t(notice.key).replace("{co}", companyName)}
        </p>
      </form>
      <div id="pdThread">
        {thread.length > 0 && (
          <div className="pd-thread">
            <h3>{t("pd_thread")}</h3>
            {thread.map((item, itemIndex) => (
              <article className="pd-msg" key={`${item.created}|${itemIndex}`}>
                <div className="pd-msg-top">
                  <b>{item.productName || productName}</b>{" "}
                  <span className={`mk-chip is-${statusChip(item.status)}`}>
                    {t(`pd_st_${item.status}`, item.status)}
                  </span>{" "}
                  <span className="pd-msg-date">{formatDay(item.created, lang)}</span>
                </div>
                {item.message && <p>{item.message}</p>}
                {item.replies?.map((reply, replyIndex) => (
                  <div className="pd-reply" key={`${reply.t}|${replyIndex}`}>
                    <b>{reply.by}</b> <span className="pd-msg-date">{formatDay(reply.t, lang)}</span>
                    <p>{reply.text}</p>
                  </div>
                ))}
                {!item.replies?.length && <p className="pd-hint">{t("pd_awaiting")}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
