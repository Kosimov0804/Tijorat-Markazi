import type { ReactNode } from "react";
import { useI18n } from "../../shell/i18n";
import { formatNumber, list, record, text, texts, useLoad } from "../../shell/market";
import type { Json, Translate } from "../../shell/market";
import { analystPost, formatShare, parseCohort } from "./data";
import type { Query } from "./data";
import { Dist, SegButtons, viewState } from "./parts";

/** The slice being looked at; an empty dimension lets the server choose. */
export type SegmentChoice = { module: string; dimension: string };

type SegmentsViewProps = {
  query: Query;
  modules: readonly string[];
  choice: SegmentChoice;
  onChoose: (choice: SegmentChoice) => void;
  t: Translate;
};

function headings(module: string, t: Translate): string[] {
  if (module === "mehnat") {
    return [t("an_c_label"), t("an_k_vacancies"), t("an_k_seats"), t("an_k_candidates"), "Shortage", t("an_c_offered")];
  }
  if (module === "moliya") {
    return [t("an_c_label"), t("an_k_finprod"), t("an_k_requests"), t("an_c_answered"), t("an_c_amount")];
  }
  return [t("an_c_label"), t("an_k_products"), t("an_c_demand"), t("an_c_ratio"), t("an_c_price")];
}

function SegmentRow({ module, row, t }: { module: string; row: Json; t: Translate }) {
  const { lang } = useI18n();
  const num = (value: unknown, digits: number): ReactNode => (
    <td className="num">{formatNumber(value, lang, digits)}</td>
  );
  if (module === "mehnat") {
    return (
      <tr>
        <td>{text(row.label)}</td>
        {num(row.n, 0)}
        {num(row.seats, 0)}
        {num(row.supply, 0)}
        <td className="num">{row.shortage == null ? "—" : formatNumber(row.shortage, lang, 2)}</td>
        <td>
          <Dist cohort={parseCohort(row.offered)} t={t} />
        </td>
      </tr>
    );
  }
  return (
    <tr>
      <td>{text(row.label)}</td>
      {num(row.n, 0)}
      {num(row.demand, 0)}
      {module === "moliya" ? <td className="num">{formatShare(row.answeredPct, lang)}</td> : num(row.ratio, 1)}
      <td>
        <Dist cohort={parseCohort(module === "moliya" ? row.amount : row.price)} t={t} />
      </td>
    </tr>
  );
}

function SegmentTable({ module, rows, t }: { module: string; rows: readonly unknown[]; t: Translate }) {
  if (!rows.length) return <p className="co-sub">{t("an_nodata")}</p>;
  return (
    <div className="an-tablewrap">
      <table className="an-table">
        <thead>
          <tr>
            {headings(module, t).map((heading, index) => (
              <th key={index}>{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <SegmentRow key={index} module={module} row={record(row)} t={t} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Which slice of a market is moving. */
export function SegmentsView({ query, modules, choice, onChoose, t }: SegmentsViewProps) {
  const { module } = choice;
  const key = `segment|${query.days}|${module}|${choice.dimension}`;
  const { data, isLoading } = useLoad(key, () => analystPost("segment", query, choice));
  const waiting = viewState(isLoading, Boolean(data?.ok), t);
  if (waiting || !data) return waiting;

  const dimension = text(data.dimension);
  const dimensionLabel = (name: string): string => t(`an_d_${name}`, name);
  const moduleLabel = (name: string): string => t(`an_mod_${name}`, name);
  return (
    <>
      <div className="an-controls">
        <SegButtons
          id="segModule"
          options={modules}
          active={module}
          labelOf={moduleLabel}
          onPick={next => onChoose({ module: next, dimension: "" })}
        />
        <SegButtons
          id="segDim"
          options={texts(data.dimensions)}
          active={dimension}
          labelOf={dimensionLabel}
          onPick={next => onChoose({ module, dimension: next })}
        />
      </div>
      <div className="an-box an-wide">
        <h3>
          {moduleLabel(module)} · {dimensionLabel(dimension)}
        </h3>
        <SegmentTable module={module} rows={list(data.rows)} t={t} />
        <p className="an-note">{text(data.note)}</p>
      </div>
    </>
  );
}
