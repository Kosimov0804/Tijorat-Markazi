import { REF } from "../engine/engine";
import type { RoutingStatus } from "../engine/types";
import { useKit } from "../kit";

const TIER_CLASS: Readonly<Record<string, string | undefined>> = {
  tayyor: "is-tayyor",
  shartli: "is-shartli",
  qayta_ishlash: "is-qayta",
  rad_etilgan: "is-rad",
  knockout: "is-knockout",
};

export const tierClass = (status: Pick<RoutingStatus, "status"> | null | undefined): string =>
  (status && TIER_CLASS[status.status]) || "is-rad";

/* Class names are built only from ids the methodology knows; anything else
   the server sends still shows as text but gets no class of its own. */
const knownId = (id: string): string => (/^[a-z_]+$/.test(id) ? id : "draft");

export function RoutingBadge({ status }: { status: RoutingStatus | null | undefined }) {
  const { label } = useKit();
  if (!status) return null;
  return (
    <span className={`ms-badge ${tierClass(status)}`}>
      <i />
      {label(status)}
    </span>
  );
}

export function StatusBadge({ status }: { status: string | undefined }) {
  const { refName } = useKit();
  return <span className={`ms-status is-${knownId(status || "draft")}`}>{refName(REF.projectStatuses, status) || status || ""}</span>;
}

export function TypeBadge({ type }: { type: string | undefined }) {
  const { refName } = useKit();
  const isStartup = type === "startup";
  return (
    <span className={isStartup ? "ms-type is-startup" : "ms-type"}>
      {refName(REF.projectTypes, isStartup ? "startup" : "company")}
    </span>
  );
}
