import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { T_REGISTER } from "@legacy/markets-i18n.js";
import { GATE_TEXT } from "../../shell/legal/gateText";
import { HOSTILE, renderPage, stubApi } from "../../test/renderPage";
import { RoyxatdanOtishPage } from "./RoyxatdanOtishPage";

const text = (key: string): string => T_REGISTER[key]![0];

const META = {
  ok: true,
  associations: [{ id: "a/1", name: "Qurilish", i18n: { ru: "Строители" } }, { id: "a2", name: HOSTILE }],
  sectors: ["IT", "Paxta"],
};
const APPLICATION = {
  ref: "TM-AAAA-0001",
  name: HOSTILE,
  assocName: "Qurilish",
  login: "alfa",
  status: "pending",
  email: "ali@alfa.uz",
};
const VALID: Record<string, string> = {
  rgName: " Alfa MChJ ",
  rgAssoc: "a/1",
  rgSector: "IT",
  rgContact: "Ali Valiyev",
  rgEmail: "ali@alfa.uz",
  rgLogin: "ALFA",
  rgPass: "secret-pass",
  rgPass2: "secret-pass",
};

type FetchStub = ReturnType<typeof vi.fn>;

const bodiesPostedTo = (path: string): unknown[] =>
  (fetch as unknown as FetchStub).mock.calls
    .filter(([url, options]) => url === path && options)
    .map(([, options]) => JSON.parse(String((options as RequestInit).body)));

async function renderForm(): Promise<HTMLElement> {
  const { container } = renderPage(<RoyxatdanOtishPage />);
  await screen.findByRole("option", { name: "Qurilish" });
  return container;
}

function fill(container: HTMLElement, values: Record<string, string>): void {
  Object.entries(values).forEach(([id, value]) => {
    fireEvent.change(container.querySelector(`#${id}`)!, { target: { value } });
  });
}

async function submitAndAccept(container: HTMLElement): Promise<void> {
  fireEvent.submit(container.querySelector("#rgForm")!);
  const accept = await screen.findByRole<HTMLButtonElement>("button", { name: GATE_TEXT.accept[0] });
  await waitFor(() => expect(accept.disabled).toBe(false));
  fireEvent.click(accept);
}

