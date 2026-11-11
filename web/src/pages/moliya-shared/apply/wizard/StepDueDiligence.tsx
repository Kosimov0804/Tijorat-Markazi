import { REF } from "../../engine/engine";
import type { DdArea, Project, RefItem } from "../../engine/types";
import { useKit } from "../../kit";
import { Documents } from "./Documents";
import { Check, Field, NumberInput, SectionHead, Select, TextInput } from "./fields";
import { editDueDiligence } from "./logic";
import { useRefOptions } from "./StepPassport";
import type { StepProps } from "./StepPassport";

type DueDiligence = Project["dueDiligence"];
type Setter = (change: Partial<DueDiligence>) => void;

/* One <select> holds both the category and the firm, as "category::name". */
function TeoSelect({ teo, onPick }: { teo: DueDiligence["teoTayyorlovchi"]; onPick: (teo: DueDiligence["teoTayyorlovchi"]) => void }) {
  const { t } = useKit();
  const group = (label: string, firms: readonly string[], category: string) => (
    <optgroup label={label}>
      {firms.map(firm => (
        <option key={firm} value={`${category}::${firm}`}>
          {firm}
        </option>
      ))}
    </optgroup>
  );
  return (
    <select
      id="ms-f-teo"
      className="ms-in"
      value={`${teo.category || "none"}::${teo.name || ""}`}
      onChange={event => {
        const [category, name = ""] = event.target.value.split("::");
        onPick({ category, name });
      }}
    >
      <option value="none::">{t("ms_none")}</option>
      <option value="internal::">{t("ms_teo_internal")}</option>
      {group(t("ms_teo_big5_group"), REF.consultants.big5, "big5")}
      {group(t("ms_teo_recognized_group"), REF.consultants.recognized, "recognized")}
    </select>
  );
}

