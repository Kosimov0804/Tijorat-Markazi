import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { dialogs } from "../../shell/dialogs";
import { PANEL_TEXT } from "../../shell/legal/panelText";
import { goTo } from "../../shell/navigate";
import { HOSTILE, renderPage, stubApi } from "../../test/renderPage";
import { XARIDOR_TEXT } from "./types";
import { XaridorPage } from "./XaridorPage";

vi.mock("../../shell/navigate", () => ({ goTo: vi.fn(), replaceWith: vi.fn() }));

const uz = (key: string): string => XARIDOR_TEXT[key]![0];

const WHO = { login: "xarid", password: "pw-12345" };
const CATALOG = "/api/buyer/products?";
const HOME = {
  ok: true,
  buyer: { name: "Beta Savdo", phone: "+998901112233", login: "xarid", about: "Mato" },
  meta: { channel: "b2b", currencies: ["UZS", "USD"], stages: ["order", "fulfilment", "closed"] },
  rfqs: [
    { id: "r1", title: "Paxta ipi", status: "open", created: 1_700_000_000_000, qty: 500, unit: "kg", quoteCount: 2 },
    { id: "r2", title: HOSTILE, status: "closed", created: 1_700_000_000_000, quoteCount: 0 },
  ],
  deals: [
    {
      id: "d1",
      title: "Ip buyurtmasi",
      stage: "order",
      updated: 1_700_000_000_000,
      sellerName: "Alfa",
      value: 4_000_000,
      currency: "UZS",
      risks: [HOSTILE],
      notes: [{ by: "Alfa", t: 1_700_000_000_000, text: "Tayyor" }],
    },
  ],
  inquiries: [
    {
      id: "i1",
      status: "answered",
      companyName: "Alfa",
      productName: "Mayiz",
      message: "Narxi qança?",
      updated: 1_700_000_000_000,
      replies: [{ side: "seller", by: "Alfa", t: 1_700_000_000_000, text: HOSTILE }],
    },
  ],
  saved: [{ id: "c9", name: "Gamma", sector: "Agro", email: "javascript:alert(1)", phone: "+998 90 000-00-00" }],
};
const PRODUCTS = {
  items: [
    { id: "p1", title: "Mayiz", company: "Alfa", companyId: "c1", region: "Namangan", price: 2, currency: "USD", unit: "kg", moq: 100 },
    { id: "p2", title: HOSTILE, company: "Gamma", companyId: "c9" },
  ],
};
const ROUTES = { "/api/buyer/home": HOME, [CATALOG]: PRODUCTS };

type FetchStub = ReturnType<typeof vi.fn>;

const postsTo = (path: string): Record<string, unknown>[] =>
  (fetch as unknown as FetchStub).mock.calls
    .filter(([url, options]) => url === path && options)
    .map(([, options]) => JSON.parse((options as { body: string }).body) as Record<string, unknown>);

function signIn(login: string, password: string): void {
  fireEvent.change(screen.getByLabelText("Login"), { target: { value: login } });
  fireEvent.change(screen.getByLabelText("Parol"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: uz("xr_login_btn") }));
}

/** Opens the cabinet from a session kept in this browser tab. */
async function renderCabinet(routes: Record<string, unknown> = {}) {
  sessionStorage.setItem("kg_by", JSON.stringify(WHO));
  stubApi({ ...ROUTES, ...routes });
  const view = renderPage(<XaridorPage />);
  await screen.findByText("Mayiz");
  return view;
}

const openView = (container: HTMLElement, index: number): void => {
  fireEvent.click(container.querySelectorAll("#xrNav button")[index]);
};
/* The catalogue stays mounted behind the other views, so text is looked up inside one view. */
const inView = (container: HTMLElement, name: string) => within(container.querySelector<HTMLElement>(`#view-${name}`)!);
const RFQ_VIEW = 1;
const ORDERS_VIEW = 2;
const THREADS_VIEW = 3;
const PROFILE_VIEW = 4;
const LEGAL_VIEW = 5;

