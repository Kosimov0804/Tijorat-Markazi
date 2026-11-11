import type { Project, Track } from "../../engine/types";
import { useKit } from "../../kit";
import { LAST_STEP, isStartup, stepLabelKeys } from "./logic";
import type { Edit } from "./logic";
import { StepDueDiligence } from "./StepDueDiligence";
import { StepHistory } from "./StepHistory";
import { StepModel } from "./StepModel";
import { StepPassport } from "./StepPassport";
import { StepStartupLegal, StepStartupProfile } from "./StepStartup";

/* The buttons are DIRECT children of .ms-stepper: the connecting line is
   drawn with an adjacent-sibling rule and breaks if they are wrapped. */
function Stepper({ labels, current, onJump }: { labels: readonly string[]; current: number; onJump: (step: number) => void }) {
  return (
    <nav className="ms-stepper" aria-label={labels.join(" · ")}>
      {labels.map((label, index) => {
        const step = index + 1;
        const state = step < current ? "is-done" : step === current ? "is-now" : "is-todo";
        return (
          <button
            key={step}
            type="button"
            className={`ms-step ${state}`}
            data-ms-step={step}
            aria-current={step === current ? "step" : undefined}
            onClick={() => onJump(step)}
          >
            <span className="ms-step-n">{step < current ? "✓" : step}</span>
            <span className="ms-step-t">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export type WizardProps = {
  track: Track;
  draft: Project;
  step: number;
  /** Dictionary keys of what is still missing. */
  errors: readonly string[];
  /** Changes whenever the boxes must be rebuilt from the working copy. */
  formVersion: number;
  onEdit: (edit: Edit) => void;
  onRestructure: (edit: Edit) => void;
  onJump: (step: number) => void;
  onBack: () => void;
  onSave: (isFinishing: boolean) => void;
};

function StepBody({ track, draft, step, onEdit, onRestructure }: Pick<WizardProps, "track" | "draft" | "step" | "onEdit" | "onRestructure">) {
  const props = { project: draft, onEdit };
  if (step === 1) return <StepPassport {...props} track={track} />;
  if (step === 2) return isStartup(draft) ? <StepStartupProfile {...props} /> : <StepHistory {...props} />;
  if (step === 3) return <StepModel {...props} onRestructure={onRestructure} />;
  return isStartup(draft) ? <StepStartupLegal {...props} /> : <StepDueDiligence {...props} />;
}

/** The four-step form. It never talks to the server; saving is the controller's job. */
export function Wizard(props: WizardProps) {
  const { draft, step, errors, formVersion, onJump, onBack, onSave } = props;
  const { t } = useKit();
  const labels = stepLabelKeys(draft).map(key => t(key));
  const position = t("ms_wiz_step_of").replace("{n}", String(step)).replace("{total}", String(labels.length));

  return (
    <>
      <div className="ms-head">
        <div>
          <h2>{draft.passport.nomi || t("ms_wiz_new")}</h2>
          <p className="mk-sub">
            {position} · {labels[step - 1]}
          </p>
        </div>
        <div className="mk-actions">
          <button type="button" className="btn btn-ghost" id="ms-back" onClick={onBack}>
            {t("ms_back_list")}
          </button>
        </div>
      </div>
      <Stepper labels={labels} current={step} onJump={onJump} />
      <div className="mk-card ms-wizard">
        {errors.length > 0 && (
          <div className="mk-msg is-err">
            <b>{t("ms_wiz_errors")}</b>
            <ul>
              {errors.map(key => (
                <li key={key}>{t(key)}</li>
              ))}
            </ul>
          </div>
        )}
        <div id="ms-wiz-body" key={`${step}:${formVersion}`}>
          <StepBody {...props} />
        </div>
        <div className="ms-wiz-foot">
          <button type="button" className="btn btn-ghost" id="ms-prev" disabled={step === 1} onClick={() => onJump(step - 1)}>
            {t("ms_wiz_back")}
          </button>
          <div className="mk-actions">
            <button type="button" className="btn btn-ghost" id="ms-draft" onClick={() => onSave(false)}>
              {t("ms_wiz_draft")}
            </button>
            {step < LAST_STEP ? (
              <button type="button" className="btn btn-primary" id="ms-next" onClick={() => onJump(step + 1)}>
                {t("ms_wiz_next")}
              </button>
            ) : (
              <button type="button" className="btn btn-primary" id="ms-finish" onClick={() => onSave(true)}>
                {t("ms_wiz_finish")}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
