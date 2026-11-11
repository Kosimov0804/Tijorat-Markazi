import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { dialogs } from "../../shell/dialogs";
import { navigate } from "../../shell/navigate";
import { stubSocket } from "../../test/fakeSocket";
import { HOSTILE, renderPage } from "../../test/renderPage";
import { ChatPage } from "./ChatPage";

const ROOM = "assoc:a1";
const ME = { type: "company", id: "c1", name: "Acme" };
const ROOMS = [
  {
    id: ROOM,
    title: "Paxta uyushmasi",
    count: 1,
    last: "",
    lastFrom: "",
    time: 0,
    members: [
      { id: "c1", role: "company", name: "Acme" },
      { id: "a1", role: "assoc", name: "Karim" },
      { id: "rais", role: "rais", name: "Rais", observer: true },
    ],
  },
];
const message = (id: string, text: string, extra: object = {}) => ({
  id,
  from: "assoc",
  fromId: "a1",
  fromName: "Karim",
  text,
  time: Date.now(),
  ...extra,
});

type Body = Record<string, unknown>;
type Handler = (body: Body) => unknown;

/** Answers /api/group by operation; a missing answer is a refused request. */
function stubGroupApi(handlers: Record<string, Handler | undefined>): Body[] {
  const calls: Body[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: { body?: string }) => {
      if (url !== "/api/group") return { ok: true, status: 200, json: async () => ({}) };
      const body = JSON.parse(init?.body ?? "{}") as Body;
      calls.push(body);
      const handler = handlers[String(body.op)];
      if (!handler) return { ok: false, status: 500, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => handler(body) };
    }),
  );
  return calls;
}

const listed: Handler = () => ({ ok: true, me: ME, groups: ROOMS });
const threadOf = (...messages: object[]): Handler => () => ({ ok: true, me: ME, messages });

function signInAsCompany(): void {
  sessionStorage.setItem("kg_co", JSON.stringify({ login: "acme", password: "pw" }));
}

async function flush(): Promise<void> {
  await act(async () => {
    for (let turn = 0; turn < 8; turn += 1) await Promise.resolve();
  });
}

async function openChat(handlers: Record<string, Handler | undefined>) {
  signInAsCompany();
  const latest = stubSocket();
  const calls = stubGroupApi(handlers);
  const view = renderPage(<ChatPage />);
  await flush();
  return { ...view, calls, latest };
}

async function connect(latest: ReturnType<typeof stubSocket>) {
  const socket = latest();
  await act(async () => {
    socket.open();
    socket.receive({ op: "auth", ok: true });
  });
  return socket;
}

function type(container: HTMLElement, text: string): void {
  const input = container.querySelector<HTMLInputElement>("#tgInput")!;
  input.value = text;
  fireEvent.submit(container.querySelector("#tgForm")!);
}

describe("ChatPage session", () => {
  it("hands a visitor with no cabinet session over to the sign-in page", () => {
    const replace = vi.spyOn(navigate, "replace").mockImplementation(() => undefined);
    stubGroupApi({});

    const { container } = renderPage(<ChatPage />);

    expect(replace).toHaveBeenCalledWith("assistant.html");
    expect(container.querySelector(".tg")).toBeNull();
  });

  it("sends an analyst back to their own panel", () => {
    const replace = vi.spyOn(navigate, "replace").mockImplementation(() => undefined);
    sessionStorage.setItem("kg_an", JSON.stringify({ login: "ana", password: "pw" }));
    stubGroupApi({});

    renderPage(<ChatPage />);

    expect(replace).toHaveBeenCalledWith("tahlil.html");
  });

  it("sends the cabinet's own credentials and links back to that cabinet", async () => {
    const { container, calls } = await openChat({ list: listed, thread: threadOf() });

    expect(calls[0]).toMatchObject({ op: "list", login: "acme", password: "pw", lang: "uz" });
    expect(container.querySelector(".tg-back")?.getAttribute("href")).toBe("company.html");
    expect(document.body.classList.contains("chat-page")).toBe(true);
  });

  it("uses the admin pass for an admin session", async () => {
    sessionStorage.setItem("kg_admin", "1");
    stubSocket();
    const calls = stubGroupApi({ list: listed, thread: threadOf() });

    const { container } = renderPage(<ChatPage />);
    await flush();

    expect(calls[0]).toMatchObject({ op: "list", pass: "admin" });
    expect(container.querySelector(".tg-back")?.getAttribute("href")).toBe("admin.html");
  });
});

