import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { dialogs } from "../../shell/dialogs";
import { useI18n } from "../../shell/i18n";
import {
  Chip,
  companyIdentity,
  Empty,
  formatMoney,
  formatNumber,
  identity,
  listOf,
  Loading,
  marketJson,
  MatchCard,
  MatchTitle,
  record,
  useLoad,
} from "../../shell/market";
import type { Json, Translate } from "../../shell/market";
import { CandidateAi } from "./CandidateAi";
import { DECLINE_REASON_CODES, MATCH_EXTRA, salaryText } from "./parts";
import { ProfileForm } from "./ProfileForm";
import { parseApplication, parseVacancyMatch } from "./types";
import type { Application, VacancyMatch } from "./types";

const MATCH_LIMIT = 12;
const SMALL_BUTTON: CSSProperties = { padding: "6px 14px" };
const INLINE_BUTTON: CSSProperties = { padding: "4px 12px", fontSize: 13 };

type Cabinet = { profile: Json | null; matches: VacancyMatch[]; applications: Application[] };

const asPerson = (path: string, body: object) => marketJson(path, companyIdentity.withPerson(body));

async function loadCabinet(): Promise<Cabinet> {
  const [profile, matches, applications] = await Promise.all([
    asPerson("/api/mehnat/candidate", { op: "get" }),
    asPerson("/api/mehnat/matches", { limit: MATCH_LIMIT }),
    asPerson("/api/mehnat/applications", {}),
  ]);
  return {
    profile: profile.candidate ? record(profile.candidate) : null,
    matches: listOf(matches.matches, parseVacancyMatch),
    applications: listOf(applications.items, parseApplication),
  };
}

const stageKind = (stage: string): string => (stage === "hired" ? "good" : stage === "rejected" ? "bad" : "accent");

type ActionProps = { t: Translate; onChanged: () => void };

function OwnMatch({ match, t, onChanged }: ActionProps & { match: VacancyMatch }) {
  const { lang } = useI18n();
  const { vacancy } = match;
  const apply = async (): Promise<void> => {
    const answer = await asPerson("/api/mehnat/apply", { vacancyId: vacancy.id, source: "match" });
    if (answer.ok) onChanged();
  };
  return (
    <MatchCard match={match} title={<MatchTitle name={vacancy.title} by={vacancy.companyName} />}>
      <div className="mk-meta" style={MATCH_EXTRA}>
        <span>{salaryText(vacancy.salaryMin, vacancy.salaryMax, vacancy.currency, lang, t)}</span>
        <span>
          {t("hc_candidate_score")} <b>{formatNumber(match.candidateScore, lang, 0)}%</b>
        </span>
        {match.hasApplied ? (
          <span className="mk-chip is-good">{t("hc_applied")}</span>
        ) : (
          <button className="btn btn-ghost" type="button" data-apply={vacancy.id} style={INLINE_BUTTON} onClick={() => void apply()}>
            {t("hc_apply")}
          </button>
        )}
      </div>
    </MatchCard>
  );
}

function OwnApplication({ application, t, onChanged }: ActionProps & { application: Application }) {
  const { lang } = useI18n();
  const respond = async (body: { accept: boolean; reason?: string }): Promise<void> => {
    await asPerson("/api/mehnat/offer/respond", { id: application.id, ...body });
    onChanged();
  };
  const decline = async (): Promise<void> => {
    const reason = await dialogs.prompt(`${t("hc_decline_reason")} ${DECLINE_REASON_CODES}`);
    if (reason) await respond({ accept: false, reason });
  };
  return (
    <div className="mk-card" style={{ gap: 8 }}>
      <div className="mk-chips">
        <Chip kind={stageKind(application.stage)}>{t(`stage_${application.stage}`)}</Chip>
      </div>
      <h3>{application.vacancyTitle}</h3>
      <div className="mk-meta">
        <span>{application.vacancyCompany}</span>
        <span>
          {t("hc_match")} <b>{formatNumber(application.score, lang, 0)}%</b>
        </span>
      </div>
      {application.stage === "offer" && (
        <div className="mk-actions">
          <button className="btn btn-primary" type="button" data-accept={application.id} style={SMALL_BUTTON} onClick={() => void respond({ accept: true })}>
            {t("hc_accept")}
          </button>
          <button className="btn btn-ghost" type="button" data-decline={application.id} style={SMALL_BUTTON} onClick={() => void decline()}>
            {t("hc_decline")}
          </button>
          {application.salary > 0 && (
            <span className="mk-chip is-accent">{formatMoney(application.salary, application.currency, lang)}</span>
          )}
        </div>
      )}
    </div>
  );
}

function SignedIn({ email, t }: { email: string; t: Translate }) {
  const formRef = useRef<HTMLFormElement>(null);
  const cabinet = useLoad(`me|${email}`, loadCabinet);
  if (cabinet.isLoading || !cabinet.data) return <Loading />;
  const { profile, matches, applications } = cabinet.data;
  return (
    <div className="mk-bento">
      <div className="mk-box w6 is-lead">
        <ProfileForm profile={profile} formRef={formRef} t={t} onSaved={cabinet.reload} />
      </div>
      <div className="mk-box w6">
        <CandidateAi formRef={formRef} t={t} />
      </div>
      <div className="mk-box w8">
        <h3>{t("hc_my_matches")}</h3>
        <div className="mk-stack">
          {matches.map(match => (
            <OwnMatch key={match.vacancy.id} match={match} t={t} onChanged={cabinet.reload} />
          ))}
          {!matches.length && <Empty>{t("hc_no_matches")}</Empty>}
        </div>
      </div>
      <div className="mk-box">
        <h3>{t("hc_my_apps")}</h3>
        <div className="mk-stack">
          {applications.map(application => (
            <OwnApplication key={application.id} application={application} t={t} onChanged={cabinet.reload} />
          ))}
          {!applications.length && <Empty>{t("hc_no_apps")}</Empty>}
        </div>
      </div>
    </div>
  );
}

/* The candidate's own cabinet, opened by e-mail rather than a password. */
export function CandidatePanel({ t }: { t: Translate }) {
  const [email, setEmail] = useState(identity.email);
  const [typedEmail, setTypedEmail] = useState(identity.email);
  const [typedName, setTypedName] = useState(identity.name);
  const [isEmailRefused, setIsEmailRefused] = useState(false);

  const save = (): void => {
    const address = typedEmail.trim();
    const isValid = address.includes("@");
    setIsEmailRefused(!isValid);
    if (!isValid) return;
    identity.setPerson(address, typedName.trim());
    setEmail(address);
  };

  return (
    <>
      <div className="mk-id" id="hcId">
        <span>{t("hc_id_email")}</span>
        <input
          id="hcEmail"
          type="email"
          placeholder="ism@email.uz"
          value={typedEmail}
          onChange={event => setTypedEmail(event.target.value)}
        />
        <input
          id="hcName"
          placeholder={t("hc_f_name")}
          value={typedName}
          onChange={event => setTypedName(event.target.value)}
        />
        <span className="mk-id-r">
          <button className="btn btn-primary" type="button" id="hcIdSave" onClick={save}>
            {t("hc_save")}
          </button>
        </span>
      </div>
      {isEmailRefused && <p className="mk-msg is-err">{t("hc_need_email")}</p>}
      <div id="hcMe">{email ? <SignedIn email={email} t={t} /> : <Empty>{t("hc_need_email")}</Empty>}</div>
    </>
  );
}
