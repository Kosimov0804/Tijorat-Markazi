import { useRef, useState } from "react";
import { asArray, asString, isRecord } from "../../../shell/chat";
import { adminPostSafe } from "../api";
import { useLoader } from "../parts";
import type { AdminTextKey } from "../text";
import { isTextKey, useText } from "../useText";

/* The operator requisites that Qoidalar 24-band and ZRU-792 require on every
   page. The server redacts anything unfilled before /api/legal answers, so
   this form is the only route by which a real value reaches a visitor. */

const OPERATOR = "/api/legal/operator";
const OP_LANGS = ["uz", "ru", "en"] as const;
const OP_I18N = ["legalName", "legalForm", "address"];
const OP_PLAIN = ["brand", "stir", "regNumber", "regDate", "email", "phone", "dpoName", "dpoEmail", "licence"];

type Fields = Readonly<Record<string, unknown>>;

interface OperatorConfig {
  operator: Fields;
  template: Fields;
  i18nKeys: readonly string[];
  required: readonly string[];
  missing: readonly string[];
  isReady: boolean;
}

async function loadConfig(): Promise<OperatorConfig | "failed"> {
  const answer = await adminPostSafe(OPERATOR);
  if (!isRecord(answer) || !answer.ok) return "failed";
  return {
    operator: isRecord(answer.operator) ? answer.operator : {},
    template: isRecord(answer.template) ? answer.template : {},
    i18nKeys: Array.isArray(answer.i18nKeys) ? answer.i18nKeys.map(asString) : OP_I18N,
    required: asArray(answer.required).map(asString),
    missing: asArray(answer.missing).map(asString),
    isReady: Boolean(answer.ready),
  };
}

/** A stored value: the named language of a per-language field, or the field itself. */
function valueOf(fields: Fields, key: string, lang?: string): string {
  const value = fields[key];
  return asString(isRecord(value) ? value[lang ?? "uz"] : value);
}

/* The template string becomes the input's PLACEHOLDER: it says what belongs
   in the box without ever being stored, or published as if it were data. */
function hintOf(template: Fields, key: string, lang?: string): string {
  const value = template[key];
  const text = isRecord(value) ? asString(value[lang ?? "uz"]) || asString(value.uz) : asString(value);
  return text
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/^(TO'LDIRILSIN|ZAPOLNIT|TO BE COMPLETED):\s*/, "");
}

/** Reads every box into the payload the server expects: per-language fields as objects. */
function collect(host: HTMLElement): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  host.querySelectorAll<HTMLInputElement>("[data-op]").forEach(input => {
    const key = input.dataset.op ?? "";
    const lang = input.dataset.lang;
    if (!lang) {
      payload[key] = input.value;
      return;
    }
    const names = isRecord(payload[key]) ? payload[key] : {};
    payload[key] = { ...names, [lang]: input.value };
  });
  return payload;
}

export function OperatorCard() {
  const { tx } = useText();
  const { data: config, reload } = useLoader(loadConfig, []);
  const [noteKey, setNoteKey] = useState<AdminTextKey | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  /* Each save redraws the boxes from what the server stored. */
  const [revision, setRevision] = useState(0);
  const hostRef = useRef<HTMLDivElement>(null);

  const fieldName = (key: string): string => {
    const textKey = `op_f_${key}`;
    return isTextKey(textKey) ? tx(textKey) : key;
  };

  const handleSave = async () => {
    if (!hostRef.current) return;
    setIsSaving(true);
    const answer = await adminPostSafe(OPERATOR, { op: "save", operator: collect(hostRef.current) });
    setIsSaving(false);
    setNoteKey(isRecord(answer) && answer.ok ? "op_saved" : "op_err");
    setRevision(current => current + 1);
    reload();
  };

  const heading = <h3 style={{ fontSize: 15, margin: "0 0 6px" }}>{tx("op_title")}</h3>;
  if (config === null) return null;
  if (config === "failed") {
    return (
      <>
        {heading}
        <p className="ac-label">{tx("op_err")}</p>
      </>
    );
  }

  const keys = [...config.i18nKeys, ...OP_PLAIN];
  const state = config.isReady
    ? `✓ ${tx("op_ready")}`
    : `⚠ ${tx("op_missing")}: ${config.missing.map(fieldName).join(", ")}`;

  return (
    <div ref={hostRef}>
      {heading}
      <p className="ac-label">{tx("op_sub")}</p>
      <p style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: config.isReady ? "#15795c" : "#b45309" }}>{state}</p>
      <div className="admin-form" style={{ alignItems: "flex-start" }} key={revision}>
        {keys.map(key => (
          <Field
            key={key}
            name={key}
            label={fieldName(key)}
            config={config}
            isRequired={config.required.includes(key)}
          />
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16 }}>
        <button className="btn btn-primary" id="opSave" type="button" disabled={isSaving} onClick={() => void handleSave()}>
          {tx("op_save")}
        </button>
        <span className="ac-label" id="opMsg" role="status">
          {noteKey && tx(noteKey)}
        </span>
      </div>
    </div>
  );
}

type FieldProps = {
  name: string;
  label: string;
  config: OperatorConfig;
  isRequired: boolean;
};

function Field({ name, label, config, isRequired }: FieldProps) {
  const { tx } = useText();
  const { operator, template } = config;
  const isPerLanguage = config.i18nKeys.includes(name);

  const caption = (
    <div className="ac-label">
      {label}
      {isRequired && <b style={{ color: "#b45309" }}> · {tx("op_req")}</b>}
    </div>
  );

  if (!isPerLanguage) {
    return (
      <div style={{ flex: "1 1 240px" }}>
        {caption}
        <div style={{ display: "flex", marginTop: 6 }}>
          <input
            data-op={name}
            aria-label={label}
            defaultValue={valueOf(operator, name)}
            placeholder={hintOf(template, name)}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: "1 1 100%" }}>
      {caption}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
        {OP_LANGS.map(lang => (
          <input
            key={lang}
            data-op={name}
            data-lang={lang}
            aria-label={`${label} (${lang.toUpperCase()})`}
            defaultValue={valueOf(operator, name, lang)}
            placeholder={`${lang.toUpperCase()} — ${hintOf(template, name, lang)}`}
          />
        ))}
      </div>
    </div>
  );
}
