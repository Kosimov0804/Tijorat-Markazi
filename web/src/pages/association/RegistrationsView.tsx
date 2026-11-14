import { useCallback, useEffect, useState } from "react";
import { cabinetPost, classToken, formatDateTime, mailHref, phoneHref, webHref } from "../../shell/cabinet";
import type { CabinetCredentials } from "../../shell/cabinet";
import { dialogs } from "../../shell/dialogs";
import { useI18n } from "../../shell/i18n";
import { amount, listOf, record, text } from "../../shell/market/narrow";
import type { AssocTextKey } from "./text";
import type { AssocText, ViewProps } from "./types";

type Application = {
  id: string;
  status: string;
  name: string;
  ref: string;
  about: string;
  login: string;
  contactName: string;
  role: string;
  sector: string;
  region: string;
  tin: string;
  created: string | number;
  email: string;
  phone: string;
  website: string;
  reason: string;
};
type Listing = { pending: number; items: Application[] };
type Tab = "pending" | "approved" | "rejected" | "all";

const TABS: readonly { id: Tab; label: AssocTextKey }[] = [
  { id: "pending", label: "rq_pending" },
  { id: "approved", label: "rq_approved" },
  { id: "rejected", label: "rq_rejected" },
  { id: "all", label: "rq_all" },
];
const STATUS_KEY: Readonly<Record<string, AssocTextKey | undefined>> = {
  pending: "rq_pending",
  approved: "rq_approved",
  rejected: "rq_rejected",
};

function parseApplication(value: unknown): Application {
  const item = record(value);
  const field = (key: string): string => text(item[key]);
  return {
    id: field("id"),
    status: field("status"),
    name: field("name"),
    ref: field("ref"),
    about: field("about"),
    login: field("login"),
    contactName: field("contactName"),
    role: field("role"),
    sector: field("sector"),
    region: field("region"),
    tin: field("tin"),
    created: typeof item.created === "number" ? item.created : field("created"),
    email: field("email"),
    phone: field("phone"),
    website: field("website"),
    reason: field("reason"),
  };
}

/** One page of applications, or null when the request failed. "" lists every status. */
export async function fetchRegistrations(credentials: CabinetCredentials, status: string): Promise<Listing | null> {
  const answer = await cabinetPost("/api/register/list", credentials, { status });
  if (!answer.body.ok) return null;
  return { pending: amount(record(answer.body.counts).pending), items: listOf(answer.body.items, parseApplication) };
}

type CardProps = { application: Application; at: AssocText; onDecide: (isApproved: boolean) => Promise<void> };

function Contacts({ application }: { application: Application }) {
  const mail = mailHref(application.email);
  const phone = phoneHref(application.phone);
  const site = webHref(application.website);
  return (
    <div className="rq-contact">
      {application.email && (mail ? <a href={mail}>✉ {application.email}</a> : <span>✉ {application.email}</span>)}
      {phone && <a href={phone}>📞 {application.phone}</a>}
      {application.website &&
        (site ? (
          <a href={site} target="_blank" rel="noopener noreferrer">
            🔗 {application.website}
          </a>
        ) : (
          <span>🔗 {application.website}</span>
        ))}
    </div>
  );
}

