import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { isRecord } from "../../../shell/chat";
import { dialogs } from "../../../shell/dialogs";
import { adminPost } from "../api";
import { CENTER, Intro, LETTER_BUTTON } from "../parts";
import { useText } from "../useText";
import { LetterModal, parseLetter } from "./LetterModal";
import type { Letter } from "./LetterModal";
import { loadQuestions } from "./questionsData";
import type { AssocQuestions, QuestionRow, QuestionsReport } from "./questionsData";

const TOGGLE_STYLE: CSSProperties = {
  background: "none",
  border: 0,
  font: "inherit",
  color: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  textAlign: "left",
  padding: 0,
};

const DETAIL_STYLE: CSSProperties = {
  margin: "-8px 0 14px",
  padding: "10px 14px",
  background: "var(--bg-soft)",
  border: "1px solid var(--line)",
  borderRadius: 10,
};

/** The month's questions, per association and overall, with the combined official letters. */
export function Questions() {
  const { tx } = useText();
  const [report, setReport] = useState<QuestionsReport | null>(null);
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [letter, setLetter] = useState<Letter | null>(null);

  useEffect(() => {
    let isCurrent = true;
    loadQuestions(month)
      .then(answer => {
        /* An error answer leaves the last month on screen, as the old panel did. */
        if (isCurrent && answer) setReport(answer);
      })
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [month]);

  const months = report?.months ?? [];

  return (
    <div className="admin-panel">
      <h2>
        {tx("nav_quest")}{" "}
        <select
          className="adm-search mono"
          id="qMonth"
          aria-label={tx("rep_month")}
          style={{ float: "right", maxWidth: 160 }}
          value={report?.ym ?? ""}
          onChange={event => setMonth(event.target.value)}
        >
          {months.length === 0 && <option>—</option>}
          {months.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </h2>
      <Intro>{tx("q_sub")}</Intro>
      <h3 style={{ fontSize: 15, margin: "6px 0 4px" }}>{tx("q_assocs")}</h3>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 10 }}>{tx("q_assocs_sub")}</p>
      <div id="qAssocs" style={{ marginBottom: 22 }}>
        {report && report.assocs.length === 0 && <p className="ac-label">{tx("q_empty")}</p>}
        {report?.assocs.map((assoc, index) => (
          <AssocBlock key={assoc.id || index} assoc={assoc} ym={report.ym} onLetter={setLetter} />
        ))}
      </div>
      <h3 style={{ fontSize: 15, margin: "6px 0 10px" }}>{tx("q_questionsh")}</h3>
      <div id="qReport">
        {report && (report.report.length ? <QuestionTable rows={report.report} /> : <p className="ac-label">{tx("q_empty")}</p>)}
      </div>
      {letter && <LetterModal letter={letter} onClose={() => setLetter(null)} />}
    </div>
  );
}

type AssocBlockProps = {
  assoc: AssocQuestions;
  ym: string;
  onLetter: (letter: Letter) => void;
};

function AssocBlock({ assoc, ym, onLetter }: AssocBlockProps) {
  const { tx, lang } = useText();
  const [isOpen, setIsOpen] = useState(false);
  const [isWriting, setIsWriting] = useState(false);

  /* One combined letter for the whole association: every member's questions merged. */
  const handleLetter = async () => {
    setIsWriting(true);
    try {
      const answer = await adminPost("/api/rais/assoc-letter", { assocId: assoc.id, ym, lang });
      if (isRecord(answer) && answer.ok) onLetter(parseLetter(answer.letter));
      else await dialogs.alert(tx("q_empty"));
    } catch {
      await dialogs.alert(tx("q_empty"));
    } finally {
      setIsWriting(false);
    }
  };

  return (
    <>
      <div className="quser-row">
        <button
          type="button"
          className="quser-name qassoc-toggle"
          style={TOGGLE_STYLE}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(current => !current)}
        >
          <span
            className="qassoc-caret"
            style={{
              display: "inline-block",
              transition: "transform .15s",
              fontSize: 11,
              color: "var(--muted)",
              transform: isOpen ? "rotate(90deg)" : undefined,
            }}
          >
            ▶
          </span>
          🏛 {assoc.i18n[lang] || assoc.name}
        </button>
        <span className="quser-count">
          {assoc.count} {tx("q_reqs")} · {assoc.companies} {tx("q_comps")}
        </span>
        <button
          className="btn btn-primary qassoc-letter"
          type="button"
          style={LETTER_BUTTON}
          disabled={isWriting}
          onClick={() => void handleLetter()}
        >
          {tx(isWriting ? "q_gen" : "q_assoc_letter")}
        </button>
      </div>
      <div className="qassoc-detail" hidden={!isOpen} style={DETAIL_STYLE}>
        <QuestionTable rows={assoc.questions} />
      </div>
    </>
  );
}

function QuestionTable({ rows }: { rows: readonly QuestionRow[] }) {
  const { tx } = useText();
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>{tx("q_question")}</th>
          <th style={CENTER}>{tx("q_count")}</th>
          <th>{tx("q_who")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={3} className="ac-label">
              {tx("q_empty")}
            </td>
          </tr>
        )}
        {rows.map((row, index) => (
          <tr key={index} className={row.isRepeated ? "q-rep" : ""}>
            <td>
              {row.question}
              {row.isRepeated && " "}
              {row.isRepeated && <span className="q-badge">{tx("q_repeat")}</span>}
            </td>
            <td style={CENTER}>
              <b>{row.count}</b>
            </td>
            <td>{row.who.join(", ") || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
