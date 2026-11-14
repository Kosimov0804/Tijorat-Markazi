import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { asString, isRecord } from "../../../shell/chat";
import { useText } from "../useText";

export interface Letter {
  recipientLabel: string;
  recipientType: string;
  body: string;
}

export function parseLetter(value: unknown): Letter {
  const item = isRecord(value) ? value : {};
  return {
    recipientLabel: asString(item.recipientLabel),
    recipientType: asString(item.recipientType),
    body: asString(item.body),
  };
}

const COPIED_MS = 1500;
const REVOKE_MS = 1500;

const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Saves the letter as a Word (.doc) file, built in the browser as admin.js did. */
function downloadLetter(letter: Letter): void {
  const html =
    "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' " +
    "xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head>" +
    '<body><p style="font-family:Georgia,serif;white-space:pre-wrap;line-height:1.7;font-size:13pt">' +
    `${escapeHtml(letter.body)}</p></body></html>`;
  const url = URL.createObjectURL(new Blob([`﻿${html}`], { type: "application/msword" }));
  const slug = letter.recipientLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "rasmiy";
  const link = document.createElement("a");
  link.href = url;
  link.download = `tijorat-markazi-xat-${slug}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_MS);
}

/* The old panel wrote escaped markup into the new window. Building the node
   and setting its text keeps the letter from ever being parsed as HTML. */
function printLetter(body: string): void {
  const popup = window.open("", "_blank");
  if (!popup) return;
  const sheet = popup.document.createElement("pre");
  sheet.style.cssText = "font-family:Georgia,serif;white-space:pre-wrap;padding:40px;line-height:1.6";
  sheet.textContent = body;
  popup.document.body.appendChild(sheet);
  popup.document.close();
  popup.print();
}

/** The official letter viewer: copy, download as Word, or print. */
export function LetterModal({ letter, onClose }: { letter: Letter; onClose: () => void }) {
  const { tx } = useText();
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;
    const timer = setTimeout(() => setIsCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [isCopied]);

  const handleCopy = () => {
    /* Copying is a convenience; where the clipboard is unavailable or refuses, the letter is still on screen. */
    navigator.clipboard?.writeText(letter.body).catch(() => undefined);
    setIsCopied(true);
  };

  const handleBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="letter-modal" id="letterModal" role="dialog" aria-modal="true" onClick={handleBackdrop}>
      <div className="letter-box">
        <div className="letter-head">
          <b id="ltrTo">
            {tx("ltr_to")}: {letter.recipientLabel}
            {letter.recipientType === "company" ? " 🏢" : ""}
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
            {tx(isCopied ? "ltr_copied" : "ltr_copy")}
          </button>
          <button className="btn btn-ghost" id="ltrDl" type="button" onClick={() => downloadLetter(letter)}>
            {tx("ltr_dl")}
          </button>
          <button className="btn btn-ghost" id="ltrPrint" type="button" onClick={() => printLetter(letter.body)}>
            {tx("ltr_print")}
          </button>
        </div>
      </div>
    </div>
  );
}
