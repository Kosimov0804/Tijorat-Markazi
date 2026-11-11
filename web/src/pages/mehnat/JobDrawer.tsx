import { useState } from "react";
import { useI18n } from "../../shell/i18n";
import {
  AiDraft,
  askCopilot,
  Chip,
  companyIdentity,
  Drawer,
  formatNumber,
  identity,
  KeyValues,
  listOf,
  Loading,
  marketJson,
  MatchCard,
  Msg,
  record,
  text,
  texts,
  useLoad,
} from "../../shell/market";
import type { CopilotResult, DraftRow, Notice, Translate } from "../../shell/market";
import { employmentLabel, formatLabel, MATCH_EXTRA, NESTED_LIST, salaryText, seniorityLabel } from "./parts";
import { parseVacancyMatch } from "./types";
import type { Vacancy, VacancyMatch } from "./types";

/* Wide enough to find this vacancy among everything the candidate matches. */
const MATCH_LOOKUP_LIMIT = 100;

const APPLY_ERRORS: Readonly<Record<string, string>> = {
  profile_required: "hc_need_profile",
  already_applied: "hc_already",
};

async function loadOwnMatch(vacancyId: string): Promise<VacancyMatch | null> {
  if (!identity.email()) return null;
  const answer = await marketJson("/api/mehnat/matches", companyIdentity.withPerson({ limit: MATCH_LOOKUP_LIMIT }));
  if (!answer.ok) return null;
  return listOf(answer.matches, parseVacancyMatch).find(match => match.vacancy.id === vacancyId) ?? null;
}

function interviewRows(result: CopilotResult, t: Translate): DraftRow[] {
  const competencies = listOf(result.data.competencies, record);
  const questions = listOf(result.data.questions, record);
  return [
    {
      label: t("hc_competencies"),
      value: competencies.length ? (
        <ul style={NESTED_LIST}>
          {competencies.map((item, index) => (
            <li key={index}>
              <b>{text(item.name)}</b> — {text(item.whyItMatters)}
            </li>
          ))}
        </ul>
      ) : null,
    },
    {
      label: t("hc_questions"),
      value: questions.length ? (
        <ol style={NESTED_LIST}>
          {questions.map((item, index) => (
            <li key={index}>
              {text(item.q)}
              <br />
              <small style={{ color: "var(--muted)" }}>
                ✓ {text(item.lookFor)}
                {text(item.redFlag) && ` · ⚠ ${text(item.redFlag)}`}
              </small>
            </li>
          ))}
        </ol>
      ) : null,
    },
    { label: t("hc_prep"), value: texts(result.data.candidatePrep).join(" · ") },
  ];
}

function OwnFit({ match, t }: { match: VacancyMatch; t: Translate }) {
  const { lang } = useI18n();
  return (
    <>
      <h3 className="mk-h">{t("hc_your_fit")}</h3>
      <MatchCard match={match}>
        <div className="mk-meta" style={MATCH_EXTRA}>
          <span>
            {t("hc_employer_score")} <b>{formatNumber(match.employerScore, lang, 0)}%</b>
          </span>
          <span>
            {t("hc_candidate_score")} <b>{formatNumber(match.candidateScore, lang, 0)}%</b>
          </span>
        </div>
      </MatchCard>
    </>
  );
}

type JobDrawerProps = { vacancy: Vacancy; t: Translate; onClose: () => void };

export function JobDrawer({ vacancy, t, onClose }: JobDrawerProps) {
  const { lang } = useI18n();
  const own = useLoad(vacancy.id, () => loadOwnMatch(vacancy.id));
  const [notice, setNotice] = useState<Notice | null>(null);
  const [hasJustApplied, setHasJustApplied] = useState(false);
  const [coach, setCoach] = useState<CopilotResult | "loading" | null>(null);

  const apply = async (): Promise<void> => {
    if (!identity.email()) {
      setNotice({ key: "hc_need_email", kind: "err" });
      return;
    }
    const answer = await marketJson(
      "/api/mehnat/apply",
      companyIdentity.withPerson({ vacancyId: vacancy.id, source: "search" }),
    );
    if (!answer.ok) {
      setNotice({ key: APPLY_ERRORS[text(answer.error)] ?? "hc_apply_fail", kind: "err" });
      return;
    }
    setNotice({ key: "hc_apply_ok", kind: "ok" });
    setHasJustApplied(true);
  };

  const prepare = async (): Promise<void> => {
    setCoach("loading");
    const brief = [vacancy.title, vacancy.summary, vacancy.duties, vacancy.skillsRequired.join(", ")].join("\n");
    setCoach(await askCopilot(companyIdentity.withPerson({ agent: "mehnat.interview", lang, vacancy: brief })));
  };

  const rows = [
    [t("hc_occupation"), vacancy.occupation],
    [t("hc_duties"), vacancy.duties],
    [t("hc_req_skills"), vacancy.skillsRequired.join(", ")],
    [t("hc_pref_skills"), vacancy.skillsPreferred.join(", ")],
    [t("hc_languages"), vacancy.languages.join(", ")],
    [t("hc_certs"), vacancy.certificates.join(", ")],
    [t("hc_years"), vacancy.yearsMin ? `${vacancy.yearsMin}+` : ""],
    [t("hc_employment"), employmentLabel(t)(vacancy.employment)],
    [t("hc_deadline"), vacancy.deadline],
    [t("hc_contact"), vacancy.contact],
  ] as const;

  return (
    <Drawer title={vacancy.title} onClose={onClose}>
      <div className="mk-chips">
        <Chip kind="accent">{seniorityLabel(t)(vacancy.seniority)}</Chip>
        <Chip kind="ghost">{formatLabel(t)(vacancy.format)}</Chip>
      </div>
      <div className="mk-meta" style={{ fontSize: 14 }}>
        <span>
          <b>{vacancy.companyName}</b>
        </span>
        {vacancy.region && <span>📍 {vacancy.region}</span>}
      </div>
      <div className="mk-price" style={{ fontSize: 22 }}>
        {salaryText(vacancy.salaryMin, vacancy.salaryMax, vacancy.currency, lang, t)}
      </div>
      {vacancy.summary && (
        <p className="mk-desc" style={{ WebkitLineClamp: 99 }}>
          {vacancy.summary}
        </p>
      )}
      <KeyValues rows={rows} />
      {own.isLoading && <Loading />}
      {own.data && <OwnFit match={own.data} t={t} />}
      <div className="mk-actions">
        {own.data?.hasApplied && <span className="mk-chip is-good">{t("hc_applied")}</span>}
        {!own.isLoading && !own.data?.hasApplied && !hasJustApplied && (
          <button className="btn btn-primary" type="button" id="hcApply" onClick={() => void apply()}>
            {t("hc_apply")}
          </button>
        )}
        <button className="btn btn-ghost" type="button" id="hcCoach" onClick={() => void prepare()}>
          {t("hc_interview_kit")}
        </button>
      </div>
      <Msg notice={notice} t={t} id="hcApplyMsg" />
      <div id="hcCoachOut">
        {coach === "loading" && <Loading />}
        {coach !== null && coach !== "loading" && <AiDraft result={coach} rows={interviewRows(coach, t)} />}
      </div>
    </Drawer>
  );
}
