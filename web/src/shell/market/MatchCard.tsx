/*
 * MK.match: a score dial with the reasons and gaps behind it, never a bare number.
 *
 *   parseMatchScore(v)                 narrows { score, confidence, reasons, gaps }
 *   <MatchCard match title?>extra</MatchCard>
 *   <MatchTitle name by />             the "Title — maker" line most cards carry
 *   dialStyle(score)                   the --v custom property for a bare .mk-dial
 */
import type { CSSProperties, ReactNode } from "react";
import { useI18n } from "../i18n";
import { useKitText } from "./hooks";
import { formatNumber } from "./mk";
import { amount, record, texts } from "./narrow";

export type MatchScore = { score: number; confidence: number; reasons: string[]; gaps: string[] };

export function parseMatchScore(value: unknown): MatchScore {
  const match = record(value);
  return {
    score: amount(match.score),
    confidence: amount(match.confidence),
    reasons: texts(match.reasons),
    gaps: texts(match.gaps),
  };
}

const MAX_REASONS = 4;
const MAX_GAPS = 3;

export const dialStyle = (score: number): CSSProperties =>
  ({ "--v": Math.max(0, Math.min(100, score)) }) as CSSProperties;

type MatchCardProps = { match: MatchScore; title?: ReactNode; children?: ReactNode };

export function MatchCard({ match, title, children }: MatchCardProps) {
  const { lang } = useI18n();
  const t = useKitText();
  const reasons = match.reasons.slice(0, MAX_REASONS);
  const gaps = match.gaps.slice(0, MAX_GAPS);
  return (
    <div className="mk-match">
      <div className="mk-dial" style={dialStyle(match.score)}>
        <b>{formatNumber(match.score, lang, 0)}</b>
      </div>
      <div>
        {title && <div className="mk-h">{title}</div>}
        <ul className="mk-why">
          {reasons.map((reason, index) => (
            <li key={`r${index}`}>{reason}</li>
          ))}
          {gaps.map((gap, index) => (
            <li className="is-gap" key={`g${index}`}>
              {gap}
            </li>
          ))}
          {!reasons.length && !gaps.length && <li className="is-gap">{t("mk_no_reason")}</li>}
        </ul>
        {children}
        <div className="mk-conf">
          {t("mk_conf")}: {formatNumber(match.confidence, lang, 0)}%
        </div>
      </div>
    </div>
  );
}

export function MatchTitle({ name, by }: { name: string; by: string }) {
  return (
    <>
      {name} — <span style={{ color: "var(--muted)", fontWeight: 500 }}>{by}</span>
    </>
  );
}
