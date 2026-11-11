/** A reference entry: the stored value is always `id`, the label is per language. */
export interface RefItem {
  id: string;
  uz: string;
  ru: string;
  en: string;
}
export type LocalizedName = Pick<RefItem, "uz" | "ru" | "en">;

export type Track = "company" | "startup";

export interface RoutingStatus extends LocalizedName {
  status: string;
  color?: string;
  action?: string;
  min?: number;
  max?: number;
}

export interface Institution {
  id: string;
  seed?: boolean;
  nomi: LocalizedName;
  turi: string;
  min_summa: number;
  max_summa: number;
  valyutalar: readonly string[];
  sektorlar: readonly string[];
  max_muddat: number;
  min_ball: number;
  aloqa_email?: string;
}

type Tiers<K extends string> = Readonly<Record<K, number>>;
export type OpenTiers = Readonly<Record<string, number | undefined>>;

export interface MsConfig {
  meta: { version: string };
  references: {
    sectors: readonly RefItem[];
    regions: readonly RefItem[];
    currencies: readonly string[];
    financingTypes: readonly RefItem[];
    consultants: { big5: readonly string[]; recognized: readonly string[] };
    legalFirms: readonly RefItem[];
    auditOpinionTypes: readonly RefItem[];
    ddAreas: readonly RefItem[];
    ddStatusOptions: readonly RefItem[];
    exitTypes: readonly RefItem[];
    projectStatuses: readonly RefItem[];
    userRoles: readonly RefItem[];
    projectTypes: readonly RefItem[];
    teamExperience: readonly RefItem[];
    productStage: readonly RefItem[];
    marketValidation: readonly RefItem[];
    fundingHistory: readonly RefItem[];
    startupFinModelQuality: readonly RefItem[];
    potentialTiers: readonly RefItem[];
    legalIpStatus: readonly RefItem[];
    nextStageExit: readonly RefItem[];
  };
  macro: {
    cbRateUZS: number;
    hurdleForeignCcy: number;
    hurdleLocalSpreadPp: number;
    defaultDiscountRate: number;
    fxToUsd: Readonly<Record<string, number | undefined>>;
  };
  scoring: {
    weights: Tiers<"teo" | "audit" | "continuity" | "netProfit" | "dueDiligence" | "irr" | "debtBurden" | "exit">;
    teo: Tiers<"big5" | "recognized" | "internal" | "none">;
    audit: Tiers<"threeYearCleanBig5" | "threeYearCleanOther" | "oneToTwoYear" | "contractSignedInProgress" | "none">;
    continuity: Tiers<"threeYearsThreeProfitable" | "threeYearsTwoProfitable" | "oneYearProfitable" | "greenfield">;
    netProfit: Tiers<"threeYears" | "twoYears" | "oneYear" | "none">;
    dueDiligence: Tiers<"allSixBig5" | "threeToFive" | "onlyConsultingLegal" | "plannedApproved" | "none">;
    irr: Tiers<"hurdlePlus8pp" | "hurdlePlus4pp" | "atHurdle" | "belowUpTo2pp" | "belowMore">;
    debtBurden: {
      debtEbitda: Tiers<"le1_5" | "le2_5" | "le3_0" | "above3_0">;
      dscr: Tiers<"ge1_8" | "ge1_5" | "ge1_2" | "below1_2">;
    };
    exit: Tiers<"fullContractFormulaTerm" | "generalDescriptionNoFormula" | "intentOnly" | "none">;
  };
  startupScoring: {
    weights: Tiers<"team" | "product" | "market" | "funding" | "finModel" | "potential" | "legal" | "exit">;
    team: OpenTiers;
    product: OpenTiers;
    market: OpenTiers;
    funding: OpenTiers;
    finModel: OpenTiers;
    potential: OpenTiers;
    legal: OpenTiers;
    exit: OpenTiers;
  };
  knockout: { capScore: number; rules: readonly RefItem[] };
  routing: { thresholds: readonly RoutingStatus[]; unlockScore: number };
  institutionTypes: readonly RefItem[];
  institutions: readonly Institution[];
}

/* ---------- the project form ---------- */

export interface Passport {
  loyihaTuri: string;
  nomi: string;
  stir: string;
  sektor: string;
  hudud: string;
  umumiyQiymat: number | null;
  soralayotganSumma: number | null;
  valyuta: string;
  muddat: number;
  moliyalashtirishTuri: string;
  tashabbuskorUlushi: number | null;
  faoliyatYillari: number;
}

