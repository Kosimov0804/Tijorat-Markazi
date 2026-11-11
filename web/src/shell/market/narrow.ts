/*
 * Narrowing for market API answers, which stay `unknown` until read here.
 *
 *   record(v)        an object, or {} for anything else
 *   text(v)          a string (finite numbers are written out), else ""
 *   amount(v)        a finite number (numeric strings count), else 0
 *   flag(v)          plain truthiness
 *   list(v)          an array, else []
 *   texts(v)         the non-empty strings of an array
 *   listOf(v, parse) every element of an array run through `parse`
 */
export type Json = Readonly<Record<string, unknown>>;

export const record = (value: unknown): Json =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Json) : {};

export function text(value: unknown): string {
  if (typeof value === "string") return value;
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

export function amount(value: unknown): number {
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 0;
}

export const flag = (value: unknown): boolean => Boolean(value);

export const list = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : []);

export const texts = (value: unknown): string[] => list(value).map(text).filter(Boolean);

export const listOf = <T>(value: unknown, parse: (item: unknown) => T): T[] => list(value).map(parse);
