import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Drawer, formValues, Msg } from "../../shell/market";
import type { Notice, Translate } from "../../shell/market";
import { buyerPost } from "./types";
import type { Cabinet, Product } from "./types";

/* Long enough to read "sent" before the drawer closes. */
const CLOSE_DELAY_MS = 900;

type AskDrawerProps = { product: Product; cabinet: Cabinet; t: Translate; onClose: () => void };

/** Asks one seller about one product; the answer arrives in the threads view. */
export function AskDrawer({ product, cabinet, t, onClose }: AskDrawerProps) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    const message = (values.message ?? "").trim();
    if (!message) {
      setNotice({ key: "xr_ask_empty", kind: "err" });
      return;
    }
    const answer = await buyerPost("/api/buyer/inquiry", cabinet.credentials, {
      productId: product.id,
      qty: values.qty ?? "",
      unit: product.unit,
      message,
    });
    if (!answer.ok) {
      setNotice({ key: answer.error === "not_b2b" ? "xr_e_forbidden" : "xr_e_save", kind: "err" });
      return;
    }
    setNotice({ key: "xr_ask_ok", kind: "ok" });
    /* The new thread is fetched at once; only the closing waits. */
    void cabinet.refresh();
    closeTimer.current = window.setTimeout(onClose, CLOSE_DELAY_MS);
  };

  return (
    <Drawer title={`${t("xr_ask_h")} — ${product.title}`} onClose={onClose}>
      <form id="xrAskForm" className="mk-form" onSubmit={handleSubmit}>
        <p className="mk-sub">{product.company}</p>
        <div className="mk-f">
          <label htmlFor="xrAskQty">{t("xr_ask_qty")}</label>
          <input id="xrAskQty" name="qty" type="number" min="0" />
        </div>
        <div className="mk-f wide">
          <label htmlFor="xrAskMsg">{t("xr_ask_msg")}</label>
          <textarea id="xrAskMsg" name="message" rows={5} required />
        </div>
        <div className="mk-actions">
          <button className="btn btn-primary" type="submit">
            {t("xr_ask_send")}
          </button>
        </div>
        <Msg notice={notice} t={t} id="xrAskMsgOut" />
      </form>
    </Drawer>
  );
}
