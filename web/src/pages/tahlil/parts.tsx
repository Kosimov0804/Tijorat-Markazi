/*
 * The analyst panel's render primitives (.an-* in styles.css).
 *
 *   <AnKpi value label note?>      one headline figure
 *   <Bars rows t>                  ranked horizontal bars of { label, n }
 *   <Spark points label t>         a column chart drawn as inline SVG
 *   <FunnelRow funnel t>           one market's conversion chain
 *   <Dist cohort t>                P25 – median – P75, or "cohort too small"
 *   <SegButtons id options …>      a row of exclusive choices
 *   viewState(isLoading, isOk, t)   the loading or failure line of a view, else null
 */
import type { ReactNode } from "react";
import { useI18n } from "../../shell/i18n";
import { formatDay, formatNumber } from "../../shell/market";
import type { Translate } from "../../shell/market";
import { formatSum } from "./data";
import type { Cohort, FunnelData, SeriesPoint } from "./data";

export function AnKpi({ value, label, note }: { value: string; label: string; note?: string }) {
  return (
    <div className="an-kpi">
      <b>{value}</b>
      <span>{label}</span>
      {note && <em>{note}</em>}
    </div>
  );
}

const BAR_LIMIT = 12;
const MIN_BAR_PERCENT = 2;

export function Bars({ rows, t }: { rows: readonly { label: string; n: unknown }[]; t: Translate }) {
  const { lang } = useI18n();
  if (!rows.length) return <p className="co-sub">{t("an_nodata")}</p>;
  const values = rows.map(row => Number(row.n) || 0);
  const max = Math.max(...values) || 1;
  return (
    <div className="an-bars">
      {rows.slice(0, BAR_LIMIT).map((row, index) => (
        <div className="an-bar" key={`${row.label}|${index}`}>
          <span title={row.label}>{row.label}</span>
          <b>{formatNumber(values[index], lang, 0)}</b>
          <i style={{ width: `${Math.max(MIN_BAR_PERCENT, Math.round((100 * values[index]) / max))}%` }} />
        </div>
      ))}
    </div>
  );
}

const CHART_BASE = 94;
const CHART_HEIGHT = 86;

/* Empty buckets are left empty rather than drawn as hairlines: a row of 1px
   stubs reads as a dotted rule and hides where the data actually is. */
export function Spark({ points, label, t }: { points: readonly SeriesPoint[]; label: string; t: Translate }) {
  const { lang } = useI18n();
  if (!points.length) return <p className="co-sub">{t("an_nodata")}</p>;
  const max = Math.max(...points.map(point => point.n)) || 1;
  const width = 100 / points.length;
  return (
    <figure className="an-chart" role="img" aria-label={label}>
      <div className="an-chart-wrap">
        <span className="an-chart-max">{formatNumber(max, lang, 0)}</span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <line className="an-axis" x1="0" y1={CHART_BASE} x2="100" y2={CHART_BASE} />
          {points.map((point, index) => {
            if (!point.n) return null;
            const height = Math.max(2, (point.n / max) * CHART_HEIGHT);
            return (
              <rect
                key={index}
                x={(index * width + width * 0.15).toFixed(2)}
                y={(CHART_BASE - height).toFixed(2)}
                width={Math.max(0.6, width * 0.7).toFixed(2)}
                height={height.toFixed(2)}
                rx="0.5"
              >
                <title>{`${formatDay(point.to, lang)}: ${point.n}`}</title>
              </rect>
            );
          })}
        </svg>
      </div>
      <figcaption>
        <span>{formatDay(points[0].from, lang)}</span>
        <span>{formatDay(points[points.length - 1].to, lang)}</span>
      </figcaption>
    </figure>
  );
}

export function FunnelRow({ funnel, t }: { funnel: FunnelData; t: Translate }) {
  const { lang } = useI18n();
  return (
    <div className="an-funnel">
      <b>{t(`an_mod_${funnel.module}`, funnel.module)}</b>
      <div className="an-funnel-steps">
        {funnel.steps.map((step, index) => (
          <div key={`${step.label}|${index}`}>
            <b>{formatNumber(step.n, lang, 0)}</b>
            <span>{t(`an_step_${step.label}`, step.label)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dist({ cohort, t }: { cohort: Cohort; t: Translate }) {
  const { lang } = useI18n();
  if (!cohort) return <i className="an-supp">{t("an_suppressed")}</i>;
  return (
    <>
      {formatSum(cohort.p25, lang)} – <b>{formatSum(cohort.median, lang)}</b> – {formatSum(cohort.p75, lang)}
    </>
  );
}

type SegButtonsProps = {
  id: string;
  options: readonly string[];
  active: string;
  labelOf: (option: string) => string;
  onPick: (option: string) => void;
};

export function SegButtons({ id, options, active, labelOf, onPick }: SegButtonsProps) {
  return (
    <div className="an-seg" id={id}>
      {options.map(option => (
        <button
          type="button"
          key={option}
          className={option === active ? "is-on" : ""}
          aria-pressed={option === active}
          onClick={() => onPick(option)}
        >
          {labelOf(option)}
        </button>
      ))}
    </div>
  );
}

/** The line a view shows instead of its data; null once the data is usable. */
export function viewState(isLoading: boolean, isOk: boolean, t: Translate): ReactNode {
  if (isLoading) return <p className="co-sub">{t("an_loading")}</p>;
  if (!isOk) return <p className="empty-note">{t("an_fail")}</p>;
  return null;
}
