const pad = (value: number): string => String(value).padStart(2, "0");

/** 1536 → "2 KB". Nothing for an unknown size, so the caller can omit the line. */
export function humanSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/** A duration in seconds as m:ss. */
export function clock(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(whole / 60)}:${pad(whole % 60)}`;
}

/** A timestamp as HH:MM, or nothing when it is not a date. */
export function timeOfDay(timestamp: number): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "" : `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** HH:MM for today, DD.MM.YYYY HH:MM for any other day. */
export function stamp(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  const time = timeOfDay(timestamp);
  if (date.toDateString() === new Date().toDateString()) return time;
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${time}`;
}
