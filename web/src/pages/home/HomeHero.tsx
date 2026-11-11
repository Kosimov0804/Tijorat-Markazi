import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../shell/i18n";
import { useAccount } from "../../shell/useAccount";
import { byMembers, initialOf, localName } from "./homeData";
import type { Association, DirectoryItem } from "./homeData";
import { Seal } from "./Seal";

const WALL = 8; // cards in the member wall: two columns of four
const WALL_PHONE = 6;
const MIN_WALL = 2; // fewer members than this and the wall is a gap
const PHONE = "(max-width: 560px)";
const IDEA_POINTS = ["hm_idea_l1", "hm_idea_l2", "hm_idea_l3", "hm_idea_l4", "hm_idea_l5"];

function usePhone(): boolean {
  const [isPhone, setIsPhone] = useState(() => window.matchMedia(PHONE).matches);
  useEffect(() => {
    const query = window.matchMedia(PHONE);
    const update = () => setIsPhone(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isPhone;
}

/* The platform idea, behind a button rather than on the page: the hero
   stays short and the text is there for whoever wants it. */
function IdeaDialog() {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();
  return (
    <div className="hm-idea">
      <p className="hm-idea-label">{t("hm_idea_label")}</p>
      <button className="hm-idea-btn" type="button" onClick={open}>
        <span>{t("hm_idea_btn")}</span>
        <span aria-hidden="true">→</span>
      </button>
      <dialog
        className="hm-dialog"
        ref={dialogRef}
        aria-labelledby="hmIdeaTitle"
        onClick={event => {
          if (event.target === dialogRef.current) close(); // a click on the backdrop
        }}
      >
        <div className="hm-dialog-head">
          <h2 id="hmIdeaTitle">{t("hm_idea_btn")}</h2>
          <button className="hm-dialog-x" type="button" aria-label={t("hm_idea_close")} onClick={close}>
            ✕
          </button>
        </div>
        <div className="hm-dialog-body">
          <p>{t("hm_idea_p1")}</p>
          <p>{t("lead")}</p>
          <p>{t("hm_idea_p2")}</p>
          <ul>
            {IDEA_POINTS.map(key => (
              <li key={key}>
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </div>
  );
}

function WallCard({ row, kind }: { row: Association | DirectoryItem; kind: "assoc" | "company" }) {
  const { lang, t } = useI18n();
  const name = localName(row, lang);
  const href =
    kind === "assoc"
      ? `association.html?id=${encodeURIComponent((row as Association).id)}`
      : `korxona.html?id=${encodeURIComponent((row as DirectoryItem).bizId ?? "")}`;
  const meta =
    kind === "assoc"
      ? t("hm_wall_n_comp").replace("{n}", String((row as Association).companies ?? 0))
      : (row as DirectoryItem).sector || t("hm_wall_company");
  return (
    <a className={`hm-wcard ${kind}`} href={href}>
      <span className="hm-wmark" aria-hidden="true">
        {initialOf(name)}
      </span>
      <span className="hm-wbody">
        <b>{name}</b>
        <span>{meta}</span>
      </span>
      <span className="hm-wkind">{t(kind === "assoc" ? "hm_wall_assoc" : "hm_wall_company")}</span>
    </a>
  );
}

interface MemberWallProps {
  associations: readonly Association[];
  companies: readonly DirectoryItem[];
}

/* Associations first (busiest first), then companies, until the wall is
   full; when one side is short the other fills the remaining cards. */
function MemberWall({ associations, companies }: MemberWallProps) {
  const { t } = useI18n();
  const isPhone = usePhone();
  const total = isPhone ? WALL_PHONE : WALL;
  const sorted = byMembers(associations);
  const nAssoc = Math.min(sorted.length, Math.max(Math.ceil(total / 2), total - companies.length));
  const nComp = Math.min(companies.length, total - nAssoc);
  return (
    <aside className="hm-wall" aria-label={t("hm_wall_aria")}>
      <div className="hm-wall-head">
        <span className="hub-eyebrow">{t("hm_wall_eyebrow")}</span>
        <span className="hm-wall-count">
          {t("hm_wall_n_assoc").replace("{n}", String(associations.length))} ·{" "}
          {t("hm_wall_n_comp").replace("{n}", String(companies.length))}
        </span>
      </div>
      <div className="hm-wall-grid">
        {sorted.slice(0, nAssoc).map(row => (
          <WallCard key={`a:${row.id}`} row={row} kind="assoc" />
        ))}
        {companies.slice(0, nComp).map(row => (
          <WallCard key={`c:${row.bizId}`} row={row} kind="company" />
        ))}
      </div>
      <a className="hm-wall-all hub-link" href="associations.html">
        {t("hm_wall_all")}
      </a>
    </aside>
  );
}

interface HomeHeroProps extends MemberWallProps {
  /** False until both member lists have answered. */
  isLoaded: boolean;
}

export function HomeHero({ associations, companies, isLoaded }: HomeHeroProps) {
  const { t } = useI18n();
  const { panelUrl } = useAccount();
  /* Someone already signed in came back for their own panel, not to register. */
  const primary = panelUrl ? { href: panelUrl, label: t("hero_cta_panel") } : { href: "royxatdan-otish.html", label: t("nav_register") };
  const hasWall = !isLoaded || associations.length + companies.length >= MIN_WALL;
  return (
    <section className="hero hero-hm">
      <div className={hasWall ? "container hm-container hm-hero" : "container hm-container hm-hero no-wall"}>
        <div className="hm-hero-copy">
          <span className="hm-pill">{t("hm_pill")}</span>
          <div className="hm-brandline">
            <Seal size={96} className="hm-seal hub" />
            <h1>
              <small>{t("pill")}</small>
              <span className="grad">Tijorat Markazi</span>
            </h1>
          </div>
          <IdeaDialog />
          <div className="hm-hero-cta hub-cta">
            <a className="btn btn-primary" href={primary.href}>
              {primary.label}
            </a>
            <a className="btn btn-ghost" href="associations.html">
              {t("hero_cta1")}
            </a>
          </div>
        </div>
        {hasWall && <MemberWall associations={associations} companies={companies} />}
      </div>
    </section>
  );
}
