import { useEffect } from "react";
import type { ReactNode } from "react";
import { RoutingBadge, TypeBadge } from "../atoms/Badges";
import { KpiTiles } from "../atoms/KpiTiles";
import { CONFIG, REF, orderedBlocks } from "../engine/engine";
import type { Project, RefItem, Scoring } from "../engine/types";
import { useKit } from "../kit";
import type { Opened } from "./data";

const TEASER_INSTITUTIONS = 5;

/* While the teaser is open the sheet hides the hero: a promotional heading
   above a document is out of place, on screen as on paper. */
function usePrintingBody(): void {
  useEffect(() => {
    document.body.classList.add("ms-printing");
    return () => document.body.classList.remove("ms-printing");
  }, []);
}

function PassportTable({ project, isStartup }: { project: Project; isStartup: boolean }) {
  const { t, num, money, pctTxt, refName } = useKit();
  const { passport } = project;
  const teo = project.dueDiligence.teoTayyorlovchi;
  const teoLabel =
    teo.category === "big5" ? `${teo.name} (Big-5)`
    : teo.category === "recognized" ? teo.name
    : teo.category === "internal" ? t("ms_teo_internal")
    : t("ms_none");
  const row = (a: string, b: ReactNode, c: string, d: ReactNode) => (
    <tr>
      <td>{a}</td>
      <td>
        <b>{b}</b>
      </td>
      <td>{c}</td>
      <td>
        <b>{d}</b>
      </td>
    </tr>
  );
  return (
    <table className="ms-print-t">
      <tbody>
        {row(t("ms_tsr_total_value"), money(passport.umumiyQiymat, passport.valyuta), t("ms_tsr_term"), `${num(passport.muddat, 0)} ${t("ms_unit_years")}`)}
        {row(
          t("ms_tsr_requested"),
          money(passport.soralayotganSumma, passport.valyuta),
          t("ms_tsr_owner_share"),
          passport.tashabbuskorUlushi == null ? "—" : pctTxt(passport.tashabbuskorUlushi),
        )}
        {row(t("ms_tsr_fin_type"), refName(REF.financingTypes, passport.moliyalashtirishTuri), t("ms_tsr_teo"), isStartup ? "—" : teoLabel)}
      </tbody>
    </table>
  );
}

