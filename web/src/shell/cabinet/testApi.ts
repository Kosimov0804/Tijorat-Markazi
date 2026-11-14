/**
 * TEST HELPER for cabinet pages: answers fetch by path and records every call.
 *
 *   const calls = stubCabinetApi({
 *     "/api/assoc/login": { assoc: {…}, companies: [] },        // 200 with this JSON
 *     "/api/assoc/companies": body => ({ companies: […] }),     // computed from the POST body
 *     "/api/assoc/news": 500,                                   // refused, empty body
 *     "/api/x": refused(409, { error: "login exists" }),        // refused, with a body
 *   });
 *   bodiesSentTo(calls, "/api/assoc/companies")   → the parsed POST bodies, in order
 *
 * A path that is not listed answers 404. GET routes are matched with their query.
 */
import { vi } from "vitest";

export type ApiBody = Record<string, unknown>;
export type ApiCall = { url: string; body: ApiBody };
type Refusal = { refusedWith: number; body: unknown };
type Answer = unknown;
/** A JSON answer, a refusal status, or a function of the POST body returning either. */
export type ApiRoute = number | Refusal | Readonly<Record<string, unknown>> | ((body: ApiBody) => Answer);

export const refused = (status: number, body: unknown = {}): Refusal => ({ refusedWith: status, body });

const isRefusal = (answer: unknown): answer is Refusal =>
  typeof answer === "object" && answer !== null && "refusedWith" in answer;

function respond(answer: Answer) {
  const refusal = typeof answer === "number" ? refused(answer) : isRefusal(answer) ? answer : null;
  if (refusal) return { ok: false, status: refusal.refusedWith, json: async () => refusal.body };
  return { ok: true, status: 200, json: async () => answer };
}

export function stubCabinetApi(routes: Record<string, ApiRoute>): ApiCall[] {
  const calls: ApiCall[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: { body?: string }) => {
      const body = JSON.parse(init?.body ?? "{}") as ApiBody;
      calls.push({ url, body });
      if (!(url in routes)) return respond(404);
      const route = routes[url];
      return respond(typeof route === "function" ? route(body) : route);
    }),
  );
  return calls;
}

export const bodiesSentTo = (calls: readonly ApiCall[], url: string): ApiBody[] =>
  calls.filter(call => call.url === url).map(call => call.body);
