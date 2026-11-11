import { AttachmentView, LinkedText, timeOfDay } from "../../shell/chat";
import { MessageMenu } from "./MessageMenu";
import type { MessageAction } from "./MessageMenu";
import { useGroupText } from "./text";
import type { Me, Message, Person } from "./types";

const QUOTE_PREVIEW_LENGTH = 90;

export type MessageHandlers = {
  onToggleMenu: (id: string) => void;
  onReact: (id: string, emoji: string) => void;
  onAction: (message: Message, action: MessageAction) => void;
  onOpenImage: (url: string) => void;
};

type MessageBubbleProps = MessageHandlers & {
  message: Message;
  me: Me | null;
  /** Sent from this account, so it sits on the right and shows read ticks. */
  isMine: boolean;
  /** Follows a message from the same sender, so the name is not repeated. */
  isContinued: boolean;
  isMenuOpen: boolean;
};

const names = (people: readonly Person[]): string => people.map(person => person.name).join(", ");

/* The tier becomes part of a class name, so only letters get through. */
const roleClass = (tier: string): string => `tg-role tg-${tier.replace(/[^a-z]/gi, "")}`;

function Reactions({ message, me, onReact }: Pick<MessageBubbleProps, "message" | "me" | "onReact">) {
  if (message.reactions.length === 0) return null;
  return (
    <span className="tg-reacts">
      {message.reactions.map(({ emoji, people }) => {
        const isByMe = me !== null && people.some(person => person.id === me.id);
        return (
          <button
            key={emoji}
            type="button"
            className={isByMe ? "tg-react on" : "tg-react"}
            title={names(people)}
            onClick={event => {
              event.stopPropagation();
              onReact(message.id, emoji);
            }}
          >
            {emoji}
            <b>{people.length}</b>
          </button>
        );
      })}
    </span>
  );
}

/* Ticks only on your own messages: one when sent, two once someone has read it. */
function ReadTicks({ message, me }: { message: Message; me: Me }) {
  const text = useGroupText();
  const readers = message.readBy.filter(person => person.id !== me.id);
  const hasReaders = readers.length > 0;
  return (
    <span className={hasReaders ? "tg-ticks seen" : "tg-ticks"} title={hasReaders ? `${text("read_by")}: ${names(readers)}` : ""}>
      {hasReaders ? "✓✓" : "✓"}
    </span>
  );
}

export function MessageBubble(props: MessageBubbleProps) {
  const { message, me, isMine, isContinued, isMenuOpen, onToggleMenu, onReact, onAction, onOpenImage } = props;
  const text = useGroupText();
  const isOwn = me !== null && message.fromId === me.id;
  const isModerator = me !== null && (me.type === "admin" || me.type === "rais");
  const className = [
    "tg-msg",
    isMine && "mine",
    isContinued && "cont",
    message.attachment?.kind === "image" && "has-img",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} data-id={message.id}>
      {!isMine && !isContinued && (
        <span className="tg-from">
          {message.fromName}
          <i className={roleClass(message.from)}>{message.from}</i>
        </span>
      )}
      {message.reply && (
        <span className="tg-quote">
          <b>{message.reply.name}</b>
          {message.reply.text.slice(0, QUOTE_PREVIEW_LENGTH)}
        </span>
      )}
      {message.attachment && <AttachmentView attachment={message.attachment} onOpenImage={onOpenImage} />}
      {message.text && (
        <span className="tg-text">
          <LinkedText text={message.text} />
        </span>
      )}
      <span className="tg-meta">
        {message.isEdited && <i className="tg-edited">{text("edited")}</i>}
        <span className="tg-time">{timeOfDay(message.time)}</span>
        {isMine && me && <ReadTicks message={message} me={me} />}
      </span>
      <Reactions message={message} me={me} onReact={onReact} />
      <button
        className="tg-more"
        type="button"
        aria-label="…"
        onClick={event => {
          event.stopPropagation();
          onToggleMenu(message.id);
        }}
      >
        ⋯
      </button>
      {isMenuOpen && (
        <MessageMenu
          canEdit={isOwn}
          canDelete={isOwn || isModerator}
          onReact={emoji => onReact(message.id, emoji)}
          onAction={action => onAction(message, action)}
        />
      )}
    </div>
  );
}
