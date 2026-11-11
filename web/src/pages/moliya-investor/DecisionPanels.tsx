import { useState } from "react";
import { StatusBadge } from "../moliya-shared/atoms/Badges";
import { useKit } from "../moliya-shared/kit";
import type { Dossier } from "./data";
import { INTEREST_STATES, InterestChip } from "./Inbox";
import type { InlineMessage } from "./useInvestor";

const NOTE_MAX_LENGTH = 1000;

/** The result line under a panel; hidden until there is something to say. */
export function PanelMessage({ id, target, inline }: { id?: string; target: string; inline: InlineMessage | null }) {
  const { t } = useKit();
  const message = inline?.target === target ? inline : null;
  return (
    <p className={`mk-msg is-${message?.kind ?? "ok"}`} id={id} data-msi-msg={id ? undefined : target} hidden={!message}>
      {message && (message.key ? t(message.key) : message.raw)}
    </p>
  );
}

type ExpertPanelProps = { dossier: Dossier; inline: InlineMessage | null; onStatus: (target: string, comment: string) => void };

/**
 * The expert moves the platform's OFFICIAL status; an institution only marks
 * interest. The buttons follow the server's transitions: submitted -> review
 * -> approved or rejected. In any other status there is nothing to press.
 */
export function ExpertPanel({ dossier, inline, onStatus }: ExpertPanelProps) {
  const { t } = useKit();
  const [comment, setComment] = useState("");
  const { status } = dossier.project;
  const action = (id: string, label: string, target: string, tone: string) => (
    <button type="button" className={`btn ${tone}`} id={id} onClick={() => onStatus(target, comment)}>
      {label}
    </button>
  );
  const hasActions = status === "submitted" || status === "review";
  return (
    <div className="mk-card msi-panel">
      <div className="ms-sec">
        <h3>{t("msi_exp_title")}</h3>
        <p>{t("msi_exp_sub")}</p>
      </div>
      <p className="mk-note">
        {t("msi_exp_current")} <StatusBadge status={status} />
      </p>
      {hasActions ? (
        <>
          <label className="mk-f">
            <span>{t("msi_exp_note")}</span>
            <textarea className="ms-in" id="msi-st-note" rows={3} value={comment} onChange={event => setComment(event.target.value)} />
          </label>
          <div className="mk-actions">
            {status === "submitted" && action("msi-st-review", t("ms_act_review"), "review", "btn-primary")}
            {status === "review" && action("msi-st-approve", t("ms_act_approve"), "approved", "btn-primary")}
            {status === "review" && action("msi-st-reject", t("ms_act_reject"), "rejected", "btn-ghost")}
          </div>
        </>
      ) : (
        <p className="mk-note">{t("msi_exp_final")}</p>
      )}
      <PanelMessage id="msi-st-msg" target="status" inline={inline} />
    </div>
  );
}

type InterestPanelProps = {
  dossier: Dossier;
  draft: { state?: string; note?: string };
  inline: InlineMessage | null;
  onPick: (state: string) => void;
  onNote: (note: string) => void;
  onSave: () => void;
};

/**
 * Three decisions and a NOTE. That the note stays private is a contract, not
 * decoration: the server never gives it to the owner, so the panel says so
 * openly, or an institution would write it as if it were a letter.
 */
export function InterestPanel({ dossier, draft, inline, onPick, onNote, onSave }: InterestPanelProps) {
  const { t, day } = useKit();
  const saved = dossier.interest;
  const picked = draft.state || saved?.state || "";
  return (
    <div className="mk-card msi-panel">
      <div className="ms-sec">
        <h3>{t("msi_int_title")}</h3>
        <p>{t("msi_int_sub")}</p>
      </div>
      <div className="msi-current">
        <span>{t("msi_int_current")}</span>
        <InterestChip interest={saved} />
        <i>{saved ? t("msi_int_updated").replace("{d}", day(saved.updated)) : t("msi_int_none")}</i>
      </div>
      <div className="msi-choices" role="group" aria-label={t("msi_int_title")}>
        {INTEREST_STATES.map(state => (
          <button
            key={state}
            type="button"
            className={`msi-choice is-${state}${picked === state ? " is-on" : ""}`}
            data-msi-state={state}
            aria-pressed={picked === state}
            onClick={() => onPick(state)}
          >
            {t(`msi_int_${state}`)}
          </button>
        ))}
      </div>
      <div className="msi-seal">
        <b>{t("msi_int_private")}</b>
        <p>{t("msi_int_private_sub")}</p>
      </div>
      <div className="mk-f msi-note">
        <label htmlFor="msi-note">{t("msi_int_note")}</label>
        <textarea
          id="msi-note"
          maxLength={NOTE_MAX_LENGTH}
          placeholder={t("msi_int_note_ph")}
          value={draft.note ?? saved?.note ?? ""}
          onChange={event => onNote(event.target.value)}
        />
      </div>
      <div className="mk-actions">
        <button type="button" className="btn btn-primary" id="msi-save-interest" onClick={onSave}>
          {t("msi_int_save")}
        </button>
      </div>
      <PanelMessage id="msi-int-msg" target="interest" inline={inline} />
    </div>
  );
}
