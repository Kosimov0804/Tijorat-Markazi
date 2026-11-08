import { LEGAL_SHARTLAR } from "@legacy/legal-text-shartlar.js";
import { LegalPage } from "../../shell/legal/LegalPage";

export function ShartlarPage() {
  return <LegalPage docKey="shartlar" doc={LEGAL_SHARTLAR} fallbackTitle="Foydalanish shartlari" />;
}
