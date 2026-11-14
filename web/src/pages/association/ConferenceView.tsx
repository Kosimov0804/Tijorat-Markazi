import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { cabinetPost, FlashNote, localDateTime, useFlash, webHref } from "../../shell/cabinet";
import { listOf, record, text } from "../../shell/market/narrow";
import type { AssocText, ViewProps } from "./types";

type Meeting = {
  id: string;
  title: string;
  datetime: string;
  desc: string;
  link: string;
  provider: string;
  meetError: string;
};

const API = "/api/assoc/conference";
const WEB_LINK = /^https?:\/\/.+/i;
const EMPTY_FORM = { title: "", datetime: "", link: "", desc: "" };

function parseMeeting(value: unknown): Meeting {
  const item = record(value);
  return {
    id: text(item.id),
    title: text(item.title),
    datetime: text(item.datetime),
    desc: text(item.desc),
    link: text(item.link),
    provider: text(item.provider),
    meetError: text(item.meetError),
  };
}

const parseMeetings = (value: unknown): Meeting[] => listOf(value, parseMeeting);

type RowProps = { meeting: Meeting; at: AssocText; onRelink: () => Promise<void>; onRemove: () => void };

/* Where a scheduled meeting's room stands: an automatic room, a pasted link,
   or nothing yet. */
function Room({ meeting, at, onRelink }: Omit<RowProps, "onRemove">) {
  const [isMaking, setIsMaking] = useState(false);
  if (meeting.link) {
    const href = webHref(meeting.link);
    return (
      <>
        {href ? (
          <a href={href} target="_blank" rel="noopener">
            {meeting.link}
          </a>
        ) : (
          <span>{meeting.link}</span>
        )}
        <span className="ac-sub">{at(meeting.provider === "meet-bot" ? "conf_meet_auto" : "conf_meet_manual")}</span>
      </>
    );
  }
  const why =
    meeting.meetError === "google_not_connected"
      ? at("conf_meet_off")
      : `${at("conf_meet_err")}${meeting.meetError ? ` · ${meeting.meetError}` : ""}`;
  const relink = async (): Promise<void> => {
    setIsMaking(true);
    await onRelink();
    setIsMaking(false);
  };
  return (
    <>
      <span className="ac-sub" style={{ color: "var(--gold)" }}>
        {why}
      </span>{" "}
      <button
        type="button"
        className="btn btn-ghost conf-relink"
        style={{ padding: "4px 10px", fontSize: 12 }}
        disabled={isMaking}
        onClick={() => void relink()}
      >
        {at(isMaking ? "conf_meet_making" : "conf_meet_retry")}
      </button>
    </>
  );
}

function MeetingRow({ meeting, at, onRelink, onRemove }: RowProps) {
  return (
    <div className="conf-row">
      <div className="conf-row-main">
        <b>{meeting.title}</b>
        <span>
          {localDateTime(meeting.datetime)}
          {meeting.desc && ` · ${meeting.desc}`}
        </span>
        <Room meeting={meeting} at={at} onRelink={onRelink} />
      </div>
      <div className="conf-row-act">
        {/* Whoever scheduled it needs a way in too: the same server-resolved hop
            the companies use, so the creator lands in the identical room. */}
        {meeting.link && (
          <a
            className="btn btn-primary conf-join-btn"
            href={`/api/conference/join?id=${encodeURIComponent(meeting.id)}`}
            target="_blank"
            rel="noopener"
          >
            {at("conf_join")}
          </a>
        )}
        <button type="button" className="tdel" onClick={onRemove}>
          {at("del")}
        </button>
      </div>
    </div>
  );
}

type ConferenceProps = ViewProps & { onActive: (hasMeeting: boolean) => void };

/* Online meetings for the association's own companies. */
export function ConferenceView({ credentials, at, onActive }: ConferenceProps) {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isAdding, setIsAdding] = useState(false);
  const flash = useFlash();

  const paint = (value: unknown): void => {
    const next = parseMeetings(value);
    setMeetings(next);
    onActive(next.length > 0);
  };

  /* Every call answers with the full list. A dropped connection leaves the
     list as it was and says so. */
  const call = async (body: object) => {
    const answer = await cabinetPost(API, credentials, body);
    if (answer.status === 0) flash.show("Error", false);
    else paint(answer.body.meetings);
    return answer;
  };

  useEffect(() => {
    let isCurrent = true;
    void cabinetPost(API, credentials, { op: "list" }).then(answer => {
      if (isCurrent && answer.status !== 0) setMeetings(parseMeetings(answer.body.meetings));
    });
    return () => {
      isCurrent = false;
    };
  }, [credentials]);

  const handleRelink = async (id: string): Promise<void> => {
    const answer = await call({ relinkId: id });
    if (answer.status !== 0) flash.show(at(answer.body.ok ? "conf_meet_ready" : "conf_meet_err"), Boolean(answer.body.ok));
  };

  const handleAdd = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    /* An empty link is fine: the bot opens a Meet room for it. */
    const link = form.link.trim();
    if (link && !WEB_LINK.test(link)) {
      flash.show(at("conf_link_err"), false);
      return;
    }
    setIsAdding(true);
    const answer = await call({ title: form.title.trim(), datetime: form.datetime, link, desc: form.desc.trim() });
    setIsAdding(false);
    if (answer.status === 0) return;
    setForm(EMPTY_FORM);
    const made = record(answer.body.meeting);
    const key = made.provider === "meet-bot" ? "conf_meet_ready" : made.link ? "conf_added" : "conf_meet_off";
    flash.show(at(key), Boolean(made.link));
  };

  const field = (key: keyof typeof EMPTY_FORM) => ({
    value: form[key],
    onChange: (event: { target: { value: string } }) => setForm(current => ({ ...current, [key]: event.target.value })),
  });

  return (
    <div className="admin-panel">
      <h2>{at("nav_conf")}</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>{at("conf_intro")}</p>
      <form className="admin-form" id="confForm" style={{ alignItems: "flex-end" }} onSubmit={handleAdd}>
        <div>
          <div className="ac-label">{at("conf_title")}</div>
          <input id="conf-title" aria-label={at("conf_title")} placeholder={at("conf_title_ph")} required {...field("title")} />
        </div>
        <div>
          <div className="ac-label">{at("conf_dt")}</div>
          <input id="conf-dt" aria-label={at("conf_dt")} type="datetime-local" required {...field("datetime")} />
        </div>
        <div>
          <div className="ac-label">{at("conf_link")}</div>
          <input id="conf-link" aria-label={at("conf_link")} type="url" placeholder={at("conf_meet_auto")} {...field("link")} />
        </div>
        <div>
          <div className="ac-label">{at("conf_desc")}</div>
          <input id="conf-desc" aria-label={at("conf_desc")} placeholder="…" {...field("desc")} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={isAdding}>
          {at(isAdding ? "conf_meet_making" : "conf_add")}
        </button>
        <FlashNote id="confMsg" flash={flash} />
      </form>
      <p className="ac-label" style={{ marginTop: 10 }}>
        {at("conf_link_hint")}
      </p>
      <h3 style={{ fontSize: 15, margin: "24px 0 10px" }}>{at("conf_listh")}</h3>
      <div id="confList">
        {meetings?.map(meeting => (
          <MeetingRow
            key={meeting.id}
            meeting={meeting}
            at={at}
            onRelink={() => handleRelink(meeting.id)}
            onRemove={() => void call({ removeId: meeting.id })}
          />
        ))}
        {meetings && !meetings.length && <p className="ac-label">{at("conf_none_list")}</p>}
      </div>
    </div>
  );
}
