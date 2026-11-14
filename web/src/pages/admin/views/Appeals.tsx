import { useState } from "react";
import { asArray, asString, isRecord } from "../../../shell/chat";
import { adminPost, appealDocHref } from "../api";
import { classToken, Intro, localDateTime, useLoader } from "../parts";
import type { AdminTextKey } from "../text";
import { useText } from "../useText";

const APPEALS = "/api/appeals";
const PREVIEW_LENGTH = 300;

const STAGE_KEY: Readonly<Record<string, AdminTextKey | undefined>> = {
  new: "ap_s_new",
  assoc: "ap_s_assoc",
  sent: "ap_s_sent",
  answered: "ap_s_answered",
  rejected: "ap_s_rejected",
};

type Action = { stage: string; buttonClass: string; textKey: AdminTextKey };

const REJECT: Action = { stage: "rejected", buttonClass: "btn-ghost", textKey: "ap_reject" };

/* What oversight can do next depends on where the appeal has got to. */
const ACTIONS: Readonly<Record<string, readonly Action[] | undefined>> = {
  assoc: [{ stage: "sent", buttonClass: "btn-primary", textKey: "ap_send" }, REJECT],
  sent: [{ stage: "answered", buttonClass: "btn-primary", textKey: "ap_answer" }, REJECT],
};

interface TrailStep {
  stage: string;
  by: string;
  note: string;
}

interface Appeal {
  id: string;
  subject: string;
  stage: string;
  companyName: string;
  assocName: string;
  agency: string;
  created: unknown;
  body: string;
  history: readonly TrailStep[];
}

function parseAppeal(value: unknown): Appeal {
  const item = isRecord(value) ? value : {};
  return {
    id: asString(item.id),
    subject: asString(item.subject),
    stage: asString(item.stage),
    companyName: asString(item.companyName),
    assocName: asString(item.assocName),
    agency: asString(item.agency),
    created: item.created,
    body: asString(item.body),
    history: asArray(item.history).map(step => {
      const entry = isRecord(step) ? step : {};
      return { stage: asString(entry.stage), by: asString(entry.by), note: asString(entry.note) };
    }),
  };
}

const parseAppeals = (answer: unknown): Appeal[] =>
  asArray(isRecord(answer) ? answer.items : null).map(parseAppeal);

/** Appeals the associations supported: the last stop before the government agency. */
export function Appeals() {
  const { tx } = useText();
  const { data: appeals, setData } = useLoader(async () => parseAppeals(await adminPost(APPEALS, { op: "list" })), []);

  return (
    <div className="admin-panel">
      <h2>{tx("nav_appeals")}</h2>
      <Intro>{tx("ap_intro")}</Intro>
      <div id="apList">
        {appeals?.length === 0 && <p className="ac-label">{tx("ap_empty")}</p>}
        {appeals?.map(appeal => <AppealCard key={appeal.id} appeal={appeal} onMoved={setData} />)}
      </div>
    </div>
  );
}

function AppealCard({ appeal, onMoved }: { appeal: Appeal; onMoved: (appeals: Appeal[]) => void }) {
  const { tx } = useText();
  const [note, setNote] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const actions = ACTIONS[appeal.stage] ?? [];

  const move = async (stage: string) => {
    setIsBusy(true);
    try {
      onMoved(parseAppeals(await adminPost(APPEALS, { op: "stage", id: appeal.id, stage, note })));
    } catch {
      /* Nothing moved; the buttons come back so it can be tried again. */
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="gov-card">
      <div className="gov-card-top">
        <b>{appeal.subject}</b>
        <span className={`gov-badge gov-${classToken(appeal.stage)}`}>{tx(STAGE_KEY[appeal.stage] ?? "ap_s_new")}</span>
      </div>
      <span className="ac-sub">
        {tx("ap_company")}: {appeal.companyName} · {appeal.assocName || "—"} · {appeal.agency} ·{" "}
        {localDateTime(appeal.created)}
      </span>
      <p className="gov-body-preview">
        {appeal.body.slice(0, PREVIEW_LENGTH)}
        {appeal.body.length > PREVIEW_LENGTH ? "…" : ""}
      </p>
      <Trail steps={appeal.history.slice(1)} />
      <div className="gov-act">
        <a className="btn btn-ghost" href={appealDocHref(appeal.id)}>
          {tx("ap_doc")}
        </a>
        {actions.length > 0 && (
          <input
            className="gov-note"
            placeholder={tx("ap_note")}
            aria-label={tx("ap_note")}
            value={note}
            onChange={event => setNote(event.target.value)}
          />
        )}
        {actions.map(action => (
          <button
            key={action.stage}
            className={`btn ${action.buttonClass} ap-go`}
            type="button"
            disabled={isBusy}
            onClick={() => void move(action.stage)}
          >
            {tx(action.textKey)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Trail({ steps }: { steps: readonly TrailStep[] }) {
  const { tx } = useText();
  if (!steps.length) return null;
  return (
    <div className="gov-trail">
      {steps.map((step, index) => {
        const stageKey = STAGE_KEY[step.stage];
        return (
          <div className="gov-trail-row" key={index}>
            <span>{stageKey ? tx(stageKey) : step.stage}</span>
            <em>
              {step.by}
              {step.note ? ` · ${step.note}` : ""}
            </em>
          </div>
        );
      })}
    </div>
  );
}
