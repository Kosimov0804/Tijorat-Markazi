import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Localized } from "@legacy/data.js";
import { useI18n } from "../../shell/i18n";
import { PublicPage } from "../../shell/PublicPage";
import { readStored, removeStored, writeStored } from "../../shell/storage";
import { ConferenceCard } from "./ConferenceCard";

const EMAIL_KEY = "kg_email";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AVATAR_STYLE = {
  width: 30,
  height: 30,
  fontSize: 13,
  display: "inline-grid",
  placeItems: "center",
  verticalAlign: "middle",
} as const;

const TEXT = {
  title: ["Konferensiyaga kiriş", "Вход на конференцию", "Join the conference"],
  sub: [
    "Email kiriting — konferensiyaga qöşiliş uçun.",
    "Введите email, чтобы присоединиться к конференции.",
    "Enter your email to join the conference.",
  ],
  button: ["Davom etiş →", "Продолжить →", "Continue →"],
  invalid: ["Töğri email kiriting", "Введите корректный email", "Enter a valid email"],
  switchEmail: ["Boşqa email", "Сменить email", "Switch email"],
} satisfies Record<string, Localized>;

function storedEmail(): string {
  const value = readStored("localStorage", EMAIL_KEY) ?? "";
  return EMAIL_PATTERN.test(value) ? value : "";
}

export function ConferencePage() {
  const { pick } = useI18n();
  const [email, setEmail] = useState(storedEmail);
  const [hasError, setHasError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSignedIn = email !== "";

  useEffect(() => {
    if (!isSignedIn) inputRef.current?.focus();
  }, [isSignedIn]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("email") ?? "")
      .trim()
      .toLowerCase();
    if (!EMAIL_PATTERN.test(value)) {
      setHasError(true);
      return;
    }
    writeStored("localStorage", EMAIL_KEY, value);
    setHasError(false);
    setEmail(value);
  };

  const handleSwitch = () => {
    removeStored("localStorage", EMAIL_KEY);
    setEmail("");
  };

  return (
    <PublicPage action={{ href: "index.html", labelKey: "d_home" }} footer={null}>
      <div className="asst-login" id="confLogin" hidden={isSignedIn}>
        <form className="lcard" id="emailForm" onSubmit={handleSubmit}>
          <span className="ai-avatar">@</span>
          <h2 id="lgTitle">{pick(TEXT.title)}</h2>
          <p id="lgSub">{pick(TEXT.sub)}</p>
          <div className="err" id="emailErr">
            {hasError && pick(TEXT.invalid)}
          </div>
          <input ref={inputRef} type="email" id="emailInput" name="email" placeholder="email@example.com" autoComplete="email" />
          <button className="btn btn-primary btn-lg" type="submit" style={{ width: "100%" }} id="lgBtn">
            {pick(TEXT.button)}
          </button>
        </form>
      </div>

      <main className="conf-page" id="confApp" hidden={!isSignedIn}>
        <div className="container">
          <div className="conf-userbar">
            <span>
              <span className="ai-avatar" style={AVATAR_STYLE}>
                @
              </span>{" "}
              <b id="uEmail">{email || "—"}</b>
            </span>
            <button className="asst-logout-link" id="switchEmail" type="button" onClick={handleSwitch}>
              {pick(TEXT.switchEmail)}
            </button>
          </div>

          <div className="conf-card panel" id="confCard">
            {isSignedIn && <ConferenceCard key={email} />}
          </div>
        </div>
      </main>
    </PublicPage>
  );
}
