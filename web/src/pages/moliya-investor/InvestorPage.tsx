import { useEffect, useRef } from "react";
import { T_MOLIYA } from "@legacy/markets-i18n.js";
import { T_MS_INV } from "@legacy/moliya-investor-i18n.js";
import { T_MS } from "@legacy/moliya-scoring-i18n.js";
import { MoliyaText, useKit } from "../moliya-shared/kit";
import { MoliyaFrame } from "../moliya-shared/MoliyaFrame";
import { ExpertPanel, InterestPanel } from "./DecisionPanels";
import { DossierView } from "./DossierView";
import { Inbox } from "./Inbox";
import { Settings, SettingsLocked } from "./Settings";
import { useInvestor } from "./useInvestor";
import type { InvestorController, View } from "./useInvestor";

/* The market strings, the scoring ones over them, the cabinet's own on top. */
const DICTIONARY = { ...T_MOLIYA, ...T_MS, ...T_MS_INV };
const STICKY_HEADER_PX = 110;

/* When the VIEW changes the visitor would otherwise land mid-page, below the
   new screen's heading. A redraw of the same view stays where it is. */
function useScrollToViewStart(view: View) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shownView = useRef(view);
  useEffect(() => {
    if (shownView.current === view) return;
    shownView.current = view;
    const frame = requestAnimationFrame(() => {
      const top = rootRef.current?.getBoundingClientRect().top;
      if (top !== undefined && top < STICKY_HEADER_PX) window.scrollTo(0, Math.max(0, top + window.scrollY - STICKY_HEADER_PX));
    });
    return () => cancelAnimationFrame(frame);
  }, [view]);
  return rootRef;
}

/** An unidentified visitor: a state with an invitation, not an error. */
function NeedIdentity() {
  const { t } = useKit();
  return (
    <div className="mk-card ms-empty msi-empty">
      <p>
        <b>{t("msi_login_title")}</b>
      </p>
      <p>{t("msi_login_sub")}</p>
      <a className="btn btn-primary" href="kirish.html">
        {t("msi_login_cta")}
      </a>
    </div>
  );
}

function CurrentView({ app }: { app: InvestorController }) {
  const { t } = useKit();
  const { inbox, dossier, routing } = app;
  if (app.isBusy) return <p className="mk-loading">{t("mk_loading")}</p>;
  if (app.failed) {
    return (
      <div className="mk-card ms-empty msi-empty">
        <p>
          <b>{app.failed.key ? t(app.failed.key) : app.failed.raw}</b>
        </p>
        <button type="button" className="btn btn-ghost" id="msi-back" onClick={app.reload}>
          {t("msi_back")}
        </button>
      </div>
    );
  }
  if (!app.isIdentified || !inbox) return <NeedIdentity />;
  const shared = { inbox, companyName: app.companyName, onSettings: app.openSettings };
  if (app.view === "dossier" && dossier) {
    const panel = inbox.isInstitution ? (
      <InterestPanel dossier={dossier} draft={app.draftInterest} inline={app.inline} onPick={app.pickInterest} onNote={app.noteInterest} onSave={app.storeInterest} />
    ) : (
      <ExpertPanel dossier={dossier} inline={app.inline} onStatus={app.changeStatus} />
    );
    return <DossierView key={app.formVersion} dossier={dossier} isInstitution={inbox.isInstitution} panel={panel} onBack={app.reload} />;
  }
  if (app.view === "settings") {
    if (!inbox.isInstitution || !routing) return <SettingsLocked onBack={app.reload} />;
    return <Settings {...shared} routing={routing} formVersion={app.formVersion} inline={app.inline} onSave={app.storeRouting} onBack={app.reload} />;
  }
  return <Inbox {...shared} filter={app.filter} onFilter={app.changeFilter} onClear={app.clearFilter} onOpen={app.openDossier} onExport={app.exportCsv} />;
}

function InvestorRoot() {
  const { t, num } = useKit();
  const app = useInvestor();
  const rootRef = useScrollToViewStart(app.view);
  const stats = app.inbox?.stats;
  /* The pulse keeps the two numbers of the queue on screen when a dossier
     scrolls the stat tiles away. */
  const pulse = (
    <div className="mk-pulse" id="msiPulse" aria-live="polite">
      <div>
        <b>{num(stats?.total ?? 0, 0)}</b>
        <span>{t("msi_pulse_queue")}</span>
      </div>
      <div>
        <b>{num(stats?.shortlist ?? 0, 0)}</b>
        <span>{t("msi_pulse_shortlist")}</span>
      </div>
    </div>
  );
  return (
    <MoliyaFrame action={{ href: "moliya.html", label: t("msh_back") }} eyebrow={t("msi_eyebrow")} headingHtml={t("msi_h1")} lead={t("msi_lead")} pulse={pulse}>
      <div id="msiRoot" ref={rootRef}>
        <CurrentView app={app} />
      </div>
    </MoliyaFrame>
  );
}

/** The institution's side of the scoring queue: inbox, dossier, acceptance criteria. */
export function InvestorPage() {
  return (
    <MoliyaText dictionary={DICTIONARY}>
      <InvestorRoot />
    </MoliyaText>
  );
}
