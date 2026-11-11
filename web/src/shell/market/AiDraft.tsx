/*
 * MK.draft and MK.aiError: a finished AI draft, always shown with its review
 * notice, its assumptions and what is still missing.
 *
 *   askCopilot(body)        POST /api/copilot, narrowed to a CopilotResult
 *   aiErrorKey(result)      the T_MK key that explains a failed answer
 *   <AiDraft result rows>   rows are { label, value }; empty values are skipped
 *                           and string arrays are joined with ", "
 *
 * Everything the model wrote renders as text. A row may pass its own JSX
 * (a list, say) built from narrowed values.
 */
import type { CSSProperties, ReactElement } from "react";
import { useKitText } from "./hooks";
import { marketJson } from "./mk";
import { flag, listOf, record, text, texts } from "./narrow";
import type { Json } from "./narrow";

export type CopilotResult = { ok: boolean; error: string; isOverLimit: boolean; review: string; data: Json };

export async function askCopilot(body: object): Promise<CopilotResult> {
  const answer = await marketJson("/api/copilot", body);
  return {
    ok: flag(answer.ok),
    error: text(answer.error),
    isOverLimit: flag(answer.limit),
    review: text(answer.review),
    data: record(answer.data),
  };
}

export function aiErrorKey(result: CopilotResult): string {
  if (result.isOverLimit) return "mk_ai_limit";
  if (result.error === "ai_off") return "mk_ai_off";
  if (result.error === "identify_first") return "mk_ai_id";
  return "mk_ai_err";
}

export type DraftRow = {
  label: string;
  value: string | number | readonly string[] | ReactElement | null | undefined;
};

const INLINE_LABEL: CSSProperties = { display: "inline", textTransform: "none", letterSpacing: 0 };

function isBlank(value: DraftRow["value"]): boolean {
  if (value == null || value === "") return true;
  return Array.isArray(value) && value.length === 0;
}

function NoteList({ title, items }: { title: string; items: readonly string[] }) {
  if (!items.length) return null;
  return (
    <div className="mk-assume">
      <b>{title}</b>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function AiDraft({ result, rows }: { result: CopilotResult; rows: readonly DraftRow[] }) {
  const t = useKitText();
  if (!result.ok) return <p className="mk-msg is-err">{t(aiErrorKey(result))}</p>;
  const assumptions = listOf(result.data.assumptions, record);
  return (
    <div className="mk-draft">
      <div className="mk-draft-note">⚠ {result.review}</div>
      <dl className="mk-kv">
        {rows
          .filter(row => !isBlank(row.value))
          .flatMap(row => [
            <dt key={`t|${row.label}`}>{row.label}</dt>,
            <dd key={`d|${row.label}`}>{Array.isArray(row.value) ? row.value.join(", ") : row.value}</dd>,
          ])}
      </dl>
      {assumptions.length > 0 && (
        <div className="mk-assume">
          <b>{t("mk_assumptions")}</b>
          <ul>
            {assumptions.map((item, index) => (
              <li key={index}>
                <b style={INLINE_LABEL}>{text(item.field)}:</b> {text(item.assumed)} — <i>{text(item.why)}</i>
              </li>
            ))}
          </ul>
        </div>
      )}
      <NoteList title={t("mk_missing")} items={texts(result.data.missing)} />
      <NoteList title={t("mk_expert")} items={texts(result.data.expertReview)} />
    </div>
  );
}
