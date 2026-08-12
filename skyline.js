/* ============================================================
   TIJORAT MARKAZI — Uzbek skyline, drawn in strokes only

   The monuments are built from four parts, the same four the real
   buildings are: the peshtoq (portal), the ribbed dome on its drum,
   the banded minaret, and the arcade. Everything is stroked — there
   are no fills anywhere, so the drawing reads as an architectural
   elevation rather than a silhouette.

   Three depth layers drift at different rates against the pointer and
   the scroll, which is what gives the flat line work its depth.
   Motion is skipped entirely when the visitor asks for reduced motion.
   ============================================================ */

/* A two-centred (pointed) arch springing at y=0, apex at -h.
   R is generous so the curve stays taut rather than bulging. */
function kgArch(w, h) {
  var R = w * 1.85;
  return "M" + -w + " 0 A" + R + " " + R + " 0 0 1 0 " + -h +
         " A" + R + " " + R + " 0 0 1 " + w + " 0";
}

/* ---- peshtoq: the monumental portal of a madrasa front ----
   The proportions are the ones that make it read as a Registan front:
   the pointed niche fills most of the face, and the frame around it is
   a narrow border rather than a thick wall. */
function kgPortal(w, h, opt) {
  opt = opt || {};
  var half = w / 2;
  var border = w * 0.11;                       // the framing band
  var nw = half - border * 1.5;                // niche half-width
  var nh = h * 0.78;                           // niche apex height
  var springs = h * 0.30;                      // where the arch starts to curve

  var d = [
    "M" + -half + " 0 V" + -h + " H" + half + " V0",                       // outer face
    "M" + (-half + border) + " 0 V" + (-h + border) +                      // inner border
      " H" + (half - border) + " V0",
    // the iwan: straight jambs, then a two-centred arch to the point
    "M" + -nw + " 0 V" + -springs +
      " A" + (nw * 1.75) + " " + (nw * 1.75) + " 0 0 1 0 " + -nh +
      " A" + (nw * 1.75) + " " + (nw * 1.75) + " 0 0 1 " + nw + " " + -springs + " V0",
    // a second line just inside it reads as the depth of the recess
    "M" + (-nw * 0.82) + " 0 V" + (-springs * 0.96) +
      " A" + (nw * 1.5) + " " + (nw * 1.5) + " 0 0 1 0 " + (-nh * 0.86) +
      " A" + (nw * 1.5) + " " + (nw * 1.5) + " 0 0 1 " + (nw * 0.82) + " " + (-springs * 0.96) + " V0"
  ];
  // guldastas: the engaged corner shafts, taller than the screen
  [-1, 1].forEach(function (s) {
    var x = s * (half - border * 0.5), t = h * 1.05, cw = border * 0.42;
    d.push("M" + (x - cw) + " 0 V" + -t + " M" + (x + cw) + " 0 V" + -t);
    d.push("M" + (x - cw) + " " + -t + " H" + (x + cw));
    d.push("M" + (x - cw * 1.25) + " " + -t +
           " C" + (x - cw * 1.25) + " " + -(t + h * 0.05) + " " + (x + cw * 1.25) + " " +
           -(t + h * 0.05) + " " + (x + cw * 1.25) + " " + -t);
    d.push("M" + x + " " + -(t + h * 0.045) + " V" + -(t + h * 0.075));
  });
  if (opt.band) {                              // the inscription frieze
    d.push("M" + (-half + border * 1.6) + " " + (-h + border * 2.1) + " H" + (half - border * 1.6));
  }
  return d.join(" ");
}

/* ---- ribbed dome on a tall drum, as at Gur-e-Amir ----
   The ribs are NESTED copies of the dome profile, scaled horizontally.
   Drawing them as chords from the apex (the obvious way) makes them
   cross near the top and the dome turns into a spider's web. */
