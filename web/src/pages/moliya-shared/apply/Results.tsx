import { trustedHtml } from "../../../shell/trustedHtml";
import { StatusBadge, TypeBadge } from "../atoms/Badges";
import { BlockCard, KnockoutPanel, cappedLineHtml } from "../atoms/BlockCard";
import { Gauge } from "../atoms/Gauge";
import { KpiTiles } from "../atoms/KpiTiles";
import { orderedBlocks } from "../engine/engine";
import { useKit } from "../kit";
import type { Opened } from "./data";
import { AuditTable, DscrTable, InstitutionCard } from "./ResultParts";
import { Simulator } from "./Simulator";
import type { SimPicks } from "./simTiers";

const ROUTING_MIN_PERCENT = 60;
const ROUTING_CARDS = 9;

export type ResultsProps = {
  opened: Opened;
  picks: SimPicks;
  onPick: (criterion: string, index: number) => void;
  onResetPicks: () => void;
  onBack: () => void;
  onTeaser: () => void;
  onEdit: () => void;
  onSubmit: () => void;
};

function ResultHead({ opened, onBack, onTeaser, onEdit, onSubmit }: ResultsProps) {
  const { t, money, sectorName, regionName } = useKit();
  const { project } = opened;
  const { passport } = project;
  /* The owner's one transition: into the queue. The expert's decisions live on the investor page. */
  const canSubmit = project.status === "scored" && opened.unlocked;
  return (
    <div className="ms-head">
      <div>
        <div className="ms-title-row">
          <h2>{passport.nomi}</h2>
          <TypeBadge type={passport.loyihaTuri} />
          <StatusBadge status={project.status} />
        </div>
        <p className="mk-sub">
          {sectorName(passport)} · {regionName(passport)} · {t("ms_f_tin").replace(" *", "")} {passport.stir} ·{" "}
          <b className="num">{money(passport.soralayotganSumma, passport.valyuta)}</b>
        </p>
      </div>
      <div className="mk-actions">
        <button type="button" className="btn btn-ghost" id="ms-back" onClick={onBack}>
          {t("ms_back_list")}
        </button>
        <button type="button" className="btn btn-ghost" id="ms-teaser" onClick={onTeaser}>
          {t("ms_res_teaser")}
        </button>
        <button type="button" className="btn btn-ghost" id="ms-edit" onClick={onEdit}>
          {t("ms_edit")}
        </button>
        {canSubmit && (
          <button type="button" className="btn btn-primary" id="ms-submit" onClick={onSubmit}>
            {t("ms_act_submit")}
          </button>
        )}
      </div>
    </div>
  );
}

function ScoreAndKpis({ opened }: { opened: Opened }) {
  const kit = useKit();
  const { t, day, pctTxt } = kit;
  const { project, scoring } = opened;
  const isStartup = scoring.projectType === "startup";
  return (
    <div className="ms-split">
      <div className="mk-card ms-score">
        <Gauge total={scoring.total} status={scoring.routingStatus} />
        {scoring.isKnockout ? (
          <p className="mk-note" dangerouslySetInnerHTML={trustedHtml(cappedLineHtml(kit, scoring.rawTotal, formatted => formatted))} />
        ) : (
          <p className="mk-note">{t("ms_res_scored_on").replace("{d}", day(project.updated))}</p>
        )}
      </div>
      <div className="mk-card">
        <h3>{isStartup ? t("ms_res_forecast") : t("ms_res_kpi_title")}</h3>
        <p className="mk-sub">
          {isStartup ? t("ms_res_forecast_sub") : t("ms_res_kpi_sub").replace("{hurdle}", pctTxt(scoring.kpis.hurdle))}
        </p>
        <KpiTiles passport={project.passport} kpis={scoring.kpis} />
        {!isStartup && <DscrTable series={scoring.kpis.dscrSeries} />}
      </div>
    </div>
  );
}