describe("XaridorPage sign-in", () => {
  it("opens the cabinet with the session keys the resolver hands over", async () => {
    stubApi({ ...ROUTES, "/api/auth/login": { ok: true, target: "xaridor.html", keys: { kg_by: JSON.stringify(WHO) } } });
    const { container } = renderPage(<XaridorPage />);

    signIn(" xarid ", "pw-12345");

    /* The first render of the file also pays for loading the page. */
    expect(await screen.findByText("Mayiz", {}, { timeout: 5000 })).toBeTruthy();
    expect(postsTo("/api/auth/login")).toEqual([WHO]);
    expect(postsTo("/api/buyer/home")[0]).toEqual(WHO);
    expect(container.querySelector("#xrBrandSub")?.textContent).toBe("Beta Savdo");
    expect(container.querySelector("#xrChannel")?.textContent).toBe("B2B");
  });

  it("refuses credentials no tier accepts and clears the password", async () => {
    stubApi({ "/api/auth/login": 401 });
    renderPage(<XaridorPage />);

    signIn("xarid", "wrong");

    expect(await screen.findByText(uz("xr_login_err"))).toBeTruthy();
    expect((screen.getByLabelText("Parol") as HTMLInputElement).value).toBe("");
  });

  it("sends another tier's account to its own cabinet", async () => {
    stubApi({ "/api/auth/login": { ok: true, target: "company.html" } });
    renderPage(<XaridorPage />);

    signIn("alfa", "secret-pass");

    await waitFor(() => expect(goTo).toHaveBeenCalledWith("company.html"));
  });

  it("returns a stale session to the form instead of an empty cabinet", async () => {
    sessionStorage.setItem("kg_by", JSON.stringify(WHO));
    stubApi({ "/api/buyer/home": { ok: false } });

    renderPage(<XaridorPage />);

    expect(await screen.findByText(uz("xr_e_load"))).toBeTruthy();
    expect(sessionStorage.getItem("kg_by")).toBeNull();
  });

  it("signs out to the home page and forgets the session", async () => {
    await renderCabinet();

    fireEvent.click(screen.getByRole("button", { name: uz("xr_logout") }));

    expect(goTo).toHaveBeenCalledWith("index.html");
    expect(sessionStorage.getItem("kg_by")).toBeNull();
  });
});

describe("XaridorPage catalogue", () => {
  it("lists the products with hostile titles as text and marks saved sellers", async () => {
    const { container } = await renderCabinet();

    expect(container.querySelectorAll("#xrCatOut .mk-card")).toHaveLength(2);
    expect(container.querySelector("#xrCount")?.textContent).toBe(uz("xr_found").replace("{n}", "2"));
    expect(screen.getByText(HOSTILE)).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByRole("button", { name: uz("xr_saved_on") })).toBeTruthy();
    expect(container.querySelectorAll("#xrNav .co-badge")).toHaveLength(3);
  });

  it("searches with the filters and shows the empty note", async () => {
    const { container } = await renderCabinet({ "/api/buyer/products?q=ip&certified=1": { items: [] } });

    fireEvent.change(container.querySelector("#xrQ")!, { target: { value: " ip " } });
    fireEvent.click(container.querySelector("#xrCert")!);
    fireEvent.submit(container.querySelector("#xrCatForm")!);

    expect(await screen.findByText(uz("xr_cat_empty"))).toBeTruthy();
  });

  it("sends a question to the seller with the buyer's credentials", async () => {
    await renderCabinet({ "/api/buyer/inquiry": { ok: true } });

    fireEvent.click(screen.getAllByRole("button", { name: uz("xr_ask") })[0]);
    fireEvent.change(screen.getByLabelText(uz("xr_ask_qty")), { target: { value: "300" } });
    fireEvent.change(screen.getByLabelText(uz("xr_ask_msg")), { target: { value: " Narxi? " } });
    fireEvent.click(screen.getByRole("button", { name: uz("xr_ask_send") }));

    expect(await screen.findByText(uz("xr_ask_ok"))).toBeTruthy();
    expect(postsTo("/api/buyer/inquiry")[0]).toEqual({ ...WHO, productId: "p1", qty: "300", unit: "kg", message: "Narxi?" });
  });

  it("saves a seller to the shortlist", async () => {
    await renderCabinet({ "/api/buyer/saved": { ok: true, on: true, suppliers: [{ id: "c1", name: "Alfa" }, { id: "c9" }] } });

    fireEvent.click(screen.getByRole("button", { name: uz("xr_save") }));

    await waitFor(() => expect(screen.getAllByRole("button", { name: uz("xr_saved_on") })).toHaveLength(2));
    expect(postsTo("/api/buyer/saved")[0]).toEqual({ ...WHO, companyId: "c1" });
  });
});

