import { useI18n } from "../../shell/i18n";
import { amount, formatNumber, listOf, record, useLoad } from "../../shell/market";
import type { Json, Translate } from "../../shell/market";
import { analystPost, formatShare, formatSum, parseFunnel } from "./data";
import type { Query } from "./data";
import { AnKpi, Bars, FunnelRow, viewState } from "./parts";

type ViewProps = { query: Query; t: Translate };
type BoxProps = { data: Json; t: Translate };

function Headline({ data, t }: BoxProps) {
  const { lang } = useI18n();
  const platform = record(data.platform);
  const moliya = record(data.moliya);
  const count = (value: unknown): string => formatNumber(value, lang, 0);
  const newCompanies = amount(platform.newCompanies);
  return (
    <div className="an-kpis">
      <AnKpi
        value={count(platform.companies)}
        label={t("an_k_companies")}
        note={newCompanies ? `+${newCompanies} ${t("an_k_new")}` : ""}
      />
      <AnKpi value={count(platform.associations)} label={t("an_k_assocs")} />
      <AnKpi value={count(record(data.bozor).products)} label={t("an_k_products")} />
      <AnKpi value={count(record(data.mehnat).vacancies)} label={t("an_k_vacancies")} />
      <AnKpi value={formatSum(moliya.askedValue, lang)} label={t("an_k_asked")} />
      <AnKpi value={formatShare(moliya.fundingGapPct, lang)} label={t("an_k_gap")} />
    </div>
  );
}

function BozorBox({ data, t }: BoxProps) {
  const { lang } = useI18n();
  const bozor = record(data.bozor);
  return (
    <div className="an-box">
      <h3>{t("an_mod_bozor")}</h3>
      <Bars
        t={t}
        rows={[
          { label: t("an_k_products"), n: bozor.products },
          { label: "RFQ", n: bozor.rfqs },
          { label: t("an_k_quotes"), n: bozor.quotes },
          { label: t("an_k_deals"), n: bozor.deals },
          { label: t("an_k_inquiries"), n: bozor.inquiries },
        ]}
      />
      <p className="an-note">
        Match rate: <b>{formatShare(bozor.matchRate, lang)}</b>
      </p>
    </div>
  );
}

function MoliyaBox({ data, t }: BoxProps) {
  const { lang } = useI18n();
  const moliya = record(data.moliya);
  return (
    <div className="an-box">
      <h3>{t("an_mod_moliya")}</h3>
      <Bars
        t={t}
        rows={[
          { label: t("an_k_providers"), n: moliya.providers },
          { label: t("an_k_finprod"), n: moliya.products },
          { label: t("an_k_investors"), n: moliya.investors },
          { label: t("an_k_requests"), n: moliya.requests },
          { label: t("an_k_offers"), n: moliya.offers },
          { label: t("an_k_projects"), n: moliya.projects },
        ]}
      />
      <p className="an-note">
        {t("an_k_progressed")}: <b>{formatSum(moliya.capitalProgressed, lang)}</b>
      </p>
    </div>
  );
}

function MehnatBox({ data, t }: BoxProps) {
  const { lang } = useI18n();
  const mehnat = record(data.mehnat);
  return (
    <div className="an-box">
      <h3>{t("an_mod_mehnat")}</h3>
      <Bars
        t={t}
        rows={[
          { label: t("an_k_vacancies"), n: mehnat.vacancies },
          { label: t("an_k_seats"), n: mehnat.seats },
          { label: t("an_k_candidates"), n: mehnat.candidates },
          { label: t("an_k_apps"), n: mehnat.applications },
          { label: t("an_k_hires"), n: mehnat.hires },
        ]}
      />
      <p className="an-note">
        Shortage index: <b>{mehnat.shortageIndex == null ? "—" : formatNumber(mehnat.shortageIndex, lang, 2)}</b>
      </p>
    </div>
  );
}

/** What the whole platform looks like right now. */
export function OverviewView({ query, t }: ViewProps) {
  const { data, isLoading } = useLoad(`overview|${query.days}`, () => analystPost("overview", query));
  const waiting = viewState(isLoading, Boolean(data?.ok), t);
  if (waiting || !data) return waiting;

  return (
    <>
      <Headline data={data} t={t} />
      <div className="an-grid">
        <BozorBox data={data} t={t} />
        <MoliyaBox data={data} t={t} />
        <MehnatBox data={data} t={t} />
      </div>
      <div className="an-box an-wide">
        <h3>{t("an_funnels")}</h3>
        <p className="an-note">{t("an_funnels_p")}</p>
        {listOf(data.funnels, parseFunnel).map((funnel, index) => (
          <FunnelRow key={`${funnel.module}|${index}`} funnel={funnel} t={t} />
        ))}
      </div>
    </>
  );
}
