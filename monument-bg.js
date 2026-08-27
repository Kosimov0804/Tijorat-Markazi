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

/* The glass city. One photograph carries both themes — see the note above
   .mon-photo in styles.css — so this is preferred over anything else in the
   folder rather than left to the folder's own ordering. */
var KG_MONUMENT_MAIN = "assets/monuments/glass-city.jpg";
var KG_MONUMENT_NEAR = "assets/near-glass.jpg";

var KG_MONUMENTS = [
  KG_MONUMENT_MAIN,
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
 * Drift the plate against the scroll and the pointer.
 *
 * The drawn skyline had this built in, but background.js only falls back to
 * that when NO photograph is found — so the moment a plate landed in
 * assets/monuments/ the background stopped moving altogether and sat dead
 * still while the page scrolled past it. This gives the photograph its own.
 *
 * It is deliberately gentler than the line work: a photograph carries far
 * more detail, and matching the drawn layers' travel reads as the whole
 * picture sliding rather than as depth. The slight scale keeps the edges
 * outside the frame so no gap opens up at the extremes.
 *
 * Three planes, not two. Two things moving at different rates is the minimum
 * that reads as parallax at all, and the eye reads it as two flat cards. A
 * third distance between them turns the pair into a stack: there is now
 * something for the foreground to move ACROSS rather than only against, and
 * the far skyline stops looking like a backdrop hung behind a prop.
 *
 * Distance is expressed once, as a multiplier, and everything else derives
 * from it — travel, rotation and scale all scale together, because they are
 * all consequences of the same one thing. Hand-tuned per-layer numbers drift
 * out of proportion the moment one of them is adjusted.
 */
var KG_PLANES = [
  /* `scale` is not a depth cue here — the planes get their apparent distance
     from background-size, haze and contrast in the stylesheet. It exists only
     to keep each layer's edges outside the frame at the extremes of its own
     travel, so no gap opens at the corners. The nearer a plane travels, the
     more margin it needs. */
  { cls: "mon-photo", depth: 1.00, scale: 1.03 },   // the far skyline
  { cls: "mon-mid",   depth: 1.72, scale: 1.05 },   // the middle distance
  { cls: "mon-near",  depth: 2.58, scale: 1.07 }    // the foreground domes
];

function kgMonumentParallax(planes) {
  planes = (planes || []).filter(function (q) { return q && q.el; });
  if (!planes.length) return;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var mx = 0, my = 0, sy = 0, queued = false;
  function apply() {
    queued = false;
    /* One base travel, multiplied by each plane's distance. The nearer the
       plane the further it goes and the harder it turns, which is what the
       eye actually uses to sort things into depth. */
    for (var i = 0; i < planes.length; i++) {
      var q = planes[i], d = q.depth;
      q.el.style.transform =
        "translate3d(" + (mx * 12 * d) + "px," + ((my * 6 + sy * 0.024) * d) + "px,0)" +
        " rotateY(" + (mx * -1.2 * d) + "deg)" +
        " rotateX(" + (my * 0.7 * d) + "deg)" +
        " scale(" + q.scale + ")";
    }
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(apply); } }
  function onMove(e) {
    mx = e.clientX / window.innerWidth - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
    queue();
  }
  function onScroll() { sy = window.scrollY || 0; queue(); }

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  apply();
}

/**
 * Find the first monument image that actually exists and mount it.
 * @param {HTMLElement} mount
 * @param {string[]} [sources]
 * @returns {Promise<string|null>} the src used, or null if none was found
 */
function kgMonumentBackground(mount, sources) {
  if (!mount) return Promise.resolve(null);
  /* Ask the server what is actually in the folder. Probing a guessed list
     cost a 404 per name; this costs one request, and none at all when the
     caller already knows the sources. Static hosting has no endpoint, so a
     failed lookup falls back to the guessed list. */
  var listing = sources
    ? Promise.resolve(sources)
    : fetch("/api/monuments")
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { return j && Array.isArray(j.files) ? j.files : KG_MONUMENTS; })
        .catch(function () { return KG_MONUMENTS; });

  return listing.then(function (list) {

  /* The same buildings in both themes.
     An earlier version kept a plate per theme and chose between them here.
     That was a bug factory and the wrong picture: the skyline changed
     buildings when you hit the theme toggle, and because the toggle rewrote
     data-theme without re-running this code, the stylesheet would end up
     screening a cream plate against a dark page and wash the whole band out
     to white. There is one plate now. The theme is a matter of ink, which is
     CSS's job, not a matter of which city you are looking at. */
  list = [KG_MONUMENT_MAIN].concat(list.filter(function (f) { return f !== KG_MONUMENT_MAIN; }));


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
    /* A second, nearer layer. One flat image sliding cannot read as depth
       however it moves — depth is the DIFFERENCE in travel between things at
       different distances. This sits closer to the viewer: bigger forms,
       cropped by the frame, and it travels roughly two and a half times as
       far as the skyline behind it.

       It blends rather than masks. The plate is drawn on flat black, and
       `screen` drops black to nothing, so the ground disappears and only the
       glass survives — no alpha channel and no second request for a cut-out.
       In light theme the stylesheet inverts it first, which turns that same
       black ground white for `multiply` to drop. */
    /* The middle plane reuses the far plate rather than loading a third
       photograph. It is the same city seen from closer in — larger on the
       screen, cropped lower, travelling faster — and because the file is
       already in cache it costs no request and no bytes. A separate asset
       would also have to match the other two, and three glass cities that
       nearly agree look worse than one seen three times. */
    var mid = document.createElement("div");
    mid.className = "mon-mid";
    mid.style.backgroundImage = 'url("' + src + '")';
    mount.appendChild(mid);

    var near = document.createElement("div");
    near.className = "mon-near";
    near.style.backgroundImage = 'url("' + KG_MONUMENT_NEAR + '")';
    mount.appendChild(near);

    var byClass = { "mon-photo": el, "mon-mid": mid, "mon-near": near };
    kgMonumentParallax(KG_PLANES.map(function (q) {
      return { el: byClass[q.cls], depth: q.depth, scale: q.scale };
    }));
    return src;
  });

  });
}
