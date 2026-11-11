import { asArray, asNumber, asString, isRecord, safeMediaUrl } from "../../shell/chat";
import type { PanelAuth } from "./identity";
import type { PendingAttachment } from "./readAttachment";

export interface ReplyFile {
  /** Already checked: http, https or a path on this site. */
  url: string;
  name: string;
  size?: number;
}

/** The free-question allowance, as /api/ai-usage and each answer report it. */
export interface LimitMeta {
  isPrivileged: boolean;
  max: number | null;
  remaining: number | null;
  used: number;
  isLimit: boolean;
}

export interface AssistantReply {
  reply: string;
  files: ReplyFile[];
  /** Present only when the answer carried an allowance. */
  limit: LimitMeta | null;
  /** The question was refused because the allowance is spent. */
  isLimit: boolean;
}

export interface SessionMeta {
  id: string;
  title: string;
  updated: number;
}

export interface StoredMessage {
  role: "user" | "assistant";
  text: string;
}

export interface Backend {
  hasBackend: boolean;
  isAiOn: boolean;
}

const isAbort = (error: unknown): boolean => error instanceof Error && error.name === "AbortError";

/* Null for a refusal, a network failure or an unreadable body. Only a stop
   requested by the visitor is passed on, so the caller can tell it apart. */
async function request(url: string, body?: object, signal?: AbortSignal): Promise<unknown> {
  try {
    const options = body
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal }
      : undefined;
    const response = await fetch(url, options);
    return response.ok ? ((await response.json()) as unknown) : null;
  } catch (error) {
    if (isAbort(error)) throw error;
    return null;
  }
}

function parseFile(value: unknown): ReplyFile | null {
  if (!isRecord(value)) return null;
  const url = safeMediaUrl(value.url);
  if (!url) return null;
  return { url, name: asString(value.name), size: asNumber(value.size) || undefined };
}

function parseLimit(data: Record<string, unknown>): LimitMeta {
  return {
    isPrivileged: Boolean(data.privileged),
    max: data.max == null ? null : asNumber(data.max),
    remaining: data.remaining == null ? null : asNumber(data.remaining),
    used: asNumber(data.used),
    isLimit: Boolean(data.limit),
  };
}

function parseReply(data: unknown): AssistantReply | null {
  if (!isRecord(data)) return null;
  return {
    reply: asString(data.reply),
    files: asArray(data.files).flatMap(item => parseFile(item) ?? []),
    limit: data.max == null ? null : parseLimit(data),
    isLimit: Boolean(data.limit),
  };
}

function parseSession(value: unknown): SessionMeta | null {
  if (!isRecord(value) || !asString(value.id)) return null;
  return { id: asString(value.id), title: asString(value.title), updated: asNumber(value.updated) };
}

function parseStoredMessage(value: unknown): StoredMessage | null {
  if (!isRecord(value)) return null;
  return { role: value.role === "user" ? "user" : "assistant", text: asString(value.text) };
}

export async function ping(): Promise<Backend> {
  const data = await request("/api/ping");
  return { hasBackend: data !== null, isAiOn: isRecord(data) && Boolean(data.ai) };
}

export async function fetchSessions(email: string): Promise<SessionMeta[]> {
  const data = await request(`/api/sessions?email=${encodeURIComponent(email)}`);
  return asArray(data).flatMap(item => parseSession(item) ?? []);
}

export async function fetchSession(email: string, id: string): Promise<StoredMessage[]> {
  const data = await request(`/api/session?email=${encodeURIComponent(email)}&id=${encodeURIComponent(id)}`);
  return isRecord(data) ? asArray(data.messages).flatMap(item => parseStoredMessage(item) ?? []) : [];
}

export interface GuestQuestion {
  message: string;
  history: readonly object[];
  lang: string;
  attachment: PendingAttachment | null;
  guestId: string;
}

/** A guest's question: nothing is stored, the conversation so far travels with it. */
export async function ask(question: GuestQuestion, signal: AbortSignal): Promise<AssistantReply | null> {
  return parseReply(await request("/api/ask", question, signal));
}

export interface AccountQuestion {
  email: string;
  id: string;
  message: string;
  lang: string;
  attachment: PendingAttachment | null;
  company: string;
  auth: PanelAuth | null;
}

/** A cabinet account's question, filed under its session on the server. */
export async function chat(question: AccountQuestion, signal: AbortSignal): Promise<AssistantReply | null> {
  return parseReply(await request("/api/chat", question, signal));
}

export async function fetchUsage(email: string, auth: PanelAuth | null): Promise<LimitMeta | null> {
  const data = await request("/api/ai-usage", { email, auth });
  return isRecord(data) ? parseLimit(data) : null;
}

export async function transcribe(audio: string, mime: string): Promise<string> {
  const data = await request("/api/transcribe", { audio, mime });
  return isRecord(data) ? asString(data.text) : "";
}
