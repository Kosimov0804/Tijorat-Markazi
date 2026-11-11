import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import * as port from "./engine";
import type { Project, ProjectInput } from "./types";

/* The legacy engine, run untouched in its own context, is the oracle: every
   case below must come out of the port exactly as it comes out of that file. */
const ROOT = path.resolve(__dirname, "../../../../..");

function loadLegacy(file: string, required?: unknown): unknown {
  const sandbox = { module: { exports: {} as unknown }, require: () => required };
  vm.runInNewContext(readFileSync(path.join(ROOT, file), "utf8"), sandbox);
  return sandbox.module.exports;
}

type Engine = typeof port;
const legacyConfig = loadLegacy("moliya-scoring-config.js");
const legacy = loadLegacy("moliya-scoring-core.js", legacyConfig) as Engine;

/* Through JSON on both sides: the vm objects belong to another realm, and
   JSON is also how a score travels between server and page. */
const plain = (value: unknown): unknown => JSON.parse(JSON.stringify(value ?? null));

const BIG5 = "KPMG";
const allAreas = (status: string, performer: string) =>
  Object.fromEntries(port.REF.ddAreas.map(area => [area.id, { status, performer }]));

function company(change: (project: Project) => void): Project {
  const project = port.blankProject();
  project.passport = { ...project.passport, nomi: "Alfa", stir: "123", soralayotganSumma: 1_000_000, valyuta: "USD", faoliyatYillari: 6 };
  project.financialHistory = [
    { yil: 3, tushum: 900, ebitda: 300, sofFoyda: 90, jamiQarz: 400, jamiAktivlar: 2000, ozKapital: 800 },
    { yil: 2, tushum: 1100, ebitda: 380, sofFoyda: 120, jamiQarz: 450, jamiAktivlar: 2200, ozKapital: 900 },
    { yil: 1, tushum: 1300, ebitda: 420, sofFoyda: 160, jamiQarz: 500, jamiAktivlar: 2500, ozKapital: 1000 },
  ];
  project.financialModel = {
    diskontStavkasi: 16,
    mbStavkasi: 14,
    yillar: [1, 2, 3, 4, 5].map(yil => ({ yil, fcf: 380_000, cfads: 400_000, principal: 150_000, interest: 50_000 })),
  };
  project.dueDiligence = {
    ...project.dueDiligence,
    teoTayyorlovchi: { category: "big5", name: BIG5 },
    audit: { yillarSoni: 3, auditor: BIG5, xulosaTuri: "toza", contractSigned: true },
    ddYonalishlari: allAreas("done", BIG5),
    torTasdiqlangan: true,
    exit: { turi: "buyback", narxFormulasi: "EBITDA x 5", muddat: 5, shartnomaLoyihasi: true, tavsif: "" },
  };
  change(project);
  return project;
}

function startup(info: Partial<Project["startupInfo"]>, change: (project: Project) => void = () => undefined): Project {
  const project = port.blankProject();
  project.passport = { ...project.passport, loyihaTuri: "startup", soralayotganSumma: 200_000, valyuta: "USD" };
  project.startupInfo = { ...project.startupInfo, ...info };
  change(project);
  return project;
}

