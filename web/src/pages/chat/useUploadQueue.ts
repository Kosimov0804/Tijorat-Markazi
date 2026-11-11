import { useRef, useState } from "react";
import { fileToAttach, humanSize } from "../../shell/chat";
import type { OutgoingAttachment } from "../../shell/chat";
import { useGroupText } from "./text";
import { useTimers } from "./useTimers";

export interface QueueRow {
  id: number;
  label: string;
  isBad: boolean;
}

const FAILED_ROW_MS = 4000;

type SendAttachment = (attachment: OutgoingAttachment) => Promise<boolean>;

/** Files on their way up: one row each, gone when sent, red for a while when not. */
export function useUploadQueue(sendAttachment: SendAttachment): { rows: readonly QueueRow[]; upload: (files: readonly File[]) => void } {
  const text = useGroupText();
  const later = useTimers();
  const [rows, setRows] = useState<readonly QueueRow[]>([]);
  const lastId = useRef(0);

  const drop = (id: number) => setRows(current => current.filter(row => row.id !== id));

  const uploadOne = async (file: File) => {
    const id = ++lastId.current;
    setRows(current => [...current, { id, label: `${file.name} — ${humanSize(file.size)}`, isBad: false }]);
    try {
      await sendAttachment(await fileToAttach(file));
      drop(id);
    } catch (error) {
      const isTooLarge = error instanceof Error && error.message === "too-large";
      const label = `${file.name} — ${text(isTooLarge ? "too_big" : "failed")}`;
      setRows(current => current.map(row => (row.id === id ? { id, label, isBad: true } : row)));
      later(() => drop(id), FAILED_ROW_MS);
    }
  };

  return { rows, upload: files => files.forEach(file => void uploadOne(file)) };
}
