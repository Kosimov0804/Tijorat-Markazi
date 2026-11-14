import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HOSTILE } from "../../../test/renderPage";
import { button, orgsFixture, renderView, stubRoutes, type, uz } from "../testKit";
import type { Sent } from "../testKit";

const ORGS = "/api/orgs";

const opsSent = (bodies: Sent[]): unknown[] => bodies.map(body => body.op);

describe("associations view", () => {
  it("lists every association with its chairman, login and member count", async () => {
    stubRoutes({ [ORGS]: orgsFixture() });
    renderView("associations");

    const row = (await screen.findByText("Toʻqimachilar")).closest("tr") as HTMLElement;
    expect((within(row).getByLabelText(uz("as_chair")) as HTMLInputElement).value).toBe("Ali Valiyev");
    expect((within(row).getByLabelText(uz("as_login")) as HTMLInputElement).value).toBe("assoc1");
    expect((within(row).getByLabelText(uz("as_pass")) as HTMLInputElement).value).toBe("");
    expect(within(row).getByText("2")).toBeTruthy();
  });

  it("renders a hostile association name as text, never as markup", async () => {
    stubRoutes({ [ORGS]: orgsFixture({ associations: [{ id: "a1", name: HOSTILE, chairman: HOSTILE, login: "x" }] }) });
    renderView("associations");

    expect(await screen.findByText(HOSTILE)).toBeTruthy();
    expect(document.querySelector("img")).toBeNull();
  });

  it("adds an association with the trimmed name and chairman", async () => {
    const api = stubRoutes({ [ORGS]: orgsFixture() });
    renderView("associations");
    await screen.findByText("Toʻqimachilar");

    type(screen.getByPlaceholderText(uz("as_addname")), "  Qurilish  ");
    type(screen.getByPlaceholderText(uz("as_addchair")), " Vali ");
    fireEvent.click(button(uz("add")));

    await waitFor(() => expect(opsSent(api.bodies(ORGS))).toContain("assoc.add"));
    expect(api.bodies(ORGS).find(body => body.op === "assoc.add")).toEqual({
      pass: "admin",
      op: "assoc.add",
      name: "Qurilish",
      chairman: "Vali",
    });
  });

  it("deletes an association and shows the registry the server answers with", async () => {
    const api = stubRoutes({
      [ORGS]: (body: Sent) => (body.op === "assoc.del" ? orgsFixture({ associations: [], companies: [] }) : orgsFixture()),
    });
    renderView("associations");
    await screen.findByText("Toʻqimachilar");

    fireEvent.click(button(uz("del")));

    await waitFor(() => expect(screen.queryByText("Toʻqimachilar")).toBeNull());
    expect(api.bodies(ORGS).at(-1)).toEqual({ pass: "admin", op: "assoc.del", id: "a1" });
  });

  it("saves an edited cell once, when the edit is committed", async () => {
    const api = stubRoutes({ [ORGS]: orgsFixture() });
    renderView("associations");
    const row = (await screen.findByText("Toʻqimachilar")).closest("tr") as HTMLElement;

    type(within(row).getByLabelText(uz("as_pass")), "new-pass-1");

    await waitFor(() => expect(api.bodies(ORGS).at(-1)).toEqual({ pass: "admin", op: "assoc.update", id: "a1", password: "new-pass-1" }));
  });

  it("saves the rais login, password and Telegram chat together", async () => {
    const api = stubRoutes({ [ORGS]: orgsFixture() });
    renderView("associations");
    const chat = await screen.findByDisplayValue("42");

    type(chat, " 77 ");

    await waitFor(() =>
      expect(api.bodies(ORGS).at(-1)).toEqual({ pass: "admin", op: "rais.set", login: "rais", password: "", tgChat: "77" }),
    );
  });

  it("drills into an association, lists its companies and goes back", async () => {
    stubRoutes({ [ORGS]: orgsFixture() });
    renderView("associations");
    await screen.findByText("Toʻqimachilar");

    fireEvent.click(button(uz("as_open")));

    expect(screen.getByDisplayValue("Alfa Tekstil")).toBeTruthy();
    expect(screen.getByText("alfa")).toBeTruthy();
    fireEvent.click(button(uz("as_back")));
    expect(screen.getByPlaceholderText(uz("as_addname"))).toBeTruthy();
  });

  it("tells the admin when a new company's login is already taken", async () => {
    const api = stubRoutes({
      [ORGS]: (body: Sent) => (body.op === "company.add" ? { error: "login exists" } : orgsFixture()),
    });
    renderView("associations");
    await screen.findByText("Toʻqimachilar");
    fireEvent.click(button(uz("as_open")));

    type(screen.getByPlaceholderText(uz("mb_addname")), "Gamma");
    type(screen.getByPlaceholderText(uz("mb_login")), "alfa");
    type(screen.getByPlaceholderText(uz("mb_pass")), "pw-12345");
    fireEvent.click(button(uz("add")));

    expect((await screen.findByText(uz("mb_login_taken"))).getAttribute("role")).toBe("alert");
    expect(api.bodies(ORGS).at(-1)).toEqual({
      pass: "admin",
      op: "company.add",
      name: "Gamma",
      assocId: "a1",
      sector: "",
      login: "alfa",
      password: "pw-12345",
    });
    expect(screen.getByDisplayValue("Alfa Tekstil")).toBeTruthy();
  });
});

