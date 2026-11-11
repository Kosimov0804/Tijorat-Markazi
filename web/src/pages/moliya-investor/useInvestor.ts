import { useEffect, useRef, useState } from "react";
import { adminPassword, errorCode, hasFailed, signedInCompany } from "../moliya-shared/api";
import type { ApiAnswer } from "../moliya-shared/api";
import { record } from "../moliya-shared/narrow";
import {
  EMPTY_FILTER,
  fetchDossier,
  fetchInbox,
  fetchRouting,
  saveInterest,
  saveRouting,
  setProjectStatus,
  toDossier,
  toInbox,
  toInterest,
  toRoutingSettings,
} from "./data";
import type { Dossier, Filter, Inbox, RoutingSettings } from "./data";

export type View = "inbox" | "dossier" | "settings";

/** `key` is translated when shown; `raw` is an error code the dictionary does not know. */
export interface Message {
  kind: "ok" | "err";
  key?: string;
  raw?: string;
}

/** A message shown in place, next to the control it answers. */
export interface InlineMessage extends Message {
  /** "status", "interest", or a product id. */
  target: string;
}

const ERROR_KEYS: Readonly<Record<string, string | undefined>> = {
  company_login_required: "msi_err_company",
  identify_first: "msi_login_title",
  forbidden: "msi_err_forbidden",
  not_found: "msi_err_notfound",
  bad_state: "msi_err_badstate",
};

function failure(answer: ApiAnswer): Message {
  const code = errorCode(answer);
  const key = ERROR_KEYS[code];
  return key || !code ? { kind: "err", key: key ?? "ms_err_forbidden" } : { kind: "err", raw: code };
}

const SEARCH_DELAY_MS = 350;

/* The server guards the export with the admin password and answers with a
   real FILE, not JSON, so this is a plain form post the browser downloads. */
function exportCsv(): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/moliya/scoring/export";
  form.target = "_blank";
  const pass = document.createElement("input");
  pass.type = "hidden";
  pass.name = "pass";
  pass.value = adminPassword();
  form.appendChild(pass);
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

/**
 * The cabinet controller. It computes and filters NOTHING: the queue, the
 * tiles and every transition rule come from the server.
 */
