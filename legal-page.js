/* ============================================================
   LEGAL PAGE — the document-page shell

   All the rendering moved to legal-render.js when the acceptance
   gate and the cabinet settings panel started needing the same
   text. What is left here is only what a PAGE has and the other
   two surfaces do not: a <title>, an <h1>, a version stamp, and
   a redraw when the language button is pressed.

   Which document to draw comes from data-legal-doc on <body>.
   ============================================================ */
(() => {
const { $, api, chrome, applyStatic } = MK;

const KEY = document.body.dataset.legalDoc || "oferta";
let CFG = null;

function draw(){
  const host = $("#lgBody");
  if(!host) return;

  const out = LegalDoc.render(KEY, CFG, MK.lang());
  host.innerHTML = out.html;

  const h1 = $("#lgTitle");
  if(h1 && out.title) h1.textContent = out.title;
  const stamp = $("#lgStamp");
  if(stamp) stamp.textContent = out.stamp;
  if(out.title)
    document.title = out.title + " — " + ((CFG && CFG.operator && CFG.operator.brand) || "TIJORAT MARKAZI");
}

async function boot(){
  CFG = await LegalDoc.config();
  draw();
  applyStatic();
}

chrome(draw);      // redraw on every language switch
boot();
})();
