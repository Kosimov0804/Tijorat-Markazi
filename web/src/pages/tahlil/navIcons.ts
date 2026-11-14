import type { AnalystView } from "./data";

/** The sidebar icons as tahlil.js draws them: inner svg markup, bundled here and never from the API. */
export const NAV_ICONS: Record<AnalystView, string> = {
  overview:
    '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  segments: '<path d="M3 12h18M3 6h18M3 18h10"/>',
  trends: '<path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>',
  reports:
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8"/>',
};
