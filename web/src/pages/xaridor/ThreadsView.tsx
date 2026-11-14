import type { FormEvent } from "react";
import { dialogs } from "../../shell/dialogs";
import { useI18n } from "../../shell/i18n";
import { Empty, formatDay, formValues } from "../../shell/market";
import type { Translate } from "../../shell/market";
import { NoteLines } from "./OrdersView";
import { buyerPost } from "./types";
import type { Cabinet, Thread } from "./types";

function statusKey(status: string): string {
  if (status === "answered") return "xr_th_answered";
  return status === "closed" ? "xr_th_closed" : "xr_th_waiting";
}

type ThreadCardProps = { thread: Thread; t: Translate; onAsk: (text: string) => void };

function ThreadCard({ thread, t, onAsk }: ThreadCardProps) {
  const { lang } = useI18n();
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const text = (formValues(event.currentTarget).text ?? "").trim();
    if (text) onAsk(text);
  };
  return (
    <article className={`rq-card is-${thread.status === "answered" ? "approved" : "pending"}`}>
      <div className="rq-top">
        <span className="rq-badge">{t(statusKey(thread.status))}</span>
        <b>{thread.companyName}</b>
        <span className="rq-ref">{formatDay(thread.updated, lang)}</span>
      </div>
      {thread.productName && <p className="mk-sub">{thread.productName}</p>}
      <p className="rq-about">{thread.message}</p>
      {thread.replies.length > 0 && (
        <NoteLines notes={thread.replies} authorOf={reply => (reply.side === "buyer" ? t("xr_th_you") : reply.by)} />
      )}
      {thread.status !== "closed" && (
        <form className="mk-form" onSubmit={handleSubmit}>
          <div className="mk-f wide">
            <label htmlFor={`xrReply-${thread.id}`}>{t("xr_th_reply")}</label>
            <textarea id={`xrReply-${thread.id}`} name="text" rows={2} />
          </div>
          <div className="mk-actions">
            <button className="btn btn-ghost" type="submit">
              {t("xr_th_send")}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

/** The private channel with one seller. */
export function ThreadsView({ cabinet, t }: { cabinet: Cabinet; t: Translate }) {
  const threads = cabinet.home.inquiries;

  const askAgain = async (id: string, text: string): Promise<void> => {
    const answer = await buyerPost("/api/buyer/inquiry/ask", cabinet.credentials, { id, text });
    if (!answer.ok) {
      void dialogs.alert(t("xr_e_save"));
      return;
    }
    await cabinet.refresh();
  };

  return (
    <div className="panel co-panel">
      <div className="co-panel-head">
        <span className="co-ic">💬</span>
        <h2>{t("xr_v_threads")}</h2>
      </div>
      <div className="rq-list">
        {threads.length ? (
          threads.map(thread => (
            /* The key follows the thread, so a sent reply leaves an empty box behind. */
            <ThreadCard
              key={`${thread.id}|${thread.replies.length}|${thread.updated}`}
              thread={thread}
              t={t}
              onAsk={text => void askAgain(thread.id, text)}
            />
          ))
        ) : (
          <Empty>{t("xr_th_empty")}</Empty>
        )}
      </div>
    </div>
  );
}
