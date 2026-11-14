/**
 * CABINET CHARTS — panel charts built from real records (port of chart.js).
 *
 * The rule this file exists to enforce: with no data the chart draws a flat
 * line at zero. It never invents a shape.
 *
 *   monthlySeries(records, { months = 12, dateKey = "created", now? })
 *       → { buckets: [{ y, m, added, total }], undated, total }
 *     One bucket per month, cumulative. A record with no usable timestamp is
 *     not dropped and not given a fake date: it counts as existing before the
 *     window opens, so the final total still matches the real record count.
 *
 *   monthLabel(monthIndex, lang)   "yan" / "янв" / "Jan"
 *
 *   <AreaChart points={[{ label, total }]} ariaLabel? emptyText? />
 *     Cumulative area chart as inline SVG. Straight segments between real
 *     points: a curve through sparse data implies values nobody measured.
 *     Renders nothing for an empty list; emptyText shows when every value is 0.
 */
import { useId } from "react";
import { record } from "../market/narrow";
import { MONTHS_SHORT } from "./cabinetText";

export type MonthBucket = { y: number; m: number; added: number; total: number };
export type MonthlySeries = { buckets: MonthBucket[]; undated: number; total: number };
export type MonthlyOptions = { months?: number; dateKey?: string; now?: number | string | Date };
export type ChartPoint = { label: string; total: number; added?: number };

const DEFAULT_MONTHS = 12;

export function monthLabel(month: number, lang: string): string {
  const names: readonly string[] = lang === "uz" || lang === "ru" ? MONTHS_SHORT[lang] : MONTHS_SHORT.en;
  return names[month] || String(month + 1);
}

function timestampOf(item: unknown, dateKey: string): number {
  const raw = record(item)[dateKey];
  if (typeof raw === "number") return raw;
  return typeof raw === "string" && raw ? Date.parse(raw) : Number.NaN;
}

export function monthlySeries(items: readonly unknown[], options: MonthlyOptions = {}): MonthlySeries {
  const months = options.months || DEFAULT_MONTHS;
  const dateKey = options.dateKey || "created";
  const now = options.now ? new Date(options.now) : new Date();

  const empty = Array.from({ length: months }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    return { y: start.getFullYear(), m: start.getMonth(), added: 0 };
  });
  const windowStart = new Date(empty[0].y, empty[0].m, 1).getTime();

  const stamps = items.map(item => timestampOf(item, dateKey));
  const undated = stamps.filter(Number.isNaN).length;
  const carried = undated + stamps.filter(stamp => stamp < windowStart).length;
  const dated = stamps.filter(stamp => stamp >= windowStart).map(stamp => new Date(stamp));

  let running = carried;
  const buckets = empty.map(bucket => {
    const added = dated.filter(day => day.getFullYear() === bucket.y && day.getMonth() === bucket.m).length;
    running += added;
    return { ...bucket, added, total: running };
  });
  return { buckets, undated, total: running };
}

const WIDTH = 800;
const HEIGHT = 190;
const PAD = { left: 44, right: 14, top: 14, bottom: 30 };
const PLOT_WIDTH = WIDTH - PAD.left - PAD.right;
const PLOT_HEIGHT = HEIGHT - PAD.top - PAD.bottom;
const FLOOR = PAD.top + PLOT_HEIGHT;
const CHART_STYLE = { width: "100%", height: "auto", display: "block", color: "var(--navy)", overflow: "visible" };

type AreaChartProps = { points: readonly ChartPoint[]; ariaLabel?: string; emptyText?: string };

export function AreaChart({ points, ariaLabel, emptyText }: AreaChartProps) {
  const gradientId = `kgt${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  if (!points.length) return null;

  const peak = Math.max(0, ...points.map(point => point.total || 0));
  /* A zero-height scale would divide by zero; a flat baseline is the honest
     picture when nothing has been created yet. */
  const scaleMax = peak > 0 ? peak : 1;
  const x = (index: number): number =>
    points.length === 1 ? PAD.left + PLOT_WIDTH / 2 : PAD.left + (index / (points.length - 1)) * PLOT_WIDTH;
  const y = (value: number): number => PAD.top + PLOT_HEIGHT - (value / scaleMax) * PLOT_HEIGHT;

  const marks = points.map((point, index) => ({
    label: point.label,
    px: x(index).toFixed(1),
    py: y(point.total || 0).toFixed(1),
    /* Label every other month so they never collide at narrow widths. */
    hasLabel: index % 2 === (points.length - 1) % 2,
  }));
  const line = marks.map((mark, index) => `${index ? " L" : "M"}${mark.px},${mark.py}`).join("");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${FLOOR} L${x(0).toFixed(1)},${FLOOR} Z`;
  /* Three gridlines: floor, midpoint, peak. */
  const ticks = [0, scaleMax / 2, scaleMax].map((value, index) => ({
    gy: y(value).toFixed(1),
    text: peak > 0 ? String(Math.round(value)) : index === 0 ? "0" : "",
  }));

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={ariaLabel} style={CHART_STYLE}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((tick, index) => (
        <g key={index}>
          <line x1={PAD.left} x2={WIDTH - PAD.right} y1={tick.gy} y2={tick.gy} stroke="var(--line)" strokeWidth="1" />
          <text x={PAD.left - 9} y={Number(tick.gy) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
            {tick.text}
          </text>
        </g>
      ))}
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {marks.map((mark, index) => (
        <circle key={index} cx={mark.px} cy={mark.py} r="3.5" fill="currentColor" />
      ))}
      {marks.map(
        (mark, index) =>
          mark.hasLabel && (
            <text key={index} x={mark.px} y={HEIGHT - 9} textAnchor="middle" fontSize="11" fill="var(--muted)">
              {mark.label}
            </text>
          ),
      )}
      {peak === 0 && emptyText && (
        <text
          x={PAD.left + PLOT_WIDTH / 2}
          y={PAD.top + PLOT_HEIGHT / 2}
          textAnchor="middle"
          fontSize="13"
          fill="var(--muted)"
        >
          {emptyText}
        </text>
      )}
    </svg>
  );
}
