import { useState } from "react";
import type { Lang } from "@legacy/data.js";
import { FilterSelect } from "../../shell/FilterSelect";
import { foldUzbek } from "../../shell/foldUzbek";
import { useI18n } from "../../shell/i18n";
import { PublicPage } from "../../shell/PublicPage";
import { SiteFooter } from "../../shell/SiteFooter";
import { trustedHtml } from "../../shell/trustedHtml";
import { useApiJson } from "../../shell/useApiJson";

type ShowroomItem = {
  id?: string;
  name: string;
  company: string;
  desc?: string;
  sector?: string;
  assoc?: string;
  price?: string;
  img?: string;
  trade?: string;
};

type ShowroomResponse = {
  items?: ShowroomItem[];
  sectors?: string[];
  assocs?: string[];
  companies?: string[];
  assocI18n?: Record<string, Partial<Record<Lang, string>>>;
};

const NO_OPTIONS: readonly string[] = [];
const TRADE_TABS = [
  { value: "", labelKey: "show_trade_all" },
  { value: "export", labelKey: "show_trade_exp" },
  { value: "import", labelKey: "show_trade_imp" },
] as const;

const tradeOf = (item: ShowroomItem): string => item.trade || "export";

function ShowroomCard({ item }: { item: ShowroomItem }) {
  const { t } = useI18n();
  const trade = tradeOf(item);
  /* "//host/x.jpg" looks like a path but loads from somebody else's server. */
  const image = item.img?.startsWith("//") ? "" : item.img;
  const content = (
    <>
      {image ? (
        <img className="show-img" src={image} alt="" loading="lazy" />
      ) : (
        <div className="show-img show-img-ph">🛍️</div>
      )}
      <div className="show-body">
        <b>{item.name}</b>
        {item.price && <span className="show-price">{item.price}</span>}{" "}
        {item.desc && <p>{item.desc}</p>}{" "}
        <span className="show-org">
          {item.company}
          {item.sector && ` · ${item.sector}`}
        </span>{" "}
        <span className={`trade-badge trade-${trade}`}>
          {t(trade === "import" ? "show_trade_imp" : "show_trade_exp")}
        </span>{" "}
        <span className="show-more">{t("show_more")}</span>
      </div>
    </>
  );
  /* Entries stored before ids existed stay as plain cards rather than linking nowhere. */
  return item.id ? (
    <a className="show-card show-card-link" href={`mahsulot.html?id=${encodeURIComponent(item.id)}`}>
      {content}
    </a>
  ) : (
    <div className="show-card">{content}</div>
  );
}

export function ShowroomPage() {
  const { lang, t } = useI18n();
  const [trade, setTrade] = useState("");
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [assoc, setAssoc] = useState("");
  /* Pre-filtered when opened from an association page (?company=Name). */
  const [chosenCompany, setChosenCompany] = useState(
    () => new URLSearchParams(window.location.search).get("company") ?? "",
  );
  const catalog = useApiJson<ShowroomResponse>("/api/showroom");

  const response = catalog.status === "ready" ? catalog.data : undefined;
  const companies = response?.companies ?? NO_OPTIONS;
  /* A ?company= that names no real company must not empty the page. */
  const company = companies.includes(chosenCompany) ? chosenCompany : "";
  const query = foldUzbek(search.trim());

  const visible = (response?.items ?? []).filter(item => {
    if (trade && tradeOf(item) !== trade) return false;
    if (sector && item.sector !== sector) return false;
    if (assoc && item.assoc !== assoc) return false;
    if (company && item.company !== company) return false;
    if (!query) return true;
    return foldUzbek([item.name, item.company, item.desc, item.sector].join(" ")).includes(query);
  });
  const isEmpty = catalog.status === "error" || (catalog.status === "ready" && visible.length === 0);

  return (
    <PublicPage
      active="showroom.html"
      action={{ href: "index.html", labelKey: "d_home" }}
      footer={<SiteFooter hasRegisterLink />}
    >
      <main className="section" id="showroom">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t("show_eyebrow")}</span>
            <h2 dangerouslySetInnerHTML={trustedHtml(t("show_h2"))} />
            <p>{t("show_p")}</p>
          </div>
          <div className="show-filter">
            <div className="trade-tabs trade-tabs-public" id="showTrade" role="tablist">
              {TRADE_TABS.map(tab => (
                <button
                  key={tab.value}
                  type="button"
                  className={tab.value === trade ? "trade-tab is-on" : "trade-tab"}
                  role="tab"
                  onClick={() => setTrade(tab.value)}
                >
                  {t(tab.labelKey)}
                </button>
              ))}
            </div>
            <input
              type="search"
              id="showSearch"
              placeholder={t("show_search")}
              autoComplete="off"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
            <FilterSelect
              id="showSector"
              value={sector}
              allLabel={t("show_all_sectors")}
              options={response?.sectors ?? NO_OPTIONS}
              onChange={setSector}
            />
            <FilterSelect
              id="showAssoc"
              value={assoc}
              allLabel={t("show_all_assocs")}
              options={response?.assocs ?? NO_OPTIONS}
              labelOf={option => response?.assocI18n?.[option]?.[lang] || option}
              onChange={setAssoc}
            />
            <FilterSelect
              id="showCompany"
              value={company}
              allLabel={t("show_all_companies")}
              options={companies}
              onChange={setChosenCompany}
            />
            <span className="show-count" id="showCount">
              {response && t("show_count").replace("{n}", String(visible.length))}
            </span>
          </div>
          <div className="show-grid" id="homeShowGrid">
            {visible.map((item, index) => (
              <ShowroomCard key={item.id ?? `${item.company}|${item.name}|${index}`} item={item} />
            ))}
          </div>
          <p className="show-empty-home" id="showEmpty" hidden={!isEmpty}>
            {t("show_empty")}
          </p>
        </div>
      </main>
    </PublicPage>
  );
}
