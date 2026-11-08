import { describe, expect, it } from "vitest";
import { foldUzbek } from "./foldUzbek";

describe("foldUzbek", () => {
  it.each([
    ["Toşkent", "toshkent"],
    ["ÇIQIŞ", "chiqish"],
    ["Özbekiston", "o'zbekiston"],
    ["Farğona", "farg'ona"],
    ["O‘zbekiston", "o'zbekiston"],
    ["Oʻzbekiston", "o'zbekiston"],
    ["maʼlumot", "ma'lumot"],
  ])("folds %s to %s", (input, expected) => {
    expect(foldUzbek(input)).toBe(expected);
  });

  it("makes both alphabets meet in the middle", () => {
    expect(foldUzbek("Toshkent shahri")).toBe(foldUzbek("Toşkent şahri"));
  });

  it("leaves Russian and English alone apart from case", () => {
    expect(foldUzbek("Ташкент Showroom")).toBe("ташкент showroom");
  });
});
