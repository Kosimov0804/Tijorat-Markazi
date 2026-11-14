import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AssocText } from "./types";

export type Letter = { recipientLabel: string; body: string };

const COPIED_NOTE_MS = 1500;
const PRINT_STYLE = "font-family:Georgia,serif;white-space:pre-wrap;padding:40px;line-height:1.6";

/* The letter goes into the print window as text, never as markup. */
function printLetter(body: string): void {
  const sheet = window.open("", "_blank");
  if (!sheet) return;
  const page = sheet.document.createElement("pre");
  page.setAttribute("style", PRINT_STYLE);
  page.textContent = body;
  sheet.document.body.appendChild(page);
  sheet.document.close();
  sheet.print();
}

type LetterModalProps = { letter: Letter; at: AssocText; onClose: () => void };

/** The official letter viewer: read it, copy it, print it. */
export function LetterModal({ letter, at, onClose }: LetterModalProps) {
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleCopy = (): void => {
    void navigator.clipboard?.writeText(letter.body);
    setIsCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setIsCopied(false), COPIED_NOTE_MS);
  };

  /* A page-level layer, as in the old markup: outside the cabinet frame. */
  return createPortal(
    <div
      className="letter-modal"
      id="letterModal"
      role="dialog"
      aria-modal="true"
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="letter-box">
        <div className="letter-head">
          <b id="ltrTo">
            {at("ltr_to")}: {letter.recipientLabel} 🏢
          </b>
          <button className="icon-btn" id="ltrClose" type="button" aria-label="✕" onClick={onClose}>
            ✕
          </button>
        </div>
        <pre className="letter-body" id="ltrBody">
          {letter.body}
        </pre>
        <div className="letter-foot">
          <button className="btn btn-primary" id="ltrCopy" type="button" onClick={handleCopy}>
            {at(isCopied ? "ltr_copied" : "ltr_copy")}
          </button>
          <button className="btn btn-ghost" id="ltrPrint" type="button" onClick={() => printLetter(letter.body)}>
            {at("ltr_print")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
