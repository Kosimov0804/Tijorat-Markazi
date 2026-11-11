import { Fragment, useEffect, useRef, useState } from "react";
import type { Translate } from "../market/mk";
import type { Application } from "./registerApi";

/* How long the copy button says "copied" before it offers to copy again. */
const COPIED_FOR_MS = 1600;

type DoneCardProps = {
  /** "rg" or "br": the legacy element ids. */
  prefix: string;
  /** null until an application has been accepted. */
  application: Application | null;
  lead: string;
  rows: readonly (readonly [label: string, value: string])[];
  t: Translate;
};

/**
 * Where a sign-up ends: on a reference number rather than a welcome, because
 * the account does not exist until someone approves it.
 */
export function DoneCard({ prefix, application, lead, rows, t }: DoneCardProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const ref = application?.ref;

  useEffect(() => {
    /* jsdom has no scrollIntoView. */
    if (ref) boxRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [ref]);

  useEffect(() => {
    if (!hasCopied) return;
    const timer = setTimeout(() => setHasCopied(false), COPIED_FOR_MS);
    return () => clearTimeout(timer);
  }, [hasCopied]);

  const handleCopy = () => {
    const markCopied = () => setHasCopied(true);
    if (ref && navigator.clipboard) navigator.clipboard.writeText(ref).then(markCopied, markCopied);
    else markCopied();
  };

  return (
    <div className="rg-card" id={`${prefix}Done`} hidden={!application} ref={boxRef}>
      {application && (
        <>
          <h2>{t("rg_done_h")}</h2>
          <p className="rg-done-p">{lead}</p>
          <div className="rg-ref">
            <span>{t("rg_ref")}</span>
            <b id={`${prefix}RefVal`}>{application.ref}</b>
            <button className="btn btn-ghost" type="button" id={`${prefix}Copy`} onClick={handleCopy}>
              {t(hasCopied ? "rg_copied" : "rg_copy")}
            </button>
          </div>
          <dl className="mk-kv">
            {rows.map(([label, value]) => (
              <Fragment key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </Fragment>
            ))}
          </dl>
          <p className="mk-note">{t("rg_done_note")}</p>
        </>
      )}
    </div>
  );
}
