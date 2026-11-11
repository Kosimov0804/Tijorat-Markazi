import { useState } from "react";
import { recordState, secureUrl, useVoiceRecorder, voiceAttachment } from "../../shell/chat";
import type { OutgoingAttachment } from "../../shell/chat";
import { useGroupText } from "./text";
import type { AddNote } from "./useTransient";

interface VoiceNote {
  isRecording: boolean;
  seconds: number;
  buttonClass: string;
  /** Press to start, press again to send. */
  toggle: () => void;
  cancel: () => void;
}

/** The microphone button of the composer. */
export function useVoiceNote(onSend: (attachment: OutgoingAttachment) => void, addNote: AddNote): VoiceNote {
  const text = useGroupText();
  const [micState] = useState(recordState);
  const [seconds, setSeconds] = useState(0);
  const recorder = useVoiceRecorder({
    onRecorded: recording => {
      void voiceAttachment(recording)
        .then(attachment => attachment && onSend(attachment))
        .catch(() => addNote(text("failed"), true));
    },
    onTick: setSeconds,
    onError: () => addNote(text("mic_denied"), true),
  });

  const toggle = () => {
    /* Off a secure origin the browser removes the microphone API altogether,
       so say so and offer the https address instead of failing silently. */
    if (micState === "insecure") {
      addNote(`${text("mic_https")} ${secureUrl()}`, true, secureUrl());
      return;
    }
    if (micState === "no") {
      addNote(text("mic_no"), true);
      return;
    }
    if (recorder.isRecording) {
      recorder.stop();
      return;
    }
    setSeconds(0);
    recorder.start();
  };

  const buttonClass = ["tg-ico", "tg-mic", micState !== "ok" && "blocked", recorder.isRecording && "on"]
    .filter(Boolean)
    .join(" ");
  return { isRecording: recorder.isRecording, seconds, buttonClass, toggle, cancel: recorder.cancel };
}
