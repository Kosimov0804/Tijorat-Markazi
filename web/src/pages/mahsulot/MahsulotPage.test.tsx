import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { T_PRODUCT } from "@legacy/markets-i18n.js";
import { HOSTILE, renderPage, setSearch, stubApi } from "../../test/renderPage";
import { MahsulotPage } from "./MahsulotPage";

const ITEM = "/api/showroom/item?id=p1";
const PRODUCT = {
  ok: true,
  product: { id: "p1", name: "Paxta", trade: "export" },
  company: { id: "c1", name: "Alfa MChJ", products: 3 },
  more: [{ id: "p/2", name: "Ip", trade: "import" }],
};

type FetchStub = ReturnType<typeof vi.fn>;

const postsTo = (path: string): RequestInit[] =>
  (fetch as unknown as FetchStub).mock.calls
    .filter(([url, options]) => url === path && options)
    .map(([, options]) => options as RequestInit);

async function renderProduct() {
  setSearch("?id=p1");
  const view = renderPage(<MahsulotPage />);
  await screen.findByRole("heading", { level: 1, name: "Paxta" });
  return view;
}

describe("MahsulotPage", () => {
  afterEach(() => setSearch(""));

  it("shows the product with its crumbs, title and related items", async () => {
    stubApi({ [ITEM]: PRODUCT });

    const { container } = await renderProduct();

    await waitFor(() => expect(document.title).toBe("Paxta — Alfa MChJ — TIJORAT MARKAZI"));
    expect(container.querySelector("#pdCrumbCompany")?.getAttribute("href")).toBe("showroom.html?company=Alfa%20MChJ");
    expect(screen.getByText("Ip").closest("a")?.getAttribute("href")).toBe("mahsulot.html?id=p%2F2");
  });

  it("refuses to send an inquiry with no way to reach the buyer", async () => {
    stubApi({ [ITEM]: PRODUCT });
    const { container } = await renderProduct();

    fireEvent.change(container.querySelector("#pdName")!, { target: { value: "Ali" } });
    fireEvent.submit(container.querySelector("#pdForm")!);

    expect(await screen.findByText(T_PRODUCT.pd_need_contact![0])).toBeTruthy();
    expect(postsTo("/api/bozor/inquiry")).toHaveLength(0);
  });

  it("sends the inquiry, remembers the buyer and clears the message", async () => {
    stubApi({
      [ITEM]: PRODUCT,
      "/api/bozor/inquiry": { ok: true, viewKey: "key-1" },
      "/api/bozor/inquiry/mine": { items: [] },
    });
    const { container } = await renderProduct();
    const message = container.querySelector<HTMLTextAreaElement>("#pdMessage")!;

    fireEvent.change(container.querySelector("#pdName")!, { target: { value: "Ali" } });
    fireEvent.change(container.querySelector("#pdEmail")!, { target: { value: "ali@x.uz" } });
    fireEvent.change(message, { target: { value: "Narx?" } });
    fireEvent.submit(container.querySelector("#pdForm")!);

    await waitFor(() => expect(localStorage.getItem("mk_iqkey")).toBe("key-1"));
    const body = JSON.parse(String(postsTo("/api/bozor/inquiry")[0].body)) as Record<string, string>;
    expect(body).toMatchObject({ companyId: "c1", productId: "p1", source: "showroom", email: "ali@x.uz", message: "Narx?", viewKey: "" });
    expect(localStorage.getItem("mk_email")).toBe("ali@x.uz");
    expect(localStorage.getItem("mk_name")).toBe("Ali");
    await waitFor(() => expect(message.value).toBe(""));
  });

  it("shows the buyer's thread, keeping only this company's items", async () => {
    localStorage.setItem("mk_email", "ali@x.uz");
    localStorage.setItem("mk_iqkey", "key-1");
    stubApi({
      [ITEM]: PRODUCT,
      "/api/bozor/inquiry/mine": {
        items: [
          { productId: "p1", status: "answered", created: 1, message: "Bizniki", replies: [{ by: "Alfa", t: 2, text: HOSTILE }] },
          { productId: "other", companyName: "Boshqa", status: "new", created: 3, message: "Begona" },
        ],
      },
    });

    const { container } = await renderProduct();

    expect(await screen.findByText("Bizniki")).toBeTruthy();
    expect(screen.queryByText("Begona")).toBeNull();
    expect(screen.getByText(HOSTILE)).toBeTruthy();
    expect(container.querySelector("#pdThread img")).toBeNull();
    const asked = JSON.parse(String(postsTo("/api/bozor/inquiry/mine")[0].body)) as Record<string, string>;
    expect(asked).toMatchObject({ viewKey: "key-1", email: "ali@x.uz" });
  });

  it("sends one inquiry when the form is submitted twice quickly", async () => {
    stubApi({ [ITEM]: PRODUCT, "/api/bozor/inquiry": { ok: true } });
    const { container } = await renderProduct();
    fireEvent.change(container.querySelector("#pdEmail")!, { target: { value: "ali@x.uz" } });

    fireEvent.submit(container.querySelector("#pdForm")!);
    fireEvent.submit(container.querySelector("#pdForm")!);

    await waitFor(() => expect(container.querySelector<HTMLElement>("#pdMsg")?.hidden).toBe(false));
    expect(postsTo("/api/bozor/inquiry")).toHaveLength(1);
  });

  it("translates a shown notice when the language changes", async () => {
    stubApi({ [ITEM]: PRODUCT });
    const { container } = await renderProduct();
    fireEvent.submit(container.querySelector("#pdForm")!);
    expect(await screen.findByText(T_PRODUCT.pd_need_contact![0])).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "UZ" }));

    expect(screen.getByText(T_PRODUCT.pd_need_contact![1])).toBeTruthy();
  });
});
