import { useState } from "react";
import { ICONS } from "@legacy/data.js";
import type { Localized } from "@legacy/data.js";
import { CountUp } from "../../shell/CountUp";
import { useI18n } from "../../shell/i18n";
import { PublicPage } from "../../shell/PublicPage";
import { trustedHtml } from "../../shell/trustedHtml";

type ProjectCategory = { id: string; name: Localized };
type Project = { name: string; cat: string; icon: string; desc: Localized };

/* The old page was committed without its dataset and has always shown its
   "no projects" state. Filling these two lists is all the page needs. */
const PROJECT_CATS: readonly ProjectCategory[] = [];
const PROJECTS: readonly Project[] = [];

const ALL = "all";

export function ProjectsPage() {
  const { t, pick } = useI18n();
  const [activeCategory, setActiveCategory] = useState(ALL);

  const visible = PROJECTS.filter(project => activeCategory === ALL || project.cat === activeCategory);
  const categoryName = (id: string): string => {
    const category = PROJECT_CATS.find(item => item.id === id);
    return category ? pick(category.name) : id;
  };
  const tabs = [
    { id: ALL, label: t("pr_all") },
    ...PROJECT_CATS.map(category => ({ id: category.id, label: pick(category.name) })),
  ];

  return (
    <PublicPage action={{ href: "index.html", labelKey: "d_home2" }}>
      <section className="hero hero-sub">
        <div className="container hero-inner hero-inner-center">
          <div className="hero-copy">
            <span className="pill">
              <span className="dot" /> <span>{t("pr_pill")}</span>
            </span>
            <h1 dangerouslySetInnerHTML={trustedHtml(t("pr_h1"))} />
            <p className="lead" dangerouslySetInnerHTML={trustedHtml(t("pr_lead"))} />
            <div className="hero-stats">
              <div className="stat">
                <CountUp target={23} />
                <span>{t("pr_stat1")}</span>
              </div>
              <div className="stat">
                <CountUp target={6} />
                <span>{t("pr_stat2")}</span>
              </div>
              <div className="stat">
                <b>2035</b>
                <span>{t("pr_stat3")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="projects">
        <div className="container">
          <div className="block-tabs" id="projTabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={tab.id === activeCategory ? "block-tab active" : "block-tab"}
                onClick={() => setActiveCategory(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="centers-grid" id="projectsGrid">
            {visible.map(project => (
              <div className="center-card reveal in" key={project.name}>
                <span className="center-tag">{categoryName(project.cat)}</span>
                <div className="center-icon" dangerouslySetInnerHTML={trustedHtml(ICONS[project.icon] ?? "")} />
                <h3>{project.name}</h3>
                <p>{pick(project.desc)}</p>
              </div>
            ))}
          </div>
          <p className="empty-note" id="projEmpty" hidden={visible.length > 0}>
            {t("pr_empty")}
          </p>
        </div>
      </section>

      <section className="section" id="proj-cta">
        <div className="container">
          <div className="cta-band panel">
            <div>
              <h2>{t("pr_cta_h")}</h2>
              <p>{t("pr_cta_p")}</p>
            </div>
            <a className="btn btn-primary btn-lg" href="assistant.html">
              {t("pr_cta_btn")}
            </a>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
