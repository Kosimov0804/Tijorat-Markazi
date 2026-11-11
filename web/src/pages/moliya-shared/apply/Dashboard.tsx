import type { ReactNode } from "react";
import { RoutingBadge, StatusBadge, TypeBadge } from "../atoms/Badges";
import { REF } from "../engine/engine";
import type { Track } from "../engine/types";
import { useKit } from "../kit";
import type { ListItem, ListQuery, SortKey, Stats } from "./data";

type Tone = "good" | "bad" | null;

export function StatTile({ label, sub, tone, children }: { label: string; sub?: string; tone?: Tone; children: ReactNode }) {
  return (
    <div className={tone ? `ms-stat is-${tone}` : "ms-stat"}>
      <span>{label}</span>
      <b className="num">{children}</b>
      {sub && <i>{sub}</i>}
    </div>
  );
}

function StatTiles({ stats }: { stats: Stats }) {
  const { t, num } = useKit();
  return (
    <div className="ms-stats">
      <StatTile label={t("ms_stat_total")} sub={t("ms_stat_total_sub").replace("{n}", num(stats.scored, 0))}>
        {num(stats.total, 0)}
      </StatTile>
      <StatTile label={t("ms_stat_avg")} sub={t("ms_stat_avg_sub")}>
        {stats.avgScore == null ? "—" : num(stats.avgScore, 1)}
      </StatTile>
      <StatTile label={t("ms_stat_ready")} sub={t("ms_stat_ready_sub")} tone="good">
        {num(stats.ready, 0)}
      </StatTile>
      <StatTile label={t("ms_stat_blocked")} sub={t("ms_stat_blocked_sub")} tone={stats.blocked ? "bad" : null}>
        {num(stats.blocked, 0)}
      </StatTile>
    </div>
  );
}

type RowProps = { item: ListItem; onOpen: (id: string) => void; onEdit: (id: string) => void };

function ProjectRow({ item, onOpen, onEdit }: RowProps) {
  const { t, num, money, day, sectorName, regionName } = useKit();
  const { passport, score } = item;
  return (
    <tr>
      <td>
        <a
          href="#"
          data-ms-open={item.id}
          className="ms-rowname"
          onClick={event => {
            event.preventDefault();
            onOpen(item.id);
          }}
        >
          {passport.nomi || t("ms_unnamed")}
        </a>
        <div className="ms-rowsub">
          <TypeBadge type={passport.loyihaTuri} />
          <span>
            {sectorName(passport)} · {regionName(passport)}
          </span>
        </div>
      </td>
      <td className="num">{money(passport.soralayotganSumma, passport.valyuta)}</td>
      <td className="num">{score ? <b className={score.isKnockout ? "is-bad" : ""}>{num(score.total, 0)}</b> : "—"}</td>
      <td>
        <StatusBadge status={item.status} />
      </td>
      <td>{score ? <RoutingBadge status={score.routingStatus} /> : <span className="mk-note">{t("ms_not_scored")}</span>}</td>
      <td className="num">{day(item.updated)}</td>
      <td className="ms-rowact">
        <button type="button" className="ms-link" data-ms-edit={item.id} onClick={() => onEdit(item.id)}>
          {t("ms_edit")}
        </button>
        <button type="button" className="ms-link is-primary" data-ms-open={item.id} onClick={() => onOpen(item.id)}>
          {t("ms_result")}
        </button>
      </td>
    </tr>
  );
}

type TableProps = RowProps & { rows: readonly ListItem[]; query: ListQuery; onSort: (key: SortKey) => void };

function ProjectTable({ rows, query, onSort, onOpen, onEdit }: Omit<TableProps, "item">) {
  const { t } = useKit();
  const heading = (key: SortKey, label: string, className = "") => (
    <th className={className} data-ms-sort={key} onClick={() => onSort(key)}>
      {label}
      {query.sortKey === key && <i className="ms-sort">{query.sortDir === "asc" ? "↑" : "↓"}</i>}
    </th>
  );
  return (
    <div className="mk-tablewrap">
      <table className="mk-table">
        <thead>
          <tr>
            {heading("nomi", t("ms_col_project"))}
            {heading("summa", t("ms_col_amount"), "num")}
            {heading("ball", t("ms_col_score"), "num")}
            {heading("status", t("ms_col_status"))}
            <th>{t("ms_col_routing")}</th>
            {heading("updated", t("ms_col_updated"), "num")}
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map(item => (
            <ProjectRow key={item.id} item={item} onOpen={onOpen} onEdit={onEdit} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type DashboardProps = {
  track: Track;
  stats: Stats;
  /** Everything the server sent, and the part of it the filters leave. */
  total: number;
  rows: readonly ListItem[];
  query: ListQuery;
  onQuery: (change: Partial<ListQuery>) => void;
  onSort: (key: SortKey) => void;
  onNew: () => void;
  onMethodology: () => void;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
};

/** The owner's list of projects on this track. */
export function Dashboard(props: DashboardProps) {
  const { track, stats, total, rows, query, onQuery, onNew, onMethodology } = props;
  const { t, num, label } = useKit();
  const showing = t("ms_showing").replace("{n}", num(rows.length, 0)).replace("{total}", num(total, 0));

  return (
    <>
      <div className="ms-head">
        <div>
          <h2>{t(`ms_title_${track}`)}</h2>
          <p className="mk-sub">{t(`ms_sub_${track}`)}</p>
        </div>
        <div className="mk-actions">
          <button type="button" className="btn btn-primary" id="ms-new" onClick={onNew}>
            {t("ms_new")}
          </button>
          <button type="button" className="btn btn-ghost" id="ms-methodology" onClick={onMethodology}>
            {t("ms_nav_methodology")}
          </button>
        </div>
      </div>
      <StatTiles stats={stats} />
      <div className="mk-filter">
        <input
          type="search"
          id="ms-q"
          value={query.search}
          placeholder={t("ms_search")}
          autoComplete="off"
          onChange={event => onQuery({ search: event.target.value })}
        />
        <select id="ms-f-status" value={query.status} onChange={event => onQuery({ status: event.target.value })}>
          <option value="">{t("ms_all_statuses")}</option>
          {REF.projectStatuses.map(status => (
            <option key={status.id} value={status.id}>
              {label(status)}
            </option>
          ))}
        </select>
        <span className="mk-count">{showing}</span>
      </div>
      <ProjectTable {...props} />
      {rows.length === 0 &&
        (total === 0 ? (
          <div className="ms-empty">
            <p>
              <b>{t("ms_empty_title")}</b>
            </p>
            <p>{t("ms_empty_sub")}</p>
            <button type="button" className="btn btn-primary" id="ms-new-2" onClick={onNew}>
              {t("ms_empty_cta")}
            </button>
          </div>
        ) : (
          <div className="ms-empty">
            <p>{t("ms_no_results")}</p>
          </div>
        ))}
    </>
  );
}
