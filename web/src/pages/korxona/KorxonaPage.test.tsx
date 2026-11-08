import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { T_KORXONA } from "@legacy/markets-i18n.js";
import { HOSTILE, renderPage, setSearch, stubApi } from "../../test/renderPage";
import { KorxonaPage } from "./KorxonaPage";

const API = "/api/company/public?id=c1";
const COMPANY = {
  ok: true,
  company: { name: "Alfa MChJ", sector: "Qishloq", bizId: "TM-1" },
  assoc: { id: "a/1", name: "Qurilish", i18n: { uz: "Qurilish uz" }, chairman: "Karimov" },
  showroom: [{ id: "p1", name: "Paxta" }],
};

describe("KorxonaPage", () => {
  afterEach(() => setSearch(""));

  it("explains itself when no company is named", () => {
    stubApi({});

    renderPage(<KorxonaPage />);

    expect(screen.getByText(T_KORXONA.ko_missing![0])).toBeTruthy();
  });

  it("shows the company, its crumbs and encoded links", async () => {
    setSearch("?id=c1");
    stubApi({ [API]: COMPANY });

    const { container } = renderPage(<KorxonaPage />);

    expect(await screen.findByRole("heading", { level: 1, name: "Alfa MChJ" })).toBeTruthy();
    await waitFor(() => expect(document.title).toBe("Alfa MChJ — TIJORAT MARKAZI"));
    const crumb = container.querySelector("#koCrumbAssoc");
    expect(crumb?.textContent).toBe("Qurilish uz");
    expect(crumb?.getAttribute("href")).toBe("association.html?id=a%2F1");
  });

  it("shows the not-found note when the company does not exist", async () => {
    setSearch("?id=c1");
    stubApi({ [API]: { ok: false } });

    renderPage(<KorxonaPage />);

    expect(await screen.findByText(T_KORXONA.ko_notfound![0])).toBeTruthy();
  });

  it("renders hostile values as text and refuses protocol-relative images", async () => {
    setSearch("?id=c1");
    stubApi({
      [API]: {
        ok: true,
        company: { name: HOSTILE, sector: HOSTILE },
        showroom: [
          { id: "p1", name: HOSTILE, img: "//evil.example/x.jpg" },
          { id: "p2", name: "Paxta", img: "/uploads/a.jpg" },
        ],
      },
    });

    const { container } = renderPage(<KorxonaPage />);

    await screen.findByRole("heading", { level: 1, name: HOSTILE });
    expect([...container.querySelectorAll("img")].map(image => image.getAttribute("src"))).toEqual(["/uploads/a.jpg"]);
  });
});
