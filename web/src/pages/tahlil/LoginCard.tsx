import { useState } from "react";
import type { FormEvent } from "react";
import type { Translate } from "../../shell/market";
import { goTo } from "../../shell/navigate";
import { resolveLogin } from "../../shell/resolveLogin";
import { analystLogin } from "./data";
import type { AnalystSession } from "./data";

const OWN_PAGE = "tahlil.html";

type LoginCardProps = { t: Translate; onSignedIn: (session: AnalystSession) => void };

export function LoginCard({ t, onSignedIn }: LoginCardProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsBusy(true);
    setHasFailed(false);
    const session = await analystLogin(login.trim(), password);
    if (session) {
      onSignedIn(session);
      return;
    }
    /* Not an analyst account, but it may well be a company, association or
       admin one. The shared resolver routes them to their own cabinet rather
       than telling them their password is wrong. */
    const target = await resolveLogin(login, password);
    if (target && target !== OWN_PAGE) {
      goTo(target);
      return;
    }
    setHasFailed(true);
    setPassword("");
    setIsBusy(false);
  };

  return (
    <section className="admin-login" id="anLogin">
      <form className="an-login-card" id="anForm" onSubmit={handleSubmit}>
        <span className="eyebrow">{t("an_eyebrow")}</span>
        <h1 id="anLgTitle">{t("an_title")}</h1>
        <p className="co-sub" id="anLgSub">
          {t("an_login_sub")}
        </p>
        <input
          id="anLogin1"
          placeholder="Login"
          aria-label="Login"
          autoComplete="username"
          required
          value={login}
          onChange={event => setLogin(event.target.value)}
        />
        <input
          id="anPass"
          type="password"
          placeholder="Parol"
          aria-label="Parol"
          autoComplete="current-password"
          required
          value={password}
          onChange={event => setPassword(event.target.value)}
        />
        <button className="btn btn-primary" type="submit" id="anLgBtn" disabled={isBusy}>
          {t("an_login_btn")}
        </button>
        <p className="an-err" id="anErr" role="alert">
          {hasFailed && t("an_bad_creds")}
        </p>
        <a className="an-back" href="index.html" id="anBackSite">
          {t("an_back")}
        </a>
      </form>
    </section>
  );
}