export function useInvestor() {
  const [view, setView] = useState<View>("inbox");
  const [isBusy, setIsBusy] = useState(true);
  const [isIdentified, setIsIdentified] = useState(true);
  const [failed, setFailed] = useState<Message | null>(null);
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [filter, setFilter] = useState<Filter>(EMPTY_FILTER);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [draftInterest, setDraftInterest] = useState<{ state?: string; note?: string }>({});
  const [routing, setRouting] = useState<RoutingSettings | null>(null);
  const [inline, setInline] = useState<InlineMessage | null>(null);
  /* Grows with every answer that replaces what the form boxes started from. */
  const [formVersion, setFormVersion] = useState(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isChangingStatus = useRef(false);

  /** A load that replaces the whole view: on failure a card stands in for it. */
  const guarded = async (request: Promise<ApiAnswer>, isQuiet = false): Promise<ApiAnswer | undefined> => {
    if (!isQuiet) setIsBusy(true);
    setFailed(null);
    setInline(null);
    const answer = await request;
    setIsBusy(false);
    if (!hasFailed(answer)) return answer;
    setFailed(failure(answer));
    return undefined;
  };

  /* A filter change reloads quietly, so the search box keeps its cursor. */
  const loadInbox = async (nextFilter: Filter, isQuiet = false): Promise<void> => {
    if (!isQuiet) setIsBusy(true);
    setFailed(null);
    setInline(null);
    const answer = await fetchInbox(nextFilter);
    setIsBusy(false);
    /* An unidentified visitor is a state, not an error. */
    if (errorCode(answer) === "identify_first") return setIsIdentified(false);
    if (hasFailed(answer)) return setFailed(failure(answer));
    setIsIdentified(true);
    setInbox(toInbox(answer));
    setView("inbox");
  };

  useEffect(() => {
    void loadInbox(EMPTY_FILTER);
    return () => clearTimeout(searchTimer.current);
    /* The first load only; every later one is started by the visitor. */
  }, []);

  const openDossier = async (id: string): Promise<void> => {
    const answer = await guarded(fetchDossier(id));
    if (!answer) return;
    setDossier(toDossier(answer));
    setDraftInterest({});
    setFormVersion(version => version + 1);
    setView("dossier");
  };

  const loadSettings = async (): Promise<void> => {
    /* For an expert the criteria page is closed: it belongs to the institution. */
    if (inbox?.isInstitution) {
      const answer = await guarded(fetchRouting());
      if (!answer) return;
      setRouting(toRoutingSettings(answer));
      setFormVersion(version => version + 1);
    }
    setView("settings");
  };

  const changeFilter = (change: Partial<Filter>): void => {
    const next = { ...filter, ...change };
    setFilter(next);
    clearTimeout(searchTimer.current);
    /* Typing must not reach the server on every key; the selects go at once. */
    if ("q" in change) searchTimer.current = setTimeout(() => void loadInbox(next, true), SEARCH_DELAY_MS);
    else void loadInbox(next, true);
  };

  const changeStatus = async (target: string, comment: string): Promise<void> => {
    const id = dossier?.project.id;
    if (!id || isChangingStatus.current) return;
    isChangingStatus.current = true;
    const answer = await setProjectStatus(id, target, comment);
    isChangingStatus.current = false;
    if (hasFailed(answer)) return setInline({ target: "status", ...failure(answer) });
    /* Read again: with the status, the buttons that remain have changed too. */
    await openDossier(id);
  };

  /* The choice is NOT saved when clicked: it goes with the note, in one request. */
  const storeInterest = async (): Promise<void> => {
    const id = dossier?.project.id;
    const picked = draftInterest.state || dossier?.interest?.state || "";
    if (!dossier || !id) return;
    if (!picked) return setInline({ target: "interest", kind: "err", key: "msi_int_pick" });
    const note = draftInterest.note ?? dossier.interest?.note ?? "";
    const answer = await saveInterest(id, picked, note);
    if (hasFailed(answer)) return setInline({ target: "interest", ...failure(answer) });
    /* The answer is the truth; the local draft is dropped with it. */
    setDossier({ ...dossier, interest: toInterest(record(answer).interest) });
    setDraftInterest({});
    setFormVersion(version => version + 1);
    setInline({ target: "interest", kind: "ok", key: "msi_int_saved" });
  };

  /* The registry count is an intersection only the server can work out, so
     after a save the whole list is read again. */
  const storeRouting = async (productId: string, isRoutable: boolean, minScore: number): Promise<void> => {
    const answer = await saveRouting(productId, isRoutable, minScore);
    if (hasFailed(answer)) return setInline({ target: productId, ...failure(answer) });
    await loadSettings();
    setInline({ target: productId, kind: "ok", key: "msi_set_saved" });
  };

  return {
    view,
    isBusy,
    isIdentified,
    failed,
    inbox,
    filter,
    dossier,
    draftInterest,
    routing,
    inline,
    formVersion,
    companyName: signedInCompany()?.name ?? "",
    reload: () => void loadInbox(filter),
    openDossier: (id: string) => void openDossier(id),
    openSettings: () => void loadSettings(),
    changeFilter,
    clearFilter: () => {
      setFilter(EMPTY_FILTER);
      void loadInbox(EMPTY_FILTER);
    },
    exportCsv,
    changeStatus: (target: string, comment: string) => void changeStatus(target, comment),
    pickInterest: (state: string) => setDraftInterest(draft => ({ ...draft, state })),
    noteInterest: (note: string) => setDraftInterest(draft => ({ ...draft, note })),
    storeInterest: () => void storeInterest(),
    storeRouting: (productId: string, isRoutable: boolean, minScore: number) => void storeRouting(productId, isRoutable, minScore),
  };
}

export type InvestorController = ReturnType<typeof useInvestor>;
