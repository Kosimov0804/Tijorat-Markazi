import { useEffect, useRef } from "react";
import { dialogs } from "../../shell/dialogs";
import { useI18n } from "../../shell/i18n";
import { ChatForm } from "./ChatForm";
import { ChatMessages } from "./ChatMessages";
import { readAttachment } from "./readAttachment";
import { limitView } from "./useAssistantChat";
import type { AssistantChat } from "./useAssistantChat";
import { useDictation } from "./useDictation";

const SUGGESTIONS = ["sug1", "sug2", "sug3", "sug4", "sug5", "sug6"] as const;
const ALERT_COLOR = "#e25a4a";

type ChatPanelProps = {
  chat: AssistantChat;
  hasBackend: boolean;
};

export function ChatPanel({ chat, hasBackend }: ChatPanelProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const messages = chat.current?.messages ?? [];
  const hasStarted = messages.length > 0;
  const limit = limitView(chat.limit);

  const dictation = useDictation(hasBackend, text => {
    const input = inputRef.current;
    if (!input) return;
    input.value = `${input.value ? `${input.value} ` : ""}${text}`;
    input.focus();
  });

  /* A new chat is ready to be typed into. */
  const conversationId = chat.current?.id;
  useEffect(() => {
    if (conversationId && !hasStarted) inputRef.current?.focus();
  }, [conversationId, hasStarted]);

  const handleFile = async (file: File) => {
    const attachment = await readAttachment(file).catch(() => null);
    if (attachment) chat.setPending(attachment);
    else void dialogs.alert(t("attach_bad"));
  };

  const statusText = dictation.status ? t(dictation.status.key) : chat.isBusy ? t("chat_typing") : t("chat_online");
  const limitText = limit.isOver
    ? t("limit_over")
    : t("limit_left").replace("{n}", String(limit.remaining)).replace("{max}", String(limit.max));

  return (
    <div className="chat">
      <div className="chat-top">
        <span className="ai-avatar">AI</span>
        <div>
          <b>TIJORAT MARKAZI</b>
          <em id="chatStatus" style={dictation.status?.isAlert ? { color: ALERT_COLOR } : undefined}>
            {statusText}
          </em>
        </div>
        <button className="chat-clear" id="chatClear" type="button" onClick={chat.newChat}>
          {t("asst_new")}
        </button>
      </div>
      <ChatMessages messages={messages} isBusy={chat.isBusy} />
      {/* The example prompts are a starting point: once the conversation is
          under way the bar stays only while the free-question count shows. */}
      <div className={hasStarted ? "ex-bar is-chatting" : "ex-bar"} hidden={hasStarted && !limit.isShown}>
        <span className="ex-bar-t">{t("asst_examples")}</span>
        <div className="ex-chips" id="exList">
          {SUGGESTIONS.map(key => (
            <button key={key} type="button" onClick={() => chat.send(t(key))}>
              {t(key)}
            </button>
          ))}
        </div>
        <span className={limit.isOver ? "limit-note is-over" : "limit-note"} id="limitNote" hidden={!limit.isShown}>
          {limit.isShown && limitText}
        </span>
      </div>
      <div className="chat-attach" id="attachChip" hidden={!chat.pending}>
        {chat.pending && (
          <div className="attach-chip">
            <span>
              {chat.pending.kind === "image" ? "🖼" : "📄"} {chat.pending.name}
            </span>
            <button type="button" id="attachRemove" onClick={() => chat.setPending(null)}>
              ✕
            </button>
          </div>
        )}
      </div>
      <ChatForm
        inputRef={inputRef}
        isDisabled={limit.isOver}
        isBusy={chat.isBusy}
        isRecording={dictation.isRecording}
        onSubmit={chat.send}
        onStop={chat.stop}
        onFile={file => void handleFile(file)}
        onMic={dictation.toggle}
      />
    </div>
  );
}
