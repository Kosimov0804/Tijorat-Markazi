import { useState } from "react";
import type { RefObject } from "react";
import { useI18n } from "../../shell/i18n";
import {
  AiDraft,
  amount,
  askCopilot,
  companyIdentity,
  fillForm,
  formValues,
  listOf,
  Loading,
  record,
  text,
  texts,
} from "../../shell/market";
import type { CopilotResult, DraftRow, Translate } from "../../shell/market";
import { AI_HINT, AI_INPUT, NESTED_LIST } from "./parts";

type AiState = { status: "idle" } | { status: "needInput" } | { status: "loading" } | { status: "done"; result: CopilotResult };
type FormRef = RefObject<HTMLFormElement | null>;

function AiOutput({ id, state, needKey, t, rows }: {
  id: string;
  state: AiState;
  needKey: string;
  t: Translate;
  rows: (result: CopilotResult) => DraftRow[];
}) {
  return (
    <div id={id} className={state.status === "needInput" ? "mk-msg is-err" : undefined}>
      {state.status === "needInput" && t(needKey)}
      {state.status === "loading" && <Loading />}
      {state.status === "done" && <AiDraft result={state.result} rows={rows(state.result)} />}
    </div>
  );
}

function cvRows(result: CopilotResult, t: Translate): DraftRow[] {
  const data = result.data;
  return [
    { label: t("hc_f_name"), value: text(data.name) },
    { label: t("hc_headline"), value: text(data.headline) },
    { label: t("hc_occupation"), value: text(data.occupation) },
    { label: t("hc_region"), value: text(data.region) },
    { label: t("hc_level"), value: text(data.seniority) },
    { label: t("hc_years"), value: text(data.years) },
    { label: t("hc_skills"), value: texts(data.skills).join(", ") },
    { label: t("hc_languages"), value: texts(data.languages).join(", ") },
    { label: t("hc_certs"), value: texts(data.certificates).join(", ") },
    { label: t("hc_education"), value: text(data.education) },
  ];
}

function applyCv(form: HTMLFormElement, result: CopilotResult): void {
  const data = result.data;
  fillForm(form, {
    name: text(data.name),
    headline: text(data.headline),
    occupation: text(data.occupation),
    region: text(data.region),
    years: amount(data.years),
    skills: texts(data.skills),
    languages: texts(data.languages),
    certificates: texts(data.certificates),
    education: text(data.education),
    experience: text(data.experience),
    portfolio: text(data.portfolio),
    seniority: text(data.seniority),
  });
  form.querySelector("#cdName")?.scrollIntoView?.({ behavior: "smooth", block: "center" });
}

/* Paste a CV, get a draft profile; nothing is saved until the form is. */
function CvBlock({ formRef, t }: { formRef: FormRef; t: Translate }) {
  const { lang } = useI18n();
  const [cv, setCv] = useState("");
  const [state, setState] = useState<AiState>({ status: "idle" });

  const read = async (): Promise<void> => {
    const pasted = cv.trim();
    if (!pasted) {
      setState({ status: "needInput" });
      return;
    }
    setState({ status: "loading" });
    const result = await askCopilot(companyIdentity.withPerson({ agent: "mehnat.cv", lang, text: pasted }));
    setState({ status: "done", result });
  };

  return (
    <div className="mk-ai" style={{ marginBottom: "var(--mk-gap)" }}>
      <h3>{t("hc_cv_title")}</h3>
      <p style={AI_HINT}>{t("hc_cv_hint")}</p>
      <textarea
        id="hcCvText"
        style={{ ...AI_INPUT, width: "100%", minHeight: 110 }}
        placeholder={t("hc_cv_ph")}
        value={cv}
        onChange={event => setCv(event.target.value)}
      />
      <div className="mk-actions">
        <button className="btn btn-primary" type="button" id="hcCvGo" onClick={() => void read()}>
          {t("hc_cv_go")}
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          id="hcCvApply"
          hidden={!(state.status === "done" && state.result.ok)}
          onClick={() => {
            if (formRef.current && state.status === "done") applyCv(formRef.current, state.result);
          }}
        >
          {t("hc_cv_apply")}
        </button>
      </div>
      <AiOutput id="hcCvOut" state={state} needKey="hc_cv_need" t={t} rows={result => cvRows(result, t)} />
    </div>
  );
}

