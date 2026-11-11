import "@legacy/moliya-scoring-config.js";
import type { MsConfig } from "./types";

/* The methodology table stays in the one file the server also reads, so a
   weight changed there reaches both sides. That file publishes itself on
   window, the way ui-dialog.js does. */
const published = (window as unknown as { MS_CONFIG?: MsConfig }).MS_CONFIG;
if (!published) throw new Error("moliya-scoring-config.js did not publish MS_CONFIG");

export const CONFIG: MsConfig = published;
export const REF = CONFIG.references;
