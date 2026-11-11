import type { ReactNode } from "react";
import { CONFIG, REF } from "../engine/engine";
import type { DscrRow, InstitutionMatch, MatchChecks } from "../engine/types";
import { useKit } from "../kit";
import type { AuditEntry } from "./data";

const MATCH_LABEL: Readonly<Record<keyof MatchChecks, string>> = {
  summa: "ms_match_summa",
  valyuta: "ms_match_valyuta",
  sektor: "ms_match_sektor",
  muddat: "ms_match_muddat",
  ball: "ms_match_ball",
};

/* Anything that is not a plain address stays text and gets no mailto link. */
const PLAIN_EMAIL = /^[^\s@<>"']+@[^\s@<>"']+$/;

function Pair({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function InstitutionCard({ match }: { match: InstitutionMatch }) {
  const { t, num, money, label, refName } = useKit();
  const { inst } = match;
  const failed = (Object.keys(MATCH_LABEL) as (keyof MatchChecks)[]).filter(key => !match.checks[key]).map(key => t(MATCH_LABEL[key]));
  const sectors = inst.sektorlar.length
    ? inst.sektorlar.map(id => refName(REF.sectors, id)).filter(Boolean).join(", ")
    : t("ms_inst_all_sectors");
  const terms = t("ms_inst_terms_value").replace("{y}", num(inst.max_muddat, 0)).replace("{b}", num(inst.min_ball, 0));
  const email = inst.aloqa_email;

  return (
    <article className={match.fullMatch ? "ms-inst is-full" : "ms-inst"}>
      <div className="ms-inst-head">
        <div>
          <h4>{label(inst.nomi)}</h4>
          <span className="ms-inst-type">
            {refName(CONFIG.institutionTypes, inst.turi) || inst.turi}
            {!inst.seed && ` · ${t("ms_inst_live")}`}
          </span>
        </div>
        <span className={match.fullMatch ? "ms-inst-pct is-full" : "ms-inst-pct"}>{match.matchPercent}%</span>
      </div>
      <dl className="ms-inst-kv">
        <Pair label={t("ms_inst_amount")}>
          {money(inst.min_summa, "")} – {money(inst.max_summa, "USD")}
        </Pair>
        <Pair label={t("ms_inst_currency")}>{inst.valyutalar.join(" · ")}</Pair>
        <Pair label={t("ms_inst_sectors")}>{sectors}</Pair>
        <Pair label={t("ms_inst_terms")}>{terms}</Pair>
        {email && (
          <Pair label={t("ms_inst_contact")}>
            {PLAIN_EMAIL.test(email) ? <a href={`mailto:${encodeURIComponent(email).replace("%40", "@")}`}>{email}</a> : email}
          </Pair>
        )}
      </dl>
      {failed.length > 0 && <p className="ms-inst-miss">{t("ms_inst_not_matched").replace("{list}", failed.join(", "))}</p>}
    </article>
  );
}

const AUDIT_ROWS = 15;
const AUDIT_CELL_LENGTH = 60;

/** The last changes, newest first. Long values are cut; the full one is in the tooltip. */
export function AuditTable({ entries }: { entries: readonly AuditEntry[] }) {
  const { t, day } = useKit();
  const rows = [...entries].reverse().slice(0, AUDIT_ROWS);
  if (!rows.length) return <p className="mk-note">{t("ms_res_no_records")}</p>;
  const head = [t("ms_col_time"), t("ms_col_user"), t("ms_col_field"), t("ms_col_old"), t("ms_col_new")];
  const cell = (value: string | null) => <td title={value ?? ""}>{(value ?? "—").slice(0, AUDIT_CELL_LENGTH)}</td>;
  return (
    <div className="mk-tablewrap">
      <table className="mk-table">
        <thead>
          <tr>
            {head.map(title => (
              <th key={title}>{title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((entry, index) => (
            <tr key={index}>
              <td className="num">{day(entry.t)}</td>
              <td>{entry.user}</td>
              <td>{entry.field}</td>
              {cell(entry.oldValue)}
              {cell(entry.newValue)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const coverTone = (dscr: number | null): string => (dscr == null ? "" : dscr >= 1.5 ? "is-good" : dscr >= 1.2 ? "is-warn" : "is-bad");

export function DscrTable({ series }: { series: readonly DscrRow[] | undefined }) {
  const { t, num, money } = useKit();
  if (!series || !series.length) return <p className="mk-note">{t("ms_res_no_data")}</p>;
  return (
    <div className="mk-tablewrap">
      <table className="mk-table">
        <thead>
          <tr>
            <th>{t("ms_col_year")}</th>
            <th className="num">CFADS</th>
            <th className="num">{t("ms_col_debt_service")}</th>
            <th className="num">DSCR</th>
          </tr>
        </thead>
        <tbody>
          {series.map((row, index) => (
            <tr key={index}>
              <td>
                {t("ms_col_year")} {num(row.yil, 0)}
              </td>
              <td className="num">{money(row.cfads, "")}</td>
              <td className="num">{money(row.debtService, "")}</td>
              <td className={`num ${coverTone(row.dscr)}`}>
                <b>{row.dscr == null ? "—" : num(row.dscr, 2)}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
