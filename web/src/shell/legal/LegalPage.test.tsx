import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HOSTILE, renderPage, stubApi } from "../../test/renderPage";
import { LegalPage } from "./LegalPage";
import type { LegalText } from "./types";

const DOC: LegalText = {
  lead: { uz: "{brand} kirish", ru: "{brand} вступление" },
  sections: [
    { h: { uz: "Rekvizitlar" }, slot: "operator" },
    { h: { uz: "Noma'lum" }, p: [{ uz: "{mystery} qoladi, {days} kun" }] },
    { h: { uz: "Saqlash" }, slot: "transfers", list: [{ uz: "Band {version}" }] },
    { h: { uz: "Havolalar" }, links: ["maxfiylik", "unknown", "rights"] },
  ],
};

const CONFIG = {
  ok: true,
  ready: true,
  responseDays: 7,
  operator: { brand: "Marka", legalName: "Test MChJ", stir: "[TO'LDIRILSIN: STIR]", email: HOSTILE },
  docs: {
    oferta: { title: { uz: "Rasmiy nom", ru: "Оферта" }, version: "2.1", effective: "2026-01-01" },
    maxfiylik: { title: { uz: "Maxfiylik" } },
  },
};

function renderLegal() {
  return renderPage(<LegalPage docKey="oferta" doc={DOC} fallbackTitle="Zaxira nom" />);
}

describe("LegalPage", () => {
  afterEach(() => localStorage.clear());

  it("fills known tokens and leaves unknown ones visible", async () => {
    stubApi({ "/api/legal": CONFIG });

    renderLegal();

    expect(await screen.findByText("Marka kirish")).toBeTruthy();
    expect(screen.getByText("{mystery} qoladi, 7 kun")).toBeTruthy();
    expect(screen.getByText("Band 2.1")).toBeTruthy();
  });

  it("uses the official title and version stamp, and sets the document title", async () => {
    stubApi({ "/api/legal": CONFIG });

    const { container } = renderLegal();

    expect(await screen.findByRole("heading", { level: 1, name: "Rasmiy nom" })).toBeTruthy();
    expect(container.querySelector("#lgStamp")?.textContent).toBe("Versiya 2.1 · amal qiladi 2026-01-01");
    await waitFor(() => expect(document.title).toBe("Rasmiy nom — Marka"));
  });

  it("shows unfilled requisites as warnings and hostile values as text", async () => {
    stubApi({ "/api/legal": CONFIG });

    const { container } = renderLegal();
    await screen.findByText("Marka kirish");

    const warnings = [...container.querySelectorAll(".lg-kv .lg-todo")].map(node => node.textContent);
    expect(warnings).toContain("[TO'LDIRILSIN: STIR]");
    expect(warnings).toContain("körsatilmagan");
    expect(screen.getAllByText(HOSTILE).length).toBeGreaterThan(0);
    expect(container.querySelector("img")).toBeNull();
  });

  it("links only to known documents, from the fixed map", async () => {
    stubApi({ "/api/legal": CONFIG });

    const { container } = renderLegal();
    await screen.findByText("Marka kirish");

    const links = [...container.querySelectorAll(".lg-links a")].map(link => link.getAttribute("href"));
    expect(links).toEqual(["maxfiylik.html", "mening-malumotlarim.html"]);
  });

  it("states that nothing is transferred when the list is empty", async () => {
    stubApi({ "/api/legal": CONFIG });

    renderLegal();

    expect(await screen.findByText(/taşqariga uzatilmaydi/)).toBeTruthy();
  });

  it("shows English readers the Uzbek text behind a notice", async () => {
    localStorage.setItem("kg_lang", "en");
    stubApi({ "/api/legal": CONFIG });

    const { container } = renderLegal();

    expect(await screen.findByText("Marka kirish")).toBeTruthy();
    expect(container.querySelector(".lg-note-info")).not.toBeNull();
  });

  it("names the admin path only to oversight when requisites are unfilled", async () => {
    stubApi({ "/api/legal": { ...CONFIG, ready: false } });
    const visitor = renderLegal();
    await screen.findByText("Marka kirish");
    expect(visitor.container.querySelector(".lg-note-warn")?.textContent).toContain("Eslatma");
    visitor.unmount();

    sessionStorage.setItem("kg_admin", "1");
    const admin = renderLegal();
    await screen.findByText("Marka kirish");
    expect(admin.container.querySelector(".lg-note-warn")?.textContent).toContain("Admin panel");
  });

  it("still shows the document when the config cannot be read", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    stubApi({ "/api/legal": 500 });

    const { container } = renderLegal();

    expect(await screen.findByText("{brand} kirish")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Zaxira nom" })).toBeTruthy();
    await waitFor(() => expect(container.querySelector("#lgStamp")?.textContent).toContain("—"));
  });

  it("marks the open document in the tabs", async () => {
    stubApi({ "/api/legal": CONFIG });

    renderLegal();

    expect((await screen.findByRole("link", { name: "Ommaviy oferta" })).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Foydalaniş şartlari" }).getAttribute("aria-current")).toBeNull();
  });
});
