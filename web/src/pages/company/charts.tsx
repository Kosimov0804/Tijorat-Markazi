/* The company dashboard's three charts, as inline SVG. They show what the
   company actually recorded; nothing here invents a value. */

export type DonutSlice = { label: string; value: number; color: string };

const WIDTH = 720;
const HEIGHT = 210;
const LABEL_Y = HEIGHT - 9;
const DONUT_RADIUS = 52;
const DONUT_LENGTH = 2 * Math.PI * DONUT_RADIUS;

/** "40000$", "35 000 so'm", "1,200" → 40000 / 35000 / 1200. */
export function money(value: string): number {
  const cleaned = value
    .replace(/[^\d.,-]/g, "")
    .replace(/,(\d{3})\b/g, "$1")
    .replace(",", ".");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
}

export function Donut({ slices }: { slices: readonly DonutSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const startOf = (index: number): number =>
    slices.slice(0, index).reduce((sum, slice) => sum + slice.value / total, 0);
  return (
    <div className="donut">
      <svg viewBox="0 0 140 140" className="donut-svg">
        {slices.map((slice, index) => {
          const dash = (slice.value / total) * DONUT_LENGTH;
          return (
            <circle
              key={slice.label}
              cx="70"
              cy="70"
              r={DONUT_RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth="20"
              strokeDasharray={`${dash.toFixed(2)} ${(DONUT_LENGTH - dash).toFixed(2)}`}
              strokeDashoffset={(-startOf(index) * DONUT_LENGTH).toFixed(2)}
              transform="rotate(-90 70 70)"
            />
          );
        })}
      </svg>
      <div className="donut-legend">
        {slices.map(slice => (
          <div className="lg-row" key={slice.label}>
            <span className="lg-dot" style={{ background: slice.color }} />
            <span className="lg-name">{slice.label}</span>
            <b>{Math.round((slice.value / total) * 100)}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}

type SeriesProps = { values: readonly number[]; labels: readonly string[] };

export function BarChart({ values, labels }: SeriesProps) {
  const pad = { x: 14, bottom: 28, top: 22 };
  const max = Math.max(1, ...values);
  const slot = (WIDTH - pad.x * 2) / values.length;
  const barWidth = slot * 0.5;
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="cx">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a8fe8" />
          <stop offset="1" stopColor="#5b6fd6" />
        </linearGradient>
      </defs>
      {values.map((value, index) => {
        const barHeight = (value / max) * (HEIGHT - pad.top - pad.bottom);
        const x = pad.x + index * slot + (slot - barWidth) / 2;
        const y = HEIGHT - pad.bottom - barHeight;
        const middle = (x + barWidth / 2).toFixed(1);
        return (
          <g key={index}>
            <rect
              x={x.toFixed(1)}
              y={y.toFixed(1)}
              width={barWidth.toFixed(1)}
              height={Math.max(0, barHeight).toFixed(1)}
              rx="3"
              fill="url(#barGrad)"
            />
            <text x={middle} y={(y - 6).toFixed(1)} className="cx-val">
              {value}
            </text>
            <text x={middle} y={LABEL_Y} className="cx-lbl">
              {labels[index]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({ values, labels }: SeriesProps) {
  const pad = { x: 24, bottom: 28, top: 28 };
  const max = Math.max(1, ...values);
  /* A single point sits in the middle instead of dividing by zero. */
  const x = (index: number): string =>
    (values.length === 1 ? WIDTH / 2 : pad.x + (index * (WIDTH - pad.x * 2)) / (values.length - 1)).toFixed(1);
  const y = (value: number): number => HEIGHT - pad.bottom - (value / max) * (HEIGHT - pad.top - pad.bottom);
  const floor = HEIGHT - pad.bottom;
  const line = `M${values.map((value, index) => `${x(index)},${y(value).toFixed(1)}`).join(" L")}`;
  const fill = `${line} L${x(values.length - 1)},${floor} L${x(0)},${floor} Z`;
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="cx">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7b7fe0" stopOpacity=".5" />
          <stop offset="1" stopColor="#7b7fe0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#areaGrad)" />
      <path d={line} fill="none" stroke="#b9b3f2" strokeWidth="2.5" strokeLinejoin="round" />
      {values.map((value, index) => (
        <g key={index}>
          <circle cx={x(index)} cy={y(value).toFixed(1)} r="3" fill="#b9b3f2" />
          <text x={x(index)} y={(y(value) - 9).toFixed(1)} className="cx-val">
            {value}
          </text>
          <text x={x(index)} y={LABEL_Y} className="cx-lbl">
            {labels[index]}
          </text>
        </g>
      ))}
    </svg>
  );
}
