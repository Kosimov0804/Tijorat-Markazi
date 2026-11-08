import type { HtmlTagDescriptor, Plugin } from "vite";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap";

/* Module scripts run after parsing, so without this a dark-theme visitor
   would see one light frame on every page load. */
const THEME_BEFORE_PAINT =
  'try{document.documentElement.dataset.theme=localStorage.getItem("kg_theme")==="dark"?"dark":"light"}catch(e){document.documentElement.dataset.theme="light"}';

/* Qoidalar 24-band: the legal documents stay reachable without JavaScript. */
const NO_SCRIPT_LEGAL =
  '<p style="font-size:.82rem"><a href="oferta.html">Ommaviy oferta</a> · <a href="maxfiylik.html">Maxfiylik siyosati</a> · <a href="shartlar.html">Foydalanish shartlari</a></p>';

const headLink = (attrs: Record<string, string | boolean>): HtmlTagDescriptor => ({
  tag: "link",
  attrs,
  injectTo: "head",
});

const TAGS: readonly HtmlTagDescriptor[] = [
  { tag: "script", children: THEME_BEFORE_PAINT, injectTo: "head-prepend" },
  headLink({ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }),
  headLink({ rel: "preconnect", href: "https://fonts.googleapis.com" }),
  headLink({ rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true }),
  headLink({ rel: "stylesheet", href: FONTS }),
  { tag: "noscript", children: NO_SCRIPT_LEGAL, injectTo: "body" },
];

/* Keeps the per-page .html files down to the title and description. */
export function sharedDocument(): Plugin {
  return {
    name: "tm-shared-document",
    transformIndexHtml: { order: "post", handler: () => [...TAGS] },
  };
}
