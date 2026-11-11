import { useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { useI18n } from "../../shell/i18n";
import {
  AiDraft,
  askCopilot,
  checkedValues,
  companyIdentity,
  CURRENCIES,
  Field,
  fillForm,
  formValues,
  Loading,
  marketJson,
  Msg,
  OptionSelect,
  text,
  texts,
} from "../../shell/market";
import type { CompanySession, CopilotResult, Notice, Translate } from "../../shell/market";
import { CHANNELS } from "./types";

const AI_TEXTAREA: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius-sm)",
  background: "var(--card)",
  color: "var(--ink)",
  font: "inherit",
};

type AiState = { status: "idle" } | { status: "needText" } | { status: "loading" } | { status: "done"; result: CopilotResult };

function draftRows(result: CopilotResult, t: Translate) {
  const data = result.data;
  return [
    { label: t("bz_f_title"), value: text(data.title) },
    { label: t("bz_f_desc"), value: text(data.desc) },
    { label: t("bz_f_category"), value: text(data.category) },
    { label: t("bz_specs"), value: text(data.specs) },
    { label: t("bz_channels"), value: texts(data.channels).join(", ") },
    { label: "HS-code", value: text(data.hs) },
    { label: "Incoterms", value: texts(data.incoterms).join(", ") },
    { label: t("bz_markets"), value: texts(data.markets).join(", ") },
    { label: t("bz_f_certs"), value: texts(data.certificates).join(", ") },
  ];
}

/** Copies an AI draft into the product form; the seller still reviews and publishes. */
function applyDraft(form: HTMLFormElement, result: CopilotResult): void {
  const data = result.data;
  fillForm(form, {
    title: text(data.title),
    desc: text(data.desc),
    category: text(data.category),
    specs: text(data.specs),
    hs: text(data.hs),
    incoterms: texts(data.incoterms),
    markets: texts(data.markets),
    certificates: texts(data.certificates),
    unit: text(data.unit),
  });
  const channels = texts(data.channels);
  form.querySelectorAll<HTMLInputElement>("input.pCh").forEach(box => {
    box.checked = channels.includes(box.value);
  });
  form.querySelector("#pTitle")?.scrollIntoView?.({ behavior: "smooth", block: "center" });
}

function ProductFields({ t }: { t: Translate }) {
  return (
    <>
      <Field label={t("bz_f_title")} isWide>
        <input id="pTitle" name="title" required />
      </Field>
      <Field label={t("bz_f_desc")} isWide>
        <textarea id="pDesc" name="desc" />
      </Field>
      <Field label={t("bz_f_category")}>
        <input id="pCategory" name="category" />
      </Field>
      <Field label={t("bz_brand")}>
        <input id="pBrand" name="brand" />
      </Field>
      <Field label={t("bz_price")}>
        <input id="pPrice" name="price" type="number" step="0.01" min="0" />
      </Field>
      <Field label={t("bz_f_currency")}>
        <OptionSelect id="pCurrency" name="currency" options={CURRENCIES} />
      </Field>
      <Field label={t("bz_f_unit")}>
        <input id="pUnit" name="unit" placeholder="kg" />
      </Field>
      <Field label="MOQ">
        <input id="pMoq" name="moq" type="number" min="0" />
      </Field>
      <Field label={`${t("bz_lead_label")} (${t("bz_days")})`}>
        <input id="pLead" name="leadTime" type="number" min="0" />
      </Field>
      <Field label={t("bz_stock")}>
        <input id="pStock" name="stock" type="number" min="0" />
      </Field>
      <Field label={t("bz_f_region")}>
        <input id="pRegion" name="region" />
      </Field>
      <Field label="HS-code">
        <input id="pHs" name="hs" />
      </Field>
      <Field label="Incoterms">
        <input id="pIncoterms" name="incoterms" placeholder="FOB, CIF" />
      </Field>
      <Field label={t("bz_markets")}>
        <input id="pMarkets" name="markets" placeholder="Russia, Poland" />
      </Field>
      <Field label={t("bz_f_certs")} isWide>
        <input id="pCerts" name="certificates" placeholder="ISO 22000, Halal" />
      </Field>
      <Field label={t("bz_specs")} isWide>
        <textarea id="pSpecs" name="specs" />
      </Field>
      <Field label={t("bz_channels")} isWide>
        <div className="mk-checks">
          {CHANNELS.map(channel => (
            <label key={channel}>
              <input type="checkbox" name="channels" value={channel} defaultChecked={channel === "b2b"} className="pCh" />{" "}
              {channel === "export" ? t("bz_ch_export") : channel.toUpperCase()}
            </label>
          ))}
          <label>
            <input type="checkbox" id="pLocal" name="localMade" /> {t("bz_local")}
          </label>
        </div>
      </Field>
    </>
  );
}

