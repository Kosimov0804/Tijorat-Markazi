/* ============================================================
   TIJORAT MARKAZI — ten background treatments, side by side

   Every option is real, running code rather than a picture, and each
   is drawn in strokes from the same Uzbek vocabulary the site already
   uses: the peshtoq, the ribbed dome, the minaret, girih, suzani.

   Shape generators come from skyline.js, which must load first.
   Parallax runs only while a demo is hovered — ten permanent rAF
   loops on one page would be wasteful.
   ============================================================ */

var KGB = (function () {
  var W = 1600, H = 520, G = 470;              // canvas + ground line
  var rnd = function (seed) {                  // deterministic: same page every reload
    var s = seed;
    return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  };
  var svg = function (inner, extra) {
    return '<svg class="bgl-svg" viewBox="0 0 ' + W + " " + H + '" ' +
      'preserveAspectRatio="xMidYMax slice" fill="none" aria-hidden="true"' +
      (extra || "") + ">" + inner + "</svg>";
  };
  var layer = function (depth, cls, body) {
    return '<g class="bgl-layer' + (cls ? " " + cls : "") + '" data-depth="' + depth + '">' + body + "</g>";
  };
  var p = function (d, cls) { return '<path' + (cls ? ' class="' + cls + '"' : "") + ' d="' + d + '"/>'; };
  var at = function (d, x, y, cls) {
    return '<path' + (cls ? ' class="' + cls + '"' : "") + ' d="' + d +
      '" transform="translate(' + x + " " + (y == null ? G : y) + ')"/>';
  };

  return {
    W: W, H: H, G: G, rnd: rnd, svg: svg, layer: layer, p: p, at: at
  };
})();

