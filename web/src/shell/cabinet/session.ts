/**
 * CABINET SESSION — the credentials a cabinet keeps and how it talks to the API.
 *
 * Every cabinet stores `{ login, password }` as JSON under its own
 * sessionStorage key (kg_as, kg_co, kg_an, kg_by, kg_rais) and sends that pair
 * inside the body of each request; there is no cookie.
 *
 *   readCabinetSession(key)          the stored pair, or null (absent or corrupt)
 *   writeCabinetSession(key, pair)
 *   clearCabinetSession(key)
 *   credentialQuery(pair)            "login=…&password=…" for the download links
 *                                    the server only accepts as GET
 *   cabinetPost(path, pair, body?)   POST JSON with the pair merged in. Never
 *                                    rejects: answers { isOk, status, body }, where
 *                                    body is the parsed object ({} when unreadable)
 *                                    and isOk is the HTTP verdict. status 0 means
 *                                    the server could not be reached.
 *   cabinetGet(path)                 the same answer shape for a public GET
 */
import { record } from "../market/narrow";
import type { Json } from "../market/narrow";
import { readStored, removeStored, writeStored } from "../storage";

export type CabinetCredentials = { login: string; password: string };
export type CabinetAnswer = { isOk: boolean; status: number; body: Json };

const UNREACHABLE: CabinetAnswer = { isOk: false, status: 0, body: {} };

export function readCabinetSession(key: string): CabinetCredentials | null {
  try {
    const stored = record(JSON.parse(readStored("sessionStorage", key) ?? "null"));
    if (typeof stored.login !== "string" || !stored.login) return null;
    return { login: stored.login, password: typeof stored.password === "string" ? stored.password : "" };
  } catch {
    /* A corrupt slot is simply not a session. */
    return null;
  }
}

export function writeCabinetSession(key: string, credentials: CabinetCredentials): void {
  writeStored("sessionStorage", key, JSON.stringify(credentials));
}

export function clearCabinetSession(key: string): void {
  removeStored("sessionStorage", key);
}

export function credentialQuery(credentials: CabinetCredentials): string {
  return `login=${encodeURIComponent(credentials.login)}&password=${encodeURIComponent(credentials.password)}`;
}

async function readAnswer(request: Promise<Response>): Promise<CabinetAnswer> {
  try {
    const response = await request;
    const body: unknown = await response.json().catch(() => null);
    return { isOk: response.ok, status: response.status, body: record(body) };
  } catch {
    return UNREACHABLE;
  }
}

export function cabinetPost(path: string, credentials: CabinetCredentials, body: object = {}): Promise<CabinetAnswer> {
  return readAnswer(
    fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: credentials.login, password: credentials.password, ...body }),
    }),
  );
}

export function cabinetGet(path: string): Promise<CabinetAnswer> {
  return readAnswer(fetch(path));
}
