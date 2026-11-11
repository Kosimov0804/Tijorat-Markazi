import { useCallback, useEffect, useRef, useState } from "react";
import { blobToBase64, useVoiceRecorder } from "../../shell/chat";
import type { VoiceRecording } from "../../shell/chat";
import { transcribe } from "./assistantApi";

/** Keys of the shared T dictionary that the line under the chat title can show. */
export type MicStatusKey = "mic_listening" | "mic_transcribing" | "mic_err" | "mic_https" | "mic_denied";

export interface MicStatus {
  key: MicStatusKey;
  /** A problem, shown in red for a few seconds. */
  isAlert: boolean;
}

interface Dictation {
  isRecording: boolean;
  status: MicStatus | null;
  /** Press to start, press again to turn the recording into text. */
  toggle: () => void;
}

const ALERT_MS = 4500;
const MIME_TYPES = ["audio/webm", "audio/mp4"] as const;

/** Voice input: a recording is sent for transcription and the text handed back. */
export function useDictation(hasBackend: boolean, onText: (text: string) => void): Dictation {
  const [status, setStatus] = useState<MicStatus | null>(null);
  const alertTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isAlive = useRef(true);
  useEffect(() => {
    isAlive.current = true;
    return () => {
      isAlive.current = false;
      clearTimeout(alertTimer.current);
    };
  }, []);

  const alert = useCallback((key: MicStatusKey) => {
    clearTimeout(alertTimer.current);
    setStatus({ key, isAlert: true });
    alertTimer.current = setTimeout(() => setStatus(null), ALERT_MS);
  }, []);

  const handleRecorded = async ({ blob }: VoiceRecording) => {
    setStatus({ key: "mic_transcribing", isAlert: false });
    let text = "";
    try {
      if (hasBackend) text = await transcribe(await blobToBase64(blob), blob.type);
    } catch {
      text = "";
    }
    if (!isAlive.current) return;
    if (text) {
      setStatus(null);
      onText(text);
    } else {
      alert("mic_err");
    }
  };

  const recorder = useVoiceRecorder({
    mimeTypes: MIME_TYPES,
    onRecorded: recording => void handleRecorded(recording),
    onError: () => alert("mic_denied"),
  });

  const toggle = () => {
    if (recorder.isRecording) {
      recorder.stop();
      return;
    }
    if (!navigator.mediaDevices || typeof window.MediaRecorder === "undefined") {
      alert("mic_err");
      return;
    }
    /* The microphone needs HTTPS (or localhost). */
    if (!window.isSecureContext) {
      alert("mic_https");
      return;
    }
    clearTimeout(alertTimer.current);
    setStatus({ key: "mic_listening", isAlert: false });
    recorder.start();
  };

  return { isRecording: recorder.isRecording, status, toggle };
}
