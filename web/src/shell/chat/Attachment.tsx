import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { ChatAttachment } from "./attachments";
import { clock, humanSize } from "./format";

const BAR_COUNT = 22;

/* A fixed bar strip: decoding the audio to draw a true waveform is not worth
   it for a 22-bar sketch. The same duration always draws the same strip. */
function barHeights(duration: number): string[] {
  let seed = Math.round((duration || 3) * 97) || 7;
  return Array.from({ length: BAR_COUNT }, () => {
    seed = (seed * 9301 + 49297) % 233280;
    return `${(26 + (seed / 233280) * 74).toFixed(0)}%`;
  });
}

/* One voice note plays at a time: starting another pauses this one. */
let pauseCurrent: (() => void) | null = null;

interface Playback {
  isPlaying: boolean;
  /** 0 to 100, or null before the first play. */
  progress: number | null;
  seconds: number;
  toggle: () => void;
}

/** Audio playback behind a hook, so the element is paused and dropped on unmount. */
function useVoicePlayback(src: string, duration: number): Playback {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(duration);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  const createAudio = (): HTMLAudioElement => {
    const audio = new Audio(src);
    audio.addEventListener("timeupdate", () => {
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
      setSeconds(audio.currentTime);
    });
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setProgress(0);
      setSeconds(duration);
    });
    return audio;
  };

  const toggle = () => {
    const audio = (audioRef.current ??= createAudio());
    const pause = () => {
      audio.pause();
      setIsPlaying(false);
    };
    if (isPlaying) {
      pause();
      return;
    }
    if (pauseCurrent) pauseCurrent();
    pauseCurrent = pause;
    setIsPlaying(true);
    /* A refused or broken clip must not leave the button stuck on "playing". */
    Promise.resolve(audio.play()).catch(() => setIsPlaying(false));
  };

  return { isPlaying, progress, seconds, toggle };
}

function VoiceBubble({ attachment }: { attachment: ChatAttachment }) {
  const { isPlaying, progress, seconds, toggle } = useVoicePlayback(attachment.url, attachment.dur);
  const waveStyle = progress === null ? undefined : ({ "--p": `${progress.toFixed(1)}%` } as CSSProperties);
  return (
    <span className={isPlaying ? "ck-voice playing" : "ck-voice"}>
      <button
        className="ck-play"
        type="button"
        aria-label="play"
        onClick={event => {
          event.stopPropagation();
          toggle();
        }}
      >
        {isPlaying ? "❚❚" : "▶"}
      </button>
      <span className="ck-wave" style={waveStyle}>
        {barHeights(attachment.dur).map((height, index) => (
          <i key={index} style={{ height }} />
        ))}
      </span>
      <span className="ck-time">{clock(seconds)}</span>
    </span>
  );
}

interface AttachmentViewProps {
  /** Already narrowed by parseAttachment, so its address is safe to load. */
  attachment: ChatAttachment;
  /** Images open the viewer; the address identifies which one. */
  onOpenImage?: (url: string) => void;
}

/** The bubble body for one attachment. */
export function AttachmentView({ attachment, onOpenImage }: AttachmentViewProps) {
  const { kind, url, name, size } = attachment;
  if (kind === "image") {
    return (
      <button
        type="button"
        className="ck-img"
        onClick={event => {
          event.stopPropagation();
          onOpenImage?.(url);
        }}
      >
        <img src={url} alt={name} loading="lazy" />
      </button>
    );
  }
  if (kind === "voice") return <VoiceBubble attachment={attachment} />;
  if (kind === "video") return <video className="ck-video" src={url} controls preload="metadata" />;
  if (kind === "audio") return <audio className="ck-audio" src={url} controls preload="none" />;
  return (
    <a className="ck-file" href={url} download={name}>
      <span className="ck-file-ic">📎</span>
      <span className="ck-file-tx">
        <b>{name}</b>
        <em>{humanSize(size)}</em>
      </span>
    </a>
  );
}
