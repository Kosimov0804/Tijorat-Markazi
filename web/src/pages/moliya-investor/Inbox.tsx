import { StatTile } from "../moliya-shared/apply/Dashboard";
import { RoutingBadge, StatusBadge, TypeBadge } from "../moliya-shared/atoms/Badges";
import { REF, refItem } from "../moliya-shared/engine/engine";
import type { RefItem } from "../moliya-shared/engine/types";
import { useKit } from "../moliya-shared/kit";
import { hasFilter } from "./data";
import type { Filter, Inbox as InboxData, InboxItem, Interest } from "./data";

/* An expert also sees what was rejected: it is the history of their own
   decisions. An institution does not: a rejected project is no offer to it. */
const QUEUE_STATUSES = ["submitted", "review", "approved"];
const EXPERT_STATUSES = [...QUEUE_STATUSES, "rejected"];
export const INTEREST_STATES = ["interested", "shortlist", "passed"] as const;

const statusOptions = (isInstitution: boolean): RefItem[] =>
  (isInstitution ? QUEUE_STATUSES : EXPERT_STATUSES).flatMap(id => refItem(REF.projectStatuses, id) ?? []);

/** "new" names the ABSENCE of a record; it is not a state. */
export function InterestChip({ interest }: { interest: Interest | null }) {
  const { t } = useKit();
  const state = INTEREST_STATES.find(known => known === interest?.state);
  if (!state) return <span className="msi-int is-new">{t("msi_int_new")}</span>;
  return <span className={`msi-int is-${state}`}>{t(`msi_int_${state}`)}</span>;
}

type ActorProps = { inbox: InboxData; companyName: string; onSettings: () => void };

/** Who you are looking as: an expert and an institution open the same page with different rights. */
export function ActorStrip({ inbox, companyName, onSettings }: ActorProps) {
  const { t, num } = useKit();
  if (inbox.actorKind === "guest") {
    return (
      <div className="mk-id msi-actor is-guest">
        <b>{t("msi_actor_guest")}</b>
        <span>{t("msi_actor_guest_sub")}</span>
        <a className="ms-link is-primary" href="kirish.html">
          {t("msi_actor_guest_cta")} →
        </a>
      </div>
    );
  }
  if (!inbox.isInstitution) {
    return (
      <div className="mk-id msi-actor is-expert">
        <b>{t("msi_actor_expert")}</b>
        <span>{t("msi_actor_expert_sub")}</span>
      </div>
    );
  }
  const count = inbox.institutions;
  return (
    <div className="mk-id msi-actor">
      <b>
        {t("msi_actor_inst")}
        {companyName && ` · ${companyName}`}
      </b>
      <span>{count ? t("msi_actor_registry").replace("{n}", num(count, 0)) : t("msi_actor_none")}</span>
      <button type="button" className="ms-link is-primary" id="msi-go-settings" onClick={onSettings}>
        {t("msi_nav_settings")} →
      </button>
    </div>
  );
}

type EmptyProps = { inbox: InboxData; filter: Filter; onSettings: () => void; onClear: () => void };

/* Three different empty screens say three different things: set the criteria
   up, wait for the queue, or loosen the filter. */
function EmptyState({ inbox, filter, onSettings, onClear }: EmptyProps) {
  const { t } = useKit();
  if (inbox.actorKind === "guest") {
    return (
      <div className="ms-empty msi-empty is-setup">
        <p>
          <b>{t("msi_empty_guest_title")}</b>
        </p>
        <p>{t("msi_empty_guest_sub")}</p>
        <a className="btn btn-primary" href="kirish.html">
          {t("msi_actor_guest_cta")}
        </a>
      </div>
    );
  }
  if (inbox.isInstitution && !inbox.institutions) {
    return (
      <div className="ms-empty msi-empty is-setup">
        <p>
          <b>{t("msi_empty_setup_title")}</b>
        </p>
        <p>{t("msi_empty_setup_sub")}</p>
        <button type="button" className="btn btn-primary" id="msi-empty-settings" onClick={onSettings}>
          {t("msi_empty_setup_cta")}
        </button>
      </div>
    );
  }
  if (!hasFilter(filter)) {
    /* "Nothing routed to you" for an institution, "the queue is empty" for an expert. */
    const suffix = inbox.actorKind === "expert" ? "_exp" : "";
    return (
      <div className="ms-empty msi-empty is-wait">
        <p>
          <b>{t(`msi_empty_wait_title${suffix}`)}</b>
        </p>
        <p>{t(`msi_empty_wait_sub${suffix}`)}</p>
      </div>
    );
  }
  return (
    <div className="ms-empty msi-empty">
      <p>
        <b>{t("msi_empty_filter_title")}</b>
      </p>
      <p>{t("msi_empty_filter_sub")}</p>
      <button type="button" className="ms-link" id="msi-clear" onClick={onClear}>
        {t("ms_clear_filters")}
      </button>
    </div>
  );
}

