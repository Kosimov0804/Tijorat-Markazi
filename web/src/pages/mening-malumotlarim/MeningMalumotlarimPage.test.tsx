import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { T_DSR } from "@legacy/dsr-i18n.js";
import { PANEL_TEXT } from "../../shell/legal/panelText";
import { goTo } from "../../shell/navigate";
import { HOSTILE, renderPage, stubApi } from "../../test/renderPage";
import { MeningMalumotlarimPage } from "./MeningMalumotlarimPage";

vi.mock("../../shell/navigate", () => ({ goTo: vi.fn(), replaceWith: vi.fn() }));

const text = (key: string): string => T_DSR[key]![0];

const EXPORT = {
  ok: true,
  data: { rightsRequests: [{ ref: HOSTILE, kind: HOSTILE, status: "open", due: 0 }] },
};

type FetchStub = ReturnType<typeof vi.fn>;

const bodiesPostedTo = (path: string): unknown[] =>
  (fetch as unknown as FetchStub).mock.calls
    .filter(([url]) => url === path)
    .map(([, options]) => JSON.parse(String((options as RequestInit).body)));

function signIn(login: string, password: string): void {
  fireEvent.change(screen.getByLabelText(text("dsr_lg")), { target: { value: login } });
  fireEvent.change(screen.getByLabelText(text("dsr_pw")), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: text("dsr_login_btn") }));
}

describe("MeningMalumotlarimPage", () => {
  it("asks who is asking, then shows the rights panel without storing the credentials", async () => {
    stubApi({ "/api/legal/export": EXPORT });
    renderPage(<MeningMalumotlarimPage />);
    expect(screen.getByText(text("dsr_login_why"))).toBeTruthy();

    signIn(" alfa ", "secret-pass");

    expect(await screen.findByRole("heading", { name: PANEL_TEXT.h[0] })).toBeTruthy();
    expect(bodiesPostedTo("/api/legal/export")[0]).toEqual({ login: "alfa", password: "secret-pass", tier: "" });
    expect(sessionStorage.length).toBe(0);
    expect(screen.getByRole("heading", { name: PANEL_TEXT.fix_h[0] })).toBeTruthy();
  });

  it("refuses credentials the server cannot place", async () => {
    stubApi({ "/api/legal/export": { error: "invalid" } });
    renderPage(<MeningMalumotlarimPage />);

    signIn("alfa", "wrong");

    expect(await screen.findByText(text("dsr_login_bad"))).toBeTruthy();
    expect(screen.queryByRole("heading", { name: PANEL_TEXT.h[0] })).toBeNull();
  });

  it("refuses when the server cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    renderPage(<MeningMalumotlarimPage />);

    signIn("alfa", "secret-pass");

    expect(await screen.findByText(text("dsr_login_bad"))).toBeTruthy();
  });

  it("uses a cabinet session already in this browser, buyer after company", async () => {
    stubApi({ "/api/legal/export": EXPORT });
    sessionStorage.setItem("kg_co", "{not json");
    sessionStorage.setItem("kg_by", JSON.stringify({ login: "xarid", password: "pw-12345" }));

    renderPage(<MeningMalumotlarimPage />);

    expect(await screen.findByRole("heading", { name: PANEL_TEXT.h[0] })).toBeTruthy();
    expect(bodiesPostedTo("/api/legal/export")[0]).toEqual({ login: "xarid", password: "pw-12345", tier: "buyer" });
    expect(screen.queryByText(text("dsr_login_h"))).toBeNull();
  });

  it("renders hostile request rows as text", async () => {
    stubApi({ "/api/legal/export": EXPORT });
    const { container } = renderPage(<MeningMalumotlarimPage />);

    signIn("alfa", "secret-pass");

    await screen.findByRole("heading", { name: PANEL_TEXT.h[0] });
    expect(screen.getAllByText(HOSTILE)).toHaveLength(2);
    expect(container.querySelector("img")).toBeNull();
  });

  it("clears the cabinet sessions and goes home after consent is withdrawn", async () => {
    stubApi({ "/api/legal/export": EXPORT, "/api/legal/withdraw": { ok: true } });
    sessionStorage.setItem("kg_co", JSON.stringify({ login: "alfa", password: "secret-pass" }));
    const { container } = renderPage(<MeningMalumotlarimPage />);
    await screen.findByRole("heading", { name: PANEL_TEXT.h[0] });

    fireEvent.change(container.querySelector("#lgsWord")!, { target: { value: PANEL_TEXT.wd_word[0] } });
    fireEvent.click(screen.getByRole("button", { name: PANEL_TEXT.wd_btn[0] }));

    await waitFor(() => expect(goTo).toHaveBeenCalledWith("index.html"), { timeout: 3000 });
    expect(sessionStorage.getItem("kg_co")).toBeNull();
  });
});
