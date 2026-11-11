import { useEffect, useState } from "react";
import { useI18n } from "../../shell/i18n";
import { PublicPage } from "../../shell/PublicPage";
import type { HeaderAction } from "../../shell/SiteHeader";
import { removeStored, writeStored } from "../../shell/storage";
import { ping } from "./assistantApi";
import type { Backend } from "./assistantApi";
import { AssistantSidebar } from "./AssistantSidebar";
import { ChatPanel } from "./ChatPanel";
import { autoIdentity, companyTag, ensureGuestId } from "./identity";
import { LoginCard } from "./LoginCard";
import { useAssistantChat } from "./useAssistantChat";
import type { Session } from "./useAssistantChat";

/* For a cabinet account this is their own AI page, not the public site: the
   site navigation goes, and the remaining buttons stay pinned to the right
   now that the navigation no longer pushes them there. */
const CABINET_HEADER = "#nav,#burger{display:none}.header-actions{margin-left:auto}";

function initialSession(company: string): Session | null {
  /* Opened from a signed-in cabinet: that account is used, with no sign-in step. */
  const identity = autoIdentity(company);
  return identity ? { kind: "panel", ...identity } : null;
}

type AssistantAppProps = {
  session: Session;
  backend: Backend;
  company: string;
  onSignIn: () => void;
};

function AssistantApp({ session, backend, company, onSignIn }: AssistantAppProps) {
  const { t } = useI18n();
  const chat = useAssistantChat(session, backend, company);
  return (
    <div className="container">
      <div className="asst-grid">
        <AssistantSidebar
          session={session}
          isAiOn={backend.isAiOn}
          sessions={chat.sessions}
          currentId={chat.current?.id}
          onNewChat={chat.newChat}
          onOpenSession={chat.openSession}
          onSignIn={onSignIn}
        />
        <div>
          <ChatPanel chat={chat} hasBackend={backend.hasBackend} />
          <p className="asst-disclaimer">{t("asst_disclaimer")}</p>
        </div>
      </div>
    </div>
  );
}

export function AssistantPage() {
  const { t } = useI18n();
  const [company] = useState(companyTag);
  const [session, setSession] = useState<Session | null>(() => initialSession(company));
  const [backend, setBackend] = useState<Backend | null>(null);
  /* Created on the first visit, as the free-question count is kept per browser. */
  useState(ensureGuestId);

  useEffect(() => {
    let isCancelled = false;
    void ping().then(result => {
      if (!isCancelled) setBackend(result);
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const startGuest = (demoEmail: string) => {
    removeStored("localStorage", "kg_email");
    writeStored("localStorage", "kg_guest_id", demoEmail);
    writeStored("localStorage", "kg_demo_email", demoEmail);
    setSession({ kind: "guest", guestId: demoEmail, demoEmail });
  };

  const showLogin = () => {
    removeStored("localStorage", "kg_email");
    setSession(null);
  };

  const isPanel = session?.kind === "panel";
  const action: HeaderAction = isPanel
    ? { href: session.home, label: `← ${t("asst_back_panel")}` }
    : { href: "index.html", labelKey: "d_home" };
  /* Nothing is shown until the server has said whether the AI is there. */
  const isReady = backend !== null;

  return (
    <PublicPage action={action}>
      {isPanel && <style>{CABINET_HEADER}</style>}
      <LoginCard isOpen={isReady && session === null} onGuest={startGuest} />
      <main className="asst-page" id="asstApp" hidden={!isReady || session === null}>
        {backend && session && (
          <AssistantApp
            key={session.kind === "panel" ? session.email : session.guestId}
            session={session}
            backend={backend}
            company={company}
            onSignIn={showLogin}
          />
        )}
      </main>
    </PublicPage>
  );
}
