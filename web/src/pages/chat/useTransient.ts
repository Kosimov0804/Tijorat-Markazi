import { useCallback, useRef, useState } from "react";
import { useTimers } from "./useTimers";

export interface Note {
  id: number;
  text: string;
  isBad: boolean;
  /** Offered as a link under the text, for the secure address. */
  href?: string;
}

const NOTE_MS = 6000;
const LINK_NOTE_MS = 20000;
const TYPING_SHOWN_MS = 2600;

export type AddNote = (text: string, isBad: boolean, href?: string) => void;

/** Short notices in the thread that remove themselves. */
export function useNotes(): { notes: readonly Note[]; addNote: AddNote } {
  const later = useTimers();
  const [notes, setNotes] = useState<readonly Note[]>([]);
  const lastId = useRef(0);

  const addNote = useCallback<AddNote>(
    (text, isBad, href) => {
      const id = ++lastId.current;
      setNotes(current => [...current, { id, text, isBad, href }]);
      later(() => setNotes(current => current.filter(note => note.id !== id)), href ? LINK_NOTE_MS : NOTE_MS);
    },
    [later],
  );

  return { notes, addNote };
}

interface TypingIndicator {
  typingWho: string | null;
  showTyping: (who: string) => void;
  clearTyping: () => void;
}

/** "X is typing", shown until a moment after the last signal. */
export function useTypingIndicator(): TypingIndicator {
  const later = useTimers();
  const [typingWho, setTypingWho] = useState<string | null>(null);
  const turn = useRef(0);

  const showTyping = useCallback(
    (who: string) => {
      const current = ++turn.current;
      setTypingWho(who);
      later(() => {
        if (turn.current === current) setTypingWho(null);
      }, TYPING_SHOWN_MS);
    },
    [later],
  );
  const clearTyping = useCallback(() => {
    turn.current += 1;
    setTypingWho(null);
  }, []);

  return { typingWho, showTyping, clearTyping };
}
