/**
 * The shared chat kit (a typed port of chat-kit.js). Everything a chat
 * composer and its bubbles need, so the group chat, the direct messages and
 * the cabinets' threads behave the same way. Styles are the legacy .ck-* rules
 * in styles.css.
 *
 * Rendering
 *   <LinkedText text />            message text; [label](url) and bare http(s)
 *                                  addresses become links, the rest stays text
 *   parseLinks(text)               the segments LinkedText renders
 *   <AttachmentView attachment onOpenImage? />
 *                                  image, voice note, video, audio or file card
 *   <Lightbox items openAt onClose />
 *                                  full-screen image viewer with arrows and Esc
 *   <EmojiPicker isOpen toggleRef onPick onClose />
 *
 * Composer
 *   insertAtCaret(input, text)     writes into an uncontrolled <input>
 *   promptForLink(input, prompts)  asks for an address, inserts [label](url)
 *   fileToAttach(file)             File → upload payload; rejects with
 *                                  "too-large" (over MAX_ATTACH_BYTES) or "read-failed"
 *   blobToBase64(blob)
 *
 * Hooks (the only places that touch the socket and the microphone)
 *   useChatSocket({ isEnabled, credentials, onMessage }) → { send, isReady }
 *                                  /ws with sign-in, reconnect and cleanup;
 *                                  send() returns false when HTTP must be used
 *   useVoiceRecorder({ mimeTypes?, onRecorded, onTick?, onError })
 *                                  → { isRecording, start, stop, cancel }
 *   voiceAttachment(recording)     recording → voice-note payload, null for a tap
 *   recordState() / canRecord() / secureUrl()
 *
 * Data from the API or the socket
 *   parseAttachment(unknown)       ChatAttachment or null; drops unsafe addresses
 *   safeMediaUrl(unknown)          http, https or a same-origin path, else ""
 *   safeLinkHref(string)           http or https, else null
 *   isRecord / asString / asNumber / asArray
 *
 * Formatting
 *   humanSize(bytes)  clock(seconds)  timeOfDay(ms)  stamp(ms)
 */
export { AttachmentView } from "./Attachment";
export { MAX_ATTACH_BYTES, blobToBase64, fileToAttach, parseAttachment } from "./attachments";
export type { AttachmentKind, ChatAttachment, OutgoingAttachment } from "./attachments";
export { insertAtCaret, promptForLink } from "./composerInput";
export type { LinkPrompts } from "./composerInput";
export { EmojiPicker } from "./EmojiPicker";
export { clock, humanSize, stamp, timeOfDay } from "./format";
export { Lightbox } from "./Lightbox";
export type { LightboxItem } from "./Lightbox";
export { LinkedText } from "./LinkedText";
export { parseLinks } from "./links";
export type { LinkSegment } from "./links";
export { asArray, asNumber, asString, isRecord } from "./narrow";
export { safeLinkHref, safeMediaUrl } from "./urls";
export { useChatSocket } from "./useChatSocket";
export type { ChatSocket, ChatSocketOptions } from "./useChatSocket";
export { canRecord, recordState, secureUrl, useVoiceRecorder, voiceAttachment } from "./useVoiceRecorder";
export type { RecordState, VoiceRecorder, VoiceRecorderOptions, VoiceRecording } from "./useVoiceRecorder";
