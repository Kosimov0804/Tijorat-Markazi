import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useI18n } from "../../shell/i18n";
import {
  AiDraft,
  amount,
  askCopilot,
  companyIdentity,
  Field,
  fillForm,
  formValues,
  Loading,
  marketJson,
  Msg,
  OptionSelect,
  text,
  texts,
} from "../../shell/market";
import type { CompanySession, CopilotResult, DraftRow, Notice, Translate } from "../../shell/market";
import { AI_HINT, AI_INPUT, employmentLabel, formatLabel, NESTED_LIST, seniorityLabel } from "./parts";
import { EMPLOYMENTS, SALARY_CURRENCIES, SENIORITIES, WORK_FORMATS } from "./types";

/* The warnings stay up long enough to read before the cabinet reloads. */
const RELOAD_AFTER_WARNINGS_MS = 2500;
const RELOAD_MS = 500;

type AiState = { status: "idle" } | { status: "needText" } | { status: "loading" } | { status: "done"; result: CopilotResult };

function draftRows(result: CopilotResult, t: Translate): DraftRow[] {
  const data = result.data;
  const removed = texts(data.removedRequirements);
  return [
    { label: t("hc_f_title"), value: text(data.title) },
    { label: t("hc_occupation"), value: text(data.occupation) },
    { label: t("hc_summary"), value: text(data.summary) },
    { label: t("hc_duties"), value: text(data.duties) },
    { label: t("hc_req_skills"), value: texts(data.skillsRequired).join(", ") },
    { label: t("hc_pref_skills"), value: texts(data.skillsPreferred).join(", ") },
    { label: t("hc_level"), value: text(data.seniority) },
    { label: t("hc_screening"), value: texts(data.screeningQuestions).join(" · ") },
    {
      label: t("hc_removed"),
      value: removed.length ? (
        <ul style={{ ...NESTED_LIST, color: "var(--mk-warn)" }}>
          {removed.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : null,
    },
  ];
}

function applyDraft(form: HTMLFormElement, result: CopilotResult): void {
  const data = result.data;
  fillForm(form, {
    title: text(data.title),
    occupation: text(data.occupation),
    summary: text(data.summary),
    duties: text(data.duties),
    skillsRequired: texts(data.skillsRequired),
    skillsPreferred: texts(data.skillsPreferred),
    languages: texts(data.languages),
    certificates: texts(data.certificates),
    yearsMin: amount(data.yearsMin),
    salaryMin: amount(data.salaryMin),
    salaryMax: amount(data.salaryMax),
    seniority: text(data.seniority),
    format: text(data.format),
    employment: text(data.employment),
  });
  form.querySelector("#vcTitle")?.scrollIntoView?.({ behavior: "smooth", block: "center" });
}

function VacancyFields({ t }: { t: Translate }) {
  return (
    <>
      <Field label={t("hc_f_title")}>
        <input id="vcTitle" name="title" required />
      </Field>
      <Field label={t("hc_occupation")}>
        <input id="vcOcc" name="occupation" />
      </Field>
      <Field label={t("hc_summary")} isWide>
        <textarea id="vcSummary" name="summary" />
      </Field>
      <Field label={t("hc_duties")} isWide>
        <textarea id="vcDuties" name="duties" />
      </Field>
      <Field label={t("hc_req_skills")} isWide>
        <input id="vcReq" name="skillsRequired" placeholder="IFRS, Excel" />
      </Field>
      <Field label={t("hc_pref_skills")} isWide>
        <input id="vcPref" name="skillsPreferred" />
      </Field>
      <Field label={t("hc_languages")}>
        <input id="vcLangs" name="languages" />
      </Field>
      <Field label={t("hc_certs")}>
        <input id="vcCerts" name="certificates" />
      </Field>
      <Field label={t("hc_level")}>
        <OptionSelect id="vcSeniority" name="seniority" options={SENIORITIES} labelOf={seniorityLabel(t)} defaultValue="middle" />
      </Field>
      <Field label={t("hc_years")}>
        <input id="vcYears" name="yearsMin" type="number" min="0" />
      </Field>
      <Field label={t("hc_salary_min")}>
        <input id="vcMin" name="salaryMin" type="number" min="0" />
      </Field>
      <Field label={t("hc_salary_max")}>
        <input id="vcMax" name="salaryMax" type="number" min="0" />
      </Field>
      <Field label={t("hc_currency")}>
        <OptionSelect id="vcCurrency" name="currency" options={SALARY_CURRENCIES} />
      </Field>
      <Field label={t("hc_region")}>
        <input id="vcRegion" name="region" />
      </Field>
      <Field label={t("hc_format")}>
        <OptionSelect id="vcFormat" name="format" options={WORK_FORMATS} labelOf={formatLabel(t)} />
      </Field>
      <Field label={t("hc_employment")}>
        <OptionSelect id="vcEmployment" name="employment" options={EMPLOYMENTS} labelOf={employmentLabel(t)} />
      </Field>
      <Field label={t("hc_headcount")}>
        <input id="vcHeadcount" name="headcount" type="number" min="1" defaultValue="1" />
      </Field>
      <Field label={t("hc_deadline")}>
        <input id="vcDeadline" name="deadline" type="date" />
      </Field>
      <Field label={t("hc_contact")} isWide>
        <input id="vcContact" name="contact" />
      </Field>
    </>
  );
}

type VacancyComposerProps = { company: CompanySession; t: Translate; onSaved: () => void };

/* The vacancy builder and the form it fills: two boxes of the employer cabinet. */
export function VacancyComposer({ company, t, onSaved }: VacancyComposerProps) {
  const { lang } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const reloadTimer = useRef<number | undefined>(undefined);
  const [brief, setBrief] = useState("");
  const [ai, setAi] = useState<AiState>({ status: "idle" });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [warnings, setWarnings] = useState<readonly string[]>([]);
  useEffect(() => () => window.clearTimeout(reloadTimer.current), []);

  const build = async (): Promise<void> => {
    const described = brief.trim();
    if (!described) {
      setAi({ status: "needText" });
      return;
    }
    setAi({ status: "loading" });
    const result = await askCopilot(
      companyIdentity.withCompany({
        agent: "mehnat.vacancy",
        lang,
        text: described,
        company: company.name,
        sector: company.sector,
      }),
    );
    setAi({ status: "done", result });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    const answer = await marketJson("/api/mehnat/vacancy", companyIdentity.withCompany(formValues(form)));
    if (!answer.ok) {
      setNotice({ key: "hc_save_fail", kind: "err" });
      return;
    }
    const raised = texts(answer.warnings);
    setNotice({ key: "hc_save_ok", kind: "ok" });
    setWarnings(raised);
    form.reset();
    reloadTimer.current = window.setTimeout(onSaved, raised.length ? RELOAD_AFTER_WARNINGS_MS : RELOAD_MS);
  };

  const canApply = ai.status === "done" && ai.result.ok;
  return (
    <>
      <div className="mk-box w6">
        <div className="mk-ai">
          <h3>{t("hc_vb_title")}</h3>
          <p style={AI_HINT}>{t("hc_vb_hint")}</p>
          <textarea
            id="hcVbText"
            style={{ ...AI_INPUT, width: "100%", minHeight: 100 }}
            placeholder={t("hc_vb_ph")}
            value={brief}
            onChange={event => setBrief(event.target.value)}
          />
          <div className="mk-actions">
            <button className="btn btn-primary" type="button" id="hcVbGo" onClick={() => void build()}>
              {t("hc_vb_go")}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              id="hcVbApply"
              hidden={!canApply}
              onClick={() => {
                if (formRef.current && ai.status === "done") applyDraft(formRef.current, ai.result);
              }}
            >
              {t("hc_vb_apply")}
            </button>
          </div>
          <div id="hcVbOut" className={ai.status === "needText" ? "mk-msg is-err" : undefined}>
            {ai.status === "needText" && t("hc_vb_need")}
            {ai.status === "loading" && <Loading />}
            {ai.status === "done" && <AiDraft result={ai.result} rows={draftRows(ai.result, t)} />}
          </div>
        </div>
      </div>
      <div className="mk-box w12">
        <h3>{t("hc_new_vacancy")}</h3>
        <form className="mk-form" id="hcVacForm" ref={formRef} onSubmit={handleSubmit}>
          <VacancyFields t={t} />
          <div className="mk-actions wide">
            <button className="btn btn-primary" type="submit">
              {t("hc_publish")}
            </button>
            <Msg notice={notice} t={t} id="hcVacMsg" />
          </div>
          <div className="wide" id="hcVacWarn">
            {warnings.length > 0 && (
              <div className="mk-assume" style={{ marginTop: 10 }}>
                <b>{t("hc_warnings")}</b>
                <ul>
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
