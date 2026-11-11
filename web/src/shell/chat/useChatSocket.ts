import { useEffect, useMemo, useRef } from "react";
import { isRecord } from "./narrow";

export interface ChatSocketOptions {
  /** Nothing is opened until this is true. */
  isEnabled: boolean;
  /** Sent as the first frame; the server accepts nothing else before it. */
  credentials: Readonly<Record<string, unknown>>;
  /** Every parsed frame, the answer to the sign-in included. */
  onMessage: (message: Record<string, unknown>) => void;
}

export interface ChatSocket {
  /** False when the frame could not go out, so the caller can fall back to HTTP. */
  send: (payload: object) => boolean;
  /** True once the server has accepted the credentials. */
  isReady: () => boolean;
}

const BASE_RETRY_MS = 500;
const MAX_RETRY_STEP = 6;
const SOCKET_OPEN = 1;

function socketUrl(): string {
  const scheme = window.location.protocol === "https:" ? "wss://" : "ws://";
  return `${scheme}${window.location.host}/ws`;
}

function parseFrame(data: unknown): Record<string, unknown> | null {
  if (typeof data !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(data);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * The /ws connection behind one hook: it signs in on open, reconnects with a
 * capped exponential back-off, and closes for good when the component goes.
 */
export function useChatSocket({ isEnabled, credentials, onMessage }: ChatSocketOptions): ChatSocket {
  const socketRef = useRef<WebSocket | null>(null);
  const isReadyRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    if (!isEnabled) return;
    let isClosed = false;
    let retryStep = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      let socket: WebSocket;
      try {
        socket = new WebSocket(socketUrl());
      } catch {
        return; /* No socket at all: the caller's polling carries on. */
      }
      socketRef.current = socket;
      socket.addEventListener("open", () => {
        retryStep = 0;
        socket.send(JSON.stringify({ op: "auth", ...credentials }));
      });
      socket.addEventListener("message", event => {
        const message = parseFrame(event.data);
        if (!message || isClosed) return;
        if (message.op === "auth") isReadyRef.current = Boolean(message.ok);
        onMessageRef.current(message);
      });
      socket.addEventListener("close", () => {
        isReadyRef.current = false;
        if (isClosed) return;
        retryStep = Math.min(retryStep + 1, MAX_RETRY_STEP);
        retryTimer = setTimeout(connect, BASE_RETRY_MS * 2 ** retryStep);
      });
      socket.addEventListener("error", () => socket.close());
    };
    connect();

    return () => {
      isClosed = true;
      isReadyRef.current = false;
      clearTimeout(retryTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [isEnabled, credentials]);

  return useMemo(
    () => ({
      send(payload) {
        const socket = socketRef.current;
        if (!socket || !isReadyRef.current || socket.readyState !== SOCKET_OPEN) return false;
        socket.send(JSON.stringify(payload));
        return true;
      },
      isReady: () => isReadyRef.current,
    }),
    [],
  );
}
