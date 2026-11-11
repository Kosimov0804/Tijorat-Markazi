import { isRecord } from "../../shell/chat";
import { readStored, writeStored } from "../../shell/storage";

/** The cabinet credentials sent with a question; the server validates them. */
export type PanelAuth =
  | { role: "admin"; pass: "admin" }
  | { role: "company" | "assoc" | "analyst"; login: string; password: unknown };

export type PanelHome = "admin.html" | "association.html" | "company.html" | "tahlil.html";

export interface PanelIdentity {
  /** Not a mailbox: the key the server files this account's chats under. */
  email: string;
  label: string;
  home: PanelHome;
}

const COMPANY_TAG_LENGTH = 160;
const GUEST_ID_KEY = "kg_guest_id";

const ACCOUNT_KEYS = [
  { key: "kg_co", role: "company" },
  { key: "kg_as", role: "assoc" },
  { key: "kg_an", role: "analyst" },
] as const;

const HOMES: Record<PanelAuth["role"], PanelHome> = {
  admin: "admin.html",
  assoc: "association.html",
  company: "company.html",
  analyst: "tahlil.html",
};

const query = (name: string): string => new URLSearchParams(window.location.search).get(name) ?? "";

/** When opened from a company panel (?co=Name), questions are tagged with that company. */
export const companyTag = (): string => query("co").slice(0, COMPANY_TAG_LENGTH);

function storedLogin(key: string): { login: string; password: unknown } | null {
  try {
    const value: unknown = JSON.parse(readStored("sessionStorage", key) ?? "null");
    return isRecord(value) && typeof value.login === "string" && value.login
      ? { login: value.login, password: value.password }
      : null;
  } catch {
    return null;
  }
}

/* Privileged roles get unlimited AI. The credentials come from the cabinet
   that opened the assistant and are validated by the server, so a faked flag
   does not bypass the limit. */
export function panelAuth(): PanelAuth | null {
  if (readStored("sessionStorage", "kg_admin") === "1") return { role: "admin", pass: "admin" };
  for (const { key, role } of ACCOUNT_KEYS) {
    const account = storedLogin(key);
    if (account) return { role, ...account };
  }
  return null;
}

/* Opened from a panel link (?panel=...) whose session did not carry over:
   still skip the sign-in, so cabinet users never bounce to the public page. */
function identityFromLink(company: string): PanelIdentity | null {
  const panel = query("panel");
  const slug = (company || "x").toLowerCase().replace(/[^a-z0-9]+/g, "") || "panel";
  if (panel === "admin") return { email: "admin@konglomerat", label: "Admin", home: "admin.html" };
  if (panel === "assoc") {
    return { email: `assoc-${slug}@konglomerat`, label: company || "Uyuşma", home: "association.html" };
  }
  if (panel === "company") {
    return { email: `company-${slug}@konglomerat`, label: company || "Kompaniya", home: "company.html" };
  }
  return null;
}

/** Who the assistant is talking to when it was opened from a signed-in cabinet. */
export function autoIdentity(company: string): PanelIdentity | null {
  const auth = panelAuth();
  if (!auth) return identityFromLink(company);
  if (auth.role === "admin") return { email: "admin@konglomerat", label: "Admin", home: "admin.html" };
  return {
    email: `${auth.role}-${auth.login || "panel"}@konglomerat`,
    label: company || auth.login,
    home: HOMES[auth.role],
  };
}

/** A stable per-browser id, so the free-question count survives reloads. */
export function ensureGuestId(): string {
  const stored = readStored("localStorage", GUEST_ID_KEY);
  if (stored) return stored;
  const created = `guest_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  writeStored("localStorage", GUEST_ID_KEY, created);
  return created;
}
