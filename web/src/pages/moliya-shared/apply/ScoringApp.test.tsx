import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { T_MS } from "@legacy/moliya-scoring-i18n.js";
import { HOSTILE, renderPage, stubApi } from "../../../test/renderPage";
import { blankProject, matchInstitutions, nextTierSuggestions, routingUnlocked, scoreProject } from "../engine/engine";
import type { Project } from "../engine/types";
import { ScoringApp } from "./ScoringApp";

const uz = (key: string): string => T_MS[key]![0];
const json = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const HOME = "/api/moliya/scoring/home";
const SAVE = "/api/moliya/scoring/save";
const OPEN = "/api/moliya/scoring/open";
const SUBMIT = "/api/moliya/scoring/submit";
const EMPTY_HOME = { ok: true, role: "tashabbuskor", items: [], stats: { total: 0, scored: 0, ready: 0, blocked: 0, avgScore: null } };

/** What the server answers when a project is opened: scored by the same engine it runs. */
function openedAnswer(project: Project) {
  const scoring = scoreProject(project);
  return json({
    ok: true,
    project: { ...project, updated: 1_700_000_000_000 },
    scoring,
    matches: matchInstitutions(project, scoring),
    unlocked: routingUnlocked(scoring),
    suggestions: nextTierSuggestions(scoring),
    audit: [{ t: 1_700_000_000_000, user: HOSTILE, field: "loyiha", oldValue: null, newValue: HOSTILE }],
    interest: [{ state: "shortlist", providerName: HOSTILE }],
  });
}

function strongStartup(name: string): Project {
  const blank = blankProject();
  return {
    ...blank,
    id: "p/1",
    status: "scored",
    passport: { ...blank.passport, loyihaTuri: "startup", nomi: name, stir: "301", soralayotganSumma: 200_000, valyuta: "USD" },
    startupInfo: {
      ...blank.startupInfo,
      jamoaTajribasi: "full",
      mahsulotBosqichi: "launched",
      bozorValidatsiyasi: "validated",
      moliyalashtirishTarixi: "successful_round",
      moliyaviyModelSifati: "reviewed",
      daromadlilikSalohiyati: "high",
      huquqiyIpHolati: "registered_ip_protected",
      keyingiBosqichExit: "clear_plan",
    },
  };
}

const listRow = (project: Project) => {
  const scoring = scoreProject(project);
  return json({
    id: project.id,
    status: project.status,
    updated: 1_700_000_000_000,
    passport: project.passport,
    score: { total: scoring.total, isKnockout: scoring.isKnockout, routingStatus: scoring.routingStatus },
  });
};

const bodyOf = (url: string): Record<string, unknown> => {
  const call = (fetch as Mock).mock.calls.filter(([calledUrl]) => calledUrl === url).pop();
  return JSON.parse((call?.[1] as { body: string }).body) as Record<string, unknown>;
};

const type = (container: HTMLElement, selector: string, value: string): void => {
  const input = container.querySelector<HTMLInputElement>(selector);
  if (!input) throw new Error(`no input ${selector}`);
  fireEvent.change(input, { target: { value } });
};

