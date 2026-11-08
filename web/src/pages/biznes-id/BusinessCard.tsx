import type { Lang } from "@legacy/data.js";
import { dialogs } from "../../shell/dialogs";
import { useI18n } from "../../shell/i18n";
import { formatDay, formatNumber, safeHttpUrl } from "../../shell/market/mk";
import type { Translate } from "../../shell/market/mk";
import { ProductTiles } from "../../shell/market/ProductTiles";
import type { ProductTile } from "../../shell/market/ProductTiles";

type Contact = { phone?: string; email?: string; location?: string; website?: string };
type Member = { name: string; bizId: string; sector?: string; products?: number };

export type Card = {
  ok?: boolean;
  kind: string;
  bizId: string;
  name: string;
  i18n?: Partial<Record<Lang, string>>;
  url?: string;
  since?: number;
  chairman?: string;
  sector?: string;
  memberCount?: number;
  productCount?: number;
  assoc?: { name: string; bizId?: string } | null;
  contact?: Contact;
  companies?: Member[];
  showroom?: ProductTile[];
};

export const kindLabel = (kind: string, t: Translate): string => t(kind === "assoc" ? "bid_assoc" : "bid_company");

export const IdPlate = ({ id }: { id: string }) => <span className="bid-plate">{id}</span>;

type ContactRowProps = { label: string; value: string; href?: string };

function ContactRow({ label, value, href }: ContactRowProps) {
  const opensElsewhere = href && /^https?:/.test(href);
  return (
    <div className="bid-row">
      <span className="bid-row-k">{label}</span>{" "}
      {href ? (
        <a
          className="bid-row-v"
          href={href}
          target={opensElsewhere ? "_blank" : undefined}
          rel={opensElsewhere ? "noopener noreferrer" : undefined}
        >
          {value}
        </a>
      ) : (
        <span className="bid-row-v">{value}</span>
      )}
    </div>
  );
}

/* A row renders only when it has a value; an empty card shows a note. */
function ContactRows({ contact, t }: { contact: Contact; t: Translate }) {
  const { phone, email, location, website } = contact;
  if (!phone && !email && !location && !website) return <p className="bid-empty">{t("bid_no_contact")}</p>;
  return (
    <>
      {phone && <ContactRow label={t("bid_phone")} value={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`} />}
      {email && <ContactRow label={t("bid_email")} value={email} href={`mailto:${email}`} />}
      {location && <ContactRow label={t("bid_location")} value={location} />}
      {/* Keeps a javascript: address off the page even if one were ever stored. */}
      {website && <ContactRow label={t("bid_website")} value={website} href={safeHttpUrl(website)} />}
    </>
  );
}

/* The name opens the company itself; its number opens the company's own card. */
function MemberList({ companies, t }: { companies: Member[]; t: Translate }) {
  const { lang } = useI18n();
  if (!companies.length) return <p className="bid-empty">{t("bid_no_members")}</p>;
  return (
    <ul className="bid-members">
      {companies.map(company => (
        <li key={company.bizId}>
          <a href={`korxona.html?id=${encodeURIComponent(company.bizId)}`}>
            <b>{company.name}</b>
          </a>{" "}
          <a className="bid-mono bid-memberid" href={`biznes-id.html?id=${encodeURIComponent(company.bizId)}`} title="Business ID">
            {company.bizId}
          </a>{" "}
          <span className="bid-meta">
            {company.sector || "—"}
            {Boolean(company.products) && ` · ${formatNumber(company.products, lang, 0)} ${t("bid_products")}`}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Facts({ card, t }: { card: Card; t: Translate }) {
  const { lang } = useI18n();
  const count = (value: number | undefined): string => (value ? formatNumber(value, lang, 0) : "");
  const rows =
    card.kind === "assoc"
      ? [
          { key: "bid_chairman", value: card.chairman },
          { key: "bid_members", value: count(card.memberCount) },
          { key: "bid_products", value: count(card.productCount) },
        ]
      : [
          { key: "bid_sector", value: card.sector },
          { key: "bid_member_of", value: card.assoc?.name ?? "" },
          { key: "bid_products", value: count(card.productCount) },
        ];
  const filled = rows.filter(row => row.value !== "" && row.value != null);
  if (!filled.length) return <p className="bid-empty">—</p>;
  return (
    <>
      {filled.map(row => (
        <div className="bid-row" key={row.key}>
          <span className="bid-row-k">{t(row.key)}</span>{" "}
          <span className="bid-row-v">
            {row.key === "bid_member_of" && card.assoc?.bizId ? (
              <a href={`biznes-id.html?id=${encodeURIComponent(card.assoc.bizId)}`}>{row.value}</a>
            ) : (
              row.value
            )}
          </span>
        </div>
      ))}
    </>
  );
}

export function BusinessCard({ card, t }: { card: Card; t: Translate }) {
  const { lang } = useI18n();
  const name = card.i18n?.[lang] || card.name;
  const isAssoc = card.kind === "assoc";

  const handleCopy = async () => {
    const link = card.url || window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      dialogs.toast(t("bid_copied"), { tone: "success" });
    } catch {
      await dialogs.prompt(t("bid_copy"), link);
    }
  };

  return (
    <>
      <article className="bid-card" data-kind={card.kind}>
        <span className="bid-weave" aria-hidden="true" />
        <header className="bid-head">
          <div className="bid-head-main">
            <span className="bid-kind">{kindLabel(card.kind, t)}</span>
            <h1>{name}</h1>
            <p className="bid-official">{t("bid_official")}</p>
          </div>
          {/* An <img> onto the server-rendered SVG: the same code on screen and in print. */}
          <figure className="bid-qr">
            <img
              src={`/api/business-id/qr.svg?id=${encodeURIComponent(card.bizId)}`}
              alt={`${card.bizId} QR`}
              width="132"
              height="132"
            />
            <figcaption>{t("bid_scan")}</figcaption>
          </figure>
        </header>

        <div className="bid-panel">
          <div className="bid-num">
            <span className="bid-row-k">{t("bid_number")}</span> <IdPlate id={card.bizId} />{" "}
            {Boolean(card.since) && (
              <span className="bid-meta">
                {t("bid_since")}: {formatDay(card.since, lang)}
              </span>
            )}
          </div>

          <div className="bid-cols">
            <section className="bid-block">
              <h2>{t("bid_contact")}</h2>
              <ContactRows contact={card.contact ?? {}} t={t} />
            </section>
            <section className="bid-block">
              <h2>{kindLabel(card.kind, t)}</h2>
              <Facts card={card} t={t} />
            </section>
          </div>
        </div>

        <div className="bid-actions">
          <button className="btn btn-primary" type="button" id="bidPrint" onClick={() => window.print()}>
            {t("bid_print")}
          </button>{" "}
          <button className="btn btn-ghost" type="button" id="bidCopy" onClick={() => void handleCopy()}>
            {t("bid_copy")}
          </button>
        </div>
      </article>

      <section className="bid-extra">
        <h2>{t(isAssoc ? "bid_members" : "bid_showroom")}</h2>
        {isAssoc ? (
          <MemberList companies={card.companies ?? []} t={t} />
        ) : (
          <ProductTiles
            products={card.showroom ?? []}
            emptyText={t("bid_no_products")}
            askPriceText={t("pd_price_ask")}
          />
        )}
      </section>
    </>
  );
}
