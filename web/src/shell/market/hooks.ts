/*
 * Hooks behind the market pages.
 *
 *   useKitText()            the kit's own strings (T_MK: mk_*, status_*, stage_*)
 *   useDebounced(value, ms) the value, once it has stopped changing for `ms`
 *   useLoad(key, load)      runs `load` whenever `key` changes or reload() is
 *                           called; answers { data, isLoading, reload }. `data`
 *                           keeps the previous answer while the next one loads,
 *                           and a slow earlier answer never overwrites a later one.
 *   useCompany()            the signed-in company: { company, signIn, signOut }
 *   usePulse()              /api/market/pulse as a record, or null until it is ok
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { T_MK } from "@legacy/markets-i18n.js";
import { companyIdentity, companyLogin, marketJson, useMarketText } from "./mk";
import type { CompanySession, Translate } from "./mk";
import type { Json } from "./narrow";

export const useKitText = (): Translate => useMarketText(T_MK);

export function useDebounced<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}

export type Loaded<T> = { data: T | null; isLoading: boolean; reload: () => void };

export function useLoad<T>(key: string, load: () => Promise<T>): Loaded<T> {
  const [state, setState] = useState<{ data: T | null; isLoading: boolean }>({ data: null, isLoading: true });
  const [version, setVersion] = useState(0);
  const latestLoad = useRef(load);
  latestLoad.current = load;

  useEffect(() => {
    let isCurrent = true;
    setState(previous => ({ data: previous.data, isLoading: true }));
    void latestLoad.current().then(data => {
      if (isCurrent) setState({ data, isLoading: false });
    });
    return () => {
      isCurrent = false;
    };
  }, [key, version]);

  const reload = useCallback(() => setVersion(current => current + 1), []);
  return { ...state, reload };
}

type CompanyAccess = {
  company: CompanySession | null;
  /** Resolves to false when the credentials are refused. */
  signIn: (login: string, password: string) => Promise<boolean>;
  signOut: () => void;
};

export function useCompany(): CompanyAccess {
  const [company, setCompany] = useState<CompanySession | null>(companyIdentity.company);
  const signIn = useCallback(async (login: string, password: string) => {
    const session = await companyLogin(login, password);
    if (session) setCompany(session);
    return session !== null;
  }, []);
  const signOut = useCallback(() => {
    companyIdentity.setCompany(null);
    setCompany(null);
  }, []);
  return { company, signIn, signOut };
}

export function usePulse(): Json | null {
  const [pulse, setPulse] = useState<Json | null>(null);
  useEffect(() => {
    let isCurrent = true;
    void marketJson("/api/market/pulse").then(answer => {
      if (isCurrent && answer.ok) setPulse(answer);
    });
    return () => {
      isCurrent = false;
    };
  }, []);
  return pulse;
}
