import { useState } from "react";
import { T_REGISTER } from "@legacy/markets-i18n.js";
import { useMarketText } from "../../shell/market/mk";
import { PublicPage } from "../../shell/PublicPage";
import { DoneCard } from "../../shell/register/DoneCard";
import { isRecord } from "../../shell/register/registerApi";
import type { Application } from "../../shell/register/registerApi";
import { StatusCheck } from "../../shell/register/StatusCheck";
import type { StatusQuery } from "../../shell/register/StatusCheck";
import { trustedHtml } from "../../shell/trustedHtml";
import { useApiJson } from "../../shell/useApiJson";
import type { ApiState } from "../../shell/useApiJson";
import { CompanyForm } from "./CompanyForm";
import type { Association, RegisterMeta } from "./CompanyForm";

/* Company registration, applicant side. The form creates an application, never
   an account: the chosen association approves it, and only then does a cabinet
   exist. That is why the page ends on a reference number. */

const STEP_KEYS = ["rg_s1", "rg_s2", "rg_s3"] as const;

function readAssociation(value: unknown): Association | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  const names = isRecord(value.i18n) ? value.i18n : {};
  const pick = (lang: string): string | undefined => (typeof names[lang] === "string" ? names[lang] : undefined);
  return {
    id: value.id,
    name: typeof value.name === "string" ? value.name : "",
    i18n: { uz: pick("uz"), ru: pick("ru"), en: pick("en") },
  };
}

function readMeta(state: ApiState<unknown>): RegisterMeta {
  if (state.status === "loading") return undefined;
  if (state.status === "error" || !isRecord(state.data) || !state.data.ok) return null;
  const { associations, sectors } = state.data;
  return {
    associations: (Array.isArray(associations) ? associations : [])
      .map(readAssociation)
      .filter(association => association !== null),
    sectors: (Array.isArray(sectors) ? sectors : []).filter(sector => typeof sector === "string"),
  };
}

export function RoyxatdanOtishPage() {
  const t = useMarketText(T_REGISTER);
  const meta = readMeta(useApiJson<unknown>("/api/register/meta"));
  const [done, setDone] = useState<Application | null>(null);
  const [statusQuery, setStatusQuery] = useState<StatusQuery>({ ref: "", email: "" });

  const handleDone = (application: Application, email: string) => {
    setDone(application);
    /* Pre-filled, so the status checker is one click away. */
    setStatusQuery({ ref: application.ref, email: application.email || email });
  };

  return (
    <PublicPage hasSessionActions={false}>
      <main>
        <section className="mk-hero">
          <div className="container mk-hero-inner">
            <div>
              <div className="mk-index" aria-hidden="true">
                00
              </div>
              <span className="eyebrow">{t("rg_eyebrow")}</span>
              <h1 dangerouslySetInnerHTML={trustedHtml(t("rg_h1"))} />
              <p className="lead">{t("rg_lead")}</p>
              <p className="rg-have">
                <a className="btn btn-ghost" href="kirish.html">
                  {t("rg_have_account")}
                </a>
              </p>
            </div>
            <div className="mk-hero-side">
              <div className="rg-steps">
                {STEP_KEYS.map((key, index) => (
                  <div key={key}>
                    <b>{index + 1}</b>
                    <span>{t(key)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container mk-split">
            <CompanyForm meta={meta} onDone={handleDone} t={t} />
            <aside className="mk-stack">
              <DoneCard
                prefix="rg"
                application={done}
                lead={t("rg_done_p").replace("{assoc}", done?.assocName ?? "")}
                rows={
                  done
                    ? [
                        [t("rg_f_name"), done.name],
                        [t("rg_f_assoc"), done.assocName],
                        [t("rg_f_login"), done.login],
                        [t("rg_status"), t(`rg_st_${done.status}`)],
                      ]
                    : []
                }
                t={t}
              />
              <StatusCheck
                prefix="rg"
                variant="company"
                query={statusQuery}
                onQueryChange={setStatusQuery}
                t={t}
              />
              <div className="rg-card">
                <h2>{t("rg_buyer_q")}</h2>
                <p className="mk-note">
                  <a href="xaridor-royxat.html">{t("rg_buyer_go")}</a>
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}