const PROJECTS: Record<string, ProjectInput> = {
  "a blank form": port.blankProject(),
  "a strong company": company(() => undefined),
  "a company in UZS against the central bank hurdle": company(p => {
    p.passport.valyuta = "UZS";
    p.financialModel.mbStavkasi = 13.5;
  }),
  "a company in UZS with no stored central bank rate": company(p => {
    p.passport.valyuta = "UZS";
    p.financialModel.mbStavkasi = null;
  }),
  "a company whose IRR sits just under the hurdle": company(p => {
    p.financialModel.yillar = p.financialModel.yillar.map(year => ({ ...year, fcf: 255_000 }));
  }),
  "a company with heavy debt and thin cover": company(p => {
    p.financialHistory[2] = { ...p.financialHistory[2], jamiQarz: 1500 };
    p.financialModel.yillar = p.financialModel.yillar.map(year => ({ ...year, cfads: 210_000 }));
  }),
  "a company with two profitable years and a recognised consultant": company(p => {
    p.financialHistory[0] = { ...p.financialHistory[0], sofFoyda: -40 };
    p.dueDiligence.teoTayyorlovchi = { category: "recognized", name: "Kreston" };
    p.dueDiligence.audit = { yillarSoni: 3, auditor: "Kreston", xulosaTuri: "toza", contractSigned: false };
    p.dueDiligence.ddYonalishlari = { ...allAreas("planned", ""), legal: { status: "done", performer: "Costa Legal" } };
    p.dueDiligence.exit = { turi: "ipo", narxFormulasi: "", muddat: 7, shartnomaLoyihasi: false, tavsif: "" };
  }),
  "a loss-making company with only an intent to exit": company(p => {
    p.financialHistory = p.financialHistory.map(year => ({ ...year, sofFoyda: -1 }));
    p.dueDiligence.teoTayyorlovchi = { category: "internal", name: "" };
    p.dueDiligence.audit = { yillarSoni: 0, auditor: "", xulosaTuri: "", contractSigned: true };
    p.dueDiligence.ddYonalishlari = allAreas("planned", "");
    p.dueDiligence.exit = { turi: "trade_sale", narxFormulasi: "", muddat: null, shartnomaLoyihasi: false, tavsif: "" };
  }),
  "a company with one audited year and four areas done": company(p => {
    p.dueDiligence.audit = { yillarSoni: 1, auditor: "Local", xulosaTuri: "shartli", contractSigned: false };
    p.dueDiligence.ddYonalishlari = { ...allAreas("done", "Local"), tax: { status: "none", performer: "" }, legal: undefined };
    p.dueDiligence.exit = { turi: "refinance", narxFormulasi: "x", muddat: null, shartnomaLoyihasi: false, tavsif: "" };
  }),
  "a company with no cash flow at all": company(p => {
    p.financialModel.yillar = [];
  }),
  "a company with every section missing": { passport: { valyuta: "EUR" } },
  "an idea-stage startup": startup({}),
  "a top startup": startup({
    jamoaTajribasi: "full",
    mahsulotBosqichi: "launched",
    bozorValidatsiyasi: "validated",
    moliyalashtirishTarixi: "successful_round",
    moliyaviyModelSifati: "reviewed",
    daromadlilikSalohiyati: "high",
    huquqiyIpHolati: "registered_ip_protected",
    keyingiBosqichExit: "clear_plan",
  }),
  "a mid startup with a forecast and an unknown level": startup(
    { jamoaTajribasi: "partial", mahsulotBosqichi: "mvp", bozorValidatsiyasi: "no-such-level", moliyaviyModelSifati: "internal" },
    p => {
      p.financialModel.yillar = [1, 2, 3].map(yil => ({ yil, fcf: 120_000, cfads: null, principal: null, interest: null }));
    },
  ),
};

const CASHFLOWS: readonly (readonly number[])[] = [
  [-1000, 300, 400, 500, 600],
  [-1000, 100, 100, 100],
  [-100, 0, 0, 0, 0, 0, 500],
  [0, 0, 0],
  [100, 200, 300],
  [-500],
  [-1000, 3000, -2500],
  [-1, 1e9],
  [-1000, 0, 0, 0],
  [500, -200, -200, -200],
];

