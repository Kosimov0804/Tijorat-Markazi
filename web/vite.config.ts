import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { LEGACY_MODULES, legacyGlobals } from "./build/legacy-globals.ts";
import { sharedDocument } from "./build/shared-document.ts";

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(webRoot, "..");
const BACKEND = "http://localhost:4321";

/* Every page that has been converted is one .html file in this folder. */
const pages = readdirSync(webRoot).filter(name => name.endsWith(".html"));
const convertedPages = new Set(pages);

/* Pages not converted yet still come from the Node server, so a link from a
   React page to an old page keeps working in development. */
const legacyPages = readdirSync(projectRoot).filter(name => name.endsWith(".html") && !convertedPages.has(name));
const proxied = ["/assets", "/favicon.svg", ...legacyPages.map(name => `/${name}`)];

/* The project root holds anthropic.key and credentials.*, so the dev server
   may read only this folder and the exact legacy files the pages import. */
const LEGACY_STYLES = ["styles.css", "legal.css", "markets.css", "biznes-id.css"];
const allowedFiles = [...Object.keys(LEGACY_MODULES), ...LEGACY_STYLES].map(file => path.join(projectRoot, file));

export default defineConfig({
  root: webRoot,
  base: "/",
  plugins: [react(), legacyGlobals(projectRoot), sharedDocument()],
  resolve: { alias: { "@legacy": projectRoot } },
  server: {
    port: 5173,
    fs: { strict: true, allow: [webRoot, ...allowedFiles] },
    proxy: {
      "/api": BACKEND,
      "/uploads": BACKEND,
      "/ws": { target: BACKEND, ws: true },
      ...Object.fromEntries(proxied.map(route => [route, BACKEND])),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    /* Not "assets": that name already belongs to the monument artwork the
       Node server hands out from the project root. */
    assetsDir: "_r",
    rolldownOptions: {
      input: Object.fromEntries(pages.map(name => [name.replace(/\.html$/, ""), path.join(webRoot, name)])),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    css: false,
    restoreMocks: true,
  },
});
