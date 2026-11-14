import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { assocName } from "../orgs";
import type { OrgsStore } from "../orgs";
import { Intro, useLoader } from "../parts";
import { useText } from "../useText";
import { loadMeetings, postConference } from "./conferenceData";
import { MeetingList } from "./MeetingList";

const MESSAGE_MS = 2200;
const WEB_LINK = /^https?:\/\/.+/i;

interface Notice {
  text: string;
  isOk: boolean;
}

/** A status line that fades out by itself, as the old #confMsg did. */
function useNotice(): { notice: Notice | null; isShown: boolean; say: (text: string, isOk?: boolean) => void } {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    if (!isShown) return;
    const timer = setTimeout(() => setIsShown(false), MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [isShown, notice]);

  const say = (text: string, isOk = true) => {
    setNotice({ text, isOk });
    setIsShown(true);
  };
  return { notice, isShown, say };
}

/** Schedules conferences for everyone or for one association's members. */
export function Conference({ store }: { store: OrgsStore }) {
  const { tx, lang } = useText();
  const { orgs, send } = store;
  const [targetId, setTargetId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { notice, isShown, say } = useNotice();
  const { data: meetings, setData: setMeetings } = useLoader(() => loadMeetings(targetId), [targetId]);

  useEffect(() => {
    void send({ op: "list" });
  }, [send]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? "");
    /* An empty link is fine: the server opens a Meet room for it. */
    const link = value("link").trim();
    if (link && !WEB_LINK.test(link)) {
      say(tx("conf_link_err"), false);
      return;
    }
    setIsSaving(true);
    try {
      const answer = await postConference({
        assocId: targetId,
        title: value("title").trim(),
        datetime: value("datetime"),
        link,
        desc: value("desc").trim(),
      });
      setMeetings(answer.meetings);
      form.reset();
      const created = answer.meeting;
      const hasLink = Boolean(created?.link);
      say(tx(created?.isAutoRoom ? "conf_meet_ready" : hasLink ? "conf_added" : "conf_meet_off"), hasLink);
    } catch {
      say("Error", false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-panel">
      <h2>{tx("nav_conf")}</h2>
      <Intro>{tx("conf_intro")}</Intro>
      <div style={{ maxWidth: 520, marginBottom: 18 }}>
        <div className="ac-label">{tx("conf_target")}</div>
        <select
          id="conf-target"
          className="adm-search"
          aria-label={tx("conf_target")}
          style={{ width: "100%", marginBottom: 6 }}
          value={targetId}
          onChange={event => setTargetId(event.target.value)}
        >
          <option value="">{tx("conf_global")}</option>
          {orgs.associations.map(association => (
            <option key={association.id} value={association.id}>
              {assocName(association, lang)}
            </option>
          ))}
        </select>
        <span className="ac-sub" id="confScope">
          {tx(targetId ? "conf_for_assoc" : "conf_for_global")}
        </span>
      </div>
      <form
        className="admin-form"
        id="confForm"
        style={{ alignItems: "flex-end" }}
        onSubmit={event => void handleSubmit(event)}
      >
        <div>
          <div className="ac-label">{tx("conf_title")}</div>
          <input id="conf-title" name="title" aria-label={tx("conf_title")} placeholder={tx("conf_title_ph")} required />
        </div>
        <div>
          <div className="ac-label">{tx("conf_dt")}</div>
          <input id="conf-dt" name="datetime" aria-label={tx("conf_dt")} type="datetime-local" required />
        </div>
        <div>
          <div className="ac-label">{tx("conf_link")}</div>
          <input id="conf-link" name="link" aria-label={tx("conf_link")} type="url" placeholder={tx("conf_meet_auto")} />
        </div>
        <div>
          <div className="ac-label">{tx("conf_desc")}</div>
          <input id="conf-desc" name="desc" aria-label={tx("conf_desc")} placeholder="…" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={isSaving}>
          {tx(isSaving ? "conf_meet_making" : "conf_add")}
        </button>
        <span
          className="ac-sub"
          id="confMsg"
          role="status"
          style={{ opacity: isShown ? 1 : 0, color: notice?.isOk === false ? "var(--gold)" : "var(--green)" }}
        >
          {notice?.text}
        </span>
      </form>
      <p className="ac-label" style={{ marginTop: 10 }}>
        {tx("conf_link_hint")}
      </p>
      <h3 style={{ fontSize: 15, margin: "24px 0 10px" }}>{tx("conf_listh")}</h3>
      <div id="confList">
        <MeetingList meetings={meetings ?? []} targetId={targetId} onChange={setMeetings} onNotice={say} />
      </div>
    </div>
  );
}