describe("RoyxatdanOtishPage", () => {
  it("sends the application after the offer is accepted and ends on the reference", async () => {
    stubApi({ "/api/register/meta": META, "/api/register": { ok: true, application: APPLICATION } });
    const container = await renderForm();
    fill(container, VALID);

    await submitAndAccept(container);

    expect(await screen.findByText("TM-AAAA-0001")).toBeTruthy();
    expect(bodiesPostedTo("/api/register")).toEqual([
      {
        name: "Alfa MChJ",
        assocId: "a/1",
        sector: "IT",
        region: "",
        tin: "",
        website: "",
        about: "",
        contactName: "Ali Valiyev",
        role: "",
        email: "ali@alfa.uz",
        phone: "",
        login: "alfa",
        password: "secret-pass",
        consent: true,
      },
    ]);
    expect(screen.getByText(text("rg_done_p").replace("{assoc}", "Qurilish"))).toBeTruthy();
    expect(screen.getByText(text("rg_st_pending"))).toBeTruthy();
    /* The form is emptied and the status checker is one click away. */
    expect(container.querySelector<HTMLInputElement>("#rgName")!.value).toBe("");
    expect(container.querySelector<HTMLInputElement>("#rgLogin")!.value).toBe("");
    expect(container.querySelector<HTMLInputElement>("#rgConsent")!.checked).toBe(false);
    expect(container.querySelector<HTMLInputElement>("#rgRef")!.value).toBe("TM-AAAA-0001");
    expect(container.querySelector<HTMLInputElement>("#rgStEmail")!.value).toBe("ali@alfa.uz");
  });

  it("renders hostile names from the server as text", async () => {
    stubApi({ "/api/register/meta": META, "/api/register": { ok: true, application: APPLICATION } });
    const container = await renderForm();
    fill(container, VALID);

    await submitAndAccept(container);

    await screen.findByText("TM-AAAA-0001");
    expect(screen.getByRole("option", { name: HOSTILE })).toBeTruthy();
    expect(screen.getByText(HOSTILE, { selector: "dd" })).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  it("sends nothing when the offer is dismissed", async () => {
    stubApi({ "/api/register/meta": META });
    const container = await renderForm();
    fill(container, VALID);

    fireEvent.submit(container.querySelector("#rgForm")!);
    fireEvent.click(await screen.findByRole("button", { name: GATE_TEXT.cancel[0] }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(bodiesPostedTo("/api/register")).toHaveLength(0);
  });

  it.each([
    ["rg_e_name", { rgName: " " }],
    ["rg_e_assoc", { rgAssoc: "" }],
    ["rg_e_contact", { rgContact: "" }],
    ["rg_e_email", { rgEmail: "ali@alfa" }],
    ["rg_e_login", { rgLogin: "a" }],
    ["rg_e_pass", { rgPass: "short", rgPass2: "short" }],
    ["rg_e_pass2", { rgPass2: "secret-pas" }],
  ])("explains %s before any request is made", async (key, broken) => {
    stubApi({ "/api/register/meta": META });
    const container = await renderForm();
    fill(container, { ...VALID, ...broken });

    await submitAndAccept(container);

    expect(await screen.findByText(text(key))).toBeTruthy();
    expect(bodiesPostedTo("/api/register")).toHaveLength(0);
  });

  it.each([
    [{ error: "login_taken" }, "rg_e_taken"],
    [{ error: "unknown_endpoint" }, "rg_e_unavailable"],
    [{ error: "something_new" }, "rg_e_generic"],
  ])("explains the server answer %o", async (answer, key) => {
    stubApi({ "/api/register/meta": META, "/api/register": answer });
    const container = await renderForm();
    fill(container, VALID);

    await submitAndAccept(container);

    expect(await screen.findByText(text(key))).toBeTruthy();
    expect(container.querySelector<HTMLInputElement>("#rgName")!.value).toBe(" Alfa MChJ ");
  });

  it("tells a dead connection apart from a refused application", async () => {
    stubApi({ "/api/register/meta": META });
    const container = await renderForm();
    fill(container, VALID);
    const answerNormally = fetch as unknown as (url: string) => Promise<unknown>;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url === "/api/register") throw new TypeError("offline");
        return answerNormally(url);
      }),
    );

    await submitAndAccept(container);

    expect(await screen.findByText(text("rg_e_offline"))).toBeTruthy();
  });

  it("lowers the login as it is typed and flags one that breaks the rule", async () => {
    stubApi({ "/api/register/meta": META });
    const container = await renderForm();

    fill(container, { rgLogin: "A!" });

    expect(container.querySelector<HTMLInputElement>("#rgLogin")!.value).toBe("a!");
    expect(container.querySelector("#rgLoginHint")!.className).toBe("is-bad");
  });

  it("offers no association when the lists cannot be loaded", async () => {
    stubApi({ "/api/register/meta": 500 });

    renderPage(<RoyxatdanOtishPage />);

    expect(await screen.findByRole("option", { name: "—" })).toBeTruthy();
  });

  it("checks an application's status and links an approved one to the cabinet", async () => {
    stubApi({
      "/api/register/meta": META,
      "/api/register/status": {
        ok: true,
        application: { ...APPLICATION, status: "approved", reason: HOSTILE, created: 1767225600000 },
      },
    });
    const container = await renderForm();

    fireEvent.submit(container.querySelector("#rgStatusForm")!);
    expect(await screen.findByText(text("rg_e_status"))).toBeTruthy();

    fill(container, { rgRef: " TM-AAAA-0001 ", rgStEmail: "ali@alfa.uz" });
    fireEvent.submit(container.querySelector("#rgStatusForm")!);

    const cabinet = await screen.findByRole("link", { name: text("rg_go_cabinet") });
    expect(cabinet.getAttribute("href")).toBe("company.html");
    expect(bodiesPostedTo("/api/register/status")).toEqual([{ ref: "TM-AAAA-0001", email: "ali@alfa.uz" }]);
    expect(container.querySelector(".rg-status")!.className).toBe("rg-status is-good");
    expect(container.querySelector(".rg-reason")!.textContent).toContain(HOSTILE);
    expect(container.querySelector("img")).toBeNull();
  });

  it("says when no such application exists", async () => {
    stubApi({ "/api/register/meta": META, "/api/register/status": { error: "not_found" } });
    const container = await renderForm();
    fill(container, { rgRef: "TM-0", rgStEmail: "x@y.uz" });

    fireEvent.submit(container.querySelector("#rgStatusForm")!);

    expect(await screen.findByText(text("rg_e_notfound"))).toBeTruthy();
  });
});
