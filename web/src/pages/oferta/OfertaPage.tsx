import { LEGAL_OFERTA } from "@legacy/legal-text-oferta.js";
import { LegalPage } from "../../shell/legal/LegalPage";

export function OfertaPage() {
  return <LegalPage docKey="oferta" doc={LEGAL_OFERTA} fallbackTitle="Ommaviy oferta" />;
}
