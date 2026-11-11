import { CONFIG, REF, refItem, routingTierFor } from "../engine/engine";
import type { OpenTiers, RefItem, RoutingStatus, Scoring, Track } from "../engine/types";
import type { Kit } from "../kit";

/* The tiers are DERIVED from the methodology table, never copied by hand:
   change a weight there and the simulator follows. */
const S = CONFIG.scoring;
const SS = CONFIG.startupScoring;

interface SimOption {
  score: number;
  /** A dictionary key, a reference id, or neither when the label is a bare threshold. */
  labelKey?: string;
  refId?: string;
}

export interface SimCriterion {
  labelKey: string;
  options: readonly SimOption[];
  /** Threshold labels that read the same in every language. */
  raw?: readonly string[];
  ref?: readonly RefItem[];
}

export type SimPicks = Readonly<Record<string, number>>;

const tier = (labelKey: string, score: number): SimOption => ({ labelKey, score });
const bare = (...scores: number[]): SimOption[] => scores.map(score => ({ score }));

const SIM_COMPANY: Readonly<Record<string, SimCriterion>> = {
  teo: {
    labelKey: "ms_sim_teo",
    options: [
      tier("ms_tier_teo_big5", S.teo.big5),
      tier("ms_tier_teo_recognized", S.teo.recognized),
      tier("ms_teo_internal", S.teo.internal),
      tier("ms_none", S.teo.none),
    ],
  },
  audit: {
    labelKey: "ms_sim_audit",
    options: [
      tier("ms_tier_audit_b5", S.audit.threeYearCleanBig5),
      tier("ms_tier_audit_other", S.audit.threeYearCleanOther),
      tier("ms_tier_audit_12", S.audit.oneToTwoYear),
      tier("ms_tier_audit_signed", S.audit.contractSignedInProgress),
      tier("ms_none", S.audit.none),
    ],
  },
  continuity: {
    labelKey: "ms_sim_continuity",
    options: [
      tier("ms_tier_cont_33", S.continuity.threeYearsThreeProfitable),
      tier("ms_tier_cont_32", S.continuity.threeYearsTwoProfitable),
      tier("ms_tier_cont_1", S.continuity.oneYearProfitable),
      tier("ms_tier_cont_none", S.continuity.greenfield),
    ],
  },
  netProfit: {
    labelKey: "ms_sim_net_profit",
    options: [
      tier("ms_tier_np_3", S.netProfit.threeYears),
      tier("ms_tier_np_2", S.netProfit.twoYears),
      tier("ms_tier_np_1", S.netProfit.oneYear),
      tier("ms_none", S.netProfit.none),
    ],
  },
  dueDiligence: {
    labelKey: "ms_sim_dd",
    options: [
      tier("ms_tier_dd_all", S.dueDiligence.allSixBig5),
      tier("ms_tier_dd_35", S.dueDiligence.threeToFive),
      tier("ms_tier_dd_legal", S.dueDiligence.onlyConsultingLegal),
      tier("ms_tier_dd_planned", S.dueDiligence.plannedApproved),
      tier("ms_none", S.dueDiligence.none),
    ],
  },
  irr: {
    labelKey: "ms_sim_irr",
    options: [
      tier("ms_tier_irr_p8", S.irr.hurdlePlus8pp),
      tier("ms_tier_irr_p4", S.irr.hurdlePlus4pp),
      tier("ms_tier_irr_at", S.irr.atHurdle),
      tier("ms_tier_irr_below2", S.irr.belowUpTo2pp),
      tier("ms_tier_irr_below_more", S.irr.belowMore),
    ],
  },
  debtEbitda: {
    labelKey: "ms_sim_debt_ebitda",
    raw: ["≤ 1,5", "≤ 2,5", "≤ 3,0", "> 3,0"],
    options: bare(S.debtBurden.debtEbitda.le1_5, S.debtBurden.debtEbitda.le2_5, S.debtBurden.debtEbitda.le3_0, S.debtBurden.debtEbitda.above3_0),
  },
  dscr: {
    labelKey: "ms_sim_dscr",
    raw: ["≥ 1,8", "≥ 1,5", "≥ 1,2", "< 1,2"],
    options: bare(S.debtBurden.dscr.ge1_8, S.debtBurden.dscr.ge1_5, S.debtBurden.dscr.ge1_2, S.debtBurden.dscr.below1_2),
  },
  exit: {
    labelKey: "ms_sim_exit",
    options: [
      tier("ms_tier_exit_full", S.exit.fullContractFormulaTerm),
      tier("ms_tier_exit_general", S.exit.generalDescriptionNoFormula),
      tier("ms_tier_exit_intent", S.exit.intentOnly),
      tier("ms_none", S.exit.none),
    ],
  },
};

