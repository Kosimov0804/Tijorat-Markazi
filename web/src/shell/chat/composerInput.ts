import { dialogs } from "../dialogs";
import { safeLinkHref } from "./urls";

/** Inserts text at the caret of a composer input, leaving the caret after it. */
export function insertAtCaret(input: HTMLInputElement, text: string): void {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;
  input.value = input.value.slice(0, start) + text + input.value.slice(end);
  input.focus();
  input.selectionStart = input.selectionEnd = start + text.length;
}

export interface LinkPrompts {
  url: string;
  label: string;
  bad: string;
}

/**
 * The "make a link" control: whatever is selected in the input becomes the
 * label, the address is asked for, and [label](url) is written in its place.
 */
export async function promptForLink(input: HTMLInputElement, prompts: LinkPrompts): Promise<void> {
  /* Read the selection before awaiting: opening the dialog moves focus out
     of the input, and some browsers drop the range with it. */
  const start = input.selectionStart ?? 0;
  const end = input.selectionEnd ?? 0;
  const selected = input.value.slice(start, end);
  const url = await dialogs.prompt(prompts.url, "https://");
  if (!url) return;
  if (!safeLinkHref(url)) {
    await dialogs.alert(prompts.bad, { tone: "danger" });
    return;
  }
  const label = selected || (await dialogs.prompt(prompts.label, url)) || url;
  input.focus();
  input.setSelectionRange(start, end);
  insertAtCaret(input, `[${label.replace(/[[\]]/g, "")}](${url})`);
}
