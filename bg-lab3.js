/* ============================================================
   TIJORAT MARKAZI — ten background treatments beyond line work

   These are FILLED rather than stroked: silhouette, cut paper,
   majolica mosaic, halftone, dusk, cyanotype, stained glass, grain,
   long shadow, and negative space.

   Nearly all of them are driven by one function — topAt(x), the
   height of the skyline at any horizontal position. Once the
   silhouette is a height field, a mosaic is that field sampled on a
   square grid, a halftone is the same field sampled as dots, and a
   knockout is the field used as a mask. That is why these ten agree
   with each other instead of looking like ten separate drawings.
   ============================================================ */

var KGS = (function () {
  var W = 1600, H = 520, G = 470;

  /* The skyline as data. Every treatment reads this, so changing the
     composition changes all ten at once. */
  var CITY = [
    { t: "minaret", cx: 150,  w: 15, h: 300 },
    { t: "dome",    cx: 340,  w: 96, h: 210 },
    { t: "portal",  cx: 640,  w: 280, h: 300 },
    { t: "dome",    cx: 930,  w: 86, h: 195 },
    { t: "arcade",  cx: 1140, w: 200, h: 96 },
    { t: "portal",  cx: 1360, w: 210, h: 240 },
    { t: "minaret", cx: 1520, w: 14, h: 285 }
  ];

  /** Height of the silhouette above ground at x — the whole basis. */
  function heightAt(x) {
    var top = 0;
    for (var i = 0; i < CITY.length; i++) {
      var b = CITY[i], dx = Math.abs(x - b.cx), h = 0;
      if (b.t === "dome") {
        var r = b.w, drum = b.h * 0.46;
        if (dx <= r) {
          var u = dx / r;
          h = drum + (b.h - drum) * Math.pow(Math.cos(u * Math.PI / 2), 0.72);
        }
      } else if (b.t === "minaret") {
        if (dx <= b.w) h = b.h * (1 - 0.1 * (dx / b.w));
      } else if (b.t === "portal") {
        if (dx <= b.w / 2) h = b.h;
      } else if (b.t === "arcade") {
        if (dx <= b.w) h = b.h;
      }
      if (h > top) top = h;
    }
    return top;
  }
  function topAt(x) { return G - heightAt(x); }

  /** The silhouette as one closed, fillable path. */
  function silhouette(step, base) {
    step = step || 4; base = base == null ? H : base;
    var d = "M0 " + base + " L0 " + topAt(0).toFixed(1);
    for (var x = step; x <= W; x += step) d += " L" + x + " " + topAt(x).toFixed(1);
    return d + " L" + W + " " + base + " Z";
  }

  function svg(inner, defs) {
    return '<svg class="bgl-svg" viewBox="0 0 ' + W + " " + H + '" ' +
      'preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
      (defs ? "<defs>" + defs + "</defs>" : "") + inner + "</svg>";
  }
  function layer(depth, cls, body) {
    return '<g class="bgl-layer' + (cls ? " " + cls : "") + '" data-depth="' + depth + '">' + body + "</g>";
  }
  function rnd(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  return { W: W, H: H, G: G, CITY: CITY, heightAt: heightAt, topAt: topAt,
           silhouette: silhouette, svg: svg, layer: layer, rnd: rnd };
})();

var KG_BACKGROUNDS3 = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: "silhouette", name: "Siluet",
    note: ["To'ldirilgan siluet, uch ohangda. Eng sodda va eng kuchli — chiziq umuman yo'q.",
           "Заливной силуэт в три тона. Самое простое и сильное — линий нет вовсе.",
           "A filled silhouette in three tones. The simplest and strongest — no lines at all."],
    render: function () {
      var s = "";
      [[0.3, "bgl-fill-3", 46], [0.6, "bgl-fill-2", 24], [1, "bgl-fill-1", 0]].forEach(function (L) {
        s += KGS.layer(L[0], L[1],
          '<path d="' + KGS.silhouette(5) + '" transform="translate(0 ' + L[2] + ') scale(1 ' +
          (1 - L[2] / 620).toFixed(3) + ')" transform-origin="800 ' + KGS.H + '"/>');
      });
      return KGS.svg(s);
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: "paper", name: "Qog'oz qatlam",
    note: ["Qirqilgan qog'oz qatlamlari — yumshoq soya bilan. Haqiqiy chuqurlik hissi beradi.",
           "Слои вырезанной бумаги с мягкой тенью. Даёт настоящее ощущение глубины.",
           "Cut-paper layers with a soft shadow. Gives a real sense of depth."],
    render: function () {
      var defs = '<filter id="kgsoft" x="-20%" y="-20%" width="140%" height="140%">' +
        '<feDropShadow dx="0" dy="-6" stdDeviation="9" flood-opacity=".28"/></filter>';
      var s = "";
      [[0.25, "bgl-paper-3", 72], [0.55, "bgl-paper-2", 38], [1, "bgl-paper-1", 0]].forEach(function (L) {
        s += KGS.layer(L[0], L[1],
          '<path filter="url(#kgsoft)" d="' + KGS.silhouette(5) +
          '" transform="translate(0 ' + L[2] + ') scale(1 ' + (1 - L[2] / 700).toFixed(3) +
          ')" transform-origin="800 ' + KGS.H + '"/>');
      });
      return KGS.svg(s, defs);
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: "mosaic", name: "Koshin mozaika",
    note: ["Bino mayda koshin kvadratchalaridan yig'ilgan — xuddi haqiqiy majolika terilgandek.",
           "Здание собрано из мелких квадратов изразца — как настоящая майолика.",
           "The building assembled from small glazed squares — as real majolica is laid."],
    render: function () {
      var u = 13, s = "", r = KGS.rnd(5);
      for (var x = 0; x < KGS.W; x += u) {
        var top = KGS.topAt(x + u / 2);
        for (var y = KGS.G - u; y > top - u; y -= u) {
          var d = (KGS.G - y) / Math.max(1, KGS.G - top);          // 0 at ground, 1 at the top
          var cls = r() < 0.16 ? "bgl-tile-a" : (d > 0.62 ? "bgl-tile-b" : "bgl-tile-c");
          s += '<rect class="' + cls + '" x="' + (x + 1) + '" y="' + (y + 1).toFixed(0) +
               '" width="' + (u - 2) + '" height="' + (u - 2) + '" rx="1.5"/>';
        }
      }
      return KGS.svg(KGS.layer(1, "bgl-mosaic", s));
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: "halftone", name: "Nuqta",
    note: ["Rastr nuqtalar: pastda yirik, tepaga borgan sari mayda. Bosmaxona tili.",
           "Растровые точки: крупные внизу, мельче кверху. Язык типографской печати.",
           "A halftone screen: coarse at the base, finer towards the top. The language of print."],
    render: function () {
      var u = 15, s = "";
      for (var x = 0; x < KGS.W; x += u) {
        var top = KGS.topAt(x + u / 2), span = Math.max(1, KGS.G - top);
        for (var y = KGS.G - u / 2; y > top; y -= u) {
          var d = (KGS.G - y) / span;                               // deeper inside → bigger dot
          var rad = (u / 2) * (1 - d * 0.82);
          if (rad < 0.6) continue;
          s += '<circle cx="' + (x + u / 2) + '" cy="' + y.toFixed(1) + '" r="' + rad.toFixed(2) + '"/>';
        }
      }
      return KGS.svg(KGS.layer(1, "bgl-halftone", s));
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: "dusk", name: "Shom",
    note: ["Suratdagidek: gradient osmon, qorong'i siluet va yonayotgan ravoqlar.",
           "Как на фотографии: градиентное небо, тёмный силуэт и светящиеся арки.",
           "As in the photograph: a gradient sky, a dark silhouette, and lit arches."],
    render: function () {
      var defs =
        '<linearGradient id="kgsky" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" class="kg-sky-a"/><stop offset="1" class="kg-sky-b"/></linearGradient>' +
        '<radialGradient id="kgglow" cx="50%" cy="100%" r="70%">' +
          '<stop offset="0" class="kg-glow-a"/><stop offset="1" class="kg-glow-b"/></radialGradient>';
      var lamps = "";
      KGS.CITY.forEach(function (b) {
        if (b.t === "portal") {
          lamps += '<ellipse class="bgl-lamp" cx="' + b.cx + '" cy="' + (KGS.G - b.h * 0.34) +
                   '" rx="' + (b.w * 0.2) + '" ry="' + (b.h * 0.24) + '"/>';
        } else if (b.t === "arcade") {
          for (var i = 0; i < 5; i++) {
            lamps += '<ellipse class="bgl-lamp" cx="' + (b.cx - b.w * 0.72 + (b.w * 1.44 * i) / 4) +
                     '" cy="' + (KGS.G - b.h * 0.42) + '" rx="9" ry="20"/>';
          }
        }
      });
      return KGS.svg(
        '<rect width="' + KGS.W + '" height="' + KGS.H + '" fill="url(#kgsky)"/>' +
        '<rect width="' + KGS.W + '" height="' + KGS.H + '" fill="url(#kgglow)"/>' +
        KGS.layer(0.35, "bgl-dusk-far",
          '<path d="' + KGS.silhouette(6) + '" transform="translate(0 40) scale(1 .93)" transform-origin="800 ' + KGS.H + '"/>') +
        KGS.layer(1, "bgl-dusk", '<path d="' + KGS.silhouette(4) + '"/>' + lamps), defs);
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: "cyano", name: "Ko'k chizma",
    note: ["Sianotip: to'q ko'k yer, oq chiziq. Eski me'moriy nusxa ko'chirish usuli.",
           "Цианотипия: густо-синий фон, белые линии. Старый способ копирования чертежей.",
           "Cyanotype: a deep blue ground and white lines. How drawings were once copied."],
    render: function () {
      var grid = "";
      for (var x = 0; x <= KGS.W; x += 64) grid += "M" + x + " 0V" + KGS.H;
      for (var y = 0; y <= KGS.H; y += 64) grid += "M0 " + y + "H" + KGS.W;
      var s = '<rect class="bgl-cyano-bg" width="' + KGS.W + '" height="' + KGS.H + '"/>' +
        '<path class="bgl-cyano-grid" d="' + grid + '"/>';
      s += KGS.layer(1, "bgl-cyano",
        '<path d="' + KGS.silhouette(4) + '"/>' +
        '<path class="bgl-cyano-line" d="M0 ' + KGS.G + "H" + KGS.W + '"/>');
      return KGS.svg(s);
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: "glass", name: "Vitraj",
    note: ["Rangli bo'laklar va ular orasidagi qora qo'rg'oshin — panjara oynasi kabi.",
           "Цветные фрагменты и тёмный свинец между ними — как витражное окно.",
           "Coloured fragments with dark leading between them — a stained-glass window."],
    render: function () {
      var u = 46, s = "", r = KGS.rnd(9), tones = ["a", "b", "c", "d"];
      for (var x = 0; x < KGS.W; x += u) {
        var top = KGS.topAt(x + u / 2);
        for (var y = KGS.G - u; y > top - u; y -= u) {
          var t = tones[Math.floor(r() * tones.length)];
          s += '<rect class="bgl-glass-' + t + '" x="' + (x + 2) + '" y="' + (y + 2).toFixed(0) +
               '" width="' + (u - 4) + '" height="' + (u - 4) + '" rx="3"/>';
        }
      }
      return KGS.svg('<rect class="bgl-lead" width="' + KGS.W + '" height="' + KGS.H + '"/>' +
        KGS.layer(1, "bgl-glass", s));
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: "grain", name: "Don",
    note: ["Rizograf bosmasidek — siluet ustida mayda don. Iliq, qo'lda bosilgan taassurot.",
           "Как ризограф — мелкое зерно поверх силуэта. Тёплое, ручной печати ощущение.",
           "Like a risograph — fine grain over the silhouette. Warm, hand-printed."],
    render: function () {
      var r = KGS.rnd(13), dots = "";
      for (var i = 0; i < 2600; i++) {
        var x = r() * KGS.W, y = r() * KGS.H;
        if (y < KGS.topAt(x)) continue;                             // grain only inside the form
        dots += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (0.6 + r() * 1.5).toFixed(2) + '"/>';
      }
      return KGS.svg(
        KGS.layer(0.4, "bgl-grain-body", '<path d="' + KGS.silhouette(5) + '"/>') +
        KGS.layer(1, "bgl-grain-dots", dots) +
        KGS.layer(0.7, "bgl-grain-shift",
          '<path d="' + KGS.silhouette(5) + '" transform="translate(7 -5)"/>'));
    }
  },

  /* ---------------------------------------------------------------- 9 */
  {
    id: "longshadow", name: "Uzun soya",
    note: ["Tekis shakl va undan cho'zilgan uzun soya — qat'iy, grafik, zamonaviy.",
           "Плоская форма и длинная тень от неё — строго, графично, современно.",
           "A flat shape with one long shadow thrown from it — strict, graphic, modern."],
    render: function () {
      var defs = '<linearGradient id="kgls" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" class="kg-ls-a"/><stop offset="1" class="kg-ls-b"/></linearGradient>';
      return KGS.svg(
        KGS.layer(0.5, "bgl-ls-shadow",
          '<path fill="url(#kgls)" d="' + KGS.silhouette(5) +
          '" transform="skewX(-32) translate(150 0)"/>') +
        KGS.layer(1, "bgl-ls-body", '<path d="' + KGS.silhouette(4) + '"/>'), defs);
    }
  },

  /* --------------------------------------------------------------- 10 */
  {
    id: "knockout", name: "Kesik",
    note: ["Bino rangli panelda o'yilgan bo'shliq — shakl emas, uning yo'qligi ko'rinadi.",
           "Здание — вырез в цветной панели: видно не форму, а её отсутствие.",
           "The building as a hole cut in a coloured panel — you see its absence, not its shape."],
    render: function () {
      var defs = '<mask id="kgko">' +
        '<rect width="' + KGS.W + '" height="' + KGS.H + '" fill="#fff"/>' +
        '<path d="' + KGS.silhouette(4) + '" fill="#000"/></mask>';
      return KGS.svg(
        '<rect class="bgl-ko-panel" width="' + KGS.W + '" height="' + KGS.H + '" mask="url(#kgko)"/>' +
        KGS.layer(0.4, "bgl-ko-hint",
          '<path d="' + KGS.silhouette(6) + '" transform="translate(0 34) scale(1 .94)" transform-origin="800 ' + KGS.H + '"/>'),
        defs);
    }
  }
];
