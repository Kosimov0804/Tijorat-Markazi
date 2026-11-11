import { trustedHtml } from "../../../../shell/trustedHtml";
import { KpiTiles } from "../../atoms/KpiTiles";
import type { ModelYear } from "../../engine/types";
import { useKit } from "../../kit";
import { Cell, Field, Matrix, NumberInput, SectionHead } from "./fields";
import { addModelYear, editModel, editModelCell, isStartup, liveKpis, removeModelYear } from "./logic";
import type { Edit } from "./logic";
import type { StepProps } from "./StepPassport";

type ModelField = "fcf" | "cfads" | "principal" | "interest";

/* The first two columns are named the same in every language. */
const COLUMNS: readonly { field: ModelField; fixed?: string; key?: string }[] = [
  { field: "fcf", fixed: "Free Cash Flow" },
  { field: "cfads", fixed: "CFADS" },
  { field: "principal", key: "ms_col_principal" },
  { field: "interest", key: "ms_col_interest" },
];

type YearRowProps = { year: ModelYear; row: number; onEdit: (edit: Edit) => void; onRemove: () => void };

function YearRow({ year, row, onEdit, onRemove }: YearRowProps) {
  const { t, num } = useKit();
  const service = (year.principal || 0) + (year.interest || 0);
  /* A year whose debt service is not covered is the fact this table exists for. */
  const isShort = service > 0 && (year.cfads || 0) < service;
  const yearLabel = `${t("ms_col_year")} ${num(year.yil, 0)}`;
  return (
    <tr className={isShort ? "is-short" : undefined}>
      <td className="ms-matrix-row">{yearLabel}</td>
      {COLUMNS.map(column => (
        <td key={column.field}>
          <Cell
            name="data-ms-model"
            address={`${row}:${column.field}`}
            label={`${yearLabel} · ${column.fixed ?? t(column.key as string)}`}
            value={year[column.field]}
            onValue={value => onEdit(editModelCell(row, column.field, value))}
          />
        </td>
      ))}
      <td className="is-calc">{service > 0 ? num((year.cfads || 0) / service, 2) : "—"}</td>
      <td>
        <button type="button" className="ms-x" data-ms-delyear={row} title={t("ms_c_remove_year")} onClick={onRemove}>
          ✕
        </button>
      </td>
    </tr>
  );
}

type StepModelProps = StepProps & {
  /** Rows shift when a year is added or removed, so the boxes must be rebuilt. */
  onRestructure: (edit: Edit) => void;
};

/** Step 3: discount rates and the yearly cash flow, with the KPIs it implies shown live. */
export function StepModel({ project, onEdit, onRestructure }: StepModelProps) {
  const { t } = useKit();
  const model = project.financialModel;
  const columns = [t("ms_col_year"), ...COLUMNS.map(column => column.fixed ?? t(column.key as string)), "DSCR", ""];

  return (
    <>
      {isStartup(project) && (
        <p className="ms-banner is-startup" dangerouslySetInnerHTML={trustedHtml(t("ms_c_startup_optional"))} />
      )}
      <div className="mk-form">
        <Field label={t("ms_c_discount")} htmlFor="ms-f-diskont">
          <NumberInput id="ms-f-diskont" value={model.diskontStavkasi} onValue={value => onEdit(editModel({ diskontStavkasi: value || 0 }))} />
        </Field>
        <Field label={t("ms_c_cb_rate")} htmlFor="ms-f-mb" hint={t("ms_c_cb_hint")}>
          <NumberInput id="ms-f-mb" value={model.mbStavkasi} onValue={value => onEdit(editModel({ mbStavkasi: value || 0 }))} />
        </Field>
        <div className="mk-f">
          <label>&#160;</label>
          <button type="button" className="btn btn-ghost" id="ms-add-year" onClick={() => onRestructure(addModelYear)}>
            {t("ms_c_add_year")}
          </button>
        </div>
      </div>
      <SectionHead title={t("ms_c_cashflow")} sub={t("ms_c_cashflow_sub")} />
      <Matrix columns={columns}>
        {model.yillar.map((year, row) => (
          <YearRow key={row} year={year} row={row} onEdit={onEdit} onRemove={() => onRestructure(removeModelYear(row))} />
        ))}
      </Matrix>
      <div id="ms-model-kpis">
        <KpiTiles passport={project.passport} kpis={liveKpis(project)} />
      </div>
    </>
  );
}
