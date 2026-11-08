import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AB_FEATURES, AB_HOW, AB_ROLES } from "@legacy/data.js";
import { renderPage } from "../../test/renderPage";
import { AboutPage } from "./AboutPage";

describe("AboutPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => ({ ok: false }) })));
  });

  it("renders one card per feature, role and step, all revealed", () => {
    const { container } = renderPage(<AboutPage />);

    expect(container.querySelectorAll("#featuresGrid .center-card.reveal.in")).toHaveLength(AB_FEATURES.length);
    expect(container.querySelectorAll("#rolesGrid .future-card.reveal.in")).toHaveLength(AB_ROLES.length);
    expect(container.querySelectorAll("#howGrid .value-card.reveal.in")).toHaveLength(AB_HOW.length);
  });

  it("numbers the steps from 01", () => {
    const { container } = renderPage(<AboutPage />);

    expect(container.querySelector("#howGrid .value-num")?.textContent).toBe("01");
  });

  it("re-renders fetched-free content when the language changes", () => {
    const { container } = renderPage(<AboutPage />);
    const features = within(container.querySelector<HTMLElement>("#featuresGrid")!);
    expect(features.getByText(AB_FEATURES[1].name[0])).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "UZ" }));

    expect(features.getByText(AB_FEATURES[1].name[1])).toBeTruthy();
    expect(document.documentElement.lang).toBe("ru");
  });

  it("marks About as the active page", () => {
    const { container } = renderPage(<AboutPage />);

    expect(container.querySelector("#nav a.active")?.getAttribute("href")).toBe("about.html");
  });
});
