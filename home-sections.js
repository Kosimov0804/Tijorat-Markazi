/* ============================================================
   TIJORAT MARKAZI — the home page's live parts

   Everything on the home page that depends on what is actually on the
   platform is rendered here from the same public endpoints the full
   pages use, so the page shows the real platform rather than a fixed
   marketing list that drifts out of date:

     · the figures in the structure band (companies, associations),
     · the hero's member wall: associations and companies as still cards,
     · an associations preview and a showroom preview, each with a
       flush-left head and a "view all" link.

   Each live part removes itself when its data is empty — an empty grid
   under a heading looks broken, whereas a missing section just reads as
   a shorter page, and a hero with no members simply centres its copy.

   The two previews are rebuilt from the cached responses when the
   language changes (app.js sets <html lang>), so every label and the
   localised association names follow the switch. The small i18n extras
   app.js does not know about live here too: [data-i18n-list] fills a
   <ul> from a "|"-separated string and [data-i18n-aria] sets aria-label.
   ============================================================ */
(function () {
  var WALL = 8;             // cards in the hero wall: two columns of four
  var WALL_PHONE = 6;
  var MIN_WALL = 2;         // fewer members than this and the wall is a gap
  var PREVIEW = 6;

  var cache = { assoc: null, show: null, dir: null };

  var li = function () {
    var i = LANGS.indexOf(localStorage.getItem("kg_lang") || "uz");
    return i < 0 ? 0 : i;
  };
  var t = function (k) { return (typeof T !== "undefined" && T[k]) ? T[k][li()] : k; };
  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };

  /* ── i18n extras ─────────────────────────────────────────── */
  function applyExtras() {
    document.querySelectorAll("[data-i18n-list]").forEach(function (ul) {
      var k = ul.getAttribute("data-i18n-list");
      if (!(typeof T !== "undefined" && T[k])) return;
      ul.innerHTML = T[k][li()].split("|").map(function (s) {
        return "<li>" + esc(s.trim()) + "</li>";
      }).join("");
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-aria");
      if (typeof T !== "undefined" && T[k]) el.setAttribute("aria-label", T[k][li()]);
    });
  }
  function onLangChange() {
    applyExtras();
    renderWall();
    renderSections();
  }
  function watchLang() {
    if (!window.MutationObserver) return;
    new MutationObserver(onLangChange).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }

  /* ── the idea dialog ─────────────────────────────────────── */
  function wireIdea() {
    var btn = document.getElementById("hmIdeaBtn");
    var dlg = document.getElementById("hmIdea");
    var x = document.getElementById("hmIdeaClose");
    if (!btn || !dlg) return;
    if (typeof dlg.showModal !== "function") { btn.hidden = true; return; }
    btn.addEventListener("click", function () { dlg.showModal(); });
    if (x) x.addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) {   // click on the backdrop closes
      if (e.target === dlg) dlg.close();
    });
  }

  /* ── the live figures ────────────────────────────────────── */
  /* Real counts only: a muted dash while the platform is empty or the
     endpoint is unreachable, never a stand-in number. The figure
     animates in once it is known. */
  function setCount(id, n) {
    var el = document.getElementById(id);
    if (!el) return;
    if (!(n > 0)) { el.textContent = "—"; el.style.opacity = "0.45"; return; }
    el.style.opacity = "";
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = String(n); return;
    }
    var start = null, dur = 900;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      el.textContent = String(Math.round(n * p));
      if (p < 1) requestAnimationFrame(tick); else el.textContent = String(n);
    }
    requestAnimationFrame(tick);
  }

  /* ── the hero member wall ────────────────────────────────── */
  /* Associations first (busiest first), then companies, until the wall
     is full; when one side is short the other fills the remaining
     cards. Still by design. Rebuilt on a language switch for the
     localised names, and on resize for the phone card count. */
  function localName(row) {
    var name = String(row.name || "").replace(/^[-\s]+/, "");
    var lang = LANGS[li()];
    return row.i18n && row.i18n[lang] ? row.i18n[lang] : name;
  }
  function wallCard(row, kind) {
    var name = localName(row);
    var href = kind === "assoc"
      ? "association.html?id=" + encodeURIComponent(row.id)
      : "korxona.html?id=" + encodeURIComponent(row.bizId);
    var meta = kind === "assoc"
      ? t("hm_wall_n_comp").replace("{n}", String(Number(row.companies) || 0))
      : (row.sector || t("hm_wall_company"));
    return '<a class="hm-wcard ' + kind + '" href="' + href + '">' +
      '<span class="hm-wmark" aria-hidden="true">' + esc(name.charAt(0).toUpperCase()) + "</span>" +
      '<span class="hm-wbody"><b>' + esc(name) + "</b><span>" + esc(meta) + "</span></span>" +
      '<span class="hm-wkind">' + esc(t(kind === "assoc" ? "hm_wall_assoc" : "hm_wall_company")) + "</span>" +
    "</a>";
  }
  function renderWall() {
    var hero = document.getElementById("hmHero");
    var host = document.getElementById("hmWall");
    var count = document.getElementById("hmWallCount");
    if (!hero || !host) return;
    var assoc = (cache.assoc || []).slice().sort(function (a, b) {
      return (b.companies || 0) - (a.companies || 0);
    });
    var comps = (cache.dir || []).filter(function (r) { return r.kind === "company" && r.bizId; });
    if (assoc.length + comps.length < MIN_WALL) { hero.classList.add("no-wall"); return; }
    hero.classList.remove("no-wall");

    var total = window.innerWidth <= 560 ? WALL_PHONE : WALL;
    var nA = Math.min(assoc.length, Math.max(Math.ceil(total / 2), total - comps.length));
    var nC = Math.min(comps.length, total - nA);
    host.innerHTML = assoc.slice(0, nA).map(function (a) { return wallCard(a, "assoc"); })
      .concat(comps.slice(0, nC).map(function (c) { return wallCard(c, "company"); })).join("");
    if (count) {
      count.textContent = t("hm_wall_n_assoc").replace("{n}", String(assoc.length)) + " · " +
                          t("hm_wall_n_comp").replace("{n}", String(comps.length));
    }
  }

  /* ── the two previews ────────────────────────────────────── */
  function shell(id, h, p, allHref, allText) {
    return '<section class="hm-section" id="' + id + '"><div class="container hm-container">' +
      '<div class="hm-head"><div class="hm-head-copy">' +
        "<h2>" + esc(h) + "</h2><p>" + esc(p) + "</p>" +
      "</div>" +
      '<a class="hm-head-link" href="' + allHref + '">' + esc(allText) + "</a></div>" +
      '<div class="hm-grid" id="' + id + 'Grid"></div>' +
    "</div></section>";
  }

  function assocCard(a) {
    var name = String(a.name || "").replace(/^[-\s]+/, "");
    var local = a.i18n && a.i18n[LANGS[li()]] ? a.i18n[LANGS[li()]] : name;
    return '<a class="hm-card" href="association.html?id=' + encodeURIComponent(a.id) + '">' +
      '<div class="hm-card-media assoc"><span class="hm-mark">' + esc(name.charAt(0).toUpperCase()) + "</span></div>" +
      '<div class="hm-card-body">' +
        '<div class="meta"><span class="hm-count">' + esc(Number(a.companies) || 0) + " " + esc(t("hm_as_comp")) + "</span></div>" +
        "<h3>" + esc(local) + "</h3>" +
        (a.chairman ? "<p>" + esc(t("hm_as_chair")) + ": " + esc(a.chairman) + "</p>" : "") +
        '<span class="hm-more">' + esc(t("hm_as_open")) + "</span>" +
      "</div></a>";
  }

  function showCard(it) {
    return '<a class="hm-card" href="mahsulot.html?id=' + encodeURIComponent(it.id) + '">' +
      (it.img ? '<div class="hm-card-media"><img src="' + esc(it.img) + '" alt="" loading="lazy"></div>'
              : '<div class="hm-card-media ph">🛍️</div>') +
      '<div class="hm-card-body">' +
        '<div class="meta"><b>' + esc(it.company) + "</b>" +
          (it.sector ? '<span aria-hidden="true">•</span><span>' + esc(it.sector) + "</span>" : "") + "</div>" +
        "<h3>" + esc(it.name) + "</h3>" +
        (it.desc ? "<p>" + esc(it.desc) + "</p>" : "") +
        (it.price ? '<span class="price">' + esc(it.price) + "</span>" : "") +
        '<span class="hm-more">' + esc(t("hm_sh_open")) + "</span>" +
      "</div></a>";
  }

  /* Builds both previews from the cache, in order: who is on the
     platform, then what they sell. Idempotent, so a language switch
     simply calls it again. */
  function renderSections() {
    var host = document.getElementById("homeSections");
    if (!host) return;
    var html = "";
    var assoc = cache.assoc || [];
    var items = cache.show || [];
    if (assoc.length) {
      html += shell("homeAssoc", t("hm_as_h"), t("hm_as_p"), "associations.html", t("hm_view_all"));
    }
    if (items.length) {
      html += shell("homeShow", t("hm_sh_h"), t("hm_sh_p"), "showroom.html", t("hm_view_all"));
    }
    host.innerHTML = html;
    if (assoc.length) {
      // busiest first — a preview should lead with the ones that have members
      var topA = assoc.slice().sort(function (a, b) {
        return (b.companies || 0) - (a.companies || 0);
      }).slice(0, PREVIEW);
      document.getElementById("homeAssocGrid").innerHTML = topA.map(assocCard).join("");
    }
    if (items.length) {
      // lead with the ones that have a photo — a preview grid of
      // placeholders sells nothing
      var topS = items.slice().sort(function (a, b) {
        return (b.img ? 1 : 0) - (a.img ? 1 : 0);
      }).slice(0, PREVIEW);
      document.getElementById("homeShowGrid").innerHTML = topS.map(showCard).join("");
    }
  }

  function loadAssociations() {
    return fetch("/api/assoc/list")
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) {
        cache.assoc = Array.isArray(list) ? list : [];
        setCount("heroAssoc", cache.assoc.length);
      })
      .catch(function () { cache.assoc = []; });
  }

  function loadShowroom() {
    return fetch("/api/showroom")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        cache.show = d && Array.isArray(d.items) ? d.items : [];
        setCount("heroCompanies", d && Array.isArray(d.companies) ? d.companies.length : 0);
      })
      .catch(function () { cache.show = []; });
  }

  /* The Business ID directory: every association and company with its
     number, which is also the public company page's key. */
  function loadDirectory() {
    return fetch("/api/business-id/directory")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { cache.dir = d && Array.isArray(d.items) ? d.items : []; })
      .catch(function () { cache.dir = []; });
  }

  function boot() {
    applyExtras();
    watchLang();
    wireIdea();
    if (!document.getElementById("homeSections")) return;   // not the home page
    Promise.all([loadAssociations(), loadShowroom(), loadDirectory()]).then(function () {
      renderWall();
      renderSections();
    });
    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderWall, 150);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
