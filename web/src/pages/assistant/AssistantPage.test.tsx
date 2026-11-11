import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { dialogs } from "../../shell/dialogs";
import { navigate } from "../../shell/navigate";
import { HOSTILE, renderPage, setSearch, stubApi } from "../../test/renderPage";
import { AssistantPage } from "./AssistantPage";
import { mergeFiles, splitFiles } from "./replyFiles";
import { limitView } from "./useAssistantChat";

const PING = "/api/ping";
const LOGIN = "/api/auth/login";
const USAGE = "/api/ai-usage";
const FREE = { privileged: false, max: 3, used: 1, remaining: 2 };
const FAILED = "Yuborilmadi — qayta urinib köring.";

async function flush(): Promise<void> {
  await act(async () => {
    for (let turn = 0; turn < 10; turn += 1) await Promise.resolve();
  });
}

function sentTo(url: string): Record<string, unknown> {
  const call = vi.mocked(fetch).mock.calls.find(([requested]) => requested === url);
  if (!call) throw new Error(`Nothing was sent to ${url}`);
  const init = call[1] as { body?: string } | undefined;
  return JSON.parse(init?.body ?? "{}") as Record<string, unknown>;
}

async function renderAssistant(routes: Record<string, unknown>) {
  stubApi({ [PING]: { ai: true }, ...routes });
  const view = renderPage(<AssistantPage />);
  await flush();
  return view;
}

function fill(container: HTMLElement, selector: string, value: string): void {
  fireEvent.change(container.querySelector(selector)!, { target: { value } });
}

async function signIn(container: HTMLElement, login: string, password: string): Promise<void> {
  fill(container, "#loginInput", login);
  fill(container, "#passInput", password);
  fireEvent.submit(container.querySelector("#emailForm")!);
  await flush();
}

async function enterDemo(routes: Record<string, unknown>) {
  const view = await renderAssistant({ [USAGE]: FREE, ...routes });
  fill(view.container, "#demoEmailInput", " Ali@Gmail.com ");
  fireEvent.click(view.container.querySelector("#demoBtn")!);
  await flush();
  return view;
}

async function askQuestion(container: HTMLElement, text: string): Promise<void> {
  container.querySelector<HTMLInputElement>("#chatText")!.value = text;
  fireEvent.submit(container.querySelector("#chatForm")!);
  await flush();
}

afterEach(() => setSearch(""));

describe("AssistantPage sign-in", () => {
  it("asks for a login once the server has answered, and shows no chat", async () => {
    const { container } = await renderAssistant({});

    expect(container.querySelector<HTMLElement>("#asstLogin")?.hidden).toBe(false);
    expect(container.querySelector<HTMLElement>("#asstApp")?.hidden).toBe(true);
    expect(screen.getByRole("heading", { name: "Tizimga kiriş" })).toBeTruthy();
  });

  it("stores the session keys the server names and opens that cabinet", async () => {
    const goTo = vi.spyOn(navigate, "to").mockImplementation(() => undefined);
    const keys = { kg_co: '{"login":"acme","password":"pw"}', "evil-key": "x" };
    const { container } = await renderAssistant({ [LOGIN]: { ok: true, target: "company.html", keys } });

    await signIn(container, "  acme ", "pw");

    expect(sentTo(LOGIN)).toEqual({ login: "acme", password: "pw" });
    expect(sessionStorage.getItem("kg_co")).toBe(keys.kg_co);
    expect(sessionStorage.getItem("evil-key")).toBeNull();
    expect(goTo).toHaveBeenCalledWith("company.html");
  });

  it("says the login is wrong when the server refuses, and lets the visitor retry", async () => {
    const goTo = vi.spyOn(navigate, "to").mockImplementation(() => undefined);
    const { container } = await renderAssistant({ [LOGIN]: 401 });

    await signIn(container, "acme", "wrong");

    expect(container.querySelector("#emailErr")?.textContent).toBe("Login yoki parol notöğri");
    expect(container.querySelector<HTMLButtonElement>('#emailForm button[type="submit"]')?.disabled).toBe(false);
    expect(goTo).not.toHaveBeenCalled();
  });

  it("never follows a target that is not a page of this site", async () => {
    const goTo = vi.spyOn(navigate, "to").mockImplementation(() => undefined);
    const { container } = await renderAssistant({ [LOGIN]: { ok: true, target: "https://evil.example/x.html" } });

    await signIn(container, "acme", "pw");

    expect(goTo).not.toHaveBeenCalled();
    expect(container.querySelector("#emailErr")?.textContent).toBe("Login yoki parol notöğri");
  });

  it("asks for both fields without calling the server", async () => {
    const { container } = await renderAssistant({});

    fireEvent.submit(container.querySelector("#emailForm")!);
    await flush();

    expect(container.querySelector("#emailErr")?.textContent).toBe("Login yoki parol notöğri");
    expect(vi.mocked(fetch).mock.calls.some(([url]) => url === LOGIN)).toBe(false);
  });

  it("goes back to the home page from the close button", async () => {
    const goTo = vi.spyOn(navigate, "to").mockImplementation(() => undefined);
    const { container } = await renderAssistant({});

    fireEvent.click(container.querySelector("#loginClose")!);

    expect(goTo).toHaveBeenCalledWith("index.html");
  });

  it("refuses demo access without a gmail address", async () => {
    const { container } = await renderAssistant({});

    fill(container, "#demoEmailInput", "ali@mail.ru");
    fireEvent.click(container.querySelector("#demoBtn")!);

    expect(container.querySelector("#demoErr")?.textContent).toBe("Email notöğri");
    expect(container.querySelector<HTMLElement>("#asstApp")?.hidden).toBe(true);
  });
});

