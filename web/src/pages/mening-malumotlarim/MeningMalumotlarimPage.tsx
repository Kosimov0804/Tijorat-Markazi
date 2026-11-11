import { useState } from "react";
import type { FormEvent } from "react";
import { T_DSR } from "@legacy/dsr-i18n.js";
import { LegalPanel } from "../../shell/legal/LegalPanel";
import { postLegal } from "../../shell/legal/panelData";
import type { Credentials } from "../../shell/legal/panelData";
import { useMarketText } from "../../shell/market/mk";
import type { Translate } from "../../shell/market/mk";
import { goTo } from "../../shell/navigate";
import { PublicPage } from "../../shell/PublicPage";
import { readStored, removeStored } from "../../shell/storage";

/* The standalone rights page. The rights live in every cabinet's settings; this
   page covers the two cases a cabinet cannot: a reader of the privacy policy
   who is not signed in, and someone whose access was suspended, including by
   their own withdrawal of consent. All it does is establish who is asking and
   hand over to the same LegalPanel the cabinets render.

   The credentials typed here are deliberately NOT stored: this is not a sign-in
   surface for the rest of the site. */

/* Tried in the order /api/auth/login resolves the tiers, so a browser holding
   two stale sessions behaves the way the server would. */
const SLOTS = [
  ["kg_co", "company"],
  ["kg_by", "buyer"],
  ["kg_as", "assoc"],
] as const;

function readSlot(key: string, tier: string): Credentials | null {
  try {
    const session: unknown = JSON.parse(readStored("sessionStorage", key) ?? "null");
    if (typeof session !== "object" || session === null) return null;
    const { login, password } = session as { login?: unknown; password?: unknown };
    if (typeof login !== "string" || !login) return null;
    return { login, password: typeof password === "string" ? password : "", tier };
  } catch {
    /* A corrupt slot is simply not a session. */
    return null;
  }
}

function storedSession(): Credentials | null {
  for (const [key, tier] of SLOTS) {
    const session = readSlot(key, tier);
    if (session) return session;
  }
  return null;
}

function signOutHome(): void {
  SLOTS.forEach(([key]) => removeStored("sessionStorage", key));
  goTo("index.html");
}

function SignInForm({ onSignedIn, t }: { onSignedIn: (who: Credentials) => void; t: Translate }) {
  const [hasFailed, setHasFailed] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const candidate: Credentials = {
      login: String(data.get("login") ?? "").trim(),
      password: String(data.get("password") ?? ""),
      tier: "",
    };
    /* The export endpoint IS the identity check: it resolves the subject from
       the credentials server-side and refuses anything it cannot place. */
    const answer = await postLegal("/api/legal/export", candidate);
    if (answer?.ok) onSignedIn(candidate);
    else setHasFailed(true);
  };

  return (
    <>
      <div className="lg-note lg-note-info">{t("dsr_login_why")}</div>
      <form className="rg-card" id="dsrLogin" style={{ maxWidth: 420 }} onSubmit={handleSubmit}>
        <h2>{t("dsr_login_h")}</h2>
        <div className="mk-form">
          <div className="mk-f wide">
            <label htmlFor="dsrLg">{t("dsr_lg")}</label>
            <input id="dsrLg" name="login" autoComplete="username" spellCheck={false} required />
          </div>
          <div className="mk-f wide">
            <label htmlFor="dsrPw">{t("dsr_pw")}</label>
            <input id="dsrPw" name="password" type="password" autoComplete="current-password" required />
          </div>
        </div>
        <div className="mk-actions">
          <button className="btn btn-primary" type="submit">
            {t("dsr_login_btn")}
          </button>
        </div>
        {hasFailed && <p className="mk-msg err">{t("dsr_login_bad")}</p>}
      </form>
    </>
  );
}

export function MeningMalumotlarimPage() {
  const t = useMarketText(T_DSR);
  const [who, setWho] = useState<Credentials | null>(storedSession);

  return (
    <PublicPage hideServices hasMonumentBackground={false} hasSessionActions={false}>
      <main>
        <article className="lg-page">
          <div className="container lg-inner">
            <header className="lg-head">
              <h1>{t("dsr_h1")}</h1>
              <p className="lg-stamp">{t("dsr_sub")}</p>
            </header>

            <div id="dsrBody" className="lg-body">
              {who ? (
                <LegalPanel
                  credentials={() => who}
                  panelClass="lg-page-panel"
                  showCorrection
                  onWithdrawn={signOutHome}
                />
              ) : (
                <SignInForm onSignedIn={setWho} t={t} />
              )}
            </div>
          </div>
        </article>
      </main>
    </PublicPage>
  );
}
