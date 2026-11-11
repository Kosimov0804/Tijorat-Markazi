import { Gauge } from "../atoms/Gauge";
import type { RoutingStatus, Track } from "../engine/types";
import { useKit } from "../kit";
import { maxScore, optionLabel, simCriteria, simTotal } from "./simTiers";
import type { SimCriterion, SimPicks } from "./simTiers";

type SimulatorProps = {
  type: Track;
  picks: SimPicks;
  /** The real score, against which the difference is shown. */
  baseTotal: number;
  onPick: (criterion: string, index: number) => void;
  onReset: () => void;
};

function SimRow({ id, criterion, picked, onPick }: { id: string; criterion: SimCriterion; picked: number; onPick: (index: number) => void }) {
  const kit = useKit();
  const { t, num } = kit;
  const top = maxScore(criterion);
  const current = criterion.options[picked]?.score ?? 0;
  return (
    <div className={current === top ? "ms-sim-row is-max" : "ms-sim-row"}>
      <label htmlFor={`ms-sim-${id}`}>{t(criterion.labelKey)}</label>
      <span className="ms-sim-fig">
        {num(current, 0)} / {num(top, 0)}
      </span>
      <select id={`ms-sim-${id}`} data-ms-sim={id} value={picked} onChange={event => onPick(Number(event.target.value))}>
        {criterion.options.map((option, index) => (
          <option key={index} value={index}>
            {optionLabel(kit, criterion, index)} — {num(option.score, 0)} {t("ms_sim_points")}
          </option>
        ))}
      </select>
    </div>
  );
}

/** "What if": pick another tier per criterion and watch the total move. */
export function Simulator({ type, picks, baseTotal, onPick, onReset }: SimulatorProps) {
  const { t, num } = useKit();
  const criteria = simCriteria(type);
  const result = simTotal(type, picks);
  const delta = result.total - baseTotal;
  const knockoutTitle = t("ms_res_ko_title");
  const status: RoutingStatus = result.isKnockout
    ? { status: "knockout", uz: knockoutTitle, ru: knockoutTitle, en: knockoutTitle }
    : result.tier;

  return (
    <div className="ms-sim">
      <div className="ms-sim-list">
        {Object.entries(criteria).map(([id, criterion]) => (
          <SimRow key={id} id={id} criterion={criterion} picked={picks[id] ?? 0} onPick={index => onPick(id, index)} />
        ))}
      </div>
      <div className="ms-sim-side" id="ms-sim-out">
        <Gauge total={result.total} status={status} />
        {delta !== 0 && (
          <div className={delta > 0 ? "ms-sim-delta is-up" : "ms-sim-delta is-down"}>
            {delta > 0 ? "+" : ""}
            {num(delta, 0)} <span>{t("ms_res_sim_delta")}</span>
          </div>
        )}
        <button type="button" className="ms-link" id="ms-sim-reset" onClick={onReset}>
          {t("ms_res_sim_reset")}
        </button>
      </div>
    </div>
  );
}
