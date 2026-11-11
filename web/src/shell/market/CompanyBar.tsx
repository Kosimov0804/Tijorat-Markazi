/*
 * The company sign-in strip above a seller or employer cabinet.
 *
 *   <CompanyBar id prefix t company onSignIn onSignOut />
 *
 * `prefix` picks both the element ids and the dictionary keys, as the old
 * pages named them: "bz" gives #bzLogin, #bzPass, #bzIn, #bzOut and the keys
 * bz_login_hint, bz_login, bz_pass, bz_enter, bz_logout, bz_login_fail.
 */
import { useState } from "react";
import type { CompanySession, Translate } from "./mk";
import { Chip } from "./MarketParts";

type CompanyBarProps = {
  id: string;
  prefix: string;
  t: Translate;
  company: CompanySession | null;
  onSignIn: (login: string, password: string) => Promise<boolean>;
  onSignOut: () => void;
};

export function CompanyBar({ id, prefix, t, company, onSignIn, onSignOut }: CompanyBarProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [hasFailed, setHasFailed] = useState(false);

  const signIn = async (): Promise<void> => {
    const isAccepted = await onSignIn(login.trim(), password);
    setHasFailed(!isAccepted);
    if (isAccepted) setPassword("");
  };

  if (company) {
    return (
      <div className="mk-id" id={id}>
        <b>{company.name}</b> <Chip kind="accent">{company.sector || "—"}</Chip>
        <span className="mk-id-r">
          <button className="btn btn-ghost" type="button" id={`${prefix}Out`} onClick={onSignOut}>
            {t(`${prefix}_logout`)}
          </button>
        </span>
      </div>
    );
  }
  return (
    <>
      <div className="mk-id" id={id}>
        <span>{t(`${prefix}_login_hint`)}</span>
        <span className="mk-id-r">
          <input
            id={`${prefix}Login`}
            placeholder={t(`${prefix}_login`)}
            autoComplete="username"
            value={login}
            onChange={event => setLogin(event.target.value)}
          />
          <input
            id={`${prefix}Pass`}
            type="password"
            placeholder={t(`${prefix}_pass`)}
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter") void signIn();
            }}
          />
          <button className="btn btn-primary" type="button" id={`${prefix}In`} onClick={() => void signIn()}>
            {t(`${prefix}_enter`)}
          </button>
        </span>
      </div>
      {hasFailed && <p className="mk-msg is-err">{t(`${prefix}_login_fail`)}</p>}
    </>
  );
}
