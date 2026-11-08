import { useEffect } from "react";
import type { ReactNode } from "react";
import { T_PRODUCT } from "@legacy/markets-i18n.js";
import { useI18n } from "../../shell/i18n";
import { formatNumber, queryString, safeImageUrl, useMarketText } from "../../shell/market/mk";
import type { Translate } from "../../shell/market/mk";
import { PublicPage } from "../../shell/PublicPage";
import { SiteFooter } from "../../shell/SiteFooter";
import { useApiJson } from "../../shell/useApiJson";
import { InquirySection } from "./InquirySection";

type Product = { id: string; name: string; desc?: string; price?: string; img?: string; trade?: string };
type Company = {
  id: string;
  name: string;
  bizId?: string;
  sector?: string;
  assoc?: string;
  assocI18n?: Partial<Record<string, string>>;
  chairman?: string;
  products?: number;
};
type MoreItem = { id: string; name: string; price?: string; img?: string; trade?: string };
type ItemResponse = { ok?: boolean; product: Product; company: Company; more?: MoreItem[] };

type LayoutProps = {
  crumbCompany?: string;
  crumbName?: string;
  children: ReactNode;
};

function Layout({ crumbCompany, crumbName, children }: LayoutProps) {
  const t = useMarketText(T_PRODUCT);
  const companyHref = crumbCompany ? `showroom.html?company=${encodeURIComponent(crumbCompany)}` : "showroom.html";
  return (
    <PublicPage
      active="showroom.html"
      action={{ href: "showroom.html", label: t("pd_back") }}
      footer={<SiteFooter hasRegisterLink />}
    >
      <main className="section">
        <div className="container">
          <nav className="pd-crumb" aria-label="breadcrumb">
            <a href="showroom.html">{t("nav_showroom")}</a>
            <span aria-hidden="true">›</span>
            <a id="pdCrumbCompany" href={companyHref}>
              {crumbCompany}
            </a>
            <span aria-hidden="true">›</span>
            <span id="pdCrumbName">{crumbName}</span>
          </nav>
          <div id="pdRoot">{children}</div>
        </div>
      </main>
    </PublicPage>
  );
}

function ProductHero({ product, company, t }: { product: Product; company: Company; t: Translate }) {
  const { lang } = useI18n();
  const image = safeImageUrl(product.img);
  const assoc = company.assocI18n?.[lang] || company.assoc || "";
  const bizHref = company.bizId ? `biznes-id.html?id=${encodeURIComponent(company.bizId)}` : "";
  const isImport = product.trade === "import";

  return (
    <div className="pd-hero">
      <figure className="pd-media">
        {image ? (
          <img src={image} alt={product.name} loading="eager" fetchPriority="high" />
        ) : (
          <div className="pd-ph" aria-hidden="true">
            🛍️
          </div>
        )}
      </figure>
      <div className="pd-info">
        <div className="mk-chips">
          <span className={`mk-chip is-${isImport ? "b2g" : "export"}`}>{t(isImport ? "pd_import" : "pd_export")}</span>{" "}
          {company.sector && <span className="mk-chip is-ghost">{company.sector}</span>}
        </div>
        <h1>{product.name}</h1>
        {product.price ? (
          <div className="pd-price">{product.price}</div>
        ) : (
          <div className="pd-price pd-price-none">{t("pd_price_ask")}</div>
        )}
        {product.desc && <p className="pd-desc">{product.desc}</p>}
        <dl className="mk-kv pd-kv">
          <dt>{t("pd_company")}</dt>
          <dd>
            <b>{company.name}</b>
          </dd>
          {bizHref && (
            <>
              <dt>Business ID</dt>
              <dd>
                <a className="pd-bizid" href={bizHref}>
                  {company.bizId}
                </a>
              </dd>
            </>
          )}
          {company.sector && (
            <>
              <dt>{t("pd_sector")}</dt>
              <dd>{company.sector}</dd>
            </>
          )}
          {assoc && (
            <>
              <dt>{t("pd_assoc")}</dt>
              <dd>{assoc}</dd>
            </>
          )}
          {company.chairman && (
            <>
              <dt>{t("pd_chairman")}</dt>
              <dd>{company.chairman}</dd>
            </>
          )}
          <dt>{t("pd_catalogue")}</dt>
          <dd>
            {formatNumber(company.products, lang, 0)} {t("pd_items")}
          </dd>
        </dl>
        <div className="mk-actions">
          <a className="btn btn-primary btn-lg" href="#pdContact">
            {t("pd_contact_cta")}
          </a>
          <a className="btn btn-ghost" href={`showroom.html?company=${encodeURIComponent(company.name)}`}>
            {t("pd_all_products")}
          </a>
          {bizHref && (
            <a className="btn btn-ghost" href={bizHref}>
              Business ID
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function MoreFromCompany({ items, companyName, t }: { items: MoreItem[]; companyName: string; t: Translate }) {
  return (
    <section className="pd-more">
      <h2>{t("pd_more").replace("{co}", companyName)}</h2>
      <div className="show-grid">
        {items.map(item => {
          const image = safeImageUrl(item.img);
          return (
            <a className="show-card" href={`mahsulot.html?id=${encodeURIComponent(item.id)}`} key={item.id}>
              {image ? (
                <img className="show-img" src={image} alt="" loading="lazy" />
              ) : (
                <div className="show-img show-img-ph">🛍️</div>
              )}
              <div className="show-body">
                <b>{item.name}</b>
                {item.price && <span className="show-price">{item.price}</span>}{" "}
                <span className={`trade-badge trade-${item.trade}`}>
                  {t(item.trade === "import" ? "pd_import" : "pd_export")}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function ProductContent({ id }: { id: string }) {
  const t = useMarketText(T_PRODUCT);
  const state = useApiJson<ItemResponse>(`/api/showroom/item?${queryString({ id })}`);
  const data = state.status === "ready" && state.data.ok ? state.data : null;
  const title = data ? `${data.product.name} — ${data.company.name} — TIJORAT MARKAZI` : "";

  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

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
        <p className="mk-empty">{t("pd_notfound")}</p>
      </Layout>
    );
  }

  const { product, company, more } = data;
  return (
    <Layout crumbCompany={company.name} crumbName={product.name}>
      <ProductHero product={product} company={company} t={t} />
      <InquirySection
        companyId={company.id}
        companyName={company.name}
        productId={product.id}
        productName={product.name}
        t={t}
      />
      {more && more.length > 0 && <MoreFromCompany items={more} companyName={company.name} t={t} />}
    </Layout>
  );
}

export function MahsulotPage() {
  const t = useMarketText(T_PRODUCT);
  const id = new URLSearchParams(window.location.search).get("id") ?? "";
  if (!id) {
    return (
      <Layout>
        <p className="mk-empty">{t("pd_missing")}</p>
      </Layout>
    );
  }
  return <ProductContent id={id} />;
}
