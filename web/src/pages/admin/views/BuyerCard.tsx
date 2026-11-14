import { mailHref, phoneHref } from "../../../shell/cabinet";
import { classToken, localDateTime } from "../parts";
import type { AdminTextKey } from "../text";
import { isTextKey, useText } from "../useText";

export interface BuyerApplication {
  id: string;
  status: string;
  name: string;
  ref: string;
  about: string;
  login: string;
  contactName: string;
  role: string;
  region: string;
  created: unknown;
  decided: unknown;
  decidedBy: string;
  phone: string;
  email: string;
  contactPhone: string;
  reason: string;
}

type BuyerCardProps = {
  application: BuyerApplication;
  isBusy: boolean;
  onDecide: (action: "approve" | "reject") => void;
};

export function BuyerCard({ application, isBusy, onDecide }: BuyerCardProps) {
  const { tx } = useText();
  const statusKey = `bq_${application.status}`;
  const phone = phoneHref(application.phone);
  const contactPhone = phoneHref(application.contactPhone);
  const mail = mailHref(application.email);
  const contact = [application.contactName, application.role].filter(Boolean).join(" · ");

  return (
    <article className={`rq-card is-${classToken(application.status)}`}>
      <div className="rq-top">
        <span className="rq-badge">{isTextKey(statusKey) ? tx(statusKey) : application.status}</span>
        <b>{application.name}</b>
        <span className="rq-ref">{application.ref}</span>
      </div>
      {application.about && <p className="rq-about">{application.about}</p>}
      <dl className="rq-kv">
        <Pair textKey="bq_login" value={application.login} />
        <Pair textKey="bq_contact" value={contact} />
        <Pair textKey="bq_region" value={application.region} />
        <dt>{tx("bq_sent")}</dt>
        <dd>{localDateTime(application.created)}</dd>
        {Boolean(application.decided) && (
          <>
            <dt>{tx("bq_decided")}</dt>
            <dd>
              {localDateTime(application.decided)} · {application.decidedBy}
            </dd>
          </>
        )}
      </dl>
      <div className="rq-contact">
        {phone && <a href={phone}>🏢 {application.phone}</a>}
        {application.email &&
          (mail ? <a href={mail}>✉ {application.email}</a> : <span>✉ {application.email}</span>)}
        {contactPhone && <a href={contactPhone}>📞 {application.contactPhone}</a>}
      </div>
      {application.reason && (
        <p className="rq-reason">
          {tx("bq_reason")}: {application.reason}
        </p>
      )}
      {application.status === "pending" && (
        <div className="rq-actions">
          <button className="btn btn-primary" type="button" disabled={isBusy} onClick={() => onDecide("approve")}>
            {tx("bq_approve")}
          </button>
          <button className="btn btn-ghost" type="button" disabled={isBusy} onClick={() => onDecide("reject")}>
            {tx("bq_reject")}
          </button>
        </div>
      )}
    </article>
  );
}

function Pair({ textKey, value }: { textKey: AdminTextKey; value: string }) {
  const { tx } = useText();
  if (!value) return null;
  return (
    <>
      <dt>{tx(textKey)}</dt>
      <dd>{value}</dd>
    </>
  );
}
