import { useState } from "react";
import { listOf } from "../../shell/market";
import { buyerPost, parseSupplier } from "./types";
import type { Cabinet, Supplier } from "./types";

type SavedToggle = { pendingId: string | null; toggle: (companyId: string) => Promise<void> };

/** Adds a seller to the shortlist, or drops one already on it. */
export function useSavedToggle(cabinet: Cabinet, onSaved: (suppliers: Supplier[]) => void): SavedToggle {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const toggle = async (companyId: string): Promise<void> => {
    setPendingId(companyId);
    const answer = await buyerPost("/api/buyer/saved", cabinet.credentials, { companyId });
    setPendingId(null);
    if (answer.ok) onSaved(listOf(answer.suppliers, parseSupplier));
  };

  return { pendingId, toggle };
}
