import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { T_BIZID } from "@legacy/markets-i18n.js";
import { HOSTILE, renderPage, setSearch, stubApi } from "../../test/renderPage";
import { BiznesIdPage } from "./BiznesIdPage";

const CARD_API = "/api/business-id?id=TM-1";
const DIRECTORY = "/api/business-id/directory";
const text = (key: string): string => T_BIZID[key]![0];

const COMPANY_CARD = {
  ok: true,
  kind: "company",
  bizId: "TM-1",
  name: "Alfa MChJ",
  sector: "Qishloq",
  assoc: { name: "Qurilish", bizId: "TM-A/1" },
  contact: { phone: "+998 (90) 111", email: "a@b.uz", website: "javascript:alert(1)" },
  showroom: [],
};

const ROWS = {
  items: [
    { bizId: "TM-A1", kind: "assoc", name: "Qurilish" },
    { bizId: "TM-C1", kind: "company", name: "Alfa", sector: "Moliya" },
    { bizId: "TM-C2", kind: "company", name: "Beta" },
  ],
};

describe("BiznesIdPage card", () => {
  afterEach(() => setSearch(""));

  it("builds safe contact links and never links a hostile website", async () => {
    setSearch("?id=TM-1");
    stubApi({ [CARD_API]: COMPANY_CARD });

    renderPage(<BiznesIdPage />);

    expect((await screen.findByText("+998 (90) 111")).getAttribute("href")).toBe("tel:+99890111");
    expect(screen.getByText("a@b.uz").getAttribute("href")).toBe("mailto:a@b.uz");
    expect(screen.getByText("javascript:alert(1)").tagName).toBe("SPAN");
    await waitFor(() => expect(document.title).toBe("Alfa MChJ — Business ID"));
  });

  it("links the association and encodes the QR request", async () => {
    setSearch("?id=TM-1");
    stubApi({ [CARD_API]: COMPANY_CARD });

    renderPage(<BiznesIdPage />);

    expect((await screen.findByText("Qurilish")).getAttribute("href")).toBe("biznes-id.html?id=TM-A%2F1");
    expect(screen.getByAltText("TM-1 QR").getAttribute("src")).toBe("/api/business-id/qr.svg?id=TM-1");
  });

  it("lists members for an association card", async () => {
    setSearch("?id=TM-1");
    stubApi({
      [CARD_API]: { ok: true, kind: "assoc", bizId: "TM-1", name: "Uyushma", companies: [{ name: "Alfa", bizId: "TM-C1" }] },
    });

    renderPage(<BiznesIdPage />);

    expect((await screen.findByText("Alfa")).closest("a")?.getAttribute("href")).toBe("korxona.html?id=TM-C1");
  });

  it("prints no stray zero when the join date is zero", async () => {
    setSearch("?id=TM-1");
    stubApi({ [CARD_API]: { ...COMPANY_CARD, since: 0 } });

    const { container } = renderPage(<BiznesIdPage />);
    await screen.findByText("+998 (90) 111");

    expect(container.querySelector(".bid-num")?.textContent).not.toMatch(/0$/);
  });

  it("offers the lookup when the number is unknown", async () => {
    setSearch("?id=TM-1");
    stubApi({ [CARD_API]: { ok: false } });

    renderPage(<BiznesIdPage />);

    expect(await screen.findByText(text("bid_notfound"))).toBeTruthy();
    expect(screen.getByRole("link", { name: text("bid_lookup") }).getAttribute("href")).toBe("biznes-id.html");
  });

  it("renders hostile card values as text", async () => {
    setSearch("?id=TM-1");
    stubApi({ [CARD_API]: { ...COMPANY_CARD, name: HOSTILE, sector: HOSTILE, contact: { location: HOSTILE } } });

    const { container } = renderPage(<BiznesIdPage />);

    await screen.findByRole("heading", { level: 1, name: HOSTILE });
    expect(container.querySelector('img[src="x"]')).toBeNull();
  });
});

describe("BiznesIdPage lookup", () => {
  it("narrows the directory by kind and text together", async () => {
    stubApi({ [DIRECTORY]: ROWS });
    const { container } = renderPage(<BiznesIdPage />);
    await screen.findByText("Alfa");

    fireEvent.click(screen.getByRole("button", { name: text("bid_f_companies") }));
    expect(container.querySelectorAll(".bid-c")).toHaveLength(2);

    fireEvent.change(container.querySelector("#bidSearch")!, { target: { value: "moliya" } });
    expect(container.querySelectorAll(".bid-c")).toHaveLength(1);
    expect(screen.getByText("Alfa")).toBeTruthy();
  });

  it("reports a valid number with a link to its card", async () => {
    stubApi({
      [DIRECTORY]: ROWS,
      "/api/business-id/verify?id=TM-C1": { ok: true, bizId: "TM-C1", name: "Alfa", kind: "company" },
    });
    const { container } = renderPage(<BiznesIdPage />);

    fireEvent.change(container.querySelector("#bidInput")!, { target: { value: " TM-C1 " } });
    fireEvent.submit(container.querySelector("#bidForm")!);

    expect((await screen.findByRole("link", { name: text("bid_open_card") })).getAttribute("href")).toBe("biznes-id.html?id=TM-C1");
  });

  it("survives a directory row with no number while searching", async () => {
    stubApi({ [DIRECTORY]: { items: [{ kind: "company", name: "Raqamsiz" }, ...ROWS.items] } });
    const { container } = renderPage(<BiznesIdPage />);
    await screen.findByText("Raqamsiz");

    fireEvent.change(container.querySelector("#bidSearch")!, { target: { value: "raqam" } });

    expect(container.querySelectorAll(".bid-c")).toHaveLength(1);
  });

  it("lets only the newest check report when answers arrive out of order", async () => {
    let answerFirst: (value: unknown) => void = () => undefined;
    const first = new Promise(resolve => {
      answerFirst = resolve;
    });
    vi.stubGlobal("fetch", vi.fn((url: string) => {
      if (url.includes("verify?id=slow")) return first;
      if (url.includes("verify?id=fast")) {
        return Promise.resolve({ ok: true, json: async () => ({ ok: true, bizId: "FAST", name: "Tez", kind: "company" }) });
      }
      return Promise.resolve({ ok: true, json: async () => (url === DIRECTORY ? ROWS : { ok: false }) });
    }));
    const { container } = renderPage(<BiznesIdPage />);
    const input = container.querySelector("#bidInput")!;
    const form = container.querySelector("#bidForm")!;

    fireEvent.change(input, { target: { value: "slow" } });
    fireEvent.submit(form);
    fireEvent.change(input, { target: { value: "fast" } });
    fireEvent.submit(form);
    await screen.findByText(/Tez/);
    await act(async () => {
      answerFirst({ ok: true, json: async () => ({ ok: false, reason: "unknown" }) });
      await Promise.resolve();
    });

    expect(container.querySelector(".bid-verdict.is-ok")).not.toBeNull();
    expect(container.querySelector(".bid-verdict.is-bad")).toBeNull();
  });

  it("treats a garbled verify response as malformed", async () => {
    stubApi({ [DIRECTORY]: ROWS, "/api/business-id/verify?id=x": {} });
    const { container } = renderPage(<BiznesIdPage />);

    fireEvent.change(container.querySelector("#bidInput")!, { target: { value: "x" } });
    fireEvent.submit(container.querySelector("#bidForm")!);

    await waitFor(() => expect(container.querySelector(".bid-verdict.is-bad")).not.toBeNull());
  });
});
