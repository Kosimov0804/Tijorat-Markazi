import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { asArray, asNumber, asString, isRecord } from "../../../shell/chat";
import { adminPost } from "../api";
import { classToken, Intro, useLoader } from "../parts";
import { useText } from "../useText";

const CHATS = "/api/admin/chats";
const PREVIEW_LENGTH = 70;

interface ChatSummary {
  companyId: string;
  name: string;
  last: string;
  isLastFromAdmin: boolean;
  count: number;
}

interface ChatMessage {
  from: string;
  text: string;
}

interface OpenThread {
  companyId: string;
  name: string;
  messages: readonly ChatMessage[];
}

function parseSummary(value: unknown): ChatSummary {
  const item = isRecord(value) ? value : {};
  return {
    companyId: asString(item.companyId),
    name: asString(item.name),
    last: asString(item.last),
    isLastFromAdmin: item.lastFrom === "admin",
    count: asNumber(item.count),
  };
}

function parseMessages(answer: unknown): ChatMessage[] {
  return asArray(isRecord(answer) ? answer.messages : null).map(value => {
    const item = isRecord(value) ? value : {};
    return { from: asString(item.from), text: asString(item.text) };
  });
}

async function loadChats(): Promise<ChatSummary[]> {
  const answer = await adminPost(CHATS);
  return asArray(isRecord(answer) ? answer.chats : null).map(parseSummary);
}

/** Companies' questions about their projects, answered from here. */
export function ProjectChat() {
  const [thread, setThread] = useState<OpenThread | null>(null);

  const openThread = async (chat: ChatSummary) => {
    try {
      const answer = await adminPost(CHATS, { op: "thread", companyId: chat.companyId });
      setThread({ companyId: chat.companyId, name: chat.name, messages: parseMessages(answer) });
    } catch {
      /* The list stays open; pressing the thread again retries. */
    }
  };

  if (thread) return <Thread thread={thread} onChange={setThread} onBack={() => setThread(null)} />;
  return <ChatList onOpen={chat => void openThread(chat)} />;
}

function ChatList({ onOpen }: { onOpen: (chat: ChatSummary) => void }) {
  const { tx } = useText();
  const { data: chats } = useLoader(loadChats, []);
  /* The old panel drew nothing at all until the list had arrived. */
  if (!chats) return null;

  return (
    <div className="admin-panel">
      <h2>{tx("nav_chat")}</h2>
      <Intro>{tx("ch_intro")}</Intro>
      {chats.length === 0 ? (
        <p className="ac-label">{tx("ch_empty")}</p>
      ) : (
        <div className="chat-threads">
          {chats.map(chat => (
            <button className="chat-thread" type="button" key={chat.companyId} onClick={() => onOpen(chat)}>
              <b>{chat.name}</b>
              <span>
                {chat.isLastFromAdmin ? "↩ " : ""}
                {chat.last.slice(0, PREVIEW_LENGTH)}
              </span>
              <em>{chat.count}</em>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type ThreadProps = {
  thread: OpenThread;
  onChange: (thread: OpenThread) => void;
  onBack: () => void;
};

function Thread({ thread, onChange, onBack }: ThreadProps) {
  const { tx } = useText();
  const boxRef = useRef<HTMLDivElement>(null);
  const { messages } = thread;

  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const text = String(new FormData(form).get("text") ?? "").trim();
    if (!text) return;
    try {
      const answer = await adminPost(CHATS, { op: "send", companyId: thread.companyId, text });
      onChange({ ...thread, messages: parseMessages(answer) });
      form.reset();
    } catch {
      /* The reply stays in the box so it can be sent again. */
    }
  };

  return (
    <>
      <button className="btn btn-ghost" id="chBack" type="button" style={{ marginBottom: 14 }} onClick={onBack}>
        {tx("ch_back")}
      </button>
      <div className="admin-panel">
        <h2>💬 {thread.name}</h2>
        <div className="pchat-box" id="chBox" ref={boxRef}>
          {messages.length === 0 && <p className="ac-label">{tx("ch_empty")}</p>}
          {messages.map((message, index) => (
            <div className={`pchat-msg ${classToken(message.from)}`} key={index}>
              <span>{message.text}</span>
            </div>
          ))}
        </div>
        <form
          className="admin-form"
          id="chForm"
          style={{ marginTop: 12, gridTemplateColumns: "1fr auto" }}
          onSubmit={event => void handleSubmit(event)}
        >
          <input id="ch-text" name="text" placeholder={tx("ch_ph")} required autoComplete="off" />
          <button className="btn btn-primary" type="submit">
            {tx("ch_send")}
          </button>
        </form>
      </div>
    </>
  );
}
