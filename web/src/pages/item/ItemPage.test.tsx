import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CENTERS, T } from "@legacy/data.js";
import { renderPage, setSearch, stubApi } from "../../test/renderPage";
import { ItemPage } from "./ItemPage";

describe("ItemPage", () => {
  beforeEach(() => {
    stubApi({});
    vi.stubGlobal("scrollTo", vi.fn());
  });
  afterEach(() => setSearch(""));

  it("shows the requested centre, sets the title and relates up to six others", () => {
    setSearch("?type=center&i=2");

    const { container } = renderPage(<ItemPage />);

    expect(screen.getByRole("heading", { level: 1, name: CENTERS[2].name })).toBeTruthy();
    expect(document.title).toBe(`${CENTERS[2].name} — TIJORAT MARKAZI`);
    const related = [...container.querySelectorAll(".rel-card")].map(card => card.getAttribute("href"));
    expect(related).toHaveLength(6);
    expect(related).not.toContain("item.html?type=center&i=2");
  });

  it.each(["?type=center&i=999", "?type=center&i=abc", "?type=future&i=0", "?type=nope", ""])(
    "shows not-found for %s",
    query => {
      setSearch(query);

      renderPage(<ItemPage />);

      expect(screen.getByRole("heading", { level: 1, name: T.d_notfound![0] })).toBeTruthy();
      expect(document.title).toBe("TIJORAT MARKAZI — 404");
    },
  );
});
