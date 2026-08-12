/* ============================================================
   TIJORAT MARKAZI — ten UNIQUE treatments of Uzbek monuments

   Every one of these has real buildings in it, and every one uses a
   drawing idea you do not normally see on a website: axonometric
   projection, a cut section, an exploded assembly, a true 3-D
   wireframe, a water reflection, a survey point-cloud, a sliced
   contour model, a monumental crop, one-point perspective, and a
   freehand ink hand.

   Requires skyline.js for the shared shape vocabulary.
   ============================================================ */

var KGB2 = (function () {
  var W = 1600, H = 520, G = 470;
  function rnd(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
  /* Isometric projection: a point in building space (x right, y depth,
     z up) onto the page. 30° is the true isometric angle. */
  function iso(x, y, z) {
    var c = Math.cos(Math.PI / 6), s = Math.sin(Math.PI / 6);
    return [(x - y) * c, (x + y) * s - z];
  }
  function isoBox(ox, oy, w, d, h) {
    var P = [], pts = [[0,0,0],[w,0,0],[w,d,0],[0,d,0],[0,0,h],[w,0,h],[w,d,h],[0,d,h]];
    pts.forEach(function (p) { var q = iso(p[0], p[1], p[2]); P.push([q[0] + ox, q[1] + oy]); });
    var e = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    return e.map(function (k) {
      return "M" + P[k[0]][0].toFixed(1) + " " + P[k[0]][1].toFixed(1) +
             "L" + P[k[1]][0].toFixed(1) + " " + P[k[1]][1].toFixed(1);
    }).join(" ");
  }
  function svg(inner) {
    return '<svg class="bgl-svg" viewBox="0 0 ' + W + " " + H + '" ' +
      'preserveAspectRatio="xMidYMax slice" fill="none" aria-hidden="true">' + inner + "</svg>";
  }
  function layer(depth, cls, body) {
    return '<g class="bgl-layer' + (cls ? " " + cls : "") + '" data-depth="' + depth + '">' + body + "</g>";
  }
  var p = function (d, cls) { return '<path' + (cls ? ' class="' + cls + '"' : "") + ' d="' + d + '"/>'; };
  var at = function (d, x, y, cls) {
    return '<path' + (cls ? ' class="' + cls + '"' : "") + ' d="' + d +
      '" transform="translate(' + x + " " + (y == null ? G : y) + ')"/>';
  };
  /* Redraw a path a few times with a wobble — a freehand ink hand. */
  function shaky(d, passes, amp, r) {
    var out = [];
    for (var i = 0; i < passes; i++) {
      out.push(d.replace(/(-?\d+\.?\d*)/g, function (m) {
        return (parseFloat(m) + (r() - 0.5) * amp).toFixed(1);
      }));
    }
    return out.join(" ");
  }
  return { W: W, H: H, G: G, rnd: rnd, iso: iso, isoBox: isoBox, svg: svg, layer: layer, p: p, at: at, shaky: shaky };
})();

var KG_BACKGROUNDS2 = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: "axono", name: "Aksonometriya",
    note: ["Madrasa 30° aksonometriyada — hajmli, lekin soyasiz sof chizma. Veb-saytlarda deyarli uchramaydi.",
           "Медресе в аксонометрии 30° — объём без теней, чистый чертёж. На сайтах почти не встречается.",
           "The madrasa in 30° axonometric — volume without shading, a pure drawing. Almost never seen on the web."],
    render: function () {
      var s = "", B = KGB2.isoBox;
      // courtyard ranges, the portal block, and the two dome drums
      s += KGB2.layer(1, "bgl-near",
        KGB2.p(B(560, 300, 210, 150, 120)) +                     // main portal block
        KGB2.p(B(320, 372, 240, 60, 52)) +                       // left range
        KGB2.p(B(770, 372, 240, 60, 52)) +                       // right range
        KGB2.p(B(560, 210, 210, 60, 46)));                       // rear range
      // domes sitting on the blocks, drawn as stacked ellipses
      var dome = function (cx, cy, r, h) {
        var d = "";
        for (var i = 0; i <= 6; i++) {
          var f = i / 6, rr = r * Math.cos(f * Math.PI / 2) * (1 - f * 0.1) + r * 0.06;
          d += "M" + (cx - rr).toFixed(1) + " " + (cy - h * f).toFixed(1) +
               "a" + rr.toFixed(1) + " " + (rr * 0.5).toFixed(1) + " 0 1 0 " + (2 * rr).toFixed(1) + " 0" +
               "a" + rr.toFixed(1) + " " + (rr * 0.5).toFixed(1) + " 0 1 0 " + (-2 * rr).toFixed(1) + " 0 ";
        }
        for (var k = 0; k < 10; k++) {                            // meridian ribs
          var a = (k / 10) * Math.PI * 2;
          d += "M" + (cx + Math.cos(a) * r).toFixed(1) + " " + (cy + Math.sin(a) * r * 0.5).toFixed(1) +
               "Q" + (cx + Math.cos(a) * r * 0.6).toFixed(1) + " " + (cy - h * 0.75).toFixed(1) +
               " " + cx + " " + (cy - h).toFixed(1) + " ";
        }
        return d;
      };
      s += KGB2.layer(1, "bgl-accent", KGB2.p(dome(430, 300, 74, 108)) + KGB2.p(dome(1015, 300, 74, 108)));
      s += KGB2.layer(0.4, "bgl-far", KGB2.p(B(1120, 330, 300, 90, 40)) + KGB2.p(B(180, 330, 200, 90, 40)));
      return KGB2.svg(s);
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: "section", name: "Kesim",
    note: ["Binoni o'rtasidan kesib ko'rsatish: ichki gumbaz, tashqi gumbaz va ular orasidagi bo'shliq.",
           "Разрез здания: внутренний купол, внешний купол и пустота между ними.",
           "The building cut open: the inner dome, the outer dome, and the void between them."],
    render: function () {
      var cx = 760, base = KGB2.G, drum = 150, r = 190, outer = 300, inner = 170;
      var d = [
        "M" + (cx - r) + " " + base + " V" + (base - drum),                 // walls
        "M" + (cx + r) + " " + base + " V" + (base - drum),
        "M" + (cx - r * 0.74) + " " + base + " V" + (base - drum),          // inner wall faces
        "M" + (cx + r * 0.74) + " " + base + " V" + (base - drum),
        // outer shell
        "M" + (cx - r) + " " + (base - drum) + "C" + (cx - r * 1.05) + " " + (base - drum - outer * 0.55) +
          " " + (cx - r * 0.45) + " " + (base - drum - outer * 0.95) + " " + cx + " " + (base - drum - outer) +
          "C" + (cx + r * 0.45) + " " + (base - drum - outer * 0.95) + " " + (cx + r * 1.05) + " " +
          (base - drum - outer * 0.55) + " " + (cx + r) + " " + (base - drum),
        // inner shell — the shallow dome you actually see from inside
        "M" + (cx - r * 0.74) + " " + (base - drum) + "C" + (cx - r * 0.74) + " " + (base - drum - inner * 0.8) +
          " " + (cx + r * 0.74) + " " + (base - drum - inner * 0.8) + " " + (cx + r * 0.74) + " " + (base - drum),
        "M" + cx + " " + (base - drum - outer) + "V" + (base - drum - outer - 46)   // finial
      ];
      // squinches: the corner arches that carry a round dome on a square room
      [-1, 1].forEach(function (sgn) {
        d.push("M" + (cx + sgn * r * 0.74) + " " + (base - drum * 0.42) +
               "A" + (r * 0.3) + " " + (r * 0.3) + " 0 0 " + (sgn > 0 ? 0 : 1) + " " +
               (cx + sgn * r * 0.34) + " " + (base - drum * 0.02));
      });
      // hatching on the cut masonry — what tells you it is a section
      var hatch = "";
      for (var i = 0; i < 26; i++) {
        var y = base - i * 12;
        hatch += "M" + (cx - r) + " " + y + "l" + (r * 0.26) + " " + (-r * 0.26) + " ";
        hatch += "M" + (cx + r * 0.74) + " " + y + "l" + (r * 0.26) + " " + (-r * 0.26) + " ";
      }
      return KGB2.svg(
        KGB2.layer(1, "bgl-near", KGB2.p(d.join(" "))) +
        KGB2.layer(0.9, "bgl-hatch", KGB2.p(hatch)) +
        KGB2.layer(0.35, "bgl-far", KGB2.at(kgMinaret(14, 300), 300) + KGB2.at(kgMinaret(14, 300), 1230) +
          KGB2.p("M0 " + KGB2.G + " H" + KGB2.W)));
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: "exploded", name: "Portlagan ko'rinish",
    note: ["Binoning qismlari ajratilgan: gumbaz, baraban, ravoq, poydevor — orasida bog'lovchi chiziqlar.",
           "Части здания разнесены: купол, барабан, арка, основание — со связующими линиями.",
           "The parts pulled apart: dome, drum, arch, base — with leader lines between them."],
    render: function () {
      var cx = 800, s = "";
      var parts = [
        { d: kgDome(120, 120, 9), y: 130 },                       // dome, lifted high
        { d: "M-120 0 H120 M-120 0 V-70 M120 0 V-70 M-120 -70 H120", y: 250 },   // drum
        { d: kgPortal(300, 150), y: 380 },                        // arch storey
        { d: "M-190 0 H190 M-190 0 V-40 M190 0 V-40 M-190 -40 H190", y: 470 }    // plinth
      ];
      parts.forEach(function (pt) { s += KGB2.at(pt.d, cx, pt.y); });
      // dashed assembly axis + leader lines
      var lead = "M" + cx + " 90 V480 ";
      [130, 250, 380, 470].forEach(function (y) { lead += "M" + (cx - 260) + " " + y + " H" + (cx + 260) + " "; });
      return KGB2.svg(
        KGB2.layer(0.5, "bgl-guide", KGB2.p(lead)) +
        KGB2.layer(1, "bgl-near", s) +
        KGB2.layer(0.3, "bgl-far", KGB2.at(kgArcade(420, 90, 5), 260) + KGB2.at(kgArcade(420, 90, 5), 1340)));
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: "wire", name: "Simli gumbaz",
    note: ["Haqiqiy uch o'lchamli sim gumbaz — parallel va meridian chiziqlari, sekin aylanadi.",
           "Настоящий трёхмерный каркас купола — параллели и меридианы, медленно вращается.",
           "A true three-dimensional wire dome — parallels and meridians, turning slowly."],
    render: function () {
      var cx = 1120, cy = 250, R = 230, d = "";
      for (var i = 1; i <= 7; i++) {                              // parallels (ellipses)
        var f = i / 8, rr = R * Math.cos(f * Math.PI / 2 - Math.PI / 2) * 0 + R * Math.sin(f * Math.PI / 2);
        var yy = cy + R * 0.55 - R * 0.55 * Math.cos(f * Math.PI / 2) * 0 - R * f * 0.55;
        d += "M" + (cx - rr).toFixed(1) + " " + yy.toFixed(1) +
             "a" + rr.toFixed(1) + " " + (rr * 0.34).toFixed(1) + " 0 1 0 " + (2 * rr).toFixed(1) + " 0" +
             "a" + rr.toFixed(1) + " " + (rr * 0.34).toFixed(1) + " 0 1 0 " + (-2 * rr).toFixed(1) + " 0 ";
      }
      for (var k = 0; k < 18; k++) {                              // meridians
        var a = (k / 18) * Math.PI * 2, ex = Math.cos(a) * R, ez = Math.sin(a) * R * 0.34;
        d += "M" + (cx + ex).toFixed(1) + " " + (cy + R * 0.55 + ez).toFixed(1) +
             "Q" + (cx + ex * 0.62).toFixed(1) + " " + (cy - R * 0.42 + ez * 0.5).toFixed(1) +
             " " + cx + " " + (cy - R * 0.55).toFixed(1) + " ";
      }
      return KGB2.svg('<g class="bgl-spin3d">' + KGB2.p(d) + "</g>" +
        KGB2.layer(0.35, "bgl-far",
          KGB2.at(kgArcade(560, 100, 6), 420) + KGB2.at(kgMinaret(14, 280), 160) +
          KGB2.p("M0 " + KGB2.G + " H" + KGB2.W)));
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: "mirror", name: "Suvdagi aks",
    note: ["Registon hovuzidagidek: bino tepada, ostida esa to'lqinlangan aksi.",
           "Как в бассейне Регистана: здание сверху, под ним — дрожащее отражение.",
           "As in the Registan pool: the building above, its rippling reflection below."],
    render: function () {
      var top = 300;
      var band = KGB2.at(kgPortal(280, 250, { band: 1 }), 800, top) +
                 KGB2.at(kgDome(90, 180, 9), 500, top) + KGB2.at(kgDome(90, 180, 9), 1100, top) +
                 KGB2.at(kgMinaret(14, 260), 300, top) + KGB2.at(kgMinaret(14, 260), 1300, top);
      var ripple = "";
      for (var i = 0; i < 11; i++) {                              // the water surface
        var y = top + 14 + i * 15, amp = 3 + i * 0.7, dd = "M0 " + y;
        for (var x = 0; x <= KGB2.W; x += 110) dd += " q55 " + amp + " 110 0";
        ripple += dd + " ";
      }
      return KGB2.svg(
        KGB2.layer(1, "bgl-near", band + KGB2.p("M0 " + top + " H" + KGB2.W)) +
        '<g class="bgl-reflect" transform="translate(0 ' + (2 * top) + ') scale(1 -1)">' +
          KGB2.layer(0.6, "bgl-mirror", band) + "</g>" +
        KGB2.layer(0.25, "bgl-accent", KGB2.p(ripple)));
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: "survey", name: "Geodeziya",
    note: ["Yodgorlik o'lchov nuqtalari sifatida — nuqtalar va ular orasidagi chiziqlar, xuddi skanerdek.",
           "Памятник как облако точек обмера — точки и связи между ними, как после скана.",
           "The monument as a survey point cloud — measured points and the lines between them."],
    render: function () {
      var r = KGB2.rnd(11), pts = [], lines = "", dots = "";
      // sample the outline of a portal + two domes as measured points
      function sample(cx, w, h, n, arch) {
        for (var i = 0; i < n; i++) {
          var t = i / (n - 1), x, y;
          if (arch) { var a = Math.PI * t; x = cx + Math.cos(a) * w; y = KGB2.G - Math.sin(a) * h; }
          else { x = cx - w + 2 * w * t; y = KGB2.G - (t < 0.5 ? h * (t * 2) : h * (2 - t * 2)); }
          pts.push([x, y]);
        }
      }
      sample(800, 150, 300, 22, true);
      sample(430, 95, 200, 16, true);
      sample(1170, 95, 200, 16, true);
      for (var i = 0; i < 26; i++) pts.push([120 + r() * 1360, 120 + r() * 320]);   // control points
      pts.forEach(function (a, i) {
        dots += "M" + (a[0] - 3).toFixed(1) + " " + a[1].toFixed(1) + "a3 3 0 1 0 6 0a3 3 0 1 0 -6 0 ";
        pts.forEach(function (b, j) {
          if (j <= i) return;
          var dx = a[0] - b[0], dy = a[1] - b[1];
          if (dx * dx + dy * dy < 12000) {
            lines += "M" + a[0].toFixed(1) + " " + a[1].toFixed(1) + "L" + b[0].toFixed(1) + " " + b[1].toFixed(1) + " ";
          }
        });
      });
      return KGB2.svg(
        KGB2.layer(0.7, "bgl-web", KGB2.p(lines)) +
        KGB2.layer(1, "bgl-dots", KGB2.p(dots)) +
        KGB2.layer(0.25, "bgl-far", KGB2.p("M0 " + KGB2.G + " H" + KGB2.W)));
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: "strata", name: "Qatlamlar",
    note: ["Bino gorizontal qatlamlarga bo'lingan — lazerda kesilgan maketdek. Yog'och qavatlar taassuroti.",
           "Здание разрезано на горизонтальные слои — как макет из лазерной резки.",
           "The building sliced into horizontal layers — like a laser-cut model in stacked board."],
    render: function () {
      var s = "", cx = 800, steps = 34;
      for (var i = 0; i < steps; i++) {
        var f = i / steps, y = KGB2.G - f * 380;
        // width follows the silhouette: straight body, then the dome curve
        var w = f < 0.42 ? 210 : 210 * Math.cos(((f - 0.42) / 0.58) * Math.PI / 2) * 0.98 + 6;
        s += KGB2.p("M" + (cx - w).toFixed(1) + " " + y.toFixed(1) + " H" + (cx + w).toFixed(1));
        var w2 = f < 0.5 ? 78 : 78 * Math.cos(((f - 0.5) / 0.5) * Math.PI / 2) + 3;      // side domes
        if (f < 1) {
          s += KGB2.p("M" + (400 - w2).toFixed(1) + " " + y.toFixed(1) + " H" + (400 + w2).toFixed(1));
          s += KGB2.p("M" + (1200 - w2).toFixed(1) + " " + y.toFixed(1) + " H" + (1200 + w2).toFixed(1));
        }
      }
      return KGB2.svg(KGB2.layer(1, "bgl-near", s) +
        KGB2.layer(0.3, "bgl-far", KGB2.p("M0 " + KGB2.G + " H" + KGB2.W)));
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: "crop", name: "Ulkan gumbaz",
    note: ["Bitta gumbaz shu qadar kattaki, ramkaga sig'maydi. Eng jasur va eng oddiy qaror.",
           "Один купол настолько велик, что не помещается в кадр. Самое смелое и простое решение.",
           "One dome so large it does not fit the frame. The boldest and simplest decision."],
    render: function () {
      return KGB2.svg(
        KGB2.layer(1, "bgl-near", KGB2.at(kgDome(560, 900, 16), 1240, KGB2.G + 240)) +
        KGB2.layer(0.45, "bgl-far", KGB2.at(kgMinaret(20, 420), 250) +
          KGB2.at(kgArcade(500, 110, 6), 620) + KGB2.p("M0 " + KGB2.G + " H" + KGB2.W)));
    }
  },

  /* ---------------------------------------------------------------- 9 */
  {
    id: "court", name: "Hovli ichi",
    note: ["Registon maydonining ichida turgandek — ikki tomon devori bir nuqtaga qarab toraya boradi.",
           "Как будто стоишь внутри Регистана — стены сходятся в одну точку.",
           "As if standing inside the Registan — the ranges converge on a single vanishing point."],
    render: function () {
      var vx = 800, vy = 250, s = "";
      for (var side = -1; side <= 1; side += 2) {
        for (var i = 0; i < 8; i++) {
          var f = Math.pow(i / 8, 1.5);
          var x = vx + side * (120 + f * 900), yTop = vy - (30 + f * 190), yBot = KGB2.G - f * -40;
          s += KGB2.p("M" + x.toFixed(1) + " " + yBot.toFixed(1) + " V" + yTop.toFixed(1));   // bay divisions
          if (i < 7) {
            var f2 = Math.pow((i + 1) / 8, 1.5);
            var x2 = vx + side * (120 + f2 * 900), yTop2 = vy - (30 + f2 * 190);
            var mid = (x + x2) / 2, arcTop = (yTop + yTop2) / 2 + 34;
            s += KGB2.p("M" + x.toFixed(1) + " " + (yTop + 60).toFixed(1) +
                        "Q" + mid.toFixed(1) + " " + arcTop.toFixed(1) + " " + x2.toFixed(1) + " " + (yTop2 + 60).toFixed(1));
          }
        }
        s += KGB2.p("M" + (vx + side * 120) + " " + (vy - 30) + "L" + (vx + side * 1020) + " " + (vy - 220));
        s += KGB2.p("M" + (vx + side * 120) + " " + KGB2.G + "L" + (vx + side * 1020) + " " + (KGB2.G + 40));
      }
      // the far range closing the courtyard
      s += KGB2.at(kgPortal(210, 190, { band: 1 }), vx, vy + 190);
      return KGB2.svg(KGB2.layer(1, "bgl-near", s));
    }
  },

  /* --------------------------------------------------------------- 10 */
  {
    id: "ink", name: "Qo'lyozma",
    note: ["Me'morning qo'lda chizgan eskizidek — har chiziq bir necha marta, biroz qaltiragan.",
           "Как от руки нарисованный эскиз архитектора — каждая линия по нескольку раз, с дрожью.",
           "An architect's freehand sketch — every line drawn several times, with a tremble."],
    render: function () {
      var r = KGB2.rnd(31);
      var pack = function (d, x, y) {
        return '<path d="' + KGB2.shaky(d, 3, 3.2, r) + '" transform="translate(' + x + " " + (y || KGB2.G) + ')"/>';
      };
      return KGB2.svg(
        KGB2.layer(1, "bgl-ink",
          pack(kgPortal(300, 320, { band: 1 }), 800) +
          pack(kgDome(100, 220, 8), 450) + pack(kgDome(100, 220, 8), 1150) +
          pack(kgMinaret(16, 330), 210) + pack(kgMinaret(16, 330), 1390) +
          '<path d="' + KGB2.shaky("M60 " + KGB2.G + " H1540", 3, 4, r) + '"/>') +
        KGB2.layer(0.35, "bgl-far", KGB2.at(kgArcade(360, 80, 5), 620) + KGB2.at(kgArcade(360, 80, 5), 980)));
    }
  }
];
