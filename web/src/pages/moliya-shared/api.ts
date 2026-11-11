import { readStored } from "../../shell/storage";
import { isRecord, record, text } from "./narrow";
import type { Json } from "./narrow";

/** null stands for an answer that was valid JSON but not an object. */
export type ApiAnswer = Json | null;

/** As MK.api: never rejects, a failure comes back as `{ error }`. */
export async function moliyaApi(path: string, body: object): Promise<ApiAnswer> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    try {
      const answer: unknown = await response.json();
      return isRecord(answer) ? answer : null;
    } catch {
      return { error: "bad_response" };
    }
  } catch {
    return { error: "network" };
  }
}

export const hasFailed = (answer: ApiAnswer): boolean => !answer || Boolean(answer.error);

/** The server's error code, or "" when the answer carries none. */
export const errorCode = (answer: ApiAnswer): string => (answer?.error ? String(answer.error) : "");

function storedJson(area: "localStorage" | "sessionStorage", key: string): Json {
  try {
    return record(JSON.parse(readStored(area, key) ?? "null"));
  } catch {
    return {};
  }
}

/** The company signed in on a market page; kept for the session only. */
export function signedInCompany(): { login: string; password: string; name: string } | null {
  const company = storedJson("sessionStorage", "mk_co");
  if (!Object.keys(company).length) return null;
  return { login: text(company.login), password: text(company.password), name: text(company.name) };
}

const adminPassword = (): string => text(storedJson("localStorage", "kg_admin").password);

/**
 * The identity every request carries in its body: the person, then the
 * company when one is signed in, then the admin password, by which the
 * server tells an expert. An empty password is left out altogether.
 */
export function withIdentity(extra: object): Record<string, unknown> {
  const company = signedInCompany();
  const pass = adminPassword();
  return {
    ...extra,
    email: readStored("localStorage", "mk_email") ?? "",
    name: readStored("localStorage", "mk_name") ?? "",
    ...(company ? { login: company.login, password: company.password } : {}),
    ...(pass ? { pass } : {}),
  };
}

export { adminPassword };
