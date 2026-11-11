import { CountUp } from "../../shell/CountUp";
import { useI18n } from "../../shell/i18n";
import { Seal } from "./Seal";

const MARKETS = [
  { tone: "t1", badge: "BZ", href: "bozor.html", labelKey: "nav_bozor" },
  { tone: "t2", badge: "MB", href: "moliya.html", labelKey: "nav_moliya" },
  { tone: "t3", badge: "MH", href: "mehnat.html", labelKey: "nav_mehnat" },
  { tone: "t4", badge: "SR", href: "showroom.html", labelKey: "nav_showroom" },
] as const;

const VALUES = [1, 2, 3, 4, 5] as const;

const ECOSYSTEM = [
  { tone: "t3", href: "xizmatlar.html", headKey: "hm_eco1_h", listKey: "hm_eco1_l" },
  { tone: "t2", href: "davlat-xizmatlari.html", headKey: "hm_eco2_h", listKey: "hm_eco2_l" },
  { tone: "t1", href: "biznes-id.html", headKey: "hm_eco3_h", listKey: "hm_eco3_l" },
  { tone: "t4", href: "conference.html", headKey: "hm_eco4_h", listKey: "hm_eco4_l" },
  { tone: "t3", href: "assistant.html", headKey: "hm_eco5_h", listKey: "hm_eco5_l" },
] as const;

/* Real counts only: a muted dash while the platform is empty or the endpoint
   is unreachable, never a stand-in number. */
function LiveCount({ value, className }: { value: number | null; className: string }) {
  if (!value) {
    return (
      <span className={`${className} hub-live`} style={{ opacity: 0.45 }}>
        —
      </span>
    );
  }
  return (
    <span className={`${className} hub-live`}>
      <CountUp target={value} />
    </span>
  );
}

interface StructureBandProps {
  companyCount: number | null;
  associationCount: number | null;
}

export function StructureBand({ companyCount, associationCount }: StructureBandProps) {
  const { t } = useI18n();
  return (
    <section className="hm-band" aria-labelledby="hmStructTitle">
      <div className="container hm-container">
        <div className="hm-head">
          <div className="hm-head-copy">
            <h2 id="hmStructTitle">{t("hm_str_h")}</h2>
            <p>{t("hm_str_p")}</p>
          </div>
          <a className="hm-head-link" href="about.html">
            {t("hm_str_link")}
          </a>
        </div>

        <div className="hub">
          <div className="hub-panel hub-markets">
            <span className="hub-eyebrow">{t("hm_markets_eyebrow")}</span>
            <p className="hub-note">{t("hm_markets_p")}</p>
            <ul className="hub-list">
              {MARKETS.map(market => (
                <li key={market.badge}>
                  <a className={`hub-row ${market.tone}`} href={market.href}>
                    <span className="hub-badge" aria-hidden="true">
                      {market.badge}
                    </span>
                    <span>{t(market.labelKey)}</span>
                    <span className="hub-go" aria-hidden="true">
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <a className="hub-link" href="xizmatlar.html">
              {t("hm_markets_all")}
            </a>
          </div>

          <a className="hub-panel hub-core" href="showroom.html">
            <Seal size={112} className="hub-seal" />
            <LiveCount value={companyCount} className="hub-big" />
            <span className="hub-eyebrow">{t("hm_core_eyebrow")}</span>
            <p className="hub-note">{t("hm_core_p")}</p>
            <span className="hub-link">{t("hm_core_link")}</span>
          </a>

          <div className="hub-panel hub-assoc">
            <span className="hub-eyebrow hub-eyebrow-cool">{t("hm_assoc_eyebrow")}</span>
            <div className="hub-count">
              <LiveCount value={associationCount} className="" />
              <span>{t("hm_assoc_unit")}</span>
            </div>
            <p className="hub-note">{t("hm_assoc_p")}</p>
            <a className="hub-link" href="associations.html">
              {t("hm_assoc_link")}
            </a>
          </div>
        </div>

        <ul className="hm-values">
          {VALUES.map(n => (
            <li key={n}>
              <i>{String(n).padStart(2, "0")}</i>
              <b>{t(`hm_v${n}_t`)}</b>
              <span>{t(`hm_v${n}_s`)}</span>
            </li>
          ))}
        </ul>

        <div className="hm-eco hub">
          <div className="hm-eco-head">
            <h3>{t("hm_eco_h")}</h3>
            <p>{t("hm_eco_p")}</p>
          </div>
          <div className="hm-eco-grid">
            {ECOSYSTEM.map(card => (
              <a className={`hm-eco-card ${card.tone}`} href={card.href} key={card.href}>
                <h4>{t(card.headKey)}</h4>
                <span className="rule" />
                <ul>
                  {t(card.listKey)
                    .split("|")
                    .map(item => item.trim())
                    .filter(Boolean)
                    .map(item => (
                      <li key={item}>{item}</li>
                    ))}
                </ul>
              </a>
            ))}
          </div>
          <p className="hm-eco-more">{t("hm_eco_more")}</p>
        </div>
      </div>
      <span className="hm-band-foot" aria-hidden="true" />
    </section>
  );
}