describe("ChatPage rooms", () => {
  it("says so when the room list cannot be loaded", async () => {
    const { container } = await openChat({});

    expect(container.querySelector("#tgList .tg-note.bad")?.textContent).toBe("Yuborilmadi — qayta urinib köring.");
  });

  it("says so when the account is in no room", async () => {
    const { container } = await openChat({ list: () => ({ ok: true, me: ME, groups: [] }) });

    expect(container.querySelector("#tgBody .tg-note")?.textContent).toBe("Siz heç qaysi guruhda emassiz.");
  });

  it("opens the first room and lists its members, marking observers", async () => {
    const { container, calls } = await openChat({ list: listed, thread: threadOf(message("m1", "Salom")) });

    expect(calls.some(call => call.op === "thread" && call.group === ROOM)).toBe(true);
    expect(container.querySelector(".tg-head-sub")?.textContent).toBe("Acme, Karim, Rais (kuzatuvçi)");
    expect(screen.getByText("Salom")).toBeTruthy();
    expect(container.querySelector(".tg")?.className).toBe("tg open");
  });

  it("filters the room list by title", async () => {
    const { container } = await openChat({ list: listed, thread: threadOf() });

    fireEvent.change(container.querySelector("#tgSearch")!, { target: { value: "zzz" } });

    expect(container.querySelectorAll(".tg-room")).toHaveLength(0);
    expect(container.querySelector("#tgList .tg-note")?.textContent).toBe("—");
  });

  it("opens a direct chat with a member under an id both sides derive", async () => {
    const { container, calls } = await openChat({ list: listed, thread: threadOf() });

    fireEvent.click(container.querySelector("#tgHeadBtn")!);
    const people = [...container.querySelectorAll<HTMLButtonElement>(".tg-person")];
    expect(people[0].disabled).toBe(true);
    fireEvent.click(people[1]);
    await flush();

    expect(calls.at(-1)).toMatchObject({ op: "thread", group: "dm:a1|c1" });
    expect(container.querySelector(".tg-room.on b")?.textContent).toBe("Karim");
  });
});

describe("ChatPage messages", () => {
  it("signs the socket in, then sends a message through it and shows the echo", async () => {
    const { container, latest } = await openChat({ list: listed, thread: threadOf(message("m1", "Salom")) });
    const socket = await connect(latest);

    expect(socket.sent[0]).toEqual({ op: "auth", login: "acme", password: "pw" });
    expect(socket.sent[1]).toEqual({ op: "read", group: ROOM, id: "m1" });

    type(container, "  Buyurtma tayyor  ");
    expect(socket.sent.at(-1)).toEqual({ op: "send", group: ROOM, text: "Buyurtma tayyor", attach: null });
    expect(container.querySelector<HTMLInputElement>("#tgInput")?.value).toBe("");

    const echo = { id: "m2", from: "company", fromId: "c1", fromName: "Acme", text: "Buyurtma tayyor", time: Date.now() };
    await act(async () => socket.receive({ op: "new", group: ROOM, msg: echo }));

    const mine = container.querySelector(".tg-msg.mine");
    expect(mine?.querySelector(".tg-text")?.textContent).toBe("Buyurtma tayyor");
    expect(mine?.querySelector(".tg-ticks")?.textContent).toBe("✓");
    expect(socket.sent.at(-1)).toEqual({ op: "read", group: ROOM, id: "m2" });
  });

  it("applies edits, read receipts and deletes that arrive on the socket", async () => {
    const own = { id: "m1", from: "company", fromId: "c1", fromName: "Acme", text: "Bir", time: Date.now() };
    const { container, latest } = await openChat({ list: listed, thread: threadOf(own) });
    const socket = await connect(latest);

    await act(async () => socket.receive({ op: "edit", group: ROOM, msg: { ...own, text: "Ikki", edited: true } }));
    expect(container.querySelector(".tg-text")?.textContent).toBe("Ikki");
    expect(container.querySelector(".tg-edited")?.textContent).toBe("tahrirlangan");

    await act(async () => socket.receive({ op: "read", group: ROOM, ids: ["m1"], by: { id: "a1", name: "Karim" } }));
    expect(container.querySelector(".tg-ticks")?.textContent).toBe("✓✓");
    expect(container.querySelector(".tg-ticks")?.getAttribute("title")).toBe("Öqidi: Karim");

    await act(async () => socket.receive({ op: "delete", group: ROOM, msg: { id: "m1" } }));
    expect(container.querySelector(".tg-msg")).toBeNull();
  });

  it("ignores a message for a room that is not open", async () => {
    const { container, latest, calls } = await openChat({ list: listed, thread: threadOf() });
    const socket = await connect(latest);
    const listCalls = calls.filter(call => call.op === "list").length;

    await act(async () => socket.receive({ op: "new", group: "chairmen", msg: message("m9", "Boshqa xona") }));
    await flush();

    expect(screen.queryByText("Boshqa xona")).toBeNull();
    expect(container.querySelector("#tgBody .tg-note")?.textContent).toBe("Hali xabar yöq. Birinçi bölib yozing.");
    expect(calls.filter(call => call.op === "list").length).toBe(listCalls + 1);
  });

  it("shows who is typing", async () => {
    const { container, latest } = await openChat({ list: listed, thread: threadOf() });
    const socket = await connect(latest);

    await act(async () => socket.receive({ op: "typing", group: ROOM, who: HOSTILE }));

    expect(container.querySelector(".tg-typing span")?.textContent).toBe(`${HOSTILE} yozmoqda…`);
    expect(container.querySelector(".tg-typing img")).toBeNull();
  });

  it("falls back to HTTP without a socket, and keeps the text when the request fails", async () => {
    const { container, calls } = await openChat({ list: listed, thread: threadOf() });

    type(container, "Salom");
    await flush();

    expect(calls.at(-1)).toMatchObject({ op: "send", group: ROOM, text: "Salom", login: "acme" });
    expect(container.querySelector("#tgBody .tg-note.bad")?.textContent).toBe("Yuborilmadi — qayta urinib köring.");
    expect(container.querySelector<HTMLInputElement>("#tgInput")?.value).toBe("Salom");
  });

  it("shows the thread the server answers with when sending over HTTP", async () => {
    const { container } = await openChat({
      list: listed,
      thread: threadOf(),
      send: body => ({ ok: true, messages: [message("m1", String(body.text))] }),
    });

    type(container, "Salom");
    await flush();

    expect(container.querySelector(".tg-text")?.textContent).toBe("Salom");
  });

  it("replies to a message, quoting it in what is sent", async () => {
    const { container, latest } = await openChat({ list: listed, thread: threadOf(message("m1", "Savol")) });
    const socket = await connect(latest);

    fireEvent.click(container.querySelector(".tg-more")!);
    const menu = [...container.querySelectorAll<HTMLButtonElement>(".tg-menu > button")];
    expect(menu.map(button => button.textContent)).toEqual(["Javob beriş"]);
    fireEvent.click(menu[0]);
    expect(container.querySelector("#tgReply")?.textContent).toContain("Savol");

    type(container, "Javob");
    expect(socket.sent.at(-1)).toEqual({
      op: "send",
      group: ROOM,
      text: "Javob",
      attach: null,
      reply: { id: "m1", name: "Karim", text: "Savol" },
    });
    expect(container.querySelector<HTMLElement>("#tgReply")?.hidden).toBe(true);
  });

  it("lets a moderator delete after confirming, and reacts from the menu", async () => {
    sessionStorage.setItem("kg_admin", "1");
    const latest = stubSocket();
    const admin = { type: "admin", id: "admin", name: "Administrator" };
    stubGroupApi({
      list: () => ({ ok: true, me: admin, groups: ROOMS }),
      thread: () => ({ ok: true, me: admin, messages: [message("m1", "Savol")] }),
    });
    vi.spyOn(dialogs, "confirm").mockResolvedValue(true);
    const { container } = renderPage(<ChatPage />);
    await flush();
    const socket = await connect(latest);

    fireEvent.click(container.querySelector(".tg-more")!);
    fireEvent.click(container.querySelector(".tg-menu-quick button")!);
    expect(socket.sent.at(-1)).toEqual({ op: "react", id: "m1", emoji: "👍", group: ROOM });

    fireEvent.click(container.querySelector(".tg-more")!);
    fireEvent.click(container.querySelector(".tg-menu .bad")!);
    await flush();
    expect(socket.sent.at(-1)).toEqual({ op: "delete", id: "m1", group: ROOM });
  });
});

