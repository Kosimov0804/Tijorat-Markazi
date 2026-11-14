import { useState } from "react";
import { asArray, asNumber, asString, isRecord } from "../../../shell/chat";
import { dialogs } from "../../../shell/dialogs";
import { adminPostSafe } from "../api";
import type { Body } from "../api";
import { Intro, useLoader } from "../parts";
import { useText } from "../useText";
import { BuyerCard } from "./BuyerCard";
import type { BuyerApplication } from "./BuyerCard";

/* The company queue lives in the association cabinet, because an association
   is who vouches for a company. Nobody vouches for a buyer, so this queue has
   exactly one home: here. Approving one is what creates the account, which is
   why the confirmation says so plainly and a rejection demands a reason: the
   applicant reads it on the status page. */

const TABS = ["pending", "approved", "rejected", "all"] as const;
type Tab = (typeof TABS)[number];

const TAB_KEY = { pending: "bq_pending", approved: "bq_approved", rejected: "bq_rejected", all: "bq_all" } as const;

interface BuyerQueue {
  pendingCount: number;
  items: readonly BuyerApplication[];
}

const registerPost = (path: string, body: Body): Promise<unknown> =>
  adminPostSafe(`/api/register/${path}`, { kind: "buyer", ...body });

function parseApplication(value: unknown): BuyerApplication {
  const item = isRecord(value) ? value : {};
  return {
    id: asString(item.id),
    status: asString(item.status),
    name: asString(item.name),
    ref: asString(item.ref),
    about: asString(item.about),
    login: asString(item.login),
    contactName: asString(item.contactName),
    role: asString(item.role),
    region: asString(item.region),
    created: item.created,
    decided: item.decided,
    decidedBy: asString(item.decidedBy),
    phone: asString(item.phone),
    email: asString(item.email),
    contactPhone: asString(item.contactPhone),
    reason: asString(item.reason),
  };
}

/** The queue of one tab, or "failed" when the server refused or could not be reached. */
async function loadQueue(tab: Tab): Promise<BuyerQueue | "failed"> {
  const answer = await registerPost("list", { status: tab === "all" ? "" : tab });
  if (!isRecord(answer) || !answer.ok) return "failed";
  const counts = isRecord(answer.counts) ? answer.counts : {};
  return { pendingCount: asNumber(counts.pending), items: asArray(answer.items).map(parseApplication) };
}

export function Buyers() {
  const { tx } = useText();
  const [tab, setTab] = useState<Tab>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data: queue, reload } = useLoader(() => loadQueue(tab), [tab]);

  const decide = async (id: string, action: "approve" | "reject") => {
    const decision: Record<string, unknown> = { id, action };
    if (action === "approve") {
      if (!(await dialogs.confirm(tx("bq_confirm")))) return;
    } else {
      /* A rejection the applicant cannot understand is worse than none, so
         the reason is required; the server refuses without one either way. */
      const reason = (await dialogs.prompt(tx("bq_reason_q")))?.trim();
      if (!reason) return;
      decision.reason = reason;
    }
    setBusyId(id);
    const answer = await registerPost("decide", decision);
    setBusyId(null);
    if (!isRecord(answer) || !answer.ok) return dialogs.alert(tx("bq_fail"));
    reload();
  };

  const isReady = queue !== null && queue !== "failed";

  return (
    <div className="admin-panel">
      <h2>{tx("bq_title")}</h2>
      <Intro gap={8}>{tx("bq_sub")}</Intro>
      <div className="rq-tabs" id="bqTabs">
        {isReady &&
          TABS.map(item => (
            <button
              type="button"
              key={item}
              className={`rq-tab${item === tab ? " is-on" : ""}`}
              aria-pressed={item === tab}
              onClick={() => setTab(item)}
            >
              {tx(TAB_KEY[item])}
              {item === "pending" && queue.pendingCount > 0 && <em> {queue.pendingCount}</em>}
            </button>
          ))}
      </div>
      <div className="rq-list" id="bqList">
        {queue === null && <p style={{ color: "var(--muted)" }}>…</p>}
        {queue === "failed" && <p className="empty-note">{tx("bq_fail")}</p>}
        {isReady && queue.items.length === 0 && <p className="empty-note">{tx("bq_empty")}</p>}
        {isReady &&
          queue.items.map(application => (
            <BuyerCard
              key={application.id}
              application={application}
              isBusy={busyId === application.id}
              onDecide={action => void decide(application.id, action)}
            />
          ))}
      </div>
    </div>
  );
}