type ProductComposerProps = { company: CompanySession; t: Translate; onSaved: () => void };

/* The Catalog Copilot and the product form it fills: two boxes of the cabinet. */
export function ProductComposer({ company, t, onSaved }: ProductComposerProps) {
  const { lang } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const [description, setDescription] = useState("");
  const [ai, setAi] = useState<AiState>({ status: "idle" });
  const [notice, setNotice] = useState<Notice | null>(null);

  const draft = async (): Promise<void> => {
    const described = description.trim();
    if (!described) {
      setAi({ status: "needText" });
      return;
    }
    setAi({ status: "loading" });
    const result = await askCopilot(
      companyIdentity.withCompany({
        agent: "bozor.catalog",
        lang,
        text: described,
        sector: company.sector,
        company: company.name,
      }),
    );
    setAi({ status: "done", result });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    const { localMade: _localMade, channels: _channels, ...fields } = formValues(form);
    const answer = await marketJson(
      "/api/bozor/product",
      companyIdentity.withCompany({
        ...fields,
        localMade: form.querySelector<HTMLInputElement>("#pLocal")?.checked ?? false,
        channels: checkedValues(form, "channels"),
      }),
    );
    if (!answer.ok) {
      setNotice({ key: "bz_save_fail", kind: "err" });
      return;
    }
    setNotice({ key: "bz_save_ok", kind: "ok" });
    form.reset();
    onSaved();
  };

  const canApply = ai.status === "done" && ai.result.ok;
  return (
    <>
      <div className="mk-box w6">
        <h3>{t("bz_ai_title")}</h3>
        <div className="mk-ai">
          <h3>{t("bz_ai_catalog")}</h3>
          <p style={{ fontSize: 13.5, color: "var(--text)" }}>{t("bz_ai_hint")}</p>
          <textarea
            id="bzAiText"
            className="mk-f"
            style={AI_TEXTAREA}
            placeholder={t("bz_ai_ph")}
            value={description}
            onChange={event => setDescription(event.target.value)}
          />
          <div className="mk-actions">
            <button className="btn btn-primary" type="button" id="bzAiGo" onClick={() => void draft()}>
              {t("bz_ai_go")}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              id="bzAiApply"
              hidden={!canApply}
              onClick={() => {
                if (formRef.current && ai.status === "done") applyDraft(formRef.current, ai.result);
              }}
            >
              {t("bz_ai_apply")}
            </button>
          </div>
          <div id="bzAiOut" className={ai.status === "needText" ? "mk-msg is-err" : undefined}>
            {ai.status === "needText" && t("bz_ai_need")}
            {ai.status === "loading" && <Loading />}
            {ai.status === "done" && <AiDraft result={ai.result} rows={draftRows(ai.result, t)} />}
          </div>
        </div>
      </div>
      <div className="mk-box w12">
        <h3>{t("bz_add_product")}</h3>
        <form className="mk-form" id="bzProductForm" ref={formRef} onSubmit={handleSubmit}>
          <ProductFields t={t} />
          <div className="mk-actions wide">
            <button className="btn btn-primary" type="submit">
              {t("bz_publish")}
            </button>
            <Msg notice={notice} t={t} id="bzPMsg" />
          </div>
        </form>
      </div>
    </>
  );
}
