import { afterEach, vi } from "vitest";
import { cleanup, configure } from "@testing-library/react";

/* findBy and waitFor give a loaded machine time to answer. */
configure({ asyncUtilTimeout: 8000 });

/* jsdom has no matchMedia. These tests run as a wide, mouse-driven screen. */
const MATCHING_QUERIES = new Set(["(hover:hover) and (pointer:fine)"]);

vi.stubGlobal("matchMedia", (query: string) => ({
  matches: MATCHING_QUERIES.has(query),
  media: query,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}));

vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe(): void {}
    disconnect(): void {}
  },
);

/* The background painters draw into real layout that jsdom does not have. */
vi.mock("../shell/PageBackground", () => ({ PageBackground: () => null }));

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
