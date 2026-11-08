import { useState } from "react";
import type { Lang, Localized } from "@legacy/data.js";
import { foldUzbek } from "../../shell/foldUzbek";
import { useI18n } from "../../shell/i18n";
import { PublicPage } from "../../shell/PublicPage";
import { SiteFooter } from "../../shell/SiteFooter";
import { useApiJson } from "../../shell/useApiJson";

type Association = {
  id: string;
  name?: string;
  i18n?: Partial<Record<Lang, string>>;
  chairman?: string;
  companies?: number;
  bizId?: string;
};

const TEXT = {
  eyebrow: ["TIJORAT MARKAZI aʼzolari", "Члены TIJORAT MARKAZI", "TIJORAT MARKAZI members"],
  sub: [
    "Har bir uyuşmaning öz sahifasi va boşqaruv paneli bor.",
    "У каждой ассоциации своя страница и панель управления.",
    "Each association has its own page and management panel.",
  ],
  search: ["Qidiriş…", "Поиск…", "Search…"],
  chair: ["Rais", "Председатель", "Chairman"],
  companies: ["kompaniya", "компаний", "companies"],
  open: ["Oçiş →", "Открыть →", "Open →"],
  none: ["Heç narsa topilmadi.", "Ничего не найдено.", "Nothing found."],
} satisfies Record<string, Localized>;

const displayName = (association: Association, lang: Lang): string =>
  (association.i18n?.[lang] || association.name || "").replace(/^[-\s]+/, "");

/* Every language is searched, so a Russian query still finds an association. */
function matches(association: Association, lang: Lang, query: string): boolean {
  const { name, i18n, chairman } = association;
  const haystack = foldUzbek([displayName(association, lang), name, i18n?.uz, i18n?.ru, i18n?.en, chairman].filter(Boolean).join(" "));
  return haystack.includes(query);
}

function AssociationCard({ association }: { association: Association }) {
  const { lang, pick } = useI18n();
  const name = displayName(association, lang);
  return (
    <div className="dir-item">
      <a className="dir-card" href={`association.html?id=${encodeURIComponent(association.id)}`}>
        <span className="dir-mark">{name.charAt(0).toUpperCase()}</span>
        <span className="dir-body">
          <b>{name}</b>
          {association.chairman ? (
            <em>
              {pick(TEXT.chair)}: {association.chairman}
            </em>
          ) : (
            <em>{" "}</em>
          )}
          <span className="dir-count">
            {association.companies} {pick(TEXT.companies)}
          </span>
        </span>
        <span className="dir-open">{pick(TEXT.open)}</span>
      </a>
      {/* Outside the card's anchor: an anchor inside an anchor is invalid. */}
      {association.bizId && (
        <a
          className="dir-bizbtn"
          href={`biznes-id.html?id=${encodeURIComponent(association.bizId)}`}
          title="Business ID"
        >
          {association.bizId}
        </a>
      )}
    </div>
  );
}

export function AssociationsPage() {
  const { lang, pick } = useI18n();
  const [search, setSearch] = useState("");
  const catalog = useApiJson<unknown>("/api/assoc/list");

  const associations =
    catalog.status === "ready" && Array.isArray(catalog.data) ? (catalog.data as Association[]) : [];
  const query = foldUzbek(search.trim());
  const visible = query ? associations.filter(item => matches(item, lang, query)) : associations;

  return (
    <PublicPage
      active="associations.html"
      action={{ href: "index.html", labelKey: "d_home" }}
      footer={
        <SiteFooter>
          <span>© 2026 TIJORAT MARKAZI.</span>
          <span>Özbekiston · Milliy savdo platformasi</span>
        </SiteFooter>
      }
    >
      <main className="section" id="dirApp">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{pick(TEXT.eyebrow)}</span>
            <h2>
              Uyuşmalar <span className="grad">katalogi</span>
            </h2>
            <p>{pick(TEXT.sub)}</p>
          </div>
          <div className="search-wrap dir-search">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="currentColor"
                d="M10 2a8 8 0 105.29 14.04l4.33 4.33 1.42-1.42-4.33-4.33A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z"
              />
            </svg>
            <input
              type="text"
              id="dirSearch"
              placeholder={pick(TEXT.search)}
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
          <div className="dir-grid" id="dirGrid">
            {catalog.status === "ready" && visible.length === 0 && <p className="empty-state">{pick(TEXT.none)}</p>}
            {visible.map(association => (
              <AssociationCard key={association.id} association={association} />
            ))}
          </div>
        </div>
      </main>
    </PublicPage>
  );
}
