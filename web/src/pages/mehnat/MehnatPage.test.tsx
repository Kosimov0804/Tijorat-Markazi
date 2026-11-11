import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { T_MEHNAT } from "@legacy/markets-i18n.js";
import { dialogs } from "../../shell/dialogs";
import { HOSTILE, renderPage, stubApi } from "../../test/renderPage";
import { MehnatPage } from "./MehnatPage";

const uz = (key: string): string => T_MEHNAT[key]![0];

const JOBS = "/api/mehnat/jobs?";
const ACCOUNTANT = {
  id: "v1",
  title: "Bosh hisobchi",
  companyName: "Alfa",
  seniority: "senior",
  format: "onsite",
  salaryMin: 900,
  salaryMax: 900,
  currency: "USD",
  skillsRequired: ["IFRS"],
  summary: "Hisobot",
  duties: "Balans",
};
const DRIVER = { id: "v2", title: "Haydovchi", companyName: "Beta", seniority: "junior", format: "onsite" };
const LISTING = {
  items: [ACCOUNTANT, DRIVER],
  total: 2,
  facets: { regions: ["Toshkent"], seniority: ["junior", "senior"], formats: ["onsite"] },
};
const COMPANY = { login: "alfa", password: "secret", id: "c1", name: "Alfa", sector: "Agro" };
const EMPLOYER = {
  ok: true,
  vacancies: [{ id: "v1", title: "Bosh hisobchi", status: "open", seniority: "senior" }],
  pipeline: {
    funnel: { applied: 1 },
    stages: ["applied", "rejected", "withdrawn"],
    byStage: {
      applied: [{ id: "a1", stage: "applied", candidateName: HOSTILE, vacancyTitle: "Bosh hisobchi", score: 70 }],
    },
  },
};

type FetchStub = ReturnType<typeof vi.fn>;

const postsTo = (path: string): Record<string, unknown>[] =>
  (fetch as unknown as FetchStub).mock.calls
    .filter(([url, options]) => url === path && options)
    .map(([, options]) => JSON.parse((options as { body: string }).body) as Record<string, unknown>);

const openTab = (key: string): void => {
  fireEvent.click(screen.getByRole("tab", { name: uz(key) }));
};

async function renderJobs(routes: Record<string, unknown> = {}) {
  stubApi({ [JOBS]: LISTING, ...routes });
  const view = renderPage(<MehnatPage />);
  await screen.findByText("Bosh hisobchi");
  return view;
}

describe("MehnatPage vacancies", () => {
  it("lists vacancies with their salary, count and translated filter options", async () => {
    const { container } = await renderJobs();

    expect(container.querySelectorAll("#hcGrid .mk-card")).toHaveLength(2);
    expect(container.querySelector("#hcCount")?.textContent).toBe(uz("hc_count").replace("{n}", "2"));
    expect(screen.getByText("900 USD")).toBeTruthy();
    expect(screen.getByText(uz("hc_salary_hidden"))).toBeTruthy();
    expect(screen.getByRole("option", { name: uz("hc_sen_senior") })).toBeTruthy();
  });

  it("asks the server again when a level is chosen", async () => {
    const { container } = await renderJobs({ "/api/mehnat/jobs?seniority=senior": { items: [ACCOUNTANT], total: 1 } });

    fireEvent.change(container.querySelector("#hcSeniority")!, { target: { value: "senior" } });

    await waitFor(() => expect(screen.queryByText("Haydovchi")).toBeNull());
    expect(screen.getByText("Bosh hisobchi")).toBeTruthy();
  });

  it("filters by a minimum salary once typing stops", async () => {
    const { container } = await renderJobs({ "/api/mehnat/jobs?salaryMin=500": { items: [ACCOUNTANT], total: 1 } });

    fireEvent.change(container.querySelector("#hcSalary")!, { target: { value: "500" } });

    await waitFor(() => expect(screen.queryByText("Haydovchi")).toBeNull());
  });

  it("shows the empty note when the request fails", async () => {
    stubApi({ [JOBS]: 500 });

    renderPage(<MehnatPage />);

    expect(await screen.findByText(uz("hc_empty"))).toBeTruthy();
  });

  it("renders hostile vacancy values as text", async () => {
    stubApi({ [JOBS]: { items: [{ id: "x", title: HOSTILE, companyName: HOSTILE, skillsRequired: [HOSTILE] }], total: 1 } });

    const { container } = renderPage(<MehnatPage />);

    await screen.findAllByText(HOSTILE);
    expect(container.querySelector("#hcGrid img")).toBeNull();
  });
});

