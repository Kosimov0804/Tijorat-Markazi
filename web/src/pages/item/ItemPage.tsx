import { useEffect } from "react";
import { CAPS, CENTERS, ICONS, OVERVIEW } from "@legacy/data.js";
import type { Center } from "@legacy/data.js";
import { useI18n } from "../../shell/i18n";
import { PublicPage } from "../../shell/PublicPage";
import { trustedHtml } from "../../shell/trustedHtml";

const MAX_RELATED = 6;
const iconMarkup = (name: string) => trustedHtml(ICONS[name] ?? "");

function findCenter(): { center: Center; index: number } | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get("type") !== "center") return null;
  const index = Number(params.get("i"));
  const center = CENTERS[index];
  return center ? { center, index } : null;
}

function NotFound() {
  const { t } = useI18n();
  return (
    <section className="section">
      <div className="container detail-notfound">
        <h1>{t("d_notfound")}</h1>
        <p>{t("d_notfound_p")}</p>
        <a className="btn btn-primary btn-lg" href="index.html">
          ← {t("d_home")}
        </a>
      </div>
    </section>
  );
}

function CenterDetail({ center, index }: { center: Center; index: number }) {
  const { t, pick } = useI18n();
  const facts = [
    { label: t("d_type"), value: t("d_badge_center") },
    { label: t("d_number"), value: center.tag },
    { label: t("d_status"), value: t("d_status_active") },
  ];
  const related = CENTERS.map((other, position) => ({ other, position }))
    .filter(({ position }) => position !== index)
    .slice(0, MAX_RELATED);

  return (
    <>
      <nav className="crumb">
        <div className="container">
          <a href="index.html">{t("d_home")}</a>
          <span>/</span>
          <a href="index.html#blocks">{t("d_sec_center")}</a>
          <span>/</span>
          <strong>{center.name}</strong>
        </div>
      </nav>

      <section className="detail-hero">
        <div className="container detail-hero-inner">
          <div className="detail-icon" dangerouslySetInnerHTML={iconMarkup(center.icon)} />
          <div className="detail-headtext">
            <span className="detail-badge">{t("d_badge_center")}</span>
            <h1>{center.name}</h1>
            <p className="detail-lead">{pick(center.desc)}</p>
            <a className="btn btn-primary btn-lg" href="index.html#contact">
              {t("d_open")}
            </a>
          </div>
        </div>
      </section>

      <section className="section detail-body">
        <div className="container detail-grid">
          <div className="detail-main">
            <h2>{t("d_overview")}</h2>
            <p className="detail-overview">{pick(OVERVIEW.center)}</p>
            <h3>{t("d_caps")}</h3>
            <ul className="caps">
              {CAPS.center.map(capability => (
                <li key={capability[0]}>{pick(capability)}</li>
              ))}
            </ul>
          </div>
          <aside className="detail-side">
            <h4>{t("d_facts")}</h4>
            {facts.map(fact => (
              <div className="fact" key={fact.label}>
                <span>{fact.label}</span>
                <b>{fact.value}</b>
              </div>
            ))}
            <div className="ad-slot ad-sidebar" data-slot="detail-side" />
          </aside>
        </div>

        {related.length > 0 && (
          <div className="container detail-related">
            <h2>{t("d_related_center")}</h2>
            <div className="rel-grid">
              {related.map(({ other, position }) => (
                <a className="rel-card" href={`item.html?type=center&i=${position}`} key={other.tag}>
                  <span className="rel-icon" dangerouslySetInnerHTML={iconMarkup(other.icon)} />
                  <span className="rel-body">
                    <b>{other.name}</b>
                    <em>{pick(other.desc)}</em>
                  </span>
                  <span className="rel-arr">→</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

export function ItemPage() {
  const found = findCenter();
  const title = found ? `${found.center.name} — TIJORAT MARKAZI` : "TIJORAT MARKAZI — 404";

  useEffect(() => {
    document.title = title;
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <PublicPage action={{ href: "assistant.html", labelKey: "btn_signin" }}>
      <main id="detail">{found ? <CenterDetail center={found.center} index={found.index} /> : <NotFound />}</main>
    </PublicPage>
  );
}
