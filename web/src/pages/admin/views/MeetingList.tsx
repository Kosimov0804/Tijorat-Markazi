import { useState } from "react";
import { localDateTime } from "../parts";
import { useText } from "../useText";
import { postConference } from "./conferenceData";
import type { Meeting } from "./conferenceData";

type MeetingListProps = {
  meetings: readonly Meeting[];
  /** The association the list belongs to; empty for the global one. */
  targetId: string;
  onChange: (meetings: readonly Meeting[]) => void;
  onNotice: (text: string, isOk?: boolean) => void;
};

/** The scheduled meetings, each with its room, a way in and a delete button. */
export function MeetingList({ meetings, targetId, onChange, onNotice }: MeetingListProps) {
  const { tx } = useText();
  const [relinkingId, setRelinkingId] = useState<string | null>(null);

  const handleRemove = async (id: string) => {
    try {
      onChange((await postConference({ assocId: targetId, removeId: id })).meetings);
    } catch {
      onNotice("Error", false);
    }
  };

  /* A meeting saved while Google was unreachable can get its room later. */
  const handleRelink = async (id: string) => {
    setRelinkingId(id);
    try {
      const answer = await postConference({ assocId: targetId, relinkId: id });
      onChange(answer.meetings);
      onNotice(tx(answer.isOk ? "conf_meet_ready" : "conf_meet_err"), answer.isOk);
    } catch {
      onNotice("Error", false);
    } finally {
      setRelinkingId(null);
    }
  };

  if (!meetings.length) return <p className="ac-label">{tx("conf_none_list")}</p>;

  return (
    <>
      {meetings.map(meeting => (
        <div className="conf-row" key={meeting.id}>
          <div className="conf-row-main">
            <b>{meeting.title}</b>
            <span>
              {localDateTime(meeting.datetime)}
              {meeting.desc ? ` · ${meeting.desc}` : ""}
            </span>
            <Room
              meeting={meeting}
              isRelinking={relinkingId === meeting.id}
              onRelink={() => void handleRelink(meeting.id)}
            />
          </div>
          <div className="conf-row-act">
            {/* Whoever scheduled it enters through the same server-resolved hop the companies use. */}
            {meeting.link && (
              <a
                className="btn btn-primary conf-join-btn"
                href={`/api/conference/join?id=${encodeURIComponent(meeting.id)}`}
                target="_blank"
                rel="noopener"
              >
                {tx("conf_join")}
              </a>
            )}
            <button className="tdel" type="button" onClick={() => void handleRemove(meeting.id)}>
              {tx("del")}
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

type RoomProps = {
  meeting: Meeting;
  isRelinking: boolean;
  onRelink: () => void;
};

/** Where a meeting's room stands: an automatic room, a pasted link, or nothing yet. */
function Room({ meeting, isRelinking, onRelink }: RoomProps) {
  const { tx } = useText();

  if (meeting.link) {
    return (
      <>
        {meeting.href ? (
          <a href={meeting.href} target="_blank" rel="noopener noreferrer">
            {meeting.link}
          </a>
        ) : (
          <span>{meeting.link}</span>
        )}
        <span className="ac-sub">{tx(meeting.isAutoRoom ? "conf_meet_auto" : "conf_meet_manual")}</span>
      </>
    );
  }

  const reason =
    meeting.meetError === "google_not_connected"
      ? tx("conf_meet_off")
      : `${tx("conf_meet_err")}${meeting.meetError ? ` · ${meeting.meetError}` : ""}`;

  return (
    <>
      <span className="ac-sub" style={{ color: "var(--gold)" }}>
        {reason}
      </span>{" "}
      <button
        className="btn btn-ghost conf-relink"
        type="button"
        style={{ padding: "4px 10px", fontSize: 12 }}
        disabled={isRelinking}
        onClick={onRelink}
      >
        {tx(isRelinking ? "conf_meet_making" : "conf_meet_retry")}
      </button>
    </>
  );
}
