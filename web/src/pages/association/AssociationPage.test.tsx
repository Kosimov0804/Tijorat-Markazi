import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bodiesSentTo, refused, stubCabinetApi } from "../../shell/cabinet/testApi";
import type { ApiRoute } from "../../shell/cabinet/testApi";
import { dialogs } from "../../shell/dialogs";
import { navigate } from "../../shell/navigate";
import { HOSTILE, renderPage, setSearch } from "../../test/renderPage";
import { AssociationPage } from "./AssociationPage";
import { AT } from "./text";

const WHO = { login: "chair", password: "secret" };
const COMPANIES = [
  { id: "c1", name: "Alfa MChJ", sector: "Paxta", login: "alfa", created: Date.now(), showroom: [{ name: "Ip", price: "5$" }] },
  { id: "c2", name: HOSTILE, sector: "", login: "beta", created: null, showroom: [] },
];
const ACCOUNT = { assoc: { id: "a1", name: "Paxta", i18n: { uz: "Paxta uyushmasi", ru: "Хлопок" }, chairman: "Karimov" }, companies: COMPANIES };
const BASE: Record<string, ApiRoute> = {
  "/api/assoc/login": body => (body.password === WHO.password ? ACCOUNT : refused(401, { error: "invalid credentials" })),
  "/api/conference?assoc=a1": { title: "Yig'ilish" },
  "/api/register/list": { ok: true, counts: { pending: 2 }, items: [] },
};

function signIn(): void {
  sessionStorage.setItem("kg_as", JSON.stringify(WHO));
}

async function openCabinet(routes: Record<string, ApiRoute> = {}) {
  signIn();
  const calls = stubCabinetApi({ ...BASE, ...routes });
  const view = renderPage(<AssociationPage />);
  await screen.findByRole("heading", { level: 1, name: AT.nav_dash[0] });
  return { ...view, calls };
}