describe("XaridorPage price requests", () => {
  it("publishes a request and says how many sellers match", async () => {
    const { container } = await renderCabinet({ "/api/buyer/rfq": { ok: true, matches: [{}, {}] } });
    openView(container, RFQ_VIEW);
    expect(screen.getByText("Paxta ipi")).toBeTruthy();
    expect(inView(container, "rfq").getByText(HOSTILE)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(uz("xr_rfq_title")), { target: { value: " Kalava " } });
    fireEvent.change(screen.getByLabelText(uz("xr_rfq_cur")), { target: { value: "USD" } });
    fireEvent.submit(container.querySelector("#xrRfqForm")!);

    const matched = uz("xr_rfq_matched").replace("{n}", "2");
    expect(await screen.findByText(`${uz("xr_rfq_ok")} ${matched}`)).toBeTruthy();
    expect(postsTo("/api/buyer/rfq")[0]).toMatchObject({ ...WHO, title: "Kalava", currency: "USD", spec: "" });
    expect(postsTo("/api/buyer/home")).toHaveLength(2);
  });

  it("keeps the form and reports a request the server refused", async () => {
    const { container } = await renderCabinet({ "/api/buyer/rfq": { ok: false } });
    openView(container, RFQ_VIEW);

    fireEvent.change(screen.getByLabelText(uz("xr_rfq_title")), { target: { value: "Kalava" } });
    fireEvent.submit(container.querySelector("#xrRfqForm")!);

    expect(await screen.findByText(uz("xr_e_save"))).toBeTruthy();
    expect((screen.getByLabelText(uz("xr_rfq_title")) as HTMLInputElement).value).toBe("Kalava");
  });

  it("compares the offers and opens an order from the accepted one", async () => {
    vi.spyOn(dialogs, "confirm").mockResolvedValue(true);
    const quotes = { ok: true, rfq: { title: "Paxta ipi" }, quotes: [{ id: "q1", sellerName: HOSTILE, price: 5, bestPrice: true }] };
    const { container } = await renderCabinet({ "/api/buyer/quotes": quotes, "/api/buyer/deal": { ok: true } });
    openView(container, RFQ_VIEW);

    fireEvent.click(screen.getByRole("button", { name: uz("xr_rfq_open") }));
    fireEvent.click(await screen.findByRole("button", { name: uz("xr_q_accept") }));

    await waitFor(() => expect(postsTo("/api/buyer/deal")[0]).toEqual({ ...WHO, quoteId: "q1" }));
    expect(postsTo("/api/buyer/quotes")[0]).toEqual({ ...WHO, rfqId: "r1" });
    await waitFor(() => expect(container.querySelector("#xrViewTitle")?.textContent).toBe(uz("xr_v_orders")));
    expect(document.querySelector("img")).toBeNull();
  });
});

describe("XaridorPage orders, threads and profile", () => {
  it("shows an order with its stage rail and saves a stage change", async () => {
    const { container } = await renderCabinet({ "/api/buyer/deal/update": { ok: true } });
    openView(container, ORDERS_VIEW);
    expect(container.querySelectorAll(".mk-railbar .mk-step")).toHaveLength(3);
    expect(inView(container, "orders").getByText(HOSTILE)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(uz("xr_or_stage")), { target: { value: "closed" } });
    fireEvent.change(screen.getByLabelText(uz("xr_or_note")), { target: { value: " Qabul qilindi " } });
    fireEvent.click(inView(container, "orders").getByRole("button", { name: uz("xr_or_send") }));

    await waitFor(() =>
      expect(postsTo("/api/buyer/deal/update")[0]).toEqual({ ...WHO, id: "d1", stage: "closed", note: "Qabul qilindi" }),
    );
  });

  it("warns when a reply cannot be sent", async () => {
    const alert = vi.spyOn(dialogs, "alert").mockResolvedValue();
    const { container } = await renderCabinet({ "/api/buyer/inquiry/ask": 500 });
    openView(container, THREADS_VIEW);
    expect(container.querySelector("#view-threads")?.textContent).toContain(HOSTILE);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText(uz("xr_th_answered"))).toBeTruthy();

    fireEvent.change(screen.getByLabelText(uz("xr_th_reply")), { target: { value: "Rahmat" } });
    fireEvent.click(screen.getByRole("button", { name: uz("xr_th_send") }));

    await waitFor(() => expect(alert).toHaveBeenCalledWith(uz("xr_e_save")));
    expect(postsTo("/api/buyer/inquiry/ask")[0]).toEqual({ ...WHO, id: "i1", text: "Rahmat" });
  });

  it("saves the profile, and never links a supplier's unsafe address", async () => {
    const saved = { ok: true, buyer: { ...HOME.buyer, name: "Beta Trade" } };
    const { container } = await renderCabinet({ "/api/buyer/profile": saved });
    openView(container, PROFILE_VIEW);
    expect([...container.querySelectorAll(".rq-contact a")].map(link => link.getAttribute("href"))).toEqual([
      "tel:+998900000000",
    ]);

    fireEvent.change(screen.getByLabelText(uz("br_f_name")), { target: { value: "" } });
    fireEvent.submit(container.querySelector("#xrPrForm")!);
    expect(await screen.findByText(uz("xr_e_name"))).toBeTruthy();

    fireEvent.change(screen.getByLabelText(uz("br_f_name")), { target: { value: "Beta Trade" } });
    fireEvent.submit(container.querySelector("#xrPrForm")!);

    expect(await screen.findByText(uz("xr_pr_saved"))).toBeTruthy();
    expect(postsTo("/api/buyer/profile")[0]).toMatchObject({ ...WHO, name: "Beta Trade", phone: "+998901112233" });
    expect(container.querySelector("#xrBrandSub")?.textContent).toBe("Beta Trade");
  });

  it("shows the rights panel with the buyer's own credentials", async () => {
    const { container } = await renderCabinet({ "/api/legal/export": { ok: true, data: {} } });

    openView(container, LEGAL_VIEW);

    expect(await screen.findByRole("heading", { name: PANEL_TEXT.h[0] })).toBeTruthy();
    expect(postsTo("/api/legal/export")[0]).toEqual(WHO);
  });
});
