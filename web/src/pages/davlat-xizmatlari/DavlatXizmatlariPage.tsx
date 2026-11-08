import { useState } from "react";
import { FilterSelect } from "../../shell/FilterSelect";
import { useI18n } from "../../shell/i18n";
import { PublicPage } from "../../shell/PublicPage";
import { trustedHtml } from "../../shell/trustedHtml";
import { useApiJson } from "../../shell/useApiJson";

type GovService = {
  title: string;
  body?: string;
  agency?: string;
  category?: string;
  link?: string;
};

type GovServicesResponse = {
  items?: GovService[];
  categories?: string[];
  agencies?: string[];
};

const NO_OPTIONS: readonly string[] = [];

/* Only ever link out to real web addresses. */
export const safeExternalUrl = (url: string | undefined): string | undefined =>
  url && /^https?:\/\//i.test(url) ? url : undefined;

function GovServiceCard({ service }: { service: GovService }) {
  const { t } = useI18n();
  const url = safeExternalUrl(service.link);
  return (
    <article className="gs-card">
      {service.category && <span className="gs-cat">{service.category}</span>}
      <b className="gs-title">{service.title}</b>
      {service.body && <p className="gs-body">{service.body}</p>}
      <div className="gs-foot">
        {service.agency && <span className="gs-agency">🏛 {service.agency}</span>}
        {url && (
          <a className="gs-link" href={url} target="_blank" rel="noopener noreferrer">
            {t("gs_open")}
          </a>
        )}
      </div>
    </article>
  );
}

export function DavlatXizmatlariPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [agency, setAgency] = useState("");
  const catalog = useApiJson<GovServicesResponse>("/api/gov-services");

  const response = catalog.status === "ready" ? catalog.data : undefined;
  const isSettled = catalog.status !== "loading";
  const query = search.trim().toLowerCase();

  const visible = (response?.items ?? []).filter(item => {
    if (category && item.category !== category) return false;
    if (agency && item.agency !== agency) return false;
    if (!query) return true;
    return [item.title, item.body, item.agency, item.category].join(" ").toLowerCase().includes(query);
  });

  return (
    <PublicPage active="davlat-xizmatlari.html" action={{ href: "index.html", labelKey: "d_home" }}>
      <main className="section" id="govservices">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t("gs_eyebrow")}</span>
            <h2 dangerouslySetInnerHTML={trustedHtml(t("gs_h2"))} />
            <p>{t("gs_p")}</p>
          </div>
          <div className="show-filter">
            <input
              type="search"
              id="gsSearch"
              placeholder={t("gs_search")}
              autoComplete="off"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
            <FilterSelect
              id="gsCategory"
              value={category}
              allLabel={t("gs_all_cat")}
              options={response?.categories ?? NO_OPTIONS}
              onChange={setCategory}
            />
            <FilterSelect
              id="gsAgency"
              value={agency}
              allLabel={t("gs_all_agency")}
              options={response?.agencies ?? NO_OPTIONS}
              onChange={setAgency}
            />
            <span className="show-count" id="gsCount">
              {isSettled && t("gs_count").replace("{n}", String(visible.length))}
            </span>
          </div>
          <div className="gs-grid" id="gsGrid">
            {visible.map((service, index) => (
              <GovServiceCard key={`${service.agency}|${service.title}|${index}`} service={service} />
            ))}
          </div>
          <p className="show-empty-home" id="gsEmpty" hidden={!isSettled || visible.length > 0}>
            {t("gs_empty")}
          </p>

          {/* The platform's own route into government, right where people look for it. */}
          <div className="cta-band panel gs-cta">
            <div>
              <h2>{t("gs_cta_h")}</h2>
              <p>{t("gs_cta_p")}</p>
            </div>
            <a className="btn btn-primary btn-lg" href="kirish.html">
              {t("gs_cta_btn")}
            </a>
          </div>
        </div>
      </main>
    </PublicPage>
  );
}
