import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { T_ANALYST } from "@legacy/markets-i18n.js";
import { dialogs } from "../../shell/dialogs";
import { goTo } from "../../shell/navigate";
import { HOSTILE, renderPage, stubApi } from "../../test/renderPage";
import { TahlilPage } from "./TahlilPage";

vi.mock("../../shell/navigate", () => ({ goTo: vi.fn(), replaceWith: vi.fn() }));

const uz = (key: string): string => T_ANALYST[key]![0];

const WHO = { login: "tahlil", password: "secret-pass" };
const LOGIN = {
  ok: true,
  analyst: { name: "Aziza", org: "Markaz", scopes: ["bozor", "mehnat"] },
  modules: ["bozor", "moliya", "mehnat"],
};
const OVERVIEW = {
  ok: true,
  platform: { companies: 120, newCompanies: 7, associations: 4 },
  bozor: { products: 55, rfqs: 9, quotes: 6, deals: 3, inquiries: 2, matchRate: 61 },
  moliya: { providers: 5, products: 8, investors: 2, requests: 11, offers: 4, projects: 1, askedValue: 3.2e9 },
  mehnat: { vacancies: 31, seats: 40, candidates: 77, applications: 12, hires: 2, shortageIndex: null },
  funnels: [{ module: "bozor", steps: [{ label: "rfq", n: 9 }, { label: HOSTILE, n: 1 }] }],
};
const SEGMENT = {
  ok: true,
  dimension: "sector",
  dimensions: ["sector", "region"],
  note: "Agregat",
  rows: [
    { label: HOSTILE, n: 5, demand: 3, ratio: 0.6, price: { suppressed: true, stats: null } },
    { label: "Agro", n: 9, demand: 4, ratio: 0.4, price: { suppressed: false, stats: { p25: 10, median: 20, p75: 30 } } },
  ],
};
const DAY = 86_400_000;
const SERIES = {
  ok: true,
  metric: "products",
  metrics: ["products", "rfqs"],
  bucket: "week",
  total: 14,
  trendPct: -25,
  points: [
    { from: DAY, to: 7 * DAY, n: 4 },
    { from: 7 * DAY, to: 14 * DAY, n: 0 },
    { from: 14 * DAY, to: 21 * DAY, n: 10 },
  ],
};
const ROUTES = {
  "/api/analyst/login": LOGIN,
  "/api/analyst/overview": OVERVIEW,
  "/api/analyst/segment": SEGMENT,
  "/api/analyst/series": SERIES,
};

type FetchStub = ReturnType<typeof vi.fn>;

const postsTo = (path: string): Record<string, unknown>[] =>
  (fetch as unknown as FetchStub).mock.calls
    .filter(([url, options]) => url === path && options)
    .map(([, options]) => JSON.parse((options as { body: string }).body) as Record<string, unknown>);

function signIn(login: string, password: string): void {
  fireEvent.change(screen.getByLabelText("Login"), { target: { value: login } });
  fireEvent.change(screen.getByLabelText("Parol"), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: uz("an_login_btn") }));
}

/** Opens the cabinet from a session kept in this browser tab. */
async function renderCabinet(routes: Record<string, unknown> = {}) {
  sessionStorage.setItem("kg_an", JSON.stringify(WHO));
  stubApi({ ...ROUTES, ...routes });
  const view = renderPage(<TahlilPage />);
  await screen.findByRole("button", { name: uz("an_logout") });
  return view;
}

const openView = (key: string): void => {
  fireEvent.click(screen.getByRole("button", { name: uz(key) }));
};

