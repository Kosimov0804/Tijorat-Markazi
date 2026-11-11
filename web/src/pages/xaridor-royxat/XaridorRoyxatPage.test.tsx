import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { T_BREG } from "@legacy/markets-i18n.js";
import { GATE_TEXT } from "../../shell/legal/gateText";
import { HOSTILE, renderPage, stubApi } from "../../test/renderPage";
import { XaridorRoyxatPage } from "./XaridorRoyxatPage";

const text = (key: string): string => T_BREG[key]![0];

const APPLICATION = { ref: "TM-BBBB-0002", name: HOSTILE, login: "xarid", status: "pending", kind: "buyer" };
const VALID: Record<string, string> = {
  brName: "Xarid MChJ",
  brPhone: "+998 71 200 00 00",
  brContact: "Vali Aliyev",
  brEmail: "vali@xarid.uz",
  brCPhone: "+998 90 000 00 00",
  brLogin: "xarid",
  brPass: "secret-pass",
  brPass2: "secret-pass",
};

type FetchStub = ReturnType<typeof vi.fn>;

const bodiesPostedTo = (path: string): unknown[] =>
  (fetch as unknown as FetchStub).mock.calls
    .filter(([url, options]) => url === path && options)
    .map(([, options]) => JSON.parse(String((options as RequestInit).body)));

function renderForm(): HTMLElement {
  return renderPage(<XaridorRoyxatPage />).container;
}

function fill(container: HTMLElement, values: Record<string, string>): void {
  Object.entries(values).forEach(([id, value]) => {
    fireEvent.change(container.querySelector(`#${id}`)!, { target: { value } });
  });
}

async function submitAndAccept(container: HTMLElement): Promise<void> {
  fireEvent.submit(container.querySelector("#brForm")!);
  const accept = await screen.findByRole<HTMLButtonElement>("button", { name: GATE_TEXT.accept[0] });
  await waitFor(() => expect(accept.disabled).toBe(false));
  fireEvent.click(accept);
}

describe("XaridorRoyxatPage", () => {
  it("sends the buyer application after the offer is accepted", async () => {
    stubApi({ "/api/register/buyer": { ok: true, application: APPLICATION } });
    const container = renderForm();
    fill(container, VALID);

    await submitAndAccept(container);

    expect(await screen.findByText("TM-BBBB-0002")).toBeTruthy();
    expect(bodiesPostedTo("/api/register/buyer")).toEqual([
      {
        name: "Xarid MChJ",
        phone: "+998 71 200 00 00",
        region: "",
        about: "",
        contactName: "Vali Aliyev",
        role: "",
        email: "vali@xarid.uz",
        contactPhone: "+998 90 000 00 00",
        login: "xarid",
        password: "secret-pass",
        consent: true,
      },
    ]);
    expect(screen.getByText(text("br_done_p"))).toBeTruthy();
    /* The server sent no e-mail back, so the one just typed fills the checker. */
    expect(container.querySelector<HTMLInputElement>("#brRef")!.value).toBe("TM-BBBB-0002");
    expect(container.querySelector<HTMLInputElement>("#brStEmail")!.value).toBe("vali@xarid.uz");
    expect(screen.getByText(HOSTILE)).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  it.each([
    ["rg_e_name", { brName: "" }],
    ["br_e_phone", { brPhone: "  " }],
    ["rg_e_contact", { brContact: "" }],
    ["rg_e_email", { brEmail: "nope" }],
    ["rg_e_login", { brLogin: "-bad" }],
    ["rg_e_pass", { brPass: "1234567", brPass2: "1234567" }],
    ["rg_e_pass2", { brPass2: "different-pass" }],
  ])("explains %s before any request is made", async (key, broken) => {
    stubApi({});
    const container = renderForm();
    fill(container, { ...VALID, ...broken });

    await submitAndAccept(container);

    expect(await screen.findByText(text(key))).toBeTruthy();
    expect(bodiesPostedTo("/api/register/buyer")).toHaveLength(0);
  });

  it("explains a refused application and reports an unmapped code to the console", async () => {
    stubApi({ "/api/register/buyer": { error: "brand_new_code" } });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const container = renderForm();
    fill(container, VALID);

    await submitAndAccept(container);

    expect(await screen.findByText(text("rg_e_generic"))).toBeTruthy();
    expect(warn).toHaveBeenCalledWith("[register] unmapped server error:", "brand_new_code");
  });

  it("treats an answer that is not JSON as a server that needs attention", async () => {
    stubApi({});
    const container = renderForm();
    fill(container, VALID);
    const answerNormally = fetch as unknown as (url: string) => Promise<unknown>;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url !== "/api/register/buyer") return answerNormally(url);
        return { ok: false, status: 502, json: async () => Promise.reject(new SyntaxError("not json")) };
      }),
    );

    await submitAndAccept(container);

    expect(await screen.findByText(text("rg_e_unavailable"))).toBeTruthy();
  });

  it("sends an approved buyer to the buyer cabinet and a company to its own", async () => {
    stubApi({
      "/api/register/status": { ok: true, application: { ...APPLICATION, status: "approved", decided: 1767225600000 } },
    });
    const container = renderForm();
    fill(container, { brRef: "TM-BBBB-0002", brStEmail: "vali@xarid.uz" });

    fireEvent.submit(container.querySelector("#brStatusForm")!);

    const cabinet = await screen.findByRole("link", { name: text("br_go_cabinet") });
    expect(cabinet.getAttribute("href")).toBe("xaridor.html");
    expect(screen.getByText(text("rg_decided"))).toBeTruthy();

    stubApi({
      "/api/register/status": { ok: true, application: { ...APPLICATION, kind: "company", status: "approved" } },
    });
    fireEvent.submit(container.querySelector("#brStatusForm")!);

    const companyCabinet = await screen.findByRole("link", { name: text("rg_go_cabinet") });
    expect(companyCabinet.getAttribute("href")).toBe("company.html");
  });

  it("marks a rejected application and shows the reason as text", async () => {
    stubApi({
      "/api/register/status": { ok: true, application: { ...APPLICATION, status: "rejected", reason: HOSTILE } },
    });
    const container = renderForm();
    fill(container, { brRef: "TM-BBBB-0002", brStEmail: "vali@xarid.uz" });

    fireEvent.submit(container.querySelector("#brStatusForm")!);

    expect(await screen.findByText(text("rg_st_rejected"))).toBeTruthy();
    expect(container.querySelector(".rg-status")!.className).toBe("rg-status is-bad");
    expect(container.querySelector(".rg-reason")!.textContent).toContain(HOSTILE);
    expect(screen.queryByRole("link", { name: text("br_go_cabinet") })).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });
});