export interface StartupInfo {
  jamoaTajribasi: string;
  jamoaTavsifi: string;
  mahsulotBosqichi: string;
  mahsulotTavsifi: string;
  bozorValidatsiyasi: string;
  moliyalashtirishTarixi: string;
  moliyaviyModelSifati: string;
  daromadlilikSalohiyati: string;
  huquqiyIpHolati: string;
  keyingiBosqichExit: string;
}

export interface HistoryYear {
  yil: number;
  tushum: number | null;
  ebitda: number | null;
  sofFoyda: number | null;
  jamiQarz: number | null;
  jamiAktivlar: number | null;
  ozKapital: number | null;
}

export interface ModelYear {
  yil: number;
  fcf: number | null;
  cfads: number | null;
  principal: number | null;
  interest: number | null;
}

export interface FinancialModel {
  diskontStavkasi: number;
  mbStavkasi: number | null;
  yillar: ModelYear[];
}

export interface DdArea {
  status: string;
  performer: string;
}

export interface ExitPlan {
  turi: string;
  narxFormulasi: string;
  muddat: number | null;
  shartnomaLoyihasi: boolean;
  tavsif: string;
}

export interface AuditInfo {
  yillarSoni: number;
  auditor: string;
  xulosaTuri: string;
  contractSigned: boolean;
}

export interface DueDiligence {
  teoTayyorlovchi: { category: string; name: string };
  audit: AuditInfo;
  ddYonalishlari: Record<string, DdArea | undefined>;
  torTasdiqlangan: boolean;
  yuridikKompaniya: string;
  exit: ExitPlan;
}

export interface ProjectDocument {
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
}

export interface Project {
  id?: string;
  status: string;
  passport: Passport;
  startupInfo: StartupInfo;
  financialHistory: HistoryYear[];
  financialModel: FinancialModel;
  dueDiligence: DueDiligence;
  documents: ProjectDocument[];
  scoring: Scoring | null;
  updated?: number;
  submitted?: number;
  ownerName?: string;
}

/**
 * What the engine reads. Every section may be missing: the server scores
 * whatever was stored, and the engine has always tolerated a partial form.
 */
export interface ProjectInput {
  passport?: Partial<Passport>;
  startupInfo?: Partial<StartupInfo>;
  financialHistory?: readonly Partial<HistoryYear>[];
  financialModel?: {
    diskontStavkasi?: number | null;
    mbStavkasi?: number | null;
    yillar?: readonly Partial<ModelYear>[];
  };
  dueDiligence?: {
    teoTayyorlovchi?: { category?: string; name?: string };
    audit?: Partial<AuditInfo>;
    ddYonalishlari?: Record<string, Partial<DdArea> | undefined>;
    torTasdiqlangan?: boolean;
    exit?: Partial<ExitPlan>;
  };
}

/* ---------- the result ---------- */

export type ReasonParam = string | number | Partial<RefItem> | null | undefined;

/** A dictionary key plus its values; the sentence is built in the language of the reader. */
export interface Reason {
  key: string;
  params: Record<string, ReasonParam>;
}

export interface SubBlock {
  score: number;
  max: number;
  reason: Reason;
}

export interface ScoreBlock extends SubBlock {
  labelKey: string;
  /** Debt burden is one block made of two half-criteria, so it has two reasons. */
  reason2?: Reason;
  sub?: { debtEbitda: SubBlock; dscr: SubBlock };
}

export interface DscrRow {
  yil: number | undefined;
  cfads: number | null | undefined;
  principal: number | null | undefined;
  interest: number | null | undefined;
  debtService: number;
  dscr: number | null;
}

export interface Kpis {
  irr: number | null;
  npv: number | null;
  payback: number | null;
  debtEbitda: number | null;
  dscrMin: number | null;
  dscrAvg?: number | null;
  hurdle: number | null;
  dscrSeries?: DscrRow[];
}

export interface HistoryRow extends Partial<HistoryYear> {
  ros: number | null;
  roe: number | null;
  growth: number | null;
  rentabelmi: boolean;
}

export interface HistoryMetrics {
  rows: HistoryRow[];
  profitableYears: number;
  filledYears: number;
}

export interface Scoring {
  total: number;
  rawTotal: number;
  breakdown: Record<string, ScoreBlock | undefined>;
  knockouts: (RefItem | undefined)[];
  isKnockout: boolean;
  routingStatus: RoutingStatus;
  kpis: Kpis;
  hist: HistoryMetrics | null;
  projectType: Track;
}

export interface Suggestion {
  gap: number;
  key: string;
}

export type MatchChecks = Record<"summa" | "valyuta" | "sektor" | "muddat" | "ball", boolean>;

export interface InstitutionMatch {
  inst: Institution;
  checks: MatchChecks;
  matchPercent: number;
  fullMatch: boolean;
}
