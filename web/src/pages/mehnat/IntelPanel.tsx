import { useState } from "react";
import { useI18n } from "../../shell/i18n";
import {
  amount,
  Chip,
  Empty,
  FacetSelect,
  flag,
  formatNumber,
  formatPercent,
  Funnel,
  Kpi,
  listOf,
  Loading,
  marketJson,
  marketQuery,
  parseRank,
  Ranks,
  record,
  text,
  useKitText,
  useLoad,
} from "../../shell/market";
import type { Json, RankRow, Translate } from "../../shell/market";
import { reasonLabel, seniorityLabel } from "./parts";
import { WageBox } from "./WageBox";

const labelsOf = (rows: unknown): string[] => listOf(rows, row => text(record(row).label)).filter(Boolean);

function Headline({ headline, t }: { headline: Json; t: Translate }) {
  const { lang } = useI18n();
  const seats = text(headline.seats);
  return (
    <div className="mk-kpis" style={{ marginBottom: "var(--mk-gap)" }}>
      <Kpi
        value={headline.shortageIndex != null ? formatNumber(headline.shortageIndex, lang, 2) : "—"}
        label={t("hc_k_shortage")}
        note={t("hc_k_shortage_note")}
        isHero
      />
      <Kpi
        value={formatNumber(headline.openVacancies, lang, 0)}
        label={t("hc_k_vacancies")}
        note={amount(seats) ? `${seats} ${t("hc_seats")}` : ""}
      />
      <Kpi value={formatNumber(headline.activeCandidates, lang, 0)} label={t("hc_k_active")} />
      <Kpi value={formatNumber(headline.applications, lang, 0)} label={t("hc_k_apps")} />
      <Kpi
        value={
          headline.timeToFillDays
            ? `${formatNumber(record(headline.timeToFillDays).median, lang, 0)} ${t("hc_days")}`
            : "—"
        }
        label={t("hc_k_ttf")}
      />
      <Kpi value={formatPercent(headline.offerAcceptanceRate, lang)} label={t("hc_k_acceptance")} />
    </div>
  );
}

function skillGapRow(value: unknown): RankRow {
  const row = record(value);
  return { label: text(row.skill), value: amount(row.gap), display: `${text(row.demand)}↔${text(row.supply)}` };
}

function Board({ intel, t }: { intel: Json; t: Translate }) {
  const funnel = record(intel.funnel);
  const seniority = listOf(intel.seniority, value => {
    const row = record(value);
    const demand = amount(row.demand);
    return {
      label: seniorityLabel(t)(text(row.label)),
      value: demand,
      display: `${demand} ↔ ${text(row.supply)}`,
    };
  });
  const training = listOf(intel.trainingSignals, record);
  const rejections = listOf(intel.rejectionReasons, value => {
    const row = parseRank(value);
    return { ...row, label: reasonLabel(t)(row.label) };
  });
  return (
    <div className="mk-bento">
      <div className="mk-box w8 is-lead">
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
      </div>
      <div className="mk-box w4">
        <h3>{t("hc_wages")}</h3>
        <WageBox wages={record(intel.wages)} hasPrivacyNote={flag(intel.privacy)} t={t} />
      </div>
      <div className="mk-box w6">
        <h3>{t("hc_skill_gap")}</h3>
        <Ranks rows={listOf(intel.skillGap, skillGapRow)} digits={1} limit={10} isGap />
        <p className="mk-note">{t("hc_gap_note")}</p>
      </div>
      <div className="mk-box w6">
        <h3>{t("hc_skill_demand")}</h3>
        <Ranks rows={listOf(intel.skillDemand, parseRank)} limit={10} />
      </div>
      <div className="mk-box w4">
        <h3>{t("hc_occupations")}</h3>
        <Ranks rows={listOf(intel.occupations, parseRank)} />
      </div>
      <div className="mk-box w4">
        <h3>{t("hc_regions")}</h3>
        <Ranks rows={listOf(intel.regions, parseRank)} />
      </div>
      <div className="mk-box w4">
        <h3>{t("hc_seniority_bal")}</h3>
        <Ranks rows={seniority} limit={6} />
      </div>
      {training.length > 0 && (
        <div className="mk-box w12">
          <h3>{t("hc_training_signal")}</h3>
          <div className="mk-chips">
            {training.map((signal, index) => (
              <Chip key={index} kind="warn">
                {text(signal.skill)} — {t("hc_demand")} {text(signal.demand)} / {t("hc_supply")} {text(signal.supply)}
              </Chip>
            ))}
          </div>
          <p className="mk-note">{t("hc_training_note")}</p>
        </div>
      )}
      {rejections.length > 0 && (
        <div className="mk-box w6">
          <h3>{t("hc_reject_reasons")}</h3>
          <Ranks rows={rejections} />
        </div>
      )}
      <div className="mk-box w12">
        <p className="mk-note">{text(intel.privacy)}</p>
      </div>
    </div>
  );
}

type Facets = { regions: string[]; occupations: string[] };

/* Indices computed from vacancy, application, interview, offer and hire events. */
export function IntelPanel({ t }: { t: Translate }) {
  const kit = useKitText();
  const [region, setRegion] = useState("");
  const [occupation, setOccupation] = useState("");
  /* The first answer names every region and occupation; a filtered one would not. */
  const [facets, setFacets] = useState<Facets | null>(null);
  const url = `/api/mehnat/intel?${marketQuery({ region, occupation })}`;
  const intel = useLoad(url, () => marketJson(url));
  const hasFailed = intel.data?.error !== undefined;
  if (!facets && intel.data && !hasFailed) {
    setFacets({ regions: labelsOf(intel.data.regions), occupations: labelsOf(intel.data.occupations) });
  }

  return (
    <>
      <p className="mk-sub">{t("hc_intel_sub")}</p>
      <div className="mk-filter">
        <FacetSelect
          id="hcIregion"
          value={region}
          allLabel={t("hc_all_regions")}
          options={facets?.regions ?? []}
          onChange={setRegion}
        />
        <FacetSelect
          id="hcIocc"
          value={occupation}
          allLabel={t("hc_all_occ")}
          options={facets?.occupations ?? []}
          onChange={setOccupation}
        />
      </div>
      <div id="hcIntel">
        {(intel.isLoading || !intel.data) && <Loading />}
        {!intel.isLoading && hasFailed && <Empty>{kit("mk_nodata")}</Empty>}
        {!intel.isLoading && intel.data && !hasFailed && (
          <>
            <Headline headline={record(intel.data.headline)} t={t} />
            <Board intel={intel.data} t={t} />
          </>
        )}
      </div>
    </>
  );
}
