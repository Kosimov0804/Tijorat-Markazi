import { act, fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { T } from "@legacy/data.js";
import { renderPage } from "../test/renderPage";
import { SiteHeader } from "./SiteHeader";

const SIGN_IN = { href: "assistant.html", labelKey: "btn_signin" };
const label = (key: string): string => T[key]![0];

describe("SiteHeader", () => {
  it("marks only the current page active", () => {
    renderPage(<SiteHeader active="about.html" />);

    expect(screen.getByRole("link", { name: label("nav_about") }).className).toBe("active");
    expect(screen.getByRole("link", { name: label("nav_showroom") }).className).toBe("");
  });

  it("opens a nav group on click and closes it on Escape, returning focus", () => {
    renderPage(<SiteHeader />);
    const button = screen.getByRole("button", { name: label("nav_markets") });

    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.closest(".nav-group")?.className).toContain("is-open");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(button);
  });

  it("keeps a single group open at a time", () => {
    renderPage(<SiteHeader />);
    const markets = screen.getByRole("button", { name: label("nav_markets") });
    const services = screen.getByRole("button", { name: label("nav_services") });

    fireEvent.click(markets);
    fireEvent.click(services);

    expect(markets.getAttribute("aria-expanded")).toBe("false");
    expect(services.getAttribute("aria-expanded")).toBe("true");
  });

  it("toggles the burger menu and closes it when a link is followed", () => {
    const { container } = renderPage(<SiteHeader />);
    const nav = container.querySelector("#nav")!;
    const burger = screen.getByRole("button", { name: "Menyu" });

    fireEvent.click(burger);
    expect(nav.className).toContain("open");

    fireEvent.click(screen.getByRole("link", { name: label("nav_about") }));
    expect(nav.className).not.toContain("open");
  });

  it("cycles the language through every label and remembers it", () => {
    renderPage(<SiteHeader />);

    fireEvent.click(screen.getByRole("button", { name: "UZ" }));

    expect(screen.getByRole("button", { name: "RU" })).toBeTruthy();
    expect(screen.getByRole("link", { name: T.nav_about![1] })).toBeTruthy();
    expect(localStorage.getItem("kg_lang")).toBe("ru");
  });

  it("falls back to Uzbek when the stored language is not supported", () => {
    localStorage.setItem("kg_lang", "de");

    renderPage(<SiteHeader />);

    expect(screen.getByRole("button", { name: "UZ" })).toBeTruthy();
  });

  it("toggles and remembers the theme", () => {
    renderPage(<SiteHeader />);
    expect(document.documentElement.dataset.theme).toBe("light");

    fireEvent.click(screen.getByRole("button", { name: "Tema" }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("kg_theme")).toBe("dark");
  });

  it("shows sign-in and no logout when signed out", () => {
    const { container } = renderPage(<SiteHeader action={SIGN_IN} />);

    expect(screen.getByRole("link", { name: label("btn_signin") })).toBeTruthy();
    expect(container.querySelector("#globalLogout")).toBeNull();
  });

  it("replaces sign-in with logout for a signed-in session but keeps other actions", () => {
    sessionStorage.setItem("kg_co", "1");

    const first = renderPage(<SiteHeader action={SIGN_IN} />);
    expect(screen.queryByRole("link", { name: label("btn_signin") })).toBeNull();
    expect(first.container.querySelector("#globalLogout")).not.toBeNull();
    first.unmount();

    const second = renderPage(<SiteHeader action={{ href: "index.html", labelKey: "d_home2" }} />);
    const actions = second.container.querySelector<HTMLElement>(".header-actions")!;
    expect(within(actions).getByRole("link", { name: label("d_home2") })).toBeTruthy();
  });

  it("highlights the group that holds the current page, and only that group", () => {
    renderPage(<SiteHeader active="bozor.html" />);
    const groupOf = (key: string) => screen.getByRole("button", { name: label(key) }).closest(".nav-group")!;

    expect(groupOf("nav_markets").className).toContain("is-active");
    expect(groupOf("nav_services").className).not.toContain("is-active");
  });

  it("walks into the menu with ArrowDown", () => {
    renderPage(<SiteHeader />);
    const button = screen.getByRole("button", { name: label("nav_markets") });

    fireEvent.keyDown(button, { key: "ArrowDown" });

    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement?.getAttribute("href")).toBe("bozor.html");
  });

  it("opens on hover and closes when the pointer leaves", () => {
    renderPage(<SiteHeader />);
    const button = screen.getByRole("button", { name: label("nav_markets") });
    const group = button.closest(".nav-group")!;

    fireEvent.mouseEnter(group);
    expect(button.getAttribute("aria-expanded")).toBe("true");

    fireEvent.mouseLeave(group);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes a group when focus tabs out of it", () => {
    renderPage(<SiteHeader />);
    const button = screen.getByRole("button", { name: label("nav_markets") });
    fireEvent.click(button);

    fireEvent.focusOut(button.closest(".nav-group")!, { relatedTarget: document.body });

    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  describe("when the links overflow a wide bar", () => {
    beforeEach(() => {
      vi.spyOn(Element.prototype, "scrollWidth", "get").mockReturnValue(1400);
      vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(1200);
    });

    it("measures the overflow and switches to the compact layout", () => {
      sessionStorage.setItem("kg_co", "1");

      const { container } = renderPage(<SiteHeader />);

      expect(container.querySelector(".site-header")?.className).toContain("is-compact");
      expect(container.querySelector("#nav > #globalLogout")).not.toBeNull();
    });

    it("keeps an open menu open through a re-measure", async () => {
      const { container } = renderPage(<SiteHeader />);
      fireEvent.click(screen.getByRole("button", { name: "Menyu" }));

      fireEvent(window, new Event("resize"));
      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(container.querySelector("#nav")?.className).toContain("open");
    });
  });

  describe("on a phone-width screen", () => {
    beforeEach(() => {
      vi.stubGlobal("matchMedia", (query: string) => ({ matches: query === "(max-width:950px)", media: query }));
    });

    it("moves the action buttons into the menu so sign-out stays reachable", () => {
      sessionStorage.setItem("kg_co", "1");

      const { container } = renderPage(<SiteHeader action={{ href: "index.html", labelKey: "d_home2" }} />);

      expect(container.querySelectorAll("#nav > .btn.nav-action")).toHaveLength(2);
      expect(container.querySelectorAll(".header-actions > .btn")).toHaveLength(0);
    });

    it("keeps an open menu open when the viewport resizes", async () => {
      const { container } = renderPage(<SiteHeader />);
      fireEvent.click(screen.getByRole("button", { name: "Menyu" }));

      fireEvent(window, new Event("resize"));
      await act(async () => {
        await new Promise(resolve => requestAnimationFrame(resolve));
      });

      expect(container.querySelector("#nav")?.className).toContain("open");
    });
  });

  it("does not treat the guest tracking id as a signed-in session", () => {
    localStorage.setItem("kg_guest_id", "guest-1");

    const { container } = renderPage(<SiteHeader />);

    expect(container.querySelector("#globalLogout")).toBeNull();
  });
});
