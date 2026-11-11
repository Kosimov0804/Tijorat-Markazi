import type { ReactNode } from "react";
import { StatusBadge, TypeBadge } from "../moliya-shared/atoms/Badges";
import { BlockCard, KnockoutPanel } from "../moliya-shared/atoms/BlockCard";
import { Gauge } from "../moliya-shared/atoms/Gauge";
import { KpiTiles } from "../moliya-shared/atoms/KpiTiles";
import { REF, orderedBlocks } from "../moliya-shared/engine/engine";
import { useKit } from "../moliya-shared/kit";
import type { Dossier } from "./data";

/** The passport as far as it is shown: a dossier is for READING only. */
function PassportCard({ dossier }: { dossier: Dossier }) {
  const { t, num, money, pctTxt, refName, sectorName, regionName } = useKit();
  const { project } = dossier;
  const { passport } = project;
  /* The wizard labels carry a required mark; nothing is filled in here. */
  const pair = (label: string, value: ReactNode) => (
    <>
      <dt>{label.replace(" *", "")}</dt>
      <dd>{value}</dd>
    </>
  );
  return (
    <div className="mk-card">
      <div className="ms-sec">
        <h3>{t("msi_passport")}</h3>
      </div>
      <dl className="mk-kv">
        {pair(t("ms_f_sector"), sectorName(passport))}
        {pair(t("ms_f_region"), regionName(passport))}
        {pair(t("ms_f_total_value"), money(passport.umumiyQiymat, passport.valyuta))}
        {pair(t("ms_f_amount"), money(passport.soralayotganSumma, passport.valyuta))}
        {pair(t("ms_f_term"), `${num(passport.muddat, 0)} ${t("ms_unit_years")}`)}
        {pair(t("ms_f_fin_type"), refName(REF.financingTypes, passport.moliyalashtirishTuri))}
        {pair(t("ms_f_owner_share"), passport.tashabbuskorUlushi == null ? "—" : pctTxt(passport.tashabbuskorUlushi))}
        {pair(t("msi_owner"), project.ownerName || "—")}
      </dl>
      <div className="ms-sec msi-sub-sec">
        <h3>{t("msi_docs")}</h3>
      </div>
      {project.documents.length ? (
        <ul className="msi-docs">
          {project.documents.map((file, index) => (
            <li key={index}>
              <span>{file.name || "—"}</span>
              <i className="num">{num((file.size || 0) / 1024, 0)} KB</i>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mk-note">{t("msi_docs_none")}</p>
      )}
      {/* A missing model must not read as "did it fail to load?": say it is absent. */}
      {!dossier.hasDetail && <p className="mk-note">{t("msi_detail_missing")}</p>}
    </div>
  );
}

type DossierViewProps = {
  dossier: Dossier;
  isInstitution: boolean;
  /** The interest panel for an institution, the status panel for an expert. */
  panel: ReactNode;
  onBack: () => void;
};

/** One project as the institution receives it. The atoms are the owner's own, so both read one score. */
export function DossierView({ dossier, isInstitution, panel, onBack }: DossierViewProps) {
  const { t, num, money, day, sectorName, regionName } = useKit();
  const { project } = dossier;
  const { passport, scoring } = project;
  const isStartup = passport.loyihaTuri === "startup";
  const notScored = <p className="mk-note">{t("ms_not_scored")}</p>;
  return (
    <>
      <div className="ms-head">
        <div>
          <div className="ms-title-row">
            <h2>{passport.nomi || t("ms_unnamed")}</h2>
            <TypeBadge type={passport.loyihaTuri} />
            <StatusBadge status={project.status} />
          </div>
          <p className="mk-sub">
            {sectorName(passport)} · {regionName(passport)} · <b className="num">{money(passport.soralayotganSumma, passport.valyuta)}</b> ·{" "}
            {t("msi_submitted_on").replace("{d}", day(project.submitted))}
          </p>
        </div>
        <div className="mk-actions">
          <button type="button" className="btn btn-ghost" id="msi-back" onClick={onBack}>
            {t("msi_back")}
          </button>
        </div>
      </div>
      {isInstitution && dossier.matchedProducts != null && (
        <p className="mk-note msi-why">
          {t("msi_matched_title")} — {t("msi_matched_sub").replace("{n}", num(dossier.matchedProducts, 0))}
        </p>
      )}
      {scoring && <KnockoutPanel scoring={scoring} />}
      <div className="ms-split">
        <div className="mk-card ms-score">{scoring ? <Gauge total={scoring.total} status={scoring.routingStatus} /> : notScored}</div>
        <div className="mk-card">
          {scoring ? (
            <>
              <h3>{isStartup ? t("ms_res_forecast") : t("ms_res_kpi_title")}</h3>
              <KpiTiles passport={passport} kpis={scoring.kpis} />
            </>
          ) : (
            notScored
          )}
        </div>
      </div>
      {scoring && (
        <div className="mk-card">
          <div className="ms-sec">
            <h3>{scoring.projectType === "startup" ? t("ms_res_breakdown_st") : t("ms_res_breakdown")}</h3>
            <p>{t("ms_res_breakdown_sub")}</p>
          </div>
          <div className="ms-blocks">
            {orderedBlocks(scoring).map(([key, block]) => (
              <BlockCard key={key} block={block} />
            ))}
          </div>
        </div>
      )}
      <div className="ms-split msi-split">
        <PassportCard dossier={dossier} />
        {panel}
      </div>
    </>
  );
}
