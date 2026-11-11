import { trustedHtml } from "../../../shell/trustedHtml";
import { tierClass } from "../atoms/Badges";
import { CONFIG, REF } from "../engine/engine";
import type { OpenTiers, RefItem } from "../engine/types";
import { useKit } from "../kit";
import type { Kit } from "../kit";

const S = CONFIG.scoring;
const SS = CONFIG.startupScoring;

type Tier = readonly [label: string, points: number];

function WeightBlock({ title, max, tiers }: { title: string; max: number; tiers: readonly Tier[] }) {
  const { t, num } = useKit();
  const top = Math.max(...tiers.map(tier => tier[1]));
  return (
    <div className="ms-met-block">
      <div className="ms-met-head">
        <span>{title}</span>
        <b className="num">
          {num(max, 0)} {t("ms_met_tiers_label")}
        </b>
      </div>
      <ul>
        {tiers.map(([label, points], index) => (
          <li key={index} className={points === top ? "is-top" : undefined}>
            <span>{label}</span>
            <i className="num">{num(points, 0)}</i>
          </li>
        ))}
      </ul>
    </div>
  );
}

type BlockDef = { title: string; max: number; tiers: Tier[] };

function qualitativeBlocks({ t }: Kit): BlockDef[] {
  return [
    {
      title: t("ms_met_b1"),
      max: S.weights.teo,
      tiers: [[t("ms_tier_teo_big5"), S.teo.big5], [t("ms_tier_teo_recognized"), S.teo.recognized], [t("ms_teo_internal"), S.teo.internal], [t("ms_none"), S.teo.none]],
    },
    {
      title: t("ms_met_b2"),
      max: S.weights.audit,
      tiers: [
        [t("ms_tier_audit_b5"), S.audit.threeYearCleanBig5],
        [t("ms_tier_audit_other"), S.audit.threeYearCleanOther],
        [t("ms_tier_audit_12"), S.audit.oneToTwoYear],
        [t("ms_tier_audit_signed"), S.audit.contractSignedInProgress],
        [t("ms_none"), S.audit.none],
      ],
    },
    {
      title: t("ms_met_b3"),
      max: S.weights.continuity,
      tiers: [
        [t("ms_tier_cont_33"), S.continuity.threeYearsThreeProfitable],
        [t("ms_tier_cont_32"), S.continuity.threeYearsTwoProfitable],
        [t("ms_tier_cont_1"), S.continuity.oneYearProfitable],
        [t("ms_tier_cont_none"), S.continuity.greenfield],
      ],
    },
    {
      title: t("ms_met_b4"),
      max: S.weights.netProfit,
      tiers: [[t("ms_tier_np_3"), S.netProfit.threeYears], [t("ms_tier_np_2"), S.netProfit.twoYears], [t("ms_tier_np_1"), S.netProfit.oneYear], [t("ms_none"), S.netProfit.none]],
    },
    {
      title: t("ms_met_b5"),
      max: S.weights.dueDiligence,
      tiers: [
        [t("ms_tier_dd_all"), S.dueDiligence.allSixBig5],
        [t("ms_tier_dd_35"), S.dueDiligence.threeToFive],
        [t("ms_tier_dd_legal"), S.dueDiligence.onlyConsultingLegal],
        [t("ms_tier_dd_planned"), S.dueDiligence.plannedApproved],
        [t("ms_none"), S.dueDiligence.none],
      ],
    },
  ];
}

function financialBlocks({ t, num }: Kit): BlockDef[] {
  const debt = S.debtBurden.debtEbitda;
  const cover = S.debtBurden.dscr;
  const at = (sign: string, value: number): string => `${sign} ${num(value, 1)}`;
  return [
    {
      title: t("ms_met_b6"),
      max: S.weights.irr,
      tiers: [
        [t("ms_tier_irr_p8"), S.irr.hurdlePlus8pp],
        [t("ms_tier_irr_p4"), S.irr.hurdlePlus4pp],
        [t("ms_tier_irr_at"), S.irr.atHurdle],
        [t("ms_tier_irr_below2"), S.irr.belowUpTo2pp],
        [t("ms_tier_irr_below_more"), S.irr.belowMore],
      ],
    },
    {
      title: t("ms_met_b7a"),
      max: debt.le1_5,
      tiers: [[at("≤", 1.5), debt.le1_5], [at("≤", 2.5), debt.le2_5], [at("≤", 3), debt.le3_0], [at(">", 3), debt.above3_0]],
    },
    {
      title: t("ms_met_b7b"),
      max: cover.ge1_8,
      tiers: [[at("≥", 1.8), cover.ge1_8], [at("≥", 1.5), cover.ge1_5], [at("≥", 1.2), cover.ge1_2], [at("<", 1.2), cover.below1_2]],
    },
    {
      title: t("ms_met_b8"),
      max: S.weights.exit,
      tiers: [
        [t("ms_tier_exit_full"), S.exit.fullContractFormulaTerm],
        [t("ms_tier_exit_general"), S.exit.generalDescriptionNoFormula],
        [t("ms_tier_exit_intent"), S.exit.intentOnly],
        [t("ms_none"), S.exit.none],
      ],
    },
  ];
}

