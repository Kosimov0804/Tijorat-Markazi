import { useI18n } from "../../shell/i18n";
import {
  companyIdentity,
  Drawer,
  Empty,
  listOf,
  Loading,
  marketJson,
  MatchCard,
  MatchTitle,
  record,
  text,
  useLoad,
} from "../../shell/market";
import type { Translate } from "../../shell/market";
import { availabilityLabel, MATCH_EXTRA, salaryText } from "./parts";
import { parseCandidateMatch } from "./types";
import type { CandidateMatch } from "./types";

const SHORTLIST_LIMIT = 20;

type Shortlist = { title: string; matches: CandidateMatch[] } | null;

async function loadShortlist(id: string): Promise<Shortlist> {
  const answer = await marketJson(
    "/api/mehnat/vacancy/matches",
    companyIdentity.withCompany({ id, limit: SHORTLIST_LIMIT }),
  );
  if (!answer.ok) return null;
  return { title: text(record(answer.vacancy).title), matches: listOf(answer.matches, parseCandidateMatch) };
}

type ShortlistDrawerProps = { vacancyId: string; t: Translate; onClose: () => void };

/* The candidates that best fit one vacancy, each with the reasons behind the score. */
export function ShortlistDrawer({ vacancyId, t, onClose }: ShortlistDrawerProps) {
  const { lang } = useI18n();
  const shortlist = useLoad(vacancyId, () => loadShortlist(vacancyId));
  const matches = shortlist.data?.matches ?? [];
  return (
    <Drawer title={shortlist.data?.title || t("hc_shortlist")} onClose={onClose}>
      {shortlist.isLoading && <Loading />}
      {!shortlist.isLoading && !shortlist.data && <Empty>{t("hc_no_matches")}</Empty>}
      {!shortlist.isLoading && shortlist.data && (
        <>
          <p className="mk-note">{t("hc_shortlist_note")}</p>
          <div className="mk-stack">
            {matches.map(({ candidate, ...match }, index) => (
              <MatchCard
                key={`${candidate.name}|${index}`}
                match={match}
                title={<MatchTitle name={candidate.name} by={candidate.occupation} />}
              >
                <div className="mk-meta" style={MATCH_EXTRA}>
                  <span>{salaryText(candidate.expectedMin, candidate.expectedMax, candidate.currency, lang, t)}</span>
                  <span>{availabilityLabel(t)(candidate.availability)}</span>
                  {candidate.region && <span>📍 {candidate.region}</span>}
                </div>
              </MatchCard>
            ))}
            {!matches.length && <Empty>{t("hc_no_matches")}</Empty>}
          </div>
        </>
      )}
    </Drawer>
  );
}
