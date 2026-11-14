import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { goTo } from "../../shell/navigate";
import { renderPage } from "../../test/renderPage";
import { AdminPage } from "./AdminPage";
import { NAV, VIEW_TITLE } from "./navItems";
import { button, orgsFixture, stubRoutes, type, uz } from "./testKit";
import { AT } from "./text";

vi.mock("../../shell/navigate", () => ({ goTo: vi.fn(), replaceWith: vi.fn() }));

const PASSWORD = "s3cret-Pa55";

function signIn(login: string, password: string): void {
  type(screen.getByLabelText("Login"), login);
  type(screen.getByLabelText(uz("as_pass")), password);
  fireEvent.click(button(uz("lg_btn")));
}

const heading = (): string => screen.getByRole("heading", { level: 1 }).textContent ?? "";

describe("AdminPage sign-in", () => {
  it("opens the panel on the dashboard when the credentials belong to the admin", async () => {
    const api = stubRoutes({
      "/api/auth/login": { ok: true, target: "admin.html", keys: { kg_admin: "1" } },
      "/api/orgs": orgsFixture(),
    });
    renderPage(<AdminPage />);

    signIn("  boss ", PASSWORD);

    await waitFor(() => expect(heading()).toBe(uz("nav_dash")));
    expect(api.bodies("/api/auth/login")).toEqual([{ login: "boss", password: PASSWORD }]);
    expect(sessionStorage.getItem("kg_admin")).toBe("1");
    expect(document.body.innerHTML).not.toContain(PASSWORD);
  });

  it("reports a wrong password, empties the box and stays on the sign-in card", async () => {
    stubRoutes({ "/api/auth/login": { ok: false } });
    renderPage(<AdminPage />);

    signIn("boss", "wrong");

    expect((await screen.findByRole("alert")).textContent).toBe(uz("lg_err"));
    expect((screen.getByLabelText(uz("as_pass")) as HTMLInputElement).value).toBe("");
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("treats a dropped connection as a failed sign-in", async () => {
    stubRoutes({
      "/api/auth/login": () => {
        throw new Error("offline");
      },
    });
    renderPage(<AdminPage />);

    signIn("boss", PASSWORD);

    expect((await screen.findByRole("alert")).textContent).toBe(uz("lg_err"));
  });

  it("sends another tier's credentials to that tier's cabinet", async () => {
    stubRoutes({ "/api/auth/login": { ok: true, target: "company.html", keys: { kg_co: "{}" } } });
    renderPage(<AdminPage />);

    signIn("alfa", PASSWORD);

    await waitFor(() => expect(goTo).toHaveBeenCalledWith("company.html"));
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("never prints the demo password on the sign-in card", () => {
    stubRoutes({});
    renderPage(<AdminPage />);

    expect(document.body.textContent).not.toMatch(/parol:\s*admin/i);
  });
});

describe("AdminPage session", () => {
  it("opens straight into the panel for an existing session and signs out to the card", async () => {
    sessionStorage.setItem("kg_admin", "1");
    stubRoutes({ "/api/orgs": orgsFixture() });
    renderPage(<AdminPage />);
    expect(heading()).toBe(uz("nav_dash"));

    fireEvent.click(button(uz("logout")));

    expect(sessionStorage.getItem("kg_admin")).toBeNull();
    expect(await screen.findByRole("heading", { name: uz("lg_title") })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("seeds the two demo lists the first time the panel is opened", () => {
    stubRoutes({});
    renderPage(<AdminPage />);

    expect(JSON.parse(localStorage.getItem("kg_companies") ?? "[]")).toHaveLength(4);
    expect(JSON.parse(localStorage.getItem("kg_leads") ?? "[]")).toHaveLength(3);
  });

  it("shows the registry's real counts on the dashboard and sends the pass in the body", async () => {
    sessionStorage.setItem("kg_admin", "1");
    const api = stubRoutes({ "/api/orgs": orgsFixture() });
    renderPage(<AdminPage />);

    expect(await screen.findByText("1 / 2")).toBeTruthy();
    expect(api.bodies("/api/orgs")[0]).toEqual({ pass: "admin", op: "list" });
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain(uz("flow"));
  });

  it("opens every sidebar entry under its own heading", async () => {
    sessionStorage.setItem("kg_admin", "1");
    stubRoutes({ "/api/orgs": orgsFixture() });
    renderPage(<AdminPage />);

    for (const item of NAV) {
      fireEvent.click(button(uz(item.textKey)));
      expect(heading()).toBe(uz(VIEW_TITLE[item.view]));
    }
    await waitFor(() => expect(screen.getByRole("heading", { level: 2, name: uz("nav_set") })).toBeTruthy());
  });

  it("switches the whole panel to the next language and remembers it", () => {
    sessionStorage.setItem("kg_admin", "1");
    stubRoutes({ "/api/orgs": orgsFixture() });
    renderPage(<AdminPage />);

    fireEvent.click(button("UZ"));

    expect(heading()).toBe(AT.nav_dash[1]);
    expect(button(AT.logout[1])).toBeTruthy();
    expect(localStorage.getItem("kg_lang")).toBe("ru");
  });

  it("toggles the theme from the top bar and from the settings view alike", async () => {
    sessionStorage.setItem("kg_admin", "1");
    stubRoutes({});
    renderPage(<AdminPage />);

    fireEvent.click(screen.getByTitle("Tema"));
    expect(document.documentElement.dataset.theme).toBe("dark");

    fireEvent.click(button(uz("nav_set")));
    fireEvent.click(button(uz("light")));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("light"));
    expect(localStorage.getItem("kg_theme")).toBe("light");

    fireEvent.click(button("EN"));
    await waitFor(() => expect(heading()).toBe(AT.nav_set[2]));
  });
});
