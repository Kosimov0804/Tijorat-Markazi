import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import { useI18n } from "../../shell/i18n";
import {
  Empty,
  formatMoney,
  formatNumber,
  formValues,
  KeyValues,
  listOf,
  Loading,
  marketJson,
} from "../../shell/market";
import type { Translate } from "../../shell/market";
import { AskDrawer } from "./AskDrawer";
import { parseProduct } from "./types";
import type { Cabinet, Product, Supplier } from "./types";
import { useSavedToggle } from "./useSavedToggle";

type CatalogViewProps = { cabinet: Cabinet; t: Translate; onSaved: (suppliers: Supplier[]) => void };

/* /api/buyer/products pins the channel server side; nothing here can widen
   it, which is why no channel parameter is sent at all. */
function catalogUrl(form: HTMLFormElement): string {
  const values = formValues(form);
  const query = new URLSearchParams();
  (["q", "region", "maxLead", "maxMoq"] as const).forEach(name => {
    const value = (values[name] ?? "").trim();
    if (value) query.set(name, value);
  });
  if (values.certified) query.set("certified", "1");
  return `/api/buyer/products?${query.toString()}`;
}

type ProductCardProps = {
  product: Product;
  isSaved: boolean;
  isSaving: boolean;
  t: Translate;
  onAsk: () => void;
  onToggleSaved: () => void;
};

function ProductCard({ product, isSaved, isSaving, t, onAsk, onToggleSaved }: ProductCardProps) {
  const { lang } = useI18n();
  const moq = product.moq ? `${formatNumber(product.moq, lang, 0)} ${product.unit}` : "";
  const lead = product.leadTime ? `${formatNumber(product.leadTime, lang, 0)} ${t("xr_days")}` : "";
  return (
    <article className="mk-card">
      <h3>{product.title}</h3>
      <p className="mk-sub">
        {product.company}
        {product.region && ` · ${product.region}`}
      </p>
      <p className="mk-price">
        {product.price ? formatMoney(product.price, product.currency, lang) : "—"}{" "}
        {product.unit && <small>/ {product.unit}</small>}
      </p>
      <KeyValues
        rows={[
          [t("xr_moq"), moq],
          [t("xr_lead"), lead],
        ]}
      />
      <div className="mk-card-foot">
        <button className="btn btn-primary" type="button" onClick={onAsk}>
          {t("xr_ask")}
        </button>
        <button className="btn btn-ghost" type="button" disabled={isSaving} onClick={onToggleSaved}>
          {isSaved ? t("xr_saved_on") : t("xr_save")}
        </button>
      </div>
    </article>
  );
}

type CatalogFilterProps = {
  t: Translate;
  count: string;
  formRef: RefObject<HTMLFormElement | null>;
  onSearch: (form: HTMLFormElement) => void;
};

function CatalogFilter({ t, count, formRef, onSearch }: CatalogFilterProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSearch(event.currentTarget);
  };
  const handleClear = (): void => {
    const form = formRef.current;
    if (!form) return;
    form.reset();
    onSearch(form);
  };
  return (
    <form className="mk-filter" id="xrCatForm" ref={formRef} onSubmit={handleSubmit}>
      <input type="search" id="xrQ" name="q" autoComplete="off" placeholder={t("xr_search_ph")} />
      <input type="text" id="xrRegion" name="region" placeholder={t("xr_f_region")} />
      <input type="number" id="xrLead" name="maxLead" min="0" placeholder={t("xr_f_maxlead")} />
      <input type="number" id="xrMoq" name="maxMoq" min="0" placeholder={t("xr_f_maxmoq")} />
      <label className="mk-chip is-ghost" style={{ cursor: "pointer" }}>
        <input type="checkbox" id="xrCert" name="certified" value="1" style={{ accentColor: "var(--mk)" }} />{" "}
        <span>{t("xr_f_cert")}</span>
      </label>
      <button className="btn btn-primary" type="submit">
        {t("xr_search")}
      </button>
      <button className="btn btn-ghost" type="button" id="xrClear" onClick={handleClear}>
        {t("xr_reset")}
      </button>
      <span className="mk-count" id="xrCount">
        {count}
      </span>
    </form>
  );
}

/** The B2B shelf. It stays mounted, so the filters and the last result survive a view switch. */
export function CatalogView({ cabinet, t, onSaved }: CatalogViewProps) {
  const { lang } = useI18n();
  const [rows, setRows] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [asked, setAsked] = useState<Product | null>(null);
  const latestSearch = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const saved = useSavedToggle(cabinet, onSaved);

  const search = useCallback(async (form: HTMLFormElement): Promise<void> => {
    const run = ++latestSearch.current;
    setIsLoading(true);
    const answer = await marketJson(catalogUrl(form));
    /* A slow earlier answer must not overwrite a later one. */
    if (run !== latestSearch.current) return;
    setRows(listOf(answer.items, parseProduct));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (formRef.current) void search(formRef.current);
  }, [search]);

  const count = rows ? t("xr_found").replace("{n}", formatNumber(rows.length, lang, 0)) : "";
  const isSaved = (product: Product): boolean => cabinet.home.saved.some(supplier => supplier.id === product.companyId);

  return (
    <div className="panel co-panel">
      <div className="co-panel-head">
        <span className="co-ic">🔎</span>
        <h2>{t("xr_v_catalog")}</h2>
      </div>
      <p className="co-sub">{t("xr_b2b_note")}</p>
      <CatalogFilter t={t} count={count} formRef={formRef} onSearch={form => void search(form)} />
      <div id="xrCatOut">
        {isLoading || !rows ? (
          <Loading />
        ) : rows.length === 0 ? (
          <Empty>{t("xr_cat_empty")}</Empty>
        ) : (
          <div className="mk-grid">
            {rows.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isSaved={isSaved(product)}
                isSaving={saved.pendingId === product.companyId}
                t={t}
                onAsk={() => setAsked(product)}
                onToggleSaved={() => void saved.toggle(product.companyId)}
              />
            ))}
          </div>
        )}
      </div>
      {asked && <AskDrawer product={asked} cabinet={cabinet} t={t} onClose={() => setAsked(null)} />}
    </div>
  );
}