describe("MehnatPage applying", () => {
  it("asks for an e-mail before an application is sent", async () => {
    await renderJobs();
    fireEvent.click(screen.getByText("Bosh hisobchi"));

    fireEvent.click(await screen.findByRole("button", { name: uz("hc_apply") }));

    expect(await screen.findByText(uz("hc_need_email"))).toBeTruthy();
    expect(postsTo("/api/mehnat/apply")).toHaveLength(0);
  });

  it("sends the application and replaces the button with a confirmation", async () => {
    localStorage.setItem("mk_email", "ali@example.uz");
    await renderJobs({ "/api/mehnat/matches": { ok: true, matches: [] }, "/api/mehnat/apply": { ok: true } });
    fireEvent.click(screen.getByText("Bosh hisobchi"));

    fireEvent.click(await screen.findByRole("button", { name: uz("hc_apply") }));

    expect(await screen.findByText(uz("hc_apply_ok"))).toBeTruthy();
    expect(postsTo("/api/mehnat/apply")[0]).toMatchObject({ vacancyId: "v1", source: "search", email: "ali@example.uz" });
    expect(screen.queryByRole("button", { name: uz("hc_apply") })).toBeNull();
  });

  it("explains that a profile is needed first", async () => {
    localStorage.setItem("mk_email", "ali@example.uz");
    await renderJobs({
      "/api/mehnat/matches": { ok: true, matches: [] },
      "/api/mehnat/apply": { ok: false, error: "profile_required" },
    });
    fireEvent.click(screen.getByText("Bosh hisobchi"));

    fireEvent.click(await screen.findByRole("button", { name: uz("hc_apply") }));

    expect(await screen.findByText(uz("hc_need_profile"))).toBeTruthy();
  });

  it("shows the candidate's own fit and that they already applied", async () => {
    localStorage.setItem("mk_email", "ali@example.uz");
    await renderJobs({
      "/api/mehnat/matches": {
        ok: true,
        matches: [{ vacancy: { id: "v1" }, score: 82, reasons: ["IFRS"], applied: true, employerScore: 80 }],
      },
    });

    fireEvent.click(screen.getByText("Bosh hisobchi"));

    expect(await screen.findByText(uz("hc_your_fit"))).toBeTruthy();
    expect(screen.getByText(uz("hc_applied"))).toBeTruthy();
    expect(screen.queryByRole("button", { name: uz("hc_apply") })).toBeNull();
  });
});

describe("MehnatPage candidate cabinet", () => {
  const CABINET_ROUTES = {
    "/api/mehnat/candidate": { ok: true, candidate: { name: "Ali", occupation: "Hisobchi", seniority: "senior", years: 0 } },
    "/api/mehnat/matches": { ok: true, matches: [] },
    "/api/mehnat/applications": { items: [{ id: "a1", stage: "offer", vacancyTitle: "Bosh hisobchi", salary: 900, currency: "USD" }] },
  };

  it("refuses an address without an @ and keeps the fields", async () => {
    const { container } = await renderJobs();
    openTab("hc_tab_me");
    fireEvent.change(container.querySelector("#hcEmail")!, { target: { value: "ali" } });

    fireEvent.click(container.querySelector("#hcIdSave")!);

    expect(screen.getAllByText(uz("hc_need_email"))).toHaveLength(2);
    expect(container.querySelector("#hcEmail")).not.toBeNull();
    expect(localStorage.getItem("mk_email")).toBeNull();
  });

  it("opens the cabinet for a saved e-mail with the stored profile filled in", async () => {
    const { container } = await renderJobs(CABINET_ROUTES);
    openTab("hc_tab_me");
    fireEvent.change(container.querySelector("#hcEmail")!, { target: { value: "ali@example.uz" } });
    fireEvent.change(container.querySelector("#hcName")!, { target: { value: "Ali" } });

    fireEvent.click(container.querySelector("#hcIdSave")!);

    await waitFor(() => expect(container.querySelector<HTMLInputElement>("#cdOcc")?.value).toBe("Hisobchi"));
    expect(localStorage.getItem("mk_email")).toBe("ali@example.uz");
    expect(container.querySelector<HTMLSelectElement>("#cdSeniority")?.value).toBe("senior");
    expect(container.querySelector<HTMLInputElement>("#cdYears")?.value).toBe("");
    expect(postsTo("/api/mehnat/candidate")[0]).toEqual({ op: "get", email: "ali@example.uz", name: "Ali" });
  });

  it("saves the profile with its formats and remembers the name", async () => {
    localStorage.setItem("mk_email", "ali@example.uz");
    const { container } = await renderJobs(CABINET_ROUTES);
    openTab("hc_tab_me");
    await waitFor(() => expect(container.querySelector("#hcProfileForm")).not.toBeNull());
    fireEvent.change(container.querySelector("#cdName")!, { target: { value: " Ali Valiyev " } });
    fireEvent.change(container.querySelector("#cdSkills")!, { target: { value: "IFRS, Excel" } });
    fireEvent.click(container.querySelector('.cdFmt[value="remote"]')!);

    fireEvent.submit(container.querySelector("#hcProfileForm")!);

    await waitFor(() => expect(postsTo("/api/mehnat/candidate")).toHaveLength(3));
    expect(postsTo("/api/mehnat/candidate")[1]).toMatchObject({
      email: "ali@example.uz",
      name: "Ali Valiyev",
      skills: "IFRS, Excel",
      formats: ["remote"],
      relocate: false,
      visibility: "public",
    });
    expect(localStorage.getItem("mk_name")).toBe("Ali Valiyev");
  });

  it("says so when the profile could not be saved", async () => {
    localStorage.setItem("mk_email", "ali@example.uz");
    const { container } = await renderJobs({ ...CABINET_ROUTES, "/api/mehnat/candidate": { ok: false } });
    openTab("hc_tab_me");
    await waitFor(() => expect(container.querySelector("#hcProfileForm")).not.toBeNull());

    fireEvent.submit(container.querySelector("#hcProfileForm")!);

    expect(await screen.findByText(uz("hc_save_fail"))).toBeTruthy();
  });

  it("declines an offer with the reason the candidate gives", async () => {
    localStorage.setItem("mk_email", "ali@example.uz");
    vi.spyOn(dialogs, "prompt").mockResolvedValue("salary");
    await renderJobs({ ...CABINET_ROUTES, "/api/mehnat/offer/respond": { ok: true } });
    openTab("hc_tab_me");

    fireEvent.click(await screen.findByRole("button", { name: uz("hc_decline") }));

    await waitFor(() =>
      expect(postsTo("/api/mehnat/offer/respond")[0]).toMatchObject({ id: "a1", accept: false, reason: "salary" }),
    );
  });
});

