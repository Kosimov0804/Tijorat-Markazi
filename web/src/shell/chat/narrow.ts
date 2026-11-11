/* API and socket data is `unknown` until one of these has looked at it. */

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const asString = (value: unknown): string =>
  typeof value === "string" ? value : typeof value === "number" ? String(value) : "";

export const asNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const asArray = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : []);
