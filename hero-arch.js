/* ============================================================
   TIJORAT MARKAZI — the hero arch, as a window

   The portal was a filled niche with a pattern in it. It is now a
   view THROUGH the arch: a dusk sky, the city in silhouette beyond,
   the naqsh reading as a screen across the opening, and nested arch
   frames giving the opening depth.

   Everything inside is clipped to the arch itself, so moving the
   pointer shifts the layers at different rates and the whole thing
   behaves like a real window rather than a picture of one.

   Uses the shape vocabulary from skyline.js when it is present, and
   falls back to its own simple forms when it is not.
   ============================================================ */
(function () {
  var W = 290, H = 352, GROUND = 292;

  /* The arch outline — a semicircular head on straight jambs with a
     small radius at the foot. Matches the CSS border-radius exactly, so
     the clip and the gold frame agree. */
  function archPath(inset) {
    inset = inset || 0;
    var w = W - inset * 2, h = H - inset * 2, r = w / 2, x = inset, y = inset;
    var foot = Math.max(2, 12 - inset);
    return "M" + x + " " + (y + r) +
           "A" + r + " " + r + " 0 0 1 " + (x + w) + " " + (y + r) +
           "V" + (y + h - foot) +
           "a" + foot + " " + foot + " 0 0 1 " + -foot + " " + foot +
           "H" + (x + foot) +
           "a" + foot + " " + foot + " 0 0 1 " + -foot + " " + -foot + "Z";
  }

  function build(el) {
    var has = typeof kgMinaret === "function";
    var far = "", mid = "";
    if (has) {
      // the city seen through the opening, small and far away
      far += '<path d="' + kgMinaret(4, 74) + '" transform="translate(38 ' + GROUND + ')"/>';
      far += '<path d="' + kgDome(22, 50, 7) + '" transform="translate(96 ' + GROUND + ')"/>';
      far += '<path d="' + kgMinaret(4, 66) + '" transform="translate(252 ' + GROUND + ')"/>';
      mid += '<path d="' + kgPortal(84, 96, { band: 1 }) + '" transform="translate(170 ' + GROUND + ')"/>';
      mid += '<path d="' + kgDome(30, 68, 8) + '" transform="translate(60 ' + GROUND + ')"/>';
    } else {
      far += '<path d="M38 ' + GROUND + 'v-74M252 ' + GROUND + 'v-66"/>';
      mid += '<path d="M130 ' + GROUND + 'v-96h80v96"/>';
    }

    // a scatter of points for the sky — fixed, so it never reflows
    var stars = "", seed = 7;
    var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (var i = 0; i < 26; i++) {
      stars += '<circle cx="' + (rnd() * W).toFixed(1) + '" cy="' + (rnd() * 210).toFixed(1) +
               '" r="' + (0.6 + rnd() * 1.1).toFixed(2) + '"/>';
    }

    // nested frames inside the opening: the depth of the recess
    var rings = "";
    [14, 26, 38].forEach(function (n, i) {
      rings += '<path class="ha-ring ha-ring-' + i + '" d="' + archPath(n) + '"/>';
    });

    el.innerHTML =
      '<svg class="ha-svg" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMid slice" ' +
      'aria-hidden="true">' +
        "<defs>" +
          '<clipPath id="haClip"><path d="' + archPath(0) + '"/></clipPath>' +
          '<linearGradient id="haSky" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" class="ha-sky-a"/><stop offset="1" class="ha-sky-b"/></linearGradient>' +
          '<radialGradient id="haGlow" cx="50%" cy="88%" r="62%">' +
            '<stop offset="0" class="ha-glow-a"/><stop offset="1" class="ha-glow-b"/></radialGradient>' +
        "</defs>" +
        '<g clip-path="url(#haClip)">' +
          '<rect class="ha-sky" width="' + W + '" height="' + H + '"/>' +
          '<rect class="ha-glow" width="' + W + '" height="' + H + '"/>' +
          '<g class="ha-layer ha-stars" data-depth=".25">' + stars + "</g>" +
          '<g class="ha-layer ha-far"   data-depth=".5">' + far + "</g>" +
          '<g class="ha-layer ha-mid"   data-depth=".9">' + mid + "</g>" +
          '<g class="ha-layer ha-naqsh" data-depth="1.4">' +
            '<rect width="' + W + '" height="' + H + '"/></g>' +
          '<g class="ha-layer ha-rings" data-depth=".2">' + rings + "</g>" +
          '<path class="ha-sweep" d="M-140 0 L-60 0 L' + (-60 + H) + " " + H + " L" + (-140 + H) + " " + H + 'Z"/>' +
        "</g>" +
      "</svg>";

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var layers = [].slice.call(el.querySelectorAll(".ha-layer"));
    var queued = false, mx = 0, my = 0;
    function apply() {
      queued = false;
      layers.forEach(function (g) {
        var d = parseFloat(g.dataset.depth);
        g.style.transform = "translate3d(" + (mx * 16 * d) + "px," + (my * 9 * d) + "px,0)";
      });
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(apply); } }

    // The whole hero drives it, not just the arch — the view shifts as
    // the visitor moves anywhere near it, which is what sells the depth.
    var scope = el.closest(".hero") || el;
    scope.addEventListener("pointermove", function (e) {
      var r = scope.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
      queue();
    }, { passive: true });
    scope.addEventListener("pointerleave", function () { mx = my = 0; queue(); });
  }

  function boot() {
    var el = document.querySelector(".hero-arch");
    if (el && !el.dataset.kgBuilt) { el.dataset.kgBuilt = "1"; build(el); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
