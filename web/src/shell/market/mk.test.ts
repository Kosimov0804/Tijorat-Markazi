import { describe, expect, it, vi } from "vitest";
import { stubApi } from "../../test/renderPage";
import {
  companyIdentity,
  companyLogin,
  formatMoney,
  formatPercent,
  identity,
  marketJson,
  marketQuery,
  safeHttpUrl,
  safeImageUrl,
} from "./mk";
import { amount, flag, list, listOf, record, text, texts } from "./narrow";

describe("formatMoney", () => {
  it("shortens millions and billions with the language's unit", () => {
    expect(formatMoney(3_200_000_000, "UZS", "en")).toBe("3.20 B UZS");
    expect(formatMoney(4_500_000, "", "en")).toBe("4.50 M");
    expect(formatMoney(4_500_000, "UZS", "uz")).toContain("mln UZS");
  });

  it("keeps small sums whole and adds the currency", () => {
    expect(formatMoney(950, "USD", "en")).toBe("950 USD");
  });

  it("reads zero and anything that is not a number as a dash", () => {
    expect(formatMoney(0, "UZS", "en")).toBe("—");
    expect(formatMoney("abc", "UZS", "en")).toBe("—");
    expect(formatMoney(undefined, "UZS", "en")).toBe("—");
  });
});

describe("formatPercent", () => {
  it("rounds to a whole percent", () => {
    expect(formatPercent(41.6, "en")).toBe("42%");
  });

  it("shows a dash when the figure is missing", () => {
    expect(formatPercent(undefined, "en")).toBe("—");
  });
});

describe("marketQuery", () => {
  it("drops empty, null, undefined and false values", () => {
    expect(marketQuery({ q: "", channel: "b2b", certified: false, local: true, region: null, sector: undefined })).toBe(
      "channel=b2b&local=true",
    );
  });

  it("encodes keys and values", () => {
    expect(marketQuery({ q: "a&b=c d" })).toBe("q=a%26b%3Dc%20d");
  });
});

describe("safe urls", () => {
  it("accepts only http and https links", () => {
    expect(safeHttpUrl("https://example.uz/a")).toBe("https://example.uz/a");
    expect(safeHttpUrl("javascript:alert(1)")).toBe("");
    expect(safeHttpUrl(undefined)).toBe("");
  });

  it("accepts same-origin images but not protocol-relative ones", () => {
    expect(safeImageUrl("/uploads/a.jpg")).toBe("/uploads/a.jpg");
    expect(safeImageUrl("//evil.example/a.jpg")).toBe("");
    expect(safeImageUrl("data:image/svg+xml,<svg/>")).toBe("");
  });
});

describe("narrowing", () => {
  it("turns anything that is not an object into an empty record", () => {
    expect(record(null)).toEqual({});
    expect(record(["a"])).toEqual({});
    expect(record("x")).toEqual({});
    expect(record({ a: 1 })).toEqual({ a: 1 });
  });

  it("reads text from strings and finite numbers only", () => {
    expect(text("a")).toBe("a");
    expect(text(12)).toBe("12");
    expect(text({ toString: () => "<b>" })).toBe("");
    expect(text(Number.NaN)).toBe("");
  });

  it("reads amounts from numbers and numeric strings", () => {
    expect(amount("12.5")).toBe(12.5);
    expect(amount(" ")).toBe(0);
    expect(amount("12abc")).toBe(0);
    expect(amount(Infinity)).toBe(0);
  });

  it("reads lists defensively", () => {
    expect(list("abc")).toEqual([]);
    expect(texts(["a", 2, null, { b: 1 }, ""])).toEqual(["a", "2"]);
    expect(listOf([{ n: "3" }, null], item => amount(record(item).n))).toEqual([3, 0]);
    expect(flag(1)).toBe(true);
    expect(flag(undefined)).toBe(false);
  });
});

describe("marketJson", () => {
  it("answers with the parsed record", async () => {
    stubApi({ "/api/x": { ok: true, n: 1 } });

    expect(await marketJson("/api/x")).toEqual({ ok: true, n: 1 });
  });

  it("posts a JSON body when one is given", async () => {
    stubApi({ "/api/x": { ok: true } });

    await marketJson("/api/x", { a: 1 });

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect(options).toMatchObject({ method: "POST", body: '{"a":1}' });
  });

  it("reports a network failure instead of rejecting", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    expect(await marketJson("/api/x")).toEqual({ error: "network" });
  });

  it("reports an answer that is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: () => Promise.reject(new SyntaxError("Unexpected token <")) }),
    );

    expect(await marketJson("/api/x")).toEqual({ error: "bad_response" });
  });
});

describe("company identity", () => {
  it("keeps the company for the session and attaches its credentials", async () => {
    stubApi({ "/api/company/login": { ok: true, company: { id: "c1", name: "Alfa", sector: "Agro" } } });

    const session = await companyLogin("alfa", "secret");

    expect(session).toEqual({ login: "alfa", password: "secret", id: "c1", name: "Alfa", sector: "Agro" });
    expect(localStorage.getItem("mk_co")).toBeNull();
    expect(companyIdentity.company()?.name).toBe("Alfa");
    expect(companyIdentity.withCompany({ id: "p1" })).toEqual({ id: "p1", login: "alfa", password: "secret" });
  });

  it("stores nothing when the sign-in is refused", async () => {
    stubApi({ "/api/company/login": { ok: false, error: "invalid" } });

    expect(await companyLogin("alfa", "wrong")).toBeNull();
    expect(companyIdentity.company()).toBeNull();
    expect(companyIdentity.withCompany({ id: "p1" })).toEqual({ id: "p1" });
  });

  it("treats a corrupted stored session as signed out", () => {
    sessionStorage.setItem("mk_co", "{not json");

    expect(companyIdentity.company()).toBeNull();
  });

  it("attaches the person's e-mail and name", () => {
    identity.setPerson("ali@example.uz", "Ali");

    expect(companyIdentity.withPerson({ limit: 5 })).toEqual({ limit: 5, email: "ali@example.uz", name: "Ali" });
  });
});
