import { useState } from "react";
import type { CSSProperties } from "react";
import { asArray, asString, isRecord } from "../../../shell/chat";
import { getJson } from "../api";
import { CENTER, Intro, useLoader } from "../parts";
import { useText } from "../useText";

const COUNT_FIELDS = ["companies", "products", "invest", "news", "rnd", "questions"] as const;

interface ReportRow {
  n: string;
  name: string;
  chairman: string;
  counts: readonly string[];
}

interface MonthlyReport {
  organizations: string;
  rows: readonly ReportRow[];
  totals: readonly string[];
}

const countsOf = (item: Record<string, unknown>): string[] => COUNT_FIELDS.map(field => asString(item[field]));

async function loadReport(ym: string): Promise<MonthlyReport> {
  const answer = await getJson(`/api/monthly?ym=${encodeURIComponent(ym)}`);
  const data = isRecord(answer) ? answer : {};
  return {
    organizations: asString(data.organizations),
    rows: asArray(data.rows).map(value => {
      const item = isRecord(value) ? value : {};
      return { n: asString(item.n), name: asString(item.name), chairman: asString(item.chairman), counts: countsOf(item) };
    }),
    totals: countsOf(isRecord(data.totals) ? data.totals : {}),
  };
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_INPUT: CSSProperties = {
  padding: "10px 12px",
  border: "1px solid var(--line-2)",
  borderRadius: 8,
  background: "var(--bg-soft)",
  color: "var(--ink)",
  fontFamily: "inherit",
};

/** The monthly results of every organisation, with the Word download. */
export function Report() {
  const { tx } = useText();
  const [month, setMonth] = useState(currentMonth);
  const { data: report } = useLoader(() => loadReport(month), [month]);

  return (
    <div className="admin-panel">
      <h2>{tx("nav_report")}</h2>
      <Intro>{tx("rep_intro")}</Intro>
      <div className="admin-form" style={{ alignItems: "end" }}>
        <div>
          <div className="ac-label">{tx("rep_month")}</div>
          <input
            type="month"
            id="repMonth"
            aria-label={tx("rep_month")}
            style={MONTH_INPUT}
            value={month}
            onChange={event => setMonth(event.target.value)}
          />
        </div>
        <a
          className="btn btn-primary"
          id="repDl"
          href={`/api/monthly.doc?ym=${encodeURIComponent(month)}`}
          target="_blank"
          rel="noopener"
        >
          ⬇ {tx("rep_download")}
        </a>
      </div>
      <div id="repPreview" style={{ marginTop: 18 }}>
        {report && <ReportTable report={report} />}
      </div>
    </div>
  );
}

function ReportTable({ report }: { report: MonthlyReport }) {
  const { tx } = useText();
  const headings = [tx("rep_comp"), tx("rep_prod"), tx("rep_inv"), tx("rep_news"), "R&D", tx("rep_q")];

  return (
    <>
      <p className="ac-label" style={{ marginBottom: 10 }}>
        {tx("rep_orgs")}: <b>{report.organizations}</b>
      </p>
      <div style={{ overflow: "auto" }}>
        <table className="admin-table" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>{tx("rep_org")}</th>
              <th>{tx("rep_chair")}</th>
              {headings.map(heading => (
                <th key={heading} style={CENTER}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row, index) => (
              <tr key={index}>
                <td>{row.n}</td>
                <td>
                  <b>{row.name}</b>
                </td>
                <td>{row.chairman}</td>
                <CountCells counts={row.counts} />
              </tr>
            ))}
            <tr style={{ fontWeight: 700, background: "var(--bg-soft-2)" }}>
              <td />
              <td>{tx("rep_total")}</td>
              <td />
              <CountCells counts={report.totals} />
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function CountCells({ counts }: { counts: readonly string[] }) {
  return (
    <>
      {counts.map((count, index) => (
        <td key={index} style={CENTER}>
          {count}
        </td>
      ))}
    </>
  );
}