describe("TahlilPage sign-in", () => {
  it("opens the cabinet, keeps the session and names the analyst", async () => {
    stubApi(ROUTES);
    const { container } = renderPage(<TahlilPage />);

    signIn("  tahlil ", "secret-pass");

    expect(await screen.findByText(uz("an_k_companies"))).toBeTruthy();
    expect(postsTo("/api/analyst/login")).toEqual([WHO]);
    expect(JSON.parse(sessionStorage.getItem("kg_an")!)).toEqual(WHO);
    expect(container.querySelector("#anBrandSub")?.textContent).toBe("Markaz");
    expect(document.title).toBe("Aziza — TIJORAT MARKAZI");
  });

  it("refuses credentials no tier accepts and clears the password", async () => {
    stubApi({ "/api/analyst/login": { ok: false }, "/api/auth/login": 401 });
    renderPage(<TahlilPage />);

    signIn("tahlil", "wrong");

    expect(await screen.findByText(uz("an_bad_creds"))).toBeTruthy();
    expect((screen.getByLabelText("Parol") as HTMLInputElement).value).toBe("");
    expect(sessionStorage.getItem("kg_an")).toBeNull();
  });

  it("sends another tier's account to its own cabinet", async () => {
    stubApi({ "/api/analyst/login": { ok: false }, "/api/auth/login": { ok: true, target: "company.html" } });
    renderPage(<TahlilPage />);

    signIn("alfa", "secret-pass");

    await waitFor(() => expect(goTo).toHaveBeenCalledWith("company.html"));
  });

  it("signs out to the login form and forgets the session", async () => {
    await renderCabinet();

    fireEvent.click(screen.getByRole("button", { name: uz("an_logout") }));

    expect(screen.getByRole("heading", { name: uz("an_title") })).toBeTruthy();
    expect(sessionStorage.getItem("kg_an")).toBeNull();
  });
});

describe("TahlilPage views", () => {
  it("shows the overview figures and funnels, with hostile labels as text", async () => {
    const { container } = await renderCabinet();

    expect(await screen.findByText(`+7 ${uz("an_k_new")}`)).toBeTruthy();
    expect(container.querySelectorAll(".an-kpi")).toHaveLength(6);
    expect(container.querySelectorAll(".an-box .an-bar")).toHaveLength(16);
    expect(screen.getByText(HOSTILE)).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    expect(postsTo("/api/analyst/overview")[0]).toEqual({ ...WHO, days: 90 });
  });

  it("asks again for the chosen period", async () => {
    await renderCabinet();
    await screen.findByText(uz("an_k_companies"));

    fireEvent.click(screen.getByRole("button", { name: `30${uz("an_days")}` }));

    await waitFor(() => expect(postsTo("/api/analyst/overview").at(-1)).toEqual({ ...WHO, days: 30 }));
  });

  it("says so when the data cannot be loaded", async () => {
    await renderCabinet({ "/api/analyst/overview": 500 });

    expect(await screen.findByText(uz("an_fail"))).toBeTruthy();
  });

  it("lists a segment for the analyst's own markets only", async () => {
    const { container } = await renderCabinet();

    openView("an_nav_segments");

    expect(await screen.findByText("Agro")).toBeTruthy();
    expect(postsTo("/api/analyst/segment")[0]).toEqual({ ...WHO, days: 90, module: "bozor", dimension: "" });
    expect([...container.querySelectorAll("#segModule button")].map(button => button.textContent)).toEqual([
      uz("an_mod_bozor"),
      uz("an_mod_mehnat"),
    ]);
    expect(screen.getByText(HOSTILE)).toBeTruthy();
    expect(screen.getByText(uz("an_suppressed"))).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: uz("an_d_region") }));

    await waitFor(() => expect(postsTo("/api/analyst/segment").at(-1)).toMatchObject({ dimension: "region" }));
  });

  it("draws the trend with one column per non-empty bucket", async () => {
    const { container } = await renderCabinet();

    openView("an_nav_trends");

    await waitFor(() => expect(container.querySelectorAll(".an-chart rect")).toHaveLength(2));
    expect(container.querySelector(".an-trend")?.className).toContain("is-down");
    expect(postsTo("/api/analyst/series")[0]).toMatchObject({ module: "bozor", metric: "", bucket: "week" });

    fireEvent.click(screen.getByRole("button", { name: uz("an_b_month") }));

    await waitFor(() => expect(postsTo("/api/analyst/series").at(-1)).toMatchObject({ bucket: "month" }));
  });

  it("reports a failed export instead of downloading nothing", async () => {
    const alert = vi.spyOn(dialogs, "alert").mockResolvedValue();
    await renderCabinet({ "/api/analyst/export": 500 });

    openView("an_nav_reports");
    fireEvent.click(screen.getByRole("button", { name: uz("an_dl_xlsx") }));

    await waitFor(() => expect(alert).toHaveBeenCalledWith(uz("an_fail")));
    expect(postsTo("/api/analyst/export")[0]).toEqual({ ...WHO, days: 90, kind: "xlsx" });
  });
});
