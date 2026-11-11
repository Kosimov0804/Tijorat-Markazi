import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Lang } from "@legacy/data.js";
import { useI18n } from "../../shell/i18n";
import { useConsentGate } from "../../shell/legal/LegalGate";
import type { Translate } from "../../shell/market/mk";
import { AccountFields, ConsentRow, Field, FormMessage } from "../../shell/register/FormParts";
import type { FormNotice } from "../../shell/register/FormParts";
import {
  accountError,
  readApplication,
  readField,
  readRawField,
  registerApi,
} from "../../shell/register/registerApi";
import type { Application } from "../../shell/register/registerApi";

export type Association = { id: string; name: string; i18n?: Partial<Record<Lang, string>> };
/** null when the lists could not be loaded, undefined while they are on the way. */
export type RegisterMeta = { associations: Association[]; sectors: string[] } | null | undefined;

/* Server-side messages, said in the applicant's language. */
const SERVER_ERRORS: Record<string, string | undefined> = {
  name_required: "rg_e_name",
  assoc_required: "rg_e_assoc",
  assoc_unknown: "rg_e_assoc",
  email_invalid: "rg_e_email",
  login_invalid: "rg_e_login",
  password_short: "rg_e_pass",
  login_taken: "rg_e_taken",
  login_pending: "rg_e_taken",
  too_many_pending: "rg_e_many",
  /* Not validation: the request never reached a working endpoint, so "try
     again" would send the applicant round the form a second time for nothing.
     `unknown_endpoint` is what a server running older code answers. */
  network: "rg_e_offline",
  bad_response: "rg_e_unavailable",
  unknown_endpoint: "rg_e_unavailable",
};

function readCompanyForm(form: HTMLFormElement) {
  const field = (name: string): string => readField(form, name);
  return {
    name: field("name"),
    assocId: field("assocId"),
    sector: field("sector"),
    region: field("region"),
    tin: field("tin"),
    website: field("website"),
    about: field("about"),
    contactName: field("contactName"),
    role: field("role"),
    email: field("email"),
    phone: field("phone"),
    login: field("login").toLowerCase(),
    password: readRawField(form, "password"),
  };
}

type CompanyFormProps = {
  meta: RegisterMeta;
  onDone: (application: Application, email: string) => void;
  t: Translate;
};

export function CompanyForm({ meta, onDone, t }: CompanyFormProps) {
  const { lang } = useI18n();
  const consent = useConsentGate();
  const [notice, setNotice] = useState<FormNotice | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const isSubmitting = useRef(false);

  const fail = (key: string) => setNotice({ key, kind: "err" });

  const send = async (form: HTMLFormElement) => {
    /* The offer is shown before anything else, so it cannot be skipped by a
       later change to the checks below. */
    if (!(await consent.confirm())) return;
    const values = readCompanyForm(form);
    const passwordRepeat = readRawField(form, "passwordRepeat");
    if (!values.name) return fail("rg_e_name");
    if (!values.assocId) return fail("rg_e_assoc");
    if (!values.contactName) return fail("rg_e_contact");
    const accountProblem = accountError({ ...values, passwordRepeat });
    if (accountProblem) return fail(accountProblem);

    setIsSending(true);
    /* The server records consent as a dated, versioned event and refuses the
       application without it. */
    const answer = await registerApi("/api/register", { ...values, consent: true });
    setIsSending(false);

    const application = answer.ok ? readApplication(answer.application) : null;
    if (!application) return fail(SERVER_ERRORS[String(answer.error)] ?? "rg_e_generic");
    setNotice(null);
    form.reset();
    setResetKey(key => key + 1);
    consent.reset();
    onDone(application, values.email);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    try {
      await send(event.currentTarget);
    } finally {
      isSubmitting.current = false;
    }
  };

  return (
    <form className="rg-card" id="rgForm" noValidate onSubmit={handleSubmit}>
      <h2>{t("rg_form_h")}</h2>

      <h3 className="rg-legend">{t("rg_leg_company")}</h3>
      <div className="mk-form">
        <Field id="rgName" label={t("rg_f_name")} isWide>
          <input id="rgName" name="name" required autoComplete="organization" />
        </Field>
        <Field id="rgAssoc" label={t("rg_f_assoc")}>
          <select id="rgAssoc" name="assocId" required defaultValue="">
            {meta === null && <option value="">—</option>}
            {meta && <option value="">{t("rg_pick")}</option>}
            {meta?.associations.map(association => (
              <option key={association.id} value={association.id}>
                {association.i18n?.[lang] || association.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id="rgSector" label={t("rg_f_sector")}>
          <input id="rgSector" name="sector" list="rgSectors" autoComplete="off" />
          <datalist id="rgSectors">
            {meta?.sectors.map(sector => (
              <option key={sector} value={sector} />
            ))}
          </datalist>
        </Field>
        <Field id="rgRegion" label={t("rg_f_region")}>
          <input id="rgRegion" name="region" />
        </Field>
        <Field id="rgTin" label={t("rg_f_tin")}>
          <input id="rgTin" name="tin" inputMode="numeric" />
        </Field>
        <Field id="rgWebsite" label={t("rg_f_website")} isWide>
          <input id="rgWebsite" name="website" type="url" placeholder="https://…" />
        </Field>
        <Field id="rgAbout" label={t("rg_f_about")} isWide>
          <textarea id="rgAbout" name="about" rows={3} />
        </Field>
      </div>

      <h3 className="rg-legend">{t("rg_leg_contact")}</h3>
      <div className="mk-form">
        <Field id="rgContact" label={t("rg_f_contact")}>
          <input id="rgContact" name="contactName" required autoComplete="name" />
        </Field>
        <Field id="rgRole" label={t("rg_f_role")}>
          <input id="rgRole" name="role" />
        </Field>
        <Field id="rgEmail" label={t("rg_f_email")}>
          <input id="rgEmail" name="email" type="email" required autoComplete="email" />
        </Field>
        <Field id="rgPhone" label={t("rg_f_phone")}>
          <input id="rgPhone" name="phone" type="tel" placeholder="+998 …" autoComplete="tel" />
        </Field>
      </div>

      <AccountFields prefix="rg" resetKey={resetKey} t={t} />
      <ConsentRow
        id="rgConsent"
        textKey="rg_consent"
        isChecked={consent.isChecked}
        onChange={consent.setChecked}
        t={t}
      />

      <div className="mk-actions">
        <button className="btn btn-primary btn-lg" type="submit" id="rgSubmit" disabled={isSending}>
          {t("rg_send")}
        </button>
      </div>
      <FormMessage id="rgMsg" notice={notice} t={t} />
      {consent.gate}
    </form>
  );
}
