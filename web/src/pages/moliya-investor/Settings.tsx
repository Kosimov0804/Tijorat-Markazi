import { useState } from "react";
import { REF } from "../moliya-shared/engine/engine";
import { useKit } from "../moliya-shared/kit";
import type { Kit } from "../moliya-shared/kit";
import type { Inbox, Product, RoutingSettings } from "./data";
import { PanelMessage } from "./DecisionPanels";
import { ActorStrip } from "./Inbox";
import type { InlineMessage } from "./useInvestor";

/* Why a product stays out of the registry is never left to guessing. Both
   reasons can hold at once, so this is a list, not one sentence. */
function ineligibleReasons({ t }: Kit, product: Product): string[] {
  const reasons: string[] = [];
  if (product.status !== "live") {
    reasons.push(t("msi_set_why_status").replace("{s}", t(`msi_prod_${product.status}`, product.status)));
  }
  if (!REF.currencies.includes(product.currency)) {
    reasons.push(t("msi_set_why_currency").replace("{c}", product.currency || "—"));
  }
  return reasons;
}

type ProductCardProps = {
  product: Product;
  inline: InlineMessage | null;
  onSave: (productId: string, isRoutable: boolean, minScore: number) => void;
};

function ProductCard({ product, inline, onSave }: ProductCardProps) {
  const kit = useKit();
  const { t, num, money, refName } = kit;
  const [isRoutable, setIsRoutable] = useState(product.routable);
  const [minScore, setMinScore] = useState(String(product.minScore));
  const isDead = !product.eligible;
  /* The product catalogue knows more sectors than the methodology. An id it
     cannot name is shown as it is: dropping it would read as "no limit". */
  const sectors = product.sectors.length
    ? product.sectors.map(id => refName(REF.sectors, id) || id).join(", ")
    : t("msi_set_sectors_all");
  const state = `${product.routable && !isDead ? " is-on" : ""}${isDead ? " is-dead" : ""}`;
  const minScoreId = `msi-min-${product.id}`;

  return (
    <article className={`msi-prod${state}`}>
      <div className="msi-prod-top">
        <div>
          <h4>{product.name || "—"}</h4>
          <span className="msi-prod-meta">
            {t(`ml_cat_${product.category}`, product.category)} · {product.currency || "—"}
          </span>
        </div>
        <span className={`ms-status is-${product.status === "live" ? "approved" : "draft"}`}>{t(`msi_prod_${product.status}`, product.status)}</span>
      </div>
      <dl className="mk-kv">
        <dt>{t("msi_set_limits")}</dt>
        <dd>
          {money(product.minAmount, "")} – {money(product.maxAmount, product.currency)}
        </dd>
        <dt>{t("msi_set_tenor")}</dt>
        <dd>
          {num(product.tenorMax, 0)} {t("ms_unit_years")}
        </dd>
        <dt>{t("msi_set_sectors")}</dt>
        <dd>{sectors}</dd>
      </dl>
      <div className="msi-prod-ctl">
        <label className={isDead ? "msi-toggle is-off" : "msi-toggle"}>
          <input type="checkbox" data-msi-routable={product.id} checked={isRoutable} disabled={isDead} onChange={event => setIsRoutable(event.target.checked)} />
          <i aria-hidden="true" />
          <span>{t("msi_set_routable")}</span>
        </label>
        <div className="mk-f msi-minscore">
          <label htmlFor={minScoreId}>{t("msi_set_minscore")}</label>
          <input
            type="number"
            id={minScoreId}
            data-msi-minscore={product.id}
            min="0"
            max="100"
            step="1"
            value={minScore}
            disabled={isDead}
            onChange={event => setMinScore(event.target.value)}
          />
        </div>
        <button type="button" className="btn btn-primary" data-msi-save={product.id} disabled={isDead} onClick={() => onSave(product.id, isRoutable, Number(minScore))}>
          {t("msi_set_save")}
        </button>
      </div>
      {isDead ? (
        <p className="mk-note msi-why is-bad">
          <b>{t("msi_set_not_eligible")}</b>{" "}
          {ineligibleReasons(kit, product).map(reason => (
            <span key={reason}>{reason}</span>
          ))}
        </p>
      ) : (
        <p className="mk-note msi-why">
          <b>{t("msi_set_eligible")}</b> <span>{t("msi_set_routable_hint")}</span> <span>{t("msi_set_minscore_hint")}</span>
        </p>
      )}
      <PanelMessage target={product.id} inline={inline} />
    </article>
  );
}

export type SettingsProps = Omit<ProductCardProps, "product"> & {
  inbox: Inbox;
  companyName: string;
  routing: RoutingSettings;
  /** Changes when the list was read again, so the boxes restart from it. */
  formVersion: number;
  onBack: () => void;
  onSettings: () => void;
};

/** The institution's acceptance criteria: which products take routed projects, and from what score. */
export function Settings(props: SettingsProps) {
  const { routing, formVersion, inline, onSave, onBack } = props;
  const { t, num } = useKit();
  return (
    <>
      <ActorStrip {...props} />
      <div className="ms-head">
        <div>
          <h2>{t("msi_set_title")}</h2>
          <p className="mk-sub">{t("msi_set_sub")}</p>
        </div>
        <div className="mk-actions">
          <span className="mk-count">{t("msi_set_registry").replace("{n}", num(routing.institutions, 0))}</span>
          <button type="button" className="btn btn-ghost" id="msi-back" onClick={onBack}>
            {t("msi_back")}
          </button>
        </div>
      </div>
      {routing.products.length ? (
        <div className="msi-prods">
          {routing.products.map(product => (
            <ProductCard key={`${product.id}:${formVersion}`} product={product} inline={inline} onSave={onSave} />
          ))}
        </div>
      ) : (
        <div className="ms-empty msi-empty is-setup">
          <p>
            <b>{t("msi_set_empty_title")}</b>
          </p>
          <p>{t("msi_set_empty_sub")}</p>
          <a className="btn btn-primary" href="company.html">
            {t("msi_set_empty_cta")}
          </a>
        </div>
      )}
    </>
  );
}

/** For an expert the criteria page is closed: it is the institution's own. */
export function SettingsLocked({ onBack }: { onBack: () => void }) {
  const { t } = useKit();
  return (
    <div className="ms-empty msi-empty">
      <p>
        <b>{t("msi_set_expert_title")}</b>
      </p>
      <p>{t("msi_actor_expert_sub")}</p>
      <button type="button" className="ms-link is-primary" id="msi-back" onClick={onBack}>
        {t("msi_back")}
      </button>
    </div>
  );
}
