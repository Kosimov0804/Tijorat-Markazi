import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { T } from "@legacy/data.js";
import { HOSTILE, renderPage, stubApi } from "../../test/renderPage";
import { XizmatlarPage } from "./XizmatlarPage";

const RESPONSE = {
  items: [
    { title: "Audit", company: "Alfa", sector: "Moliya", assoc: "A1", price: "100" },
    { title: "Logistika", company: "Beta", sector: "Transport", assoc: "A2" },
  ],
  sectors: ["Moliya", "Transport"],
  assocs: ["A1", "A2"],
  companies: ["Alfa", "Beta"],
  assocI18n: { A1: { uz: "Birinchi uyushma" } },
};

const countText = (n: number): string => T.svc_count![0].replace("{n}", String(n));

describe("XizmatlarPage", () => {
  it("lists every service with its count", async () => {
    stubApi({ "/api/services": RESPONSE });

    renderPage(<XizmatlarPage />);

    expect(await screen.findByText("Audit")).toBeTruthy();
    expect(screen.getByText(countText(2))).toBeTruthy();
  });

  it("filters by sector and shows translated association labels", async () => {
    stubApi({ "/api/services": RESPONSE });
    const { container } = renderPage(<XizmatlarPage />);
    await screen.findByText("Audit");

    expect(screen.getByRole("option", { name: "Birinchi uyushma" })).toBeTruthy();
    fireEvent.change(container.querySelector("#svcSector")!, { target: { value: "Transport" } });

    expect(screen.queryByText("Audit")).toBeNull();
    expect(screen.getByText("Logistika")).toBeTruthy();
    expect(screen.getByText(countText(1))).toBeTruthy();
  });

  it("shows the empty note once a search matches nothing", async () => {
    stubApi({ "/api/services": RESPONSE });
    const { container } = renderPage(<XizmatlarPage />);
    await screen.findByText("Audit");

    fireEvent.change(container.querySelector("#svcSearch")!, { target: { value: "zzz" } });

    expect(container.querySelector<HTMLElement>("#svcEmpty")?.hidden).toBe(false);
  });

  it("treats a failed request as an empty catalogue", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    stubApi({ "/api/services": 500 });

    renderPage(<XizmatlarPage />);

    expect(await screen.findByText(countText(0))).toBeTruthy();
  });

  it("renders hostile catalogue values as text", async () => {
    stubApi({ "/api/services": { items: [{ title: HOSTILE, company: HOSTILE, body: HOSTILE }] } });

    const { container } = renderPage(<XizmatlarPage />);

    await screen.findAllByText(HOSTILE);
    expect(container.querySelector("img")).toBeNull();
  });
});
