import { useState } from "react";
import type { FormEvent } from "react";
import { mailHref, phoneHref } from "../../shell/cabinet";
import { Empty, formValues, Msg } from "../../shell/market";
import type { Notice, Translate } from "../../shell/market";
import { buyerPost, parseBuyer } from "./types";
import type { Buyer, Cabinet, Supplier } from "./types";
import { useSavedToggle } from "./useSavedToggle";

type ProfileViewProps = {
  cabinet: Cabinet;
  t: Translate;
  onBuyer: (buyer: Buyer) => void;
  onSaved: (suppliers: Supplier[]) => void;
};

const PROFILE_FIELDS = ["name", "phone", "contactName", "role", "contactPhone", "region", "about"] as const;

type SupplierCardProps = { supplier: Supplier; t: Translate; isBusy: boolean; onDrop: () => void };

function SupplierCard({ supplier, t, isBusy, onDrop }: SupplierCardProps) {
  /* Only a plain address or number becomes a link; anything else stays text. */
  const mail = mailHref(supplier.email);
  const dial = phoneHref(supplier.phone);
  return (
    <article className="rq-card">
      <div className="rq-top">
        <b>{supplier.name}</b>
        {supplier.sector && <span className="rq-badge">{supplier.sector}</span>}
      </div>
      <div className="rq-contact">
        {mail && <a href={mail}>✉ {supplier.email}</a>}
        {!mail && supplier.email && <span>✉ {supplier.email}</span>}
        {dial && <a href={dial}>📞 {supplier.phone}</a>}
      </div>
      <div className="rq-actions">
        <button className="btn btn-ghost" type="button" disabled={isBusy} onClick={onDrop}>
          {t("xr_sup_drop")}
        </button>
      </div>
    </article>
  );
}

function ProfileFields({ buyer, t }: { buyer: Buyer; t: Translate }) {
  const field = (id: string, name: string, labelKey: string, value: string, type = "text") => (
    <div className="mk-f">
      <label htmlFor={id}>{t(labelKey)}</label>
      <input id={id} name={name} type={type} defaultValue={value} />
    </div>
  );
  return (
    <>
      {field("xrPrName", "name", "br_f_name", buyer.name)}
      {field("xrPrPhone", "phone", "br_f_phone", buyer.phone, "tel")}
      {field("xrPrContact", "contactName", "rg_f_contact", buyer.contactName)}
      {field("xrPrRole", "role", "rg_f_role", buyer.role)}
      {field("xrPrCPhone", "contactPhone", "br_f_cphone", buyer.contactPhone, "tel")}
      {field("xrPrRegion", "region", "xr_f_region", buyer.region)}
      <div className="mk-f">
        <label htmlFor="xrPrLogin">{t("xr_pr_login")}</label>
        <input id="xrPrLogin" value={buyer.login} disabled readOnly />
      </div>
      <div className="mk-f wide">
        <label htmlFor="xrPrAbout">{t("br_f_about")}</label>
        <textarea id="xrPrAbout" name="about" rows={3} defaultValue={buyer.about} />
      </div>
    </>
  );
}

/** The organisation's details and the sellers it has shortlisted. */
export function ProfileView({ cabinet, t, onBuyer, onSaved }: ProfileViewProps) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const saved = useSavedToggle(cabinet, onSaved);
  const { buyer, saved: suppliers } = cabinet.home;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    const body = Object.fromEntries(PROFILE_FIELDS.map(name => [name, (values[name] ?? "").trim()]));
    if (!body.name || !body.phone) {
      setNotice({ key: body.name ? "xr_e_phone" : "xr_e_name", kind: "err" });
      return;
    }
    const answer = await buyerPost("/api/buyer/profile", cabinet.credentials, body);
    if (!answer.ok) {
      setNotice({ key: "xr_e_save", kind: "err" });
      return;
    }
    onBuyer(parseBuyer(answer.buyer));
    setNotice({ key: "xr_pr_saved", kind: "ok" });
  };

  return (
    <>
      <div className="panel co-panel">
        <div className="co-panel-head">
          <span className="co-ic">🏢</span>
          <h2>{t("xr_pr_h")}</h2>
        </div>
        <p className="co-sub">{t("xr_pr_sub")}</p>
        <form className="mk-form" id="xrPrForm" onSubmit={handleSubmit}>
          <ProfileFields buyer={buyer} t={t} />
          <div className="mk-actions">
            <button className="btn btn-primary" type="submit">
              {t("xr_pr_save")}
            </button>
          </div>
        </form>
        <Msg notice={notice} t={t} id="xrPrMsg" />
      </div>

      <div className="panel co-panel">
        <div className="co-panel-head">
          <span className="co-ic">⭐</span>
          <h2>{t("xr_sup_h")}</h2>
        </div>
        <div className="rq-list">
          {suppliers.length ? (
            suppliers.map(supplier => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                t={t}
                isBusy={saved.pendingId === supplier.id}
                onDrop={() => void saved.toggle(supplier.id)}
              />
            ))
          ) : (
            <Empty>{t("xr_sup_empty")}</Empty>
          )}
        </div>
      </div>
    </>
  );
}
