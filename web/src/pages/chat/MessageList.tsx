import { Fragment, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { dayKey, dayLabel } from "./format";
import { MessageBubble } from "./MessageBubble";
import type { MessageHandlers } from "./MessageBubble";
import { useGroupText } from "./text";
import type { GroupText } from "./text";
import type { Me, Message } from "./types";
import type { Note } from "./useTransient";

type MessageListProps = MessageHandlers & {
  /** Deleted messages already left out. */
  messages: readonly Message[];
  me: Me | null;
  /** What to say when there is nothing to list, or null while loading. */
  emptyText: string | null;
  menuFor: string | null;
  typingWho: string | null;
  notes: readonly Note[];
  onCloseMenu: () => void;
};

type Row = { message: Message; isMine: boolean; isContinued: boolean; dayLabel: string | null };

function buildRows(messages: readonly Message[], me: Me | null, text: GroupText): Row[] {
  let lastDay = "";
  let lastSpeaker = "";
  return messages.map(message => {
    const day = dayKey(message.time);
    const isNewDay = day !== lastDay;
    if (isNewDay) lastSpeaker = "";
    const speaker = `${message.from}|${message.fromName}`;
    const row: Row = {
      message,
      isMine: me !== null && message.from === me.type && message.fromName === me.name,
      isContinued: lastSpeaker === speaker,
      dayLabel: isNewDay ? dayLabel(message.time, text) : null,
    };
    lastDay = day;
    lastSpeaker = speaker;
    return row;
  });
}

function NoteLine({ note }: { note: Note }) {
  const text = useGroupText();
  return (
    <p className={note.isBad ? "tg-note bad" : "tg-note"}>
      {note.text}
      {note.href && (
        <>
          <br />
          <a href={note.href} className="tg-note-link">
            {text("mic_open")}
          </a>
        </>
      )}
    </p>
  );
}

export function MessageList(props: MessageListProps) {
  const { messages, me, emptyText, menuFor, typingWho, notes, onCloseMenu, ...handlers } = props;
  const text = useGroupText();
  const bodyRef = useRef<HTMLDivElement>(null);
  const rows = buildRows(messages, me, text);
  const lastId = messages.at(-1)?.id;

  /* Whatever arrives last is what the reader should be looking at. */
  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [lastId, messages.length, notes.length, typingWho]);

  let content: ReactNode = null;
  if (rows.length > 0) {
    content = rows.map(row => (
      <Fragment key={row.message.id}>
        {row.dayLabel !== null && (
          <div className="tg-day">
            <span>{row.dayLabel}</span>
          </div>
        )}
        <MessageBubble
          message={row.message}
          me={me}
          isMine={row.isMine}
          isContinued={row.isContinued}
          isMenuOpen={menuFor === row.message.id}
          {...handlers}
        />
      </Fragment>
    ));
  } else if (emptyText !== null) {
    content = <p className="tg-note">{emptyText}</p>;
  }

  return (
    <div className="tg-body" id="tgBody" ref={bodyRef} onClick={onCloseMenu}>
      {content}
      {typingWho !== null && (
        <div className="tg-typing">
          <i />
          <i />
          <i />
          <span>
            {typingWho} {text("typing")}
          </span>
        </div>
      )}
      {notes.map(note => (
        <NoteLine key={note.id} note={note} />
      ))}
    </div>
  );
}
