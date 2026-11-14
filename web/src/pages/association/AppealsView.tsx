import { useEffect, useState } from "react";
import { cabinetPost, classToken, credentialQuery, localDateTime } from "../../shell/cabinet";
import type { CabinetCredentials } from "../../shell/cabinet";
import { listOf, record, text } from "../../shell/market/narrow";
import type { AssocTextKey } from "./text";
import type { AssocText, ViewProps } from "./types";

type Step = { stage: string; by: string; note: string };
type Appeal = {
  id: string;
  subject: string;
  stage: string;
  companyName: string;
  agency: string;
  created: string | number;
  body: string;
  history: Step[];
};

const API = "/api/assoc/appeals";
const PREVIEW_LENGTH = 300;
const STAGE_KEY: Readonly<Record<string, AssocTextKey | undefined>> = {
  new: "ap_s_new",
  assoc: "ap_s_assoc",
  sent: "ap_s_sent",
  answered: "ap_s_answered",
  rejected: "ap_s_rejected",
};

function parseAppeal(value: unknown): Appeal {
  const item = record(value);
  return {
    id: text(item.id),
    subject: text(item.subject),
    stage: text(item.stage),
    companyName: text(item.companyName),
    agency: text(item.agency),
    created: typeof item.created === "number" ? item.created : text(item.created),
    body: text(item.body),
    history: listOf(item.history, entry => {
      const step = record(entry);
      return { stage: text(step.stage), by: text(step.by), note: text(step.note) };
    }),
  };
}

const parseAppeals = (value: unknown): Appeal[] => listOf(value, parseAppeal);

/* The route the appeal travelled: who moved it and what they said. */
function Trail({ steps, at }: { steps: readonly Step[]; at: AssocText }) {
  const later = steps.slice(1);
  if (!later.length) return null;
  return (
    <div className="gov-trail">
      {later.map((step, index) => {
        const key = STAGE_KEY[step.stage];
        return (
          <div className="gov-trail-row" key={index}>
            <span>{key ? at(key) : step.stage}</span>
            <em>
              {step.by}
              {step.note && ` · ${step.note}`}
            </em>
          </div>
        );
      })}
    </div>
  );
}

type CardProps = {
  appeal: Appeal;
  at: AssocText;
  credentials: CabinetCredentials;
  onDecide: (stage: "assoc" | "rejected", note: string) => Promise<void>;
};

function AppealCard({ appeal, at, credentials, onDecide }: CardProps) {
  const [note, setNote] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const doc = `/api/appeal/doc?id=${encodeURIComponent(appeal.id)}&${credentialQuery(credentials)}`;
  /* Once it has left the association there is nothing more for it to decide. */
  const isOpen = appeal.stage === "new";

  const decide = async (stage: "assoc" | "rejected"): Promise<void> => {
    setIsBusy(true);
    await onDecide(stage, note);
    setIsBusy(false);
  };

  return (
    <div className="gov-card">
      <div className="gov-card-top">
        <b>{appeal.subject}</b>
        <span className={`gov-badge gov-${classToken(appeal.stage)}`}>{at(STAGE_KEY[appeal.stage] ?? "ap_s_new")}</span>
      </div>
      <span className="ac-sub">
        {at("ap_company")}: {appeal.companyName} · {appeal.agency} · {localDateTime(appeal.created)}
      </span>
      <p className="gov-body-preview">
        {appeal.body.slice(0, PREVIEW_LENGTH)}
        {appeal.body.length > PREVIEW_LENGTH && "…"}
      </p>
      <Trail steps={appeal.history} at={at} />
      <div className="gov-act">
        <a className="btn btn-ghost" href={doc}>
          {at("ap_doc")}
        </a>
        {isOpen && (
          <>
            <input
              className="gov-note"
              placeholder={at("ap_note")}
              aria-label={at("ap_note")}
              value={note}
              onChange={event => setNote(event.target.value)}
            />
            <button type="button" className="btn btn-primary ap-go" disabled={isBusy} onClick={() => void decide("assoc")}>
              {at("ap_support")}
            </button>
            <button type="button" className="btn btn-ghost ap-go" disabled={isBusy} onClick={() => void decide("rejected")}>
              {at("ap_reject")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* Member companies' appeals to the government pass through here: support one
   and the rais forwards it to the agency. */
export function AppealsView({ credentials, at }: ViewProps) {
  const [appeals, setAppeals] = useState<Appeal[] | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void cabinetPost(API, credentials, { op: "list" }).then(answer => {
      if (isCurrent && answer.status !== 0) setAppeals(parseAppeals(answer.body.items));
    });
    return () => {
      isCurrent = false;
    };
  }, [credentials]);

  const decide = async (id: string, stage: string, note: string): Promise<void> => {
    const answer = await cabinetPost(API, credentials, { op: "stage", id, stage, note });
    if (answer.status !== 0) setAppeals(parseAppeals(answer.body.items));
  };

  return (
    <div className="admin-panel">
      <h2>{at("nav_appeals")}</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>{at("ap_intro")}</p>
      <div id="apList">
        {appeals?.map(appeal => (
          <AppealCard
            key={appeal.id}
            appeal={appeal}
            at={at}
            credentials={credentials}
            onDecide={(stage, note) => decide(appeal.id, stage, note)}
          />
        ))}
        {appeals && !appeals.length && <p className="ac-label">{at("ap_empty")}</p>}
      </div>
    </div>
  );
}
