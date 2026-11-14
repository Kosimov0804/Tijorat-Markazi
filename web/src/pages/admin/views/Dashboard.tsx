import { useEffect } from "react";
import { AreaChart, monthLabel, monthlySeries } from "../../../shell/cabinet";
import type { OrgsStore } from "../orgs";
import { useText } from "../useText";

/** The four counters and the growth of companies over the last twelve months. */
export function Dashboard({ store }: { store: OrgsStore }) {
  const { tx, lang } = useText();
  const { orgs, send } = store;

  useEffect(() => {
    void send({ op: "list" });
  }, [send]);

  const companyCount = orgs.companies.length;
  const productCount = orgs.companies.reduce((sum, company) => sum + company.productCount, 0);
  const withProducts = orgs.companies.filter(company => company.productCount > 0).length;
  /* A real series from the platform's own company records. */
  const series = monthlySeries(orgs.companies);
  const points = series.buckets.map(bucket => ({
    label: monthLabel(bucket.m, lang),
    total: bucket.total,
    added: bucket.added,
  }));
  const spoken = `${tx("flow")}: ${points.map(point => `${point.label} ${point.total}`).join(", ")}`;
  const cards = [
    { label: tx("nav_assoc"), value: String(orgs.associations.length) },
    { label: tx("d_companies"), value: String(companyCount) },
    { label: tx("d_products"), value: String(productCount) },
    { label: tx("d_with"), value: `${withProducts} / ${companyCount}` },
  ];

  return (
    <>
      <div className="admin-cards">
        {cards.map(card => (
          <div className="admin-card" key={card.label}>
            <div className="ac-label">{card.label}</div>
            <div className="ac-val">{card.value}</div>
          </div>
        ))}
      </div>
      <div className="admin-panel">
        <h2>{tx("flow")}</h2>
        <p className="ac-label" style={{ margin: "-8px 0 16px" }}>
          {tx("flow_sub")}
          {series.undated > 0 && ` (${tx("flow_undated")}${series.undated})`}
        </p>
        <AreaChart points={points} ariaLabel={spoken} emptyText={tx("flow_empty")} />
      </div>
    </>
  );
}
