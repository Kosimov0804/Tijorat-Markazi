import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  companyIdentity,
  CURRENCIES,
  Field,
  fillForm,
  formValues,
  listOf,
  marketJson,
  Msg,
  OptionSelect,
} from "../../shell/market";
import type { Notice, Translate } from "../../shell/market";
import { CHANNELS, parseProductMatch } from "./types";
import type { ProductMatch, RfqPrefill } from "./types";

type RfqFormProps = {
  t: Translate;
  /** Set when a buyer asks for a quote from a product's detail. */
  prefill: RfqPrefill | null;
  onPublished: (matches: ProductMatch[]) => void;
};

export function RfqForm({ t, prefill, onPublished }: RfqFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form || !prefill) return;
    /* Category, unit and certificates are replaced even when the product has none. */
    fillForm(form, { title: prefill.title, channel: prefill.channel });
    const write = (name: string, value: string): void => {
      const field = form.elements.namedItem(name);
      if (field instanceof HTMLInputElement) field.value = value;
    };
    write("category", prefill.category);
    write("unit", prefill.unit);
    write("certificates", prefill.certificates);
    form.querySelector<HTMLInputElement>("#rqTitle")?.focus();
  }, [prefill]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = companyIdentity.withPerson(formValues(form));
    if (!(body.title ?? "").trim()) {
      setNotice({ key: "bz_need_title", kind: "err" });
      return;
    }
    const answer = await marketJson("/api/bozor/rfq", body);
    if (!answer.ok) {
      setNotice({ key: "bz_rfq_fail", kind: "err" });
      return;
    }
    const matches = listOf(answer.matches, parseProductMatch);
    setNotice({ key: "bz_rfq_ok", kind: "ok", n: matches.length });
    form.reset();
    onPublished(matches);
  };

  return (
    <form className="mk-card" id="bzRfqForm" style={{ gap: 14 }} ref={formRef} onSubmit={handleSubmit}>
      <h3>{t("bz_rfq_new")}</h3>
      <div className="mk-form">
        <Field label={t("bz_f_title")} isWide>
          <input id="rqTitle" name="title" required />
        </Field>
        <Field label={t("bz_f_spec")} isWide>
          <textarea id="rqSpec" name="spec" />
        </Field>
        <Field label={t("bz_f_channel")}>
          <OptionSelect
            id="rqChannel"
            name="channel"
            options={CHANNELS}
            labelOf={channel => (channel === "export" ? "Export" : channel.toUpperCase())}
          />
        </Field>
        <Field label={t("bz_f_category")}>
          <input id="rqCategory" name="category" />
        </Field>
        <Field label={t("bz_f_qty")}>
          <input id="rqQty" name="qty" type="number" min="0" />
        </Field>
        <Field label={t("bz_f_unit")}>
          <input id="rqUnit" name="unit" placeholder="kg / dona / tonna" />
        </Field>
        <Field label={t("bz_f_budget")}>
          <input id="rqBudget" name="budget" type="number" min="0" />
        </Field>
        <Field label={t("bz_f_currency")}>
          <OptionSelect id="rqCurrency" name="currency" options={CURRENCIES} />
        </Field>
        <Field label={t("bz_f_region")}>
          <input id="rqRegion" name="region" />
        </Field>
        <Field label={t("bz_f_country")}>
          <input id="rqCountry" name="country" />
        </Field>
        <Field label={t("bz_f_maxlead")}>
          <input id="rqMaxLead" name="maxLead" type="number" min="0" />
        </Field>
        <Field label={t("bz_f_incoterm")}>
          <input id="rqIncoterm" name="incoterm" placeholder="FOB / CIF / EXW" />
        </Field>
        <Field label={t("bz_f_certs")} isWide>
          <input id="rqCerts" name="certificates" placeholder="ISO 22000, Halal" />
        </Field>
        <Field label={t("bz_f_contact")} isWide>
          <input id="rqContact" name="contact" />
        </Field>
      </div>
      <div className="mk-actions">
        <button className="btn btn-primary" type="submit">
          {t("bz_rfq_send")}
        </button>
      </div>
      <Msg notice={notice} t={t} id="bzRfqMsg" />
    </form>
  );
}
