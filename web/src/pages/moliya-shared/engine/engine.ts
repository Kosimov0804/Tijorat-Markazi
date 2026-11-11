import { CONFIG, REF } from "./config";
import { scoreCompanyProject } from "./scoreCompany";
import { scoreStartupProject } from "./scoreStartup";
import type {
  Institution,
  InstitutionMatch,
  MatchChecks,
  Project,
  ProjectInput,
  ScoreBlock,
  Scoring,
  SubBlock,
  Suggestion,
} from "./types";

/** The entry point: the project type picks the methodology. */
export function scoreProject(project: ProjectInput | null | undefined): Scoring {
  if (project?.passport?.loyihaTuri === "startup") return scoreStartupProject(project);
  return scoreCompanyProject(project as ProjectInput);
}

/* The order blocks are SHOWN in. Object keys cannot be trusted for it: the
   score is stored in a JSONB column and Postgres hands keys back reordered. */
export const BLOCK_ORDER: Readonly<Record<"company" | "startup", readonly string[]>> = {
  company: ["teo", "audit", "continuity", "netProfit", "dueDiligence", "irr", "debtBurden", "exit"],
  startup: ["team", "product", "market", "funding", "finModel", "potential", "legal", "exit"],
};

type BlockSource = Pick<Scoring, "projectType"> & { breakdown?: Scoring["breakdown"] };

/** [key, block] pairs in the methodology order; unlisted blocks follow. */
export function orderedBlocks(scoring: BlockSource): [string, ScoreBlock][] {
  const order = BLOCK_ORDER[scoring.projectType === "startup" ? "startup" : "company"];
  const blocks = scoring.breakdown ?? {};
  const keys = [...order.filter(key => blocks[key]), ...Object.keys(blocks).filter(key => !order.includes(key))];
  return keys.flatMap((key): [string, ScoreBlock][] => {
    const block = blocks[key];
    return block ? [[key, block]] : [];
  });
}

const COMPANY_GAP_KEYS: readonly (readonly [string, string])[] = [
  ["teo", "ms_sg_teo"],
  ["audit", "ms_sg_audit"],
  ["continuity", "ms_sg_continuity"],
  ["netProfit", "ms_sg_net_profit"],
  ["dueDiligence", "ms_sg_dd"],
  ["irr", "ms_sg_irr"],
  ["exit", "ms_sg_exit"],
];
const STARTUP_GAP_KEYS: readonly (readonly [string, string])[] = [
  ["team", "ms_sg_s_team"],
  ["product", "ms_sg_s_product"],
  ["market", "ms_sg_s_market"],
  ["funding", "ms_sg_s_funding"],
  ["finModel", "ms_sg_s_fin_model"],
  ["potential", "ms_sg_s_potential"],
  ["legal", "ms_sg_s_legal"],
  ["exit", "ms_sg_s_exit"],
];

/** One "reach the next tier" tip per block that is not full, biggest gain first. */
export function nextTierSuggestions(scoring: Pick<Scoring, "breakdown" | "projectType">): Suggestion[] {
  const blocks = scoring.breakdown;
  const list: Suggestion[] = [];
  const add = (block: SubBlock | undefined, key: string): void => {
    if (block && block.score < block.max) list.push({ gap: block.max - block.score, key });
  };
  if (scoring.projectType === "startup") {
    STARTUP_GAP_KEYS.forEach(([block, key]) => add(blocks[block], key));
  } else {
    COMPANY_GAP_KEYS.forEach(([block, key]) => add(blocks[block], key));
    /* Debt burden is one block of two half-criteria, so its tips are separate. */
    const halves = blocks.debtBurden?.sub;
    if (halves) {
      add(halves.debtEbitda, "ms_sg_debt_ebitda");
      add(halves.dscr, "ms_sg_dscr");
    }
  }
  return list.sort((a, z) => z.gap - a.gap);
}

export function toUsdEquivalent(amount: number | null | undefined, currency: string | undefined): number {
  const rate = CONFIG.macro.fxToUsd[currency as string] || 1;
  return (amount || 0) * rate;
}

