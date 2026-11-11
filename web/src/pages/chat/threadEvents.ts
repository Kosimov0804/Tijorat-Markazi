import { asArray, asString } from "../../shell/chat";
import { parseMessage, parsePerson } from "./types";
import type { Message } from "./types";

type SocketEvent = Readonly<Record<string, unknown>>;

function withReader(message: Message, event: SocketEvent): Message {
  const reader = parsePerson(event.by);
  if (!reader || message.readBy.some(person => person.id === reader.id)) return message;
  return { ...message, readBy: [...message.readBy, reader] };
}

/**
 * What a room's thread looks like after one socket event for that room:
 * a new message, an edit, a reaction, a delete or a read receipt.
 */
export function applyThreadEvent(thread: readonly Message[], event: SocketEvent): readonly Message[] {
  const message = parseMessage(event.msg);
  switch (event.op) {
    case "new":
      return message ? [...thread, message] : thread;
    case "delete":
      return message ? thread.filter(item => item.id !== message.id) : thread;
    case "edit":
    case "react":
      return message ? thread.map(item => (item.id === message.id ? message : item)) : thread;
    case "read": {
      const ids = new Set(asArray(event.ids).map(asString));
      return thread.map(item => (ids.has(item.id) ? withReader(item, event) : item));
    }
    default:
      return thread;
  }
}
