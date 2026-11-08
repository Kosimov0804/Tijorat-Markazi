import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { T } from "@legacy/data.js";
import { renderPage, stubApi } from "../../test/renderPage";
import { DavlatXizmatlariPage, safeExternalUrl } from "./DavlatXizmatlariPage";

const RESPONSE = {
  items: [
    { title: "Litsenziya", category: "Ruxsat", agency: "Vazirlik", link: "https://gov.uz/a" },
    { title: "Soliq", category: "Moliya", agency: "Soliq qo'mitasi", link: "javascript:alert(1)" },
  ],
  categories: ["Ruxsat", "Moliya"],
  agencies: ["Vazirlik", "Soliq qo'mitasi"],
};

describe("safeExternalUrl", () => {
  it.each([
    ["https://gov.uz", "https://gov.uz"],
    ["HTTP://gov.uz", "HTTP://gov.uz"],
    ["javascript:alert(1)", undefined],
    ["data:text/html,x", undefined],
    ["//evil.example", undefined],
    ["", undefined],
    [undefined, undefined],
  ])("%s becomes %s", (input, expected) => {
    expect(safeExternalUrl(input)).toBe(expected);
  });
});

describe("DavlatXizmatlariPage", () => {
  it("links out only for real web addresses, safely", async () => {
    stubApi({ "/api/gov-services": RESPONSE });

    const { container } = renderPage(<DavlatXizmatlariPage />);
    await screen.findByText("Litsenziya");

    const links = container.querySelectorAll<HTMLAnchorElement>(".gs-link");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("https://gov.uz/a");
    expect(links[0].rel).toBe("noopener noreferrer");
  });

  it("filters by agency", async () => {
    stubApi({ "/api/gov-services": RESPONSE });
    const { container } = renderPage(<DavlatXizmatlariPage />);
    await screen.findByText("Litsenziya");

    fireEvent.change(container.querySelector("#gsAgency")!, { target: { value: "Vazirlik" } });

    expect(screen.queryByRole("heading", { name: "Soliq" })).toBeNull();
    expect(container.querySelectorAll(".gs-card")).toHaveLength(1);
    expect(screen.getByText(T.gs_count![0].replace("{n}", "1"))).toBeTruthy();
  });
});
