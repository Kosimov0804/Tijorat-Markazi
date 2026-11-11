declare module "@legacy/data.js" {
  export type Lang = "uz" | "ru" | "en";
  /** One entry per language, in the order of LANGS. */
  export type Localized = readonly [string, string, string];

  export interface AboutFeature {
    code: string;
    icon: string;
    name: Localized;
    desc: Localized;
  }
  export interface AboutRole {
    icon: string;
    name: Localized;
    desc: Localized;
  }

  export interface Center {
    icon: string;
    tag: string;
    name: string;
    desc: Localized;
  }
  type DetailKind = "center" | "module" | "future";

  export const CENTERS: readonly Center[];
  export const CAPS: Readonly<Record<DetailKind, readonly Localized[]>>;
  export const OVERVIEW: Readonly<Record<DetailKind, Localized>>;
  export const LANGS: readonly Lang[];
  export const T: Readonly<Record<string, Localized | undefined>>;
  export const ICONS: Readonly<Record<string, string | undefined>>;
  export const ICON_SUN: string;
  export const ICON_MOON: string;
  export const AB_FEATURES: readonly AboutFeature[];
  export const AB_ROLES: readonly AboutRole[];
  export const AB_HOW: readonly Localized[];
}

declare module "@legacy/legal-text-oferta.js" {
  export const LEGAL_OFERTA: import("../shell/legal/types").LegalText;
}

declare module "@legacy/legal-text-maxfiylik.js" {
  export const LEGAL_MAXFIYLIK: import("../shell/legal/types").LegalText;
}

declare module "@legacy/legal-text-shartlar.js" {
  export const LEGAL_SHARTLAR: import("../shell/legal/types").LegalText;
}

declare module "@legacy/markets-i18n.js" {
  import type { Localized } from "@legacy/data.js";
  type Dictionary = Readonly<Record<string, Localized | undefined>>;
  export const T_MK: Dictionary;
  export const T_BOZOR: Dictionary;
  export const T_MEHNAT: Dictionary;
  export const T_REGISTER: Dictionary;
  export const T_BREG: Dictionary;
  export const T_KORXONA: Dictionary;
  export const T_PRODUCT: Dictionary;
  export const T_BIZID: Dictionary;
}

declare module "@legacy/ui-dialog.js";

declare module "@legacy/skyline.js" {
  export function kgSkyline(mount: HTMLElement): void;
}

declare module "@legacy/monument-bg.js" {
  export function kgMonumentBackground(mount: HTMLElement): Promise<string | null | undefined>;
}

declare module "@legacy/dsr-i18n.js" {
  import type { Localized } from "@legacy/data.js";
  export const T_DSR: Readonly<Record<string, Localized | undefined>>;
}

/* The financial market pages. T_MOLIYA merges into the declaration above. */
declare module "@legacy/markets-i18n.js" {
  export const T_MOLIYA: Readonly<Record<string, import("@legacy/data.js").Localized | undefined>>;
}

/** Publishes window.MS_CONFIG; see pages/moliya-shared/engine/config.ts. */
declare module "@legacy/moliya-scoring-config.js";

declare module "@legacy/moliya-scoring-i18n.js" {
  export const T_MS: Readonly<Record<string, import("@legacy/data.js").Localized | undefined>>;
}

declare module "@legacy/moliya-investor-i18n.js" {
  export const T_MS_INV: Readonly<Record<string, import("@legacy/data.js").Localized | undefined>>;
}

declare module "@legacy/group-chat.js" {
  import type { Localized } from "@legacy/data.js";
  export type GroupTextKey =
    | "rooms"
    | "members"
    | "empty"
    | "none"
    | "ph"
    | "send"
    | "failed"
    | "loading"
    | "chairmen"
    | "observer"
    | "back"
    | "today"
    | "yesterday"
    | "search"
    | "cancel"
    | "link"
    | "link_url"
    | "link_txt"
    | "link_bad"
    | "typing"
    | "edited"
    | "removed"
    | "reply"
    | "edit"
    | "del"
    | "react"
    | "read_by"
    | "del_ask"
    | "too_big"
    | "mic_denied"
    | "mic_https"
    | "mic_open"
    | "mic_no"
    | "info"
    | "close"
    | "you"
    | "write"
    | "dm_note";
  export const KG_GROUP_T: Readonly<Record<GroupTextKey, Localized>>;
}

/* The analyst and buyer cabinets. Merges into the markets-i18n declaration above. */
declare module "@legacy/markets-i18n.js" {
  export const T_ANALYST: Readonly<Record<string, import("@legacy/data.js").Localized | undefined>>;
  export const T_XARIDOR: Readonly<Record<string, import("@legacy/data.js").Localized | undefined>>;
}
