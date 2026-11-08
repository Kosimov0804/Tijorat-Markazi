import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HOSTILE, renderPage, stubApi } from "../../test/renderPage";
import { AssociationsPage } from "./AssociationsPage";

const QURILISH = {
  id: "a/1&x",
  name: "- Qurilish",
  i18n: { uz: "Qurilish", ru: "Строители", en: "Builders" },
  chairman: "Karimov",
  companies: 12,
  bizId: "TM-1",
};
const TOQIMACHILIK = { id: "a2", name: "To'qimachilik", companies: 3 };

describe("AssociationsPage", () => {
  it("strips the leading dash and encodes ids into links", async () => {
    stubApi({ "/api/assoc/list": [QURILISH] });

    renderPage(<AssociationsPage />);

    const name = await screen.findByText("Qurilish");
    expect(name.closest("a")?.getAttribute("href")).toBe("association.html?id=a%2F1%26x");
    expect(screen.getByTitle("Business ID").getAttribute("href")).toBe("biznes-id.html?id=TM-1");
  });

  it("finds an association by a name in another language", async () => {
    stubApi({ "/api/assoc/list": [QURILISH, TOQIMACHILIK] });
    renderPage(<AssociationsPage />);
    await screen.findByText("Qurilish");

    fireEvent.change(screen.getByPlaceholderText("Qidirish…"), { target: { value: "строители" } });

    expect(screen.getByText("Qurilish")).toBeTruthy();
    expect(screen.queryByText("To'qimachilik")).toBeNull();
  });

  it("says when nothing matches", async () => {
    stubApi({ "/api/assoc/list": [QURILISH] });
    renderPage(<AssociationsPage />);
    await screen.findByText("Qurilish");

    fireEvent.change(screen.getByPlaceholderText("Qidirish…"), { target: { value: "zzz" } });

    expect(screen.getByText("Hech narsa topilmadi.")).toBeTruthy();
  });

  it("renders hostile names as text", async () => {
    stubApi({ "/api/assoc/list": [{ id: "x", name: HOSTILE, chairman: HOSTILE, companies: 0 }] });

    const { container } = renderPage(<AssociationsPage />);

    expect(await screen.findByText(HOSTILE)).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });
});