function Gaps({ opened }: { opened: Opened }) {
  const { t, num } = useKit();
  const gaps = opened.suggestions;
  const gain = gaps.reduce((sum, gap) => sum + gap.gap, 0);
  return (
    <div className="mk-card">
      <div className="ms-sec">
        <h3>{t("ms_res_gaps")}</h3>
        {gain > 0 && <p>{t("ms_res_gaps_sub").replace("{n}", num(gain, 0))}</p>}
      </div>
      {gaps.length ? (
        <ul className="ms-gaps">
          {gaps.map(gap => (
            <li key={gap.key}>
              <b className="num">+{num(gap.gap, 0)}</b>
              <span>{t(gap.key)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ms-allmax">{t("ms_res_all_max")}</p>
      )}
    </div>
  );
}

function Routing({ opened }: { opened: Opened }) {
  const { t, num } = useKit();
  const { scoring, matches } = opened;
  const shown = matches.filter(match => match.matchPercent >= ROUTING_MIN_PERCENT).slice(0, ROUTING_CARDS);
  const fullMatches = matches.filter(match => match.fullMatch).length;
  return (
    <div className="mk-card">
      <div className="ms-sec">
        <h3>{t("ms_res_routing")}</h3>
        {opened.unlocked && <p>{t("ms_res_routing_sub").replace("{n}", num(fullMatches, 0))}</p>}
      </div>
      {opened.unlocked ? (
        <div className="mk-grid">
          {shown.length ? shown.map(match => <InstitutionCard key={match.inst.id} match={match} />) : <p className="mk-note">{t("ms_res_no_match")}</p>}
        </div>
      ) : (
        <div className="ms-locked">
          <p>{t("ms_res_routing_locked")}</p>
          <p className="mk-note">
            {t("ms_res_current_score")}: <b className="num">{num(scoring.total, 0)}</b>
            {scoring.isKnockout && t("ms_res_has_knockout")}
          </p>
        </div>
      )}
    </div>
  );
}

/* Who looked at the project and flagged it. The institution's note is NOT
   here on purpose: it is their internal view and the server never sends it. */
function InterestList({ opened }: { opened: Opened }) {
  const { t } = useKit();
  return (
    <div className="mk-card">
      <div className="ms-sec">
        <h3>{t("ms_int_title")}</h3>
        <p>{t("ms_int_sub")}</p>
      </div>
      {opened.interest.length ? (
        <ul className="ms-gaps">
          {opened.interest.map((entry, index) => (
            <li key={index}>
              <b>{t(`ms_int_${entry.state}`, entry.state)}</b>
              <span>{entry.providerName}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mk-note">{t("ms_int_none")}</p>
      )}
    </div>
  );
}

/** The official result of one project, as the server scored it. */
export function Results(props: ResultsProps) {
  const { opened, picks, onPick, onResetPicks } = props;
  const { t } = useKit();
  const { scoring } = opened;
  const isStartup = scoring.projectType === "startup";
  return (
    <>
      <ResultHead {...props} />
      {isStartup && <p className="ms-banner is-startup" dangerouslySetInnerHTML={trustedHtml(t("ms_res_startup_banner"))} />}
      <KnockoutPanel scoring={scoring} />
      <ScoreAndKpis opened={opened} />
      <div className="mk-card">
        <div className="ms-sec">
          <h3>{isStartup ? t("ms_res_breakdown_st") : t("ms_res_breakdown")}</h3>
          <p>{t("ms_res_breakdown_sub")}</p>
        </div>
        <div className="ms-blocks">
          {orderedBlocks(scoring).map(([key, block]) => (
            <BlockCard key={key} block={block} />
          ))}
        </div>
      </div>
      <div className="ms-split">
        <Gaps opened={opened} />
        <div className="mk-card">
          <div className="ms-sec">
            <h3>{t("ms_res_sim")}</h3>
            <p>{t("ms_res_sim_sub")}</p>
          </div>
          <div id="ms-sim-root">
            <Simulator type={scoring.projectType} picks={picks} baseTotal={scoring.total} onPick={onPick} onReset={onResetPicks} />
          </div>
        </div>
      </div>
      <Routing opened={opened} />
      {opened.unlocked && <InterestList opened={opened} />}
      <div className="mk-card">
        <div className="ms-sec">
          <h3>{t("ms_res_audit")}</h3>
          <p>{t("ms_res_audit_sub")}</p>
        </div>
        <AuditTable entries={opened.audit} />
      </div>
    </>
  );
}
