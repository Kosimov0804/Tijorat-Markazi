import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { T_MS_INV } from "@legacy/moliya-investor-i18n.js";
import { T_MS } from "@legacy/moliya-scoring-i18n.js";
import { HOSTILE, renderPage, stubApi } from "../../test/renderPage";
import { blankProject, scoreProject } from "../moliya-shared/engine/engine";
import type { Project } from "../moliya-shared/engine/types";
import { InvestorPage } from "./InvestorPage";

const uz = (key: string): string => (T_MS_INV[key] ?? T_MS[key])![0];
const json = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const INBOX = "/api/moliya/investor/inbox";
const OPEN = "/api/moliya/investor/open";
const INTEREST = "/api/moliya/investor/interest";
const ROUTING = "/api/moliya/investor/routing";
const STATUS = "/api/moliya/scoring/status";

function project(name: string, status = "submitted"): Project {
  const blank = blankProject();
  const base: Project = {
    ...blank,
    id: "p/1",
    status,
    ownerName: "Karimov",
    submitted: 1_700_000_000_000,
    passport: { ...blank.passport, loyihaTuri: "startup", nomi: name, soralayotganSumma: 2_500_000, valyuta: "USD" },
    startupInfo: { ...blank.startupInfo, jamoaTajribasi: "full", mahsulotBosqichi: "launched" },
  };
  return { ...base, scoring: scoreProject(base) };
}

const row = (source: Project, extra: object = {}) =>
  json({
    id: source.id,
    status: source.status,
    ownerName: source.ownerName,
    submitted: source.submitted,
    passport: source.passport,
    score: source.scoring?.total ?? null,
    routingStatus: source.scoring?.routingStatus ?? null,
    matchedProducts: 2,
    interest: null,
    ...extra,
  });

const inboxAnswer = (kind: "institution" | "expert", items: object[], institutions = 1) => ({
  ok: true,
  role: kind === "expert" ? "ekspert" : "tashabbuskor",
  actorKind: kind,
  isInstitution: kind === "institution",
  institutions,
  stats: { total: items.length, fresh: items.length, shortlist: 0, avgScore: items.length ? 35 : null },
  items,
});

const dossierAnswer = (source: Project, interest: object | null = null) => json({ ok: true, project: source, interest, matchedProducts: 2 });

const PRODUCT = { id: "prod-1", name: "SME kredit", category: "banking", currency: "USD", status: "live", minAmount: 10_000, maxAmount: 5_000_000, tenorMax: 5, sectors: ["it", "fintech-x"], routable: false, minScore: 70, eligible: true };

const bodyOf = (url: string): Record<string, unknown> => {
  const call = (fetch as Mock).mock.calls.filter(([calledUrl]) => calledUrl === url).pop();
  return JSON.parse((call?.[1] as { body: string }).body) as Record<string, unknown>;
};

const asCompany = (): void => sessionStorage.setItem("mk_co", JSON.stringify({ login: "bank", password: "secret", name: "Ipak Bank" }));

