import { useCallback, useEffect, useState } from "react";
import { errorCode, hasFailed } from "../api";
import type { ApiAnswer } from "../api";
import { blankProject } from "../engine/engine";
import type { Project, Track } from "../engine/types";
import { list, record, text } from "../narrow";
import { toProject } from "../parse";
import { fetchHome, fetchProject, saveProject, submitProject, toHome, toOpened } from "./data";
import type { Home, ListQuery, Opened, SortKey } from "./data";
import { simPicksFrom } from "./simTiers";
import type { SimPicks } from "./simTiers";
import { LAST_STEP, editPassport, validateSteps } from "./wizard/logic";
import type { Edit } from "./wizard/logic";

export type View = "list" | "wizard" | "results" | "methodology" | "teaser";

/** A line shown above the view; `key` is translated when it is rendered. */
export interface Notice {
  kind: "ok" | "err";
  key?: string;
  raw?: string;
  values?: Record<string, string>;
}

const ERROR_KEYS: Readonly<Record<string, string | undefined>> = {
  routing_locked: "ms_err_routing_locked",
  bad_transition: "ms_err_bad_transition",
  forbidden: "ms_err_forbidden",
  identify_first: "ms_need_login",
};

/** A known code gets its sentence; an unknown one is shown as the server sent it. */
function failureNotice(answer: ApiAnswer): Notice {
  const code = errorCode(answer);
  const key = ERROR_KEYS[code];
  return key || !code ? { kind: "err", key: key ?? "ms_err_forbidden" } : { kind: "err", raw: code };
}

/** The sentence of a notice in the language `translate` speaks. */
export function noticeText(notice: Notice, translate: (key: string) => string): string {
  const sentence = notice.key ? translate(notice.key) : text(notice.raw);
  return Object.entries(notice.values ?? {}).reduce((out, [name, value]) => out.replace(`{${name}}`, value), sentence);
}

interface WizardState {
  draft: Project;
  step: number;
  errors: readonly string[];
  formVersion: number;
}

const INITIAL_QUERY: ListQuery = { search: "", status: "", sortKey: "updated", sortDir: "desc" };

/**
 * The page controller. It never computes a score: the figures shown live in
 * the wizard come from the engine for the eye only, and the official score
 * is always the `scoring` object the server answers with.
 */
export function useScoring(track: Track) {
  const [view, setView] = useState<View>("list");
  const [isBusy, setIsBusy] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [home, setHome] = useState<Home | null>(null);
  const [query, setQuery] = useState<ListQuery>(INITIAL_QUERY);
  const [wizard, setWizard] = useState<WizardState | null>(null);
  const [opened, setOpened] = useState<Opened | null>(null);
  const [picks, setPicks] = useState<SimPicks>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  /** Answers whether the list arrived; a guest is a state, not a failure. */
  const loadHome = useCallback(async (): Promise<boolean> => {
    setIsBusy(true);
    const answer = await fetchHome(track);
    setIsBusy(false);
    if (errorCode(answer) === "identify_first") {
      setIsGuest(true);
      return false;
    }
    if (hasFailed(answer)) {
      setNotice(failureNotice(answer));
      return false;
    }
    setHome(toHome(answer));
    return true;
  }, [track]);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  const go = (next: View): void => {
    setNotice(null);
    setView(next);
  };

  const startWizard = (project: Project | null): void => {
    /* A new project takes the page's track; an existing one keeps its own. */
    const draft = project ?? editPassport({ loyihaTuri: track })(blankProject());
    setWizard(previous => ({ draft, step: 1, errors: [], formVersion: (previous?.formVersion ?? 0) + 1 }));
    go("wizard");
  };

  const fetchOpened = async (id: string): Promise<Opened | null> => {
    setIsBusy(true);
    const answer = await fetchProject(id);
    setIsBusy(false);
    const result = hasFailed(answer) ? null : toOpened(answer);
    if (!result) setNotice(failureNotice(answer));
    return result;
  };

  const showProject = async (id: string): Promise<void> => {
    const result = await fetchOpened(id);
    if (!result) return;
    setOpened(result);
    setPicks(simPicksFrom(result.scoring));
    setView("results");
  };

  const openProject = (id: string): void => {
    setNotice(null);
    void showProject(id);
  };

  const editProject = async (id: string): Promise<void> => {
    setNotice(null);
    const result = await fetchOpened(id);
    if (result) startWizard(result.project);
  };

  const editDraft = (edit: Edit, isRestructuring = false): void =>
    setWizard(current =>
      current && { ...current, draft: edit(current.draft), formVersion: current.formVersion + (isRestructuring ? 1 : 0) },
    );

  /* Going back is always free; going forward checks every step passed over. */
  const jumpTo = (target: number): void => {
    if (!wizard || target === wizard.step) return;
    const next = Math.min(LAST_STEP, Math.max(1, target));
    const errors = next > wizard.step ? validateSteps(wizard.step, next - 1, wizard.draft) : [];
    setNotice(null);
    setWizard({ ...wizard, errors, step: errors.length ? wizard.step : next });
  };

  /** Saves a draft, or finishes: then EVERY step is checked, not only the last. */
  const save = async (isFinishing: boolean): Promise<void> => {
    if (!wizard) return;
    const errors = isFinishing ? validateSteps(1, LAST_STEP, wizard.draft) : [];
    setNotice(null);
    setWizard({ ...wizard, errors });
    if (errors.length) return;
    const answer = await saveProject(wizard.draft, isFinishing);
    if (hasFailed(answer)) return setNotice(failureNotice(answer));
    const saved = toProject(record(answer).project);
    setWizard({ draft: saved, step: wizard.step, errors: [], formVersion: wizard.formVersion + 1 });
    await loadHome();
    if (isFinishing && saved.id) await showProject(saved.id);
    else setNotice({ kind: "ok", key: "ms_draft_saved" });
  };

  const submit = async (): Promise<void> => {
    const id = opened?.project.id;
    if (!id) return;
    const answer = await submitProject(id);
    if (hasFailed(answer)) return setNotice(failureNotice(answer));
    setNotice({ kind: "ok", key: "ms_submitted", values: { n: String(list(record(answer).routedTo).length) } });
    await loadHome();
    await showProject(id);
  };

  const sortBy = (key: SortKey): void =>
    setQuery(current =>
      current.sortKey === key
        ? { ...current, sortDir: current.sortDir === "asc" ? "desc" : "asc" }
        : { ...current, sortKey: key, sortDir: key === "nomi" ? "asc" : "desc" },
    );

  return {
    view,
    isBusy,
    isGuest,
    home,
    query,
    wizard,
    opened,
    picks,
    notice,
    go,
    backToList: () => {
      setOpened(null);
      go("list");
    },
    startWizard,
    openProject,
    editProject: (id: string) => void editProject(id),
    editOpened: () => opened && startWizard(opened.project),
    editDraft,
    jumpTo,
    save: (isFinishing: boolean) => void save(isFinishing),
    submit: () => void submit(),
    setQuery: (change: Partial<ListQuery>) => setQuery(current => ({ ...current, ...change })),
    sortBy,
    pick: (criterion: string, index: number) => setPicks(current => ({ ...current, [criterion]: index })),
    resetPicks: () => opened && setPicks(simPicksFrom(opened.scoring)),
  };
}

export type ScoringController = ReturnType<typeof useScoring>;
