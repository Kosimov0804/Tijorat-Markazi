/* ============================================================
   TIJORAT MARKAZI — real monuments as a quiet illustration

   A photograph of the Registan is unmistakably Uzbek in a way no
   code-drawn outline can be. This takes that photograph and pushes it
   away from photography and towards illustration, entirely in the
   browser:

     1. desaturate      strip the original colour
     2. posterise       collapse the tones into a few flat steps,
                        which is what makes it read as drawn
     3. duotone         remap those steps onto the brand palette —
                        sand in the lights, portal navy in the darks
     4. fade            mask the top and edges so the headline always
                        sits on clear ground

   Drop any photo into assets/monuments/ and it becomes part of the
   design. Nothing here needs the file to exist: if none is found the
   background simply stays empty.
   ============================================================ */

var KG_MONUMENTS = [
  "assets/monuments/registan.jpg",
  "assets/monuments/khiva.jpg",
  "assets/monuments/bukhara.jpg",
  "assets/monuments/monument.jpg",
  "assets/monuments/registan.png",
  "assets/monuments/khiva.png",
  "assets/monuments/monument.png"
];

/* The filter chain. Written as inline SVG because CSS alone cannot
   posterise or duotone — feComponentTransfer is the only way. */
function kgMonumentFilter(steps) {
  steps = steps || 5;
  // Discrete tone steps: the posterisation.
  var ramp = [];
  for (var i = 0; i < steps; i++) ramp.push((i / (steps - 1)).toFixed(3));
  var table = ramp.join(" ");

  return '<svg class="mon-defs" aria-hidden="true" focusable="false">' +
    '<filter id="kgMonument" color-interpolation-filters="sRGB">' +
      // 1 · strip the original colour
      '<feColorMatrix type="saturate" values="0"/>' +
      // 2 · flatten the greys into discrete steps
      '<feComponentTransfer>' +
        '<feFuncR type="discrete" tableValues="' + table + '"/>' +
        '<feFuncG type="discrete" tableValues="' + table + '"/>' +
        '<feFuncB type="discrete" tableValues="' + table + '"/>' +
      "</feComponentTransfer>" +
      // 3 · map black→navy and white→sand, so the photo joins the palette
      '<feComponentTransfer>' +
        '<feFuncR type="table" tableValues="0.12 0.97"/>' +
        '<feFuncG type="table" tableValues="0.19 0.95"/>' +
        '<feFuncB type="table" tableValues="0.31 0.91"/>' +
      "</feComponentTransfer>" +
    "</filter></svg>";
}

/**
 * Find the first monument image that actually exists and mount it.
 * @param {HTMLElement} mount
 * @param {string[]} [sources]
 * @returns {Promise<string|null>} the src used, or null if none was found
 */
function kgMonumentBackground(mount, sources) {
  if (!mount) return Promise.resolve(null);
  var list = sources || KG_MONUMENTS;

  function tryOne(i) {
    if (i >= list.length) return Promise.resolve(null);
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(list[i]); };
      img.onerror = function () { resolve(null); };
      img.src = list[i];
    }).then(function (found) { return found || tryOne(i + 1); });
  }

  return tryOne(0).then(function (src) {
    if (!src) return null;
    mount.insertAdjacentHTML("beforeend", kgMonumentFilter(5));
    var el = document.createElement("div");
    el.className = "mon-photo";
    el.style.backgroundImage = 'url("' + src + '")';
    mount.appendChild(el);
    mount.classList.add("mon-ready");
    return src;
  });
}
