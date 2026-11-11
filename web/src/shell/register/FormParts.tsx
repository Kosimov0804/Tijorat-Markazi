import { useState } from "react";
import type { ReactNode } from "react";
import type { Translate } from "../market/mk";
import { trustedHtml } from "../trustedHtml";
import { LOGIN_RULE } from "./registerApi";

type FieldProps = {
  id: string;
  label: string;
  isWide?: boolean;
  /** The control, and any hint under it. */
  children: ReactNode;
};

export function Field({ id, label, isWide, children }: FieldProps) {
  return (
    <div className={isWide ? "mk-f wide" : "mk-f"}>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

/** The key, not the text, so the message follows a language switch. */
export type FormNotice = { key: string; kind: "ok" | "err" };

export function FormMessage({ id, notice, t }: { id: string; notice: FormNotice | null; t: Translate }) {
  return (
    <p className={notice ? `mk-msg is-${notice.kind}` : "mk-msg"} id={id} hidden={!notice}>
      {notice && t(notice.key)}
    </p>
  );
}

type AccountFieldsProps = {
  /** "rg" on the company form, "br" on the buyer form: the legacy element ids. */
  prefix: string;
  /** Changing it empties the login, which React holds, along with the form. */
  resetKey: number;
  t: Translate;
};

export function AccountFields({ prefix, resetKey, t }: AccountFieldsProps) {
  return (
    <>
      <h3 className="rg-legend">{t("rg_leg_login")}</h3>
      <p className="mk-note">{t("rg_login_note")}</p>
      <div className="mk-form">
        <LoginField key={resetKey} prefix={prefix} t={t} />
        <Field id={`${prefix}Pass`} label={t("rg_f_pass")}>
          <input
            id={`${prefix}Pass`}
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
          />
          <small>{t("rg_pass_hint")}</small>
        </Field>
        <Field id={`${prefix}Pass2`} label={t("rg_f_pass2")} isWide>
          <input id={`${prefix}Pass2`} name="passwordRepeat" type="password" required autoComplete="new-password" />
        </Field>
      </div>
    </>
  );
}

/* Logins are lower-case everywhere, so the field lowers them as they are typed
   and its hint turns red while the value breaks the rule. */
function LoginField({ prefix, t }: { prefix: string; t: Translate }) {
  const [login, setLogin] = useState("");
  const isBad = login !== "" && !LOGIN_RULE.test(login);
  return (
    <Field id={`${prefix}Login`} label={t("rg_f_login")}>
      <input
        id={`${prefix}Login`}
        name="login"
        required
        autoComplete="username"
        spellCheck={false}
        value={login}
        onChange={event => setLogin(event.target.value.toLowerCase())}
      />
      <small id={`${prefix}LoginHint`} className={isBad ? "is-bad" : undefined}>
        {t("rg_login_hint")}
      </small>
    </Field>
  );
}

type ConsentRowProps = {
  id: string;
  /** A key of the bundled dictionary; its text carries the two document links. */
  textKey: string;
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
  t: Translate;
};

export function ConsentRow({ id, textKey, isChecked, onChange, t }: ConsentRowProps) {
  return (
    <label className="rg-consent">
      <input
        type="checkbox"
        id={id}
        required
        checked={isChecked}
        onChange={event => onChange(event.target.checked)}
      />
      <span dangerouslySetInnerHTML={trustedHtml(t(textKey))} />
    </label>
  );
}
