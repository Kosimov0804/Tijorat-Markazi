import { useCallback, useEffect, useRef, useState } from "react";
import type { Localized } from "@legacy/data.js";
import { useI18n } from "../../shell/i18n";
import { ask, chat, fetchSession, fetchSessions, fetchUsage } from "./assistantApi";
import type { AssistantReply, Backend, LimitMeta, ReplyFile, SessionMeta } from "./assistantApi";
import { panelAuth } from "./identity";
import type { PanelHome } from "./identity";
import type { PendingAttachment } from "./readAttachment";
import { mergeFiles, splitFiles } from "./replyFiles";

export type Session =
  | { kind: "panel"; email: string; label: string; home: PanelHome }
  | { kind: "guest"; guestId: string; demoEmail: string };

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  files?: readonly ReplyFile[];
  /** Shown in place of an answer that never came; not part of the conversation. */
  isFailure?: boolean;
}

export interface Conversation {
  id: string;
  messages: readonly ChatMessage[];
}

export interface AssistantChat {
  sessions: readonly SessionMeta[];
  current: Conversation | null;
  limit: LimitMeta | null;
  isBusy: boolean;
  pending: PendingAttachment | null;
  setPending: (attachment: PendingAttachment | null) => void;
  newChat: () => void;
  openSession: (id: string) => void;
  send: (text: string) => void;
  /** Calls off the answer that is on its way. */
  stop: () => void;
}

/* The legacy page has no wording for an answer that failed, so this borrows
   the group chat's (KG_GROUP_T.failed in group-chat.js). */
const FAILED: Localized = [
  "Yuborilmadi — qayta urinib köring.",
  "Не отправлено — попробуйте ещё раз.",
  "Not sent — please try again.",
];

const DEFAULT_FREE_QUESTIONS = 3;

export interface LimitView {
  isShown: boolean;
  isOver: boolean;
  remaining: number;
  max: number;
}

/** Privileged accounts have no allowance at all, so nothing is shown for them. */
export function limitView(limit: LimitMeta | null): LimitView {
  if (!limit || limit.isPrivileged || limit.max === null) return { isShown: false, isOver: false, remaining: 0, max: 0 };
  const remaining = limit.remaining ?? Math.max(0, (limit.max || DEFAULT_FREE_QUESTIONS) - limit.used);
  return { isShown: true, isOver: limit.isLimit || remaining <= 0, remaining, max: limit.max };
}

const freshConversation = (): Conversation => ({ id: `sess_${Date.now()}`, messages: [] });

const toHistory = (messages: readonly ChatMessage[]): object[] =>
  messages.filter(message => !message.isFailure).map(({ role, text, files }) => ({ role, text, files }));

function answerMessage(answer: AssistantReply | null, failedText: string): ChatMessage {
  if (!answer?.reply) return { role: "assistant", text: failedText, isFailure: true };
  const files = mergeFiles(answer.files, splitFiles(answer.reply).files);
  return { role: "assistant", text: answer.reply, files: files.length ? files : undefined };
}

/**
 * One visitor's conversation with the assistant. A cabinet account's chats
 * are kept by the server under its session; a guest's exist only on screen
 * and count against the free allowance.
 */
export function useAssistantChat(session: Session, backend: Backend, company: string): AssistantChat {
  const { lang, pick } = useI18n();
  const [sessions, setSessions] = useState<readonly SessionMeta[]>([]);
  const [current, setCurrent] = useState<Conversation | null>(null);
  const [limit, setLimit] = useState<LimitMeta | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [pending, setPending] = useState<PendingAttachment | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const isAlive = useRef(true);
  const currentRef = useRef<Conversation | null>(null);
  const { hasBackend } = backend;

  const show = useCallback((conversation: Conversation) => {
    currentRef.current = conversation;
    setCurrent(conversation);
  }, []);

  const append = (id: string, message: ChatMessage) => {
    const conversation = currentRef.current;
    /* The visitor may have opened another chat while the answer was on its way. */
    if (conversation?.id === id) show({ id, messages: [...conversation.messages, message] });
  };

  const newChat = useCallback(() => show(freshConversation()), [show]);

  const email = session.kind === "panel" ? session.email : "";
  const usageKey = session.kind === "panel" ? session.email : session.guestId;
  const isGuest = session.kind === "guest";

  const openSession = useCallback(
    async (id: string) => {
      const messages = hasBackend ? await fetchSession(email, id) : [];
      if (isAlive.current) show({ id, messages });
    },
    [email, hasBackend, show],
  );

  const refreshSessions = useCallback(async (): Promise<SessionMeta[]> => {
    const list = hasBackend ? await fetchSessions(email) : [];
    if (isAlive.current) setSessions(list);
    return list;
  }, [email, hasBackend]);

  useEffect(() => {
    isAlive.current = true;
    const refreshLimit = async () => {
      /* Guests are tracked by their per-browser id; accounts by their key. */
      const usage = hasBackend ? await fetchUsage(usageKey, isGuest ? null : panelAuth()) : null;
      if (isAlive.current) setLimit(usage);
    };
    const start = async () => {
      if (isGuest) {
        newChat();
        await refreshLimit();
        return;
      }
      await refreshLimit();
      const list = await refreshSessions();
      if (!isAlive.current) return;
      if (list.length > 0) await openSession(list[0].id);
      else newChat();
    };
    void start();
    return () => {
      isAlive.current = false;
      controllerRef.current?.abort();
    };
  }, [hasBackend, isGuest, usageKey, newChat, openSession, refreshSessions]);

  const request = (conversation: Conversation, text: string, attachment: PendingAttachment | null, signal: AbortSignal) => {
    if (!hasBackend) return Promise.resolve(null);
    if (session.kind === "guest") {
      const history = toHistory(conversation.messages);
      return ask({ message: text, history, lang, attachment, guestId: session.guestId }, signal);
    }
    const question = { email: session.email, id: conversation.id, message: text, lang, attachment, company };
    return chat({ ...question, auth: panelAuth() }, signal);
  };

  const send = async (text: string) => {
    const attachment = pending;
    if ((!text && !attachment) || isBusy || limitView(limit).isOver) return;
    const conversation = currentRef.current ?? freshConversation();
    const shown = `${text}${attachment ? `  📎 ${attachment.name}` : ""}`.trim();
    show({ id: conversation.id, messages: [...conversation.messages, { role: "user", text: shown }] });
    setPending(null);

    const controller = new AbortController();
    controllerRef.current = controller;
    setIsBusy(true);
    let answer: AssistantReply | null = null;
    try {
      answer = await request(conversation, text, attachment, controller.signal);
    } catch {
      /* Stopped by the visitor: their message stays, the answer is dropped. */
      if (isAlive.current) setIsBusy(false);
      return;
    }
    if (!isAlive.current) return;
    setIsBusy(false);
    append(conversation.id, answerMessage(answer, pick(FAILED)));
    if (answer?.limit) setLimit(answer.limit);
    if (!isGuest && !answer?.isLimit) void refreshSessions();
  };

  return {
    sessions,
    current,
    limit,
    isBusy,
    pending,
    setPending,
    newChat,
    openSession: id => void openSession(id),
    send: text => void send(text),
    stop: () => controllerRef.current?.abort(),
  };
}