function kgDome(r, h, ribs) {
  ribs = ribs || 8;
  var drum = h * 0.46, dh = h - drum;          // Timurid drums are tall
  var apex = -(drum + dh);

  /* One half-profile, from the rim up to the apex, at horizontal scale k.
     The shoulder pushes past the rim, which is what makes the dome bulge. */
  function halfProfile(k, sign) {
    var x = sign * r * k;
    return "M" + x + " " + -drum +
      " C" + (x * 1.06) + " " + (-drum - dh * 0.46) +
      " " + (x * 0.72) + " " + (-drum - dh * 0.88) +
      " 0 " + apex;
  }

  var d = [
    "M" + -r + " 0 V" + -drum + " M" + r + " 0 V" + -drum,          // drum walls
    "M" + -r + " " + -drum + " H" + r,                              // cornice
    halfProfile(1, -1), halfProfile(1, 1),                          // the dome outline
    "M0 " + apex + " V" + (apex - h * 0.09),                        // finial
    "M" + (-r * 0.055) + " " + (apex - h * 0.09) + " H" + (r * 0.055)
  ];
  for (var i = 1; i < ribs; i++) {                                  // nested ribs
    var k = i / ribs;
    d.push(halfProfile(k, -1));
    d.push(halfProfile(k, 1));
  }
  var wins = 5;                                                     // drum windows
  for (var j = 0; j < wins; j++) {
    var wx = -r * 0.68 + (r * 1.36 * j) / (wins - 1), ww = r * 0.055;
    d.push("M" + (wx - ww) + " " + (-drum * 0.18) + " V" + (-drum * 0.56) +
           " A" + (ww * 1.6) + " " + (ww * 1.6) + " 0 0 1 " + (wx + ww) + " " +
           (-drum * 0.56) + " V" + (-drum * 0.18) + " Z");
  }
  return d.join(" ");
}

/* ---- minaret: a tapered shaft in banded courses ---- */
function kgMinaret(w, h, bands) {
  bands = bands || 6;
  var top = w * 0.62, shaft = h * 0.78;
  var d = [
    "M" + -w + " 0 L" + -top + " " + -shaft,                        // taper
    "M" + w + " 0 L" + top + " " + -shaft
  ];
  for (var i = 1; i <= bands; i++) {                                // brick courses
    var f = i / (bands + 1), y = -shaft * f, hw = w + (top - w) * f;
    d.push("M" + -hw + " " + y + " H" + hw);
  }
  var lw = top * 1.5, lh = h * 0.13;                                // lantern
  d.push("M" + -lw + " " + -shaft + " H" + lw);
  d.push("M" + -lw * 0.86 + " " + -shaft + " V" + (-shaft - lh) +
         " M" + lw * 0.86 + " " + -shaft + " V" + (-shaft - lh));
  d.push("M" + -lw * 0.86 + " " + (-shaft - lh) + " H" + lw * 0.86);
  var cr = lw * 0.8, cy = -shaft - lh;                              // lantern dome
  d.push("M" + -cr + " " + cy + " C" + -cr + " " + (cy - h * 0.05) + " " +
         -cr * 0.4 + " " + (cy - h * 0.085) + " 0 " + (cy - h * 0.09) +
         " C" + cr * 0.4 + " " + (cy - h * 0.085) + " " + cr + " " +
         (cy - h * 0.05) + " " + cr + " " + cy);
  d.push("M0 " + (cy - h * 0.09) + " V" + (cy - h * 0.13));
  return d.join(" ");
}

/* ---- arcade: the low ranges of cells that link the monuments ----
   Wide, shallow arches on square piers — the madrasa's student cells,
   not a row of tents. */
function kgArcade(w, h, n) {
  n = n || 5;
  var step = w / n, half = w / 2;
  var d = ["M" + -half + " 0 V" + -h + " H" + half + " V0",
           "M" + -half + " " + (-h * 0.88) + " H" + half];        // parapet line
  for (var i = 0; i < n; i++) {
    var cx = -half + step * (i + 0.5), aw = step * 0.34;
    var spring = -h * 0.34, top = -h * 0.66;
    d.push("M" + (cx - aw) + " 0 V" + spring +
           " A" + (aw * 2.1) + " " + (aw * 2.1) + " 0 0 1 " + cx + " " + top +
           " A" + (aw * 2.1) + " " + (aw * 2.1) + " 0 0 1 " + (cx + aw) + " " + spring + " V0");
  }
  return d.join(" ");
}

/**
 * Draw the skyline into a container.
 * @param {HTMLElement} mount
 * @returns {{destroy:function}}
 */
