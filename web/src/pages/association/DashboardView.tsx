import { AreaChart, monthLabel, monthlySeries } from "../../shell/cabinet";
import { useI18n } from "../../shell/i18n";
import type { AssocText, MemberCompany } from "./types";

const RECENT_COUNT = 6;

type DashboardProps = { companies: readonly MemberCompany[]; hasMeeting: boolean; at: AssocText };

function GrowthPanel({ companies, at }: { companies: readonly MemberCompany[]; at: AssocText }) {
  const { lang } = useI18n();
  /* A real series, from the member companies' own creation dates. */
  const series = monthlySeries(companies);
  const points = series.buckets.map(bucket => ({
    label: monthLabel(bucket.m, lang),
    total: bucket.total,
    added: bucket.added,
  }));
  const spoken = points.map(point => `${point.label} ${point.total}`).join(", ");
  return (
    <div className="admin-panel">
      <h2>{at("flow")}</h2>
      <p className="ac-label" style={{ margin: "-8px 0 16px" }}>
        {at("flow_sub")}
        {series.undated > 0 && ` (${at("flow_undated")}${series.undated})`}
      </p>
      <AreaChart points={points} emptyText={at("flow_empty")} ariaLabel={`${at("flow")}: ${spoken}`} />
    </div>
  );
}

export function DashboardView({ companies, hasMeeting, at }: DashboardProps) {
  const products = companies.reduce((sum, company) => sum + company.showroom.length, 0);
  const withProducts = companies.filter(company => company.showroom.length > 0).length;
  const cards = [
    { label: at("d_companies"), value: String(companies.length), sub: "▲" },
    { label: at("d_products"), value: String(products), sub: "🛍️" },
    { label: at("d_with"), value: `${withProducts} / ${companies.length}`, sub: "" },
    { label: at("d_meeting"), value: at(hasMeeting ? "yes" : "no"), sub: "" },
  ];
  const recent = [...companies].reverse().slice(0, RECENT_COUNT);

  return (
    <>
      <div className="admin-cards">
        {cards.map(card => (
          <div className="admin-card" key={card.label}>
            <div className="ac-label">{card.label}</div>
            <div className="ac-val">{card.value}</div>
            {card.sub && <div className="ac-sub">{card.sub}</div>}
          </div>
        ))}
      </div>
      <GrowthPanel companies={companies} at={at} />
      <div className="admin-panel">
        <h2>{at("recent")}</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{at("c_name")}</th>
              <th>{at("c_sector")}</th>
              <th>{at("c_prod")}</th>
              <th>{at("c_login")}</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(company => (
              <tr key={company.id}>
                <td>
                  <b>{company.name}</b>
                </td>
                <td>{company.sector || "—"}</td>
                <td>{company.showroom.length}</td>
                <td>
                  <code>{company.login}</code>
                </td>
              </tr>
            ))}
            {!recent.length && (
              <tr>
                <td colSpan={4} className="ac-label">
                  {at("cmp_empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
