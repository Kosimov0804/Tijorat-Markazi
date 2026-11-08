import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { T } from "@legacy/data.js";
import { HOSTILE, renderPage, setSearch, stubApi } from "../../test/renderPage";
import { ShowroomPage } from "./ShowroomPage";

const RESPONSE = {
  items: [
    { id: "p/1", name: "Paxta", company: "Alfa", trade: "export" },
    { id: "p2", name: "Stanok", company: "Beta", trade: "import" },
    { name: "Eski yozuv", company: "Alfa" },
  ],
  sectors: [],
  assocs: [],
  companies: ["Alfa", "Beta"],
};

const cards = (container: HTMLElement): number => container.querySelectorAll(".show-card").length;

describe("ShowroomPage", () => {
  afterEach(() => setSearch(""));

  it("links cards that have an id and leaves older entries as plain cards", async () => {
    stubApi({ "/api/showroom": RESPONSE });

    const { container } = renderPage(<ShowroomPage />);
    await screen.findByText("Paxta");

    expect(screen.getByText("Paxta").closest("a")?.getAttribute("href")).toBe("mahsulot.html?id=p%2F1");
    expect(screen.getByText("Eski yozuv").closest("a")).toBeNull();
    expect(cards(container)).toBe(3);
  });

  it("treats an entry without a trade as an export", async () => {
    stubApi({ "/api/showroom": RESPONSE });
    const { container } = renderPage(<ShowroomPage />);
    await screen.findByText("Paxta");

    fireEvent.click(screen.getByRole("tab", { name: T.show_trade_exp![0] }));

    expect(cards(container)).toBe(2);
    expect(screen.queryByText("Stanok")).toBeNull();
  });

  it("pre-filters from ?company= when that company exists", async () => {
    setSearch("?company=Beta");
    stubApi({ "/api/showroom": RESPONSE });

    const { container } = renderPage(<ShowroomPage />);
    await screen.findByText("Stanok");

    expect(cards(container)).toBe(1);
    expect(container.querySelector<HTMLSelectElement>("#showCompany")?.value).toBe("Beta");
  });

  it("ignores a ?company= that names no real company", async () => {
    setSearch("?company=Nope");
    stubApi({ "/api/showroom": RESPONSE });

    const { container } = renderPage(<ShowroomPage />);
    await screen.findByText("Paxta");

    expect(cards(container)).toBe(3);
  });

  it("shows the empty note and no count when the request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    stubApi({ "/api/showroom": 500 });

    const { container } = renderPage(<ShowroomPage />);

    await vi.waitFor(() => expect(container.querySelector<HTMLElement>("#showEmpty")?.hidden).toBe(false));
    expect(container.querySelector("#showCount")?.textContent).toBe("");
  });

  it("shows the placeholder instead of an image from another server", async () => {
    stubApi({ "/api/showroom": { items: [{ id: "x", name: "Tashqi", company: "A", img: "//evil.example/x.jpg" }] } });

    const { container } = renderPage(<ShowroomPage />);
    await screen.findByText("Tashqi");

    expect(container.querySelector("img.show-img")).toBeNull();
    expect(container.querySelector(".show-img-ph")).not.toBeNull();
  });

  it("renders hostile catalogue values as text", async () => {
    stubApi({ "/api/showroom": { items: [{ id: "x", name: HOSTILE, company: HOSTILE, desc: HOSTILE }] } });

    const { container } = renderPage(<ShowroomPage />);

    await screen.findAllByText(HOSTILE);
    expect(container.querySelector(".show-body img")).toBeNull();
  });
});
