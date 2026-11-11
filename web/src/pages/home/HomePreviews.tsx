import type { ReactNode } from "react";
import { useI18n } from "../../shell/i18n";
import { byMembers, byPhoto, initialOf, localName } from "./homeData";
import type { Association, ShowroomItem } from "./homeData";

const PREVIEW = 6;

const CHIPS = [
  { href: "about.html", labelKey: "nav_about" },
  { href: "associations.html", labelKey: "nav_uyush" },
  { href: "bozor.html", labelKey: "nav_bozor" },
  { href: "moliya.html", labelKey: "nav_moliya" },
  { href: "mehnat.html", labelKey: "nav_mehnat" },
  { href: "showroom.html", labelKey: "nav_showroom" },
  { href: "xizmatlar.html", labelKey: "nav_services" },
] as const;

interface PreviewSectionProps {
  id: string;
  headKey: string;
  bodyKey: string;
  allHref: string;
  children: ReactNode;
}

/* The flush-left head with a "view all" link on the right, as on assembly.uz. */
function PreviewSection({ id, headKey, bodyKey, allHref, children }: PreviewSectionProps) {
  const { t } = useI18n();
  return (
    <section className="hm-section" id={id}>
      <div className="container hm-container">
        <div className="hm-head">
          <div className="hm-head-copy">
            <h2>{t(headKey)}</h2>
            <p>{t(bodyKey)}</p>
          </div>
          <a className="hm-head-link" href={allHref}>
            {t("hm_view_all")}
          </a>
        </div>
        <div className="hm-grid">{children}</div>
      </div>
    </section>
  );
}

function AssociationCard({ association }: { association: Association }) {
  const { lang, t } = useI18n();
  const name = localName(association, lang);
  return (
    <a className="hm-card" href={`association.html?id=${encodeURIComponent(association.id)}`}>
      <div className="hm-card-media assoc">
        <span className="hm-mark">{initialOf(name)}</span>
      </div>
      <div className="hm-card-body">
        <div className="meta">
          <span className="hm-count">
            {association.companies ?? 0} {t("hm_as_comp")}
          </span>
        </div>
        <h3>{name}</h3>
        {association.chairman && (
          <p>
            {t("hm_as_chair")}: {association.chairman}
          </p>
        )}
        <span className="hm-more">{t("hm_as_open")}</span>
      </div>
    </a>
  );
}

function ProductCard({ item }: { item: ShowroomItem }) {
  const { t } = useI18n();
  return (
    <a className="hm-card" href={`mahsulot.html?id=${encodeURIComponent(item.id)}`}>
      {item.img ? (
        <div className="hm-card-media">
          <img src={item.img} alt="" loading="lazy" />
        </div>
      ) : (
        <div className="hm-card-media ph">🛍️</div>
      )}
      <div className="hm-card-body">
        <div className="meta">
          <b>{item.company}</b>
          {item.sector && (
            <>
              <span aria-hidden="true">•</span>
              <span>{item.sector}</span>
            </>
          )}
        </div>
        <h3>{item.name}</h3>
        {item.desc && <p>{item.desc}</p>}
        {item.price && <span className="price">{item.price}</span>}
        <span className="hm-more">{t("hm_sh_open")}</span>
      </div>
    </a>
  );
}

interface HomePreviewsProps {
  associations: readonly Association[];
  products: readonly ShowroomItem[];
}

/* Each preview removes itself when its data is empty: an empty grid under a
   heading looks broken, whereas a missing section reads as a shorter page. */
export function HomePreviews({ associations, products }: HomePreviewsProps) {
  return (
    <>
      {associations.length > 0 && (
        <PreviewSection id="homeAssoc" headKey="hm_as_h" bodyKey="hm_as_p" allHref="associations.html">
          {byMembers(associations)
            .slice(0, PREVIEW)
            .map(association => (
              <AssociationCard key={association.id} association={association} />
            ))}
        </PreviewSection>
      )}
      {products.length > 0 && (
        <PreviewSection id="homeShow" headKey="hm_sh_h" bodyKey="hm_sh_p" allHref="showroom.html">
          {byPhoto(products)
            .slice(0, PREVIEW)
            .map(item => (
              <ProductCard key={item.id} item={item} />
            ))}
        </PreviewSection>
      )}
    </>
  );
}

export function JoinCard() {
  const { t } = useI18n();
  return (
    <section className="hm-join">
      <div className="container hm-container">
        <div className="hm-join-card">
          <h2>{t("hm_join_h")}</h2>
          <p>{t("hm_join_p")}</p>
          <a className="hm-join-btn" href="royxatdan-otish.html">
            {t("hm_join_btn")}
          </a>
        </div>
      </div>
    </section>
  );
}

export function MottoBand() {
  const { t } = useI18n();
  return (
    <section className="hm-band hm-motto" aria-labelledby="hmMotto">
      <div className="container hm-container">
        <p className="big" id="hmMotto">
          {t("hm_motto")}
        </p>
        <p className="sub">{t("hm_motto_p")}</p>
        <nav className="hm-chips" aria-label={t("hm_go")}>
          {CHIPS.map(chip => (
            <a className="hm-chip" href={chip.href} key={chip.href}>
              {t(chip.labelKey)}
            </a>
          ))}
        </nav>
      </div>
      <span className="hm-band-foot" aria-hidden="true" />
    </section>
  );
}
