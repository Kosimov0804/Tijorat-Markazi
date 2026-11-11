import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useI18n } from "../i18n";
import { formatDay } from "../market/mk";
import type { Translate } from "../market/mk";
import { Field } from "./FormParts";
import { readApplication, registerApi } from "./registerApi";
import type { Application } from "./registerApi";

export type StatusQuery = { ref: string; email: string };

type StatusCheckProps = {
  /** "rg" or "br": the legacy element ids. */
  prefix: string;
  /** The company page names the association; the buyer page has none to name. */
  variant: "company" | "buyer";
  /** Held by the page, which fills it in after a successful application. */
  query: StatusQuery;
  onQueryChange: (query: StatusQuery) => void;
  t: Translate;
};

type Outcome =
  | { status: "idle" | "loading" | "incomplete" | "missing" }
  | { status: "found"; application: Application };

const statusTone = (status: string): string =>
  status === "approved" ? "good" : status === "rejected" ? "bad" : "warn";

function StatusResult({ application, variant, t }: { application: Application; variant: string; t: Translate }) {
  const { lang } = useI18n();
  /* One checker, two kinds of application: on the buyer page an approved
     applicant goes to the cabinet they earned, not the one this page is about. */
  const isBuyer = variant === "buyer" && application.kind === "buyer";
  return (
    <div className={`rg-status is-${statusTone(application.status)}`}>
      <b>{t(`rg_st_${application.status}`)}</b>
      <dl className="mk-kv">
        <dt>{t(variant === "buyer" ? "br_l_company" : "rg_f_name")}</dt>
        <dd>{application.name}</dd>
        {variant === "company" && (
          <>
            <dt>{t("rg_f_assoc")}</dt>
            <dd>{application.assocName}</dd>
          </>
        )}
        <dt>{t("rg_sent")}</dt>
        <dd>{formatDay(application.created, lang)}</dd>
        {application.decided > 0 && (
          <>
            <dt>{t("rg_decided")}</dt>
            <dd>{formatDay(application.decided, lang)}</dd>
          </>
        )}
      </dl>
      {application.reason && (
        <p className="rg-reason">
          {t("rg_reason")}: {application.reason}
        </p>
      )}
      {application.status === "approved" && (
        <a className="btn btn-primary" href={isBuyer ? "xaridor.html" : "company.html"}>
          {t(isBuyer ? "br_go_cabinet" : "rg_go_cabinet")}
        </a>
      )}
    </div>
  );
}

export function StatusCheck({ prefix, variant, query, onQueryChange, t }: StatusCheckProps) {
  const [outcome, setOutcome] = useState<Outcome>({ status: "idle" });
  const latestCheck = useRef(0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const ref = query.ref.trim();
    const email = query.email.trim();
    if (!ref || !email) {
      setOutcome({ status: "incomplete" });
      return;
    }
    const run = ++latestCheck.current;
    setOutcome({ status: "loading" });
    const answer = await registerApi("/api/register/status", { ref, email });
    if (run !== latestCheck.current) return;
    const application = answer.ok ? readApplication(answer.application) : null;
    setOutcome(application ? { status: "found", application } : { status: "missing" });
  };

  return (
    <form className="rg-card" id={`${prefix}StatusForm`} onSubmit={handleSubmit}>
      <h2>{t("rg_status_h")}</h2>
      <p className="mk-note">{t("rg_status_p")}</p>
      <div className="mk-form">
        <Field id={`${prefix}Ref`} label={t("rg_f_ref")}>
          <input
            id={`${prefix}Ref`}
            placeholder="TM-XXXX-XXXX"
            spellCheck={false}
            value={query.ref}
            onChange={event => onQueryChange({ ...query, ref: event.target.value })}
          />
        </Field>
        <Field id={`${prefix}StEmail`} label={t("rg_f_email")}>
          <input
            id={`${prefix}StEmail`}
            type="email"
            value={query.email}
            onChange={event => onQueryChange({ ...query, email: event.target.value })}
          />
        </Field>
      </div>
      <div className="mk-actions">
        <button className="btn btn-ghost" type="submit">
          {t("rg_status_btn")}
        </button>
      </div>
      <div id={`${prefix}StatusOut`}>
        {outcome.status === "loading" && <p className="mk-loading">{t("mk_loading", "Yuklanmoqda…")}</p>}
        {outcome.status === "incomplete" && <p className="mk-msg is-err">{t("rg_e_status")}</p>}
        {outcome.status === "missing" && <p className="mk-msg is-err">{t("rg_e_notfound")}</p>}
        {outcome.status === "found" && <StatusResult application={outcome.application} variant={variant} t={t} />}
      </div>
    </form>
  );
}
