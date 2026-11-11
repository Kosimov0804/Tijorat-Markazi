import type { CSSProperties } from "react";
import type { Lang } from "@legacy/data.js";
import { formatMoney } from "../../shell/market";
import type { Translate } from "../../shell/market";

/** "4 mln – 6 mln UZS", a single figure with its currency, or the "not disclosed" line. */
export function salaryText(min: number, max: number, currency: string, lang: Lang, t: Translate): string {
  if (!min && !max) return t("hc_salary_hidden");
  const upper = max && max !== min ? ` – ${formatMoney(max, currency, lang)}` : ` ${currency}`;
  return formatMoney(min, "", lang) + upper;
}

/* Codes the dictionary does not know are shown as they came. */
export const seniorityLabel = (t: Translate) => (code: string): string => t(`hc_sen_${code}`, code);
export const formatLabel = (t: Translate) => (code: string): string => t(`hc_fmt_${code}`, code);
export const availabilityLabel = (t: Translate) => (code: string): string => t(`hc_av_${code}`, code);
export const employmentLabel = (t: Translate) => (code: string): string => t(`hc_emp_${code}`, code);
export const visibilityLabel = (t: Translate) => (code: string): string => t(`hc_vis_${code}`, code);
export const reasonLabel = (t: Translate) => (code: string): string => t(`hc_reason_${code}`, code);

export const AI_INPUT: CSSProperties = {
  padding: "10px 12px",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-sm)",
  background: "var(--card)",
  color: "var(--ink)",
  font: "inherit",
};
export const AI_HINT: CSSProperties = { fontSize: 13.5, color: "var(--text)" };
export const NESTED_LIST: CSSProperties = { marginLeft: 16 };
export const MATCH_EXTRA: CSSProperties = { marginTop: 6 };

/* The codes a recruiter may answer with; the server stores them as typed. */
export const DECLINE_REASON_CODES = "(salary / skill / location / availability / culture / experience / other)";
export const REJECT_REASON_CODES =
  "(salary / skill / location / availability / culture / experience / no-show / other)";
