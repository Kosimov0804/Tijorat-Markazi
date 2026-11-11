import { Fragment, useEffect, useRef } from "react";
import { humanSize } from "../../shell/chat";
import { useI18n } from "../../shell/i18n";
import type { ReplyFile } from "./assistantApi";
import { mergeFiles, splitFiles } from "./replyFiles";
import type { ChatMessage } from "./useAssistantChat";

const FILE_ICONS: Record<string, string | undefined> = { pdf: "📕", docx: "📘", xlsx: "📗", pptx: "📙" };

/* Answers are plain text: only their line breaks are kept. */
function Lines({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, index) => (
        <Fragment key={index}>
          {index > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  );
}

/* A generated file gets a real download card: icon tile, name, size. */
function FileCard({ file }: { file: ReplyFile }) {
  const name = file.name || (file.url.split("/").pop() ?? "");
  const extension = (file.url.split(".").pop() ?? "").toLowerCase();
  return (
    <a className="msg-file" href={file.url} download={name}>
      <span className="msg-file-ic">{FILE_ICONS[extension] ?? "📄"}</span>
      <span className="msg-file-tx">
        <b>{name}</b>
        <em>{file.size ? humanSize(file.size) : extension.toUpperCase()}</em>
      </span>
    </a>
  );
}

function Answer({ message }: { message: ChatMessage }) {
  /* Files are lifted out of the sentence, so reopening an old conversation
     brings its documents back as cards too. */
  const split = splitFiles(message.text);
  const files = mergeFiles(message.files ?? [], split.files);
  return (
    <div className="msg bot">
      <Lines text={split.text || message.text} />
      {files.length > 0 && (
        <div className="msg-files">
          {files.map(file => (
            <FileCard key={file.url} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}

type ChatMessagesProps = {
  messages: readonly ChatMessage[];
  /** An answer is on its way. */
  isBusy: boolean;
};

export function ChatMessages({ messages, isBusy }: ChatMessagesProps) {
  const { t } = useI18n();
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [messages, isBusy]);

  return (
    <div className="chat-body" id="chatBody" ref={bodyRef}>
      <div className="msg bot">
        <Lines text={t("chat_greeting")} />
      </div>
      {messages.map((message, index) =>
        message.role === "user" ? (
          <div className="msg user" key={index}>
            <Lines text={message.text} />
          </div>
        ) : (
          <Answer key={index} message={message} />
        ),
      )}
      {isBusy && (
        <div className="msg bot typing">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}
