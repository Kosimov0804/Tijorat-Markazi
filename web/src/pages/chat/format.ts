import type { GroupText } from "./text";
import type { Group } from "./types";

const DAY_MS = 864e5;
const pad = (value: number): string => String(value).padStart(2, "0");

/** Identifies the calendar day a message belongs to. */
export function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function dayLabel(timestamp: number, text: GroupText): string {
  const now = Date.now();
  if (dayKey(timestamp) === dayKey(now)) return text("today");
  if (dayKey(timestamp) === dayKey(now - DAY_MS)) return text("yesterday");
  const date = new Date(timestamp);
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

export function initials(name: string): string {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0] || "?")[0] + (parts.length > 1 ? parts[1][0] : "")).toUpperCase();
}

export const roomTitle = (group: Group, text: GroupText): string =>
  group.id === "chairmen" ? text("chairmen") : group.title;
