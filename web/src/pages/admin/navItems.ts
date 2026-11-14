import type { AdminTextKey } from "./text";

export type ViewId =
  | "dashboard"
  | "associations"
  | "members"
  | "companies"
  | "leads"
  | "questions"
  | "projects"
  | "chat"
  | "report"
  | "conference"
  | "appeals"
  | "dsr"
  | "analysts"
  | "buyers"
  | "settings";

export interface NavItem {
  view: ViewId;
  textKey: AdminTextKey;
  /** The inside of a 24x24 stroke icon, copied by script from admin.js. */
  icon: string;
}

export const NAV: readonly NavItem[] = [
  { view: "dashboard", textKey: "nav_dash", icon: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>' },
  { view: "associations", textKey: "nav_assoc", icon: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h.01M12 9h.01M15 9h.01M9 13h.01M12 13h.01M15 13h.01M9 17h.01M15 17h.01"/>' },
  { view: "projects", textKey: "nav_projects", icon: '<path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>' },
  { view: "chat", textKey: "nav_chat", icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
  { view: "questions", textKey: "nav_quest", icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>' },
  { view: "appeals", textKey: "nav_appeals", icon: '<path d="M3 21h18"/><path d="M5 21V10M9 21V10M15 21V10M19 21V10"/><path d="M12 3l9 5H3z"/>' },
  { view: "conference", textKey: "nav_conf", icon: '<path d="M15 10l5-3v10l-5-3z"/><rect x="3" y="6" width="12" height="12" rx="2"/>' },
  { view: "dsr", textKey: "nav_dsr", icon: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>' },
  { view: "analysts", textKey: "nav_analysts", icon: '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6" rx=".6"/><rect x="12" y="7" width="3" height="10" rx=".6"/><rect x="17" y="13" width="3" height="4" rx=".6"/>' },
  { view: "buyers", textKey: "nav_buyers", icon: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L21 8H6"/>' },
  { view: "settings", textKey: "nav_set", icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 6 19.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.4 13H4a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 5.3 6L5.2 6a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 11 4.4V4a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V11a2 2 0 0 1 0 4h-.1z"/>' },
];

/* The heading of each view, as VIEW_TITLE in admin.js. Members, companies, leads and the
   monthly report have a view but no sidebar entry, exactly as in the old panel. */
export const VIEW_TITLE: Readonly<Record<ViewId, AdminTextKey>> = { dashboard: "nav_dash", associations: "nav_assoc", members: "nav_members", companies: "nav_comp", leads: "nav_leads", questions: "nav_quest", projects: "nav_projects", chat: "nav_chat", report: "nav_report", conference: "nav_conf", appeals: "nav_appeals", dsr: "nav_dsr", analysts: "nav_analysts", buyers: "nav_buyers", settings: "nav_set" };
