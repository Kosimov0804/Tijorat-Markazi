import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { T_BOZOR } from "@legacy/markets-i18n.js";
import { dialogs } from "../../shell/dialogs";
import { HOSTILE, renderPage, stubApi } from "../../test/renderPage";
import { BozorPage } from "./BozorPage";

const uz = (key: string): string => T_BOZOR[key]![0];

const CATALOG = "/api/bozor/products?";
const RFQS = "/api/bozor/rfqs?";
const MAYIZ = {
  id: "p1",
  title: "Mayiz",
  company: "Alfa",
  channels: ["b2b", "export"],
  category: "Quruq meva",
  unit: "kg",
  currency: "USD",
  price: 2,
  certificates: ["Halal"],
};
const IP = { id: "p2", title: "Ip", company: "Beta", channels: ["b2g"] };
const PRODUCTS = {
  items: [MAYIZ, IP],
  total: 2,
  facets: { sectors: ["Agro"], categories: ["Quruq meva"], regions: ["Namangan"] },
};
const COMPANY = { login: "alfa", password: "secret", id: "c1", name: "Alfa", sector: "Agro" };
const CABINET = {
  ok: true,
  trust: { level: "A", badge: "Verified", products: 1, deals: 0 },
  exportReadiness: { score: 60, blocks: [{ key: "Sertifikat", pct: 40 }] },
  products: [{ id: "p1", title: "Mayiz", channels: ["b2b"], status: "live" }],
  inquiries: [{ id: "i1", status: "new", buyerName: HOSTILE, buyerEmail: "javascript:alert(1)" }],
};

type FetchStub = ReturnType<typeof vi.fn>;

const postsTo = (path: string): Record<string, unknown>[] =>
  (fetch as unknown as FetchStub).mock.calls
    .filter(([url, options]) => url === path && options)
    .map(([, options]) => JSON.parse((options as { body: string }).body) as Record<string, unknown>);

const openTab = (key: string): void => {
  fireEvent.click(screen.getByRole("tab", { name: uz(key) }));
};

async function renderCatalog(routes: Record<string, unknown> = {}) {
  stubApi({ [CATALOG]: PRODUCTS, [RFQS]: { items: [] }, ...routes });
  const view = renderPage(<BozorPage />);
  await screen.findByText("Mayiz");
  return view;
}

describe("BozorPage catalogue", () => {
  it("lists the products with their count and filter options", async () => {
    const { container } = await renderCatalog();

    expect(container.querySelectorAll("#bzGrid .mk-card")).toHaveLength(2);
    expect(container.querySelector("#bzCount")?.textContent).toBe(uz("bz_count").replace("{n}", "2"));
    expect(screen.getByRole("option", { name: "Namangan" })).toBeTruthy();
  });

  it("asks the server again when a channel is chosen", async () => {
    const { container } = await renderCatalog({ "/api/bozor/products?channel=b2b": { items: [MAYIZ], total: 1 } });

    fireEvent.click(container.querySelector('#bzChannel [data-value="b2b"]')!);

    await waitFor(() => expect(screen.queryByText("Ip")).toBeNull());
    expect(screen.getByText("Mayiz")).toBeTruthy();
    expect(screen.getByRole("option", { name: "Namangan" })).toBeTruthy();
  });

  it("searches after the visitor stops typing", async () => {
    const { container } = await renderCatalog({ "/api/bozor/products?q=ip": { items: [IP], total: 1 } });

    fireEvent.change(container.querySelector("#bzQ")!, { target: { value: " ip " } });

    await waitFor(() => expect(screen.queryByText("Mayiz")).toBeNull());
    expect(screen.getByText("Ip")).toBeTruthy();
  });

  it("shows the empty note when the request fails", async () => {
    stubApi({ [CATALOG]: 500 });

    renderPage(<BozorPage />);

    expect(await screen.findByText(uz("bz_empty"))).toBeTruthy();
  });

  it("renders hostile catalogue values as text", async () => {
    stubApi({ [CATALOG]: { items: [{ id: "x", title: HOSTILE, company: HOSTILE, channels: [HOSTILE] }], total: 1 } });

    const { container } = renderPage(<BozorPage />);

    await screen.findAllByText(HOSTILE);
    expect(container.querySelector("#bzGrid img")).toBeNull();
  });

  it("shows the live figures in the hero", async () => {
    const { container } = await renderCatalog({
      "/api/market/pulse": { ok: true, bozor: { products: 7, rfqs: 3, deals: 1, matchRate: 50 } },
    });

    await waitFor(() => expect(container.querySelectorAll("#bzPulse div")).toHaveLength(4));
    expect(container.querySelector("#bzPulse")?.textContent).toContain("50%");
  });
});

