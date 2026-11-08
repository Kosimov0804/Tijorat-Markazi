import "@legacy/ui-dialog.js";

type DialogApi = {
  toast: (message: string, options?: { tone?: string }) => void;
  prompt: (message: string, value?: string) => Promise<string | null>;
};

/** The shared platform dialogs, which ui-dialog.js publishes on window. */
export const dialogs = (window as unknown as { UI: DialogApi }).UI;