/**
 * Checks the project against every institution on five criteria. Without a
 * registry the seed list is used; the server passes the live one.
 */
export function matchInstitutions(
  project: ProjectInput,
  scoring: Pick<Scoring, "total" | "isKnockout">,
  registry?: readonly Institution[] | null,
): InstitutionMatch[] {
  const passport = project.passport ?? {};
  const list = registry && registry.length ? registry : CONFIG.institutions;
  const amountUsd = toUsdEquivalent(passport.soralayotganSumma, passport.valyuta);

  return list
    .map(inst => {
      const checks: MatchChecks = {
        summa: amountUsd >= inst.min_summa && amountUsd <= inst.max_summa,
        valyuta: (inst.valyutalar || []).indexOf(passport.valyuta as string) !== -1,
        sektor: !(inst.sektorlar || []).length || inst.sektorlar.indexOf(passport.sektor as string) !== -1,
        muddat: (passport.muddat || 0) <= inst.max_muddat,
        ball: scoring.total >= inst.min_ball,
      };
      const passed = Object.values(checks).filter(Boolean).length;
      return {
        inst,
        checks,
        matchPercent: Math.round((passed / 5) * 100),
        fullMatch: passed === 5 && !scoring.isKnockout,
      };
    })
    .sort((a, z) => z.matchPercent - a.matchPercent);
}

/** Routing opens at 75 points with no knockout. */
export function routingUnlocked(scoring: Pick<Scoring, "total" | "isKnockout">): boolean {
  return !scoring.isKnockout && scoring.total >= CONFIG.routing.unlockScore;
}

/** The empty form: the wizard and the server validation expect exactly these fields. */
export function blankProject(): Project {
  return {
    status: "draft",
    passport: {
      loyihaTuri: "company",
      nomi: "",
      stir: "",
      sektor: REF.sectors[0].id,
      hudud: REF.regions[0].id,
      umumiyQiymat: null,
      soralayotganSumma: null,
      valyuta: "UZS",
      muddat: 5,
      moliyalashtirishTuri: "kredit",
      tashabbuskorUlushi: null,
      faoliyatYillari: 0,
    },
    startupInfo: {
      jamoaTajribasi: "none",
      jamoaTavsifi: "",
      mahsulotBosqichi: "idea",
      mahsulotTavsifi: "",
      bozorValidatsiyasi: "none",
      moliyalashtirishTarixi: "none",
      moliyaviyModelSifati: "none",
      daromadlilikSalohiyati: "unclear",
      huquqiyIpHolati: "none",
      keyingiBosqichExit: "none",
    },
    financialHistory: [3, 2, 1].map(yil => ({
      yil,
      tushum: null,
      ebitda: null,
      sofFoyda: null,
      jamiQarz: null,
      jamiAktivlar: null,
      ozKapital: null,
    })),
    financialModel: {
      diskontStavkasi: CONFIG.macro.defaultDiscountRate,
      mbStavkasi: CONFIG.macro.cbRateUZS,
      yillar: [1, 2, 3].map(yil => ({ yil, fcf: null, cfads: null, principal: null, interest: null })),
    },
    dueDiligence: {
      teoTayyorlovchi: { category: "none", name: "" },
      audit: { yillarSoni: 0, auditor: "", xulosaTuri: "", contractSigned: false },
      ddYonalishlari: Object.fromEntries(REF.ddAreas.map(area => [area.id, { status: "none", performer: "" }])),
      torTasdiqlangan: false,
      yuridikKompaniya: "",
      exit: { turi: "", narxFormulasi: "", muddat: null, shartnomaLoyihasi: false, tavsif: "" },
    },
    documents: [],
    scoring: null,
  };
}

export { scoreCompanyProject, scoreStartupProject };
export * from "./finance";
export { KNOCKOUT_STATUS, labelOf, refItem, routingTierFor } from "./refs";
export { CONFIG, REF } from "./config";
