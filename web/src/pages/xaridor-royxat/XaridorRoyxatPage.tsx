import { useState } from "react";
import { T_BREG } from "@legacy/markets-i18n.js";
import { useMarketText } from "../../shell/market/mk";
import { PublicPage } from "../../shell/PublicPage";
import { DoneCard } from "../../shell/register/DoneCard";
import type { Application } from "../../shell/register/registerApi";
import { StatusCheck } from "../../shell/register/StatusCheck";
import type { StatusQuery } from "../../shell/register/StatusCheck";
import { trustedHtml } from "../../shell/trustedHtml";
import { BuyerForm } from "./BuyerForm";

/* Buyer registration, applicant side. The same shape as the company form next
   door, deliberately. A buyer joins no association, so the reviewer is the
   platform administrator, and it ends on a reference number, not a welcome. */

const STEP_KEYS = ["br_s1", "br_s2", "br_s3"] as const;
const BENEFIT_KEYS = ["br_why_1", "br_why_2", "br_why_3", "br_why_4"] as const;

export function XaridorRoyxatPage() {
  const t = useMarketText(T_BREG);
  const [done, setDone] = useState<Application | null>(null);
  const [statusQuery, setStatusQuery] = useState<StatusQuery>({ ref: "", email: "" });

  const handleDone = (application: Application, email: string) => {
    setDone(application);
    /* Pre-filled, so the status checker is one click away. */
    setStatusQuery({ ref: application.ref, email: application.email || email });
  };

  return (
    <PublicPage hideServices hasSessionActions={false}>
      <main>
        <section className="mk-hero">
          <div className="container mk-hero-inner">
            <div>
              <div className="mk-index" aria-hidden="true">
                00
              </div>
              <span className="eyebrow">{t("br_eyebrow")}</span>
              <h1 dangerouslySetInnerHTML={trustedHtml(t("br_h1"))} />
              <p className="lead">{t("br_lead")}</p>
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
            <BuyerForm onDone={handleDone} t={t} />
            <aside className="mk-stack">
              <DoneCard
                prefix="br"
                application={done}
                lead={t("br_done_p")}
                rows={
                  done
                    ? [
                        [t("br_l_company"), done.name],
                        [t("rg_f_login"), done.login],
                        [t("rg_status"), t(`rg_st_${done.status}`)],
                      ]
                    : []
                }
                t={t}
              />
              <div className="rg-card">
                <h2>{t("br_why_h")}</h2>
                <ul className="mk-checks">
                  {BENEFIT_KEYS.map(key => (
                    <li key={key}>{t(key)}</li>
                  ))}
                </ul>
              </div>
              <StatusCheck prefix="br" variant="buyer" query={statusQuery} onQueryChange={setStatusQuery} t={t} />
              <div className="rg-card">
                <h2>{t("br_seller_q")}</h2>
                <p className="mk-note">
                  <a href="royxatdan-otish.html">{t("br_seller_go")}</a>
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </PublicPage>
  );
}