describe("BozorPage RFQ exchange", () => {
  it("carries a product into the RFQ form when a quote is requested", async () => {
    const { container } = await renderCatalog();

    fireEvent.click(screen.getByText("Mayiz"));
    fireEvent.click(await screen.findByRole("button", { name: uz("bz_act_rfq") }));

    await waitFor(() => expect(container.querySelector<HTMLInputElement>("#rqTitle")?.value).toBe("Mayiz"));
    expect(container.querySelector<HTMLInputElement>("#rqCategory")?.value).toBe("Quruq meva");
    expect(container.querySelector<HTMLSelectElement>("#rqChannel")?.value).toBe("b2b");
    expect(container.querySelector<HTMLInputElement>("#rqCerts")?.value).toBe("Halal");
    expect(document.querySelector("#mkDrawer")).toBeNull();
    expect(screen.getByRole("tab", { name: uz("bz_tab_rfq") }).className).toContain("is-on");
  });

  it("publishes an RFQ with the buyer's identity and shows the instant matches", async () => {
    localStorage.setItem("mk_email", "ali@example.uz");
    const { container } = await renderCatalog({
      "/api/bozor/rfq": {
        ok: true,
        matches: [{ score: 80, confidence: 70, reasons: ["Halal"], product: { title: "Mayiz", company: "Alfa" } }],
      },
    });
    openTab("bz_tab_rfq");
    fireEvent.change(container.querySelector("#rqTitle")!, { target: { value: "Mayiz kerak" } });
    fireEvent.change(container.querySelector("#rqQty")!, { target: { value: "500" } });

    fireEvent.submit(container.querySelector("#bzRfqForm")!);

    expect(await screen.findByText(uz("bz_rfq_ok").replace("{n}", "1"))).toBeTruthy();
    expect(postsTo("/api/bozor/rfq")[0]).toMatchObject({
      title: "Mayiz kerak",
      qty: "500",
      channel: "b2b",
      currency: "UZS",
      email: "ali@example.uz",
    });
    expect(container.querySelector("#bzRfqMatches .mk-match")).not.toBeNull();
    expect(container.querySelector<HTMLInputElement>("#rqTitle")?.value).toBe("");
  });

  it("refuses an RFQ without a title", async () => {
    const { container } = await renderCatalog();
    openTab("bz_tab_rfq");
    fireEvent.change(container.querySelector("#rqTitle")!, { target: { value: "   " } });

    fireEvent.submit(container.querySelector("#bzRfqForm")!);

    expect(await screen.findByText(uz("bz_need_title"))).toBeTruthy();
    expect(postsTo("/api/bozor/rfq")).toHaveLength(0);
  });

  it("says so when the RFQ could not be sent and keeps what was typed", async () => {
    const { container } = await renderCatalog({ "/api/bozor/rfq": 500 });
    openTab("bz_tab_rfq");
    fireEvent.change(container.querySelector("#rqTitle")!, { target: { value: "Mayiz kerak" } });

    fireEvent.submit(container.querySelector("#bzRfqForm")!);

    expect(await screen.findByText(uz("bz_rfq_fail"))).toBeTruthy();
    expect(container.querySelector<HTMLInputElement>("#rqTitle")?.value).toBe("Mayiz kerak");
  });

  it("opens an RFQ with its matched suppliers and quotes", async () => {
    await renderCatalog({
      [RFQS]: { items: [{ id: "r/1", title: "Paxta kerak", channel: "b2b", status: "open", buyerName: "Beta" }] },
      "/api/bozor/rfq/matches?id=r%2F1": {
        rfq: { id: "r/1", title: "Paxta kerak", channel: "b2b", status: "open" },
        matches: [],
      },
      "/api/bozor/quotes?rfqId=r%2F1": { quotes: [{ sellerName: "Alfa", price: 5, currency: "USD", bestPrice: true }] },
    });
    openTab("bz_tab_rfq");

    fireEvent.click(await screen.findByText("Paxta kerak"));

    expect(await screen.findByText(uz("bz_no_match"))).toBeTruthy();
    expect(document.querySelector("#mkDrawerBody tr.is-best")?.textContent).toContain("Alfa");
  });
});

