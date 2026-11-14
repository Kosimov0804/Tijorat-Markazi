import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Translate } from "../../shell/market";

type LoginCardProps = {
  t: Translate;
  /** The line under the button: a refused sign-in or a cabinet that would not load. */
  errorKey: string | null;
  /** Resolves to false when the form should stay and the password be retyped. */
  onSubmit: (login: string, password: string) => Promise<boolean>;
};

export function LoginCard({ t, errorKey, onSubmit }: LoginCardProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const loginRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loginRef.current?.focus();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!login.trim() || !password) return;
    setIsBusy(true);
    const isAccepted = await onSubmit(login.trim(), password);
    /* An accepted sign-in replaces this form with the cabinet. */
    if (!isMounted.current) return;
    setIsBusy(false);
    if (isAccepted) return;
    setPassword("");
    passwordRef.current?.focus();
  };

  return (
    <section className="admin-login" id="xrLoginView">
      <form className="an-login-card" id="xrForm" onSubmit={handleSubmit}>
        <span className="eyebrow">{t("xr_brand")}</span>
        <h1>{t("xr_login_h")}</h1>
        <p className="co-sub">{t("xr_login_sub")}</p>
        <input
          id="xrLogin"
          placeholder="Login"
          aria-label="Login"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          ref={loginRef}
          value={login}
          onChange={event => setLogin(event.target.value)}
        />
        <input
          id="xrPass"
          type="password"
          placeholder="••••••••"
          aria-label="Parol"
          autoComplete="current-password"
          required
          ref={passwordRef}
          value={password}
          onChange={event => setPassword(event.target.value)}
        />
        <button className="btn btn-primary" type="submit" id="xrBtn" disabled={isBusy}>
          {t("xr_login_btn")}
        </button>
        <p className="an-err" id="xrErr" role="alert">
          {errorKey && t(errorKey)}
        </p>
        <a className="an-back" href="xaridor-royxat.html">
          {t("xr_no_account")}
        </a>
        <a className="an-back" href="index.html">
          {t("xr_back_site")}
        </a>
      </form>
    </section>
  );
}
