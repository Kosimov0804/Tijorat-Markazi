import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HOSTILE, renderPage, stubApi } from "../../test/renderPage";
import { goTo } from "../navigate";
import { GATE_TEXT } from "./gateText";
import { LegalPanel } from "./LegalPanel";
import { PANEL_TEXT } from "./panelText";

vi.mock("../navigate", () => ({ goTo: vi.fn(), replaceWith: vi.fn() }));

const WHO = { login: "alfa", password: "secret-pass" };
const EXPORT = {
  ok: true,
  data: {
    account: { name: "Alfa" },
    applications: [{ consent: { at: Date.UTC(2026, 2, 5, 12), version: "1.2" } }],
    rightsRequests: [{ ref: "DSR-1", kind: "erase", status: "answered", answer: HOSTILE, due: Date.UTC(2026, 3, 1, 12) }],
  },
};

type FetchStub = ReturnType<typeof vi.fn>;

const bodiesPostedTo = (path: string): unknown[] =>
  (fetch as unknown as FetchStub).mock.calls
    .filter(([url]) => url === path)
    .map(([, options]) => JSON.parse(String((options as RequestInit).body)));

async function renderPanel(onWithdrawn?: () => void) {
  const view = renderPage(<LegalPanel credentials={() => WHO} showCorrection onWithdrawn={onWithdrawn} />);
  await screen.findByRole("heading", { name: PANEL_TEXT.h[0] });
  return view;
}

describe("LegalPanel", () => {
  it("shows the consent record and the request log, with hostile text as text", async () => {
    stubApi({ "/api/legal/export": EXPORT });

    const { container } = await renderPanel();

    expect(screen.getByText("2026-03-05")).toBeTruthy();
    expect(screen.getByText("1.2")).toBeTruthy();
    expect(screen.getByText("DSR-1")).toBeTruthy();
    expect(screen.getByText(PANEL_TEXT.k_erase[0])).toBeTruthy();
    expect(screen.getByText(HOSTILE)).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    expect(bodiesPostedTo("/api/legal/export")[0]).toEqual(WHO);
  });

  it("says so when no consent record exists and hides the empty request log", async () => {
    stubApi({ "/api/legal/export": { ok: true, data: {} } });

    await renderPanel();

    expect(screen.getByText(PANEL_TEXT.consent_no[0])).toBeTruthy();
    expect(screen.queryByRole("heading", { name: PANEL_TEXT.reqs_h[0] })).toBeNull();
  });

  it("reports a failed load instead of an empty panel", async () => {
    stubApi({ "/api/legal/export": 500 });

    renderPage(<LegalPanel credentials={() => WHO} />);

    expect(await screen.findByText(PANEL_TEXT.failed[0])).toBeTruthy();
  });

  it("renders nothing without credentials", async () => {
    stubApi({});

    const { container } = renderPage(<LegalPanel credentials={() => null} />);

    await waitFor(() => expect(container.innerHTML).toBe(""));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("hands the export over as a file", async () => {
    stubApi({ "/api/legal/export": EXPORT });
    const createObjectURL = vi.fn(() => "blob:export");
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    await renderPanel();

    fireEvent.click(screen.getByRole("button", { name: PANEL_TEXT.export_btn[0] }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("files an erasure request with the note and quotes its reference", async () => {
    stubApi({
      "/api/legal/export": EXPORT,
      "/api/legal/erase": { ok: true, ref: "DSR-9", due: Date.UTC(2026, 4, 20, 12) },
    });
    const { container } = await renderPanel();

    fireEvent.change(container.querySelector("#lgsNote")!, { target: { value: "  iltimos  " } });
    fireEvent.click(screen.getByRole("button", { name: PANEL_TEXT.erase_btn[0] }));

    expect(await screen.findByText(/DSR-9 · .*2026-05-20/)).toBeTruthy();
    expect(bodiesPostedTo("/api/legal/erase")).toEqual([{ ...WHO, note: "iltimos" }]);
    await waitFor(() => expect(bodiesPostedTo("/api/legal/export")).toHaveLength(2));
  });

  it("refuses to withdraw consent until the confirmation word is typed", async () => {
    stubApi({ "/api/legal/export": EXPORT, "/api/legal/withdraw": { ok: true } });
    await renderPanel();

    fireEvent.click(screen.getByRole("button", { name: PANEL_TEXT.wd_btn[0] }));

    expect(screen.getByText(PANEL_TEXT.wd_need[0])).toBeTruthy();
    expect(bodiesPostedTo("/api/legal/withdraw")).toHaveLength(0);
  });

  it("withdraws consent and signs the person out", async () => {
    stubApi({ "/api/legal/export": EXPORT, "/api/legal/withdraw": { ok: true } });
    sessionStorage.setItem("kg_co", JSON.stringify(WHO));
    const { container } = await renderPanel();

    fireEvent.change(container.querySelector("#lgsWord")!, { target: { value: " qaytarib olaman " } });
    fireEvent.click(screen.getByRole("button", { name: PANEL_TEXT.wd_btn[0] }));

    expect(await screen.findByText(PANEL_TEXT.wd_bye[0])).toBeTruthy();
    await waitFor(() => expect(goTo).toHaveBeenCalledWith("index.html"), { timeout: 3000 });
    expect(sessionStorage.getItem("kg_co")).toBeNull();
    expect(bodiesPostedTo("/api/legal/withdraw")).toEqual([WHO]);
  });

  it("says when consent was already withdrawn", async () => {
    stubApi({ "/api/legal/export": EXPORT, "/api/legal/withdraw": { error: "already_withdrawn" } });
    const { container } = await renderPanel();

    fireEvent.change(container.querySelector("#lgsWord")!, { target: { value: PANEL_TEXT.wd_word[0] } });
    fireEvent.click(screen.getByRole("button", { name: PANEL_TEXT.wd_btn[0] }));

    expect(await screen.findByText(PANEL_TEXT.wd_already[0])).toBeTruthy();
    expect(goTo).not.toHaveBeenCalled();
  });

  it("opens the offer for re-reading without an acceptance prompt", async () => {
    stubApi({ "/api/legal/export": EXPORT });
    await renderPanel();

    fireEvent.click(screen.getByRole("button", { name: PANEL_TEXT.reread[0] }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.queryByRole("button", { name: GATE_TEXT.accept[0] })).toBeNull();
  });
});