function careerRows(result: CopilotResult, t: Translate): DraftRow[] {
  const gaps = listOf(result.data.gapSkills, record);
  const plan = listOf(result.data.learningPlan, record);
  const paths = listOf(result.data.careerPaths, record);
  return [
    {
      label: t("hc_gap_skills"),
      value: gaps.length ? (
        <ul style={NESTED_LIST}>
          {gaps.map((gap, index) => (
            <li key={index}>
              <b>{text(gap.skill)}</b> — {text(gap.why)} <span className="mk-chip is-ghost">{text(gap.effort)}</span>
            </li>
          ))}
        </ul>
      ) : null,
    },
    { label: t("hc_strengths"), value: texts(result.data.strengths).join(" · ") },
    {
      label: t("hc_plan"),
      value: plan.length ? (
        <ol style={NESTED_LIST}>
          {plan.map((step, index) => (
            <li key={index}>
              {text(step.step)} — <i>{text(step.outcome)}</i>
              {amount(step.weeks) > 0 && ` (${text(step.weeks)} ${t("hc_weeks")})`}
            </li>
          ))}
        </ol>
      ) : null,
    },
    {
      label: t("hc_paths"),
      value: paths.length ? (
        <ul style={NESTED_LIST}>
          {paths.map((path, index) => (
            <li key={index}>
              <b>{text(path.role)}</b> <span className="mk-chip is-ghost">{text(path.likelihood)}</span> —{" "}
              {text(path.why)}
            </li>
          ))}
        </ul>
      ) : null,
    },
    { label: t("hc_cv_tips"), value: texts(result.data.cvImprovements).join(" · ") },
  ];
}

/* What stands between the profile, as typed in the form right now, and a target role. */
function CareerBlock({ formRef, t }: { formRef: FormRef; t: Translate }) {
  const { lang } = useI18n();
  const [target, setTarget] = useState("");
  const [state, setState] = useState<AiState>({ status: "idle" });

  const advise = async (): Promise<void> => {
    const role = target.trim();
    if (!role) {
      setState({ status: "needInput" });
      return;
    }
    setState({ status: "loading" });
    const typed = formRef.current ? formValues(formRef.current) : {};
    const profile = [typed.headline, typed.occupation, typed.skills, typed.experience].filter(Boolean).join("\n");
    const result = await askCopilot(
      companyIdentity.withPerson({ agent: "mehnat.career", lang, profile, target: role }),
    );
    setState({ status: "done", result });
  };

  return (
    <div className="mk-ai">
      <h3>{t("hc_career_title")}</h3>
      <p style={AI_HINT}>{t("hc_career_hint")}</p>
      <div className="mk-row">
        <input
          id="hcTarget"
          placeholder={t("hc_target_role")}
          style={{ ...AI_INPUT, flex: "1 1 220px" }}
          value={target}
          onChange={event => setTarget(event.target.value)}
        />
        <button className="btn btn-primary" type="button" id="hcCareerGo" onClick={() => void advise()}>
          {t("hc_career_go")}
        </button>
      </div>
      <AiOutput id="hcCareerOut" state={state} needKey="hc_target_need" t={t} rows={result => careerRows(result, t)} />
    </div>
  );
}

export function CandidateAi({ formRef, t }: { formRef: FormRef; t: Translate }) {
  return (
    <>
      <CvBlock formRef={formRef} t={t} />
      <CareerBlock formRef={formRef} t={t} />
    </>
  );
}
