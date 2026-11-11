import { useState } from "react";
import type { CSSProperties } from "react";
import { useI18n } from "../../shell/i18n";
import {
  activateOnKey,
  Chips,
  Empty,
  FacetSelect,
  formatNumber,
  Loading,
  marketJson,
  marketQuery,
  useDebounced,
  useLoad,
} from "../../shell/market";
import type { Translate } from "../../shell/market";
import { ChannelChips, ChannelSegment, UnitPrice } from "./parts";
import { ProductDrawer } from "./ProductDrawer";
import { parseCatalog } from "./types";
import type { Facets, Product } from "./types";

const SEARCH_DELAY_MS = 300;
const MAX_CARD_CERTIFICATES = 3;
const NO_OPTIONS: readonly string[] = [];
const CHECK_CHIP: CSSProperties = { cursor: "pointer" };
const CHECK_BOX: CSSProperties = { accentColor: "var(--mk)" };

function ProductCard({ product, t, onOpen }: { product: Product; t: Translate; onOpen: () => void }) {
  const { lang } = useI18n();
  return (
    <article
      className="mk-card"
      data-product={product.id}
      tabIndex={0}
      role="button"
      onClick={onOpen}
      onKeyDown={activateOnKey(onOpen)}
    >
      <ChannelChips channels={product.channels} t={t} />
      <h3>{product.title}</h3>
      {product.desc && <p className="mk-desc">{product.desc}</p>}
      <div className="mk-meta">
        <span>{product.company}</span>
        {product.region && (
          <span>
            📍 <b>{product.region}</b>
          </span>
        )}
        {product.moq > 0 && (
          <span>
            MOQ <b>{formatNumber(product.moq, lang, 0)}</b>
          </span>
        )}
        {product.leadTime > 0 && (
          <span>
            {t("bz_lead_label")}{" "}
            <b>
              {formatNumber(product.leadTime, lang, 0)} {t("bz_days")}
            </b>
          </span>
        )}
      </div>
      {product.certificates.length > 0 && (
        <Chips items={product.certificates.slice(0, MAX_CARD_CERTIFICATES)} kind="ghost" />
      )}
      <div className="mk-card-foot">
        <span className="mk-price">
          <UnitPrice price={product.price} currency={product.currency} unit={product.unit} lang={lang} />
        </span>
        {product.isLocalMade && <span className="mk-chip is-accent">{t("bz_local")}</span>}
        {product.isVerified && <span className="mk-badge">{t("bz_verified")}</span>}
      </div>
    </article>
  );
}

type CatalogPanelProps = { t: Translate; onRequestQuote: (product: Product) => void };

export function CatalogPanel({ t, onRequestQuote }: CatalogPanelProps) {
  const { lang } = useI18n();
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("");
  const [sector, setSector] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [isCertifiedOnly, setIsCertifiedOnly] = useState(false);
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  /* The first answer's facets stay, so choosing one filter never empties the others. */
  const [facets, setFacets] = useState<Facets | null>(null);

  const q = useDebounced(search.trim(), SEARCH_DELAY_MS);
  const url = `/api/bozor/products?${marketQuery({
    q,
    channel,
    sector,
    category,
    region,
    certified: isCertifiedOnly,
    local: isLocalOnly,
  })}`;
  const catalog = useLoad(url, async () => parseCatalog(await marketJson(url)));
  if (!facets && catalog.data?.facets) setFacets(catalog.data.facets);

  const products = catalog.data?.items ?? [];
  const openProduct = products.find(product => product.id === openId);

  return (
    <>
      <div className="mk-row" style={{ marginBottom: 14 }}>
        <ChannelSegment id="bzChannel" value={channel} t={t} onChange={setChannel} />
      </div>
      <div className="mk-filter">
        <input
          type="search"
          id="bzQ"
          placeholder={t("bz_search")}
          autoComplete="off"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <FacetSelect
          id="bzSector"
          value={sector}
          allLabel={t("bz_all_sectors")}
          options={facets?.sectors ?? NO_OPTIONS}
          onChange={setSector}
        />
        <FacetSelect
          id="bzCategory"
          value={category}
          allLabel={t("bz_all_cats")}
          options={facets?.categories ?? NO_OPTIONS}
          onChange={setCategory}
        />
        <FacetSelect
          id="bzRegion"
          value={region}
          allLabel={t("bz_all_regions")}
          options={facets?.regions ?? NO_OPTIONS}
          onChange={setRegion}
        />
        <label className="mk-chip is-ghost" style={CHECK_CHIP}>
          <input
            type="checkbox"
            id="bzCert"
            style={CHECK_BOX}
            checked={isCertifiedOnly}
            onChange={event => setIsCertifiedOnly(event.target.checked)}
          />{" "}
          <span>{t("bz_only_cert")}</span>
        </label>
        <label className="mk-chip is-ghost" style={CHECK_CHIP}>
          <input
            type="checkbox"
            id="bzLocal"
            style={CHECK_BOX}
            checked={isLocalOnly}
            onChange={event => setIsLocalOnly(event.target.checked)}
          />{" "}
          <span>{t("bz_only_local")}</span>
        </label>
        <span className="mk-count" id="bzCount">
          {catalog.data && t("bz_count").replace("{n}", formatNumber(catalog.data.total, lang, 0))}
        </span>
      </div>
      <div className="mk-grid" id="bzGrid">
        {catalog.isLoading && <Loading />}
        {!catalog.isLoading && !products.length && <Empty>{t("bz_empty")}</Empty>}
        {!catalog.isLoading &&
          products.map(product => (
            <ProductCard key={product.id} product={product} t={t} onOpen={() => setOpenId(product.id)} />
          ))}
      </div>
      {openProduct && (
        <ProductDrawer
          product={openProduct}
          t={t}
          onClose={() => setOpenId(null)}
          onRequestQuote={() => {
            setOpenId(null);
            onRequestQuote(openProduct);
          }}
        />
      )}
    </>
  );
}