describe("MehnatPage employer cabinet", () => {
  const EMPLOYER_ROUTES = {
    "/api/mehnat/meta": { stages: ["applied", "offer", "rejected"] },
    "/api/mehnat/employer": EMPLOYER,
    "/api/mehnat/stage": { ok: true },
  };

  async function renderBoard() {
    sessionStorage.setItem("mk_co", JSON.stringify(COMPANY));
    const view = await renderJobs(EMPLOYER_ROUTES);
    openTab("hc_tab_employer");
    await screen.findByText(HOSTILE);
    return view;
  }

  it("shows the pipeline with candidate names as text", async () => {
    const { container } = await renderBoard();

    expect(container.querySelector("#hcEmployer img")).toBeNull();
    expect(container.querySelectorAll("#hcEmployer .mk-box.w3")).toHaveLength(2);
    expect(postsTo("/api/mehnat/employer")[0]).toEqual({ login: "alfa", password: "secret" });
  });

  it("moves a candidate to rejected with the recruiter's reason", async () => {
    vi.spyOn(dialogs, "prompt").mockResolvedValue("skill");
    const { container } = await renderBoard();

    fireEvent.change(container.querySelector('[data-stage-for="a1"]')!, { target: { value: "rejected" } });

    await waitFor(() =>
      expect(postsTo("/api/mehnat/stage")[0]).toEqual({
        id: "a1",
        stage: "rejected",
        reason: "skill",
        salary: "",
        login: "alfa",
        password: "secret",
      }),
    );
  });

  it("leaves the candidate where they were when no reason is given", async () => {
    const prompt = vi.spyOn(dialogs, "prompt").mockResolvedValue(null);
    const { container } = await renderBoard();
    const select = container.querySelector<HTMLSelectElement>('[data-stage-for="a1"]')!;

    fireEvent.change(select, { target: { value: "rejected" } });

    await waitFor(() => expect(prompt).toHaveBeenCalled());
    expect(postsTo("/api/mehnat/stage")).toHaveLength(0);
    expect(select.value).toBe("applied");
  });

  it("publishes a vacancy and shows the server's warnings", async () => {
    const { container } = await renderBoard();
    stubApi({ ...EMPLOYER_ROUTES, [JOBS]: LISTING, "/api/mehnat/vacancy": { ok: true, warnings: ["Maosh ko'rsatilmagan"] } });
    fireEvent.change(container.querySelector("#vcTitle")!, { target: { value: "Hisobchi" } });

    fireEvent.submit(container.querySelector("#hcVacForm")!);

    expect(await screen.findByText("Maosh ko'rsatilmagan")).toBeTruthy();
    expect(screen.getByText(uz("hc_save_ok"))).toBeTruthy();
    expect(postsTo("/api/mehnat/vacancy")[0]).toMatchObject({
      title: "Hisobchi",
      seniority: "middle",
      headcount: "1",
      login: "alfa",
    });
  });
});

describe("MehnatPage talent and intelligence", () => {
  it("lists candidates and marks anonymous profiles", async () => {
    await renderJobs({
      "/api/mehnat/talent?": {
        items: [{ name: "Nomzod #12", visibility: "anonymous", seniority: "middle", availability: "active", skills: ["SQL"] }],
        total: 1,
      },
    });

    openTab("hc_tab_talent");

    expect(await screen.findByText("Nomzod #12")).toBeTruthy();
    expect(screen.getByText(uz("hc_anon"))).toBeTruthy();
  });

  it("hides wages for a cut too small to publish", async () => {
    await renderJobs({
      "/api/mehnat/intel?": {
        headline: { openVacancies: 3 },
        funnel: {},
        wages: { offered: { suppressed: true, min: 7 } },
        privacy: "Kichik kesimlar yashiriladi",
        regions: [{ label: "Toshkent", n: 3 }],
      },
    });

    openTab("hc_tab_intel");

    expect(await screen.findByText(`${uz("hc_suppressed")} (n<7)`)).toBeTruthy();
    expect(screen.getByRole("option", { name: "Toshkent" })).toBeTruthy();
  });
});
