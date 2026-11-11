import { Fragment } from "react";
import { parseLinks } from "./links";

/** Message text with its links made real. Everything else renders as text. */
export function LinkedText({ text }: { text: string }) {
  return (
    <>
      {parseLinks(text).map((segment, index) =>
        segment.kind === "link" ? (
          <a key={index} className="ck-link" href={segment.href} target="_blank" rel="noopener noreferrer">
            {segment.label}
          </a>
        ) : (
          <Fragment key={index}>{segment.text}</Fragment>
        ),
      )}
    </>
  );
}
