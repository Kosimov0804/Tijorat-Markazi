import { BarChart, Donut, LineChart, money } from "./charts";
import type { BizRow, CompanyText, ShowItem } from "./types";

const PALETTE = ["#7b7fe0", "#5b6fd6", "#9a8fe6"] as const;
const LABEL_LENGTH = 14;

type DashboardProps = { showroom: readonly ShowItem[]; bizrows: readonly BizRow[]; ot: CompanyText };

export function DashboardView({ showroom, bizrows, ot }: DashboardProps) {
  const priced = showroom.filter(item => item.price.trim()).length;
  const photo = showroom.filter(item => item.img.trim()).length;
  const plain = showroom.length - priced;
  const minis = [
    { value: priced, label: ot("st_priced") },
    { value: photo, label: ot("st_photo") },
    { value: plain, label: ot("st_plain") },
    { value: showroom.length, label: ot("d_products") },
  ];
  const slices = minis.slice(0, 3).map((mini, index) => ({ ...mini, color: PALETTE[index] }));
  const shownSlices = slices.filter(slice => slice.value > 0);
  /* The charts show what the company actually recorded under "Savdo &
     mahsulot". An empty chart is more useful than an invented one. */
  const recorded = bizrows.filter(row => row.product.trim() || row.sales.trim());
  const labels = recorded.map(row => (row.product || "—").slice(0, LABEL_LENGTH));
  const noData = <p className="co-sub">{ot("dash_nodata")}</p>;

  return (
    <div className="dash-grid">
      <div className="panel dash-card dash-kpi-card">
        <span className="dash-card-t" id="kpiLabel">
          {ot("d_products")}
        </span>
        <b className="dash-kpi-val" id="kpiVal">
          {showroom.length}
        </b>
        <div className="dash-kpi-mini" id="kpiMini">
          {minis.map((mini, index) => (
            <div key={index}>
              <b>{mini.value}</b>
              <span>{mini.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="panel dash-card dash-span2">
        <span className="dash-card-t" id="evoTitle">
          {ot("dash_evo")}
        </span>
        <div id="chartMonth">
          {recorded.length ? <BarChart values={recorded.map(row => money(row.sales))} labels={labels} /> : noData}
        </div>
      </div>
      <div className="panel dash-card">
        <span className="dash-card-t" id="donutTitle">
          {ot("dash_donut")}
        </span>
        <div id="chartDonut">
          {shownSlices.length ? <Donut slices={shownSlices} /> : <p className="co-sub">{ot("sh_empty")}</p>}
        </div>
      </div>
      <div className="panel dash-card dash-span2">
        <span className="dash-card-t" id="qtyTitle">
          {ot("dash_qty")}
        </span>
        <div id="chartArea">
          {recorded.length ? <LineChart values={recorded.map(row => money(row.price))} labels={labels} /> : noData}
        </div>
      </div>
    </div>
  );
}