var KG_BACKGROUNDS = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: "skyline", name: "Ufq chizig'i",
    note: ["Hozirgi variant. Uch qatlam yodgorlik — sichqoncha va aylantirishga qarab siljiydi.",
           "Текущий вариант. Три слоя памятников, смещаются за курсором и прокруткой.",
           "The current one. Three ranges of monuments drifting against pointer and scroll."],
    render: function () {
      var s = "";
      [[0.35, "bgl-far", [[kgMinaret, 150, 9, 168], [kgDome, 300, 54, 122], [kgPortal, 470, 150, 160],
                          [kgDome, 660, 44, 100], [kgArcade, 940, 300, 84], [kgDome, 1180, 50, 112],
                          [kgPortal, 1360, 136, 146], [kgMinaret, 1520, 9, 160]]],
       [0.62, "bgl-mid", [[kgMinaret, 220, 11, 224], [kgPortal, 420, 196, 214], [kgDome, 630, 70, 158],
                          [kgArcade, 850, 260, 104], [kgPortal, 1080, 180, 196], [kgMinaret, 1440, 11, 232]]],
       [1, "bgl-near", [[kgMinaret, 130, 15, 300], [kgDome, 340, 92, 206], [kgPortal, 640, 268, 292],
                        [kgDome, 910, 84, 190], [kgPortal, 1380, 214, 244], [kgMinaret, 1552, 14, 286]]]
      ].forEach(function (L) {
        var body = L[2].map(function (m) {
          return KGB.at(m[0](m[2], m[3], m[0] === kgPortal ? { band: 1 } : 8), m[1]);
        }).join("") + KGB.p("M0 " + KGB.G + " H" + KGB.W);
        s += KGB.layer(L[0], L[1], body);
      });
      return KGB.svg(s);
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: "portal", name: "Yagona peshtoq",
    note: ["Bitta ulkan darvoza. Eng jim va eng monumental — matn uchun joy ko'p qoladi.",
           "Один огромный портал. Самый тихий и монументальный — оставляет место тексту.",
           "One enormous portal. The quietest and most monumental — leaves the copy room."],
    render: function () {
      var s = KGB.layer(1, "bgl-near", KGB.at(kgPortal(760, 700, { band: 1 }), 1180, KGB.G + 90));
      s += KGB.layer(0.4, "bgl-far",
        KGB.at(kgDome(120, 250, 9), 620) + KGB.at(kgMinaret(16, 330), 340) +
        KGB.p("M0 " + KGB.G + " H" + KGB.W));
      return KGB.svg(s);
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: "blueprint", name: "Chizma",
    note: ["Me'moriy chizma: o'lcham chiziqlari, o'q markazlari va ravoq radiuslari ko'rinadi.",
           "Архитектурный чертёж: размерные линии, оси и радиусы арок.",
           "An architect's drawing: dimension lines, axes and the arcs' construction radii."],
    render: function () {
      var grid = "";
      for (var x = 0; x <= KGB.W; x += 80) grid += "M" + x + " 0 V" + KGB.H + " ";
      for (var y = 0; y <= KGB.H; y += 80) grid += "M0 " + y + " H" + KGB.W + " ";
      var guides = [
        "M640 " + KGB.G + " V120", "M340 " + KGB.G + " V190", "M980 " + KGB.G + " V210",
        "M300 150 H980", "M296 140 v20 M984 140 v20",                    // dimension line
        "M640 " + (KGB.G - 292) + " m-190 0 a190 190 0 1 0 380 0 a190 190 0 1 0 -380 0", // arch radius
        "M340 " + (KGB.G - 206) + " m-92 0 a92 92 0 1 0 184 0 a92 92 0 1 0 -184 0"
      ].join(" ");
      return KGB.svg(
        KGB.layer(0.2, "bgl-grid", KGB.p(grid)) +
        KGB.layer(0.5, "bgl-guide", KGB.p(guides)) +
        KGB.layer(1, "bgl-near",
          KGB.at(kgPortal(268, 292, { band: 1 }), 640) + KGB.at(kgDome(92, 206, 9), 340) +
          KGB.at(kgDome(84, 190, 8), 980) + KGB.at(kgMinaret(15, 300), 1300) +
          KGB.p("M0 " + KGB.G + " H" + KGB.W)));
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: "contour", name: "Gorizontal",
    note: ["Yodgorliklar relyef xaritasidek — ichma-ich joylashgan chiziqlar. Juda zamonaviy.",
           "Памятники как рельефная карта — вложенные линии. Очень современно.",
           "The monuments as a relief map — nested contour lines. Very modern."],
    render: function () {
      var s = "";
      for (var i = 0; i < 9; i++) {
        var k = 1 - i * 0.098, o = i * 16;
        s += '<g transform="translate(0 ' + o + ') scale(1 ' + k.toFixed(3) + ')" ' +
          'transform-origin="800 ' + KGB.G + '">' +
          KGB.at(kgDome(112, 230, 8), 400) + KGB.at(kgPortal(300, 300), 800) +
          KGB.at(kgDome(96, 200, 7), 1180) + "</g>";
      }
      return KGB.svg(KGB.layer(1, "bgl-contour", s) +
        KGB.layer(0.3, "bgl-far", KGB.p("M0 " + KGB.G + " H" + KGB.W)));
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: "girih", name: "Girih",
    note: ["To'liq ekran geometrik to'r — sakkiz burchakli yulduz. Yodgorlik yo'q, faqat naqsh.",
           "Полноэкранная геометрическая сетка — восьмиконечная звезда. Без зданий, только узор.",
           "A full-bleed geometric lattice — the eight-point star. No buildings, pattern only."],
    render: function () {
      var d = "", u = 100;
      for (var gy = -1; gy * u < KGB.H + u; gy++) {
        for (var gx = -1; gx * u < KGB.W + u; gx++) {
          var cx = gx * u + u / 2, cy = gy * u + u / 2, r = u * 0.46;
          var oct = "";
          for (var k = 0; k < 8; k++) {
            var a = (k / 8) * Math.PI * 2 + Math.PI / 8;
            oct += (k ? "L" : "M") + (cx + Math.cos(a) * r).toFixed(1) + " " + (cy + Math.sin(a) * r).toFixed(1);
          }
          d += oct + "Z ";
          for (var k2 = 0; k2 < 4; k2++) {                       // the star inside
            var a1 = (k2 / 4) * Math.PI * 2 + Math.PI / 4;
            d += "M" + (cx + Math.cos(a1) * r).toFixed(1) + " " + (cy + Math.sin(a1) * r).toFixed(1) +
                 "L" + (cx - Math.cos(a1) * r).toFixed(1) + " " + (cy - Math.sin(a1) * r).toFixed(1) + " ";
          }
        }
      }
      return KGB.svg(KGB.layer(1, "bgl-girih", KGB.p(d)));
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: "rosette", name: "Gumbaz ichi",
    note: ["Gumbazga pastdan qarash — nurli rozetta, sekin aylanadi. Markazga e'tibor tortadi.",
           "Взгляд на купол снизу — лучевая розетта, медленно вращается. Тянет взгляд к центру.",
           "The dome seen from below — a radiating rosette, slowly turning. Pulls the eye centre."],
    render: function () {
      var cx = 1180, cy = 250, d = "", rings = [70, 120, 172, 226, 282];
      rings.forEach(function (r) { d += "M" + (cx - r) + " " + cy + "a" + r + " " + r + " 0 1 0 " + 2 * r + " 0a" + r + " " + r + " 0 1 0 " + -2 * r + " 0 "; });
      for (var i = 0; i < 32; i++) {                              // radial ribs
        var a = (i / 32) * Math.PI * 2;
        d += "M" + (cx + Math.cos(a) * 70).toFixed(1) + " " + (cy + Math.sin(a) * 70).toFixed(1) +
             "L" + (cx + Math.cos(a) * 282).toFixed(1) + " " + (cy + Math.sin(a) * 282).toFixed(1) + " ";
      }
      var pet = "";
      for (var j = 0; j < 16; j++) {                              // petal ring
        var a2 = (j / 16) * Math.PI * 2, a3 = ((j + 0.5) / 16) * Math.PI * 2;
        pet += "M" + (cx + Math.cos(a2) * 120).toFixed(1) + " " + (cy + Math.sin(a2) * 120).toFixed(1) +
               "Q" + (cx + Math.cos(a3) * 168).toFixed(1) + " " + (cy + Math.sin(a3) * 168).toFixed(1) +
               " " + (cx + Math.cos(a2 + Math.PI / 8) * 120).toFixed(1) + " " +
               (cy + Math.sin(a2 + Math.PI / 8) * 120).toFixed(1) + " ";
      }
      return KGB.svg('<g class="bgl-spin">' + KGB.p(d) + KGB.p(pet, "bgl-accent") + "</g>" +
        KGB.layer(0.4, "bgl-far", KGB.at(kgArcade(700, 90, 7), 400) + KGB.p("M0 " + KGB.G + " H" + KGB.W)));
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: "tunnel", name: "Ravoqlar yo'lagi",
    note: ["Ichma-ich ravoqlar — perspektiva tuyg'usi. Sichqonchaga qarab chuqurlik o'zgaradi.",
           "Вложенные арки — ощущение перспективы. Глубина меняется за курсором.",
           "Nested arches receding — a real sense of depth that shifts with the pointer."],
    render: function () {
      var s = "";
      for (var i = 0; i < 11; i++) {
        var k = 1 - i * 0.082, w = 620 * k, h = 470 * k;
        s += KGB.layer((1 - i * 0.08).toFixed(2), i > 6 ? "bgl-far" : "bgl-near",
          KGB.at("M" + -w / 2 + " 0 V" + (-h * 0.42) +
            " A" + (w * 0.9) + " " + (w * 0.9) + " 0 0 1 0 " + -h +
            " A" + (w * 0.9) + " " + (w * 0.9) + " 0 0 1 " + w / 2 + " " + (-h * 0.42) + " V0", 800));
      }
      return KGB.svg(s + KGB.layer(0.2, "bgl-far", KGB.p("M0 " + KGB.G + " H" + KGB.W)));
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: "minarets", name: "Minoralar",
    note: ["Faqat tik minoralar — ritm va nafislik. Jadval va matn bilan eng yaxshi kelishadi.",
           "Только вертикальные минареты — ритм и лёгкость. Лучше всего уживается с текстом.",
           "Minarets only — rhythm and lightness. Sits best of all beside text and tables."],
    render: function () {
      var r = KGB.rnd(7), s = "";
      [[0.35, "bgl-far", 13, 120, 190], [0.65, "bgl-mid", 9, 170, 250], [1, "bgl-near", 6, 230, 330]]
        .forEach(function (L) {
          var body = "";
          for (var i = 0; i < L[2]; i++) {
            var x = (KGB.W / L[2]) * (i + 0.5) + (r() - 0.5) * 60;
            body += KGB.at(kgMinaret(9 + r() * 6, L[3] + r() * (L[4] - L[3])), x.toFixed(0));
          }
          s += KGB.layer(L[0], L[1], body);
        });
      return KGB.svg(s + KGB.layer(0.2, "bgl-far", KGB.p("M0 " + KGB.G + " H" + KGB.W)));
    }
  },

  /* ---------------------------------------------------------------- 9 */
  {
    id: "ikat", name: "Abr",
    note: ["Marg'ilon abr ipagi — alangali to'lqinlar. Me'morchilik emas, to'qimachilik tili.",
           "Маргиланский абр — пламенные волны. Язык не архитектуры, а ткани.",
           "Margilan abr silk — flame-edged waves. The language of cloth, not architecture."],
    render: function () {
      var s = "";
      for (var b = 0; b < 7; b++) {
        var y = 90 + b * 62, amp = 26 + (b % 3) * 10, d = "M0 " + y;
        for (var x = 0; x <= KGB.W; x += 80) {
          var f = (x / 80) % 2 === 0 ? 1 : -1;
          d += " Q" + (x + 40) + " " + (y + amp * f) + " " + (x + 80) + " " + y;
        }
        s += KGB.layer((0.3 + b * 0.1).toFixed(2), b % 2 ? "bgl-accent" : "bgl-near", KGB.p(d));
      }
      return KGB.svg(s);
    }
  },

  /* --------------------------------------------------------------- 10 */
  {
    id: "suzani", name: "Suzani oy",
    note: ["Toshkent suzanisining oy disklari — chizmada, sochilgan holda. Iliq va qo'lda ishlangandek.",
           "Лунные диски ташкентского сюзане — контуром, россыпью. Тёплый, рукотворный.",
           "The moon disks of a Tashkent suzani — in outline, scattered. Warm and handmade."],
    render: function () {
      var r = KGB.rnd(21), s = "";
      [[0.35, "bgl-far", 7, 40, 70], [0.7, "bgl-mid", 5, 70, 110], [1, "bgl-accent", 3, 110, 165]]
        .forEach(function (L) {
          var body = "";
          for (var i = 0; i < L[2]; i++) {
            var cx = (KGB.W / L[2]) * (i + 0.5) + (r() - 0.5) * 200;
            var cy = 90 + r() * 300, rad = L[3] + r() * (L[4] - L[3]), d = "";
            d += "M" + (cx - rad) + " " + cy + "a" + rad + " " + rad + " 0 1 0 " + 2 * rad + " 0a" + rad + " " + rad + " 0 1 0 " + -2 * rad + " 0";
            d += "M" + (cx - rad * 0.62) + " " + cy + "a" + rad * 0.62 + " " + rad * 0.62 + " 0 1 0 " + 1.24 * rad + " 0a" + rad * 0.62 + " " + rad * 0.62 + " 0 1 0 " + -1.24 * rad + " 0";
            for (var k = 0; k < 12; k++) {                        // petal rays
              var a = (k / 12) * Math.PI * 2;
              d += " M" + (cx + Math.cos(a) * rad * 0.62).toFixed(1) + " " + (cy + Math.sin(a) * rad * 0.62).toFixed(1) +
                   "L" + (cx + Math.cos(a) * rad).toFixed(1) + " " + (cy + Math.sin(a) * rad).toFixed(1);
            }
            body += KGB.p(d);
          }
          s += KGB.layer(L[0], L[1], body);
        });
      return KGB.svg(s);
    }
  }
];

/** Mount one option and give it hover parallax. */
function kgMountBackground(el, opt) {
  el.innerHTML = opt.render();
  var layers = [].slice.call(el.querySelectorAll(".bgl-layer[data-depth]"));
  if (!layers.length) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var queued = false, mx = 0, my = 0;
  function apply() {
    queued = false;
    layers.forEach(function (g) {
      var d = parseFloat(g.dataset.depth);
      g.style.transform = "translate3d(" + (mx * 30 * d) + "px," + (my * 14 * d) + "px,0)";
    });
  }
  el.addEventListener("pointermove", function (e) {
    var r = el.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5;
    my = (e.clientY - r.top) / r.height - 0.5;
    if (!queued) { queued = true; requestAnimationFrame(apply); }
  });
  el.addEventListener("pointerleave", function () { mx = my = 0; apply(); });
}
