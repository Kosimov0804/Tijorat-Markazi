import type { ReplyFile } from "./assistantApi";

/* A generated document arrives as a path on this site inside the answer. */
const LABELLED_FILE = /\[([^\]\n]+)\]\((\/uploads\/[A-Za-z0-9._-]+\.(?:pdf|docx|xlsx|pptx))\)/g;
const BARE_FILE = /(^|\s)(\/uploads\/[A-Za-z0-9._-]+\.(?:pdf|docx|xlsx|pptx))/g;

const fileName = (url: string): string => url.split("/").pop() ?? url;

/**
 * Pulls every file the answer links out of the sentence, so the message reads
 * as prose and each file shows up as its own card underneath.
 */
export function splitFiles(reply: string): { text: string; files: ReplyFile[] } {
  const files: ReplyFile[] = [];
  const text = reply
    .replace(LABELLED_FILE, (_whole, label: string, url: string) => {
      files.push({ url, name: label });
      return "";
    })
    .replace(BARE_FILE, (_whole, before: string, url: string) => {
      files.push({ url, name: fileName(url) });
      return before;
    })
    .replace(/[ \t]{2,}/g, " ")
    /* "...yuklab olish:" left dangling once its link is gone. */
    .replace(/[ \t]*([:\-—–])[ \t]*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { text, files };
}

/** What the server reported plus what the text mentioned, each document once. */
export function mergeFiles(fromApi: readonly ReplyFile[], fromText: readonly ReplyFile[]): ReplyFile[] {
  const merged = new Map<string, ReplyFile>();
  [...fromApi, ...fromText].forEach(file => {
    if (merged.has(file.url)) return;
    /* The server knows the size; the text only knows the name. */
    const reported = fromApi.find(item => item.url === file.url) ?? file;
    merged.set(file.url, { url: file.url, name: reported.name || file.name, size: reported.size });
  });
  return [...merged.values()];
}
