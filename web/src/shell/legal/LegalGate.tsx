/**
 * LEGAL GATE — the offer, shown before anyone registers (port of legal-gate.js).
 *
 * A tick-box beside a link presents a link, not an offer. The platform runs on
 * a public offer, so the applicant is shown the real text and the form goes
 * nowhere until they accept it. "Roziman" stays disabled until the end of the
 * OFFER has reached the screen once; the privacy tab is freely readable but is
 * not the contract being accepted.
 *
 * PUBLIC API
 *
 *   useConsentGate()  — for a sign-up form with a consent tick-box.
 *     const consent = useConsentGate();
 *     <input type="checkbox" checked={consent.isChecked}
 *            onChange={event => consent.setChecked(event.target.checked)} />
 *     {consent.gate}
 *     // in the submit handler, before validation:
 *     if (!(await consent.confirm())) return;   // dismissed: nothing is sent
 *     // after a successful submit:
 *     consent.reset();                           // the next application asks again
 *   Accepting ticks the box. Unticking it arms the gate again.
 *
 *   useLegalGate()  — for anything else.
 *     const { gate, requestAcceptance, openReadOnly } = useLegalGate();
 *     {gate}                                     // render once, anywhere
 *     await requestAcceptance()                  // true = accepted, false = dismissed
 *     openReadOnly()                             // "re-read the offer" in a cabinet
 *
 *   <LegalGate readOnly? onSettle={accepted => …} />  — the dialog itself, open
 *     for as long as it is mounted. The hooks above are the usual way in.
 *
 * Needs the I18nProvider, and legal.css on the page.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { LEGAL_MAXFIYLIK } from "@legacy/legal-text-maxfiylik.js";
import { LEGAL_OFERTA } from "@legacy/legal-text-oferta.js";
import { useI18n } from "../i18n";
import { GATE_TEXT } from "./gateText";
import { LegalDocBody } from "./LegalDocBody";
import type { LegalConfig } from "./types";

const DOCS = { oferta: LEGAL_OFERTA, maxfiylik: LEGAL_MAXFIYLIK } as const;
type GateDoc = keyof typeof DOCS;

const TABS = [
  { doc: "oferta", label: GATE_TEXT.tab_of },
  { doc: "maxfiylik", label: GATE_TEXT.tab_mx },
] as const;

/* How close to the bottom counts as "the end reached the screen". */
const END_SLACK_PX = 24;

type LegalGateProps = {
  /** Drops the acceptance footer and leaves the reader a close button. */
  readOnly?: boolean;
  /** Called once: true when the offer was accepted, false when dismissed. */
  onSettle: (accepted: boolean) => void;
};

/** undefined while /api/legal is on its way, null when it could not be read. */
function useGateConfig(): LegalConfig | null | undefined {
  const [config, setConfig] = useState<LegalConfig | null | undefined>(undefined);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/legal", { signal: controller.signal })
      .then(response => response.json() as Promise<LegalConfig | null>)
      .then(body => setConfig(body?.ok ? body : null))
      .catch(() => {
        if (!controller.signal.aborted) setConfig(null);
      });
    return () => controller.abort();
  }, []);
  return config;
}