describe("BozorPage seller cabinet", () => {
  it("keeps the sign-in fields and explains a refused login", async () => {
    const { container } = await renderCatalog({ "/api/company/login": { ok: false, error: "invalid" } });
    openTab("bz_tab_seller");
    fireEvent.change(container.querySelector("#bzLogin")!, { target: { value: "alfa" } });
    fireEvent.change(container.querySelector("#bzPass")!, { target: { value: "wrong" } });

    fireEvent.click(container.querySelector("#bzIn")!);

    expect(await screen.findByText(uz("bz_login_fail"))).toBeTruthy();
    expect(container.querySelector("#bzLogin")).not.toBeNull();
    expect(sessionStorage.getItem("mk_co")).toBeNull();
  });

  it("signs a company in and opens its cabinet", async () => {
    const { container } = await renderCatalog({
      "/api/company/login": { ok: true, company: { id: "c1", name: "Alfa", sector: "Agro" } },
      "/api/bozor/seller": CABINET,
    });
    openTab("bz_tab_seller");
    fireEvent.change(container.querySelector("#bzLogin")!, { target: { value: " alfa " } });
    fireEvent.change(container.querySelector("#bzPass")!, { target: { value: "secret" } });

    fireEvent.click(container.querySelector("#bzIn")!);

    expect(await screen.findByText(uz("bz_my_products"))).toBeTruthy();
    expect(postsTo("/api/company/login")[0]).toEqual({ login: "alfa", password: "secret" });
    expect(postsTo("/api/bozor/seller")[0]).toEqual({ login: "alfa", password: "secret" });
  });

  it("deletes a product only after the seller confirms", async () => {
    sessionStorage.setItem("mk_co", JSON.stringify(COMPANY));
    const confirm = vi.spyOn(dialogs, "confirm").mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const { container } = await renderCatalog({ "/api/bozor/seller": CABINET, "/api/bozor/product/delete": { ok: true } });
    openTab("bz_tab_seller");

    fireEvent.click(await screen.findByRole("button", { name: uz("bz_delete") }));
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    expect(postsTo("/api/bozor/product/delete")).toHaveLength(0);
    fireEvent.click(container.querySelector('[data-del="p1"]')!);

    await waitFor(() =>
      expect(postsTo("/api/bozor/product/delete")).toEqual([{ id: "p1", login: "alfa", password: "secret" }]),
    );
  });

  it("publishes a product with its channels", async () => {
    sessionStorage.setItem("mk_co", JSON.stringify(COMPANY));
    const { container } = await renderCatalog({ "/api/bozor/seller": CABINET, "/api/bozor/product": { ok: true } });
    openTab("bz_tab_seller");
    await screen.findByText(uz("bz_add_product"));
    fireEvent.change(container.querySelector("#pTitle")!, { target: { value: "Yangi mayiz" } });
    fireEvent.click(container.querySelector('.pCh[value="export"]')!);

    fireEvent.submit(container.querySelector("#bzProductForm")!);

    await waitFor(() => expect(postsTo("/api/bozor/product")).toHaveLength(1));
    expect(postsTo("/api/bozor/product")[0]).toMatchObject({
      title: "Yangi mayiz",
      channels: ["b2b", "export"],
      localMade: false,
      login: "alfa",
    });
  });

  it("shows a buyer's details as text and never links an unsafe address", async () => {
    sessionStorage.setItem("mk_co", JSON.stringify(COMPANY));
    const { container } = await renderCatalog({ "/api/bozor/seller": CABINET });
    openTab("bz_tab_seller");

    await screen.findByText(HOSTILE);

    expect(container.querySelector("#bzSeller img")).toBeNull();
    expect(container.querySelector('#bzSeller a[href^="javascript"]')).toBeNull();
    expect(screen.getByText(/javascript:alert\(1\)/).tagName).toBe("SPAN");
  });

  it("signs the company out when the server no longer accepts it", async () => {
    sessionStorage.setItem("mk_co", JSON.stringify(COMPANY));
    const { container } = await renderCatalog({ "/api/bozor/seller": { ok: false } });
    openTab("bz_tab_seller");

    await waitFor(() => expect(container.querySelector("#bzLogin")).not.toBeNull());
    expect(sessionStorage.getItem("mk_co")).toBeNull();
    expect(screen.getByText(uz("bz_login_needed"))).toBeTruthy();
  });
});

describe("BozorPage intelligence", () => {
  it("says there is no data when the figures cannot be loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url === "/api/bozor/intel") throw new Error("offline");
        return { ok: true, status: 200, json: async () => (url === CATALOG ? PRODUCTS : {}) };
      }),
    );
    renderPage(<BozorPage />);
    await screen.findByText("Mayiz");

    openTab("bz_tab_intel");

    expect(await screen.findByText(T_BOZOR.mk_nodata![0])).toBeTruthy();
  });

  it("ranks supply gaps by their demand-to-supply ratio", async () => {
    const { container } = await renderCatalog({
      "/api/bozor/intel": {
        headline: { liveProducts: 4 },
        funnel: { search: 9 },
        supplyGaps: [{ label: "Mayiz", ratio: 3, demand: 6, supply: 2 }],
      },
    });

    openTab("bz_tab_intel");

    await screen.findByText(uz("bz_supply_gap"));
    expect(container.querySelector("#bzIntel .mk-rank.is-gap b")?.textContent).toMatch(/^6[.,]0↔2$/);
    expect(container.querySelector("#bzIntel .mk-kpi.is-hero b")?.textContent).toBe("4");
  });
});
