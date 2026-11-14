/**
 * CABINET FORMATTING — dates as the cabinets write them, plus URL guards.
 *
 *   formatDateTime(value, lang)   "5 mart 2026, 09:07"; a value that is not a
 *                                 date comes back as its own text
 *   formatDate(value, lang)       "5 mart 2026"; "" when it is not a date
 *   localDateTime(value)          the browser's own toLocaleString()
 *   webHref(value)                an http(s) address safe for href, else null
 *   mailHref(value)               "mailto:…" for a plain address, else null
 *   phoneHref(value)              "tel:…" from the digits and +, else null
 *   classToken(value)             an API value made safe to join into a class name
 */
import { safeLinkHref } from "../chat/urls";
import { MONTHS_IN_DATE } from "./cabinetText";

const EMAIL_PATTERN = /^[^\s@<>"'?&]+@[^\s@<>"'?&]+$/;

const pad = (value: number): string => String(value).padStart(2, "0");

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const asShown = (value: unknown): string =>
  typeof value === "string" ? value : typeof value === "number" ? String(value) : "";

function dayOf(date: Date, lang: string): string {
  const months: readonly string[] = lang === "ru" || lang === "en" ? MONTHS_IN_DATE[lang] : MONTHS_IN_DATE.uz;
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateTime(value: unknown, lang: string): string {
  const date = toDate(value);
  if (!date) return asShown(value);
  return `${dayOf(date, lang)}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDate(value: unknown, lang: string): string {
  const date = toDate(value);
  return date ? dayOf(date, lang) : "";
}

export function localDateTime(value: unknown): string {
  const date = toDate(value);
  return date ? date.toLocaleString() : asShown(value);
}

export function webHref(value: string): string | null {
  return value ? safeLinkHref(value) : null;
}

export function mailHref(value: string): string | null {
  return EMAIL_PATTERN.test(value) ? `mailto:${value}` : null;
}

export function phoneHref(value: string): string | null {
  const digits = value.replace(/[^+0-9]/g, "");
  return digits ? `tel:${digits}` : null;
}

export function classToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}
