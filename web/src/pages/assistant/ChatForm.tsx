import { useRef } from "react";
import type { FormEvent, RefObject } from "react";
import { useI18n } from "../../shell/i18n";

type ChatFormProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  /** The free questions are spent. */
  isDisabled: boolean;
  /** An answer is on its way, so Send becomes Stop. */
  isBusy: boolean;
  isRecording: boolean;
  onSubmit: (text: string) => void;
  onStop: () => void;
  onFile: (file: File) => void;
  onMic: () => void;
};

const ACCEPTED_FILES = "image/*,.txt,.md,.csv,.json,.log,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
const LINE_ICON = {
  viewBox: "0 0 24 24",
  width: 20,
  height: 20,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function ChatForm(props: ChatFormProps) {
  const { inputRef, isDisabled, isBusy, isRecording, onSubmit, onStop, onFile, onMic } = props;
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const input = inputRef.current;
    const value = input?.value.trim();
    /* While an answer is on its way the typed text stays in the box. */
    if (!input || !value || isBusy) return;
    input.value = "";
    onSubmit(value);
  };

  return (
    <form className="chat-input" id="chatForm" onSubmit={handleSubmit}>
      <button
        type="button"
        className="ci-btn"
        id="attachBtn"
        title={t("attach_title")}
        aria-label="Attach"
        disabled={isDisabled}
        onClick={() => fileRef.current?.click()}
      >
        <svg {...LINE_ICON}>
          <path d="M21 12.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l9-9a3.3 3.3 0 0 1 4.7 4.7l-9 9a1.6 1.6 0 0 1-2.3-2.3l8.3-8.3" />
        </svg>
      </button>
      <input
        type="file"
        id="fileInput"
        accept={ACCEPTED_FILES}
        hidden
        ref={fileRef}
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
      <input
        type="text"
        id="chatText"
        ref={inputRef}
        placeholder={isDisabled ? t("limit_over") : t("chat_ph")}
        autoComplete="off"
        disabled={isDisabled}
      />
      <button
        type="button"
        className={isRecording ? "ci-btn rec" : "ci-btn"}
        id="micBtn"
        title={t("mic_title")}
        aria-label="Voice"
        disabled={isDisabled}
        onClick={onMic}
      >
        <svg {...LINE_ICON}>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
        </svg>
      </button>
      <button type="submit" className="ci-send" aria-label="Send" hidden={isBusy} disabled={isDisabled}>
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2z" />
        </svg>
      </button>
      {/* Swaps in while an answer is on its way: a document can take a minute. */}
      <button
        type="button"
        className="ci-send ci-stop"
        id="stopBtn"
        hidden={!isBusy}
        title={t("stop_title")}
        aria-label="Stop"
        onClick={onStop}
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
        </svg>
      </button>
    </form>
  );
}
