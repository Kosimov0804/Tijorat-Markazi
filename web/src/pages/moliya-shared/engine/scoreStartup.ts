import { CONFIG, REF } from "./config";
import { buildFcfCashflows, calcIRR, calcNPV, calcPayback } from "./finance";
import { reasonOf, refItem, routingTierFor } from "./refs";
import type { OpenTiers, ProjectInput, RefItem, ScoreBlock, Scoring } from "./types";

const S = CONFIG.startupScoring;

interface Criterion {
  labelKey: string;
  valueLabelKey: string;
  table: OpenTiers;
  chosen: string | undefined;
  max: number;
  options: readonly RefItem[];
}

/* The chosen level decides the points; an unknown level scores nothing. */
function scoreCriterion({ labelKey, valueLabelKey, table, chosen, max, options }: Criterion): ScoreBlock {
  const level = chosen || "none";
  const item = refItem(options, level);
  return {
    labelKey,
    score: table[level] === undefined ? 0 : table[level],
    max,
    reason: reasonOf("ms_sc_startup_reason", { label: valueLabelKey, valueRef: item ? item.id : "", value: item }),
  };
}

function criteria(info: NonNullable<ProjectInput["startupInfo"]>): Record<string, Criterion> {
  const W = S.weights;
  const one = (
    labelKey: string,
    valueLabelKey: string,
    table: OpenTiers,
    chosen: string | undefined,
    max: number,
    options: readonly RefItem[],
  ): Criterion => ({ labelKey, valueLabelKey, table, chosen, max, options });
  return {
    team: one("ms_block_team", "ms_sc_label_team", S.team, info.jamoaTajribasi, W.team, REF.teamExperience),
    product: one("ms_block_product", "ms_sc_label_product", S.product, info.mahsulotBosqichi, W.product, REF.productStage),
    market: one("ms_block_market", "ms_sc_label_market", S.market, info.bozorValidatsiyasi, W.market, REF.marketValidation),
    funding: one("ms_block_funding", "ms_sc_label_funding", S.funding, info.moliyalashtirishTarixi, W.funding, REF.fundingHistory),
    finModel: one("ms_block_fin_model", "ms_sc_label_fin_model", S.finModel, info.moliyaviyModelSifati, W.finModel, REF.startupFinModelQuality),
    potential: one("ms_block_potential", "ms_sc_label_potential", S.potential, info.daromadlilikSalohiyati, W.potential, REF.potentialTiers),
    legal: one("ms_block_legal", "ms_sc_label_legal", S.legal, info.huquqiyIpHolati, W.legal, REF.legalIpStatus),
    exit: one("ms_block_next_exit", "ms_sc_label_exit", S.exit, info.keyingiBosqichExit, W.exit, REF.nextStageExit),
  };
}

/**
 * The startup methodology. There is NO knockout here: only the chosen level
 * of eight quality criteria counts, and a financial model, when filled in,
 * is shown for information without touching the score.
 */
export function scoreStartupProject(project: ProjectInput): Scoring {
  const breakdown: Record<string, ScoreBlock> = Object.fromEntries(
    Object.entries(criteria(project.startupInfo ?? {})).map(([key, criterion]) => [key, scoreCriterion(criterion)]),
  );
  const total = Object.values(breakdown).reduce((sum, block) => sum + block.score, 0);

  const model = project.financialModel ?? {};
  const cashflows = buildFcfCashflows(project);
  const hasModel = (model.yillar ?? []).some(year => year.fcf !== null && year.fcf !== undefined);

  return {
    total,
    rawTotal: total,
    breakdown,
    knockouts: [],
    isKnockout: false,
    routingStatus: routingTierFor(total),
    kpis: {
      irr: hasModel ? calcIRR(cashflows) : null,
      npv: hasModel ? calcNPV(cashflows, model.diskontStavkasi) : null,
      payback: hasModel ? calcPayback(cashflows) : null,
      debtEbitda: null,
      dscrMin: null,
      dscrAvg: null,
      hurdle: null,
      dscrSeries: [],
    },
    hist: null,
    projectType: "startup",
  };
}
