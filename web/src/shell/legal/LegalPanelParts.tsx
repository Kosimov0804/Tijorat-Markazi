import { formatRecordDay } from "./panelData";
import type { ConsentRecord, RightsRequest } from "./panelData";
import type { PanelTranslate } from "./LegalPanel";
import type { PanelTextKey } from "./panelText";

const KIND_TEXT: Record<string, PanelTextKey | undefined> = {
  access: "k_access",
  withdraw: "k_withdraw",
  erase: "k_erase",
};

const STATUS_TEXT: Record<string, PanelTextKey | undefined> = {
  open: "s_open",
  answered: "s_answered",
  refused: "s_refused",
};

export function ConsentBlock({ consent, text }: { consent: ConsentRecord | null; text: PanelTranslate }) {
  if (!consent) return <p>{text("consent_no")}</p>;
  return (
    <p>
      {text("consent_on")} <b>{formatRecordDay(consent.at)}</b> · {text("consent_ver")}{" "}
      <code>{consent.version || "—"}</code>
    </p>
  );
}

/* A kind or status the panel has no word for is shown as the server named it. */
export function RequestsTable({ requests, text }: { requests: readonly RightsRequest[]; text: PanelTranslate }) {
  const label = (names: Record<string, PanelTextKey | undefined>, value: string): string => {
    const key = Object.hasOwn(names, value) ? names[value] : undefined;
    return key ? text(key) : value;
  };
  return (
    <div className="lg-tablewrap">
      <table className="lg-table">
        <thead>
          <tr>
            <th>{text("c_ref")}</th>
            <th>{text("c_kind")}</th>
            <th>{text("c_status")}</th>
            <th>{text("c_due")}</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request, index) => (
            <tr key={`${request.ref}|${index}`}>
              <td>
                <code>{request.ref}</code>
              </td>
              <td>{label(KIND_TEXT, request.kind)}</td>
              <td>
                {label(STATUS_TEXT, request.status)}
                {request.answer && <div className="ac-label">{request.answer}</div>}
              </td>
              <td>{formatRecordDay(request.due)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
