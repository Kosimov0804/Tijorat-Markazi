/**
 * DOC BUTTON — the "download as Word" control of a cabinet.
 *
 *   <DocButton path body fallbackName className? id?>label</DocButton>
 *
 * Looks like the link it replaces, but fetches the file with the credentials
 * in the request body (see download.ts) and says so when the server refuses.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { T_ANALYST } from "@legacy/markets-i18n.js";
import { dialogs } from "../dialogs";
import { useI18n } from "../i18n";
import { downloadDocument } from "./download";

type DocButtonProps = {
  path: string;
  /** Credentials and the document's own parameters. Never rendered. */
  body: Record<string, unknown>;
  fallbackName: string;
  className?: string;
  id?: string;
  children: ReactNode;
};

export function DocButton({ path, body, fallbackName, className = "btn btn-ghost", id, children }: DocButtonProps) {
  const { pick } = useI18n();
  const [isBusy, setIsBusy] = useState(false);

  const handleClick = async (): Promise<void> => {
    setIsBusy(true);
    const isSaved = await downloadDocument(path, body, fallbackName);
    setIsBusy(false);
    const failure = T_ANALYST.an_fail;
    if (!isSaved && failure) dialogs.toast(pick(failure), { tone: "error" });
  };

  return (
    <button type="button" className={className} id={id} disabled={isBusy} onClick={() => void handleClick()}>
      {children}
    </button>
  );
}
