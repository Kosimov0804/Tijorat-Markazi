import { safeLinkHref } from "./urls";

export type LinkSegment = { kind: "text"; text: string } | { kind: "link"; href: string; label: string };

const LABELLED = /\[([^\]\n]{1,140})\]\(([^\s)]{1,500})\)/g;
const BARE = /(^|[\s(])((?:https?:\/\/|www\.)[^\s<]+)/gi;
const TRAILING_PUNCTUATION = /[),.;:!?]+$/;

/* Trailing punctuation stays outside the link, so an address that ends a
   sentence does not swallow the full stop. */
function splitBareLinks(text: string): LinkSegment[] {
  const segments: LinkSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(BARE)) {
    const [, before, candidate] = match;
    const url = candidate.replace(TRAILING_PUNCTUATION, "");
    const href = safeLinkHref(url);
    if (!href) continue;
    const start = match.index + before.length;
    if (start > cursor) segments.push({ kind: "text", text: text.slice(cursor, start) });
    segments.push({ kind: "link", href, label: url });
    cursor = start + url.length;
  }
  if (cursor < text.length) segments.push({ kind: "text", text: text.slice(cursor) });
  return segments;
}

/**
 * Message text → the pieces to render.
 *   [label](url)  a labelled link
 *   bare url      links to itself
 * Anything with an address that is not http or https stays as typed.
 */
export function parseLinks(raw: string): LinkSegment[] {
  const segments: LinkSegment[] = [];
  let plain = "";
  let cursor = 0;
  for (const match of raw.matchAll(LABELLED)) {
    const [whole, label, url] = match;
    const href = safeLinkHref(url);
    plain += raw.slice(cursor, match.index);
    cursor = match.index + whole.length;
    if (!href) {
      plain += whole;
      continue;
    }
    segments.push(...splitBareLinks(plain), { kind: "link", href, label });
    plain = "";
  }
  return [...segments, ...splitBareLinks(plain + raw.slice(cursor))];
}