function startupBlocks({ t, label }: Kit): BlockDef[] {
  const W = SS.weights;
  const tiers = (items: readonly RefItem[], table: OpenTiers): Tier[] => items.map(item => [label(item), table[item.id] as number]);
  return [
    { title: t("ms_block_team"), max: W.team, tiers: tiers(REF.teamExperience, SS.team) },
    { title: t("ms_block_product"), max: W.product, tiers: tiers(REF.productStage, SS.product) },
    { title: t("ms_block_market"), max: W.market, tiers: tiers(REF.marketValidation, SS.market) },
    { title: t("ms_block_funding"), max: W.funding, tiers: tiers(REF.fundingHistory, SS.funding) },
    { title: t("ms_block_fin_model"), max: W.finModel, tiers: tiers(REF.startupFinModelQuality, SS.finModel) },
    { title: t("ms_block_potential"), max: W.potential, tiers: tiers(REF.potentialTiers, SS.potential) },
    { title: t("ms_block_legal"), max: W.legal, tiers: tiers(REF.legalIpStatus, SS.legal) },
    { title: t("ms_block_next_exit"), max: W.exit, tiers: tiers(REF.nextStageExit, SS.exit) },
  ];
}

const BlockGrid = ({ blocks }: { blocks: readonly BlockDef[] }) => (
  <div className="ms-met-grid">
    {blocks.map((block, index) => (
      <WeightBlock key={index} {...block} />
    ))}
  </div>
);

/* Every string placed as markup below comes from the bundled dictionary;
   the only values filled in are fixed code names and a formatted number. */
const code = (name: string): string => `<code>${name}</code>`;

/** The whole methodology, read straight from the table the engine scores by. */
export function Methodology({ onBack }: { onBack: () => void }) {
  const kit = useKit();
  const { t, num, label } = kit;
  const sub = t("ms_met_sub").replace("{a}", code("moliya-scoring-config.js → scoring")).replace("{b}", code("startupScoring"));
  return (
    <>
      <div className="ms-head">
        <div>
          <h2>{t("ms_met_title")}</h2>
          <p className="mk-sub" dangerouslySetInnerHTML={trustedHtml(sub)} />
        </div>
        <div className="mk-actions">
          <button type="button" className="btn btn-ghost" id="ms-back" onClick={onBack}>
            {t("ms_back_list")}
          </button>
        </div>
      </div>
      <h3 className="ms-met-title">{t("ms_met_company_path")}</h3>
      <BlockGrid blocks={[...qualitativeBlocks(kit), ...financialBlocks(kit)]} />
      <div className="ms-knockout">
        <div className="ms-knockout-head">{t("ms_met_ko_title")}</div>
        <div className="ms-knockout-body">
          <p dangerouslySetInnerHTML={trustedHtml(t("ms_met_ko_body").replace("{cap}", num(CONFIG.knockout.capScore, 0)))} />
          <ul>
            {CONFIG.knockout.rules.map(rule => (
              <li key={rule.id}>{label(rule)}</li>
            ))}
          </ul>
        </div>
      </div>
      <h3 className="ms-met-title">{t("ms_met_routing_title")}</h3>
      <div className="ms-tiers">
        {CONFIG.routing.thresholds.map(tier => (
          <div key={tier.status} className={`ms-tier ${tierClass(tier)}`}>
            <i />
            <span className="num">
              {tier.min}–{tier.max} {t("ms_met_tiers_label")}
            </span>
            <b>{label(tier)}</b>
          </div>
        ))}
      </div>
      <div className="ms-met-startup">
        <h3 className="ms-met-title">{t("ms_met_startup_title")}</h3>
        <p className="ms-banner is-startup" dangerouslySetInnerHTML={trustedHtml(t("ms_met_startup_body"))} />
        <BlockGrid blocks={startupBlocks(kit)} />
        <p className="mk-note" dangerouslySetInnerHTML={trustedHtml(t("ms_met_startup_footer"))} />
      </div>
    </>
  );
}
