import type { CSSProperties } from "react";
import { dialogs } from "../../shell/dialogs";
import { useI18n } from "../../shell/i18n";
import { companyIdentity, formatNumber, marketJson } from "../../shell/market";
import type { Translate } from "../../shell/market";
import { REJECT_REASON_CODES } from "./parts";
import type { Application, Pipeline } from "./types";

const MAX_CARDS_PER_STAGE = 8;
const STAGE_SELECT: CSSProperties = {
  fontSize: 12.5,
  padding: "5px 8px",
  border: "1px solid var(--line)",
  borderRadius: 6,
  background: "var(--card)",
  color: "var(--ink)",
};

type PipelineBoardProps = {
  pipeline: Pipeline;
  /** Every stage an application can be moved to. */
  stages: readonly string[];
  t: Translate;
  onChanged: () => void;
};

/* One column per stage. Moving a card asks for what that stage needs: a reason
   for a rejection, a salary for an offer. */
export function PipelineBoard({ pipeline, stages, t, onChanged }: PipelineBoardProps) {
  const { lang } = useI18n();

  const move = async (application: Application, stage: string): Promise<void> => {
    let reason = "";
    if (stage === "rejected") {
      reason = (await dialogs.prompt(`${t("hc_reason_prompt")} ${REJECT_REASON_CODES}`)) ?? "";
      if (!reason) return;
    }
    const salary = stage === "offer" ? ((await dialogs.prompt(t("hc_offer_salary"))) ?? "") : "";
    const answer = await marketJson(
      "/api/mehnat/stage",
      companyIdentity.withCompany({ id: application.id, stage, reason, salary }),
    );
    if (!answer.ok) void dialogs.alert(t("hc_stage_fail"));
    onChanged();
  };

  return (
    <>
      {pipeline.stages
        .filter(stage => stage !== "withdrawn")
        .map(stage => {
          const applications = pipeline.byStage[stage] ?? [];
          return (
            <div className="mk-box w3" style={{ gap: 9 }} key={stage}>
              <h3>
                {t(`stage_${stage}`)} <span className="mk-chip">{applications.length}</span>
              </h3>
              {applications.slice(0, MAX_CARDS_PER_STAGE).map(application => (
                <div className="mk-card" style={{ padding: 12, gap: 6 }} key={application.id}>
                  <b style={{ fontSize: 14, color: "var(--ink)" }}>{application.candidateName}</b>
                  <div className="mk-meta">
                    <span>{application.vacancyTitle}</span>
                    <span>{formatNumber(application.score, lang, 0)}%</span>
                  </div>
                  <div className="mk-row">
                    <select
                      data-stage-for={application.id}
                      style={STAGE_SELECT}
                      value={application.stage}
                      onChange={event => void move(application, event.target.value)}
                    >
                      {stages.map(option => (
                        <option key={option} value={option}>
                          {t(`stage_${option}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              {!applications.length && <p className="mk-loading">—</p>}
            </div>
          );
        })}
    </>
  );
}