function ApplicationCard({ application, at, onDecide }: CardProps) {
  const { lang } = useI18n();
  const [isBusy, setIsBusy] = useState(false);
  const facts: [AssocTextKey, string][] = [
    ["rq_login", application.login],
    ["rq_contact", [application.contactName, application.role].filter(Boolean).join(" · ")],
    ["rq_sector", application.sector],
    ["rq_region", application.region],
    ["rq_tin", application.tin],
    ["rq_sent", formatDateTime(application.created, lang)],
  ];
  const decide = async (isApproved: boolean): Promise<void> => {
    if (isBusy) return;
    setIsBusy(true);
    await onDecide(isApproved);
    setIsBusy(false);
  };
  const statusKey = STATUS_KEY[application.status];

  return (
    <article className={`rq-card is-${classToken(application.status)}`}>
      <div className="rq-top">
        <span className="rq-badge">{statusKey ? at(statusKey) : application.status}</span>
        <b>{application.name}</b>
        <span className="rq-ref">{application.ref}</span>
      </div>
      {application.about && <p className="rq-about">{application.about}</p>}
      <dl className="rq-kv">
        {facts.map(([key, value]) => (key === "rq_sent" || value ? [<dt key={key}>{at(key)}</dt>, <dd key={`${key}-v`}>{value}</dd>] : null))}
      </dl>
      <Contacts application={application} />
      {application.reason && (
        <p className="rq-reason">
          {at("rq_reason")}: {application.reason}
        </p>
      )}
      {application.status === "pending" && (
        <div className="rq-actions">
          <button className="btn btn-primary" type="button" disabled={isBusy} onClick={() => void decide(true)}>
            {at("rq_approve")}
          </button>
          <button className="btn btn-ghost" type="button" disabled={isBusy} onClick={() => void decide(false)}>
            {at("rq_reject")}
          </button>
        </div>
      )}
    </article>
  );
}

type RegistrationsProps = ViewProps & { onPending: (count: number) => void };
type ListState = { status: "loading" | "failed" } | { status: "ready"; listing: Listing };

/* Companies applying to join this association. Approving one is what creates
   its account, so the confirmation step is real. */
export function RegistrationsView({ credentials, at, onPending }: RegistrationsProps) {
  const [tab, setTab] = useState<Tab>("pending");
  const [state, setState] = useState<ListState>({ status: "loading" });

  const load = useCallback(async (): Promise<void> => {
    const listing = await fetchRegistrations(credentials, tab === "all" ? "" : tab);
    setState(listing ? { status: "ready", listing } : { status: "failed" });
    if (listing) onPending(listing.pending);
  }, [credentials, tab, onPending]);

  useEffect(() => {
    setState({ status: "loading" });
    void load();
  }, [load]);

  const decide = async (id: string, isApproved: boolean): Promise<void> => {
    const body: Record<string, string> = { id, action: isApproved ? "approve" : "reject" };
    if (isApproved) {
      if (!(await dialogs.confirm(at("rq_confirm")))) return;
    } else {
      /* A rejection the applicant cannot understand is worse than none, so the
         reason is required; the server refuses without one either way. */
      const reason = (await dialogs.prompt(at("rq_reason_q")))?.trim();
      if (!reason) return;
      body.reason = reason;
    }
    const answer = await cabinetPost("/api/register/decide", credentials, body);
    if (!answer.body.ok) await dialogs.alert(at("rq_fail"));
    await load();
  };

  const listing = state.status === "ready" ? state.listing : null;
  return (
    <div className="panel co-panel">
      <div className="co-panel-head">
        <span className="co-ic">📝</span>
        <h2>{at("rq_title")}</h2>
      </div>
      <p className="co-sub">{at("rq_sub")}</p>
      <div className="rq-tabs" id="rqTabs">
        {listing &&
          TABS.map(item => (
            <button
              key={item.id}
              type="button"
              className={item.id === tab ? "rq-tab is-on" : "rq-tab"}
              data-rq-tab={item.id}
              onClick={() => setTab(item.id)}
            >
              {at(item.label)}
              {item.id === "pending" && listing.pending > 0 && <> <em>{listing.pending}</em></>}
            </button>
          ))}
      </div>
      <div className="rq-list" id="rqList">
        {state.status === "loading" && <p className="co-sub">…</p>}
        {state.status === "failed" && <p className="empty-note">{at("rq_fail")}</p>}
        {listing?.items.map(application => (
          <ApplicationCard
            key={application.id}
            application={application}
            at={at}
            onDecide={isApproved => decide(application.id, isApproved)}
          />
        ))}
        {listing && !listing.items.length && <p className="empty-note">{at("rq_empty")}</p>}
      </div>
    </div>
  );
}
