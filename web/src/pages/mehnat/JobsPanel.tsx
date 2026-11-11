import { useState } from "react";
import { useI18n } from "../../shell/i18n";
import {
  activateOnKey,
  Chip,
  Chips,
  Empty,
  FacetSelect,
  formatDay,
  formatNumber,
  Loading,
  marketJson,
  marketQuery,
  texts,
  useDebounced,
  useLoad,
} from "../../shell/market";
import type { Json, Translate } from "../../shell/market";
import { JobDrawer } from "./JobDrawer";
import { formatLabel, salaryText, seniorityLabel } from "./parts";
import { parseListing, parseVacancy } from "./types";
import type { Vacancy } from "./types";

const TYPING_DELAY_MS = 300;
const MAX_CARD_SKILLS = 4;

function JobCard({ vacancy, t, onOpen }: { vacancy: Vacancy; t: Translate; onOpen: () => void }) {
  const { lang } = useI18n();
  return (
    <article
      className="mk-card"
      data-job={vacancy.id}
      tabIndex={0}
      role="button"
      onClick={onOpen}
      onKeyDown={activateOnKey(onOpen)}
    >
      <div className="mk-chips">
        <Chip kind="accent">{seniorityLabel(t)(vacancy.seniority)}</Chip>
        <Chip kind="ghost">{formatLabel(t)(vacancy.format)}</Chip>
        {vacancy.headcount > 1 && (
          <Chip kind="ghost">
            {vacancy.headcount} {t("hc_seats")}
          </Chip>
        )}
      </div>
      <h3>{vacancy.title}</h3>
      {vacancy.summary && <p className="mk-desc">{vacancy.summary}</p>}
      <div className="mk-meta">
        <span>{vacancy.companyName}</span>
        {vacancy.region && (
          <span>
            📍 <b>{vacancy.region}</b>
          </span>
        )}
        {vacancy.applicants > 0 && (
          <span>
            {t("hc_applicants")} <b>{formatNumber(vacancy.applicants, lang, 0)}</b>
          </span>
        )}
      </div>
      <Chips items={vacancy.skillsRequired.slice(0, MAX_CARD_SKILLS)} kind="ghost" />
      <div className="mk-card-foot">
        <span className="mk-price" style={{ fontSize: 16 }}>
          {salaryText(vacancy.salaryMin, vacancy.salaryMax, vacancy.currency, lang, t)}
        </span>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{formatDay(vacancy.created, lang)}</span>
      </div>
    </article>
  );
}

export function JobsPanel({ t }: { t: Translate }) {
  const { lang } = useI18n();
  const [search, setSearch] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [region, setRegion] = useState("");
  const [seniority, setSeniority] = useState("");
  const [format, setFormat] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  /* The first answer's facets stay, so choosing one filter never empties the others. */
  const [facets, setFacets] = useState<Json | null>(null);

  const q = useDebounced(search.trim(), TYPING_DELAY_MS);
  const salaryMin = useDebounced(minSalary, TYPING_DELAY_MS);
  const url = `/api/mehnat/jobs?${marketQuery({ q, region, seniority, format, salaryMin })}`;
  const jobs = useLoad(url, async () => parseListing(await marketJson(url), parseVacancy));
  if (!facets && jobs.data?.facets) setFacets(jobs.data.facets);

  const vacancies = jobs.data?.items ?? [];
  const openVacancy = vacancies.find(vacancy => vacancy.id === openId);

  return (
    <>
      <div className="mk-filter">
        <input
          type="search"
          id="hcQ"
          placeholder={t("hc_search")}
          autoComplete="off"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <FacetSelect
          id="hcRegion"
          value={region}
          allLabel={t("hc_all_regions")}
          options={texts(facets?.regions)}
          onChange={setRegion}
        />
        <FacetSelect
          id="hcSeniority"
          value={seniority}
          allLabel={t("hc_all_levels")}
          options={texts(facets?.seniority)}
          labelOf={seniorityLabel(t)}
          onChange={setSeniority}
        />
        <FacetSelect
          id="hcFormat"
          value={format}
          allLabel={t("hc_all_formats")}
          options={texts(facets?.formats)}
          labelOf={formatLabel(t)}
          onChange={setFormat}
        />
        <input
          type="number"
          id="hcSalary"
          placeholder={t("hc_min_salary")}
          min="0"
          value={minSalary}
          onChange={event => setMinSalary(event.target.value)}
        />
        <span className="mk-count" id="hcCount">
          {jobs.data && t("hc_count").replace("{n}", formatNumber(jobs.data.total, lang, 0))}
        </span>
      </div>
      <div className="mk-grid" id="hcGrid">
        {jobs.isLoading && <Loading />}
        {!jobs.isLoading && !vacancies.length && <Empty>{t("hc_empty")}</Empty>}
        {!jobs.isLoading &&
          vacancies.map(vacancy => (
            <JobCard key={vacancy.id} vacancy={vacancy} t={t} onOpen={() => setOpenId(vacancy.id)} />
          ))}
      </div>
      {openVacancy && <JobDrawer vacancy={openVacancy} t={t} onClose={() => setOpenId(null)} />}
    </>
  );
}
