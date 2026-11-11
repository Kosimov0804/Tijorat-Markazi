import { useEffect, useState } from "react";
import { dialogs } from "../../shell/dialogs";
import { useI18n } from "../../shell/i18n";
import {
  Chip,
  CompanyBar,
  companyIdentity,
  Empty,
  formatMoney,
  formatNumber,
  Loading,
  marketJson,
  Meters,
  Rail,
  useCompany,
  useLoad,
} from "../../shell/market";
import type { CompanySession, Translate } from "../../shell/market";
import { InquiryList } from "./InquiryList";
import { ChannelChips } from "./parts";
import { ProductComposer } from "./ProductComposer";
import { QuoteDrawer } from "./QuoteDrawer";
import { SellerInbox } from "./SellerInbox";
import { parseSeller } from "./types";
import type { Deal, InboxItem, Product, SellerCabinet } from "./types";

const DEAL_STAGES = ["lead", "qualified", "rfq", "quote", "negotiation", "order", "fulfilment", "closed"];

/** Posts with the signed-in company's credentials attached. */
const postAsCompany = (path: string, body: object) => marketJson(path, companyIdentity.withCompany(body));

function DealCard({ deal, t }: { deal: Deal; t: Translate }) {
  const { lang } = useI18n();
  return (
    <div className="mk-card" style={{ gap: 8 }}>
      <div className="mk-chips">
        <span className={`mk-chip is-${deal.channel}`}>{deal.channel.toUpperCase()}</span>
        <Chip kind="accent">{t(`stage_${deal.stage}`)}</Chip>
      </div>
      <h3>{deal.title}</h3>
      <div className="mk-meta">
        <span>
          {deal.buyerName} → {deal.sellerName}
        </span>
        <span className="mk-price" style={{ fontSize: 15 }}>
          {formatMoney(deal.value, deal.currency, lang)}
        </span>
      </div>
      {deal.risks.length > 0 && (
        <div className="mk-chips">
          {deal.risks.map((risk, index) => (
            <Chip key={index} kind="warn">
              {risk}
            </Chip>
          ))}
        </div>
      )}
      <Rail steps={DEAL_STAGES} current={deal.stage} />
    </div>
  );
}

function OwnProduct({ product, t, onDelete }: { product: Product; t: Translate; onDelete: () => void }) {
  const { lang } = useI18n();
  const price = product.price
    ? `${formatNumber(product.price, lang, 2)} ${product.currency}/${product.unit}`
    : "—";
  return (
    <div className="mk-card" style={{ gap: 7 }}>
      <ChannelChips channels={product.channels} t={t} />
      <h3>{product.title}</h3>
      <div className="mk-meta">
        <span className="mk-price" style={{ fontSize: 15 }}>
          {price}
        </span>
        {product.moq > 0 && (
          <span>
            MOQ <b>{formatNumber(product.moq, lang, 0)}</b>
          </span>
        )}
        <Chip kind={product.status === "live" ? "good" : "ghost"}>{t(`status_${product.status}`)}</Chip>
      </div>
      <div className="mk-actions">
        <button className="btn btn-ghost" type="button" data-del={product.id} onClick={onDelete}>
          {t("bz_delete")}
        </button>
      </div>
    </div>
  );
}

type CabinetProps = { cabinet: SellerCabinet; company: CompanySession; t: Translate; onChanged: () => void };

