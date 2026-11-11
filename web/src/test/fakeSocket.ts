import { vi } from "vitest";

type Listener = (event: { data?: string }) => void;

/** Stands in for the browser WebSocket: the test plays the server. */
export class FakeSocket {
  static instances: FakeSocket[] = [];
  readyState = 0;
  /** Every frame the page sent, parsed. */
  sent: Record<string, unknown>[] = [];
  private listeners = new Map<string, Listener[]>();

  constructor(public url: string) {
    FakeSocket.instances.push(this);
  }

  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  send(data: string): void {
    this.sent.push(JSON.parse(data) as Record<string, unknown>);
  }

  close(): void {
    if (this.readyState === 3) return;
    this.readyState = 3;
    this.emit("close", {});
  }

  /** The connection is up: the page answers with its sign-in frame. */
  open(): void {
    this.readyState = 1;
    this.emit("open", {});
  }

  /** A frame from the server. */
  receive(message: object | string): void {
    this.emit("message", { data: typeof message === "string" ? message : JSON.stringify(message) });
  }

  private emit(type: string, event: { data?: string }): void {
    (this.listeners.get(type) ?? []).forEach(listener => listener(event));
  }
}

/** Replaces the global WebSocket; returns a getter for the latest connection. */
export function stubSocket(): () => FakeSocket {
  FakeSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeSocket);
  return () => {
    const socket = FakeSocket.instances.at(-1);
    if (!socket) throw new Error("The page has not opened a socket");
    return socket;
  };
}
