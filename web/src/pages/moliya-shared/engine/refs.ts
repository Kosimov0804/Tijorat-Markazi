import type { Lang } from "@legacy/data.js";
import { CONFIG } from "./config";
import type { LocalizedName, Reason, ReasonParam, RoutingStatus } from "./types";

export function refItem<T extends { id: string }>(list: readonly T[] | undefined, id: unknown): T | null {
  return (list ?? []).find(item => item.id === id) ?? null;
}

/** The label of a reference entry in one language, falling back to Uzbek, then English. */
export function labelOf(item: Partial<LocalizedName> | string | null | undefined, lang: Lang): string {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item[lang] || item.uz || item.en || "";
}

export function routingTierFor(total: number): RoutingStatus {
  const tiers = CONFIG.routing.thresholds;
  const match = tiers.find(tier => total >= (tier.min as number) && total <= (tier.max as number));
  return match ?? tiers[tiers.length - 1];
}

/* A knockout sits outside the routing tiers. Copied from the legacy engine;
   engine.test.ts compares it with the original. */
export const KNOCKOUT_STATUS: RoutingStatus = {
  status: "knockout",
  color: "rose",
  action: "reject",
  uz: "MEZONLARGA MOS EMAS",
  ru: "НЕ СООТВЕТСТВУЕТ КРИТЕРИЯМ",
  en: "DOES NOT MEET CRITERIA",
};

export const reasonOf = (key: string, params: Record<string, ReasonParam> = {}): Reason => ({ key, params });
