import { useEffect } from "react";
import { useI18n } from "../i18n";
import { PublicPage } from "../PublicPage";
import { SiteFooter } from "../SiteFooter";
import { useApiJson } from "../useApiJson";
import { LegalDocBody } from "./LegalDocBody";
import { pickDocText, readOperatorField, toDocLang } from "./types";
import type { LegalConfig, LegalText } from "./types";

const TABS = [
  { href: "oferta.html", label: "Ommaviy oferta" },
  { href: "maxfiylik.html", label: "Maxfiylik siyosati" },
  { href: "shartlar.html", label: "Foydalaniş şartlari" },
] as const;

type LegalPageProps = {
  docKey: "oferta" | "maxfiylik" | "shartlar";
  doc: LegalText;
  /** Shown until the config supplies the official title. */
  fallbackTitle: string;
};

export function LegalPage({ docKey, doc, fallbackTitle }: LegalPageProps) {
  const { lang } = useI18n();
  const state = useApiJson<LegalConfig>("/api/legal");
  const isSettled = state.status !== "loading";
  const config = state.status === "ready" && state.data.ok ? state.data : null;

  const docLang = toDocLang(lang);
  const meta = config?.docs?.[docKey];
  const title = pickDocText(meta?.title, docLang);
  const brand = readOperatorField(config?.operator?.brand, docLang) || "TIJORAT MARKAZI";
  const version = meta?.version || "—";
  const effective = meta?.effective || "—";
  const stamp =
    docLang === "ru" ? `Версия ${version} · действует с ${effective}` : `Versiya ${version} · amal qiladi ${effective}`;

  useEffect(() => {
    if (title) document.title = `${title} — ${brand}`;
  }, [title, brand]);

  return (
    <PublicPage
      hideServices
      hasMonumentBackground={false}
      hasSessionActions={false}
      footer={<SiteFooter isBottomInContainer />}
    >
      <main>
        <article className="lg-page">
          <div className="container lg-inner">
            <nav className="lg-tabs" aria-label="Huquqiy hujjatlar">
              {TABS.map(tab => (
                <a key={tab.href} href={tab.href} aria-current={tab.href === `${docKey}.html` ? "page" : undefined}>
                  {tab.label}
                </a>
              ))}
            </nav>

            <header className="lg-head">
              <h1 id="lgTitle">{title || fallbackTitle}</h1>
              <p className="lg-stamp" id="lgStamp">
                {isSettled && stamp}
              </p>
            </header>

            <div id="lgBody" className="lg-body">
              {isSettled && <LegalDocBody docKey={docKey} doc={doc} config={config} lang={lang} />}
            </div>
          </div>
        </article>
      </main>
    </PublicPage>
  );
}
