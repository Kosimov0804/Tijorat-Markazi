import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HOSTILE, renderPage } from "../../test/renderPage";
import { dialogs } from "../dialogs";
import { navigate } from "../navigate";
import { BIZID_TEXT } from "./cabinetText";
import { bodiesSentTo, refused, stubCabinetApi } from "./testApi";
import {
  AreaChart,
  BizIdPanel,
  CabinetLogin,
  CabinetShell,
  classToken,
  credentialQuery,
  formatDate,
  formatDateTime,
  mailHref,
  monthLabel,
  monthlySeries,
  NewsList,
  parseNews,
  phoneHref,
  readCabinetSession,
  useCabinetLogin,
  webHref,
  writeCabinetSession,
} from "./index";

const WHO = { login: "alfa", password: "p&ss word" };
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "<path d='M1 1'/>" },
  { id: "inbox", label: "Inbox", icon: "<path d='M2 2'/>", badge: 4 },
  { id: "chat", label: "Chat", icon: "<path d='M3 3'/>", href: "chat.html" },
];

function renderShell(onSelect = vi.fn(), onLogout = vi.fn()) {
  return renderPage(
    <CabinetShell
      brandSub="Paxta uyushmasi"
      nav={NAV}
      activeId="dashboard"
      onSelect={onSelect}
      title="Dashboard title"
      backLabel="Back"
      logoutLabel="Logout"
      onLogout={onLogout}
    >
      <p>view body</p>
    </CabinetShell>,
  );
}

describe("cabinet session", () => {
  it("round-trips the credentials and treats a corrupt slot as signed out", () => {
    writeCabinetSession("kg_as", WHO);
    expect(readCabinetSession("kg_as")).toEqual(WHO);

    sessionStorage.setItem("kg_as", "{not json");
    expect(readCabinetSession("kg_as")).toBeNull();

    sessionStorage.setItem("kg_as", JSON.stringify({ password: "x" }));
    expect(readCabinetSession("kg_as")).toBeNull();
  });

  it("encodes the credentials for a download link", () => {
    expect(credentialQuery(WHO)).toBe("login=alfa&password=p%26ss%20word");
  });
});

describe("cabinet formatting", () => {
  it("writes dates in the reader's language and passes non-dates through", () => {
    const day = new Date(2026, 2, 5, 9, 7).getTime();

    expect(formatDateTime(day, "uz")).toBe("5 mart 2026, 09:07");
    expect(formatDateTime(day, "en")).toBe("5 March 2026, 09:07");
    expect(formatDate(day, "ru")).toBe("5 марта 2026");
    expect(formatDateTime("soon", "uz")).toBe("soon");
    expect(formatDate("soon", "uz")).toBe("");
  });

  it("only makes links out of safe addresses", () => {
    expect(webHref("https://a.uz/x")).toBe("https://a.uz/x");
    expect(webHref("javascript:alert(1)")).toBeNull();
    expect(mailHref("a@b.uz")).toBe("mailto:a@b.uz");
    expect(mailHref("a@b.uz?subject=x")).toBeNull();
    expect(phoneHref("+998 (90) 123-45-67")).toBe("tel:+998901234567");
    expect(phoneHref("none")).toBeNull();
    expect(classToken('new" onclick="x')).toBe("newonclickx");
  });
});

describe("monthlySeries", () => {
  const now = new Date(2026, 5, 15).getTime();

  it("accumulates records month by month and carries undated ones", () => {
    const records = [
      { created: new Date(2026, 5, 2).getTime() },
      { created: new Date(2026, 3, 20).toISOString() },
      { created: new Date(2020, 0, 1).getTime() },
      { created: null },
      "not a record",
    ];

    const series = monthlySeries(records, { months: 3, now });

    expect(series.buckets.map(bucket => [bucket.m, bucket.added, bucket.total])).toEqual([
      [3, 1, 4],
      [4, 0, 4],
      [5, 1, 5],
    ]);
    expect(series.undated).toBe(2);
    expect(series.total).toBe(5);
  });

  it("covers twelve months by default and names them", () => {
    expect(monthlySeries([], { now }).buckets).toHaveLength(12);
    expect(monthLabel(0, "uz")).toBe("yan");
    expect(monthLabel(11, "xx")).toBe("Dec");
  });
});

describe("AreaChart", () => {
  it("draws a flat line with the empty note when nothing was recorded", () => {
    const { container } = renderPage(
      <AreaChart points={[{ label: "yan", total: 0 }, { label: "fev", total: 0 }]} emptyText="Nothing yet" ariaLabel="Growth" />,
    );

    expect(screen.getByRole("img", { name: "Growth" })).toBeTruthy();
    expect(screen.getByText("Nothing yet")).toBeTruthy();
    expect(container.querySelectorAll("circle")).toHaveLength(2);
    expect(new Set([...container.querySelectorAll("circle")].map(dot => dot.getAttribute("cy"))).size).toBe(1);
  });

  it("renders nothing without points and labels as text", () => {
    const empty = renderPage(<AreaChart points={[]} />);
    expect(empty.container.querySelector("svg")).toBeNull();

    const { container } = renderPage(<AreaChart points={[{ label: HOSTILE, total: 3 }]} />);
    expect(screen.getByText(HOSTILE)).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });
});

