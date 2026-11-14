import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { replaceWith } from "../../shell/navigate";
import { renderPage } from "../../test/renderPage";
import { RaisPage } from "./RaisPage";
import { LINK, NOTICE } from "./text";

vi.mock("../../shell/navigate", () => ({ goTo: vi.fn(), replaceWith: vi.fn() }));

describe("RaisPage", () => {
  it("redirects to the admin panel in place of the current page", () => {
    renderPage(<RaisPage />);

    expect(replaceWith).toHaveBeenCalledWith("admin.html");
  });

  it("shows the merge notice with a link for a browser that does not follow the redirect", () => {
    renderPage(<RaisPage />);

    expect(screen.getByText(NOTICE)).toBeTruthy();
    expect(screen.getByRole("link", { name: LINK }).getAttribute("href")).toBe("admin.html");
  });

  it("carries the notice in the 2026 Uzbek alphabet", () => {
    expect(NOTICE).toMatch(/[şç]/);
    expect(LINK).toContain("Admin");
  });
});
