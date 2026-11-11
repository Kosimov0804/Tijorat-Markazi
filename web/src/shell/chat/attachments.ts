import { asNumber, asString, isRecord } from "./narrow";
import { safeMediaUrl } from "./urls";

export const MAX_ATTACH_BYTES = 12 * 1024 * 1024;

/** What the API expects for a file or voice note on its way up. */
export interface OutgoingAttachment {
  data: string;
  mime: string;
  name: string;
  voice?: true;
  dur?: number;
}

export type AttachmentKind = "image" | "voice" | "video" | "audio" | "file";

/** An attachment as the server describes it on a stored message. */
export interface ChatAttachment {
  kind: AttachmentKind;
  url: string;
  name: string;
  size: number;
  dur: number;
}

const KINDS: readonly AttachmentKind[] = ["image", "voice", "video", "audio"];

/** Reads a blob as base64, without the data: prefix. */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-failed"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });
}

/** Turns a File into the upload payload. Rejects with "too-large" or "read-failed". */
export async function fileToAttach(file: File): Promise<OutgoingAttachment> {
  if (file.size > MAX_ATTACH_BYTES) throw new Error("too-large");
  return {
    data: await blobToBase64(file),
    mime: file.type || "application/octet-stream",
    name: file.name || "file",
  };
}

/** Null unless the value is an attachment whose address is safe to load. */
export function parseAttachment(value: unknown): ChatAttachment | null {
  if (!isRecord(value)) return null;
  const url = safeMediaUrl(value.url);
  if (!url) return null;
  return {
    kind: KINDS.find(kind => kind === value.kind) ?? "file",
    url,
    name: asString(value.name),
    size: asNumber(value.size),
    dur: asNumber(value.dur),
  };
}