describe("the scoring engine port", () => {
  it.each(Object.entries(PROJECTS))("scores %s exactly as the legacy engine does", (_name, project) => {
    const expected = legacy.scoreProject(project);
    const actual = port.scoreProject(project);

    expect(plain(actual)).toEqual(plain(expected));
    expect(plain(port.nextTierSuggestions(actual))).toEqual(plain(legacy.nextTierSuggestions(expected)));
    expect(plain(port.matchInstitutions(project, actual))).toEqual(plain(legacy.matchInstitutions(project, expected)));
    expect(port.routingUnlocked(actual)).toBe(legacy.routingUnlocked(expected));
    expect(port.orderedBlocks(actual).map(([key]) => key)).toEqual(plain(legacy.orderedBlocks(expected).map(([key]) => key)));
  });

  it("pins the headline numbers of the reference cases", () => {
    const totals = Object.fromEntries(
      Object.entries(PROJECTS).map(([name, project]) => {
        const scoring = port.scoreProject(project);
        return [name, [scoring.total, scoring.rawTotal, scoring.routingStatus.status]];
      }),
    );

    expect(totals["a strong company"]).toEqual([100, 100, "tayyor"]);
    expect(totals["a blank form"]).toEqual([0, 0, "knockout"]);
    expect(totals["a top startup"]).toEqual([100, 100, "tayyor"]);
    expect(totals["an idea-stage startup"]).toEqual([0, 0, "rad_etilgan"]);
    expect(totals["a company with heavy debt and thin cover"][2]).toBe("knockout");
    expect(totals["a company with heavy debt and thin cover"][0]).toBeLessThanOrEqual(59);
  });

  it.each(CASHFLOWS)("computes IRR, NPV and payback of [%s, %s, …] as the legacy engine does", (...flows) => {
    expect(port.calcIRR(flows)).toBe(legacy.calcIRR(flows));
    expect(port.calcNPV(flows, 16)).toBe(legacy.calcNPV(flows, 16));
    expect(port.calcNPV(flows, 0)).toBe(legacy.calcNPV(flows, 0));
    expect(port.calcPayback(flows)).toBe(legacy.calcPayback(flows));
  });

  it("returns no IRR for a flow that never changes sign", () => {
    expect(port.calcIRR([0, 0, 0])).toBeNull();
    expect(port.calcIRR([100, 200])).toBeNull();
    expect(port.calcIRR(null)).toBeNull();
  });

  it("derives history, cover and debt ratios as the legacy engine does", () => {
    const project = PROJECTS["a company with two profitable years and a recognised consultant"];
    const sparse = [{ yil: 3 }, { yil: 2, tushum: 0, sofFoyda: 5 }, { yil: 1, tushum: 10, ebitda: 0, jamiQarz: 4 }];

    expect(plain(port.calcHistoryMetrics(project.financialHistory))).toEqual(plain(legacy.calcHistoryMetrics(project.financialHistory)));
    expect(plain(port.calcHistoryMetrics(sparse))).toEqual(plain(legacy.calcHistoryMetrics(sparse)));
    expect(plain(port.calcHistoryMetrics(null))).toEqual(plain(legacy.calcHistoryMetrics(null)));
    expect(plain(port.calcDSCRSeries(project.financialModel))).toEqual(plain(legacy.calcDSCRSeries(project.financialModel)));
    expect(port.calcDebtEbitda(project.financialHistory)).toBe(legacy.calcDebtEbitda(project.financialHistory));
    expect(port.calcDebtEbitda(sparse)).toBe(legacy.calcDebtEbitda(sparse));
    expect(port.buildFcfCashflows(project)).toEqual(plain(legacy.buildFcfCashflows(project)));
  });

  it("converts to USD and matches against a live registry as the legacy engine does", () => {
    const project = PROJECTS["a strong company"];
    const scoring = port.scoreProject(project);
    const registry = [
      { id: "x", nomi: { uz: "X", ru: "X", en: "X" }, turi: "bank", min_summa: 1, max_summa: 5e6, valyutalar: ["USD"], sektorlar: [], max_muddat: 3, min_ball: 50 },
    ];

    expect(plain(port.matchInstitutions(project, scoring, registry))).toEqual(plain(legacy.matchInstitutions(project, scoring, registry)));
    for (const currency of ["UZS", "USD", "EUR", "GBP", undefined]) {
      expect(port.toUsdEquivalent(12_800_000, currency)).toBe(legacy.toUsdEquivalent(12_800_000, currency));
    }
    expect(port.toUsdEquivalent(null, "USD")).toBe(0);
  });

  it("keeps the blank form, the block order and the knockout status identical", () => {
    expect(plain(port.blankProject())).toEqual(plain(legacy.blankProject()));
    expect(plain(port.BLOCK_ORDER)).toEqual(plain(legacy.BLOCK_ORDER));
    expect(plain(port.KNOCKOUT_STATUS)).toEqual(plain(legacy.KNOCKOUT_STATUS));
    expect(plain(port.CONFIG)).toEqual(plain(legacyConfig));
  });

  it("finds a routing tier for every whole score and labels in the asked language", () => {
    for (let score = 0; score <= 100; score++) {
      expect(plain(port.routingTierFor(score))).toEqual(plain(legacy.routingTierFor(score)));
    }
    const sector = port.refItem(port.REF.sectors, "it");

    expect(port.labelOf(sector, "en")).toBe("Information technology");
    expect(port.labelOf("plain", "ru")).toBe("plain");
    expect(port.labelOf(null, "uz")).toBe("");
    expect(port.refItem(port.REF.sectors, "nope")).toBeNull();
  });
});