function ScoreTable({ scoring }: { scoring: Scoring }) {
  const { t, num } = useKit();
  return (
    <table className="ms-print-t ms-print-score-t">
      <tbody>
        {orderedBlocks(scoring).map(([key, block]) => (
          <tr key={key}>
            <td>{t(block.labelKey)}</td>
            <td>
              <span className="ms-print-bar-track">
                <i style={{ width: `${block.max ? Math.round((block.score / block.max) * 100) : 0}%` }} />
              </span>
            </td>
            <td className="num">
              <b>
                {num(block.score, 0)} / {num(block.max, 0)}
              </b>
            </td>
          </tr>
        ))}
        <tr className="ms-print-total">
          <td colSpan={2}>
            <b>{t("ms_tsr_total")}</b>
          </td>
          <td className="num">
            <b>{num(scoring.total, 0)} / 100</b>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** Startup criteria, or the due diligence areas of a company. */
function ProfileTable({ project, isStartup }: { project: Project; isStartup: boolean }) {
  const { t, label, refName } = useKit();
  const info = project.startupInfo;
  const criteria: readonly (readonly [string, readonly RefItem[], string])[] = [
    [t("ms_sc_label_team"), REF.teamExperience, info.jamoaTajribasi],
    [t("ms_sc_label_product"), REF.productStage, info.mahsulotBosqichi],
    [t("ms_sc_label_market"), REF.marketValidation, info.bozorValidatsiyasi],
    [t("ms_sc_label_funding"), REF.fundingHistory, info.moliyalashtirishTarixi],
    [t("ms_sc_label_legal"), REF.legalIpStatus, info.huquqiyIpHolati],
    [t("ms_sc_label_exit"), REF.nextStageExit, info.keyingiBosqichExit],
  ];
  return (
    <table className="ms-print-t">
      <tbody>
        {isStartup
          ? criteria.map(([name, options, chosen]) => (
              <tr key={name}>
                <td>{name}</td>
                <td colSpan={2}>
                  <b>{refName(options, chosen) || "—"}</b>
                </td>
              </tr>
            ))
          : REF.ddAreas.map(area => {
              const current = project.dueDiligence.ddYonalishlari[area.id] ?? { status: "none", performer: "" };
              return (
                <tr key={area.id}>
                  <td>{label(area)}</td>
                  <td>
                    <b>{refName(REF.ddStatusOptions, current.status) || t("ms_none")}</b>
                  </td>
                  <td>{current.performer || "—"}</td>
                </tr>
              );
            })}
      </tbody>
    </table>
  );
}

function Institutions({ opened }: { opened: Opened }) {
  const { t, label, refName } = useKit();
  const matches = opened.matches.filter(match => match.fullMatch).slice(0, TEASER_INSTITUTIONS);
  if (!matches.length) return <p className="mk-note">{t("ms_tsr_no_institutions")}</p>;
  return (
    <table className="ms-print-t">
      <tbody>
        {matches.map(({ inst }) => (
          <tr key={inst.id}>
            <td>
              <b>{label(inst.nomi)}</b>
            </td>
            <td>{refName(CONFIG.institutionTypes, inst.turi) || inst.turi}</td>
            <td>{inst.aloqa_email || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** The printable investment teaser of one scored project. */
export function Teaser({ opened, onBack }: { opened: Opened; onBack: () => void }) {
  usePrintingBody();
  const { t, num, day, label, sectorName, regionName } = useKit();
  const { project, scoring } = opened;
  const { passport } = project;
  const isStartup = scoring.projectType === "startup";
  return (
    <>
      <div className="ms-print-bar no-print">
        <button type="button" className="ms-link" id="ms-back" onClick={onBack}>
          {t("ms_tsr_back")}
        </button>
        <button type="button" className="btn btn-primary" id="ms-print-btn" onClick={() => window.print()}>
          {t("ms_tsr_print")}
        </button>
      </div>
      <article id="ms-print" className="ms-print">
        <header className="ms-print-head">
          <div>
            <span className="ms-print-eyebrow">{t("ms_tsr_label")}</span>
            <h1>{passport.nomi}</h1>
            <p>
              {sectorName(passport)} · {regionName(passport)} · {t("ms_f_tin").replace(" *", "")} {passport.stir}
            </p>
          </div>
          <div className="ms-print-score">
            <b className="num">
              {num(scoring.total, 0)}
              <i>/100</i>
            </b>
            <div>
              <RoutingBadge status={scoring.routingStatus} />
            </div>
            <div>
              <TypeBadge type={passport.loyihaTuri} />
            </div>
          </div>
        </header>
        <h3>{t("ms_tsr_passport")}</h3>
        <PassportTable project={project} isStartup={isStartup} />
        <h3>{isStartup ? t("ms_tsr_forecast_opt") : t("ms_res_kpi_title")}</h3>
        <KpiTiles passport={passport} kpis={scoring.kpis} />
        <h3>{isStartup ? t("ms_tsr_scoring_st") : t("ms_tsr_scoring")}</h3>
        <ScoreTable scoring={scoring} />
        {scoring.isKnockout && (
          <div className="ms-knockout">
            <div className="ms-knockout-head">{t("ms_tsr_ko_title")}</div>
            <div className="ms-knockout-body">
              <ul>
                {scoring.knockouts.map((rule, index) => (
                  <li key={rule?.id || index}>{label(rule)}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <h3>{isStartup ? t("ms_tsr_startup_profile") : t("ms_tsr_dd_status")}</h3>
        <ProfileTable project={project} isStartup={isStartup} />
        <h3>{t("ms_tsr_institutions")}</h3>
        <Institutions opened={opened} />
        <footer className="ms-print-foot">
          <span>{t("ms_tsr_footer")}</span>
          <span className="num">{t("ms_tsr_generated").replace("{d}", day(Date.now()))}</span>
        </footer>
      </article>
    </>
  );
}
