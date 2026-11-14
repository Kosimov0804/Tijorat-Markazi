import { useCallback, useEffect, useState } from "react";
import { cabinetPost } from "../../shell/cabinet";
import { useI18n } from "../../shell/i18n";
import { amount, flag, listOf, record, text, texts } from "../../shell/market/narrow";
import type { Json } from "../../shell/market/narrow";
import { LetterModal } from "./LetterModal";
import type { Letter } from "./LetterModal";
import type { AssocText, ViewProps } from "./types";

type Asker = { label: string; count: number; type: string; key: string };
type QuestionRow = { question: string; count: number; companies: string[]; isRepeated: boolean };
type Month = { ym: string; months: string[]; askers: Asker[]; report: QuestionRow[] };

const SMALL_HEADING = { fontSize: 15, margin: "6px 0 10px" };

function parseMonth(body: Json): Month {
  return {
    ym: text(body.ym),
    months: texts(body.months),
    askers: listOf(body.users, value => {
      const item = record(value);
      return { label: text(item.label), count: amount(item.count), type: text(item.type), key: text(item.key) };
    }),
    report: listOf(body.report, value => {
      const item = record(value);
      return {
        question: text(item.question),
        count: amount(item.count),
        companies: texts(item.companies),
        isRepeated: flag(item.repeated),
      };
    }),
  };
}

function ReportTable({ rows, at }: { rows: readonly QuestionRow[]; at: AssocText }) {
  if (!rows.length) return <p className="ac-label">{at("q_empty")}</p>;
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>{at("q_question")}</th>
          <th style={{ textAlign: "center" }}>{at("q_count")}</th>
          <th>{at("q_who")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className={row.isRepeated ? "q-rep" : ""}>
            <td>
              {row.question}
              {row.isRepeated && <> <span className="q-badge">{at("q_repeat")}</span></>}
            </td>
            <td style={{ textAlign: "center" }}>
              <b>{row.count}</b>
            </td>
            <td>{row.companies.join(", ") || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* Appeals from the association's own companies, and an official letter for each. */
export function QuestionsView({ credentials, at }: ViewProps) {
  const { lang } = useI18n();
  const [month, setMonth] = useState<Month | null>(null);
  const [writingFor, setWritingFor] = useState<number | null>(null);
  const [letter, setLetter] = useState<Letter | null>(null);

  const load = useCallback(
    async (ym?: string): Promise<void> => {
      const answer = await cabinetPost("/api/assoc/questions", credentials, { ym });
      if (answer.status !== 0 && !answer.body.error) setMonth(parseMonth(answer.body));
    },
    [credentials],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const handleLetter = async (asker: Asker, index: number): Promise<void> => {
    setWritingFor(index);
    const body = { type: asker.type, key: asker.key, ym: month?.ym ?? "", lang };
    const answer = await cabinetPost("/api/assoc/letter", credentials, body);
    setWritingFor(null);
    if (!answer.body.ok) return;
    const written = record(answer.body.letter);
    setLetter({ recipientLabel: text(written.recipientLabel), body: text(written.body) });
  };

  const months = month?.months ?? [];
  return (
    <div className="admin-panel">
      <h2>
        {at("nav_quest")}{" "}
        <select
          className="adm-search mono"
          id="qMonth"
          style={{ float: "right", maxWidth: 160 }}
          value={month?.ym ?? ""}
          onChange={event => void load(event.target.value)}
        >
          {months.map(ym => (
            <option key={ym} value={ym}>
              {ym}
            </option>
          ))}
          {!months.length && <option value="">—</option>}
        </select>
      </h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>{at("q_sub")}</p>
      <h3 style={SMALL_HEADING}>{at("q_users")}</h3>
      <div id="qUsers" style={{ marginBottom: 22 }}>
        {month?.askers.map((asker, index) => (
          <div className="quser-row" key={index}>
            <span className="quser-name">🏢 {asker.label}</span>
            <span className="quser-count">
              {asker.count} {at("q_reqs")}
            </span>
            <button
              type="button"
              className="btn btn-ghost quser-letter"
              style={{ padding: "6px 12px", fontSize: 13 }}
              disabled={writingFor === index}
              onClick={() => void handleLetter(asker, index)}
            >
              {at(writingFor === index ? "q_gen" : "q_makeletter")}
            </button>
          </div>
        ))}
        {month && !month.askers.length && <p className="ac-label">{at("q_empty")}</p>}
      </div>
      <h3 style={SMALL_HEADING}>{at("q_questionsh")}</h3>
      <div id="qReport">{month && <ReportTable rows={month.report} at={at} />}</div>
      {letter && <LetterModal letter={letter} at={at} onClose={() => setLetter(null)} />}
    </div>
  );
}
