import { useRef, useState } from "react";
import type { FormEvent } from "react";
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

/* Server-side messages, said in the applicant's language. Everything the
   company form can hit is here too: the endpoints share their validation, so
   they share their failures. */
const SERVER_ERRORS: Record<string, string | undefined> = {
  name_required: "rg_e_name",
  phone_required: "br_e_phone",
  contact_required: "rg_e_contact",
  email_invalid: "rg_e_email",
  login_invalid: "rg_e_login",
  password_short: "rg_e_pass",
  login_taken: "rg_e_taken",
  login_pending: "rg_e_taken",
  too_many_pending: "rg_e_many",
  /* Not validation: the request never reached a working endpoint. Telling
     someone to "try again" here hides a server that needs attention. */
  network: "rg_e_offline",
  bad_response: "rg_e_unavailable",
  unknown_endpoint: "rg_e_unavailable",
  forbidden: "rg_e_unavailable",
};

function readBuyerForm(form: HTMLFormElement) {
  const field = (name: string): string => readField(form, name);
  return {
    name: field("name"),
    phone: field("phone"),
    region: field("region"),
    about: field("about"),
    contactName: field("contactName"),
    role: field("role"),
    email: field("email"),
    contactPhone: field("contactPhone"),
    login: field("login").toLowerCase(),
    password: readRawField(form, "password"),
  };
}

type BuyerFormProps = {
  onDone: (application: Application, email: string) => void;
  t: Translate;
};

export function BuyerForm({ onDone, t }: BuyerFormProps) {
  const consent = useConsentGate();
  const [notice, setNotice] = useState<FormNotice | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const isSubmitting = useRef(false);

  const fail = (key: string) => setNotice({ key, kind: "err" });

  const failFromServer = (code: unknown) => {
    const key = typeof code === "string" ? SERVER_ERRORS[code] : undefined;
    /* Whoever is looking at the console deserves the real code, not the prose. */
    if (code && !key) console.warn("[register] unmapped server error:", code);
    fail(key ?? "rg_e_generic");
  };

  const send = async (form: HTMLFormElement) => {
    /* The offer is shown before anything else, so it cannot be skipped by a
       later change to the checks below. */
    if (!(await consent.confirm())) return;
    const values = readBuyerForm(form);
    const passwordRepeat = readRawField(form, "passwordRepeat");
    if (!values.name) return fail("rg_e_name");
    if (!values.phone) return fail("br_e_phone");
    if (!values.contactName) return fail("rg_e_contact");
    const accountProblem = accountError({ ...values, passwordRepeat });
    if (accountProblem) return fail(accountProblem);

    setIsSending(true);
    const answer = await registerApi("/api/register/buyer", { ...values, consent: true });
    setIsSending(false);

    const application = answer.ok ? readApplication(answer.application) : null;
    if (!application) return failFromServer(answer.error);
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
    <form className="rg-card" id="brForm" noValidate onSubmit={handleSubmit}>
      <h2>{t("br_form_h")}</h2>

      <h3 className="rg-legend">{t("br_leg_company")}</h3>
      <div className="mk-form">
        <Field id="brName" label={t("br_f_name")} isWide>
          <input id="brName" name="name" required autoComplete="organization" />
        </Field>
        {/* The company NUMBER is required: a buyer publishes nothing, so a name
            and a line that answers are all an approver has to go on. */}
        <Field id="brPhone" label={t("br_f_phone")} isWide>
          <input
            id="brPhone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder={t("br_ph_phone")}
          />
          <small>{t("br_hint_phone")}</small>
        </Field>
        <Field id="brRegion" label={t("rg_f_region")}>
          <input id="brRegion" name="region" />
        </Field>
        <Field id="brRole" label={t("rg_f_role")}>
          <input id="brRole" name="role" />
        </Field>
        <Field id="brAbout" label={t("br_f_about")} isWide>
          <textarea id="brAbout" name="about" rows={3} />
        </Field>
      </div>

      <h3 className="rg-legend">{t("rg_leg_contact")}</h3>
      <div className="mk-form">
        <Field id="brContact" label={t("rg_f_contact")}>
          <input id="brContact" name="contactName" required autoComplete="name" />
        </Field>
        <Field id="brEmail" label={t("rg_f_email")}>
          <input id="brEmail" name="email" type="email" required autoComplete="email" />
        </Field>
        <Field id="brCPhone" label={t("br_f_cphone")} isWide>
          <input id="brCPhone" name="contactPhone" type="tel" autoComplete="tel" />
        </Field>
      </div>

      <AccountFields prefix="br" resetKey={resetKey} t={t} />
      <ConsentRow
        id="brConsent"
        textKey="br_consent"
        isChecked={consent.isChecked}
        onChange={consent.setChecked}
        t={t}
      />

      <div className="mk-actions">
        <button className="btn btn-primary btn-lg" type="submit" id="brSubmit" disabled={isSending}>
          {t("br_send")}
        </button>
      </div>
      <FormMessage id="brMsg" notice={notice} t={t} />
      {consent.gate}
    </form>
  );
}
