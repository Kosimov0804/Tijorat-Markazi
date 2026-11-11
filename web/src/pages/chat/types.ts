import { asArray, asNumber, asString, isRecord, parseAttachment } from "../../shell/chat";
import type { ChatAttachment } from "../../shell/chat";

/** Whatever the open cabinet stored: {login,password} or {pass:"admin"}. Sent on as it is. */
export type Credentials = Readonly<Record<string, unknown>>;

export interface Person {
  id: string;
  name: string;
}

export interface Member extends Person {
  role: string;
  isObserver: boolean;
}

export interface Me extends Person {
  type: string;
}

export interface Group {
  id: string;
  title: string;
  isDm: boolean;
  count: number;
  last: string;
  lastFrom: string;
  time: number;
  members: readonly Member[];
}

export interface Reaction {
  emoji: string;
  people: readonly Person[];
}

export interface Quote {
  name: string;
  text: string;
}

export interface ReplyTarget extends Quote {
  id: string;
}

export interface Message {
  id: string;
  /** The sender's account tier: admin, rais, assoc or company. */
  from: string;
  fromId: string;
  fromName: string;
  text: string;
  time: number;
  attachment: ChatAttachment | null;
  reactions: readonly Reaction[];
  readBy: readonly Person[];
  reply: Quote | null;
  isEdited: boolean;
  isDeleted: boolean;
}

function compact<T>(values: readonly (T | null)[]): T[] {
  return values.filter((value): value is T => value !== null);
}

export function parsePerson(value: unknown): Person | null {
  if (!isRecord(value)) return null;
  return { id: asString(value.id), name: asString(value.name) };
}

const parsePeople = (value: unknown): Person[] => compact(asArray(value).map(parsePerson));

function parseMember(value: unknown): Member | null {
  if (!isRecord(value)) return null;
  return {
    id: asString(value.id),
    name: asString(value.name),
    role: asString(value.role),
    isObserver: Boolean(value.observer),
  };
}

export function parseMe(value: unknown): Me | null {
  if (!isRecord(value)) return null;
  return { id: asString(value.id), name: asString(value.name), type: asString(value.type) };
}

function parseGroup(value: unknown): Group | null {
  if (!isRecord(value) || !asString(value.id)) return null;
  return {
    id: asString(value.id),
    title: asString(value.title),
    isDm: Boolean(value.dm),
    count: asNumber(value.count),
    last: asString(value.last),
    lastFrom: asString(value.lastFrom),
    time: asNumber(value.time),
    members: compact(asArray(value.members).map(parseMember)),
  };
}

export const parseGroups = (value: unknown): Group[] => compact(asArray(value).map(parseGroup));

function parseReactions(value: unknown): Reaction[] {
  if (!isRecord(value)) return [];
  return Object.entries(value).map(([emoji, people]) => ({ emoji, people: parsePeople(people) }));
}

function parseQuote(value: unknown): Quote | null {
  if (!isRecord(value)) return null;
  return { name: asString(value.name), text: asString(value.text) };
}

export function parseMessage(value: unknown): Message | null {
  if (!isRecord(value)) return null;
  return {
    id: asString(value.id),
    from: asString(value.from),
    fromId: asString(value.fromId),
    fromName: asString(value.fromName),
    text: asString(value.text),
    time: asNumber(value.time),
    attachment: parseAttachment(value.att),
    reactions: parseReactions(value.reactions),
    readBy: parsePeople(value.readBy),
    reply: parseQuote(value.reply),
    isEdited: Boolean(value.edited),
    isDeleted: Boolean(value.deleted),
  };
}

export const parseMessages = (value: unknown): Message[] => compact(asArray(value).map(parseMessage));
