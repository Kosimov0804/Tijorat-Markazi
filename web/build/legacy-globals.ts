import path from "node:path";
import type { Plugin } from "vite";

/* The old pages load these files as classic scripts, so they cannot carry
   export statements. Adding the exports at build time lets React share the
   same translations and painters instead of a copy that would drift. */
export const LEGACY_MODULES: Readonly<Record<string, readonly string[]>> = {
  "data.js": ["LANGS", "T", "ICONS", "ICON_SUN", "ICON_MOON", "AB_FEATURES", "AB_ROLES", "AB_HOW", "CAPS", "OVERVIEW", "CENTERS"],
  "legal-text-oferta.js": ["LEGAL_OFERTA"],
  "legal-text-maxfiylik.js": ["LEGAL_MAXFIYLIK"],
  "legal-text-shartlar.js": ["LEGAL_SHARTLAR"],
  "markets-i18n.js": ["T_MK", "T_KORXONA", "T_PRODUCT", "T_BIZID"],
  "ui-dialog.js": [],
  "skyline.js": ["kgSkyline"],
  "monument-bg.js": ["kgMonumentBackground"],
};

const normalize = (file: string): string => file.replace(/\\/g, "/");

export function legacyGlobals(projectRoot: string): Plugin {
  const exportsByFile = new Map(
    Object.entries(LEGACY_MODULES).map(([file, names]) => [normalize(path.join(projectRoot, file)), names]),
  );
  return {
    name: "tm-legacy-globals",
    enforce: "pre",
    transform(code, id) {
      const names = exportsByFile.get(normalize(id.split("?")[0]));
      return names ? { code: `${code}\nexport { ${names.join(", ")} };\n`, map: null } : null;
    },
  };
}
