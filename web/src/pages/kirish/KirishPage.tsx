import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useI18n } from "../../shell/i18n";
import { replaceWith } from "../../shell/navigate";
import { PageBackground } from "../../shell/PageBackground";
import { resolveLogin } from "../../shell/resolveLogin";
import { SiteFooter } from "../../shell/SiteFooter";
import { readStored } from "../../shell/storage";
import { TEXT } from "./text";

/* The one login page. It collects a login and a password, hands them to the
   shared resolver and goes wherever that says: which cabinet you belong to is
   the resolver's business, not the form's. */

const SAME_SITE_PAGE = /^[a-z0-9._-]+\.html$/i;
const CABINETS = [
  { key: "kg_as", url: "association.html" },
  { key: "kg_co", url: "company.html" },
  { key: "kg_an", url: "tahlil.html" },
  { key: "kg_by", url: "xaridor.html" },
] as const;

/* Only ever return to a page on this site: an attacker-supplied ?next=
   pointing at another origin would turn the login into an open redirect. */
function safeNext(): string | null {
  const raw = new URLSearchParams(window.location.search).get("next") ?? "";
  if (!SAME_SITE_PAGE.test(raw)) return null;
  /* Never bounce back to here. */
  return /^kirish\.html$/i.test(raw) ? null : raw;
}

function hasStoredLogin(key: string): boolean {
  try {
    const session: unknown = JSON.parse(readStored("sessionStorage", key) ?? "null");
    return typeof session === "object" && session !== null && Boolean((session as { login?: unknown }).login);
  } catch {
    /* A corrupt slot is simply not a session. */
    return false;
  }
}

function currentCabinet(): string | null {
  if (readStored("sessionStorage", "kg_admin") === "1") return "admin.html";
  return CABINETS.find(({ key }) => hasStoredLogin(key))?.url ?? null;
}

type ErrorKey = "ki_bad" | "ki_empty";

export function KirishPage() {
  const { pick } = useI18n();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const loginRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const title = pick(TEXT.ki_title);

  useEffect(() => {
    document.title = `${title} — TIJORAT MARKAZI`;
  }, [title]);

  useEffect(() => {
    /* Someone already signed in has no business on the login page. */
    const cabinet = currentCabinet();
    if (cabinet) replaceWith(safeNext() ?? cabinet);
    else loginRef.current?.focus();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;
    if (!login.trim() || !password) {
      setErrorKey("ki_empty");
      return;
    }
    setIsBusy(true);
    setErrorKey(null);
    const target = await resolveLogin(login, password);
    if (target) {
      /* ?next= is honoured only when it was a real destination; otherwise go
         to whichever cabinet the credentials actually belong to. */
      replaceWith(safeNext() ?? target);
      return;
    }
    setIsBusy(false);
    setErrorKey("ki_bad");
    setPassword("");
    passwordRef.current?.focus();
  };

  return (
    <>
      <PageBackground />
      <section className="admin-login" id="kiScreen">
        <form className="ki-card" id="kiForm" autoComplete="on" onSubmit={handleSubmit}>
          <span className="eyebrow" id="kiEyebrow">
            {pick(TEXT.ki_eyebrow)}
          </span>
          <h1 id="kiTitle">{title}</h1>
          <p className="ki-sub" id="kiSub">
            {pick(TEXT.ki_sub)}
          </p>

          <div className="err" id="kiErr" role="alert" aria-live="polite">
            {errorKey && pick(TEXT[errorKey])}
          </div>

          <label className="ki-f">
            <span id="kiLoginLb">{pick(TEXT.ki_login)}</span>
            <input
              id="kiLogin"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              ref={loginRef}
              value={login}
              onChange={event => setLogin(event.target.value)}
            />
          </label>
          <label className="ki-f">
            <span id="kiPassLb">{pick(TEXT.ki_pass)}</span>
            <input
              id="kiPass"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              ref={passwordRef}
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </label>

          <button
            className="btn btn-primary btn-lg"
            type="submit"
            id="kiBtn"
            style={{ width: "100%" }}
            disabled={isBusy}
          >
            {pick(isBusy ? TEXT.ki_wait : TEXT.ki_btn)}
          </button>

          <p className="ki-roles" id="kiRoles">
            {pick(TEXT.ki_roles)}
          </p>

          <div className="ki-foot">
            <a href="royxatdan-otish.html" id="kiReg">
              {pick(TEXT.ki_reg)}
            </a>
            <a href="index.html" id="kiBack">
              {pick(TEXT.ki_back)}
            </a>
          </div>
        </form>
      </section>
      <SiteFooter />
    </>
  );
}
