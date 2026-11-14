import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { bodiesSentTo, refused, stubCabinetApi } from "../../shell/cabinet/testApi";
import type { ApiRoute } from "../../shell/cabinet/testApi";
import { dialogs } from "../../shell/dialogs";
import { navigate } from "../../shell/navigate";
import { HOSTILE, renderPage } from "../../test/renderPage";
import { money } from "./charts";
import { CompanyPage } from "./CompanyPage";
import { OT } from "./text";

const WHO = { login: "alfa", password: "secret" };
const SHOWROOM = [
  { name: "Ip", price: "5$", desc: "Paxta ipi", img: "/uploads/ip.jpg", trade: "export" },
  { name: HOSTILE, price: "", desc: "", img: "javascript:alert(1)", trade: "import" },
];
const COMPANY = {
  id: "c1", name: "Alfa MChJ", sector: "Paxta", assocId: "a1", assocName: "Paxta", assocI18n: { uz: "Paxta uyushmasi", ru: "Хлопок" },
  showroom: SHOWROOM, bizrows: [{ product: "Ip", sales: "40 000$", price: "1,200", composition: "", note: "" }],
};
const BASE: Record<string, ApiRoute> = {
  "/api/company/login": body => (body.password === WHO.password ? { ok: true, company: COMPANY } : refused(401)),
  "/api/bozor/inquiries": { ok: true, unread: 3, items: [] },
  "/api/conference?assoc=a1": { id: "m 1", title: HOSTILE, datetime: "2026-04-01T10:00", link: "https://meet.example/x" },
};

async function openCabinet(routes: Record<string, ApiRoute> = {}) {
  sessionStorage.setItem("kg_co", JSON.stringify(WHO));
  const calls = stubCabinetApi({ ...BASE, ...routes });
  const view = renderPage(<CompanyPage />);
  await screen.findByRole("heading", { level: 1, name: OT.nav_dash[0] });
  return { ...view, calls };
}