describe("ChatPage hostile input", () => {
  it("renders names, text, quotes and reactions from the server as text", async () => {
    const hostile = message("m1", `${HOSTILE} [x](javascript:alert(1))`, {
      fromName: HOSTILE,
      from: 'x" onclick="alert(1)',
      reply: { name: HOSTILE, text: HOSTILE },
      reactions: { [HOSTILE]: [{ id: "a1", name: HOSTILE }] },
      att: { kind: "image", url: "javascript:alert(1)", name: HOSTILE },
    });
    const rooms = [{ ...ROOMS[0], title: HOSTILE, last: HOSTILE, lastFrom: HOSTILE }];
    const { container } = await openChat({ list: () => ({ ok: true, me: ME, groups: rooms }), thread: threadOf(hostile) });

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".tg-msg a")).toBeNull();
    expect(container.querySelector(".tg-msg [onclick]")).toBeNull();
    expect(container.querySelector(".tg-from")?.textContent).toContain(HOSTILE);
    expect(container.querySelector(".tg-text")?.textContent).toBe(`${HOSTILE} [x](javascript:alert(1))`);
    expect(container.querySelector(".tg-room b")?.textContent).toBe(HOSTILE);
    expect(container.querySelector(".tg-react")?.textContent).toBe(`${HOSTILE}1`);
  });

  it("shows a socket error as text and stays quiet about a refused room", async () => {
    const { container, latest } = await openChat({ list: listed, thread: threadOf() });
    const socket = await connect(latest);

    await act(async () => {
      socket.receive({ op: "error", error: "forbidden" });
      socket.receive({ op: "error", error: HOSTILE });
    });

    const notes = [...container.querySelectorAll("#tgBody .tg-note.bad")];
    expect(notes.map(note => note.textContent)).toEqual([HOSTILE]);
    expect(container.querySelector("#tgBody img")).toBeNull();
  });
});
