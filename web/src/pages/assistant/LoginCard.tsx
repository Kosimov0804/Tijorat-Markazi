import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useI18n } from "../../shell/i18n";
import { navigate } from "../../shell/navigate";
import { resolveLogin } from "../../shell/resolveLogin";

type LoginCardProps = {
  isOpen: boolean;
  /** Demo access with a checked gmail address. */
  onGuest: (demoEmail: string) => void;
};

const FOCUS_DELAY_MS = 50;
/* Demo access requires a @gmail.com address before entering the guest chat. */
const GMAIL = /^[^\s@]+@gmail\.com$/;

/* The unified sign-in: the credentials are tried against every account tier
   and, on a match, the visitor is sent to their own cabinet, which signs
   itself in from the session keys the server answered with. */
export function LoginCard({ isOpen, onGuest }: LoginCardProps) {
  const { t } = useI18n();
  const [hasLoginError, setHasLoginError] = useState(false);
  const [hasDemoError, setHasDemoError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginRef = useRef<HTMLInputElement>(null);
  const demoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => loginRef.current?.focus(), FOCUS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const login = String(form.get("login") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!login && !password) {
      setHasLoginError(true);
      return;
    }
    setIsSubmitting(true);
    setHasLoginError(false);
    const target = await resolveLogin(login, password);
    if (target) {
      navigate.to(target);
      return;
    }
    setHasLoginError(true);
    setIsSubmitting(false);
  };

  const enterDemo = () => {
    const email = (demoRef.current?.value ?? "").trim().toLowerCase();
    if (!GMAIL.test(email)) {
      setHasDemoError(true);
      demoRef.current?.focus();
      return;
    }
    setHasDemoError(false);
    onGuest(email);
  };

  return (
    <div className="asst-login" id="asstLogin" hidden={!isOpen}>
      <form className="lcard" id="emailForm" onSubmit={event => void handleSubmit(event)}>
        <button
          type="button"
          className="lcard-close"
          id="loginClose"
          aria-label="Yopiş"
          title="Yopiş"
          onClick={() => navigate.to("index.html")}
        >
          ✕
        </button>
        <span className="ai-avatar">AI</span>
        <h2>{t("asst_login_title")}</h2>
        <p>{t("asst_login_sub")}</p>
        <div className="err" id="emailErr">
          {hasLoginError && t("asst_login_err")}
        </div>
        <input type="text" id="loginInput" name="login" ref={loginRef} placeholder={t("asst_login_ph")} autoComplete="username" />
        <input type="password" id="passInput" name="password" placeholder={t("asst_pass_ph")} autoComplete="current-password" />
        <button className="btn btn-primary btn-lg" type="submit" style={{ width: "100%" }} disabled={isSubmitting}>
          {t("asst_enter")}
        </button>
        <div className="asst-login-or">
          <span>{t("asst_demo_or")}</span>
        </div>
        <input
          type="email"
          id="demoEmailInput"
          ref={demoRef}
          placeholder={t("asst_demo_email_ph")}
          autoComplete="email"
          onKeyDown={event => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            enterDemo();
          }}
        />
        <div className="err" id="demoErr">
          {hasDemoError && t("asst_demo_email_err")}
        </div>
        <button className="btn btn-ghost btn-lg" type="button" id="demoBtn" style={{ width: "100%" }} onClick={enterDemo}>
          {t("asst_demo_btn")}
        </button>
      </form>
    </div>
  );
}
