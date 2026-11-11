import { useI18n } from "../../shell/i18n";
import { Drawer, formatNumber, KeyValues } from "../../shell/market";
import type { Translate } from "../../shell/market";
import { ChannelChips, UnitPrice } from "./parts";
import type { Product } from "./types";

type ProductDrawerProps = {
  product: Product;
  t: Translate;
  onClose: () => void;
  onRequestQuote: () => void;
};

/* Product detail, with the one-click actions: ask for a quote, or finance the purchase. */
export function ProductDrawer({ product, t, onClose, onRequestQuote }: ProductDrawerProps) {
  const { lang } = useI18n();
  const rows = [
    [t("bz_f_category"), product.category],
    [t("bz_sku"), product.sku],
    [t("bz_brand"), product.brand],
    [t("bz_specs"), product.specs],
    [t("bz_f_region"), product.region],
    [t("bz_stock"), product.stock ? `${formatNumber(product.stock, lang, 0)} ${product.unit}` : ""],
    ["HS-code", product.hs],
    ["Incoterms", product.incoterms.join(", ")],
    [t("bz_markets"), product.markets.join(", ")],
    [t("bz_f_certs"), product.certificates.join(", ")],
  ] as const;

  return (
    <Drawer title={product.title} onClose={onClose}>
      <ChannelChips channels={product.channels} t={t} />
      <p className="mk-desc" style={{ WebkitLineClamp: 99 }}>
        {product.desc}
      </p>
      <div className="mk-price" style={{ fontSize: 26 }}>
        <UnitPrice price={product.price} currency={product.currency} unit={product.unit} lang={lang} />
      </div>
      {product.tiers.length > 0 && (
        <div className="mk-tablewrap">
          <table className="mk-table" style={{ minWidth: 0 }}>
            <thead>
              <tr>
                <th>{t("bz_from_qty")}</th>
                <th className="num">{t("bz_unit_price")}</th>
              </tr>
            </thead>
            <tbody>
              {product.tiers.map((tier, index) => (
                <tr key={`${tier.from}|${index}`}>
                  <td>
                    {formatNumber(tier.from, lang, 0)} {product.unit}
                  </td>
                  <td className="num">
                    {formatNumber(tier.price, lang, 2)} {product.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <KeyValues rows={rows} />
      <div className="mk-actions">
        <button className="btn btn-primary" type="button" data-act="rfq" onClick={onRequestQuote}>
          {t("bz_act_rfq")}
        </button>
        <a className="btn btn-ghost" href="moliya.html#request">
          {t("bz_act_finance")}
        </a>
      </div>
      <p className="mk-note">
        {t("bz_seller_note")} <b>{product.company}</b>
        {product.sector && ` · ${product.sector}`}
      </p>
    </Drawer>
  );
}
