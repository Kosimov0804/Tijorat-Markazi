/* What the company and the buyer sign-up pages share: the request wrapper, the
   account rules both endpoints enforce, and the shape of an application. */

export const LOGIN_RULE = /^[a-z0-9][a-z0-9._-]{2,39}$/;
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

export type ApiAnswer = Record<string, unknown>;

export const isRecord = (value: unknown): value is ApiAnswer => typeof value === "object" && value !== null;

const asText = (value: unknown): string =>
  typeof value === "string" ? value : typeof value === "number" ? String(value) : "";

/**
 * Never rejects. A request that got no answer comes back as `network` and an
 * answer that was not JSON as `bad_response`: the two need different advice.
 */
export async function registerApi(path: string, body?: object): Promise<ApiAnswer> {
  try {
    const options = body
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      : undefined;
    const response = await fetch(path, options);
    const answer: unknown = await response.json().catch(() => ({ error: "bad_response" }));
    return isRecord(answer) ? answer : { error: "bad_response" };
  } catch {
    return { error: "network" };
  }
}

export type Application = {
  ref: string;
  name: string;
  assocName: string;
  login: string;
  email: string;
  status: string;
  kind: string;
  reason: string;
  created: number;
  decided: number;
};

export function readApplication(value: unknown): Application | null {
  if (!isRecord(value)) return null;
  return {
    ref: asText(value.ref),
    name: asText(value.name),
    assocName: asText(value.assocName),
    login: asText(value.login),
    email: asText(value.email),
    status: asText(value.status),
    kind: asText(value.kind),
    reason: asText(value.reason),
    created: Number(value.created) || 0,
    decided: Number(value.decided) || 0,
  };
}

type AccountFields = { email: string; login: string; password: string; passwordRepeat: string };

/**
 * The checks every sign-up form runs on its account fields, in the order the
 * applicant is told about them. Returns a dictionary key, or null when all is
 * well. The server checks it all again, because a client cannot be trusted to.
 */
export function accountError({ email, login, password, passwordRepeat }: AccountFields): string | null {
  if (!EMAIL_RULE.test(email)) return "rg_e_email";
  if (!LOGIN_RULE.test(login)) return "rg_e_login";
  if (password.length < MIN_PASSWORD_LENGTH) return "rg_e_pass";
  if (password !== passwordRepeat) return "rg_e_pass2";
  return null;
}

/** Trimmed text of one named field. Passwords are read untrimmed elsewhere. */
export function readField(form: HTMLFormElement, name: string): string {
  return String(new FormData(form).get(name) ?? "").trim();
}

export function readRawField(form: HTMLFormElement, name: string): string {
  return String(new FormData(form).get(name) ?? "");
}
