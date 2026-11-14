/**
 * CABINET LOGIN FORM — the .admin-login card each cabinet shows when signed out.
 *
 *   <CabinetLogin
 *     idPrefix="as"                       // ids: asLogin, asForm, asErr, asLoginInp, asPassInp
 *     title lead buttonLabel              // already translated
 *     errorText="Wrong login or password"
 *     onSubmit={(login, password) => submit(login, password)}  // false shows errorText
 *   />
 *
 * Pair it with useCabinetLogin, whose submit() has exactly that signature.
 */
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

type CabinetLoginProps = {
  idPrefix: string;
  title: string;
  lead: string;
  buttonLabel: string;
  errorText: string;
  onSubmit: (login: string, password: string) => Promise<boolean>;
};

export function CabinetLogin({ idPrefix, title, lead, buttonLabel, errorText, onSubmit }: CabinetLoginProps) {
  const [hasFailed, setHasFailed] = useState(false);
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
    if (isBusy) return;
    setIsBusy(true);
    const isAccepted = await onSubmit(loginRef.current?.value ?? "", passwordRef.current?.value ?? "");
    /* An accepted sign-in replaces this form with the cabinet. */
    if (!isMounted.current) return;
    setIsBusy(false);
    setHasFailed(!isAccepted);
  };

  return (
    <div className="admin-login" id={`${idPrefix}Login`}>
      <form id={`${idPrefix}Form`} onSubmit={handleSubmit}>
        <h2 id="lgTitle">{title}</h2>
        <p id="lgSub">{lead}</p>
        <div className="err" id={`${idPrefix}Err`} role="alert">
          {hasFailed ? errorText : ""}
        </div>
        <input type="text" id={`${idPrefix}LoginInp`} placeholder="login" autoComplete="username" ref={loginRef} />
        <input
          type="password"
          id={`${idPrefix}PassInp`}
          placeholder="parol"
          autoComplete="current-password"
          ref={passwordRef}
        />
        <button className="btn btn-primary btn-lg" type="submit" id="lgBtn" style={{ width: "100%" }}>
          {buttonLabel}
        </button>
      </form>
    </div>
  );
}
