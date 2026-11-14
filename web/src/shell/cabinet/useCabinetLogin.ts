/**
 * CABINET LOGIN — the sign-in life cycle every cabinet page shares.
 *
 *   const { state, submit, signOut } = useCabinetLogin({
 *     storageKey: "kg_as",                 // this cabinet's session slot
 *     ownPage: "association.html",         // where this cabinet lives
 *     signIn: pair => loadAccount(pair),   // the tier's own login call; null = refused
 *   });
 *
 *   state.status  "checking"   a stored session is being re-verified with the
 *                              server (sessionStorage alone is never trusted)
 *                 "signedOut"  show the login form
 *                 "signedIn"   state.credentials and state.account are set
 *   submit(login, password)    tries this tier first. When it refuses, the pair
 *                              goes to the cross-role resolver (auth.js): someone
 *                              who typed another tier's credentials is sent to
 *                              THEIR cabinet. Resolves to false only when the
 *                              form should say "wrong login or password".
 *   signOut()                  forgets the session and shows the form; where to
 *                              go next is the page's own business.
 *
 * `signIn` may reject on a network failure; that counts as a refusal.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { goTo } from "../navigate";
import { resolveLogin } from "../resolveLogin";
import { clearCabinetSession, readCabinetSession, writeCabinetSession } from "./session";
import type { CabinetCredentials } from "./session";

export type CabinetLoginState<Account> =
  | { status: "checking" }
  | { status: "signedOut" }
  | { status: "signedIn"; credentials: CabinetCredentials; account: Account };

export type CabinetLoginOptions<Account> = {
  storageKey: string;
  ownPage: string;
  signIn: (credentials: CabinetCredentials) => Promise<Account | null>;
};

export type CabinetLogin<Account> = {
  state: CabinetLoginState<Account>;
  submit: (login: string, password: string) => Promise<boolean>;
  signOut: () => void;
};

export function useCabinetLogin<Account>(options: CabinetLoginOptions<Account>): CabinetLogin<Account> {
  const { storageKey, ownPage } = options;
  const [state, setState] = useState<CabinetLoginState<Account>>(() =>
    readCabinetSession(storageKey) ? { status: "checking" } : { status: "signedOut" },
  );
  const latestSignIn = useRef(options.signIn);
  latestSignIn.current = options.signIn;

  const attempt = useCallback(
    async (credentials: CabinetCredentials): Promise<Account | null> => {
      const account = await latestSignIn.current(credentials).catch(() => null);
      if (account !== null) writeCabinetSession(storageKey, credentials);
      return account;
    },
    [storageKey],
  );

  useEffect(() => {
    const stored = readCabinetSession(storageKey);
    if (!stored) return undefined;
    let isCurrent = true;
    void attempt(stored).then(account => {
      if (!isCurrent) return;
      if (account === null) {
        clearCabinetSession(storageKey);
        setState({ status: "signedOut" });
      } else setState({ status: "signedIn", credentials: stored, account });
    });
    return () => {
      isCurrent = false;
    };
  }, [storageKey, attempt]);

  const submit = useCallback(
    async (loginInput: string, password: string): Promise<boolean> => {
      const credentials = { login: loginInput.trim(), password };
      const account = await attempt(credentials);
      if (account !== null) {
        setState({ status: "signedIn", credentials, account });
        return true;
      }
      /* Not this tier's account: maybe another tier's, so route them there. */
      const target = await resolveLogin(credentials.login, password);
      if (!target || target === ownPage) return false;
      goTo(target);
      return true;
    },
    [attempt, ownPage],
  );

  const signOut = useCallback(() => {
    clearCabinetSession(storageKey);
    setState({ status: "signedOut" });
  }, [storageKey]);

  return { state, submit, signOut };
}