describe("InvestorPage", () => {
  /* jsdom has no scrolling; the page scrolls to the top of a new view. */
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  it("invites an unidentified visitor to sign in", async () => {
    stubApi({ [INBOX]: { error: "identify_first" } });

    renderPage(<InvestorPage />);

    const invitation = await screen.findByRole("link", { name: uz("msi_login_cta") });
    expect(invitation.getAttribute("href")).toBe("kirish.html");
    expect(screen.getByText(uz("msi_login_title"))).toBeTruthy();
  });

  it("shows an institution its queue, signed with the company's own credentials", async () => {
    asCompany();
    stubApi({ [INBOX]: inboxAnswer("institution", [row(project("Zarafshon Tech"))]) });

    const { container } = renderPage(<InvestorPage />);

    expect(await screen.findByText("Zarafshon Tech")).toBeTruthy();
    expect(bodyOf(INBOX)).toMatchObject({ login: "bank", password: "secret", filter: { q: "", status: "" } });
    expect(screen.getByText(`${uz("msi_actor_inst")} · Ipak Bank`)).toBeTruthy();
    expect(container.querySelector(".msi-queue .msi-int.is-new")?.textContent).toBe(uz("msi_int_new"));
    expect(container.querySelector("#msiPulse b")?.textContent).toBe("1");
    expect(container.querySelector("#msi-csv")).toBeNull();
  });

  it("gives an expert the whole queue, the export, and no interest column", async () => {
    localStorage.setItem("kg_admin", JSON.stringify({ password: "admin-pass" }));
    stubApi({ [INBOX]: inboxAnswer("expert", [row(project("Zarafshon Tech"))]) });

    const { container } = renderPage(<InvestorPage />);

    expect(await screen.findByRole("heading", { name: uz("msi_title_expert") })).toBeTruthy();
    expect(bodyOf(INBOX).pass).toBe("admin-pass");
    expect(screen.getByRole("button", { name: uz("ms_csv") })).toBeTruthy();
    expect(container.querySelector("#msi-interest")).toBeNull();
    expect(container.querySelector('#msi-status option[value="rejected"]')).not.toBeNull();
  });

  it("reloads the queue from the server when a filter changes", async () => {
    stubApi({ [INBOX]: inboxAnswer("institution", [row(project("Zarafshon Tech"))]) });
    const { container } = renderPage(<InvestorPage />);
    await screen.findByText("Zarafshon Tech");

    fireEvent.change(container.querySelector("#msi-sektor")!, { target: { value: "it" } });

    await waitFor(() => expect(bodyOf(INBOX).filter).toMatchObject({ sektor: "it" }));
    expect(screen.getByText("Zarafshon Tech")).toBeTruthy();
  });

  it("tells an institution with no criteria to set them up, not that the queue is empty", async () => {
    stubApi({ [INBOX]: inboxAnswer("institution", [], 0) });

    renderPage(<InvestorPage />);

    expect(await screen.findByText(uz("msi_empty_setup_title"))).toBeTruthy();
    expect(screen.getByRole("button", { name: uz("msi_empty_setup_cta") })).toBeTruthy();
  });

  it("opens a dossier and saves the decision together with the private note", async () => {
    const source = project("Zarafshon Tech");
    stubApi({
      [INBOX]: inboxAnswer("institution", [row(source)]),
      [OPEN]: dossierAnswer(source),
      [INTEREST]: { ok: true, interest: { state: "shortlist", note: "call the founder", updated: 1_700_000_000_000 } },
    });
    const { container } = renderPage(<InvestorPage />);
    fireEvent.click(await screen.findByRole("button", { name: uz("msi_open") }));
    await screen.findByRole("heading", { name: "Zarafshon Tech" });
    expect(container.querySelector(".ms-gauge-num")?.textContent).toBe(String(source.scoring?.total));

    fireEvent.click(screen.getByRole("button", { name: uz("msi_int_shortlist") }));
    fireEvent.change(screen.getByLabelText(uz("msi_int_note")), { target: { value: "call the founder" } });
    fireEvent.click(screen.getByRole("button", { name: uz("msi_int_save") }));

    expect(await screen.findByText(uz("msi_int_saved"))).toBeTruthy();
    expect(bodyOf(INTEREST)).toMatchObject({ projectId: "p/1", state: "shortlist", note: "call the founder" });
    expect(container.querySelector(".msi-current .msi-int.is-shortlist")).not.toBeNull();
  });

  it("refuses to save a decision before one of the three is chosen", async () => {
    const source = project("Zarafshon Tech");
    stubApi({ [INBOX]: inboxAnswer("institution", [row(source)]), [OPEN]: dossierAnswer(source) });
    renderPage(<InvestorPage />);
    fireEvent.click(await screen.findByRole("button", { name: uz("msi_open") }));

    fireEvent.click(await screen.findByRole("button", { name: uz("msi_int_save") }));

    expect(screen.getByText(uz("msi_int_pick"))).toBeTruthy();
    expect((fetch as Mock).mock.calls.some(([url]) => url === INTEREST)).toBe(false);
  });

  it("lets an expert take a submitted project into review, with a comment", async () => {
    const source = project("Zarafshon Tech");
    stubApi({ [INBOX]: inboxAnswer("expert", [row(source)]), [OPEN]: dossierAnswer(source), [STATUS]: { ok: true } });
    const { container } = renderPage(<InvestorPage />);
    fireEvent.click(await screen.findByRole("button", { name: uz("msi_open") }));
    const review = await screen.findByRole("button", { name: uz("ms_act_review") });

    fireEvent.change(container.querySelector("#msi-st-note")!, { target: { value: "looks sound" } });
    fireEvent.click(review);

    await waitFor(() => expect(bodyOf(STATUS)).toMatchObject({ id: "p/1", status: "review", comment: "looks sound" }));
    expect(container.querySelector("#msi-st-approve")).toBeNull();
  });

  it("saves a product's acceptance criteria and names the sectors it cannot translate", async () => {
    stubApi({
      [INBOX]: inboxAnswer("institution", [row(project("Zarafshon Tech"))]),
      [ROUTING]: { ok: true, items: [PRODUCT], institutions: 0, product: PRODUCT },
    });
    const { container } = renderPage(<InvestorPage />);
    fireEvent.click(await screen.findByRole("button", { name: uz("msi_nav_settings") }));
    await screen.findByRole("heading", { name: "SME kredit" });
    expect(screen.getByText(/fintech-x/)).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByLabelText(uz("msi_set_minscore")), { target: { value: "82" } });
    fireEvent.click(screen.getByRole("button", { name: uz("msi_set_save") }));

    expect(await screen.findByText(uz("msi_set_saved"))).toBeTruthy();
    expect((fetch as Mock).mock.calls.map(([url, options]) => (url === ROUTING ? (JSON.parse((options as { body: string }).body) as object) : null))).toContainEqual(
      expect.objectContaining({ op: "set", productId: "prod-1", routable: true, minScore: 82 }),
    );
    expect(container.querySelector('[data-msi-msg="prod-1"]')?.hasAttribute("hidden")).toBe(false);
  });

  it("replaces the view with the server's sentence when a dossier is refused, and offers the way back", async () => {
    const source = project("Zarafshon Tech");
    stubApi({ [INBOX]: inboxAnswer("institution", [row(source)]), [OPEN]: { error: "forbidden" } });
    renderPage(<InvestorPage />);

    fireEvent.click(await screen.findByRole("button", { name: uz("msi_open") }));

    expect(await screen.findByText(uz("msi_err_forbidden"))).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: uz("msi_back") }));
    expect(await screen.findByText("Zarafshon Tech")).toBeTruthy();
  });

  it("reports a network failure as it comes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    renderPage(<InvestorPage />);

    expect(await screen.findByText("network")).toBeTruthy();
  });

  it("renders hostile queue and dossier values as text", async () => {
    const source = { ...project(HOSTILE), ownerName: HOSTILE, documents: [{ name: HOSTILE, size: 2048, type: "x", uploadedAt: 1 }] };
    stubApi({
      [INBOX]: inboxAnswer("institution", [row(source, { status: HOSTILE, interest: { state: HOSTILE, note: HOSTILE, updated: 1 } })]),
      [OPEN]: dossierAnswer(source, { state: "interested", note: HOSTILE, updated: 1 }),
    });
    const { container } = renderPage(<InvestorPage />);
    expect((await screen.findAllByText(HOSTILE)).length).toBeGreaterThan(0);
    expect(container.querySelector("#msiRoot img")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: uz("msi_open") }));

    expect(await screen.findByRole("heading", { name: HOSTILE })).toBeTruthy();
    expect((screen.getByLabelText(uz("msi_int_note")) as HTMLTextAreaElement).value).toBe(HOSTILE);
    expect(container.querySelector("#msiRoot img")).toBeNull();
  });
});
