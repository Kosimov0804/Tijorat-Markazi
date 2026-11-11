import { useCallback, useEffect, useRef, useState } from "react";
import { asString, useChatSocket } from "../../shell/chat";
import type { OutgoingAttachment } from "../../shell/chat";
import { useI18n } from "../../shell/i18n";
import { callGroupApi } from "./groupApi";
import type { GroupReply } from "./groupApi";
import { useGroupText } from "./text";
import { applyThreadEvent } from "./threadEvents";
import { parseGroups, parseMe, parseMessages } from "./types";
import type { Credentials, Group, Me, Member, Message, ReplyTarget } from "./types";
import { useTimers } from "./useTimers";
import { useNotes, useTypingIndicator } from "./useTransient";
import type { AddNote, Note } from "./useTransient";

export interface GroupChat {
  listStatus: "loading" | "failed" | "ready";
  groups: readonly Group[];
  activeId: string | null;
  me: Me | null;
  thread: readonly Message[];
  isThreadLoaded: boolean;
  typingWho: string | null;
  notes: readonly Note[];
  open: (groupId: string) => void;
  openDm: (other: Member) => void;
  /** Resolves to false when the message did not go out. */
  send: (text: string, attachment: OutgoingAttachment | null, reply: ReplyTarget | null) => Promise<boolean>;
  edit: (id: string, text: string) => void;
  react: (id: string, emoji: string) => void;
  remove: (id: string) => void;
  notifyTyping: () => void;
  addNote: AddNote;
}

const POLL_MS = 8000;
const TYPING_SEND_GAP_MS = 2000;
const LIST_REFRESH_DELAY_MS = 400;

/* A DM room exists on the server only once someone writes in it, so a freshly
   opened one is kept in the list locally until then. */
function mergeGroups(current: readonly Group[], fresh: readonly Group[]): readonly Group[] {
  const unsent = current.filter(group => group.isDm && !group.count && !fresh.some(item => item.id === group.id));
  return [...unsent, ...fresh];
}

/* Both sides derive the same room id from the two account ids, sorted. */
const dmRoomId = (me: Me, other: Member): string => `dm:${[me.id, other.id].sort().join("|")}`;

/**
 * The group chat's state. The server owns membership: this renders whatever
 * /api/group returns for the caller's credentials. The socket carries new
 * messages, edits, deletes, reactions, read receipts and typing; every action
 * falls back to HTTP when the socket is not signed in, and a slow poll keeps
 * the open room fresh in a browser that cannot open one at all.
 */