function AreaRow({ area, current, onChange }: { area: RefItem; current: DdArea; onChange: (next: DdArea) => void }) {
  const { t, label } = useKit();
  return (
    <tr>
      <td>{label(area)}</td>
      <td>
        <select
          data-ms-dd={area.id}
          className="ms-in"
          aria-label={`${label(area)} · ${t("ms_col_status")}`}
          value={current.status}
          onChange={event => onChange({ ...current, status: event.target.value })}
        >
          {REF.ddStatusOptions.map(option => (
            <option key={option.id} value={option.id}>
              {label(option)}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          data-ms-ddp={area.id}
          type="text"
          className="ms-in"
          aria-label={`${label(area)} · ${t("ms_col_performer")}`}
          placeholder={t("ms_ph_performer")}
          defaultValue={current.performer}
          onChange={event => onChange({ ...current, performer: event.target.value.trim() })}
        />
      </td>
    </tr>
  );
}

function AreasTable({ dd, set }: { dd: DueDiligence; set: Setter }) {
  const { t } = useKit();
  return (
    <div className="mk-tablewrap">
      <table className="mk-table">
        <thead>
          <tr>
            <th>{t("ms_col_area")}</th>
            <th>{t("ms_col_status")}</th>
            <th>{t("ms_col_performer")}</th>
          </tr>
        </thead>
        <tbody>
          {REF.ddAreas.map(area => (
            <AreaRow
              key={area.id}
              area={area}
              current={dd.ddYonalishlari[area.id] ?? { status: "none", performer: "" }}
              onChange={next => set({ ddYonalishlari: { ...dd.ddYonalishlari, [area.id]: next } })}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExitFields({ dd, set }: { dd: DueDiligence; set: Setter }) {
  const { t } = useKit();
  const options = useRefOptions();
  const withBlank = (items: readonly RefItem[]) => [{ value: "", label: t("ms_select") }, ...options(items)];
  const setExit = (change: Partial<DueDiligence["exit"]>): void => set({ exit: { ...dd.exit, ...change } });
  return (
    <>
      <div className="mk-form">
        <Field label={t("ms_f_legal_firm")} htmlFor="ms-f-yuridik">
          <Select id="ms-f-yuridik" value={dd.yuridikKompaniya} options={withBlank(REF.legalFirms)} onValue={yuridikKompaniya => set({ yuridikKompaniya })} />
        </Field>
        <Field label={t("ms_f_exit_type")} htmlFor="ms-f-exit-t" hint={t("ms_f_exit_type_hint")}>
          <Select id="ms-f-exit-t" value={dd.exit.turi} options={withBlank(REF.exitTypes)} onValue={turi => setExit({ turi })} />
        </Field>
        <Field label={t("ms_f_price_formula")} htmlFor="ms-f-exit-f" hint={t("ms_f_price_hint")}>
          <TextInput id="ms-f-exit-f" value={dd.exit.narxFormulasi} onValue={narxFormulasi => setExit({ narxFormulasi })} />
        </Field>
        <Field label={t("ms_f_exit_term")} htmlFor="ms-f-exit-m">
          <NumberInput id="ms-f-exit-m" value={dd.exit.muddat} step="1" onValue={muddat => setExit({ muddat })} />
        </Field>
      </div>
      <Check id="ms-f-exit-c" label={t("ms_chk_exit_contract")} isOn={dd.exit.shartnomaLoyihasi} onValue={shartnomaLoyihasi => setExit({ shartnomaLoyihasi })} />
    </>
  );
}

/** Step 4 of the company track: who prepared and checked the project, and the way out. */
export function StepDueDiligence({ project, onEdit }: StepProps) {
  const { t } = useKit();
  const options = useRefOptions();
  const dd = project.dueDiligence;
  const set: Setter = change => onEdit(editDueDiligence(change));
  const setAudit = (change: Partial<DueDiligence["audit"]>): void => set({ audit: { ...dd.audit, ...change } });
  const opinions = [{ value: "", label: t("ms_select") }, ...options(REF.auditOpinionTypes)];

  return (
    <>
      <SectionHead title={t("ms_d_teo_title")} sub={t("ms_d_teo_sub")} />
      <div className="mk-form">
        <Field label={t("ms_f_teo_preparer")} htmlFor="ms-f-teo">
          <TeoSelect teo={dd.teoTayyorlovchi} onPick={teoTayyorlovchi => set({ teoTayyorlovchi })} />
        </Field>
        <Field label={t("ms_f_audit_years")} htmlFor="ms-f-audit-y">
          <NumberInput id="ms-f-audit-y" value={dd.audit.yillarSoni} step="1" onValue={value => setAudit({ yillarSoni: value || 0 })} />
        </Field>
        <Field label={t("ms_f_auditor")} htmlFor="ms-f-auditor">
          <TextInput id="ms-f-auditor" value={dd.audit.auditor} onValue={auditor => setAudit({ auditor })} />
        </Field>
        <Field label={t("ms_f_audit_opinion")} htmlFor="ms-f-audit-x">
          <Select id="ms-f-audit-x" value={dd.audit.xulosaTuri} options={opinions} onValue={xulosaTuri => setAudit({ xulosaTuri })} />
        </Field>
      </div>
      <Check id="ms-f-audit-c" label={t("ms_chk_audit_contract")} isOn={dd.audit.contractSigned} onValue={contractSigned => setAudit({ contractSigned })} />
      <SectionHead title={t("ms_d_dd_title")} sub={t("ms_d_dd_sub")} />
      <AreasTable dd={dd} set={set} />
      <Check id="ms-f-tor" label={t("ms_chk_tor")} isOn={dd.torTasdiqlangan} onValue={torTasdiqlangan => set({ torTasdiqlangan })} />
      <SectionHead title={t("ms_d_legal_title")} />
      <ExitFields dd={dd} set={set} />
      <Documents project={project} onEdit={onEdit} hint={t("ms_doc_hint_company")} />
    </>
  );
}