describe("AssistantPage demo chat", () => {
  it("enters as a guest tracked by the gmail address, with the free questions counted", async () => {
    const { container } = await enterDemo({});

    expect(localStorage.getItem("kg_guest_id")).toBe("ali@gmail.com");
    expect(localStorage.getItem("kg_demo_email")).toBe("ali@gmail.com");
    expect(sentTo(USAGE)).toEqual({ email: "ali@gmail.com", auth: null });
    expect(container.querySelector("#uEmail")?.textContent).toBe("ali@gmail.com");
    expect(container.querySelector("#aiStatus")?.textContent).toBe("AI faol · Claude");
    expect(container.querySelector<HTMLElement>("#histPanel")?.hidden).toBe(true);
    expect(container.querySelector("#limitNote")?.textContent).toBe("Bepul savollar: 2/3 qoldi");
    expect(container.querySelectorAll("#exList button")).toHaveLength(6);
  });

  it("sends a question with the conversation so far and shows the answer", async () => {
    const answer = { reply: "Birinchi qator\nIkkinchi qator", max: 3, used: 2, remaining: 1 };
    const { container } = await enterDemo({ "/api/ask": answer });

    await askQuestion(container, "Salom");

    expect(sentTo("/api/ask")).toEqual({ message: "Salom", history: [], lang: "uz", attachment: null, guestId: "ali@gmail.com" });
    const bubbles = [...container.querySelectorAll("#chatBody .msg")];
    expect(bubbles[1].className).toBe("msg user");
    expect(bubbles[1].textContent).toBe("Salom");
    expect(bubbles[2].querySelectorAll("br")).toHaveLength(1);
    expect(bubbles[2].textContent).toBe("Birinchi qatorIkkinchi qator");
    expect(container.querySelector("#limitNote")?.textContent).toBe("Bepul savollar: 1/3 qoldi");
    expect(container.querySelector("#chatStatus")?.textContent).toBe("onlayn");
  });

  it("says the question was not sent when the request fails", async () => {
    const { container } = await enterDemo({ "/api/ask": 500 });

    await askQuestion(container, "Salom");

    expect(container.querySelector("#chatBody .msg.bot:last-child")?.textContent).toBe(FAILED);
    expect(container.querySelector("#chatBody .typing")).toBeNull();
    expect(container.querySelector<HTMLElement>("#stopBtn")?.hidden).toBe(true);
  });

  it("renders a hostile answer as text", async () => {
    const { container } = await enterDemo({ "/api/ask": { reply: `${HOSTILE} [x](javascript:alert(1))` } });

    await askQuestion(container, HOSTILE);

    expect(container.querySelector("#chatBody img")).toBeNull();
    expect(container.querySelector("#chatBody a")).toBeNull();
    expect(container.querySelector("#chatBody .msg.user")?.textContent).toBe(HOSTILE);
    expect(container.querySelector("#chatBody .msg.bot:last-child")?.textContent).toContain(HOSTILE);
  });

  it("turns a generated document into a download card and drops an unsafe one", async () => {
    const reply = "Tayyor: [Reja](/uploads/reja.docx)";
    const files = [
      { url: "/uploads/reja.docx", name: HOSTILE, size: 2048 },
      { url: "javascript:alert(1)", name: "x" },
    ];
    const { container } = await enterDemo({ "/api/ask": { reply, files } });

    await askQuestion(container, "Reja yoz");

    const cards = [...container.querySelectorAll<HTMLAnchorElement>(".msg-file")];
    expect(cards).toHaveLength(1);
    expect(cards[0].getAttribute("href")).toBe("/uploads/reja.docx");
    expect(cards[0].querySelector("b")?.textContent).toBe(HOSTILE);
    expect(cards[0].querySelector("em")?.textContent).toBe("2 KB");
    expect(container.querySelector("#chatBody img")).toBeNull();
  });

  it("closes the composer once the free questions are spent", async () => {
    const { container } = await enterDemo({ [USAGE]: { privileged: false, max: 3, used: 3, remaining: 0 } });

    expect(container.querySelector<HTMLInputElement>("#chatText")?.disabled).toBe(true);
    expect(container.querySelector("#chatText")?.getAttribute("placeholder")).toBe("Bepul 3 ta savol limiti tugadi.");
    expect(container.querySelector("#limitNote")?.className).toBe("limit-note is-over");
    expect(container.querySelector<HTMLButtonElement>("#micBtn")?.disabled).toBe(true);
  });

  it("refuses a file type it cannot read", async () => {
    const alert = vi.spyOn(dialogs, "alert").mockResolvedValue(undefined);
    const { container } = await enterDemo({});

    fireEvent.change(container.querySelector("#fileInput")!, { target: { files: [new File(["x"], "app.exe")] } });
    await flush();

    expect(alert).toHaveBeenCalledWith("Bu fayl turi qöllab-quvvatlanmaydi");
    expect(container.querySelector<HTMLElement>("#attachChip")?.hidden).toBe(true);
  });

  it("returns to the sign-in card on request", async () => {
    const { container } = await enterDemo({});

    fireEvent.click(container.querySelector("#switchEmail")!);

    expect(container.querySelector<HTMLElement>("#asstLogin")?.hidden).toBe(false);
    expect(container.querySelector<HTMLElement>("#asstApp")?.hidden).toBe(true);
  });
});

