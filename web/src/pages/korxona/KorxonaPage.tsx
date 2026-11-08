import { Fragment, useEffect } from "react";
import type { ReactNode } from "react";
import { T_KORXONA } from "@legacy/markets-i18n.js";
import type { Lang } from "@legacy/data.js";
import { useI18n } from "../../shell/i18n";
import { formatDay, formatNumber, queryString, useMarketText } from "../../shell/market/mk";
import type { Translate } from "../../shell/market/mk";
import { ProductTiles } from "../../shell/market/ProductTiles";
import type { ProductTile } from "../../shell/market/ProductTiles";
import { PublicPage } from "../../shell/PublicPage";
import { SiteFooter } from "../../shell/SiteFooter";
import { useApiJson } from "../../shell/useApiJson";

type Assoc = { id: string; name?: string; i18n?: Partial<Record<Lang, string>>; chairman?: string };
type Company = { name: string; sector?: string; since?: number; bizId?: string };
type CompanyResponse = { ok?: boolean; company: Company; assoc?: Assoc | null; showroom?: ProductTile[] };

const assocName = (assoc: Assoc | null | undefined, lang: Lang): string =>
  assoc ? assoc.i18n?.[lang] || assoc.name || "" : "";

type LayoutProps = {
  crumbAssoc?: { label: string; href: string };
  crumbName?: string;
  children: ReactNode;
};

function Layout({ crumbAssoc, crumbName, children }: LayoutProps) {
  const t = useMarketText(T_KORXONA);
  return (
    <PublicPage action={{ href: "associations.html", label: t("ko_back") }} footer={<SiteFooter hasRegisterLink />}>
      <main className="section">
        <div className="container">
          <nav className="pd-crumb" aria-label="breadcrumb">
            <a href="associations.html" className="active">
              Uyushmalar
            </a>
            <span aria-hidden="true">›</span>
            <a id="koCrumbAssoc" href={crumbAssoc?.href ?? "associations.html"}>
              {crumbAssoc?.label}
            </a>
            <span aria-hidden="true">›</span>
            <span id="koCrumbName">{crumbName}</span>
          </nav>
          <div id="koRoot">{children}</div>
        </div>
      </main>
    </PublicPage>
  );
}

function CompanyHead({ data, t }: { data: CompanyResponse; t: Translate }) {
  const { lang } = useI18n();
  const { company, assoc } = data;
  const products = data.showroom ?? [];
  const name = assocName(assoc, lang);
  const facts: { label: string; value: ReactNode }[] = [
    ...(company.sector ? [{ label: t("ko_sector"), value: company.sector }] : []),
    ...(assoc
      ? [{ label: t("ko_assoc"), value: <a href={`association.html?id=${encodeURIComponent(assoc.id)}`}>{name}</a> }]
      : []),
    ...(assoc?.chairman ? [{ label: t("ko_chairman"), value: assoc.chairman }] : []),
    ...(company.since ? [{ label: t("ko_since"), value: formatDay(company.since, lang) }] : []),
    { label: t("ko_products"), value: formatNumber(products.length, lang, 0) },
  ];
  const bizHref = company.bizId ? `biznes-id.html?id=${encodeURIComponent(company.bizId)}` : "";

  return (
    <div className="ko-head">
      <div className="ko-head-main">
        <h1>{company.name}</h1>
        {company.sector && (
          <p className="ko-sub">
            {company.sector}
            {name && ` · ${name}`}
          </p>
        )}
        <dl className="mk-kv ko-kv">
          {facts.map(fact => (
            <Fragment key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </Fragment>
          ))}
        </dl>
        <div className="mk-actions">
          {bizHref && (
            <a className="btn btn-primary btn-lg" href={bizHref}>
              {t("ko_bizid")}
            </a>
          )}
          {products.length > 0 && (
            <a className="btn btn-ghost" href={`showroom.html?company=${encodeURIComponent(company.name)}`}>
              {t("ko_all")}
            </a>
          )}
          {assoc && (
            <a className="btn btn-ghost" href={`association.html?id=${encodeURIComponent(assoc.id)}`}>
              {t("ko_assoc_page")}
            </a>
          )}
        </div>
      </div>
      {bizHref && (
        <aside className="ko-idcard">
          <span className="ko-idcard-k">{t("ko_bizid")}</span>
          <a className="ko-idcard-n" href={bizHref}>
            {company.bizId}
          </a>
          <p>{t("ko_bizid_sub")}</p>
        </aside>
      )}
    </div>
  );
}

function CompanyContent({ id }: { id: string }) {
  const { lang } = useI18n();
  const t = useMarketText(T_KORXONA);
  const state = useApiJson<CompanyResponse>(`/api/company/public?${queryString({ id })}`);
  const data = state.status === "ready" && state.data.ok ? state.data : null;
  const companyName = data?.company.name;

  useEffect(() => {
    if (companyName) document.title = `${companyName} — TIJORAT MARKAZI`;
  }, [companyName]);

  if (state.status === "loading") {
    return (
      <Layout>
        <p className="mk-loading">{t("mk_loading", "Yuklanmoqda…")}</p>
      </Layout>
    );
  }
  if (!data) {
    return (
      <Layout>
        <p className="mk-empty">{t("ko_notfound")}</p>
      </Layout>
    );
  }

  const crumbAssoc = data.assoc
    ? { label: assocName(data.assoc, lang) || "—", href: `association.html?id=${encodeURIComponent(data.assoc.id)}` }
    : { label: "—", href: "associations.html" };

  return (
    <Layout crumbAssoc={crumbAssoc} crumbName={data.company.name}>
      <CompanyHead data={data} t={t} />
      <section className="ko-goods">
        <h2>{t("ko_products")}</h2>
        <ProductTiles products={data.showroom ?? []} emptyText={t("ko_empty")} askPriceText={t("pd_price_ask")} />
      </section>
    </Layout>
  );
}

export function KorxonaPage() {
  const t = useMarketText(T_KORXONA);
  const id = new URLSearchParams(window.location.search).get("id") ?? "";
  if (!id) {
    return (
      <Layout>
        <p className="mk-empty">{t("ko_missing")}</p>
      </Layout>
    );
  }
  return <CompanyContent id={id} />;
}
