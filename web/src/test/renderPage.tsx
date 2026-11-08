import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import { vi } from "vitest";
import { I18nProvider } from "../shell/i18n";

export function renderPage(page: ReactElement): RenderResult {
  return render(<I18nProvider>{page}</I18nProvider>);
}

export const HOSTILE = "<img src=x onerror=alert(1)>";

/** Answers each listed API path with JSON. A number answers with that status. */
export function stubApi(routes: Record<string, unknown>): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const route = url in routes ? routes[url] : { ok: false };
      if (typeof route === "number") return { ok: false, status: route, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => route };
    }),
  );
}

export function setSearch(query: string): void {
  window.history.pushState({}, "", `/test${query}`);
}
