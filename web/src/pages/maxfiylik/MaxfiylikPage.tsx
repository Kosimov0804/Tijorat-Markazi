import { LEGAL_MAXFIYLIK } from "@legacy/legal-text-maxfiylik.js";
import { LegalPage } from "../../shell/legal/LegalPage";

export function MaxfiylikPage() {
  return <LegalPage docKey="maxfiylik" doc={LEGAL_MAXFIYLIK} fallbackTitle="Maxfiylik siyosati" />;
}
