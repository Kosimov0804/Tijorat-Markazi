import type { CSSProperties } from "react";
import type { RoutingStatus } from "../engine/types";
import { useKit } from "../kit";
import { tierClass } from "./Badges";

/* The contract with moliya-scoring.css: a 200x200 viewBox, r=86, and the
   whole <svg> turned -90deg by CSS, so the tick angles carry no offset. The
   number sits in an HTML layer over the SVG, where it can be selected. */
const RADIUS = 86;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TICKS = [60, 75, 90];
const TICK_HALF = 7;

function Tick({ at, isMet }: { at: number; isMet: boolean }) {
  const angle = (at / 100) * 2 * Math.PI;
  const point = (radius: number, axis: (angle: number) => number): string => (100 + radius * axis(angle)).toFixed(2);
  return (
    <line
      className={isMet ? "ms-gauge-tick is-met" : "ms-gauge-tick"}
      x1={point(RADIUS - TICK_HALF, Math.cos)}
      y1={point(RADIUS - TICK_HALF, Math.sin)}
      x2={point(RADIUS + TICK_HALF, Math.cos)}
      y2={point(RADIUS + TICK_HALF, Math.sin)}
    />
  );
}

export function Gauge({ total, status }: { total: number; status: RoutingStatus | null }) {
  const { t, num, label } = useKit();
  const score = Math.max(0, Math.min(100, total || 0));
  const style = {
    "--ms-circ": CIRCUMFERENCE.toFixed(2),
    "--ms-off": (CIRCUMFERENCE * (1 - score / 100)).toFixed(2),
  } as CSSProperties;
  return (
    <div className={`ms-gauge ${tierClass(status)}`} style={style}>
      <svg className="ms-gauge-svg" viewBox="0 0 200 200" role="img" aria-label={`${num(score, 0)} / 100`}>
        <circle className="ms-gauge-track" cx="100" cy="100" r={RADIUS} />
        <circle className="ms-gauge-arc" cx="100" cy="100" r={RADIUS} />
        {TICKS.map(at => (
          <Tick key={at} at={at} isMet={score >= at} />
        ))}
      </svg>
      <div className="ms-gauge-mid">
        <span className="ms-gauge-num">{num(score, 0)}</span>
        <span className="ms-gauge-cap">{t("ms_gauge_caption")}</span>
      </div>
      <div className="ms-gauge-verdict">{label(status)}</div>
    </div>
  );
}
