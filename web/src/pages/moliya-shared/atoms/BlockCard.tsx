import { CONFIG } from "../engine/engine";
import type { Reason, ReasonParam, ScoreBlock, Scoring } from "../engine/types";
import { useKit } from "../kit";
import type { Kit } from "../kit";
import { trustedHtml } from "../../../shell/trustedHtml";

const PERCENT_PARAMS = ["irr", "hurdle", "diff"];
const TWO_DECIMAL_PARAMS = ["v", "limit"];

function paramText(kit: Kit, name: string, value: ReasonParam): string {
  /* A "label" is itself a dictionary key: startup blocks name their criterion that way. */
  if (name === "label") return kit.t(String(value));
  if (name === "value") return kit.label(value as Parameters<Kit["label"]>[0]) || kit.t("ms_sc_not_set");
  if (PERCENT_PARAMS.includes(name)) return kit.pct1(typeof value === "number" ? value : null);
  if (TWO_DECIMAL_PARAMS.includes(name)) return kit.num(value, 2);
  if (name === "n") return kit.num(value, 0);
  return value == null || typeof value === "object" ? "" : String(value);
}

/**
 * The engine answers with a key and its values; the sentence, and the number
 * format, belong to the reader's language. The result is plain text.
 */
export function reasonText(kit: Kit, reason: Reason | null | undefined): string {
  if (!reason || !reason.key) return "";
  return Object.entries(reason.params ?? {})
    .filter(([name]) => name !== "valueRef")
    .reduce((out, [name, value]) => out.split(`{${name}}`).join(paramText(kit, name, value)), kit.t(reason.key));
}

export function BlockCard({ block }: { block: ScoreBlock }) {
  const kit = useKit();
  const { t, num } = kit;
  const percent = block.max ? Math.round((block.score / block.max) * 100) : 0;
  const why = [reasonText(kit, block.reason), reasonText(kit, block.reason2)].filter(Boolean).join(" ");
  return (
    <div className={block.score === block.max ? "ms-block is-full" : "ms-block"}>
      <div className="ms-block-top">
        <span className="ms-block-name">{t(block.labelKey)}</span>
        <span className="ms-block-val">
          {num(block.score, 0)}
          <i>/</i>
          {num(block.max, 0)}
        </span>
      </div>
      <div className="ms-block-bar">
        <i style={{ width: `${percent}%` }} />
      </div>
      <p className="ms-block-why">{why}</p>
    </div>
  );
}

/**
 * The "raw score capped" sentence. Its markup comes from the bundled
 * dictionary; the two values are numbers this page formats itself, so the
 * line never carries text from the API.
 */
export function cappedLineHtml(kit: Kit, rawTotal: number, wrap: (formatted: string) => string): string {
  return kit
    .t("ms_res_raw_capped")
    .split("{raw}")
    .join(wrap(kit.num(rawTotal, 0)))
    .split("{cap}")
    .join(wrap(kit.num(CONFIG.knockout.capScore, 0)));
}

export function KnockoutPanel({ scoring }: { scoring: Scoring }) {
  const kit = useKit();
  if (!scoring.isKnockout) return null;
  return (
    <div className="ms-knockout">
      <div className="ms-knockout-head">{kit.t("ms_res_ko_title")}</div>
      <div className="ms-knockout-body">
        <ul className="ms-knockout-list">
          {scoring.knockouts.map((rule, index) => (
            <li key={rule?.id || index}>
              <b>{kit.label(rule)}</b>
            </li>
          ))}
        </ul>
        <p
          className="ms-knockout-cap"
          dangerouslySetInnerHTML={trustedHtml(cappedLineHtml(kit, scoring.rawTotal, formatted => `<b>${formatted}</b>`))}
        />
      </div>
    </div>
  );
}
