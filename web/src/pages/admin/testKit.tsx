import { fireEvent, screen } from "@testing-library/react";
import { vi } from "vitest";
import { renderPage } from "../../test/renderPage";
import { AdminShell } from "./AdminShell";
import type { ViewId } from "./navItems";
import { AT } from "./text";
import type { AdminTextKey } from "./text";

/* Helpers for the admin panel tests only. */

export type Sent = Record<string, unknown>;
type Route = unknown | ((body: Sent, url: string) => unknown);

export interface ApiStub {
  /** Every request made so far, with its parsed JSON body ({} for a GET). */
  calls: { url: string; body: Sent }[];
  /** The bodies sent to one path, oldest first. */
  bodies: (url: string) => Sent[];
}

/** Answers each path with JSON, or with what its function returns; a function that throws is a dropped connection. */
export function stubRoutes(routes: Record<string, Route>): ApiStub {
  const calls: ApiStub["calls"] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options?: RequestInit) => {
      const body = options?.body ? (JSON.parse(String(options.body)) as Sent) : {};
      calls.push({ url, body });
      const route = routes[url];
      const answer: unknown = typeof route === "function" ? (route as (body: Sent, url: string) => unknown)(body, url) : route;
      return { ok: true, status: 200, json: async () => answer ?? {} };
    }),
  );
  return { calls, bodies: url => calls.filter(call => call.url === url).map(call => call.body) };
}

/** The Uzbek wording of a key, which is what a fresh test browser shows. */
export const uz = (key: AdminTextKey): string => AT[key][0];

/** Opens the signed-in panel straight on one view, including those the sidebar does not list. */
export function renderView(view: ViewId): void {
  renderPage(<AdminShell theme="light" onToggleTheme={() => undefined} onLogout={() => undefined} initialView={view} />);
}

export function type(element: HTMLElement, value: string): void {
  fireEvent.change(element, { target: { value } });
}

export const button = (name: string | RegExp): HTMLElement => screen.getByRole("button", { name });

export function orgsFixture(overrides: Sent = {}): Sent {
  return {
    associations: [{ id: "a1", name: "Toʻqimachilar", i18n: {}, chairman: "Ali Valiyev", login: "assoc1" }],
    companies: [
      { id: "c1", assocId: "a1", name: "Alfa Tekstil", sector: "Textile", login: "alfa", showroom: [{}, {}] },
      { id: "c2", assocId: "a1", name: "Beta", sector: "", login: "beta", showroom: [] },
    ],
    rais: { login: "rais", tgChat: "42" },
    ...overrides,
  };
}
