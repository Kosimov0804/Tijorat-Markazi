/*
 * The small render primitives of market-kit.js.
 *
 *   <Chip kind?>            MK.chip      kind: accent | ghost | good | warn | bad | b2b …
 *   <Chips items kind?>     MK.chips
 *   <Empty>                 MK.empty
 *   <Loading />             MK.loading
 *   <Msg notice t id?>      MK.say       hidden until `notice` is set
 *   <Kpi value label …>     MK.kpi
 *   <Funnel steps>          MK.funnel
 *   <Meters blocks>         MK.meters    readiness bars; parseMeter narrows one block
 *   <Ranks rows …>          MK.ranks     rows are { label, value, display? };
 *                                        parseRank reads the usual { label, n }
 *   <Rail steps current>    MK.rail      stage rail, everything before `current` done
 *   <KeyValues rows>        a .mk-kv list of [label, value] pairs, blanks skipped
 *   <PulseStats id items>   the four hero figures
 */
import type { CSSProperties, ReactNode } from "react";
import { useI18n } from "../i18n";
import { useKitText } from "./hooks";
import { formatNumber } from "./mk";
import type { Translate } from "./mk";
import { amount, flag, record, text } from "./narrow";

export function Chip({ kind, children }: { kind?: string; children: ReactNode }) {
  return <span className={kind ? `mk-chip is-${kind}` : "mk-chip"}>{children}</span>;
}

export function Chips({ items, kind }: { items: readonly string[]; kind?: string }) {
  return (
    <div className="mk-chips">
      {items.map((item, index) => (
        <Chip key={`${item}|${index}`} kind={kind}>
          {item}
        </Chip>
      ))}
    </div>
  );
}

export function Empty({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p className="mk-empty" style={style}>
      {children}
    </p>
  );
}

export function Loading() {
  const t = useKitText();
  return <p className="mk-loading">{t("mk_loading")}</p>;
}

/** The key, not the text, so the line follows a language switch. `n` fills "{n}". */
export type Notice = { key: string; kind: "ok" | "err"; n?: number };

export function Msg({ notice, t, id }: { notice: Notice | null; t: Translate; id?: string }) {
  return (
    <p className={notice ? `mk-msg is-${notice.kind}` : "mk-msg"} id={id} hidden={!notice}>
      {notice && t(notice.key).replace("{n}", String(notice.n ?? ""))}
    </p>
  );
}

type KpiProps = { value: ReactNode; label: string; isHero?: boolean; note?: string };

export function Kpi({ value, label, isHero, note }: KpiProps) {
  return (
    <div className={isHero ? "mk-kpi is-hero" : "mk-kpi"}>
      <b>{value}</b>
      <span>{label}</span>
      {note && <em>{note}</em>}
    </div>
  );
}

export function Funnel({ steps }: { steps: readonly { n: unknown; label: string }[] }) {
  const { lang } = useI18n();
  return (
    <div className="mk-funnel">
      {steps.map(step => (
        <div key={step.label}>
          <b>{formatNumber(step.n, lang, 0)}</b>
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

export type Meter = { key: string; pct: number; hint: string };

export function parseMeter(value: unknown): Meter {
  const block = record(value);
  const pct = block.pct != null ? amount(block.pct) : flag(block.ok) ? 100 : 0;
  return { key: text(block.key), pct, hint: text(block.hint) };
}

export function Meters({ blocks }: { blocks: readonly Meter[] }) {
  return (
    <div className="mk-meters">
      {blocks.map((block, index) => (
        <div className="mk-meter" key={`${block.key}|${index}`}>
          <b>
            {block.key}
            <span>{block.pct}%</span>
          </b>
          <div className="mk-bar">
            <i style={{ width: `${block.pct}%` }} />
          </div>
          {block.hint && <em>{block.hint}</em>}
        </div>
      ))}
    </div>
  );
}

export type RankRow = { label: string; value: number; display?: string };

type RanksProps = { rows: readonly RankRow[]; limit?: number; digits?: number; isGap?: boolean };

const DEFAULT_RANK_LIMIT = 8;
const MIN_BAR_PERCENT = 2;

export function Ranks({ rows, limit = DEFAULT_RANK_LIMIT, digits = 0, isGap }: RanksProps) {
  const { lang } = useI18n();
  const t = useKitText();
  const shown = rows.slice(0, limit);
  if (!shown.length) return <p className="mk-loading">{t("mk_nodata")}</p>;
  const max = Math.max(...shown.map(row => row.value)) || 1;
  return (
    <div className="mk-ranks">
      {shown.map((row, index) => (
        <div className={isGap ? "mk-rank is-gap" : "mk-rank"} key={`${row.label}|${index}`}>
          <span title={row.label}>{row.label}</span>
          <b>{row.display ?? formatNumber(row.value, lang, digits)}</b>
          <i style={{ width: `${Math.max(MIN_BAR_PERCENT, Math.round((100 * row.value) / max))}%` }} />
        </div>
      ))}
    </div>
  );
}

/** Reads `{ label, n }` rows, the shape most ranked lists arrive in. */
export function parseRank(value: unknown): RankRow {
  const row = record(value);
  return { label: text(row.label), value: amount(row.n) };
}

type RailProps = { steps: readonly string[]; current: string; labels?: Readonly<Record<string, string>> };

export function Rail({ steps, current, labels }: RailProps) {
  const t = useKitText();
  const currentIndex = steps.indexOf(current);
  return (
    <div className="mk-railbar">
      {steps.map((step, index) => {
        const state = index < currentIndex ? "is-done" : index === currentIndex ? "is-now" : "";
        return (
          <div className={`mk-step ${state}`} key={step}>
            {t(`stage_${step}`, step)}
            {labels?.[step] && <small>{labels[step]}</small>}
          </div>
        );
      })}
    </div>
  );
}

/** Label and value pairs for a .mk-kv list; rows without a value are left out. */
export function KeyValues({ rows }: { rows: readonly (readonly [string, string])[] }) {
  return (
    <dl className="mk-kv">
      {rows
        .filter(([, value]) => value)
        .flatMap(([label, value]) => [<dt key={`t|${label}`}>{label}</dt>, <dd key={`d|${label}`}>{value}</dd>])}
    </dl>
  );
}

export function PulseStats({ id, items }: { id: string; items: readonly { value: string; label: string }[] }) {
  return (
    <div className="mk-pulse" id={id} aria-live="polite">
      {items.map(item => (
        <div key={item.label}>
          <b>{item.value}</b>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
