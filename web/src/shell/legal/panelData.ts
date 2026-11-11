/** What the rights endpoints need to place the person asking. */
export type Credentials = { login: string; password: string; tier?: string };

export type ConsentRecord = { at: number; version: string };
export type RightsRequest = { ref: string; kind: string; status: string; answer: string; due: number };

export type PanelData = {
  /** The export exactly as the server sent it, which is what gets downloaded. */
  raw: unknown;
  consent: ConsentRecord | null;
  requests: RightsRequest[];
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asText = (value: unknown): string =>
  typeof value === "string" ? value : typeof value === "number" ? String(value) : "";

const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** Never rejects: a network or parse failure comes back as null. */
export async function postLegal(path: string, body: object): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const answer: unknown = await response.json();
    return isRecord(answer) ? answer : null;
  } catch {
    return null;
  }
}

function readConsent(raw: Record<string, unknown>): ConsentRecord | null {
  const application = asList(raw.applications)[0];
  const consent = isRecord(application) ? application.consent : null;
  if (!isRecord(consent)) return null;
  return { at: Number(consent.at) || 0, version: asText(consent.version) };
}

export function readPanelData(raw: unknown): PanelData {
  const record = isRecord(raw) ? raw : {};
  return {
    raw,
    consent: readConsent(record),
    requests: asList(record.rightsRequests)
      .filter(isRecord)
      .map(row => ({
        ref: asText(row.ref),
        kind: asText(row.kind),
        status: asText(row.status),
        answer: asText(row.answer),
        due: Number(row.due) || 0,
      })),
  };
}

/** A date as the records state it: YYYY-MM-DD, in the reader's own time zone. */
export function formatRecordDay(timestamp: unknown): string {
  const milliseconds = Number(timestamp);
  if (!milliseconds) return "—";
  const date = new Date(milliseconds);
  const pad = (part: number): string => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/* Handed over as a file rather than a screen: "provide the information" means
   the person keeps a copy, not that they transcribe one. */
export function downloadExport(raw: unknown): void {
  const blob = new Blob([JSON.stringify(raw, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `mening-malumotlarim-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 4000);
}
