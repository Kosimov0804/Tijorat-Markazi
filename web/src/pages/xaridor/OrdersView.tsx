import type { FormEvent } from "react";
import { dialogs } from "../../shell/dialogs";
import { useI18n } from "../../shell/i18n";
import { Empty, formatDay, formatMoney, formValues, OptionSelect, Rail } from "../../shell/market";
import type { Translate } from "../../shell/market";
import { buyerPost } from "./types";
import type { Cabinet, Deal, Note } from "./types";

const NOTES_SHOWN = 4;

export function NoteLines({ notes, authorOf }: { notes: readonly Note[]; authorOf: (note: Note) => string }) {
  const { lang } = useI18n();
  return (
    <div className="rq-about">
      {notes.map((note, index) => (
        <p key={`${note.t}|${index}`}>
          <b>{authorOf(note)}</b> · {formatDay(note.t, lang)}
          <br />
          {note.text}
        </p>
      ))}
    </div>
  );
}

function DealFacts({ deal, t }: { deal: Deal; t: Translate }) {
  const { lang } = useI18n();
  return (
    <>
      <dl className="rq-kv">
        <dt>{t("xr_seller")}</dt>
        <dd>{deal.sellerName}</dd>
        <dt>{t("xr_or_value")}</dt>
        <dd>{formatMoney(deal.value, deal.currency, lang)}</dd>
        {deal.nextAction && (
          <>
            <dt>{t("xr_or_next")}</dt>
            <dd>{deal.nextAction}</dd>
          </>
        )}
      </dl>
      {deal.risks.length > 0 && (
        <div className="mk-assume">
          <b>{t("xr_or_risks")}</b>
          <ul>
            {deal.risks.map((risk, index) => (
              <li key={`${risk}|${index}`}>{risk}</li>
            ))}
          </ul>
        </div>
      )}
      {deal.notes.length > 0 && <NoteLines notes={deal.notes.slice(-NOTES_SHOWN)} authorOf={note => note.by} />}
    </>
  );
}

type DealCardProps = { deal: Deal; stages: readonly string[]; t: Translate; onSave: (stage: string, note: string) => void };

function DealCard({ deal, stages, t, onSave }: DealCardProps) {
  const { lang } = useI18n();
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    onSave(values.stage ?? "", (values.note ?? "").trim());
  };
  return (
    <article className={`rq-card is-${deal.stage === "closed" ? "approved" : "pending"}`}>
      <div className="rq-top">
        <span className="rq-badge">{t(`stage_${deal.stage}`, deal.stage)}</span>
        <b>{deal.title}</b>
        <span className="rq-ref">{formatDay(deal.updated, lang)}</span>
      </div>
      <Rail steps={stages} current={deal.stage} />
      <DealFacts deal={deal} t={t} />
      <form className="mk-form" onSubmit={handleSubmit}>
        <div className="mk-f">
          <label htmlFor={`xrStage-${deal.id}`}>{t("xr_or_stage")}</label>
          <OptionSelect
            id={`xrStage-${deal.id}`}
            name="stage"
            options={stages}
            labelOf={stage => t(`stage_${stage}`, stage)}
            defaultValue={deal.stage}
          />
        </div>
        <div className="mk-f wide">
          <label htmlFor={`xrNote-${deal.id}`}>{t("xr_or_note")}</label>
          <input id={`xrNote-${deal.id}`} name="note" />
        </div>
        <div className="mk-actions">
          <button className="btn btn-ghost" type="submit">
            {t("xr_or_send")}
          </button>
        </div>
      </form>
    </article>
  );
}

/** What happens after a quote is accepted. */
export function OrdersView({ cabinet, t }: { cabinet: Cabinet; t: Translate }) {
  const { deals, stages } = cabinet.home;

  const saveDeal = async (id: string, stage: string, note: string): Promise<void> => {
    const answer = await buyerPost("/api/buyer/deal/update", cabinet.credentials, { id, stage, note });
    if (!answer.ok) {
      void dialogs.alert(t("xr_e_forbidden"));
      return;
    }
    await cabinet.refresh();
  };

  return (
    <div className="panel co-panel">
      <div className="co-panel-head">
        <span className="co-ic">📦</span>
        <h2>{t("xr_v_orders")}</h2>
      </div>
      <div className="rq-list">
        {deals.length ? (
          deals.map(deal => (
            /* The key follows the saved state, so a saved card starts with a fresh form. */
            <DealCard
              key={`${deal.id}|${deal.stage}|${deal.updated}|${deal.notes.length}`}
              deal={deal}
              stages={stages}
              t={t}
              onSave={(stage, note) => void saveDeal(deal.id, stage, note)}
            />
          ))
        ) : (
          <Empty>{t("xr_or_empty")}</Empty>
        )}
      </div>
    </div>
  );
}
