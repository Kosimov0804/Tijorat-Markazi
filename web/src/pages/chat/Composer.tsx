import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { EmojiPicker, clock, insertAtCaret, promptForLink } from "../../shell/chat";
import type { OutgoingAttachment } from "../../shell/chat";
import { AttachIcon, EmojiIcon, LinkIcon, MicIcon, SendIcon } from "./icons";
import { useGroupText } from "./text";
import type { Message, ReplyTarget } from "./types";
import { useUploadQueue } from "./useUploadQueue";
import { useVoiceNote } from "./useVoiceNote";
import type { AddNote } from "./useTransient";

const REPLY_PREVIEW_LENGTH = 80;

type ComposerProps = {
  replyTo: ReplyTarget | null;
  /** The message being rewritten; the next submit updates it instead of sending. */
  editing: Message | null;
  onSend: (text: string, attachment: OutgoingAttachment | null) => Promise<boolean>;
  onEdit: (id: string, text: string) => void;
  onCancelEdit: () => void;
  onClearReply: () => void;
  onTyping: () => void;
  addNote: AddNote;
};

function ReplyBar({ replyTo, onClear }: { replyTo: ReplyTarget | null; onClear: () => void }) {
  return (
    <div className="tg-replybar" id="tgReply" hidden={!replyTo}>
      {replyTo && (
        <>
          <span>
            <b>{replyTo.name}</b>
            {replyTo.text.slice(0, REPLY_PREVIEW_LENGTH)}
          </span>
          <button type="button" id="tgReplyX" onClick={onClear}>
            ✕
          </button>
        </>
      )}
    </div>
  );
}

/* Rendered as siblings inside .tg-main: the reply bar, the form, the upload
   queue and the emoji panel, which the legacy sheet positions against it. */
export function Composer(props: ComposerProps) {
  const { replyTo, editing, onSend, onEdit, onCancelEdit, onClearReply, onTyping, addNote } = props;
  const text = useGroupText();
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLButtonElement>(null);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const queue = useUploadQueue(attachment => onSend("", attachment));
  const voice = useVoiceNote(attachment => void onSend("", attachment), addNote);

  /* Editing reuses the composer: the text goes back into the box. */
  const editingId = editing?.id;
  const editingText = editing?.text ?? "";
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.value = editingId ? editingText : "";
    if (editingId) input.focus();
  }, [editingId, editingText]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const input = inputRef.current;
    const value = input?.value.trim();
    if (!input || !value) return;
    if (editing) {
      onCancelEdit();
      onEdit(editing.id, value);
      return;
    }
    input.value = "";
    void onSend(value, null).then(isSent => {
      if (!isSent) input.value = value;
    });
  };

  const handleLink = () => {
    if (!inputRef.current) return;
    /* Select text in the box first and it becomes the label of the link. */
    void promptForLink(inputRef.current, { url: text("link_url"), label: text("link_txt"), bad: text("link_bad") });
  };

  return (
    <>
      <ReplyBar replyTo={replyTo} onClear={onClearReply} />
      <form className={editing ? "tg-compose editing" : "tg-compose"} id="tgForm" onSubmit={handleSubmit}>
        <input
          type="file"
          id="tgFile"
          hidden
          multiple
          ref={fileRef}
          onChange={event => {
            queue.upload(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
        <button className="tg-ico" id="tgAttach" type="button" title="Fayl" aria-label="Fayl" onClick={() => fileRef.current?.click()}>
          <AttachIcon />
        </button>
        <button
          className="tg-ico"
          id="tgEmoji"
          type="button"
          title="Emoji"
          aria-label="Emoji"
          ref={emojiRef}
          onClick={() => setIsEmojiOpen(isOpen => !isOpen)}
        >
          <EmojiIcon />
        </button>
        <button className="tg-ico" id="tgLink" type="button" title={text("link")} aria-label={text("link")} onClick={handleLink}>
          <LinkIcon />
        </button>
        <input
          id="tgInput"
          autoComplete="off"
          placeholder={text("ph")}
          ref={inputRef}
          onInput={onTyping}
          onKeyDown={event => {
            if (event.key !== "Escape") return;
            if (editing) onCancelEdit();
            else onClearReply();
          }}
        />
        <span className="tg-rec" id="tgRec" hidden={!voice.isRecording}>
          <i />
          <b id="tgRecT">{clock(voice.seconds)}</b>
          <button type="button" id="tgRecX" onClick={voice.cancel}>
            {text("cancel")}
          </button>
        </span>
        <button className={voice.buttonClass} id="tgMic" type="button" title="Ovoz" aria-label="Ovoz" onClick={voice.toggle}>
          <MicIcon />
        </button>
        <button className="tg-send" type="submit" aria-label={text("send")}>
          <SendIcon />
        </button>
      </form>
      <div className="tg-queue" id="tgQueue" hidden={queue.rows.length === 0}>
        {queue.rows.map(row => (
          <div key={row.id} className={row.isBad ? "tg-qrow bad" : "tg-qrow"}>
            {row.label}
          </div>
        ))}
      </div>
      <EmojiPicker
        isOpen={isEmojiOpen}
        toggleRef={emojiRef}
        onPick={emoji => inputRef.current && insertAtCaret(inputRef.current, emoji)}
        onClose={() => setIsEmojiOpen(false)}
      />
    </>
  );
}