function openView(label: string): void {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${label}`) }));
}

function submitLogin(container: HTMLElement, login: string, password: string): void {
  container.querySelector<HTMLInputElement>("#coLoginInp")!.value = login;
  container.querySelector<HTMLInputElement>("#coPassInp")!.value = password;
  fireEvent.submit(container.querySelector("#coForm")!);
}

describe("CompanyPage sign-in", () => {
  it("opens the cabinet for the right pair and remembers the session", async () => {
    stubCabinetApi(BASE);
    const { container } = renderPage(<CompanyPage />);

    submitLogin(container, "alfa", "secret");

    expect(await screen.findByRole("heading", { level: 2, name: "Alfa MChJ" })).toBeTruthy();
    expect(JSON.parse(sessionStorage.getItem("kg_co") ?? "null")).toEqual(WHO);
    expect(container.querySelector("#coAssoc")?.textContent).toBe("Paxta uyushmasi");
    expect(container.querySelector("#aiNav")?.getAttribute("href")).toBe("assistant.html?panel=company&co=Alfa%20MChJ");
  });

  it("says the pair is wrong when no tier accepts it", async () => {
    stubCabinetApi({ ...BASE, "/api/auth/login": 401 });
    const { container } = renderPage(<CompanyPage />);

    submitLogin(container, "alfa", "nope");

    expect(await screen.findByText(OT.err[0])).toBeTruthy();
    expect(sessionStorage.getItem("kg_co")).toBeNull();
  });

  it("sends an association account to its own cabinet", async () => {
    const goTo = vi.spyOn(navigate, "to").mockImplementation(() => undefined);
    stubCabinetApi({ ...BASE, "/api/auth/login": { ok: true, target: "association.html", keys: {} } });
    const { container } = renderPage(<CompanyPage />);

    submitLogin(container, "chair", "nope");

    await waitFor(() => expect(goTo).toHaveBeenCalledWith("association.html"));
  });

  it("signs out to the login form without leaving the page", async () => {
    await openCabinet();

    fireEvent.click(screen.getByRole("button", { name: OT.logout[0] }));

    expect(screen.getByRole("heading", { name: OT.lg_title[0] })).toBeTruthy();
    expect(sessionStorage.getItem("kg_co")).toBeNull();
  });
});

describe("CompanyPage cabinet", () => {
  it("shows the dashboard from recorded data, the banner and the unread badge", async () => {
    const { container } = await openCabinet();

    expect(container.querySelector("#kpiVal")?.textContent).toBe("2");
    expect(container.querySelector("#kpiMini")?.textContent).toBe(
      `1${OT.st_priced[0]}2${OT.st_photo[0]}1${OT.st_plain[0]}2${OT.d_products[0]}`,
    );
    expect(container.querySelector("#chartMonth .cx-val")?.textContent).toBe("40000");
    expect(container.querySelector("#chartArea .cx-val")?.textContent).toBe("1200");
    await waitFor(() => expect(container.querySelector(".co-badge")?.textContent).toBe("3"));
    await waitFor(() => expect(container.querySelector("#coBanner")?.textContent).toContain(HOSTILE));
    expect(container.querySelector("#coBanner a")?.getAttribute("href")).toBe("/api/conference/join?id=m%201");
    expect(container.querySelector("img")).toBeNull();
  });

  it("reads money as the company typed it", () => {
    expect(["40000$", "35 000 so'm", "1,200", "", "abc", "-5"].map(money)).toEqual([40000, 35000, 1200, 0, 0, 0]);
  });

  it("says there is no data instead of drawing an invented chart", async () => {
    const { container } = await openCabinet({ "/api/company/login": { ok: true, company: { ...COMPANY, bizrows: [], showroom: [] } } });

    expect(screen.getAllByText(OT.dash_nodata[0])).toHaveLength(2);
    expect(screen.getByText(OT.sh_empty[0])).toBeTruthy();
    expect(container.querySelector("svg.cx")).toBeNull();
  });

  it("follows the language switch", async () => {
    const { container } = await openCabinet();

    fireEvent.click(container.querySelector("#langBtn")!);

    expect(screen.getByRole("heading", { level: 1, name: OT.nav_dash[1] })).toBeTruthy();
    expect(container.querySelector("#coAssoc")?.textContent).toBe("Хлопок");
  });

  it("splits the showroom by direction and adds an item to the open one", async () => {
    const { calls, container } = await openCabinet({
      "/api/company/showroom": body => ({ ok: true, showroom: body.items }),
    });
    openView(OT.nav_show[0]);

    expect(screen.getByRole("tab", { name: `⬆ ${OT.sh_export[0]} (1)` })).toBeTruthy();
    expect([...container.querySelectorAll("#showGrid img")].map(image => image.getAttribute("src"))).toEqual(["/uploads/ip.jpg"]);
    fireEvent.click(screen.getByRole("tab", { name: `⬇ ${OT.sh_import[0]} (1)` }));
    expect(screen.getByText(HOSTILE)).toBeTruthy();
    expect(container.querySelector("#showGrid img")).toBeNull();

    fireEvent.change(screen.getByPlaceholderText(OT.sh_name[0]), { target: { value: " Uskuna " } });
    fireEvent.change(screen.getByPlaceholderText(OT.sh_price[0]), { target: { value: "900$" } });
    fireEvent.submit(container.querySelector("#shForm")!);

    expect(await screen.findByText(OT.sh_saved[0])).toBeTruthy();
    expect(bodiesSentTo(calls, "/api/company/showroom")).toEqual([
      { ...WHO, items: [...SHOWROOM, { name: "Uskuna", price: "900$", img: "", desc: "", trade: "import" }] },
    ]);
    expect(screen.getByRole("tab", { name: `⬇ ${OT.sh_import[0]} (2)` })).toBeTruthy();
    expect(screen.getByPlaceholderText<HTMLInputElement>(OT.sh_name[0]).value).toBe("");
  });

  it("deletes the right showroom item from a filtered view", async () => {
    const { calls } = await openCabinet({ "/api/company/showroom": body => ({ ok: true, showroom: body.items }) });
    openView(OT.nav_show[0]);
    fireEvent.click(screen.getByRole("tab", { name: new RegExp(OT.sh_import[0]) }));

    fireEvent.click(screen.getByRole("button", { name: OT.sh_del[0] }));

    await waitFor(() => expect(bodiesSentTo(calls, "/api/company/showroom")).toEqual([{ ...WHO, items: [SHOWROOM[0]] }]));
    expect(await screen.findByText(OT.sh_empty_imp[0])).toBeTruthy();
  });

  it("lists invest projects, adds one and lets only the owner delete", async () => {
    const mine = { id: "i1", title: "Fabrika", amount: "$500K", status: "izlanmoqda", ownerType: "company", ownerId: "c1", link: "javascript:x" };
    const theirs = { id: "i2", title: HOSTILE, scope: "global", ownerType: "admin", ownerId: "x" };
    const { calls, container } = await openCabinet({ "/api/company/items": { items: [mine, theirs] } });
    openView(OT.nav_invest[0]);

    expect(await screen.findByText("Fabrika")).toBeTruthy();
    expect(screen.getByText(HOSTILE)).toBeTruthy();
    expect(container.querySelector(".mi-badge")?.textContent).toBe(OT.by_konglomerat[0]);
    expect(screen.getAllByRole("button", { name: OT.del[0] })).toHaveLength(1);
    expect(container.querySelector(".mod-item a")).toBeNull();

    fireEvent.change(screen.getByPlaceholderText(OT.inv_p_title[0]), { target: { value: " Sex " } });
    fireEvent.change(screen.getByPlaceholderText(OT.inv_p_amount[0]), { target: { value: "$1M" } });
    fireEvent.submit(container.querySelector("#invForm")!);

    await waitFor(() => expect(bodiesSentTo(calls, "/api/company/items")).toHaveLength(3));
    expect(bodiesSentTo(calls, "/api/company/items")[1]).toEqual({
      ...WHO, module: "invest", op: "add", title: "Sex", amount: "$1M", status: "", body: "",
    });
  });

  it("keeps services and the R&D room as separate lists", async () => {
    const { calls } = await openCabinet({
      "/api/company/items": body => ({ items: body.module === "service" ? [{ id: "s1", title: "Logistika" }] : [] }),
    });

    openView(OT.nav_service[0]);
    expect(await screen.findByText("Logistika")).toBeTruthy();
    expect(screen.getByPlaceholderText(OT.svc_p_price[0])).toBeTruthy();
    openView(OT.nav_rnd[0]);

    expect(await screen.findByText(OT.rnd_empty[0])).toBeTruthy();
    expect(screen.queryByText("Logistika")).toBeNull();
    expect(bodiesSentTo(calls, "/api/company/items").map(body => body.module)).toEqual(["service", "rnd"]);
  });

  it("saves the sales table and shows the AI analysis as text", async () => {
    const { calls, container } = await openCabinet({
      "/api/company/data": body => ({ ok: true, rows: body.rows }),
      "/api/company/analyze": { analysis: `**Xulosa**\n${HOSTILE}` },
    });
    openView(OT.nav_data[0]);

    fireEvent.click(container.querySelector("#bdAddRow")!);
    fireEvent.change(screen.getByRole("textbox", { name: `${OT.bd_product[0]} 2` }), { target: { value: "Mato" } });
    fireEvent.click(screen.getByRole("button", { name: OT.bd_save[0] }));

    expect(await screen.findByText(OT.bd_saved[0])).toBeTruthy();
    expect(bodiesSentTo(calls, "/api/company/data")[0].rows).toEqual([
      COMPANY.bizrows[0],
      { product: "Mato", sales: "", price: "", composition: "", note: "" },
    ]);

    fireEvent.click(container.querySelector("#bdAnalyze")!);

    expect(await screen.findByText(OT.bd_ahead[0])).toBeTruthy();
    const box = container.querySelector("#bdAnalysis")!;
    expect(box.querySelectorAll("b")[1].textContent).toBe("Xulosa");
    expect(box.textContent).toContain(HOSTILE);
    expect(box.querySelector("img")).toBeNull();
    expect(bodiesSentTo(calls, "/api/company/analyze")).toEqual([{ ...WHO, lang: "uz" }]);
  });

  it("says the AI is unavailable when the analysis fails", async () => {
    const { container } = await openCabinet({ "/api/company/data": { ok: true, rows: COMPANY.bizrows }, "/api/company/analyze": 500 });
    openView(OT.nav_data[0]);

    fireEvent.click(container.querySelector("#bdAnalyze")!);

    expect(await screen.findByText(OT.bd_aoff[0])).toBeTruthy();
  });

  it("shows buyer enquiries, answers one and archives closed ones", async () => {
    const enquiry = {
      id: "q1", status: "new", productId: "p/1", productName: "Ip", message: HOSTILE, buyerName: "John",
      buyerEmail: "john@buy.com", contact: "+1 555", qty: "10", unit: "t", created: Date.now(), replies: [{ by: "Alfa", text: "Salom" }],
    };
    const closed = { id: "q2", status: "closed", buyerName: "Old", message: "Eski" };
    const { calls, container } = await openCabinet({
      "/api/bozor/inquiries": { ok: true, unread: 1, items: [enquiry, closed] },
      "/api/bozor/inquiry/reply": { ok: true },
    });
    openView(OT.nav_inquiries[0]);

    expect(await screen.findByText(HOSTILE)).toBeTruthy();
    expect(container.querySelector("#iqList img")).toBeNull();
    expect(screen.queryByText("Eski")).toBeNull();
    expect([...container.querySelectorAll(".iq-contact a")].map(link => link.getAttribute("href"))).toEqual([
      "mailto:john@buy.com", "tel:+1555", "mahsulot.html?id=p%2F1",
    ]);

    fireEvent.change(screen.getByPlaceholderText(OT.iq_reply_ph[0]), { target: { value: " Narx 5$ " } });
    fireEvent.click(screen.getByRole("button", { name: OT.iq_reply[0] }));

    await waitFor(() => expect(bodiesSentTo(calls, "/api/bozor/inquiry/reply")).toEqual([{ ...WHO, id: "q1", text: "Narx 5$" }]));
    fireEvent.click(screen.getByRole("tab", { name: new RegExp(OT.iq_tab_archive[0]) }));
    expect(screen.getByText("Eski")).toBeTruthy();
    expect(screen.getByRole("button", { name: OT.iq_reopen[0] })).toBeTruthy();
  });

  it("reports failed enquiries instead of an empty inbox, and a reply that was not saved", async () => {
    const alert = vi.spyOn(dialogs, "alert").mockResolvedValue(undefined);
    let isDown = true;
    await openCabinet({
      "/api/bozor/inquiries": () => (isDown ? 500 : { ok: true, unread: 1, items: [{ id: "q1", status: "new", buyerName: "John" }] }),
      "/api/bozor/inquiry/reply": refused(500, { error: "db" }),
    });
    openView(OT.nav_inquiries[0]);
    expect(await screen.findByText(OT.iq_fail[0])).toBeTruthy();

    isDown = false;
    openView(OT.nav_dash[0]);
    openView(OT.nav_inquiries[0]);
    fireEvent.click(await screen.findByRole("button", { name: OT.iq_close[0] }));

    await waitFor(() => expect(alert).toHaveBeenCalledWith(OT.iq_fail[0]));
  });

  it("lists the meetings and only opens the room close to the start", async () => {
    const soon = { id: "m1", title: "Bugun", datetime: new Date(Date.now() + 60_000).toISOString(), link: "https://meet.example/a" };
    const later = { id: "m2", title: "Keyin", datetime: new Date(Date.now() + 86_400_000).toISOString(), link: "https://meet.example/b" };
    await openCabinet({ "/api/conference?list=1&assoc=a1": { meetings: [soon, later] } });
    openView(OT.nav_meeting[0]);

    expect(await screen.findByText("Bugun")).toBeTruthy();
    const joins = screen.getAllByText(OT.cf_join[0]).filter(node => node.closest("#cfBody"));
    expect(joins.map(link => link.getAttribute("href"))).toEqual(["/api/conference/join?id=m1", null]);
    expect(screen.getByText(OT.cf_soon[0])).toBeTruthy();
  });

  it("drafts an appeal with the AI and sends it", async () => {
    const sent = { id: "ap1", subject: "Bojxona", stage: "new", agency: "DBQ", body: "Rasmiy matn", history: [] };
    const { calls, container } = await openCabinet({
      "/api/company/appeal": body => (body.op === "list" ? { agencies: ["DBQ", "Soliq"], items: [] } : { ok: true, items: [sent] }),
      "/api/appeal/draft": { ok: true, text: "Rasmiy matn" },
    });
    openView(OT.nav_gov[0]);
    expect(await screen.findByText(OT.gov_empty[0])).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: OT.gov_send[0] }));
    expect(screen.getByText(OT.gov_need[0])).toBeTruthy();

    fireEvent.change(screen.getByRole("textbox", { name: OT.gov_subject[0] }), { target: { value: " Bojxona " } });
    fireEvent.click(screen.getByRole("button", { name: OT.gov_draft[0] }));
    await waitFor(() => expect(container.querySelector<HTMLTextAreaElement>("#gov-body")?.value).toBe("Rasmiy matn"));
    expect(bodiesSentTo(calls, "/api/appeal/draft")).toEqual([{ ...WHO, agency: "DBQ", subject: "Bojxona", hint: "", lang: "uz" }]);

    fireEvent.click(screen.getByRole("button", { name: OT.gov_send[0] }));

    expect(await screen.findByText(OT.gov_sent[0])).toBeTruthy();
    expect(bodiesSentTo(calls, "/api/company/appeal")[1]).toEqual({ ...WHO, agency: "DBQ", subject: "Bojxona", body: "Rasmiy matn" });
    expect(screen.getByText(OT.gov_s_new[0])).toBeTruthy();
    expect(container.querySelector(".gov-doc")?.getAttribute("href")).toBe("/api/appeal/doc?id=ap1&login=alfa&password=secret");
    expect(container.querySelector<HTMLInputElement>("#gov-subject")?.value).toBe("");
  });

  it("shows the sector news, or says there is none when the request fails", async () => {
    await openCabinet({ "/api/company/news": 500 });
    openView(OT.nav_news[0]);

    expect(await screen.findByText(OT.news_empty[0])).toBeTruthy();
  });

  it("opens the Business ID and rights panels, and the chats page", async () => {
    const goTo = vi.spyOn(navigate, "to").mockImplementation(() => undefined);
    const { calls } = await openCabinet({
      "/api/business-id/contact": { ok: true, bizId: "TM-9", contact: {} },
      "/api/legal/export": { ok: true, data: {} },
    });

    openView(OT.nav_bizid[0]);
    expect(await screen.findByText("TM-9")).toBeTruthy();
    openView(OT.nav_legal[0]);
    await waitFor(() => expect(bodiesSentTo(calls, "/api/legal/export")).toEqual([WHO]));
    openView(OT.nav_chats[0]);

    expect(goTo).toHaveBeenCalledWith("chat.html");
  });
});