type FilterBarProps = { inbox: InboxData; filter: Filter; onFilter: (change: Partial<Filter>) => void };

function FilterBar({ inbox, filter, onFilter }: FilterBarProps) {
  const { t, num, label } = useKit();
  const refSelect = (id: string, field: keyof Filter, allLabel: string, items: readonly RefItem[]) => (
    <select id={id} aria-label={allLabel} value={filter[field]} onChange={event => onFilter({ [field]: event.target.value })}>
      <option value="">{allLabel}</option>
      {items.map(item => (
        <option key={item.id} value={item.id}>
          {label(item)}
        </option>
      ))}
    </select>
  );
  return (
    <div className="mk-filter">
      <input
        type="search"
        id="msi-q"
        value={filter.q}
        autoComplete="off"
        placeholder={t("msi_search")}
        aria-label={t("msi_search")}
        onChange={event => onFilter({ q: event.target.value })}
      />
      {refSelect("msi-status", "status", t("ms_all_statuses"), statusOptions(inbox.isInstitution))}
      {refSelect("msi-sektor", "sektor", t("ms_all_sectors"), REF.sectors)}
      {refSelect("msi-hudud", "hudud", t("msi_all_regions"), REF.regions)}
      {refSelect("msi-turi", "loyihaTuri", t("ms_all_types"), REF.projectTypes)}
      {inbox.isInstitution && (
        <select id="msi-interest" aria-label={t("msi_all_interest")} value={filter.interest} onChange={event => onFilter({ interest: event.target.value })}>
          <option value="">{t("msi_all_interest")}</option>
          {INTEREST_STATES.map(state => (
            <option key={state} value={state}>
              {t(`msi_int_${state}`)}
            </option>
          ))}
        </select>
      )}
      <MinScoreInput key={filter.minBall} value={filter.minBall} onCommit={minBall => onFilter({ minBall })} />
      <span className="mk-count">{t("msi_count").replace("{n}", num(inbox.items.length, 0))}</span>
    </div>
  );
}

/* Reloads when the value is committed, not on every digit, as a change event did. */
function MinScoreInput({ value, onCommit }: { value: string; onCommit: (value: string) => void }) {
  const { t } = useKit();
  const commit = (next: string): void => {
    if (next !== value) onCommit(next);
  };
  return (
    <input
      type="number"
      id="msi-minball"
      min="0"
      max="100"
      step="1"
      className="msi-num"
      defaultValue={value}
      placeholder={t("ms_min_score")}
      aria-label={t("ms_min_score")}
      onBlur={event => commit(event.target.value)}
      onKeyDown={event => event.key === "Enter" && commit(event.currentTarget.value)}
    />
  );
}

/* The status sits under the name, beside the type badge: as a column it made
   the table too wide to fit even at 1440px. */
