/* The composer's line icons, as drawn in group-chat.js. */

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;

export function AttachIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...STROKE} strokeLinecap="round">
      <path d="M21.4 11.05 12.25 20.2a5.5 5.5 0 0 1-7.78-7.78l9.2-9.19a3.67 3.67 0 0 1 5.18 5.18l-9.2 9.2a1.83 1.83 0 0 1-2.6-2.6l8.5-8.48" />
    </svg>
  );
}

export function EmojiIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...STROKE}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5a4.2 4.2 0 0 0 7 0" strokeLinecap="round" />
      <circle cx="9" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" {...STROKE} strokeLinecap="round">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  );
}

export function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...STROKE} strokeLinecap="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
    </svg>
  );
}

export function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...STROKE} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4z" />
    </svg>
  );
}