export function LegalGate({ readOnly = false, onSettle }: LegalGateProps) {
  const { lang, pick } = useI18n();
  const config = useGateConfig();
  const [current, setCurrent] = useState<GateDoc>("oferta");
  const [hasSeenEnd, setHasSeenEnd] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const doc = DOCS[current];
  const isLoading = config === undefined;
  /* Fails CLOSED. An empty body is as tall as its box, which reads as "already
     at the end", so acceptance is only ever measured against a painted text. */
  const isPainted = !isLoading && doc.sections.length > 0;
  const hasFailed = !isLoading && !isPainted;

  const checkEnd = useCallback(() => {
    const body = bodyRef.current;
    if (readOnly || !isPainted || current !== "oferta" || !body) return;
    if (body.scrollTop + body.clientHeight >= body.scrollHeight - END_SLACK_PX) setHasSeenEnd(true);
  }, [readOnly, isPainted, current]);

  /* Re-measured after layout: a document short enough to need no scrolling
     counts as read on sight. */
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    const frame = requestAnimationFrame(checkEnd);
    return () => cancelAnimationFrame(frame);
  }, [checkEnd]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onSettle(false);
    };
    document.addEventListener("keydown", closeOnEscape, true);
    return () => document.removeEventListener("keydown", closeOnEscape, true);
  }, [onSettle]);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    bodyRef.current?.focus();
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  const hintText = hasFailed ? GATE_TEXT.failed : hasSeenEnd ? GATE_TEXT.ready : GATE_TEXT.hint;

  return createPortal(
    <div
      className="lgate-back"
      onMouseDown={event => {
        /* The backdrop dismisses a read-only view, never an acceptance prompt:
           dismissing that by accident would be a decision. */
        if (event.target === event.currentTarget && readOnly) onSettle(false);
      }}
    >
      <div className="lgate" role="dialog" aria-modal="true" aria-labelledby="lgate-t">
        <header className="lgate-head">
          <h2 id="lgate-t">{pick(readOnly ? GATE_TEXT.title_ro : GATE_TEXT.title)}</h2>
          {!readOnly && <p className="lgate-lead">{pick(GATE_TEXT.lead)}</p>}
          <nav className="lgate-tabs">
            {TABS.map(tab => (
              <button
                key={tab.doc}
                type="button"
                className={tab.doc === current ? "on" : undefined}
                onClick={() => setCurrent(tab.doc)}
              >
                {pick(tab.label)}
              </button>
            ))}
          </nav>
        </header>
        <div className="lgate-body" id="lgateBody" tabIndex={0} ref={bodyRef} onScroll={checkEnd}>
          {isLoading && <p>{pick(GATE_TEXT.loading)}</p>}
          {hasFailed && <div className="lg-note lg-note-warn">{pick(GATE_TEXT.failed)}</div>}
          {isPainted && (
            <div className="lg-body">
              <LegalDocBody docKey={current} doc={doc} config={config} lang={lang} />
            </div>
          )}
        </div>
        <footer className="lgate-foot">
          {readOnly ? (
            <button type="button" className="btn btn-primary lgate-close" onClick={() => onSettle(false)}>
              {pick(GATE_TEXT.close)}
            </button>
          ) : (
            <>
              <span className={hasSeenEnd ? "lgate-hint ok" : "lgate-hint"} id="lgateHint">
                {pick(hintText)}
              </span>
              <span className="lgate-acts">
                <button type="button" className="btn btn-ghost lgate-cancel" onClick={() => onSettle(false)}>
                  {pick(GATE_TEXT.cancel)}
                </button>
                <button
                  type="button"
                  className="btn btn-primary lgate-ok"
                  disabled={!hasSeenEnd || hasFailed}
                  onClick={() => onSettle(true)}
                >
                  {pick(GATE_TEXT.accept)}
                </button>
              </span>
            </>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

type PendingGate = { readOnly: boolean; resolve: (accepted: boolean) => void };

type LegalGateControls = {
  /** Render this once; it is null while the gate is closed. */
  gate: ReactNode;
  requestAcceptance: () => Promise<boolean>;
  openReadOnly: () => void;
};

export function useLegalGate(): LegalGateControls {
  const [pending, setPending] = useState<PendingGate | null>(null);
  const pendingRef = useRef<PendingGate | null>(null);

  const open = useCallback(
    (readOnly: boolean) =>
      new Promise<boolean>(resolve => {
        /* One gate at a time: a second request is answered as a dismissal. */
        if (pendingRef.current) {
          resolve(false);
          return;
        }
        const next = { readOnly, resolve };
        pendingRef.current = next;
        setPending(next);
      }),
    [],
  );

  const settle = useCallback((accepted: boolean) => {
    const settled = pendingRef.current;
    if (!settled) return;
    pendingRef.current = null;
    setPending(null);
    settled.resolve(accepted);
  }, []);

  const requestAcceptance = useCallback(() => open(false), [open]);
  const openReadOnly = useCallback(() => {
    void open(true);
  }, [open]);

  return {
    gate: pending ? <LegalGate readOnly={pending.readOnly} onSettle={settle} /> : null,
    requestAcceptance,
    openReadOnly,
  };
}

type ConsentGate = {
  gate: ReactNode;
  /** The state of the consent tick-box, which is what the server records. */
  isChecked: boolean;
  setChecked: (isChecked: boolean) => void;
  /** Resolves true once the offer has been accepted, showing it if need be. */
  confirm: () => Promise<boolean>;
  /** Unticks the box and arms the gate for the next application. */
  reset: () => void;
};

export function useConsentGate(): ConsentGate {
  const { gate, requestAcceptance } = useLegalGate();
  const [isChecked, setIsChecked] = useState(false);
  const hasAccepted = useRef(false);

  const setChecked = useCallback((next: boolean) => {
    /* Unticking after acceptance means the person changed their mind, so the
       gate arms again rather than remembering a consent they just revoked. */
    if (!next) hasAccepted.current = false;
    setIsChecked(next);
  }, []);

  const confirm = useCallback(async () => {
    if (hasAccepted.current) return true;
    if (!(await requestAcceptance())) return false;
    hasAccepted.current = true;
    setIsChecked(true);
    return true;
  }, [requestAcceptance]);

  const reset = useCallback(() => setChecked(false), [setChecked]);

  return { gate, isChecked, setChecked, confirm, reset };
}