export function useGroupChat(credentials: Credentials): GroupChat {
  const { lang } = useI18n();
  const text = useGroupText();
  const later = useTimers();
  const [listStatus, setListStatus] = useState<GroupChat["listStatus"]>("loading");
  const [groups, setGroups] = useState<readonly Group[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [thread, setThread] = useState<readonly Message[]>([]);
  const [isThreadLoaded, setIsThreadLoaded] = useState(false);
  const { notes, addNote } = useNotes();
  const { typingWho, showTyping, clearTyping } = useTypingIndicator();
  const [isLive, setIsLive] = useState(false);

  const isAlive = useRef(true);
  const activeRef = useRef<string | null>(null);
  const latest = useRef({ lang, groups, thread, failedText: text("failed") });
  const lastTypedAt = useRef(0);
  useEffect(() => {
    latest.current = { lang, groups, thread, failedText: text("failed") };
  });
  useEffect(() => {
    isAlive.current = true;
    return () => {
      isAlive.current = false;
    };
  }, []);

  const api = useCallback(
    async (body: object): Promise<GroupReply | null> => {
      const reply = await callGroupApi(credentials, latest.current.lang, body);
      return isAlive.current ? reply : null;
    },
    [credentials],
  );

  const refreshList = useCallback(async () => {
    const reply = await api({ op: "list" });
    if (!reply) return;
    setMe(parseMe(reply.me));
    setGroups(current => mergeGroups(current, parseGroups(reply.groups)));
  }, [api]);

  const socketRef = useRef<{ send: (payload: object) => boolean }>({ send: () => false });

  /** Tells the room everything up to this message has been seen. */
  const markRead = useCallback(
    (group: string | null, lastId: string | undefined) => {
      if (!group || !lastId) return;
      const payload = { op: "read", group, id: lastId };
      if (!socketRef.current.send(payload)) void api(payload);
    },
    [api],
  );

  const handleSocket = (event: Record<string, unknown>) => {
    if (event.op === "auth") {
      if (event.ok) markRead(activeRef.current, latest.current.thread.at(-1)?.id);
      return;
    }
    if (event.op === "error") {
      if (event.error !== "forbidden") addNote(asString(event.error), true);
      return;
    }
    if (event.group !== activeRef.current) {
      if (event.op === "new") void refreshList();
      return;
    }
    if (event.op === "typing") {
      showTyping(asString(event.who));
      return;
    }
    const next = applyThreadEvent(latest.current.thread, event);
    latest.current = { ...latest.current, thread: next };
    setThread(next);
    if (event.op === "new") markRead(activeRef.current, next.at(-1)?.id);
    if (event.op === "new" || event.op === "delete") void refreshList();
  };

  const socket = useChatSocket({ isEnabled: isLive, credentials, onMessage: handleSocket });
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const loadThread = useCallback(
    async (group: string): Promise<boolean> => {
      const reply = await api({ op: "thread", group });
      /* The reader may have moved to another room while this was in flight. */
      if (!reply || activeRef.current !== group) return false;
      const messages = parseMessages(reply.messages);
      setMe(current => parseMe(reply.me) ?? current);
      setThread(messages);
      setIsThreadLoaded(true);
      markRead(group, messages.at(-1)?.id);
      return true;
    },
    [api, markRead],
  );

  const open = useCallback(
    (groupId: string) => {
      activeRef.current = groupId;
      setActiveId(groupId);
      latest.current = { ...latest.current, thread: [] };
      setThread([]);
      setIsThreadLoaded(false);
      clearTyping();
      void loadThread(groupId);
    },
    [loadThread, clearTyping],
  );

  const openDm = (other: Member) => {
    if (!me) return;
    const id = dmRoomId(me, other);
    const room: Group = {
      id,
      title: other.name,
      isDm: true,
      count: 0,
      last: "",
      lastFrom: "",
      time: 0,
      members: [
        { id: me.id, role: me.type, name: me.name, isObserver: false },
        { id: other.id, role: "", name: other.name, isObserver: false },
      ],
    };
    setGroups(current => (current.some(group => group.id === id) ? current : [room, ...current]));
    open(id);
  };

  const send: GroupChat["send"] = async (messageText, attachment, reply) => {
    const group = activeRef.current;
    if (!group) return false;
    const wasEmpty = !latest.current.groups.some(item => item.id === group && item.count);
    const payload = { op: "send", group, text: messageText, attach: attachment, ...(reply ? { reply } : {}) };
    /* Over the socket the echo comes back as a "new" event. */
    if (socket.send(payload)) {
      if (wasEmpty) later(() => void refreshList(), LIST_REFRESH_DELAY_MS);
      return true;
    }
    const answer = await api(payload);
    if (!answer) {
      addNote(latest.current.failedText, true);
      return false;
    }
    if (activeRef.current === group) setThread(parseMessages(answer.messages));
    if (wasEmpty) void refreshList();
    return true;
  };

  /* Edits, reactions and deletes: the socket echoes the change to the room;
     over HTTP the thread is read again instead. */
  const act = (payload: { op: string; id: string; text?: string; emoji?: string }) => {
    const group = activeRef.current;
    if (!group) return;
    const body = { ...payload, group };
    if (socket.send(body)) return;
    void api(body).then(() => loadThread(group));
  };

  const notifyTyping = () => {
    const now = Date.now();
    if (!activeRef.current || now - lastTypedAt.current <= TYPING_SEND_GAP_MS) return;
    lastTypedAt.current = now;
    socket.send({ op: "typing", group: activeRef.current });
  };

  useEffect(() => {
    let isCancelled = false;
    void callGroupApi(credentials, latest.current.lang, { op: "list" }).then(reply => {
      if (isCancelled) return;
      if (!reply) {
        setListStatus("failed");
        return;
      }
      const rooms = parseGroups(reply.groups);
      setMe(parseMe(reply.me));
      setGroups(rooms);
      setListStatus("ready");
      if (rooms.length === 0) return;
      open(rooms[0].id);
      setIsLive(true);
    });
    return () => {
      isCancelled = true;
    };
  }, [credentials, open]);

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      const group = activeRef.current;
      if (!group || document.hidden || socket.isReady()) return;
      void api({ op: "thread", group }).then(reply => {
        if (reply && activeRef.current === group) setThread(parseMessages(reply.messages));
      });
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [isLive, api, socket]);

  return {
    listStatus,
    groups,
    activeId,
    me,
    thread,
    isThreadLoaded,
    typingWho,
    notes,
    open,
    openDm,
    send,
    edit: (id, messageText) => act({ op: "edit", id, text: messageText }),
    react: (id, emoji) => act({ op: "react", id, emoji }),
    remove: id => act({ op: "delete", id }),
    notifyTyping,
    addNote,
  };
}
