import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HOSTILE, renderPage, stubApi } from "../../test/renderPage";
import { HomePage } from "./HomePage";

const ASSOCIATIONS = [
  { id: "a/1&x", name: "- Qurilish", i18n: { uz: "Qurilish", ru: "Строители", en: "Builders" }, chairman: "Karimov", companies: 3 },
  { id: "a2", name: "To'qimachilik", companies: 12 },
];
const DIRECTORY = {
  ok: true,
  items: [
    { bizId: "TM-A-1", kind: "assoc", name: "Qurilish" },
    { bizId: "TM-C-7", kind: "company", name: "Buxoro Tekstil", sector: "Toʻqimaçilik" },
    { bizId: "", kind: "company", name: "No number yet" },
  ],
};
const SHOWROOM = {
  items: [
    { id: "p/1", name: "Paxta", price: "100", desc: "Sifatli", img: "uploads/x.jpg", company: "Buxoro Tekstil", sector: "Toʻqimaçilik" },
    { id: "p2", name: "Non", company: "Samarqand Non" },
  ],
  companies: ["Buxoro Tekstil", "Samarqand Non"],
  total: 2,
};

const ROUTES = { "/api/assoc/list": ASSOCIATIONS, "/api/business-id/directory": DIRECTORY, "/api/showroom": SHOWROOM };

/* jsdom has no <dialog> methods. */
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

describe("HomePage", () => {
  it("lists the busiest associations first, then companies with a number, in the member wall", async () => {
    stubApi(ROUTES);

    renderPage(<HomePage />);

    const wall = await screen.findByRole("complementary");
    const cards = [...wall.querySelectorAll("a.hm-wcard")];
    expect(cards.map(card => card.querySelector("b")?.textContent)).toEqual([
      "To'qimachilik",
      "Qurilish",
      "Buxoro Tekstil",
    ]);
    expect(cards[1].getAttribute("href")).toBe("association.html?id=a%2F1%26x");
    expect(cards[2].getAttribute("href")).toBe("korxona.html?id=TM-C-7");
    expect(wall.querySelector(".hm-wall-count")?.textContent).toBe("2 uyuşma · 1 kompaniya");
  });

  it("drops the wall and centres the copy when the platform has fewer than two members", async () => {
    stubApi({ "/api/assoc/list": [], "/api/business-id/directory": { ok: true, items: [] }, "/api/showroom": { items: [] } });

    const { container } = renderPage(<HomePage />);

    await waitFor(() => expect(container.querySelector(".hm-hero.no-wall")).not.toBeNull());
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(container.querySelector("#homeAssoc")).toBeNull();
    expect(container.querySelector("#homeShow")).toBeNull();
  });

  it("shows a dash rather than a stand-in figure while a count is unknown", async () => {
    stubApi({ "/api/assoc/list": ASSOCIATIONS, "/api/business-id/directory": DIRECTORY, "/api/showroom": 500 });

    const { container } = renderPage(<HomePage />);

    await screen.findByRole("complementary");
    expect(container.querySelector(".hub-big")?.textContent).toBe("—");
  });

  it("links products to their page and renders hostile names as text", async () => {
    stubApi({
      ...ROUTES,
      "/api/showroom": { items: [{ id: "p/1", name: HOSTILE, company: HOSTILE }], companies: [], total: 1 },
    });

    const { container } = renderPage(<HomePage />);

    const name = (await screen.findAllByText(HOSTILE))[0];
    expect(name.closest("a")?.getAttribute("href")).toBe("mahsulot.html?id=p%2F1");
    expect(container.querySelector("#homeShow img")).toBeNull();
  });

  it("opens the idea behind the hero button and closes it again", async () => {
    stubApi(ROUTES);
    const { container } = renderPage(<HomePage />);
    const dialog = container.querySelector("dialog");

    fireEvent.click(screen.getByRole("button", { name: "«Yagona milliy savdo maydoni»" }));
    expect(dialog?.hasAttribute("open")).toBe(true);

    fireEvent.click(screen.getByLabelText("Yopiş"));
    expect(dialog?.hasAttribute("open")).toBe(false);
  });

  it("re-renders the live sections in the next language", async () => {
    stubApi(ROUTES);
    const { container } = renderPage(<HomePage />);
    await screen.findByRole("complementary");
    expect(container.querySelector("#homeAssoc h2")?.textContent).toBe("Uyuşmalar");

    fireEvent.click(container.querySelector("#langBtn") as HTMLElement);

    expect(container.querySelector("#homeAssoc h2")?.textContent).toBe("Ассоциации");
    expect(screen.getAllByText("Строители").length).toBeGreaterThan(0); // the wall and the preview
  });
});
