import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { cabinetPost, credentialQuery } from "../../shell/cabinet";
import { listOf, record, text } from "../../shell/market/narrow";
import type { Json } from "../../shell/market/narrow";
import type { AssocText, ViewProps } from "./types";

type ReportRow = { name: string; products: string; questions: string };
type Report = { ym: string; companyCount: string; questions: string; companies: ReportRow[] };

const MONTH_INPUT: CSSProperties = {
  padding: "10px 12px",
  border: "1px solid var(--line-2)",
  borderRadius: 8,
  background: "var(--bg-soft)",
  color: "var(--ink)",
  fontFamily: "inherit",
};
const CENTER: CSSProperties = { textAlign: "center" };

function parseReport(body: Json): Report {
  return {
    ym: text(body.ym),
    companyCount: text(body.companyCount),
    questions: text(body.questions),
    companies: listOf(body.companies, value => {
      const item = record(value);
      return { name: text(item.name), products: text(item.products), questions: text(item.questions) };
    }),
  };
}

function Preview({ report, at }: { report: Report; at: AssocText }) {
  if (!report.companies.length) return <p className="ac-label">{at("rep_empty")}</p>;
  return (
    <>
      <p className="ac-label" style={{ marginBottom: 10 }}>
        {at("rep_count")}: <b>{report.companyCount}</b> · {at("rep_q")}: <b>{report.questions}</b>
      </p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>{at("rep_comp")}</th>
            <th style={CENTER}>{at("rep_prod")}</th>
            <th style={CENTER}>{at("rep_q")}</th>
          </tr>
        </thead>
        <tbody>
          {report.companies.map((company, index) => (
            <tr key={index}>
              <td>
                <b>{company.name}</b>
              </td>
              <td style={CENTER}>{company.products}</td>
              <td style={CENTER}>{company.questions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* The month's results for the association's own companies, with the official
   letters as a Word file. */
export function ReportView({ credentials, at }: ViewProps) {
  const [month, setMonth] = useState("");
  const [report, setReport] = useState<Report | null>(null);

  const load = useCallback(
    async (ym: string): Promise<void> => {
      const answer = await cabinetPost("/api/assoc/report", credentials, { ym });
      if (answer.status === 0 || answer.body.error) return;
      const loaded = parseReport(answer.body);
      setReport(loaded);
      setMonth(current => current || loaded.ym);
    },
    [credentials],
  );

  useEffect(() => {
    void load("");
  }, [load]);

  /* The Word export is a plain download, so the server takes the credentials as a query. */
  const download = report
    ? `/api/assoc/report.doc?${credentialQuery(credentials)}&ym=${encodeURIComponent(report.ym)}`
    : "#";

  return (
    <div className="admin-panel">
      <h2>{at("nav_report")}</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>{at("rep_intro")}</p>
      <div className="admin-form" style={{ alignItems: "end" }}>
        <div>
          <div className="ac-label">{at("rep_month")}</div>
          <input
            type="month"
            id="repMonth"
            aria-label={at("rep_month")}
            style={MONTH_INPUT}
            value={month}
            onChange={event => {
              setMonth(event.target.value);
              void load(event.target.value);
            }}
          />
        </div>
        <a className="btn btn-primary" id="repDl" href={download} target="_blank" rel="noopener">
          ⬇ {at("rep_download")}
        </a>
      </div>
      <div id="repPreview" style={{ marginTop: 18 }}>
        {report && <Preview report={report} at={at} />}
      </div>
    </div>
  );
}