function InboxRow({ item, isInstitution, onOpen }: { item: InboxItem; isInstitution: boolean; onOpen: (id: string) => void }) {
  const { t, num, money, day, sectorName, regionName } = useKit();
  const { passport } = item;
  return (
    <tr>
      <td>
        <a
          href="#"
          className="ms-rowname"
          data-msi-open={item.id}
          onClick={event => {
            event.preventDefault();
            onOpen(item.id);
          }}
        >
          {passport.nomi || t("ms_unnamed")}
        </a>
        <div className="ms-rowsub">
          <TypeBadge type={passport.loyihaTuri} />
          <StatusBadge status={item.status} />
          <span>
            {sectorName(passport)} · {regionName(passport)}
          </span>
        </div>
        <div className="ms-rowsub">
          <span>
            {t("msi_owner")}: {item.ownerName || "—"}
          </span>
        </div>
      </td>
      <td className="num">{money(passport.soralayotganSumma, passport.valyuta)}</td>
      <td className="num">{item.score == null ? "—" : <b>{num(item.score, 0)}</b>}</td>
      <td>{item.routingStatus ? <RoutingBadge status={item.routingStatus} /> : <span className="mk-note">{t("ms_not_scored")}</span>}</td>
      {isInstitution && (
        <>
          <td className="num">{t("msi_matched_n").replace("{n}", num(item.matchedProducts, 0))}</td>
          <td>
            <InterestChip interest={item.interest} />
          </td>
        </>
      )}
      <td className="num">{day(item.submitted)}</td>
      <td className="ms-rowact">
        <button type="button" className="ms-link is-primary" data-msi-open={item.id} onClick={() => onOpen(item.id)}>
          {t("msi_open")}
        </button>
      </td>
    </tr>
  );
}

function Queue({ inbox, onOpen }: { inbox: InboxData; onOpen: (id: string) => void }) {
  const { t } = useKit();
  const isInstitution = inbox.isInstitution;
  return (
    <div className="mk-tablewrap">
      <table className="mk-table msi-queue">
        <thead>
          <tr>
            <th>{t("ms_col_project")}</th>
            <th className="num">{t("ms_col_amount")}</th>
            <th className="num">{t("ms_col_score")}</th>
            <th>{t("ms_col_routing")}</th>
            {isInstitution && (
              <>
                <th className="num">{t("msi_col_matched")}</th>
                <th>{t("msi_col_interest")}</th>
              </>
            )}
            <th className="num">{t("msi_col_submitted")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {inbox.items.map(item => (
            <InboxRow key={item.id} item={item} isInstitution={isInstitution} onOpen={onOpen} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type InboxProps = ActorProps &
  EmptyProps &
  FilterBarProps & {
    onOpen: (id: string) => void;
    onExport: () => void;
  };

/** The queue of projects routed to this institution, or the whole queue for an expert. */
export function Inbox(props: InboxProps) {
  const { inbox, onSettings, onExport, onOpen } = props;
  const { t, num } = useKit();
  const { stats, isInstitution } = inbox;
  return (
    <>
      <ActorStrip {...props} />
      <div className="ms-head">
        <div>
          <h2>{isInstitution ? t("msi_title") : t("msi_title_expert")}</h2>
          <p className="mk-sub">{isInstitution ? t("msi_sub") : t("msi_sub_expert")}</p>
        </div>
        <div className="mk-actions">
          {isInstitution && (
            <button type="button" className="btn btn-ghost" id="msi-settings" onClick={onSettings}>
              {t("msi_nav_settings")}
            </button>
          )}
          {inbox.actorKind === "expert" && (
            <button type="button" className="btn btn-ghost" id="msi-csv" onClick={onExport}>
              {t("ms_csv")}
            </button>
          )}
        </div>
      </div>
      <div className="ms-stats">
        <StatTile label={t("msi_stat_total")} sub={t("msi_stat_total_sub")}>
          {num(stats.total, 0)}
        </StatTile>
        <StatTile label={t("msi_stat_fresh")} sub={t("msi_stat_fresh_sub")} tone={stats.fresh ? "good" : null}>
          {num(stats.fresh, 0)}
        </StatTile>
        <StatTile label={t("msi_stat_shortlist")} sub={t("msi_stat_shortlist_sub")}>
          {num(stats.shortlist, 0)}
        </StatTile>
        <StatTile label={t("msi_stat_avg")} sub={t("msi_stat_avg_sub")}>
          {stats.avgScore == null ? "—" : num(stats.avgScore, 1)}
        </StatTile>
      </div>
      <FilterBar {...props} />
      {inbox.items.length ? <Queue inbox={inbox} onOpen={onOpen} /> : <EmptyState {...props} />}
    </>
  );
}