/* Which tier, by index, trips a knockout criterion. */
const SIM_KNOCKOUT: Readonly<Record<string, readonly number[] | undefined>> = {
  irr: [3, 4],
  debtEbitda: [3],
  dscr: [3],
  netProfit: [3],
  exit: [3],
};

const fromRef = (ref: readonly RefItem[], table: OpenTiers, labelKey: string): SimCriterion => ({
  labelKey,
  ref,
  options: ref.map(item => ({ refId: item.id, score: table[item.id] as number })),
});

const SIM_STARTUP: Readonly<Record<string, SimCriterion>> = {
  team: fromRef(REF.teamExperience, SS.team, "ms_sim_team"),
  product: fromRef(REF.productStage, SS.product, "ms_sim_product"),
  market: fromRef(REF.marketValidation, SS.market, "ms_sim_market"),
  funding: fromRef(REF.fundingHistory, SS.funding, "ms_sim_funding"),
  finModel: fromRef(REF.startupFinModelQuality, SS.finModel, "ms_sim_fin_model"),
  potential: fromRef(REF.potentialTiers, SS.potential, "ms_sim_potential"),
  legal: fromRef(REF.legalIpStatus, SS.legal, "ms_sim_legal"),
  exit: fromRef(REF.nextStageExit, SS.exit, "ms_sim_next_exit"),
};

export const simCriteria = (type: Track): Readonly<Record<string, SimCriterion>> =>
  type === "startup" ? SIM_STARTUP : SIM_COMPANY;

export function optionLabel(kit: Pick<Kit, "t" | "label">, criterion: SimCriterion, index: number): string {
  const option = criterion.options[index];
  if (criterion.raw) return criterion.raw[index];
  if (option.refId) return kit.label(refItem(criterion.ref, option.refId));
  return kit.t(option.labelKey as string);
}

export const maxScore = (criterion: SimCriterion): number => Math.max(...criterion.options.map(option => option.score));

export interface SimResult {
  raw: number;
  total: number;
  isKnockout: boolean;
  tier: RoutingStatus;
}

/** Adds up the picked tiers. It does not re-run the engine. */
export function simTotal(type: Track, picks: SimPicks): SimResult {
  const criteria = simCriteria(type);
  const keys = Object.keys(criteria);
  const raw = keys.reduce((sum, key) => sum + (criteria[key].options[picks[key]]?.score ?? 0), 0);
  const isKnockout = type !== "startup" && keys.some(key => (SIM_KNOCKOUT[key] ?? []).includes(picks[key]));
  const total = isKnockout ? Math.min(raw, CONFIG.knockout.capScore) : raw;
  return { raw, total, isKnockout, tier: routingTierFor(total) };
}

/** Where the simulator starts: the tier each block of the real score sits on. */
export function simPicksFrom(scoring: Scoring): Record<string, number> {
  const criteria = simCriteria(scoring.projectType);
  const blocks = scoring.breakdown;
  const earned = (key: string): number => {
    if (key === "debtEbitda") return blocks.debtBurden?.sub?.debtEbitda.score ?? 0;
    if (key === "dscr") return blocks.debtBurden?.sub?.dscr.score ?? 0;
    return blocks[key]?.score ?? 0;
  };
  return Object.fromEntries(
    Object.entries(criteria).map(([key, criterion]) => {
      const index = criterion.options.findIndex(option => option.score === earned(key));
      return [key, index < 0 ? criterion.options.length - 1 : index];
    }),
  );
}
