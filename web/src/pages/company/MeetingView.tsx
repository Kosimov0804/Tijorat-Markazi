import { useEffect, useState } from "react";
import { cabinetGet, formatDateTime } from "../../shell/cabinet";
import { useI18n } from "../../shell/i18n";
import { listOf } from "../../shell/market/narrow";
import { joinUrl, parseConference } from "./conference";
import type { Conference } from "./conference";
import type { CompanyText } from "./types";

/* The room opens ten minutes before the meeting starts. */
const OPENS_BEFORE_MS = 10 * 60 * 1000;

function MeetingCard({ conference, ot }: { conference: Conference; ot: CompanyText }) {
  const { lang } = useI18n();
  const startsAt = new Date(conference.datetime).getTime();
  const isOpen = Number.isNaN(startsAt) || startsAt - Date.now() <= OPENS_BEFORE_MS;
  const canJoin = isOpen && Boolean(conference.link);
  return (
    <div className="cf-card" style={{ marginBottom: 14 }}>
      <span className="co-eyebrow">
        {ot("cf_when")}: {formatDateTime(conference.datetime, lang)}
      </span>
      <h3 className="cf-name">{conference.title}</h3>
      {conference.desc && <p className="co-sub">{conference.desc}</p>}
      <p className={isOpen ? "cf-status open" : "cf-status"}>{ot(isOpen ? "cf_open" : "cf_soon")}</p>
      {canJoin ? (
        <a className="btn btn-primary btn-lg" href={joinUrl(conference)} target="_blank" rel="noopener">
          {ot("cf_join")}
        </a>
      ) : (
        <a className={isOpen ? "btn btn-primary btn-lg" : "btn btn-primary btn-lg disabled"} aria-disabled="true">
          {ot("cf_join")}
        </a>
      )}
    </div>
  );
}

export function MeetingView({ assocId, ot }: { assocId: string; ot: CompanyText }) {
  const [meetings, setMeetings] = useState<Conference[] | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void cabinetGet(`/api/conference?list=1&assoc=${encodeURIComponent(assocId)}`).then(answer => {
      if (isCurrent) setMeetings(answer.isOk ? listOf(answer.body.meetings, parseConference) : []);
    });
    return () => {
      isCurrent = false;
    };
  }, [assocId]);

  return (
    <div className="panel co-panel">
      <div className="co-panel-head">
        <span className="co-ic">🎥</span>
        <h2 id="cfTitle">{ot("cf_title")}</h2>
      </div>
      <div id="cfBody">
        {meetings?.map((conference, index) => (
          <MeetingCard key={conference.id || index} conference={conference} ot={ot} />
        ))}
        {meetings && !meetings.length && <p className="co-sub">{ot("cf_none")}</p>}
      </div>
    </div>
  );
}