function kgSkyline(mount) {
  if (!mount) return { destroy: function () {} };
  var W = 1600, H = 420, ground = 400;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Three ranges, far to near. Depth comes from scale, opacity and drift.
  var LAYERS = [
    { depth: 0.35, y: 26, items: [
      { f: kgMinaret, x: 120,  a: [9, 168] },
      { f: kgDome,    x: 258,  a: [54, 122, 9] },
      { f: kgPortal,  x: 430,  a: [150, 160, { band: 1 }] },
      { f: kgDome,    x: 610,  a: [44, 100, 7] },
      { f: kgMinaret, x: 742,  a: [8, 150] },
      { f: kgArcade,  x: 960,  a: [300, 84, 6] },
      { f: kgDome,    x: 1190, a: [50, 112, 8] },
      { f: kgPortal,  x: 1370, a: [136, 146] },
      { f: kgMinaret, x: 1520, a: [9, 160] }
    ] },
    { depth: 0.62, y: 12, items: [
      { f: kgMinaret, x: 210,  a: [11, 224] },
      { f: kgPortal,  x: 400,  a: [196, 214, { band: 1 }] },
      { f: kgDome,    x: 612,  a: [70, 158, 9] },
      { f: kgArcade,  x: 830,  a: [260, 104, 5] },
      { f: kgPortal,  x: 1060, a: [180, 196] },
      { f: kgDome,    x: 1268, a: [62, 140, 8] },
      { f: kgMinaret, x: 1430, a: [11, 232] }
    ] },
    { depth: 1, y: 0, items: [
      { f: kgMinaret, x: 128,  a: [15, 300] },
      { f: kgDome,    x: 330,  a: [92, 206, 10] },
      { f: kgPortal,  x: 620,  a: [268, 292, { band: 1 }] },
      { f: kgDome,    x: 900,  a: [84, 190, 9] },
      { f: kgArcade,  x: 1130, a: [230, 122, 4] },
      { f: kgPortal,  x: 1370, a: [214, 244] },
      { f: kgMinaret, x: 1552, a: [14, 286] }
    ] }
  ];

  var svg = '<svg class="sky-svg" viewBox="0 0 ' + W + " " + H + '" ' +
    'preserveAspectRatio="xMidYMax slice" fill="none" aria-hidden="true">';
  LAYERS.forEach(function (layer, li) {
    svg += '<g class="sky-layer sky-l' + li + '" data-depth="' + layer.depth + '">';
    layer.items.forEach(function (it) {
      var d = it.f.apply(null, it.a);
      svg += '<path d="' + d + '" transform="translate(' + it.x + " " + (ground + layer.y) + ')"/>';
    });
    svg += '<path class="sky-ground" d="M0 ' + (ground + layer.y) + " H" + W + '"/>';
    svg += "</g>";
  });
  svg += "</svg>";
  mount.innerHTML = svg;

  var layers = [].slice.call(mount.querySelectorAll(".sky-layer"));
  if (reduced) { mount.classList.add("sky-static"); return { destroy: function () {} }; }

  /* The lines draw themselves in on first paint. Each path gets its own
     length so the dash animation is proportional rather than uniform. */
  mount.querySelectorAll("path").forEach(function (p, i) {
    var len = 0;
    try { len = p.getTotalLength(); } catch (e) { len = 600; }
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = len;
    p.style.animation = "skyDraw 1.5s cubic-bezier(.16,1,.3,1) forwards";
    p.style.animationDelay = (i % 9) * 0.055 + "s";
  });

  /* Pointer and scroll parallax, both folded into one rAF write so the
     layers are only transformed once per frame. */
  var mx = 0, my = 0, sy = 0, queued = false;
  function apply() {
    queued = false;
    layers.forEach(function (g) {
      var d = parseFloat(g.dataset.depth);
      g.style.transform =
        "translate3d(" + (mx * 26 * d) + "px," + (my * 12 * d + sy * 0.06 * d) + "px,0)";
    });
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(apply); } }
  function onMove(e) {
    var r = mount.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5;
    my = (e.clientY - r.top) / r.height - 0.5;
    queue();
  }
  function onScroll() { sy = window.scrollY || 0; queue(); }

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });

  return {
    destroy: function () {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    }
  };
}
