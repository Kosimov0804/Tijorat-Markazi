/* ============================================================
   TIJORAT MARKAZI — the home page's two live sections

   A preview of the associations and a preview of the showroom, both
   read from the same public endpoints those pages use, so the home
   page shows what is actually on the platform rather than a fixed
   marketing list that drifts out of date.

   Each section removes itself if its endpoint returns nothing — an
   empty grid under a heading looks broken, whereas a missing section
   just reads as a shorter page.
   ============================================================ */
(function () {
  var HT = {
    as_eyebrow: ["Platforma a'zolari", "Участники платформы", "Platform members"],
    as_h:       ["Uyushmalar <span class=\"grad\">katalogi</span>",
                 "Каталог <span class=\"grad\">ассоциаций</span>",
                 "The <span class=\"grad\">associations</span> catalogue"],
    as_p:       ["Har bir uyushmaning o'z sahifasi va a'zo kompaniyalari bor.",
                 "У каждой ассоциации своя страница и компании-члены.",
                 "Each association has its own page and member companies."],
    as_all:     ["Barcha uyushmalar →", "Все ассоциации →", "All associations →"],
    as_chair:   ["Rais", "Председатель", "Chairman"],
    as_comp:    ["kompaniya", "компаний", "companies"],

    sh_eyebrow: ["Showroom", "Витрина", "Showroom"],
    sh_h:       ["Kompaniyalar <span class=\"grad\">mahsulotlari</span>",
                 "Продукция <span class=\"grad\">компаний</span>",
                 "Company <span class=\"grad\">products</span>"],
    sh_p:       ["A'zo kompaniyalar taqdim etgan mahsulot va xizmatlar.",
                 "Товары и услуги, представленные компаниями-участниками.",
                 "Products and services offered by member companies."],
    sh_all:     ["Butun showroom →", "Весь showroom →", "The whole showroom →"]
  };
  var li = function () {
    var i = LANGS.indexOf(localStorage.getItem("kg_lang") || "uz");
    return i < 0 ? 0 : i;
  };
  var t = function (k) { return HT[k][li()]; };
  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };

  /* Section shell — same .section-head the rest of the site uses, so it
     picks up the ayvan mark and rules without any new styling. */
  function shell(id, eyebrow, h, p, gridClass, gridId, allHref, allText) {
    return '<section class="section" id="' + id + '"><div class="container">' +
      '<div class="section-head">' +
        '<span class="eyebrow">' + esc(eyebrow) + "</span>" +
        "<h2>" + h + "</h2>" +
        "<p>" + esc(p) + "</p>" +
      "</div>" +
      '<div class="' + gridClass + '" id="' + gridId + '"></div>' +
      '<div class="home-more"><a class="btn btn-ghost btn-lg" href="' + allHref + '">' +
        esc(allText) + "</a></div>" +
    "</div></section>";
  }

  function renderAssociations(host) {
    return fetch("/api/assoc/list")
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) {
        if (!Array.isArray(list) || !list.length) return false;
        // busiest first — a preview should lead with the ones that have members
        var top = list.slice().sort(function (a, b) {
          return (b.companies || 0) - (a.companies || 0);
        }).slice(0, 6);

        host.insertAdjacentHTML("beforeend",
          shell("home-assoc", t("as_eyebrow"), t("as_h"), t("as_p"),
                "dir-grid", "homeAssocGrid", "associations.html", t("as_all")));

        document.getElementById("homeAssocGrid").innerHTML = top.map(function (a) {
          var name = String(a.name || "").replace(/^[-\s]+/, "");
          return '<a class="dir-card" href="association.html?id=' + encodeURIComponent(a.id) + '">' +
            '<span class="dir-mark">' + esc(name.charAt(0).toUpperCase()) + "</span>" +
            '<span class="dir-body"><b>' + esc(name) + "</b>" +
              (a.chairman ? "<em>" + esc(t("as_chair")) + ": " + esc(a.chairman) + "</em>" : "<em>&nbsp;</em>") +
              '<span class="dir-count">' + (a.companies || 0) + " " + esc(t("as_comp")) + "</span>" +
            "</span></a>";
        }).join("");
        return true;
      })
      .catch(function () { return false; });
  }

  function renderShowroom(host) {
    return fetch("/api/showroom")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var items = d && Array.isArray(d.items) ? d.items : [];
        if (!items.length) return false;
        // lead with the ones that have a photo — a preview grid of
        // placeholders sells nothing
        var top = items.slice().sort(function (a, b) {
          return (b.img ? 1 : 0) - (a.img ? 1 : 0);
        }).slice(0, 6);

        host.insertAdjacentHTML("beforeend",
          shell("home-show", t("sh_eyebrow"), t("sh_h"), t("sh_p"),
                "show-grid", "homeShowGrid", "showroom.html", t("sh_all")));

        document.getElementById("homeShowGrid").innerHTML = top.map(function (it) {
          return '<div class="show-card">' +
            (it.img ? '<img class="show-img" src="' + esc(it.img) + '" alt="" loading="lazy">'
                    : '<div class="show-img show-img-ph">🛍️</div>') +
            '<div class="show-body"><b>' + esc(it.name) + "</b>" +
              (it.price ? '<span class="show-price">' + esc(it.price) + "</span>" : "") +
              (it.desc ? "<p>" + esc(it.desc) + "</p>" : "") +
              '<span class="show-org">' + esc(it.company) +
                (it.sector ? " · " + esc(it.sector) : "") + "</span>" +
            "</div></div>";
        }).join("");
        return true;
      })
      .catch(function () { return false; });
  }

  function boot() {
    var host = document.getElementById("homeSections");
    if (!host) return;                       // not the home page
    // Associations first: who is on the platform, then what they sell.
    renderAssociations(host).then(function () { return renderShowroom(host); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
