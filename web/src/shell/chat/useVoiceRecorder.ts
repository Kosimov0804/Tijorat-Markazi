import { useCallback, useEffect, useRef, useState } from "react";
import { blobToBase64 } from "./attachments";
import type { OutgoingAttachment } from "./attachments";

/* Three states, needing three different answers: available, blocked because
   the page is not a secure origin (opened over http:// on a LAN address), or
   genuinely unsupported. */
export type RecordState = "ok" | "insecure" | "no";

export function recordState(): RecordState {
  const { protocol, hostname } = window.location;
  const isSecure =
    window.isSecureContext || protocol === "https:" || hostname === "localhost" || hostname === "127.0.0.1";
  if (!isSecure) return "insecure";
  if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === "undefined") return "no";
  return "ok";
}

export const canRecord = (): boolean => recordState() === "ok";

/** This page on the https port of the server, for a visitor who arrived over http. */
export const secureUrl = (): string =>
  `https://${window.location.hostname}:4443${window.location.pathname}${window.location.search}`;

export interface VoiceRecording {
  blob: Blob;
  /** As the recorder reports it, codecs included. */
  mime: string;
  seconds: number;
}

export interface VoiceRecorderOptions {
  /** Tried in order; the browser default is used when none is supported. */
  mimeTypes?: readonly string[];
  onRecorded: (recording: VoiceRecording) => void;
  onTick?: (seconds: number) => void;
  /** The microphone is missing or the visitor refused it. */
  onError: () => void;
}

export interface VoiceRecorder {
  isRecording: boolean;
  start: () => void;
  /** Ends the recording and delivers it. */
  stop: () => void;
  /** Ends the recording and throws it away. */
  cancel: () => void;
}

const DEFAULT_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm"] as const;
const FALLBACK_MIME = "audio/webm";
const TICK_MS = 200;
/* Shorter than this is a tap on the button, not a message. */
const MIN_VOICE_SECONDS = 0.4;

function supportedMime(candidates: readonly string[]): string {
  try {
    return candidates.find(type => MediaRecorder.isTypeSupported(type)) ?? "";
  } catch {
    return "";
  }
}

function createRecorder(stream: MediaStream, mime: string): MediaRecorder {
  if (!mime) return new MediaRecorder(stream);
  try {
    return new MediaRecorder(stream, { mimeType: mime });
  } catch {
    return new MediaRecorder(stream);
  }
}

interface Session {
  recorder: MediaRecorder | null;
  stream: MediaStream | null;
  timer: ReturnType<typeof setInterval> | undefined;
  isCancelled: boolean;
}

const isActive = (session: Session): boolean => session.recorder !== null && session.recorder.state !== "inactive";

/**
 * Microphone access behind one hook. The stream, the recorder and the timer
 * are all released when the recording ends or the component goes away.
 */
export function useVoiceRecorder(options: VoiceRecorderOptions): VoiceRecorder {
  const [isRecording, setIsRecording] = useState(false);
  const optionsRef = useRef(options);
  const sessionRef = useRef<Session | null>(null);
  useEffect(() => {
    optionsRef.current = options;
  });

  const release = useCallback((session: Session) => {
    clearInterval(session.timer);
    session.stream?.getTracks().forEach(track => track.stop());
    if (sessionRef.current === session) sessionRef.current = null;
  }, []);

  const begin = useCallback(
    (session: Session, stream: MediaStream) => {
      const recorder = createRecorder(stream, supportedMime(optionsRef.current.mimeTypes ?? DEFAULT_MIME_TYPES));
      const chunks: Blob[] = [];
      const startedAt = Date.now();
      session.recorder = recorder;
      recorder.ondataavailable = event => {
        if (event.data?.size) chunks.push(event.data);
      };
      recorder.onstop = () => {
        release(session);
        setIsRecording(false);
        if (session.isCancelled || chunks.length === 0) return;
        const mime = recorder.mimeType || FALLBACK_MIME;
        optionsRef.current.onRecorded({
          blob: new Blob(chunks, { type: mime }),
          mime,
          seconds: (Date.now() - startedAt) / 1000,
        });
      };
      recorder.start();
      session.timer = setInterval(() => optionsRef.current.onTick?.((Date.now() - startedAt) / 1000), TICK_MS);
      optionsRef.current.onTick?.(0);
    },
    [release],
  );

  const start = useCallback(() => {
    if (sessionRef.current) return;
    if (!canRecord()) {
      optionsRef.current.onError();
      return;
    }
    const session: Session = { recorder: null, stream: null, timer: undefined, isCancelled: false };
    sessionRef.current = session;
    setIsRecording(true);
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(stream => {
        session.stream = stream;
        /* Cancelled or unmounted while the permission prompt was open. */
        if (session.isCancelled) release(session);
        else begin(session, stream);
      })
      .catch(() => {
        release(session);
        if (session.isCancelled) return;
        setIsRecording(false);
        optionsRef.current.onError();
      });
  }, [begin, release]);

  const end = useCallback(
    (isCancelled: boolean) => {
      const session = sessionRef.current;
      if (!session) return;
      session.isCancelled = session.isCancelled || isCancelled;
      if (isActive(session)) {
        session.recorder?.stop();
      } else if (isCancelled) {
        release(session);
        setIsRecording(false);
      }
    },
    [release],
  );

  const stop = useCallback(() => end(false), [end]);
  const cancel = useCallback(() => end(true), [end]);

  useEffect(
    () => () => {
      const session = sessionRef.current;
      if (!session) return;
      session.isCancelled = true;
      if (isActive(session)) session.recorder?.stop();
      release(session);
    },
    [release],
  );

  return { isRecording, start, stop, cancel };
}

/** A recording as a chat voice note, or null when it was only a tap. */
export async function voiceAttachment(recording: VoiceRecording): Promise<OutgoingAttachment | null> {
  if (recording.seconds < MIN_VOICE_SECONDS) return null;
  return {
    data: await blobToBase64(recording.blob),
    mime: recording.mime.split(";")[0],
    name: "voice",
    voice: true,
    dur: recording.seconds,
  };
}
