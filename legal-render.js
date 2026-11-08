/* ============================================================
   LEGAL DOC RENDERER — one implementation, three surfaces

   The same legal text is now shown in three places: the document
   pages (oferta.html and friends), the acceptance gate that opens
   before registration, and the "re-read the offer" button in every
   cabinet's settings. Rendering it three times would guarantee the
   day a section is added it appears in one of them and not the
   others — which for an offer is not a cosmetic problem, because
   what a person was shown when they accepted is the whole question.

   So the renderer lives here and takes everything as arguments:

     LegalDoc.render(key, cfg, lang) -> { title, stamp, html }

   `key`  — "oferta" | "maxfiylik" | "shartlar"
   `cfg`  — the /api/legal payload (requisites, versions, tables)
   `lang` — "uz" | "ru" | "en"

   Dependency-free for the same reason legal-footer.js is: it has to
   run on pages that do not load market-kit.js.

   SLOTS are the places where the document stops describing and
   starts showing what the system actually holds — the requisites
   block, the data-categories table, retention, transfers. They read
   from cfg, so a document can never describe a field the platform
   does not collect.
   ============================================================ */
(function (global) {
  "use strict";

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  var escA = function (s) { return esc(s).replace(/"/g, "&quot;"); };

  /* Cross-links resolve against this fixed map rather than a path from the
     config. The config is ours, but an href assembled from data is one
     refactor away from being an href assembled from user data. */
  var PAGES = {
    oferta: "oferta.html", maxfiylik: "maxfiylik.html",
    shartlar: "shartlar.html", rights: "mening-malumotlarim.html"
  };
  /* The rights page is not a versioned document, so it has no DOCS entry to
     take a title from. It gets one here. */
  var EXTRA_TITLE = { rights: { uz: "Mening maʼlumotlarim", ru: "Мои данные", en: "My data" } };

  var PLACEHOLDER = /^\[(TO'LDIRILSIN|ZAPOLNIT|TO BE COMPLETED)/;

  /* The document files declare `const LEGAL_OFERTA = …` at the top level of a
     classic script. Top-level const/let create a lexical binding in global
     SCOPE, not a property on window — so `global.LEGAL_OFERTA` is undefined
     however correct it looks. These have to be read as bare identifiers,
     which resolve through the scope chain. */
  function texts(key) {
    if (key === "oferta")    return typeof LEGAL_OFERTA    !== "undefined" ? LEGAL_OFERTA    : null;
    if (key === "maxfiylik") return typeof LEGAL_MAXFIYLIK !== "undefined" ? LEGAL_MAXFIYLIK : null;
    if (key === "shartlar")  return typeof LEGAL_SHARTLAR  !== "undefined" ? LEGAL_SHARTLAR  : null;
    return null;
  }

  function render(key, cfg, lang) {
    var doc = texts(key);
    /* `ok:false` lets callers tell "nothing to show" apart from "an empty
       document". The acceptance gate must never treat the first as the second. */
    if (!doc) return { ok: false, title: "", stamp: "", html: "" };

    /* uz and ru are operative; en shows the Uzbek text behind a notice rather
       than an unreviewed translation, because a translation that disagreed
       with the operative text would create the ambiguity the translation
       clause exists to prevent. */
    var l = lang === "ru" ? "ru" : "uz";
    var isFallback = lang === "en";
    var pick = function (o) { return (o && (o[l] || o.uz)) || ""; };
    var meta = (cfg && cfg.docs && cfg.docs[key]) || {};

    /* ---------- token substitution ----------
       An unknown token is left visible rather than blanked: a stray brace is
       a bug someone should see, not something to hide from the reader. */
    function fill(s) {
      if (!s) return "";
      if (!cfg) return s;
      var o = cfg.operator || {};
      var deep = function (v) { return (v && typeof v === "object") ? (v[l] || v.uz || "") : (v || ""); };
      var map = {
        brand: o.brand || "",
        operator: deep(o.legalName),
        legalForm: deep(o.legalForm),
        stir: o.stir || "",
        address: deep(o.address),
        email: o.email || "",
        phone: o.phone || "",
        dpoName: o.dpoName || "",
        dpoEmail: o.dpoEmail || "",
        days: cfg.responseDays == null ? "10" : String(cfg.responseDays),
        version: meta.version || "",
        effective: meta.effective || ""
      };
      return s.replace(/\{(\w+)\}/g, function (m, k) {
        return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : m;
      });
    }

    var par = function (o) { return "<p>" + esc(fill(pick(o))) + "</p>"; };

    /** A requisite value, or a visible warning where one is still unfilled. */
    function cell(v) {
      var s = String(v == null ? "" : v);
      if (!s) return '<span class="lg-todo">' + esc(pick({ uz: "körsatilmagan", ru: "не указано" })) + "</span>";
      if (PLACEHOLDER.test(s)) return '<span class="lg-todo">' + esc(s) + "</span>";
      return esc(s);
    }

    function kv(rows) {
      return '<dl class="lg-kv">' + rows.map(function (r) {
        return "<dt>" + esc(pick(r[0])) + "</dt><dd>" + cell(r[1]) + "</dd>";
      }).join("") + "</dl>";
    }

    function table(head, bodyRows) {
      return '<div class="lg-tablewrap"><table class="lg-table"><thead><tr>'
        + head.map(function (h) { return "<th>" + esc(h) + "</th>"; }).join("")
        + "</tr></thead><tbody>"
        + bodyRows.map(function (cells) {
            return "<tr>" + cells.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>";
          }).join("")
        + "</tbody></table></div>";
    }

    var deep = function (v) { return (v && typeof v === "object") ? (v[l] || v.uz || "") : (v || ""); };

    var SLOTS = {
      /* Placeholders render as a visible warning rather than as text, so
         nobody mistakes an unfilled field for a real registration number. */
      operator: function () {
        var o = (cfg && cfg.operator) || {};
        var rows = [
          [{ uz: "Töliq nomi", ru: "Полное наименование" }, deep(o.legalName)],
          [{ uz: "Taşkiliy-huquqiy şakli", ru: "Организационно-правовая форма" }, deep(o.legalForm)],
          [{ uz: "STIR", ru: "ИНН" }, o.stir],
          [{ uz: "Davlat röyxatidan ötkazilganligi", ru: "Государственная регистрация" },
            [deep(o.regNumber), deep(o.regDate)].filter(Boolean).join(" · ")],
          [{ uz: "Joylaşgan joyi (poçta manzili)", ru: "Местонахождение (почтовый адрес)" }, deep(o.address)],
          [{ uz: "Elektron poçta", ru: "Электронная почта" }, o.email],
          [{ uz: "Telefon", ru: "Телефон" }, o.phone]
        ];
        if (deep(o.licence)) rows.push([{ uz: "Litsenziya", ru: "Лицензия" }, deep(o.licence)]);
        return kv(rows);
      },

      /* The categories table — the substance of modda 22. */
      collected: function () {
        var head = pick({ uz: ["Maʼlumot toifasi", "Qayta işlaş maqsadi"],
                          ru: ["Категория данных", "Цель обработки"] });
        return table(head, ((cfg && cfg.collected) || []).map(function (c) {
          return [c[l] || c.uz || "", (c.purpose && (c.purpose[l] || c.purpose.uz)) || ""];
        }));
      },

      retention: function () {
        var head = pick({ uz: ["Maʼlumot turi", "Saqlaş muddati"],
                          ru: ["Вид данных", "Срок хранения"] });
        var label = {
          account: { uz: "Hisob qaydnomasi", ru: "Учётная запись" },
          application: { uz: "Röyxatdan ötiş arizasi", ru: "Заявка на регистрацию" },
          consent: { uz: "Rozilik yozuvi", ru: "Запись о согласии" },
          transaction: { uz: "Bitim hujjatlari", ru: "Документы сделки" }
        };
        var R = (cfg && cfg.retention) || {};
        return table(head, Object.keys(R).map(function (k) {
          return [pick(label[k]) || k, R[k][l] || R[k].uz || ""];
        }));
      },

      transfers: function () {
        var list = (cfg && cfg.transfers) || [];
        if (!list.length) return "<p>" + esc(pick({
          uz: "Hozirça şaxsga doir maʼlumotlar Özbekiston Respublikasidan taşqariga uzatilmaydi.",
          ru: "В настоящее время персональные данные за пределы Республики Узбекистан не передаются."
        })) + "</p>";
        var head = pick({ uz: ["Qabul qiluvçi", "Xizmat", "Nima uzatiladi va qanday asosda"],
                          ru: ["Получатель", "Услуга", "Что передаётся и на каком основании"] });
        return table(head, list.map(function (t) {
          return [t.to, t.service, t[l] || t.uz || ""];
        }));
      },

      dpo: function () {
        var o = (cfg && cfg.operator) || {};
        return kv([
          [{ uz: "Masʼul şaxs", ru: "Ответственное лицо" }, o.dpoName],
          [{ uz: "Elektron poçta", ru: "Электронная почта" }, o.dpoEmail],
          [{ uz: "Poçta manzili", ru: "Почтовый адрес" }, deep(o.address)]
        ]);
      }
    };

    /* ---------- assemble ---------- */
    var parts = [];

    if (isFallback) parts.push(
      '<div class="lg-note lg-note-info">This document is published in Uzbek and Russian. '
      + "The Uzbek text below is the operative version; use the language switch for Russian.</div>");

    /* An unfilled requisite is a compliance defect, so it is shown as one
       rather than quietly rendered as if it were data. Both audiences are
       told, but not the same thing: a visitor needs to know the document is
       incomplete so they do not rely on it, while the instruction for fixing
       it — and the internal file path it used to name — belongs only to the
       people who can act on it. Naming a source file to the public leaked an
       implementation detail and told a reader to do something they cannot. */
    if (cfg && !cfg.ready) {
      var oversight = false;
      try { oversight = sessionStorage.getItem("kg_admin") === "1"; } catch (e) {}
      parts.push('<div class="lg-note lg-note-warn">' + esc(pick(oversight ? {
        uz: "DIQQAT: operator rekvizitlari töldirilmagan. Admin panel > Sozlamalar > Operator rekvizitlari bölimida real röyxatdan ötiş maʼlumotlarini kiriting — hujjat töliq huquqiy kuçga şundan keyin ega böladi.",
        ru: "ВНИМАНИЕ: реквизиты оператора не заполнены. Укажите реальные регистрационные данные в разделе Админ-панель > Настройки > Реквизиты оператора — только после этого документ обретёт полную юридическую силу."
      } : {
        uz: "Eslatma: operator rekvizitlari hozirça töliq körsatilmagan. Savollar böyiça platforma maʼmuriyatiga murojaat qiling.",
        ru: "Примечание: реквизиты оператора указаны не полностью. По вопросам обращайтесь к администрации платформы."
      })) + "</div>");
    }

    if (doc.lead) parts.push('<p class="lg-lead">' + esc(fill(pick(doc.lead))) + "</p>");

    doc.sections.forEach(function (s) {
      parts.push('<section class="lg-sec"><h2>' + esc(fill(pick(s.h))) + "</h2>");
      if (s.p) parts.push(s.p.map(par).join(""));
      if (s.slot && SLOTS[s.slot]) parts.push(SLOTS[s.slot]());
      if (s.list) parts.push('<ul class="lg-list">' + s.list.map(function (x) {
        return "<li>" + esc(fill(pick(x))) + "</li>";
      }).join("") + "</ul>");
      if (s.after) parts.push(s.after.map(par).join(""));
      if (s.links) parts.push('<p class="lg-links">' + s.links.map(function (k) {
        var href = PAGES[k];
        if (!href) return "";                       // an unknown key links nowhere
        var d = (cfg && cfg.docs && cfg.docs[k]) || {};
        var title = d.title || EXTRA_TITLE[k];
        var nm = (title && (title[l] || title.uz)) || k;
        return '<a href="' + escA(href) + '">' + esc(nm) + " &rarr;</a>";
      }).join(" ") + "</p>");
      parts.push("</section>");
    });

    var title = (meta.title && (meta.title[l] || meta.title.uz)) || "";
    var stamp = pick({
      uz: "Versiya " + (meta.version || "—") + " · amal qiladi " + (meta.effective || "—"),
      ru: "Версия " + (meta.version || "—") + " · действует с " + (meta.effective || "—")
    });

    return { ok: true, title: title, stamp: stamp, html: parts.join("") };
  }

  /* One shared fetch of /api/legal. The gate, the panel and the document page
     can all be on screen in the same session; there is no reason to ask three
     times, and three answers that disagreed would be worse than one. */
  var cached = null, inflight = null;
  function config() {
    if (cached) return Promise.resolve(cached);
    if (inflight) return inflight;
    inflight = fetch("/api/legal").then(function (r) { return r.json(); })
      .then(function (j) { cached = (j && j.ok) ? j : null; inflight = null; return cached; })
      .catch(function () { inflight = null; return null; });
    return inflight;
  }

  global.LegalDoc = { render: render, config: config, PAGES: PAGES, esc: esc, escA: escA };
})(window);
