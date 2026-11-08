import { useState } from "react";
import type { Lang } from "@legacy/data.js";
import { FilterSelect } from "../../shell/FilterSelect";
import { useI18n } from "../../shell/i18n";
import { PublicPage } from "../../shell/PublicPage";
import { trustedHtml } from "../../shell/trustedHtml";
import { useApiJson } from "../../shell/useApiJson";

type Service = {
  title: string;
  company: string;
  body?: string;
  sector?: string;
  assoc?: string;
  price?: string;
  status?: string;
};

type ServicesResponse = {
  items?: Service[];
  sectors?: string[];
  assocs?: string[];
  companies?: string[];
  assocI18n?: Record<string, Partial<Record<Lang, string>>>;
};

const NO_OPTIONS: readonly string[] = [];

function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="svc-card">
      <div className="svc-top">
        <b>{service.title}</b>
        {service.price && <span className="svc-price">{service.price}</span>}
      </div>
      {service.body && <p className="svc-body">{service.body}</p>}
      <div className="svc-foot">
        <span className="svc-org">
          {service.company}
          {service.sector && ` · ${service.sector}`}
        </span>
        {service.status && <span className="svc-status">{service.status}</span>}
      </div>
    </article>
  );
}

export function XizmatlarPage() {
  const { lang, t } = useI18n();
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [assoc, setAssoc] = useState("");
  const [company, setCompany] = useState("");
  const catalog = useApiJson<ServicesResponse>("/api/services");

  const response = catalog.status === "ready" ? catalog.data : undefined;
  const isSettled = catalog.status !== "loading";
  const items = response?.items ?? [];
  const query = search.trim().toLowerCase();

  const visible = items.filter(item => {
    if (sector && item.sector !== sector) return false;
    if (assoc && item.assoc !== assoc) return false;
    if (company && item.company !== company) return false;
    if (!query) return true;
    return [item.title, item.company, item.body, item.sector].join(" ").toLowerCase().includes(query);
  });

  return (
    <PublicPage active="xizmatlar.html" action={{ href: "index.html", labelKey: "d_home" }}>
      <main className="section" id="services">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t("svc_eyebrow")}</span>
            <h2 dangerouslySetInnerHTML={trustedHtml(t("svc_h2"))} />
            <p>{t("svc_p")}</p>
          </div>
          <div className="show-filter">
            <input
              type="search"
              id="svcSearch"
              placeholder={t("svc_search")}
              autoComplete="off"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
            <FilterSelect
              id="svcSector"
              value={sector}
              allLabel={t("show_all_sectors")}
              options={response?.sectors ?? NO_OPTIONS}
              onChange={setSector}
            />
            <FilterSelect
              id="svcAssoc"
              value={assoc}
              allLabel={t("show_all_assocs")}
              options={response?.assocs ?? NO_OPTIONS}
              labelOf={option => response?.assocI18n?.[option]?.[lang] || option}
              onChange={setAssoc}
            />
            <FilterSelect
              id="svcCompany"
              value={company}
              allLabel={t("show_all_companies")}
              options={response?.companies ?? NO_OPTIONS}
              onChange={setCompany}
            />
            <span className="show-count" id="svcCount">
              {isSettled && t("svc_count").replace("{n}", String(visible.length))}
            </span>
          </div>
          <div className="svc-grid" id="svcGrid">
            {visible.map((service, index) => (
              <ServiceCard key={`${service.company}|${service.title}|${index}`} service={service} />
            ))}
          </div>
          <p className="show-empty-home" id="svcEmpty" hidden={!isSettled || visible.length > 0}>
            {t("svc_empty")}
          </p>
        </div>
      </main>
    </PublicPage>
  );
}
