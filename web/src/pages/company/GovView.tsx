import { useEffect, useState } from "react";
import { cabinetPost, classToken, DocButton, FlashNote, formatDateTime, useFlash } from "../../shell/cabinet";
import type { CabinetCredentials } from "../../shell/cabinet";
import { useI18n } from "../../shell/i18n";
import { listOf, record, text, texts } from "../../shell/market/narrow";
import type { CompanyTextKey } from "./text";
import type { CompanyText, ViewProps } from "./types";

type Step = { stage: string; by: string; note: string };
type Appeal = {
  id: string;
  subject: string;
  stage: string;
  agency: string;
  created: string | number;
  body: string;
  history: Step[];
};

const API = "/api/company/appeal";
const PREVIEW_LENGTH = 240;
const NOTE_MS = 3200;
const EMPTY_FORM = { subject: "", hint: "", body: "" };
const STAGE_KEY: Readonly<Record<string, CompanyTextKey | undefined>> = {
  new: "gov_s_new",
  assoc: "gov_s_assoc",
  sent: "gov_s_sent",
  answered: "gov_s_answered",
  rejected: "gov_s_rejected",
};

function parseAppeal(value: unknown): Appeal {
  const item = record(value);
  return {
    id: text(item.id),
    subject: text(item.subject),
    stage: text(item.stage),
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

type CardProps = { appeal: Appeal; ot: CompanyText; credentials: CabinetCredentials };

function AppealCard({ appeal, ot, credentials }: CardProps) {
  const { lang } = useI18n();
  /* The route the appeal travelled: who moved it and what they said. */
  const trail = appeal.history.slice(1);
  return (
    <div className="gov-card">
      <div className="gov-card-top">
        <b>{appeal.subject}</b>
        <span className={`gov-badge gov-${classToken(appeal.stage)}`}>{ot(STAGE_KEY[appeal.stage] ?? "gov_s_new")}</span>
      </div>
      <span className="co-sub">
        {appeal.agency} · {formatDateTime(appeal.created, lang)}
      </span>
      <p className="gov-body-preview">
        {appeal.body.slice(0, PREVIEW_LENGTH)}
        {appeal.body.length > PREVIEW_LENGTH && "…"}
      </p>
      {trail.length > 0 && (
        <div className="gov-trail">
          {trail.map((step, index) => {
            const key = STAGE_KEY[step.stage];
            return (
              <div className="gov-trail-row" key={index}>
                <span>{key ? ot(key) : step.stage}</span>
                <em>
                  {step.by}
                  {step.note && ` · ${step.note}`}
                </em>
              </div>
            );
          })}
        </div>
      )}
      <DocButton className="btn btn-ghost gov-doc" path="/api/appeal/doc" body={{ id: appeal.id, ...credentials }} fallbackName="murojaat.doc">
        {ot("gov_doc")}
      </DocButton>
    </div>
  );
}

/* Write the appeal, let the AI formalise it, send it up: the association
   reviews it and the rais forwards it to the agency. */
export function GovView({ credentials, ot }: ViewProps) {
  const { lang } = useI18n();
  const [agencies, setAgencies] = useState<string[]>([]);
  const [agency, setAgency] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [appeals, setAppeals] = useState<Appeal[] | null>(null);
  const [busy, setBusy] = useState<"draft" | "send" | null>(null);
  const flash = useFlash(NOTE_MS);

  useEffect(() => {
    let isCurrent = true;
    void cabinetPost(API, credentials, { op: "list" }).then(answer => {
      if (!isCurrent) return;
      const offered = texts(answer.body.agencies);
      setAgencies(offered);
      setAgency(current => current || offered[0] || "");
      setAppeals(parseAppeals(answer.body.items));
    });
    return () => {
      isCurrent = false;
    };
  }, [credentials]);

  const handleDraft = async (): Promise<void> => {
    const subject = form.subject.trim();
    const hint = form.hint.trim();
    if (!subject && !hint) {
      flash.show(ot("gov_need"), false);
      return;
    }
    setBusy("draft");
    const answer = await cabinetPost("/api/appeal/draft", credentials, { agency, subject, hint, lang });
    setBusy(null);
    const drafted = answer.body.ok ? text(answer.body.text) : "";
    if (drafted) setForm(current => ({ ...current, body: drafted }));
    else flash.show(ot("gov_ai_off"), false);
  };

  const handleSend = async (): Promise<void> => {
    const subject = form.subject.trim();
    const body = form.body.trim();
    if (!subject || !body) {
      flash.show(ot("gov_need"), false);
      return;
    }
    setBusy("send");
    const answer = await cabinetPost(API, credentials, { agency, subject, body });
    setBusy(null);
    if (answer.status === 0) flash.show("Error", false);
    else if (!answer.body.ok) flash.show(ot("gov_need"), false);
    else {
      setForm(EMPTY_FORM);
      setAppeals(parseAppeals(answer.body.items));
      flash.show(ot("gov_sent"));
    }
  };

  const field = (key: keyof typeof EMPTY_FORM) => ({
    value: form[key],
    onChange: (event: { target: { value: string } }) => setForm(current => ({ ...current, [key]: event.target.value })),
  });

  return (
    <div className="panel co-panel">
      <div className="co-panel-head">
        <span className="co-ic">🏛</span>
        <h2 id="govTitle">{ot("gov_title")}</h2>
      </div>
      <p className="co-sub" id="govSub">
        {ot("gov_sub")}
      </p>
      <form className="admin-form gov-form" id="govForm" onSubmit={event => event.preventDefault()}>
        <div className="gov-f">
          <div className="ac-label" id="govLbAgency">
            {ot("gov_agency")}
          </div>
          <select
            id="gov-agency"
            className="adm-search"
            aria-labelledby="govLbAgency"
            value={agency}
            onChange={event => setAgency(event.target.value)}
          >
            {agencies.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="gov-f">
          <div className="ac-label" id="govLbSubject">
            {ot("gov_subject")}
          </div>
          <input id="gov-subject" aria-labelledby="govLbSubject" placeholder={ot("gov_subject_ph")} required {...field("subject")} />
        </div>
        <div className="gov-f gov-wide">
          <div className="ac-label" id="govLbHint">
            {ot("gov_hint")}
          </div>
          <input id="gov-hint" aria-labelledby="govLbHint" placeholder={ot("gov_hint_ph")} {...field("hint")} />
        </div>
        <button className="btn btn-ghost" type="button" id="govDraft" disabled={busy === "draft"} onClick={() => void handleDraft()}>
          {ot(busy === "draft" ? "gov_drafting" : "gov_draft")}
        </button>
      </form>
      <div className="gov-f gov-wide" style={{ marginTop: 10 }}>
        <div className="ac-label" id="govLbBody">
          {ot("gov_body")}
        </div>
        <textarea
          id="gov-body"
          className="gov-body"
          rows={9}
          aria-labelledby="govLbBody"
          placeholder={ot("gov_body_ph")}
          {...field("body")}
        />
      </div>
      <div className="gov-actions">
        <button className="btn btn-primary" type="button" id="govSend" disabled={busy === "send"} onClick={() => void handleSend()}>
          {ot(busy === "send" ? "gov_sending" : "gov_send")}
        </button>
        <FlashNote id="govMsg" flash={flash} />
      </div>
      <h3 className="gov-listh" id="govListH">
        {ot("gov_listh")}
      </h3>
      <div id="govList">
        {appeals?.map(appeal => (
          <AppealCard key={appeal.id} appeal={appeal} ot={ot} credentials={credentials} />
        ))}
        {appeals && !appeals.length && <p className="co-sub">{ot("gov_empty")}</p>}
      </div>
    </div>
  );
}
