import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderPage } from "../../test/renderPage";
import { T_HUB } from "./hubText";
import { MoliyaPage } from "./MoliyaPage";

const uz = (key: string): string => T_HUB[key]![0];
const en = (key: string): string => T_HUB[key]![2];

describe("MoliyaPage", () => {
  it("offers the three doors, each leading to its own page", () => {
    renderPage(<MoliyaPage />);

    expect(screen.getByText(uz("msh_company_t")).closest("a")?.getAttribute("href")).toBe("moliya-korxona.html");
    expect(screen.getByText(uz("msh_startup_t")).closest("a")?.getAttribute("href")).toBe("moliya-startup.html");
    expect(screen.getByText(uz("msh_investor_t")).closest("a")?.getAttribute("href")).toBe("moliya-investor.html");
  });

  it("marks the page as the financial market and keeps the highlight in the heading", () => {
    const { container } = renderPage(<MoliyaPage />);

    expect(document.body.classList.contains("mk")).toBe(true);
    expect(document.body.dataset.market).toBe("moliya");
    expect(container.querySelector(".mk-hero h1 .mk-hl")).not.toBeNull();
    expect(container.querySelector(".mk-hero-side")).toBeNull();
  });

  it("translates every door when the language changes", () => {
    renderPage(<MoliyaPage />);

    fireEvent.click(screen.getByTitle("Til"));
    fireEvent.click(screen.getByTitle("Til"));

    expect(screen.getByText(en("msh_company_t"))).toBeTruthy();
    expect(screen.getByText(en("msh_investor_m"))).toBeTruthy();
    expect(screen.queryByText(uz("msh_company_d"))).toBeNull();
  });

  it("carries the same dictionary as moliya-hub.js", () => {
    const source = readFileSync(path.resolve(__dirname, "../../../../moliya-hub.js"), "utf8").replace(/\r\n/g, "\n");
    const start = source.indexOf("const T_HUB = {");
    const literal = source.slice(start + "const T_HUB = ".length, source.indexOf("\n};", start) + 2);

    const legacy: unknown = JSON.parse(JSON.stringify(vm.runInNewContext(`(${literal})`)));

    expect(T_HUB).toEqual(legacy);
  });
});
