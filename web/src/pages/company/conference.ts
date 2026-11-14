import { webHref } from "../../shell/cabinet";
import { record, text } from "../../shell/market/narrow";

export type Conference = { id: string; title: string; datetime: string; desc: string; link: string };

export function parseConference(value: unknown): Conference {
  const item = record(value);
  return {
    id: text(item.id),
    title: text(item.title),
    datetime: text(item.datetime),
    desc: text(item.desc),
    link: text(item.link),
  };
}

/* One hop through the server, so a room re-created after scheduling still
   opens from a page the user loaded hours ago. */
export function joinUrl(conference: Conference): string {
  if (conference.id) return `/api/conference/join?id=${encodeURIComponent(conference.id)}`;
  return webHref(conference.link) ?? "#";
}
