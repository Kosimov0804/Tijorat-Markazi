import { writeStored } from "./storage";

const PAGE_PATTERN = /^[a-z0-9._-]+\.html$/i;
const SESSION_KEY_PATTERN = /^kg_[a-z_]+$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The one sign-in for every account tier (auth.js). The server checks the
 * credentials against each tier and answers with the cabinet to open plus the
 * session keys that cabinet expects. Resolves to that page, or null when
 * nothing matched or the server could not be reached: offline is not a pass.
 */
export async function resolveLogin(loginInput: string, passwordInput: string): Promise<string | null> {
  const login = loginInput.trim();
  if (!login && !passwordInput) return null;

  let data: unknown;
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password: passwordInput }),
    });
    if (!response.ok) return null;
    data = await response.json();
  } catch {
    return null;
  }
  if (!isRecord(data) || !data.ok || typeof data.target !== "string") return null;

  /* Only ever a same-site page, never wherever the response points. */
  if (!PAGE_PATTERN.test(data.target)) return null;

  const keys = isRecord(data.keys) ? data.keys : {};
  Object.entries(keys).forEach(([key, value]) => {
    if (SESSION_KEY_PATTERN.test(key)) writeStored("sessionStorage", key, String(value));
  });
  return data.target;
}
