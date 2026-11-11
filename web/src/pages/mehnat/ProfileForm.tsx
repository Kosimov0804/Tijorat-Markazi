import { useState } from "react";
import type { FormEvent, RefObject } from "react";
import {
  amount,
  checkedValues,
  companyIdentity,
  Field,
  flag,
  formValues,
  identity,
  marketJson,
  Msg,
  OptionSelect,
  text,
  texts,
} from "../../shell/market";
import type { Json, Notice, Translate } from "../../shell/market";
import { availabilityLabel, formatLabel, seniorityLabel, visibilityLabel } from "./parts";
import { AVAILABILITIES, SALARY_CURRENCIES, SENIORITIES, VISIBILITIES, WORK_FORMATS } from "./types";

type ProfileFormProps = {
  /** The stored profile, or null for someone who has not saved one yet. */
  profile: Json | null;
  formRef: RefObject<HTMLFormElement | null>;
  t: Translate;
  onSaved: () => void;
};

/** A stored zero means "not given", so the field starts empty. */
const numberField = (value: unknown): string => (amount(value) ? text(value) : "");

function ProfileFields({ profile, t }: { profile: Json; t: Translate }) {
  const formats = texts(profile.formats);
  const list = (key: string): string => texts(profile[key]).join(", ");
  return (
    <>
      <Field label={t("hc_occupation")}>
        <input id="cdOcc" name="occupation" defaultValue={text(profile.occupation)} />
      </Field>
      <Field label={t("hc_headline")} isWide>
        <input id="cdHeadline" name="headline" defaultValue={text(profile.headline)} />
      </Field>
      <Field label={t("hc_region")}>
        <input id="cdRegion" name="region" defaultValue={text(profile.region)} />
      </Field>
      <Field label={t("hc_level")}>
        <OptionSelect
          id="cdSeniority"
          name="seniority"
          options={SENIORITIES}
          labelOf={seniorityLabel(t)}
          defaultValue={text(profile.seniority) || "middle"}
        />
      </Field>
      <Field label={t("hc_years")}>
        <input id="cdYears" name="years" type="number" min="0" defaultValue={numberField(profile.years)} />
      </Field>
      <Field label={t("hc_availability")}>
        <OptionSelect
          id="cdAvail"
          name="availability"
          options={AVAILABILITIES}
          labelOf={availabilityLabel(t)}
          defaultValue={text(profile.availability) || "open"}
        />
      </Field>
      <Field label={t("hc_exp_min")}>
        <input id="cdMin" name="expectedMin" type="number" min="0" defaultValue={numberField(profile.expectedMin)} />
      </Field>
      <Field label={t("hc_exp_max")}>
        <input id="cdMax" name="expectedMax" type="number" min="0" defaultValue={numberField(profile.expectedMax)} />
      </Field>
      <Field label={t("hc_currency")}>
        <OptionSelect
          id="cdCurrency"
          name="currency"
          options={SALARY_CURRENCIES}
          defaultValue={text(profile.currency) === "USD" ? "USD" : "UZS"}
        />
      </Field>
      <Field label={t("hc_skills")} isWide>
        <input id="cdSkills" name="skills" defaultValue={list("skills")} placeholder="IFRS, Excel, SQL" />
      </Field>
      <Field label={t("hc_languages")}>
        <input id="cdLangs" name="languages" defaultValue={list("languages")} />
      </Field>
      <Field label={t("hc_certs")}>
        <input id="cdCerts" name="certificates" defaultValue={list("certificates")} />
      </Field>
      <Field label={t("hc_education")} isWide>
        <input id="cdEdu" name="education" defaultValue={text(profile.education)} />
      </Field>
      <Field label={t("hc_experience")} isWide>
        <textarea id="cdExp" name="experience" defaultValue={text(profile.experience)} />
      </Field>
      <Field label="Portfolio URL" isWide>
        <input id="cdPortfolio" name="portfolio" defaultValue={text(profile.portfolio)} />
      </Field>
      <Field label={t("hc_formats")} isWide>
        <div className="mk-checks">
          {WORK_FORMATS.map(format => (
            <label key={format}>
              <input
                type="checkbox"
                className="cdFmt"
                name="formats"
                value={format}
                defaultChecked={formats.includes(format)}
              />{" "}
              {formatLabel(t)(format)}
            </label>
          ))}
          <label>
            <input type="checkbox" id="cdRelocate" name="relocate" defaultChecked={flag(profile.relocate)} />{" "}
            {t("hc_relocate")}
          </label>
        </div>
      </Field>
      <Field label={t("hc_visibility")}>
        <OptionSelect
          id="cdVisibility"
          name="visibility"
          options={VISIBILITIES}
          labelOf={visibilityLabel(t)}
          defaultValue={text(profile.visibility) || "public"}
        />
      </Field>
    </>
  );
}

/* The candidate passport: one profile that every application carries. */
export function ProfileForm({ profile, formRef, t, onSaved }: ProfileFormProps) {
  const [notice, setNotice] = useState<Notice | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    const { name, relocate: _relocate, formats: _formats, ...fields } = formValues(form);
    identity.setPerson(identity.email(), (name ?? "").trim());
    const answer = await marketJson(
      "/api/mehnat/candidate",
      companyIdentity.withPerson({
        ...fields,
        relocate: form.querySelector<HTMLInputElement>("#cdRelocate")?.checked ?? false,
        formats: checkedValues(form, "formats"),
      }),
    );
    if (!answer.ok) {
      setNotice({ key: "hc_save_fail", kind: "err" });
      return;
    }
    setNotice({ key: "hc_save_ok", kind: "ok" });
    onSaved();
  };

  return (
    <>
      <h3>{t("hc_passport")}</h3>
      <form className="mk-form" id="hcProfileForm" ref={formRef} onSubmit={handleSubmit}>
        <Field label={t("hc_f_name")}>
          <input id="cdName" name="name" defaultValue={profile ? text(profile.name) : identity.name()} required />
        </Field>
        <ProfileFields profile={profile ?? {}} t={t} />
        <div className="mk-actions wide">
          <button className="btn btn-primary" type="submit">
            {t("hc_save")}
          </button>
          <Msg notice={notice} t={t} id="hcProfMsg" />
        </div>
        <p className="mk-note wide">{t("hc_privacy_note")}</p>
      </form>
    </>
  );
}
