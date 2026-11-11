import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { dialogs } from "../../shell/dialogs";
import { useI18n } from "../../shell/i18n";
import {
  Chip,
  CompanyBar,
  companyIdentity,
  Empty,
  Funnel,
  Loading,
  marketJson,
  Ranks,
  texts,
  useCompany,
  useLoad,
} from "../../shell/market";
import type { CompanySession, Translate } from "../../shell/market";
import { reasonLabel, salaryText, seniorityLabel } from "./parts";
import { PipelineBoard } from "./PipelineBoard";
import { ShortlistDrawer } from "./ShortlistDrawer";
import { parseEmployer } from "./types";
import type { EmployerCabinet, Pipeline, Vacancy } from "./types";
import { VacancyComposer } from "./VacancyComposer";

const SMALL_BUTTON: CSSProperties = { padding: "5px 12px", fontSize: 13 };
const REASONS_HEADING: CSSProperties = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: ".08em",
  color: "var(--muted)",
};

const postAsCompany = (path: string, body: object) => marketJson(path, companyIdentity.withCompany(body));

type Loaded = { cabinet: EmployerCabinet; stages: string[] };

async function loadEmployer(): Promise<Loaded> {
  const [meta, answer] = await Promise.all([marketJson("/api/mehnat/meta"), postAsCompany("/api/mehnat/employer", {})]);
  return { cabinet: parseEmployer(answer), stages: texts(meta.stages) };
}

function HiringFunnel({ pipeline, t }: { pipeline: Pipeline; t: Translate }) {
  const { funnel, reasons } = pipeline;
  return (
    <div className="mk-box w12 is-lead">
      <h3>{t("hc_funnel")}</h3>
      <Funnel
        steps={[
          { n: funnel.applied, label: t("hc_fn_applied") },
          { n: funnel.screened, label: t("hc_fn_screened") },
          { n: funnel.interviewed, label: t("hc_fn_interview") },
          { n: funnel.offered, label: t("hc_fn_offer") },
          { n: funnel.hired, label: t("hc_fn_hired") },
        ]}
      />
      {reasons.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <h3 style={REASONS_HEADING}>{t("hc_reject_reasons")}</h3>
          <Ranks rows={reasons.map(reason => ({ label: reasonLabel(t)(reason.label), value: reason.n }))} limit={6} />
        </div>
      )}
    </div>
  );
}

type VacancyCardProps = { vacancy: Vacancy; t: Translate; onShortlist: () => void; onClose: () => void };

function VacancyCard({ vacancy, t, onShortlist, onClose }: VacancyCardProps) {
  const { lang } = useI18n();
  return (
    <div className="mk-card" style={{ gap: 7 }}>
      <div className="mk-chips">
        <Chip kind={vacancy.status === "open" ? "good" : "ghost"}>{t(`status_${vacancy.status}`)}</Chip>
        <Chip kind="accent">{seniorityLabel(t)(vacancy.seniority)}</Chip>
      </div>
      <h3>{vacancy.title}</h3>
      <div className="mk-meta">
        <span>{salaryText(vacancy.salaryMin, vacancy.salaryMax, vacancy.currency, lang, t)}</span>
        {vacancy.region && <span>📍 {vacancy.region}</span>}
      </div>
      <div className="mk-actions">
        <button className="btn btn-ghost" type="button" data-shortlist={vacancy.id} style={SMALL_BUTTON} onClick={onShortlist}>
          {t("hc_shortlist")}
        </button>
        {vacancy.status === "open" && (
          <button className="btn btn-ghost" type="button" data-close={vacancy.id} style={SMALL_BUTTON} onClick={onClose}>
            {t("hc_close")}
          </button>
        )}
      </div>
    </div>
  );
}

type CabinetProps = { loaded: Loaded; company: CompanySession; t: Translate; onChanged: () => void };

function Cabinet({ loaded, company, t, onChanged }: CabinetProps) {
  const [shortlistId, setShortlistId] = useState<string | null>(null);
  const { cabinet, stages } = loaded;

  const closeVacancy = async (id: string): Promise<void> => {
    if (!(await dialogs.confirm(t("hc_confirm_close"), { tone: "danger" }))) return;
    await postAsCompany("/api/mehnat/vacancy", { op: "close", id });
    onChanged();
  };

  return (
    <div className="mk-bento">
      <HiringFunnel pipeline={cabinet.pipeline} t={t} />
      <div className="mk-box w6">
        <h3>{t("hc_my_vacancies")}</h3>
        <div className="mk-stack">
          {cabinet.vacancies.map(vacancy => (
            <VacancyCard
              key={vacancy.id}
              vacancy={vacancy}
              t={t}
              onShortlist={() => setShortlistId(vacancy.id)}
              onClose={() => void closeVacancy(vacancy.id)}
            />
          ))}
          {!cabinet.vacancies.length && <Empty>{t("hc_no_vacancies")}</Empty>}
        </div>
      </div>
      <VacancyComposer company={company} t={t} onSaved={onChanged} />
      <div className="mk-box w12">
        <h3>{t("hc_pipeline")}</h3>
      </div>
      <PipelineBoard pipeline={cabinet.pipeline} stages={stages} t={t} onChanged={onChanged} />
      {shortlistId !== null && <ShortlistDrawer vacancyId={shortlistId} t={t} onClose={() => setShortlistId(null)} />}
    </div>
  );
}

type SignedInProps = { company: CompanySession; t: Translate; onExpired: () => void };

function SignedIn({ company, t, onExpired }: SignedInProps) {
  const employer = useLoad(`employer|${company.login}`, loadEmployer);
  const isRefused = !employer.isLoading && employer.data !== null && !employer.data.cabinet.ok;

  /* Credentials the server no longer accepts are dropped, as the old page did. */
  useEffect(() => {
    if (isRefused) onExpired();
  }, [isRefused, onExpired]);

  if (employer.isLoading || !employer.data) return <Loading />;
  if (isRefused) return <Empty>{t("hc_login_needed")}</Empty>;
  return <Cabinet loaded={employer.data} company={company} t={t} onChanged={employer.reload} />;
}

/* The Recruitment OS: vacancies, the pipeline board and the hiring funnel. */
export function EmployerPanel({ t }: { t: Translate }) {
  const { company, signIn, signOut } = useCompany();
  return (
    <>
      <CompanyBar id="hcEmpId" prefix="hc" t={t} company={company} onSignIn={signIn} onSignOut={signOut} />
      <div id="hcEmployer">
        {company ? (
          <SignedIn company={company} t={t} onExpired={signOut} />
        ) : (
          <Empty>{t("hc_login_needed")}</Empty>
        )}
      </div>
    </>
  );
}
