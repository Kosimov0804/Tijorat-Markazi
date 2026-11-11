import { REF } from "../../engine/engine";
import type { Project, RefItem, Track } from "../../engine/types";
import { useKit } from "../../kit";
import { Field, NumberInput, Select, TextInput } from "./fields";
import type { Option } from "./fields";
import { editPassport } from "./logic";
import type { Edit } from "./logic";

export type StepProps = { project: Project; onEdit: (edit: Edit) => void };

export function useRefOptions(): (items: readonly RefItem[]) => Option[] {
  const { label } = useKit();
  return items => items.map(item => ({ value: item.id, label: label(item) }));
}

/* The page serves one track, so the wizard offers no choice between the two:
   it says which methodology is at work and where the other one lives. */
function TrackNote({ track }: { track: Track }) {
  const { t, refName } = useKit();
  const other = track === "startup" ? "company" : "startup";
  return (
    <p className="mk-note">
      <b>{t("ms_track_fixed").replace("{name}", refName(REF.projectTypes, track))}</b>{" "}
      <a className="ms-link" href={other === "startup" ? "moliya-startup.html" : "moliya-korxona.html"}>
        {t(`ms_track_switch_${other}`)}
      </a>
    </p>
  );
}

export function StepPassport({ project, onEdit, track }: StepProps & { track: Track }) {
  const { t } = useKit();
  const options = useRefOptions();
  const passport = project.passport;
  const set = (change: Partial<Project["passport"]>): void => onEdit(editPassport(change));
  const currencies = REF.currencies.map(code => ({ value: code, label: code }));

  return (
    <>
      <TrackNote track={track} />
      <div className="mk-form">
        <Field label={t("ms_f_name")} htmlFor="ms-f-nomi">
          <TextInput id="ms-f-nomi" value={passport.nomi} onValue={nomi => set({ nomi })} />
        </Field>
        <Field label={t("ms_f_tin")} htmlFor="ms-f-stir">
          <TextInput id="ms-f-stir" value={passport.stir} onValue={stir => set({ stir })} />
        </Field>
        <Field label={t("ms_f_sector")} htmlFor="ms-f-sektor">
          <Select id="ms-f-sektor" value={passport.sektor} options={options(REF.sectors)} onValue={sektor => set({ sektor })} />
        </Field>
        <Field label={t("ms_f_region")} htmlFor="ms-f-hudud">
          <Select id="ms-f-hudud" value={passport.hudud} options={options(REF.regions)} onValue={hudud => set({ hudud })} />
        </Field>
        <Field label={t("ms_f_total_value")} htmlFor="ms-f-umumiy">
          <NumberInput id="ms-f-umumiy" value={passport.umumiyQiymat} onValue={umumiyQiymat => set({ umumiyQiymat })} />
        </Field>
        <Field label={t("ms_f_amount")} htmlFor="ms-f-summa">
          <NumberInput id="ms-f-summa" value={passport.soralayotganSumma} onValue={soralayotganSumma => set({ soralayotganSumma })} />
        </Field>
        <Field label={t("ms_f_currency")} htmlFor="ms-f-valyuta">
          <Select id="ms-f-valyuta" value={passport.valyuta} options={currencies} onValue={valyuta => set({ valyuta })} />
        </Field>
        <Field label={t("ms_f_term")} htmlFor="ms-f-muddat">
          <NumberInput id="ms-f-muddat" value={passport.muddat} step="1" onValue={value => set({ muddat: value || 0 })} />
        </Field>
        <Field label={t("ms_f_fin_type")} htmlFor="ms-f-montur">
          <Select
            id="ms-f-montur"
            value={passport.moliyalashtirishTuri}
            options={options(REF.financingTypes)}
            onValue={moliyalashtirishTuri => set({ moliyalashtirishTuri })}
          />
        </Field>
        <Field label={t("ms_f_owner_share")} htmlFor="ms-f-ulush">
          <NumberInput id="ms-f-ulush" value={passport.tashabbuskorUlushi} onValue={tashabbuskorUlushi => set({ tashabbuskorUlushi })} />
        </Field>
        <Field label={t("ms_f_op_years")} htmlFor="ms-f-yillar">
          <NumberInput id="ms-f-yillar" value={passport.faoliyatYillari} step="1" onValue={value => set({ faoliyatYillari: value || 0 })} />
        </Field>
      </div>
    </>
  );
}
