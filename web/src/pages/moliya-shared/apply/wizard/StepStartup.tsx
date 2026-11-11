import { trustedHtml } from "../../../../shell/trustedHtml";
import { CONFIG, REF } from "../../engine/engine";
import type { Project } from "../../engine/types";
import { useKit } from "../../kit";
import { Documents } from "./Documents";
import { Field, SectionHead, Select, TextArea } from "./fields";
import { editStartup } from "./logic";
import { useRefOptions } from "./StepPassport";
import type { StepProps } from "./StepPassport";

const WEIGHTS = CONFIG.startupScoring.weights;

function useStartupForm({ project, onEdit }: StepProps) {
  const { t } = useKit();
  return {
    t,
    options: useRefOptions(),
    info: project.startupInfo,
    set: (change: Partial<Project["startupInfo"]>): void => onEdit(editStartup(change)),
    maxHint: (points: number): string => t("ms_hint_max_points").replace("{n}", String(points)),
    totalHint: (points: number): string => t("ms_hint_total_points").replace("{n}", String(points)),
  };
}

/** Step 2 of the startup track: quality criteria instead of financial history. */
export function StepStartupProfile(props: StepProps) {
  const { t, options, info, set, maxHint } = useStartupForm(props);
  return (
    <>
      <p className="ms-banner is-startup" dangerouslySetInnerHTML={trustedHtml(t("ms_sb_banner"))} />
      <div className="mk-form">
        <Field label={t("ms_f_team")} htmlFor="ms-si-jamoa" hint={maxHint(WEIGHTS.team)}>
          <Select id="ms-si-jamoa" value={info.jamoaTajribasi} options={options(REF.teamExperience)} onValue={jamoaTajribasi => set({ jamoaTajribasi })} />
        </Field>
        <Field label={t("ms_f_product_stage")} htmlFor="ms-si-mahsulot" hint={maxHint(WEIGHTS.product)}>
          <Select id="ms-si-mahsulot" value={info.mahsulotBosqichi} options={options(REF.productStage)} onValue={mahsulotBosqichi => set({ mahsulotBosqichi })} />
        </Field>
        <Field label={t("ms_f_market_valid")} htmlFor="ms-si-bozor" hint={maxHint(WEIGHTS.market)}>
          <Select id="ms-si-bozor" value={info.bozorValidatsiyasi} options={options(REF.marketValidation)} onValue={bozorValidatsiyasi => set({ bozorValidatsiyasi })} />
        </Field>
        <Field label={t("ms_f_funding_history")} htmlFor="ms-si-moliya" hint={maxHint(WEIGHTS.funding)}>
          <Select id="ms-si-moliya" value={info.moliyalashtirishTarixi} options={options(REF.fundingHistory)} onValue={moliyalashtirishTarixi => set({ moliyalashtirishTarixi })} />
        </Field>
        <Field label={t("ms_f_team_desc")} htmlFor="ms-si-jamoa-t" isWide>
          <TextArea id="ms-si-jamoa-t" value={info.jamoaTavsifi} onValue={jamoaTavsifi => set({ jamoaTavsifi })} />
        </Field>
        <Field label={t("ms_f_product_desc")} htmlFor="ms-si-mahsulot-t" isWide>
          <TextArea id="ms-si-mahsulot-t" value={info.mahsulotTavsifi} onValue={mahsulotTavsifi => set({ mahsulotTavsifi })} />
        </Field>
      </div>
    </>
  );
}

/** Step 4 of the startup track: model quality, legal standing and the way out. */
export function StepStartupLegal(props: StepProps) {
  const { t, options, info, set, maxHint, totalHint } = useStartupForm(props);
  return (
    <>
      <SectionHead title={t("ms_sd_model_title")} sub={totalHint(WEIGHTS.finModel + WEIGHTS.potential)} />
      <div className="mk-form">
        <Field label={t("ms_f_fin_model_q")} htmlFor="ms-si-finmodel" hint={maxHint(WEIGHTS.finModel)}>
          <Select id="ms-si-finmodel" value={info.moliyaviyModelSifati} options={options(REF.startupFinModelQuality)} onValue={moliyaviyModelSifati => set({ moliyaviyModelSifati })} />
        </Field>
        <Field label={t("ms_f_growth_potential")} htmlFor="ms-si-potential" hint={maxHint(WEIGHTS.potential)}>
          <Select id="ms-si-potential" value={info.daromadlilikSalohiyati} options={options(REF.potentialTiers)} onValue={daromadlilikSalohiyati => set({ daromadlilikSalohiyati })} />
        </Field>
      </div>
      <SectionHead title={t("ms_sd_legal_title")} sub={totalHint(WEIGHTS.legal + WEIGHTS.exit)} />
      <div className="mk-form">
        <Field label={t("ms_f_legal_ip")} htmlFor="ms-si-legal" hint={maxHint(WEIGHTS.legal)}>
          <Select id="ms-si-legal" value={info.huquqiyIpHolati} options={options(REF.legalIpStatus)} onValue={huquqiyIpHolati => set({ huquqiyIpHolati })} />
        </Field>
        <Field label={t("ms_f_next_exit")} htmlFor="ms-si-exit" hint={maxHint(WEIGHTS.exit)}>
          <Select id="ms-si-exit" value={info.keyingiBosqichExit} options={options(REF.nextStageExit)} onValue={keyingiBosqichExit => set({ keyingiBosqichExit })} />
        </Field>
      </div>
      <Documents {...props} hint={t("ms_doc_hint_startup")} />
    </>
  );
}
