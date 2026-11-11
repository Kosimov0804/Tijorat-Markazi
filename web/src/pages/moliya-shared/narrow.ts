/* API answers stay `unknown` until they pass through one of these. */
export type Json = Readonly<Record<string, unknown>>;

export const isRecord = (value: unknown): value is Json =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const record = (value: unknown): Json => (isRecord(value) ? value : {});

export function text(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  return typeof value === "number" && Number.isFinite(value) ? String(value) : fallback;
}

/** A finite number, also from a numeric string; anything else is null. */
export function numberOrNull(value: unknown): number | null {
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
}

export const numberOr = (value: unknown, fallback: number): number => numberOrNull(value) ?? fallback;

export const list = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : []);

export const texts = (value: unknown): string[] => list(value).filter((item): item is string => typeof item === "string");

/** How a stored value of any shape reads in a table cell; null when absent. */
export function display(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}
