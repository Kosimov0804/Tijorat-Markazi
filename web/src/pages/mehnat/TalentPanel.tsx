import { useState } from "react";
import { useI18n } from "../../shell/i18n";
import {
  Chip,
  Chips,
  Empty,
  FacetSelect,
  formatNumber,
  Loading,
  marketJson,
  marketQuery,
  texts,
  useDebounced,
  useLoad,
} from "../../shell/market";
import type { Json, Translate } from "../../shell/market";
import { availabilityLabel, salaryText, seniorityLabel } from "./parts";
import { parseCandidate, parseListing } from "./types";
import type { Candidate } from "./types";

const TYPING_DELAY_MS = 300;
const MAX_CARD_SKILLS = 5;

function TalentCard({ candidate, t }: { candidate: Candidate; t: Translate }) {
  const { lang } = useI18n();
  return (
    <article className="mk-card">
      <div className="mk-chips">
        <Chip kind="accent">{seniorityLabel(t)(candidate.seniority)}</Chip>
        <Chip kind={candidate.availability === "active" ? "good" : "ghost"}>
          {availabilityLabel(t)(candidate.availability)}
        </Chip>
        {candidate.visibility === "anonymous" && <Chip kind="warn">{t("hc_anon")}</Chip>}
        {candidate.isVerified && <Chip kind="good">{t("hc_verified")}</Chip>}
      </div>
      <h3>{candidate.name}</h3>
      {candidate.headline && <p className="mk-desc">{candidate.headline}</p>}
      <div className="mk-meta">
        {candidate.occupation && (
          <span>
            <b>{candidate.occupation}</b>
          </span>
        )}
        {candidate.region && <span>📍 {candidate.region}</span>}
        {candidate.years > 0 && (
          <span>
            {formatNumber(candidate.years, lang, 0)} {t("hc_yrs")}
          </span>
        )}
      </div>
      <Chips items={candidate.skills.slice(0, MAX_CARD_SKILLS)} kind="ghost" />
      <div className="mk-card-foot">
        <span className="mk-price" style={{ fontSize: 15 }}>
          {salaryText(candidate.expectedMin, candidate.expectedMax, candidate.currency, lang, t)}
        </span>
        {candidate.canRelocate && <span className="mk-chip is-ghost">{t("hc_relocate")}</span>}
      </div>
    </article>
  );
}

/* Candidates set their own visibility; an anonymous profile shows no name or contact. */
export function TalentPanel({ t }: { t: Translate }) {
  const { lang } = useI18n();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [seniority, setSeniority] = useState("");
  const [availability, setAvailability] = useState("");
  const [facets, setFacets] = useState<Json | null>(null);

  const q = useDebounced(search.trim(), TYPING_DELAY_MS);
  const url = `/api/mehnat/talent?${marketQuery({ q, region, seniority, availability })}`;
  const talent = useLoad(url, async () => parseListing(await marketJson(url), parseCandidate));
  if (!facets && talent.data?.facets) setFacets(talent.data.facets);
  const candidates = talent.data?.items ?? [];

  return (
    <>
      <p className="mk-sub">{t("hc_talent_sub")}</p>
      <div className="mk-filter">
        <input
          type="search"
          id="hcTq"
          placeholder={t("hc_talent_search")}
          autoComplete="off"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <FacetSelect
          id="hcTregion"
          value={region}
          allLabel={t("hc_all_regions")}
          options={texts(facets?.regions)}
          onChange={setRegion}
        />
        <FacetSelect
          id="hcTsen"
          value={seniority}
          allLabel={t("hc_all_levels")}
          options={texts(facets?.seniority)}
          labelOf={seniorityLabel(t)}
          onChange={setSeniority}
        />
        <FacetSelect
          id="hcTavail"
          value={availability}
          allLabel={t("hc_all_avail")}
          options={texts(facets?.availability)}
          labelOf={availabilityLabel(t)}
          onChange={setAvailability}
        />
        <span className="mk-count" id="hcTcount">
          {talent.data && t("hc_t_count").replace("{n}", formatNumber(talent.data.total, lang, 0))}
        </span>
      </div>
      <div className="mk-grid" id="hcTgrid">
        {talent.isLoading && <Loading />}
        {!talent.isLoading && !candidates.length && <Empty>{t("hc_t_empty")}</Empty>}
        {!talent.isLoading &&
          candidates.map((candidate, index) => (
            <TalentCard key={`${candidate.name}|${index}`} candidate={candidate} t={t} />
          ))}
      </div>
    </>
  );
}
