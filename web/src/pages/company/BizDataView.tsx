import { Fragment, useState } from "react";
import { cabinetPost, FlashNote, useFlash } from "../../shell/cabinet";
import { useI18n } from "../../shell/i18n";
import { text } from "../../shell/market/narrow";
import type { CompanyTextKey } from "./text";
import { BIZ_COLUMNS, EMPTY_BIZ_ROW, parseBizRows } from "./types";
import type { BizColumn, BizRow, ViewProps } from "./types";

type BizDataProps = ViewProps & { saved: readonly BizRow[]; onSaved: (rows: BizRow[]) => void };
type Analysis = { text: string; head: string };

const API = "/api/company/data";
const SAVED_NOTE_MS = 1600;
const COLUMN_LABEL: Readonly<Record<BizColumn, CompanyTextKey>> = {
  product: "bd_product",
  sales: "bd_sales",
  price: "bd_price",
  composition: "bd_comp",
  note: "bd_note",
};

/* The analysis is plain text with **bold** runs and line breaks; it is built
   as elements, so nothing in it can become markup. */
function AnalysisText({ text: body }: { text: string }) {
  return (
    <>
      {body.split("\n").map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 && <br />}
          {line.split(/\*\*(.+?)\*\*/g).map((part, index) => (index % 2 ? <b key={index}>{part}</b> : part))}
        </Fragment>
      ))}
    </>
  );
}

type TableProps = { rows: readonly BizRow[]; ot: ViewProps["ot"]; onRows: (rows: BizRow[]) => void };

function BizTable({ rows, ot, onRows }: TableProps) {
  const edit = (index: number, column: BizColumn, value: string): void =>
    onRows(rows.map((row, position) => (position === index ? { ...row, [column]: value } : row)));
  return (
    <table className="admin-table bd-table" id="bdTable">
      <thead>
        <tr>
          {BIZ_COLUMNS.map(column => (
            <th key={column}>{ot(COLUMN_LABEL[column])}</th>
          ))}
          <th />
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} data-i={index}>
            {BIZ_COLUMNS.map(column => (
              <td key={column}>
                <input
                  className="bd-inp"
                  aria-label={`${ot(COLUMN_LABEL[column])} ${index + 1}`}
                  value={row[column]}
                  onChange={event => edit(index, column, event.target.value)}
                />
              </td>
            ))}
            <td>
              <button
                type="button"
                className="tdel bd-del"
                aria-label={`${ot("del")} ${index + 1}`}
                onClick={() => onRows(rows.filter((_, position) => position !== index))}
              >
                ✕
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* Sales and product data, typed in by hand, then analysed by the AI. */
export function BizDataView({ saved, onSaved, credentials, ot }: BizDataProps) {
  const { lang } = useI18n();
  const [rows, setRows] = useState<BizRow[]>(() => saved.map(row => ({ ...row })));
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const flash = useFlash(SAVED_NOTE_MS);

  const handleSave = async (): Promise<void> => {
    const answer = await cabinetPost(API, credentials, { rows });
    if (!answer.isOk) return;
    const stored = parseBizRows(answer.body.rows);
    onSaved(stored);
    setRows(stored);
    flash.show(ot("bd_saved"));
  };

  const handleAnalyze = async (): Promise<void> => {
    if (!rows.some(row => BIZ_COLUMNS.some(column => row[column].trim()))) {
      setAnalysis({ text: ot("bd_empty"), head: "" });
      return;
    }
    setIsAnalyzing(true);
    /* Save first, so the server analyses the latest data. */
    await cabinetPost(API, credentials, { rows });
    const answer = await cabinetPost("/api/company/analyze", credentials, { lang });
    const found = answer.isOk ? text(answer.body.analysis) : "";
    setAnalysis(found ? { text: found, head: ot("bd_ahead") } : { text: ot("bd_aoff"), head: "" });
    setIsAnalyzing(false);
  };

  return (
    <div className="panel co-panel">
      <div className="co-panel-head">
        <span className="co-ic">📋</span>
        <h2 id="bdTitle">{ot("bd_title")}</h2>
        <FlashNote id="bdSaved" flash={flash} style={{ marginLeft: "auto" }} />
      </div>
      <p className="co-sub" id="bdSub">
        {ot("bd_sub")}
      </p>
      <div style={{ overflow: "auto" }}>
        <BizTable rows={rows} ot={ot} onRows={setRows} />
      </div>
      <div className="bd-actions">
        <button className="btn btn-ghost" id="bdAddRow" type="button" onClick={() => setRows([...rows, { ...EMPTY_BIZ_ROW }])}>
          + <span id="bdAddRowT">{ot("bd_row")}</span>
        </button>
        <button className="btn btn-primary" id="bdSave" type="button" onClick={() => void handleSave()}>
          {ot("bd_save")}
        </button>
        <button className="btn btn-primary" id="bdAnalyze" type="button" disabled={isAnalyzing} onClick={() => void handleAnalyze()}>
          {isAnalyzing ? (
            ot("bd_analyzing")
          ) : (
            <>
              🤖 <span id="bdAnalyzeT">{ot("bd_analyze")}</span>
            </>
          )}
        </button>
      </div>
      <div className="bd-analysis" id="bdAnalysis" hidden={!analysis}>
        {analysis?.head && (
          <>
            <b>{analysis.head}</b>
            <br />
            <br />
          </>
        )}
        {analysis && <AnalysisText text={analysis.text} />}
      </div>
    </div>
  );
}