describe("AssistantPage from a cabinet", () => {
  const SESSIONS = "/api/sessions?email=company-acme%40konglomerat";
  const SESSION = "/api/session?email=company-acme%40konglomerat&id=s%201";

  function signInAsCompany(): void {
    sessionStorage.setItem("kg_co", JSON.stringify({ login: "acme", password: "pw" }));
  }

  it("skips the sign-in, reopens the latest chat and links back to the cabinet", async () => {
    signInAsCompany();
    const sessions = [{ id: "s 1", title: HOSTILE, updated: 1700000000000 }];
    const messages = [{ role: "user", text: "Eski savol" }, { role: "assistant", text: "Eski javob /uploads/a.pdf" }];
    const { container } = await renderAssistant({ [USAGE]: { privileged: true, max: null }, [SESSIONS]: sessions, [SESSION]: { messages } });

    expect(container.querySelector<HTMLElement>("#asstLogin")?.hidden).toBe(true);
    expect(container.querySelector("#uEmail")?.textContent).toBe("acme");
    expect(container.querySelector<HTMLElement>("#switchEmail")?.hidden).toBe(true);
    expect(container.querySelector<HTMLElement>("#limitNote")?.hidden).toBe(true);
    expect(container.querySelector(".session-item.active b")?.textContent).toBe(HOSTILE);
    expect(container.querySelector(".session-item img")).toBeNull();
    expect(screen.getByText("Eski savol")).toBeTruthy();
    expect(container.querySelector(".msg-file")?.getAttribute("href")).toBe("/uploads/a.pdf");
    expect(screen.getByRole("link", { name: "← Panelga qaytiş" }).getAttribute("href")).toBe("company.html");
  });

  it("files a question under the account, tagged with the company and its credentials", async () => {
    signInAsCompany();
    setSearch("?co=Acme%20LLC");
    const { container } = await renderAssistant({ [USAGE]: { privileged: true, max: null }, "/api/chat": { reply: "Javob" } });

    await askQuestion(container, "Savol");

    expect(sentTo("/api/chat")).toMatchObject({
      email: "company-acme@konglomerat",
      message: "Savol",
      lang: "uz",
      attachment: null,
      company: "Acme LLC",
      auth: { role: "company", login: "acme", password: "pw" },
    });
    expect(String(sentTo("/api/chat").id)).toMatch(/^sess_\d+$/);
    expect(container.querySelector("#uEmail")?.textContent).toBe("Acme LLC");
    expect(screen.getByText("Javob")).toBeTruthy();
  });
});

describe("assistant reply helpers", () => {
  it("lifts linked files out of the sentence", () => {
    const result = splitFiles("Hujjat tayyor:\n[Biznes reja](/uploads/plan-1.pdf)\n\n\n\nYana: /uploads/t.xlsx");

    expect(result.text).toBe("Hujjat tayyor\n\nYana");
    expect(result.files).toEqual([
      { url: "/uploads/plan-1.pdf", name: "Biznes reja" },
      { url: "/uploads/t.xlsx", name: "t.xlsx" },
    ]);
  });

  it("leaves a link that is not one of our uploads in the text", () => {
    expect(splitFiles("[x](https://evil.example/a.pdf)").files).toEqual([]);
  });

  it("lists each document once, preferring what the server reported", () => {
    const merged = mergeFiles([{ url: "/uploads/a.pdf", name: "A", size: 10 }], [{ url: "/uploads/a.pdf", name: "a.pdf" }]);

    expect(merged).toEqual([{ url: "/uploads/a.pdf", name: "A", size: 10 }]);
  });

  it("works out the free questions left", () => {
    expect(limitView(null).isShown).toBe(false);
    expect(limitView({ isPrivileged: true, max: 3, remaining: 0, used: 3, isLimit: false }).isShown).toBe(false);
    expect(limitView({ isPrivileged: false, max: 3, remaining: null, used: 1, isLimit: false })).toMatchObject({ remaining: 2, isOver: false });
    expect(limitView({ isPrivileged: false, max: 3, remaining: 2, used: 1, isLimit: true }).isOver).toBe(true);
  });
});
