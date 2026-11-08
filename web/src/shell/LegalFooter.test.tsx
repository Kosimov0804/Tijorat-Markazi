import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderPage } from "../test/renderPage";
import { LegalFooter } from "./LegalFooter";

function stubLegalResponse(body: unknown): void {
  vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => body })));
}

const DOCS = { oferta: { title: { uz: "Ommaviy oferta", ru: "Публичная оферта" } } };

describe("LegalFooter", () => {
  it("renders hostile operator values as text, never as markup", async () => {
    const payload = "<img src=x onerror=alert(1)>";
    stubLegalResponse({ ok: true, ready: true, docs: DOCS, operator: { legalName: payload } });

    const { container } = renderPage(<LegalFooter />);

    expect(await screen.findByText(payload)).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  it("omits placeholder requisites instead of printing them", async () => {
    stubLegalResponse({ ok: true, docs: DOCS, operator: { legalName: "[TO'LDIRILSIN: nom]", email: "a@b.uz" } });

    const { container } = renderPage(<LegalFooter />);

    expect(await screen.findByText("a@b.uz")).toBeTruthy();
    expect(container.textContent).not.toContain("TO'LDIRILSIN");
    expect(screen.queryByText("Operator")).toBeNull();
  });

  it("shows the data contact only when it differs from the general mailbox", async () => {
    stubLegalResponse({ ok: true, docs: DOCS, operator: { email: "Info@b.uz", dpoEmail: "info@b.uz" } });

    const { container } = renderPage(<LegalFooter />);

    expect(await screen.findByText("Info@b.uz")).toBeTruthy();
    expect(container.textContent).not.toContain("info@b.uz");
  });

  it("tells only oversight that requisites are unfilled", async () => {
    sessionStorage.setItem("kg_admin", "1");
    stubLegalResponse({ ok: true, ready: false, docs: DOCS, operator: {} });

    const { container } = renderPage(<LegalFooter />);

    await waitFor(() => expect(container.querySelector(".lg-todo")).not.toBeNull());
  });

  it("hides the unfilled notice from everyone else", async () => {
    stubLegalResponse({ ok: true, ready: false, docs: DOCS, operator: {} });

    const { container } = renderPage(<LegalFooter />);

    expect(await screen.findByText("Ommaviy oferta")).toBeTruthy();
    expect(container.querySelector(".lg-todo")).toBeNull();
  });

  it("uses fixed document links and falls back to Uzbek labels for English", async () => {
    localStorage.setItem("kg_lang", "en");
    stubLegalResponse({ ok: true, ready: true, docs: DOCS, operator: {} });

    renderPage(<LegalFooter />);

    const link = await screen.findByRole("link", { name: "Ommaviy oferta" });
    expect(link.getAttribute("href")).toBe("oferta.html");
  });

  it("leaves an empty slot when the API is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));

    const { container } = renderPage(<LegalFooter />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container.querySelector("#footerLegal")?.textContent).toBe("");
  });
});