function openView(label: string): void {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${label}`) }));
}

function submitLogin(container: HTMLElement, login: string, password: string): void {
  container.querySelector<HTMLInputElement>("#asLoginInp")!.value = login;
  container.querySelector<HTMLInputElement>("#asPassInp")!.value = password;
  fireEvent.submit(container.querySelector("#asForm")!);
}

describe("AssociationPage sign-in", () => {
  it("opens the cabinet for the right pair and remembers the session", async () => {
    stubCabinetApi(BASE);
    const { container } = renderPage(<AssociationPage />);

    submitLogin(container, " chair ", "secret");

    expect(await screen.findByRole("heading", { level: 1, name: AT.nav_dash[0] })).toBeTruthy();
    expect(JSON.parse(sessionStorage.getItem("kg_as") ?? "null")).toEqual(WHO);
    expect(container.querySelector("#asBrandSub")?.textContent).toBe("Paxta uyushmasi");
    await waitFor(() => expect(document.title).toBe("Paxta uyushmasi — TIJORAT MARKAZI"));
  });

  it("says the pair is wrong when no tier accepts it", async () => {
    stubCabinetApi({ ...BASE, "/api/auth/login": 401 });
    const { container } = renderPage(<AssociationPage />);

    submitLogin(container, "chair", "nope");

    expect(await screen.findByText(AT.err[0])).toBeTruthy();
    expect(sessionStorage.getItem("kg_as")).toBeNull();
  });

  it("sends a company account to the company cabinet", async () => {
    const goTo = vi.spyOn(navigate, "to").mockImplementation(() => undefined);
    stubCabinetApi({ ...BASE, "/api/auth/login": { ok: true, target: "company.html", keys: { kg_co: "{}" } } });
    const { container } = renderPage(<AssociationPage />);

    submitLogin(container, "alfa", "nope");

    await waitFor(() => expect(goTo).toHaveBeenCalledWith("company.html"));
  });

  it("drops a stored session the server no longer accepts", async () => {
    sessionStorage.setItem("kg_as", JSON.stringify({ login: "chair", password: "old" }));
    stubCabinetApi(BASE);

    renderPage(<AssociationPage />);

    expect(await screen.findByRole("heading", { name: AT.lg_title[0] })).toBeTruthy();
    expect(sessionStorage.getItem("kg_as")).toBeNull();
  });

  it("signs out to the directory", async () => {
    const goTo = vi.spyOn(navigate, "to").mockImplementation(() => undefined);
    await openCabinet();

    fireEvent.click(screen.getByRole("button", { name: AT.logout[0] }));

    expect(sessionStorage.getItem("kg_as")).toBeNull();
    expect(goTo).toHaveBeenCalledWith("associations.html");
  });
});

describe("AssociationPage cabinet", () => {
  it("shows the dashboard figures, the waiting applications and hostile names as text", async () => {
    const { container } = await openCabinet();

    const cards = [...container.querySelectorAll(".admin-card")].map(card => card.textContent);
    expect(cards).toEqual([
      `${AT.d_companies[0]}2▲`,
      `${AT.d_products[0]}1🛍️`,
      `${AT.d_with[0]}1 / 2`,
      expect.stringContaining(AT.d_meeting[0]),
    ]);
    await waitFor(() => expect(container.querySelector(".co-badge")?.textContent).toBe("2"));
    await waitFor(() => expect(cards.length && container.querySelectorAll(".admin-card")[3].textContent).toBe(`${AT.d_meeting[0]}${AT.yes[0]}`));
    expect(screen.getByRole("img", { name: new RegExp(AT.flow[0]) })).toBeTruthy();
    expect(screen.getByText(HOSTILE)).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("#aiNav")?.getAttribute("href")).toBe("assistant.html?panel=assoc&co=Paxta%20uyushmasi");
  });

  it("follows the language switch", async () => {
    const { container } = await openCabinet();

    fireEvent.click(container.querySelector("#langBtn")!);

    expect(screen.getByRole("heading", { level: 1, name: AT.nav_dash[1] })).toBeTruthy();
    expect(container.querySelector("#asBrandSub")?.textContent).toBe("Хлопок");
    expect(screen.getByRole("button", { name: AT.logout[1] })).toBeTruthy();
  });

  it("adds a company through the form", async () => {
    const added = [...COMPANIES, { id: "c3", name: "Gamma", sector: "IT", login: "gamma", showroom: [] }];
    const { calls, container } = await openCabinet({ "/api/assoc/companies": { ok: true, companies: added } });
    openView(AT.nav_comp[0]);

    fireEvent.change(screen.getByPlaceholderText(AT.ph_name[0]), { target: { value: " Gamma " } });
    fireEvent.change(container.querySelector("#cmp-sector")!, { target: { value: "IT" } });
    fireEvent.change(container.querySelector("#cmp-login")!, { target: { value: " gamma " } });
    fireEvent.change(screen.getByPlaceholderText(AT.c_pass[0]), { target: { value: "pw-12345" } });
    fireEvent.submit(container.querySelector("#cmpForm")!);

    expect(await screen.findByText("Gamma")).toBeTruthy();
    expect(bodiesSentTo(calls, "/api/assoc/companies")).toEqual([
      { ...WHO, op: "add", name: "Gamma", sector: "IT", clogin: "gamma", cpassword: "pw-12345" },
    ]);
    expect(screen.getByRole("heading", { name: `${AT.nav_comp[0]} (3)` })).toBeTruthy();
    expect(screen.getByPlaceholderText<HTMLInputElement>(AT.ph_name[0]).value).toBe("");
  });

  it("explains a taken login and keeps what was typed", async () => {
    const { container } = await openCabinet({ "/api/assoc/companies": refused(409, { error: "login exists" }) });
    openView(AT.nav_comp[0]);

    fireEvent.change(container.querySelector("#cmp-login")!, { target: { value: "alfa" } });
    fireEvent.change(container.querySelector("#cmp-pass")!, { target: { value: "pw" } });
    fireEvent.submit(container.querySelector("#cmpForm")!);

    expect(await screen.findByText(AT.taken[0])).toBeTruthy();
    expect(container.querySelector<HTMLInputElement>("#cmp-login")?.value).toBe("alfa");
  });

  it("opens a company's figures and issues a new password once", async () => {
    vi.spyOn(dialogs, "confirm").mockResolvedValue(true);
    const { calls } = await openCabinet({ "/api/assoc/companies": { ok: true, password: "fresh-pass-1", once: true } });
    openView(AT.nav_comp[0]);

    fireEvent.click(screen.getByRole("link", { name: "Alfa MChJ" }));
    expect(screen.getByRole("heading", { level: 2, name: "Alfa MChJ" })).toBeTruthy();
    expect(screen.getByText("5$")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: AT.pw_reset[0] }));

    expect(await screen.findByText("fresh-pass-1")).toBeTruthy();
    expect(bodiesSentTo(calls, "/api/assoc/companies")).toEqual([{ ...WHO, op: "pw", id: "c1" }]);

    fireEvent.click(screen.getByRole("button", { name: AT.cd_back[0] }));
    expect(screen.queryByText("fresh-pass-1")).toBeNull();
  });

  it("lists applications and approves one after confirmation", async () => {
    vi.spyOn(dialogs, "confirm").mockResolvedValue(true);
    const application = {
      id: "r1", status: "pending", name: HOSTILE, ref: "REG-1", login: "newco", contactName: "Ali", role: "CEO",
      email: "ali@newco.uz", phone: "+998 90 111", website: "javascript:alert(1)", created: Date.now(),
    };
    const { calls, container } = await openCabinet({
      "/api/register/list": { ok: true, counts: { pending: 1 }, items: [application] },
      "/api/register/decide": { ok: true },
    });
    openView(AT.nav_regs[0]);

    expect(await screen.findByText(HOSTILE)).toBeTruthy();
    expect(screen.getByText("Ali · CEO")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    const links = [...container.querySelectorAll(".rq-contact a")].map(link => link.getAttribute("href"));
    expect(links).toEqual(["mailto:ali@newco.uz", "tel:+99890111"]);

    fireEvent.click(screen.getByRole("button", { name: AT.rq_approve[0] }));

    await waitFor(() => expect(bodiesSentTo(calls, "/api/register/decide")).toEqual([{ ...WHO, id: "r1", action: "approve" }]));
    expect(dialogs.confirm).toHaveBeenCalledWith(AT.rq_confirm[0]);
  });

  it("requires a reason to reject, and reports a refused decision", async () => {
    const prompt = vi.spyOn(dialogs, "prompt").mockResolvedValueOnce("  ").mockResolvedValueOnce(" No licence ");
    const alert = vi.spyOn(dialogs, "alert").mockResolvedValue(undefined);
    const { calls } = await openCabinet({
      "/api/register/list": { ok: true, counts: { pending: 1 }, items: [{ id: "r1", status: "pending", name: "Newco" }] },
      "/api/register/decide": refused(400, { error: "bad" }),
    });
    openView(AT.nav_regs[0]);
    const reject = await screen.findByRole("button", { name: AT.rq_reject[0] });

    fireEvent.click(reject);
    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
    expect(bodiesSentTo(calls, "/api/register/decide")).toEqual([]);

    fireEvent.click(reject);

    await waitFor(() => expect(alert).toHaveBeenCalledWith(AT.rq_fail[0]));
    expect(bodiesSentTo(calls, "/api/register/decide")).toEqual([{ ...WHO, id: "r1", action: "reject", reason: "No licence" }]);
  });

  it("says so when the applications cannot be loaded", async () => {
    await openCabinet({ "/api/register/list": 500 });
    openView(AT.nav_regs[0]);

    expect(await screen.findByText(AT.rq_fail[0])).toBeTruthy();
  });

  it("shows the month's appeals and writes an official letter", async () => {
    const { calls } = await openCabinet({
      "/api/assoc/questions": {
        ym: "2026-03", months: ["2026-03", "2026-02"],
        users: [{ label: "Alfa MChJ", count: 3, type: "company", key: "c1" }],
        report: [{ question: HOSTILE, count: 2, companies: ["Alfa MChJ", "Beta"], repeated: true }],
      },
      "/api/assoc/letter": { ok: true, letter: { recipientLabel: "Alfa MChJ", body: "Hurmatli <b>rahbar</b>" } },
    });
    openView(AT.nav_quest[0]);

    expect(await screen.findByText(HOSTILE)).toBeTruthy();
    expect(screen.getByText("Alfa MChJ, Beta")).toBeTruthy();
    expect(screen.getByText(AT.q_repeat[0])).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: AT.q_makeletter[0] }));

    const modal = await screen.findByRole("dialog");
    expect(within(modal).getByText("Hurmatli <b>rahbar</b>")).toBeTruthy();
    expect(bodiesSentTo(calls, "/api/assoc/letter")).toEqual([{ ...WHO, type: "company", key: "c1", ym: "2026-03", lang: "uz" }]);

    fireEvent.click(within(modal).getByRole("button", { name: "✕" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the news with safe links only", async () => {
    const { container } = await openCabinet({
      "/api/assoc/news": { items: [{ title: "Bozor", tier: "global", url: "https://n.uz/1", source: "N" }, { title: HOSTILE, url: "javascript:x" }] },
    });
    openView(AT.nav_news[0]);

    expect(await screen.findByText("Bozor")).toBeTruthy();
    expect(screen.getByText(AT.news_tier_global[0])).toBeTruthy();
    expect([...container.querySelectorAll(".news-item a")].map(link => link.getAttribute("href"))).toEqual(["https://n.uz/1"]);
  });

  it("shows the monthly report and its download link", async () => {
    const { container } = await openCabinet({
      "/api/assoc/report": { ym: "2026-03", companyCount: 1, questions: 4, companies: [{ name: "Alfa MChJ", products: 1, questions: 4 }] },
    });
    openView(AT.nav_report[0]);

    expect(await screen.findByRole("cell", { name: "Alfa MChJ" })).toBeTruthy();
    expect(container.querySelector<HTMLInputElement>("#repMonth")?.value).toBe("2026-03");
    expect(container.querySelector("#repDl")?.getAttribute("href")).toBe("/api/assoc/report.doc?login=chair&password=secret&ym=2026-03");
  });

  it("supports a member's appeal with a note", async () => {
    const appeal = { id: "ap/1", subject: "Bojxona", stage: "new", companyName: "Alfa", agency: "DBQ", body: HOSTILE, history: [{ stage: "new", by: "Alfa" }] };
    const supported = { ...appeal, stage: "assoc", history: [...appeal.history, { stage: "assoc", by: "Karimov", note: "Ma'qul" }] };
    const { calls, container } = await openCabinet({
      "/api/assoc/appeals": body => ({ items: [body.op === "stage" ? supported : appeal] }),
    });
    openView(AT.nav_appeals[0]);

    expect(await screen.findByText(HOSTILE)).toBeTruthy();
    expect(container.querySelector(".gov-act a")?.getAttribute("href")).toBe("/api/appeal/doc?id=ap%2F1&login=chair&password=secret");
    fireEvent.change(screen.getByPlaceholderText(AT.ap_note[0]), { target: { value: "Ma'qul" } });
    fireEvent.click(screen.getByRole("button", { name: AT.ap_support[0] }));

    expect(await screen.findByText("Karimov · Ma'qul")).toBeTruthy();
    expect(bodiesSentTo(calls, "/api/assoc/appeals")[1]).toEqual({ ...WHO, op: "stage", id: "ap/1", stage: "assoc", note: "Ma'qul" });
    expect(screen.queryByRole("button", { name: AT.ap_support[0] })).toBeNull();
  });

  it("schedules a meeting and refuses a link that is not a web address", async () => {
    const meeting = { id: "m1", title: "Kengash", datetime: "2026-04-01T10:00", link: "https://meet.example/x", provider: "meet-bot" };
    const { calls, container } = await openCabinet({
      "/api/assoc/conference": body => (body.title ? { meetings: [meeting], meeting } : { meetings: [] }),
    });
    openView(AT.nav_conf[0]);
    expect(await screen.findByText(AT.conf_none_list[0])).toBeTruthy();

    fireEvent.change(container.querySelector("#conf-title")!, { target: { value: " Kengash " } });
    fireEvent.change(container.querySelector("#conf-dt")!, { target: { value: "2026-04-01T10:00" } });
    fireEvent.change(container.querySelector("#conf-link")!, { target: { value: "ftp://x" } });
    fireEvent.submit(container.querySelector("#confForm")!);
    expect(screen.getByText(AT.conf_link_err[0])).toBeTruthy();

    fireEvent.change(container.querySelector("#conf-link")!, { target: { value: "" } });
    fireEvent.submit(container.querySelector("#confForm")!);

    expect(await screen.findByText(AT.conf_meet_ready[0])).toBeTruthy();
    expect(bodiesSentTo(calls, "/api/assoc/conference")[1]).toEqual({ ...WHO, title: "Kengash", datetime: "2026-04-01T10:00", link: "", desc: "" });
    expect(screen.getByRole("link", { name: AT.conf_join[0] }).getAttribute("href")).toBe("/api/conference/join?id=m1");
    expect(screen.getByText(AT.conf_meet_auto[0])).toBeTruthy();
  });

  it("opens the Business ID and rights panels with the cabinet's credentials", async () => {
    const { calls } = await openCabinet({
      "/api/business-id/contact": { ok: true, bizId: "TM-1", fields: ["phone"], contact: {} },
      "/api/legal/export": { ok: true, data: {} },
    });

    openView(AT.nav_bizid[0]);
    expect(await screen.findByText("TM-1")).toBeTruthy();
    openView(AT.nav_legal[0]);

    await waitFor(() => expect(bodiesSentTo(calls, "/api/legal/export")).toEqual([WHO]));
  });

  it("opens the group chat as its own page", async () => {
    const goTo = vi.spyOn(navigate, "to").mockImplementation(() => undefined);
    await openCabinet();

    openView(AT.nav_groups[0]);

    expect(goTo).toHaveBeenCalledWith("chat.html");
  });
});

describe("AssociationPage public view", () => {
  afterEach(() => setSearch(""));

  it("shows the association and its members, even to a signed-in chairman", async () => {
    signIn();
    setSearch("?id=a%2F1");
    stubCabinetApi({
      "/api/assoc/public?id=a%2F1": {
        assoc: { id: "a/1", name: "Paxta", chairman: HOSTILE },
        companies: [{ name: HOSTILE, sector: "Paxta", products: 3, bizId: "TM 1" }, { name: "Beta" }],
      },
    });

    const { container } = renderPage(<AssociationPage />);

    expect(await screen.findByRole("heading", { level: 1, name: "Paxta" })).toBeTruthy();
    expect(container.querySelector("#pubChair")?.textContent).toBe(`Rahbar: ${HOSTILE}`);
    expect(container.querySelector("#pubCount")?.textContent).toBe("2");
    expect(container.querySelector("img")).toBeNull();
    expect([...container.querySelectorAll("#pubCompanies a")].map(link => link.getAttribute("href"))).toEqual([
      "korxona.html?id=TM%201",
      "biznes-id.html?id=TM%201",
    ]);
    expect(container.querySelector(".admin-shell")).toBeNull();
  });

  it("returns to the directory when the association does not exist", async () => {
    const goTo = vi.spyOn(navigate, "to").mockImplementation(() => undefined);
    setSearch("?id=zz");
    stubCabinetApi({});

    renderPage(<AssociationPage />);

    await waitFor(() => expect(goTo).toHaveBeenCalledWith("associations.html"));
  });
});
