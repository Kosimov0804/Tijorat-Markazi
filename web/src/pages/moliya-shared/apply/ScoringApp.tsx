import { T_MOLIYA } from "@legacy/markets-i18n.js";
import { T_MS } from "@legacy/moliya-scoring-i18n.js";
import type { Track } from "../engine/types";
import { MoliyaText, useKit } from "../kit";
import { MoliyaFrame } from "../MoliyaFrame";
import { Dashboard } from "./Dashboard";
import { visibleItems } from "./data";
import { Methodology } from "./Methodology";
import { Results } from "./Results";
import { Teaser } from "./Teaser";
import { noticeText, useScoring } from "./useScoring";
import type { ScoringController } from "./useScoring";
import { Wizard } from "./wizard/Wizard";

/* The scoring strings laid over the market ones, as the old controller did. */
const DICTIONARY = { ...T_MOLIYA, ...T_MS };

/** A visitor nobody has identified yet: a state with an invitation, not an error. */
function NeedIdentity() {
  const { t } = useKit();
  return (
    <div className="mk-card ms-empty">
      <p>
        <b>{t("ms_need_login")}</b>
      </p>
      <p className="mk-note">{t("ms_sub")}</p>
      <a className="btn btn-primary" href="kirish.html">
        {t("ms_need_login")}
      </a>
    </div>
  );
}

function CurrentView({ track, app }: { track: Track; app: ScoringController }) {
  const kit = useKit();
  const { view, wizard, opened, home } = app;
  if (view === "wizard" && wizard) {
    return (
      <Wizard
        track={track}
        {...wizard}
        onEdit={app.editDraft}
        onRestructure={edit => app.editDraft(edit, true)}
        onJump={app.jumpTo}
        onBack={app.backToList}
        onSave={app.save}
      />
    );
  }
  if (view === "results" && opened) {
    return (
      <Results
        opened={opened}
        picks={app.picks}
        onPick={app.pick}
        onResetPicks={app.resetPicks}
        onBack={app.backToList}
        onTeaser={() => app.go("teaser")}
        onEdit={app.editOpened}
        onSubmit={app.submit}
      />
    );
  }
  if (view === "teaser" && opened) return <Teaser opened={opened} onBack={app.backToList} />;
  if (view === "methodology") return <Methodology onBack={app.backToList} />;
  if (!home) return null;
  return (
    <Dashboard
      track={track}
      stats={home.stats}
      total={home.items.length}
      rows={visibleItems(home.items, app.query, kit)}
      query={app.query}
      onQuery={app.setQuery}
      onSort={app.sortBy}
      onNew={() => app.startWizard(null)}
      onMethodology={() => app.go("methodology")}
      onOpen={app.openProject}
      onEdit={app.editProject}
    />
  );
}

function ScoringRoot({ track }: { track: Track }) {
  const { t } = useKit();
  const app = useScoring(track);
  const { notice } = app;
  return (
    <MoliyaFrame
      action={{ href: "moliya.html", label: t("msh_back") }}
      eyebrow={t(`msp_eyebrow_${track}`)}
      headingHtml={t(`msp_h1_${track}`)}
      lead={t(`msp_lead_${track}`)}
      pulse={<div className="mk-pulse" id="msPulse" aria-live="polite" />}
    >
      <div id="msRoot">
        {notice && (
          <p className={`mk-msg is-${notice.kind}`} role={notice.kind === "err" ? "alert" : "status"}>
            {noticeText(notice, t)}
          </p>
        )}
        {app.isBusy ? <p className="mk-loading">{t("mk_loading")}</p> : app.isGuest ? <NeedIdentity /> : <CurrentView track={track} app={app} />}
      </div>
    </MoliyaFrame>
  );
}

/** One page per track: the company page and the startup page mount this with their own. */
export function ScoringApp({ track }: { track: Track }) {
  return (
    <MoliyaText dictionary={DICTIONARY}>
      <ScoringRoot track={track} />
    </MoliyaText>
  );
}
