import { AB_FEATURES, AB_HOW, AB_ROLES, ICONS } from "@legacy/data.js";
import { useI18n } from "../../shell/i18n";
import { PublicPage } from "../../shell/PublicPage";
import { SiteFooter } from "../../shell/SiteFooter";
import { trustedHtml } from "../../shell/trustedHtml";

const iconMarkup = (name: string) => trustedHtml(ICONS[name] ?? "");

interface SectionHeadProps {
  eyebrowKey: string;
  headingKey: string;
  bodyKey?: string;
}

function SectionHead({ eyebrowKey, headingKey, bodyKey }: SectionHeadProps) {
  const { t } = useI18n();
  return (
    <div className="section-head">
      <span className="eyebrow">{t(eyebrowKey)}</span>
      <h2 dangerouslySetInnerHTML={trustedHtml(t(headingKey))} />
      {bodyKey && <p>{t(bodyKey)}</p>}
    </div>
  );
}

export function AboutPage() {
  const { t, pick } = useI18n();
  return (
    <PublicPage
      active="about.html"
      action={{ href: "index.html", labelKey: "d_home2" }}
      footer={<SiteFooter hasRegisterLink />}
    >
      <section className="hero hero-sub">
        <div className="container hero-inner hero-inner-center">
          <div className="hero-copy">
            <span className="pill">
              <span className="dot" /> <span>{t("ab_pill")}</span>
            </span>
            <h1 dangerouslySetInnerHTML={trustedHtml(t("ab_h1"))} />
            <p className="lead" dangerouslySetInnerHTML={trustedHtml(t("ab_lead"))} />
          </div>
        </div>
      </section>

      <section className="section" id="mission">
        <div className="container">
          <div className="about-split">
            <div className="section-head about-head-left">
              <span className="eyebrow">{t("ab_mission_e")}</span>
              <h2 dangerouslySetInnerHTML={trustedHtml(t("ab_mission_h"))} />
            </div>
            <p className="about-body">{t("ab_mission_p")}</p>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="container">
          <SectionHead eyebrowKey="ab_struct_e" headingKey="ab_struct_h" bodyKey="ab_struct_p" />
          <div className="centers-grid" id="featuresGrid">
            {AB_FEATURES.map(feature => (
              <div className="center-card reveal in" key={feature.code}>
                <span className="center-tag">{feature.code}</span>
                <div className="center-icon" dangerouslySetInnerHTML={iconMarkup(feature.icon)} />
                <h3>{pick(feature.name)}</h3>
                <p>{pick(feature.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="roles">
        <div className="container">
          <SectionHead eyebrowKey="ab_pillars_e" headingKey="ab_pillars_h" />
          <div className="future-grid" id="rolesGrid">
            {AB_ROLES.map(role => (
              <div className="future-card reveal in" key={role.icon}>
                <span className="fi" dangerouslySetInnerHTML={iconMarkup(role.icon)} />
                <h4>{pick(role.name)}</h4>
                <p>{pick(role.desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="container">
          <SectionHead eyebrowKey="ab_values_e" headingKey="ab_values_h" />
          <div className="values-grid" id="howGrid">
            {AB_HOW.map((step, index) => (
              <div className="value-card reveal in" key={step[0]}>
                <span className="value-num">{String(index + 1).padStart(2, "0")}</span>
                <b>{pick(step)}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="about-cta">
        <div className="container">
          <div className="cta-band panel">
            <div>
              <h2>{t("ab_cta_h")}</h2>
              <p>{t("ab_cta_p")}</p>
            </div>
            <a className="btn btn-primary btn-lg" href="showroom.html">
              {t("nav_showroom")}
            </a>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