describe("members view", () => {
  it("lists the companies with their association and never a password", async () => {
    stubRoutes({ [ORGS]: orgsFixture() });
    renderView("members");

    const row = (await screen.findByText("Alfa Tekstil")).closest("tr") as HTMLElement;
    expect(within(row).getByText("Toʻqimachilar")).toBeTruthy();
    expect(within(row).getByText(uz("pw_hidden"))).toBeTruthy();
  });

  it("deletes a member company", async () => {
    const api = stubRoutes({ [ORGS]: orgsFixture() });
    renderView("members");
    const row = (await screen.findByText("Beta")).closest("tr") as HTMLElement;

    fireEvent.click(within(row).getByRole("button", { name: uz("del") }));

    await waitFor(() => expect(api.bodies(ORGS).at(-1)).toEqual({ pass: "admin", op: "company.del", id: "c2" }));
  });
});

describe("demo lists", () => {
  it("adds a company to the browser list and deletes one", () => {
    stubRoutes({});
    localStorage.setItem("kg_companies", JSON.stringify([{ name: HOSTILE, sector: "X", status: "on", invest: "" }]));
    renderView("companies");
    expect(screen.getByText(HOSTILE)).toBeTruthy();

    type(screen.getByPlaceholderText(uz("name_ph")), "Yangi");
    type(screen.getByPlaceholderText(uz("sector_ph")), "IT");
    fireEvent.click(button(uz("add")));
    expect(screen.getByText("Yangi")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: uz("del") })[0]);
    expect(screen.queryByText(HOSTILE)).toBeNull();
    expect(JSON.parse(localStorage.getItem("kg_companies") ?? "[]")).toEqual([
      { name: "Yangi", sector: "IT", status: "on", invest: "" },
    ]);
  });

  it("lists the leads newest first and deletes the chosen one", () => {
    stubRoutes({});
    const lead = (name: string) => ({ name, company: "Co", email: "a@b.uz", date: "2026-06-24" });
    localStorage.setItem("kg_leads", JSON.stringify([lead("Birinchi"), lead("Ikkinchi")]));
    renderView("leads");

    const names = screen.getAllByRole("row").slice(1).map(row => row.querySelector("b")?.textContent);
    expect(names).toEqual(["Ikkinchi", "Birinchi"]);

    fireEvent.click(screen.getAllByRole("button", { name: uz("del") })[0]);
    expect(JSON.parse(localStorage.getItem("kg_leads") ?? "[]")).toEqual([lead("Birinchi")]);
  });
});

describe("monthly report view", () => {
  it("shows the month's rows, the totals and the Word download for that month", async () => {
    const totals = { companies: 5, products: 9, invest: 1, news: 2, rnd: 0, questions: 4 };
    const api = stubRoutes({
      "/api/monthly?ym=2026-03": { organizations: 1, rows: [{ n: 1, name: HOSTILE, chairman: "Ali", ...totals }], totals },
    });
    renderView("report");

    type(screen.getByLabelText(uz("rep_month")), "2026-03");

    expect(await screen.findByText(HOSTILE)).toBeTruthy();
    expect(screen.getByText(uz("rep_total"))).toBeTruthy();
    expect(screen.getAllByText("9")).toHaveLength(2);
    expect(screen.getByRole("link", { name: new RegExp(uz("rep_download")) }).getAttribute("href")).toBe("/api/monthly.doc?ym=2026-03");
    expect(api.calls.at(-1)?.url).toBe("/api/monthly?ym=2026-03");
  });
});