describe("ScoringApp", () => {
  it("asks an unidentified visitor to sign in instead of showing an error", async () => {
    stubApi({ [HOME]: { error: "identify_first" } });

    const { container } = renderPage(<ScoringApp track="company" />);

    const invitation = await screen.findByRole("link", { name: uz("ms_need_login") });
    expect(invitation.getAttribute("href")).toBe("kirish.html");
    expect(container.querySelector(".is-err")).toBeNull();
  });

  it("asks the server for this page's track only and lists what comes back", async () => {
    localStorage.setItem("mk_email", "owner@example.uz");
    const project = strongStartup("Zarafshon Tech");
    stubApi({ [HOME]: { ...EMPTY_HOME, items: [listRow(project)], stats: { total: 1, scored: 1, ready: 1, blocked: 0, avgScore: 100 } } });

    const { container } = renderPage(<ScoringApp track="startup" />);

    expect(await screen.findByText("Zarafshon Tech")).toBeTruthy();
    expect(bodyOf(HOME)).toMatchObject({ loyihaTuri: "startup", email: "owner@example.uz" });
    expect(screen.getByRole("heading", { name: uz("ms_title_startup") })).toBeTruthy();
    expect(container.querySelector(".ms-badge.is-tayyor")).not.toBeNull();
  });

  it("filters the list as the visitor types and says when nothing is left", async () => {
    stubApi({ [HOME]: { ...EMPTY_HOME, items: [listRow(strongStartup("Zarafshon Tech"))] } });
    const { container } = renderPage(<ScoringApp track="startup" />);
    await screen.findByText("Zarafshon Tech");

    type(container, "#ms-q", "no such project");

    expect(screen.queryByText("Zarafshon Tech")).toBeNull();
    expect(screen.getByText(uz("ms_no_results"))).toBeTruthy();
  });

  it("holds the wizard on step one until the passport is filled in", async () => {
    stubApi({ [HOME]: EMPTY_HOME });
    const { container } = renderPage(<ScoringApp track="company" />);
    fireEvent.click(await screen.findByRole("button", { name: uz("ms_empty_cta") }));

    fireEvent.click(screen.getByRole("button", { name: uz("ms_wiz_next") }));

    expect(screen.getByText(uz("ms_v_name"))).toBeTruthy();
    expect(screen.getByText(uz("ms_v_amount"))).toBeTruthy();
    expect(container.querySelector(".ms-step.is-now")?.getAttribute("data-ms-step")).toBe("1");
  });

  it("runs a company through all four steps and shows the score the server returns", async () => {
    const saved: Project = { ...blankProject(), id: "p1", status: "scored" };
    saved.passport = { ...saved.passport, nomi: "Alfa Tekstil", stir: "305", soralayotganSumma: 500_000, valyuta: "USD" };
    stubApi({ [HOME]: EMPTY_HOME, [SAVE]: { ok: true, project: json(saved) }, [OPEN]: openedAnswer(saved) });
    const { container } = renderPage(<ScoringApp track="company" />);
    fireEvent.click(await screen.findByRole("button", { name: uz("ms_new") }));
    const next = (): void => {
      fireEvent.click(screen.getByRole("button", { name: uz("ms_wiz_next") }));
    };

    type(container, "#ms-f-nomi", "  Alfa Tekstil ");
    type(container, "#ms-f-stir", "305");
    type(container, "#ms-f-summa", "500000");
    fireEvent.change(container.querySelector("#ms-f-valyuta")!, { target: { value: "USD" } });
    next();
    type(container, '[data-ms-hist="2:tushum"]', "1300");
    type(container, '[data-ms-hist="2:sofFoyda"]', "160");
    expect(container.querySelector("#ms-hist-count")?.textContent).toBe("1");
    next();
    type(container, '[data-ms-model="0:fcf"]', "300000");
    next();
    fireEvent.click(screen.getByRole("button", { name: uz("ms_wiz_finish") }));

    expect(await screen.findByRole("heading", { name: "Alfa Tekstil" })).toBeTruthy();
    const sent = bodyOf(SAVE);
    expect(sent.status).toBe("scored");
    expect(sent.passport).toMatchObject({ loyihaTuri: "company", nomi: "Alfa Tekstil", stir: "305", soralayotganSumma: 500000, valyuta: "USD" });
    expect((sent.financialHistory as { tushum: number | null }[])[2].tushum).toBe(1300);
    expect((sent.financialModel as { yillar: { fcf: number | null }[] }).yillar[0].fcf).toBe(300000);
    expect(bodyOf(OPEN).id).toBe("p1");
    expect(container.querySelector(".ms-gauge.is-knockout .ms-gauge-num")?.textContent).toBe(String(scoreProject(saved).total));
    expect(container.querySelectorAll(".ms-block")).toHaveLength(8);
    expect(screen.getByText(uz("ms_res_routing_locked"))).toBeTruthy();
  });

  it("saves a draft without a status, so a scored project is not pulled back", async () => {
    const saved: Project = { ...blankProject(), id: "p2" };
    stubApi({ [HOME]: EMPTY_HOME, [SAVE]: { ok: true, project: json(saved) } });
    renderPage(<ScoringApp track="startup" />);
    fireEvent.click(await screen.findByRole("button", { name: uz("ms_new") }));

    fireEvent.click(screen.getByRole("button", { name: uz("ms_wiz_draft") }));

    expect(await screen.findByText(uz("ms_draft_saved"))).toBeTruthy();
    const sent = bodyOf(SAVE);
    expect("status" in sent).toBe(false);
    expect(sent.passport).toMatchObject({ loyihaTuri: "startup" });
  });

  it("moves the simulated total when another tier is picked, and back on reset", async () => {
    const project = strongStartup("Zarafshon Tech");
    stubApi({ [HOME]: { ...EMPTY_HOME, items: [listRow(project)] }, [OPEN]: openedAnswer(project) });
    const { container } = renderPage(<ScoringApp track="startup" />);
    fireEvent.click(await screen.findByRole("button", { name: uz("ms_result") }));
    await screen.findByRole("heading", { name: "Zarafshon Tech" });
    const simulated = (): string | null | undefined => container.querySelector("#ms-sim-out .ms-gauge-num")?.textContent;

    fireEvent.change(container.querySelector("#ms-sim-team")!, { target: { value: "3" } });

    expect(simulated()).toBe("80");
    expect(container.querySelector(".ms-sim-delta.is-down")?.textContent).toContain("-20");
    fireEvent.click(screen.getByRole("button", { name: uz("ms_res_sim_reset") }));
    expect(simulated()).toBe("100");
  });

  it("submits an unlocked project and reports how many institutions received it", async () => {
    const project = strongStartup("Zarafshon Tech");
    stubApi({ [HOME]: { ...EMPTY_HOME, items: [listRow(project)] }, [OPEN]: openedAnswer(project), [SUBMIT]: { ok: true, routedTo: ["a", "b"] } });
    renderPage(<ScoringApp track="startup" />);
    fireEvent.click(await screen.findByRole("button", { name: uz("ms_result") }));

    fireEvent.click(await screen.findByRole("button", { name: uz("ms_act_submit") }));

    expect(await screen.findByText(uz("ms_submitted").replace("{n}", "2"))).toBeTruthy();
    expect(bodyOf(SUBMIT).id).toBe("p/1");
  });

  it("opens the printable teaser, hides the hero for it, and returns to the list", async () => {
    const project = strongStartup("Zarafshon Tech");
    stubApi({ [HOME]: { ...EMPTY_HOME, items: [listRow(project)] }, [OPEN]: openedAnswer(project) });
    const { container } = renderPage(<ScoringApp track="startup" />);
    fireEvent.click(await screen.findByRole("button", { name: uz("ms_result") }));

    fireEvent.click(await screen.findByRole("button", { name: uz("ms_res_teaser") }));

    expect(document.body.classList.contains("ms-printing")).toBe(true);
    expect(container.querySelector("#ms-print .ms-print-total")?.textContent).toContain("100 / 100");
    fireEvent.click(screen.getByRole("button", { name: uz("ms_tsr_back") }));
    expect(document.body.classList.contains("ms-printing")).toBe(false);
    expect(screen.getByRole("heading", { name: uz("ms_title_startup") })).toBeTruthy();
  });

  it("lays out both methodologies from the scoring table", async () => {
    stubApi({ [HOME]: EMPTY_HOME });
    const { container } = renderPage(<ScoringApp track="company" />);

    fireEvent.click(await screen.findByRole("button", { name: uz("ms_nav_methodology") }));

    expect(container.querySelectorAll(".ms-met-block")).toHaveLength(17);
    expect(container.querySelectorAll(".ms-tier")).toHaveLength(4);
    expect(container.querySelector(".mk-sub code")?.textContent).toBe("moliya-scoring-config.js → scoring");
  });

  it("shows the server's sentence when a request is refused, and stays on the list", async () => {
    const project = strongStartup("Zarafshon Tech");
    stubApi({ [HOME]: { ...EMPTY_HOME, items: [listRow(project)] }, [OPEN]: { error: "forbidden" } });
    renderPage(<ScoringApp track="startup" />);

    fireEvent.click(await screen.findByRole("button", { name: uz("ms_result") }));

    expect((await screen.findByRole("alert")).textContent).toBe(uz("ms_err_forbidden"));
    expect(screen.getByText("Zarafshon Tech")).toBeTruthy();
  });

  it("reports a network failure instead of an empty list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const { container } = renderPage(<ScoringApp track="company" />);

    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("network"));
    expect(container.querySelector(".mk-table")).toBeNull();
  });

  it("renders hostile project, audit and institution values as text", async () => {
    const project = strongStartup(HOSTILE);
    stubApi({ [HOME]: { ...EMPTY_HOME, items: [listRow(project)] }, [OPEN]: openedAnswer(project) });
    const { container } = renderPage(<ScoringApp track="startup" />);
    expect(await screen.findByText(HOSTILE)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: uz("ms_result") }));

    expect(await screen.findByRole("heading", { name: HOSTILE })).toBeTruthy();
    expect(screen.getAllByText(HOSTILE).length).toBeGreaterThan(2);
    expect(container.querySelector("#msRoot img")).toBeNull();
  });
});