describe("CabinetShell", () => {
  it("shows the navigation, marks the active view and reports a selection", () => {
    const onSelect = vi.fn();
    renderShell(onSelect);

    expect(screen.getByRole("heading", { level: 1, name: "Dashboard title" })).toBeTruthy();
    expect(screen.getByText("Paxta uyushmasi")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Dashboard" }).className).toBe("active");
    expect(screen.getByRole("button", { name: /Inbox/ }).textContent).toBe("Inbox4");

    fireEvent.click(screen.getByRole("button", { name: /Inbox/ }));

    expect(onSelect).toHaveBeenCalledWith("inbox");
  });

  it("opens a page of its own for an item with an address, and signs out", () => {
    const goTo = vi.spyOn(navigate, "to").mockImplementation(() => undefined);
    const onSelect = vi.fn();
    const onLogout = vi.fn();
    renderShell(onSelect, onLogout);

    fireEvent.click(screen.getByRole("button", { name: "Chat" }));
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(goTo).toHaveBeenCalledWith("chat.html");
    expect(onSelect).not.toHaveBeenCalled();
    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("switches the language and the theme from the topbar", () => {
    const { container } = renderShell();

    fireEvent.click(container.querySelector("#langBtn")!);
    fireEvent.click(container.querySelector("#themeBtn")!);

    expect(container.querySelector("#langBtn")?.textContent).toBe("RU");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("stays shut on a wide screen and works as a drawer on a narrow one", () => {
    const { container, unmount } = renderShell();
    const shell = (): Element => document.querySelector(".admin-shell")!;
    fireEvent.click(container.querySelector(".cab-burger")!);
    expect(shell().className).toBe("admin-shell");
    unmount();

    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const narrow = renderShell();
    const burger = narrow.container.querySelector(".cab-burger")!;
    fireEvent.click(burger);

    expect(shell().className).toBe("admin-shell side-open");
    expect(burger.getAttribute("aria-expanded")).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });

    expect(shell().className).toBe("admin-shell");
    expect(document.body.style.overflow).toBe("");

    fireEvent.click(burger);
    fireEvent.click(screen.getByRole("button", { name: /Inbox/ }));
    expect(shell().className).toBe("admin-shell");
    vi.unstubAllGlobals();
  });
});

function LoginHarness() {
  const { state, submit, signOut } = useCabinetLogin<{ name: string }>({
    storageKey: "kg_test",
    ownPage: "own.html",
    signIn: async pair => (pair.password === "right" ? { name: `Hello ${pair.login}` } : null),
  });
  if (state.status === "checking") return <p>checking</p>;
  if (state.status === "signedOut") {
    return <CabinetLogin idPrefix="tt" title="Sign in" lead="lead" buttonLabel="Go" errorText="Wrong pair" onSubmit={submit} />;
  }
  return (
    <button type="button" onClick={signOut}>
      {state.account.name}
    </button>
  );
}

function fillLogin(container: HTMLElement, login: string, password: string): void {
  container.querySelector<HTMLInputElement>("#ttLoginInp")!.value = login;
  container.querySelector<HTMLInputElement>("#ttPassInp")!.value = password;
  fireEvent.submit(container.querySelector("#ttForm")!);
}

describe("useCabinetLogin with CabinetLogin", () => {
  it("signs in, stores the session, and signs out again", async () => {
    stubCabinetApi({});
    const { container } = renderPage(<LoginHarness />);

    fillLogin(container, " alfa ", "right");
    fireEvent.click(await screen.findByRole("button", { name: "Hello alfa" }));

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeTruthy();
    expect(sessionStorage.getItem("kg_test")).toBeNull();
  });

  it("keeps the session it stored on the way in", async () => {
    stubCabinetApi({});
    const { container } = renderPage(<LoginHarness />);

    fillLogin(container, "alfa", "right");
    await screen.findByRole("button", { name: "Hello alfa" });

    expect(readCabinetSession("kg_test")).toEqual({ login: "alfa", password: "right" });
  });

  it("says so when no tier accepts the pair", async () => {
    stubCabinetApi({ "/api/auth/login": 401 });
    const { container } = renderPage(<LoginHarness />);

    fillLogin(container, "alfa", "wrong");

    expect(await screen.findByText("Wrong pair")).toBeTruthy();
    expect(sessionStorage.getItem("kg_test")).toBeNull();
  });

  it("sends another tier's account to its own cabinet", async () => {
    const goTo = vi.spyOn(navigate, "to").mockImplementation(() => undefined);
    stubCabinetApi({ "/api/auth/login": { ok: true, target: "admin.html", keys: { kg_admin: "1", evil: "x" } } });
    const { container } = renderPage(<LoginHarness />);

    fillLogin(container, "boss", "other");

    await waitFor(() => expect(goTo).toHaveBeenCalledWith("admin.html"));
    expect(sessionStorage.getItem("kg_admin")).toBe("1");
    expect(sessionStorage.getItem("evil")).toBeNull();
  });

  it("re-verifies a stored session and drops one the server refuses", async () => {
    writeCabinetSession("kg_test", { login: "alfa", password: "stale" });
    renderPage(<LoginHarness />);

    expect(screen.getByText("checking")).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeTruthy();
    expect(sessionStorage.getItem("kg_test")).toBeNull();
  });
});

describe("BizIdPanel", () => {
  const API = "/api/business-id/contact";
  const CARD = { ok: true, bizId: "TM-7/1", fields: ["phone", "website"], contact: { phone: "+998 90", website: HOSTILE } };

  it("shows only the fields the server names, with stored values as values", async () => {
    stubCabinetApi({ [API]: CARD });

    const { container } = renderPage(<BizIdPanel credentials={WHO} />);

    expect(await screen.findByText("TM-7/1")).toBeTruthy();
    expect([...container.querySelectorAll("[data-bidp]")].map(input => input.getAttribute("data-bidp"))).toEqual(["phone", "website"]);
    expect(container.querySelector<HTMLInputElement>('[data-bidp="website"]')?.value).toBe(HOSTILE);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("link", { name: BIZID_TEXT.view[0] }).getAttribute("href")).toBe("biznes-id.html?id=TM-7%2F1");
  });

  it("saves the trimmed fields and shows the normalised values back", async () => {
    const toast = vi.spyOn(dialogs, "toast").mockImplementation(() => undefined);
    const calls = stubCabinetApi({
      [API]: body => (body.op === "get" ? CARD : { ok: true, contact: { phone: "+998901234567", website: "https://a.uz" } }),
    });
    const { container } = renderPage(<BizIdPanel credentials={WHO} />);
    await screen.findByText("TM-7/1");
    const phone = container.querySelector<HTMLInputElement>('[data-bidp="phone"]')!;

    fireEvent.change(phone, { target: { value: "  +998 90 123 45 67 " } });
    fireEvent.click(screen.getByRole("button", { name: BIZID_TEXT.save[0] }));

    expect(await screen.findByText(BIZID_TEXT.saved[0])).toBeTruthy();
    expect(bodiesSentTo(calls, API)[1]).toEqual({ ...WHO, phone: "+998 90 123 45 67", website: HOSTILE });
    expect(phone.value).toBe("+998901234567");
    expect(toast).toHaveBeenCalledWith(BIZID_TEXT.saved[0], { tone: "success" });
  });

  it("turns a field error into a readable line", async () => {
    stubCabinetApi({ [API]: body => (body.op === "get" ? CARD : refused(400, { error: "phone_invalid" })) });
    renderPage(<BizIdPanel credentials={WHO} />);

    fireEvent.click(await screen.findByRole("button", { name: BIZID_TEXT.save[0] }));

    expect(await screen.findByText(BIZID_TEXT.phone_invalid[0])).toBeTruthy();
  });

  it("reports a failed load instead of an empty form", async () => {
    stubCabinetApi({ [API]: 500 });

    renderPage(<BizIdPanel credentials={WHO} />);

    expect(await screen.findByText(BIZID_TEXT.fail[0])).toBeTruthy();
  });
});

describe("NewsList", () => {
  it("renders articles as text and drops unsafe addresses", () => {
    const items = parseNews([
      { title: HOSTILE, body: "Body", tier: "global", url: "javascript:alert(1)", image: "//evil.example/x.png", time: "soon" },
      { title: "Paxta", scope: "Qishloq", url: "https://news.uz/a", source: "News.uz", image: "/uploads/a.png" },
    ]);

    const { container } = renderPage(<NewsList items={items} platformLabel="Platform" sourceLabel="Source" emptyText="None" />);

    expect(screen.getByText(HOSTILE)).toBeTruthy();
    expect(screen.getByText("Platform")).toBeTruthy();
    expect(screen.getByText("Qishloq")).toBeTruthy();
    expect([...container.querySelectorAll("img")].map(image => image.getAttribute("src"))).toEqual(["/uploads/a.png"]);
    expect([...container.querySelectorAll("a")].map(link => link.getAttribute("href"))).toEqual(["https://news.uz/a"]);
  });

  it("says so when there is no news, and removes an image that fails to load", () => {
    const empty = renderPage(<NewsList items={[]} platformLabel="P" sourceLabel="S" emptyText="None yet" />);
    expect(empty.getByText("None yet")).toBeTruthy();

    const { container } = renderPage(
      <NewsList items={parseNews([{ title: "A", image: "/uploads/gone.png" }])} platformLabel="P" sourceLabel="S" emptyText="-" />,
    );
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
  });
});