function Cabinet({ cabinet, company, t, onChanged }: CabinetProps) {
  const { lang } = useI18n();
  const [quoting, setQuoting] = useState<InboxItem | null>(null);
  const newInquiries = cabinet.inquiries.filter(inquiry => inquiry.status === "new").length;

  const deleteProduct = async (id: string): Promise<void> => {
    if (!(await dialogs.confirm(t("bz_confirm_del"), { tone: "danger" }))) return;
    await postAsCompany("/api/bozor/product/delete", { id });
    onChanged();
  };
  const answerInquiry = async (body: { id: string; text?: string; status?: string }): Promise<void> => {
    await postAsCompany("/api/bozor/inquiry/reply", body);
    onChanged();
  };

  return (
    <div className="mk-bento">
      <div className="mk-box w3 is-lead">
        <h3>{t("bz_trust")}</h3>
        <div className="mk-score-big">
          <b>{cabinet.trust.level}</b>
          <span>{cabinet.trust.badge}</span>
        </div>
        <div className="mk-meta">
          <span>
            {t("bz_products")} <b>{formatNumber(cabinet.trust.products, lang, 0)}</b>
          </span>
          <span>
            {t("bz_deals")} <b>{formatNumber(cabinet.trust.deals, lang, 0)}</b>
          </span>
        </div>
      </div>
      <div className="mk-box w3">
        <h3>{t("bz_export_ready")}</h3>
        <div className="mk-score-big">
          <b>{formatNumber(cabinet.exportScore, lang, 0)}</b>
          <span>/ 100</span>
        </div>
        <Meters blocks={cabinet.exportBlocks} />
      </div>
      <div className="mk-box w6">
        <h3>{t("bz_inbox")}</h3>
        <SellerInbox items={cabinet.inbox} t={t} onQuote={setQuoting} />
      </div>
      <div className="mk-box w6">
        <h3>{t("bz_my_products")}</h3>
        <div className="mk-stack" id="bzMine">
          {cabinet.products.map(product => (
            <OwnProduct key={product.id} product={product} t={t} onDelete={() => void deleteProduct(product.id)} />
          ))}
          {!cabinet.products.length && <Empty>{t("bz_no_products")}</Empty>}
        </div>
      </div>
      <div className="mk-box w6">
        <h3>
          {t("bz_inquiries")}{" "}
          <span className="mk-chip">
            {formatNumber(newInquiries, lang, 0)} {t("bz_iq_new")}
          </span>
        </h3>
        <div className="mk-stack">
          <InquiryList
            inquiries={cabinet.inquiries}
            t={t}
            onReply={(id, text) => void answerInquiry({ id, text })}
            onClose={id => void answerInquiry({ id, status: "closed" })}
          />
        </div>
      </div>
      <ProductComposer company={company} t={t} onSaved={onChanged} />
      <div className="mk-box w12">
        <h3>{t("bz_deals")}</h3>
        <div className="mk-grid">
          {cabinet.deals.map((deal, index) => (
            <DealCard key={`${deal.title}|${index}`} deal={deal} t={t} />
          ))}
          {!cabinet.deals.length && <Empty>{t("bz_no_deals")}</Empty>}
        </div>
      </div>
      {quoting && (
        <QuoteDrawer item={quoting} t={t} onClose={() => setQuoting(null)} onSent={onChanged} />
      )}
    </div>
  );
}

type SignedInProps = { company: CompanySession; t: Translate; onExpired: () => void };

function SignedIn({ company, t, onExpired }: SignedInProps) {
  const cabinet = useLoad(`seller|${company.login}`, async () =>
    parseSeller(await postAsCompany("/api/bozor/seller", {})),
  );
  const isRefused = !cabinet.isLoading && cabinet.data !== null && !cabinet.data.ok;

  /* Credentials the server no longer accepts are dropped, as the old page did. */
  useEffect(() => {
    if (isRefused) onExpired();
  }, [isRefused, onExpired]);

  if (cabinet.isLoading || !cabinet.data) return <Loading />;
  if (isRefused) return <Empty>{t("bz_login_needed")}</Empty>;
  return <Cabinet cabinet={cabinet.data} company={company} t={t} onChanged={cabinet.reload} />;
}

export function SellerPanel({ t }: { t: Translate }) {
  const { company, signIn, signOut } = useCompany();
  return (
    <>
      <CompanyBar id="bzId" prefix="bz" t={t} company={company} onSignIn={signIn} onSignOut={signOut} />
      <div id="bzSeller">
        {company ? (
          <SignedIn company={company} t={t} onExpired={signOut} />
        ) : (
          <Empty>{t("bz_login_needed")}</Empty>
        )}
      </div>
    </>
  );
}
