import { calcHistoryMetrics } from "../../engine/engine";
import { useKit } from "../../kit";
import { Cell, Matrix, SectionHead } from "./fields";
import { editHistoryCell } from "./logic";
import type { StepProps } from "./StepPassport";

/* A null label key means the column is named the same in every language. */
const COLUMNS: readonly (readonly [string, string | null])[] = [
  ["tushum", "ms_col_revenue"],
  ["ebitda", null],
  ["sofFoyda", "ms_col_net_profit"],
  ["jamiQarz", "ms_col_total_debt"],
  ["jamiAktivlar", "ms_col_total_assets"],
  ["ozKapital", "ms_col_equity"],
];

type HistoryField = "tushum" | "ebitda" | "sofFoyda" | "jamiQarz" | "jamiAktivlar" | "ozKapital";

/** Step 2 of the company track: three years of accounts and what follows from them. */
export function StepHistory({ project, onEdit }: StepProps) {
  const { t, pctTxt } = useKit();
  const yearLabel = (index: number): string => t("ms_b_year_label").replace("{n}", String(3 - index));
  const columnLabel = ([, key]: readonly [string, string | null]): string => (key ? t(key) : "EBITDA");
  const metrics = calcHistoryMetrics(project.financialHistory);
  const percent = (value: number | null): string => (value == null ? "—" : pctTxt(value));

  return (
    <>
      <SectionHead title={t("ms_b_title")} sub={t("ms_b_sub").replace("{ccy}", project.passport.valyuta)} />
      <Matrix columns={[t("ms_col_year"), ...COLUMNS.map(columnLabel)]}>
        {project.financialHistory.map((year, row) => (
          <tr key={row}>
            <td className="ms-matrix-row">{yearLabel(row)}</td>
            {COLUMNS.map(column => (
              <td key={column[0]}>
                <Cell
                  name="data-ms-hist"
                  address={`${row}:${column[0]}`}
                  label={`${yearLabel(row)} · ${columnLabel(column)}`}
                  value={year[column[0] as HistoryField]}
                  onValue={value => onEdit(editHistoryCell(row, column[0], value))}
                />
              </td>
            ))}
          </tr>
        ))}
      </Matrix>
      <SectionHead title={t("ms_b_metrics")} sub={t("ms_b_metrics_sub")} />
      <div className="mk-tablewrap">
        <table className="mk-table">
          <thead>
            <tr>
              <th>{t("ms_col_year")}</th>
              <th>ROS</th>
              <th>ROE</th>
              <th>{t("ms_col_growth")}</th>
              <th>{t("ms_col_status")}</th>
            </tr>
          </thead>
          <tbody id="ms-hist-metrics">
            {metrics.rows.map((row, index) => (
              <tr key={index}>
                <td>{yearLabel(index)}</td>
                <td className="num">{percent(row.ros)}</td>
                <td className="num">{percent(row.roe)}</td>
                <td className="num">{percent(row.growth)}</td>
                <td>
                  <span className={row.rentabelmi ? "ms-flag is-good" : "ms-flag is-bad"}>
                    {row.rentabelmi ? t("ms_b_profitable") : t("ms_b_unprofitable")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mk-note">
        {t("ms_b_profitable_years")}{" "}
        <b id="ms-hist-count" className="num">
          {metrics.profitableYears}
        </b>{" "}
        / 3 {t("ms_b_profitable_hint")}
      </p>
    </>
  );
}
