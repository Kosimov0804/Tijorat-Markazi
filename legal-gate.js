/* ============================================================
   LEGAL GATE — the offer, shown before anyone registers

   A tick-box beside a link is not a presentation of an offer. It
   is a presentation of a link, and the honest description of what
   most people do with it is "nothing". Since the whole platform
   runs on a public offer under FK 367 — where the contract is
   formed by the applicant's own act — it matters rather a lot
   that the applicant was actually shown the terms first.

   So the terms are shown. Submitting the registration form opens
   this, with the real offer text in it, and the form does not go
   anywhere until the person accepts. The tick-box stays, because
   it is the artefact the server records, but it is now ticked BY
   the acceptance rather than instead of it.

   THE SCROLL REQUIREMENT is deliberate. "Roziman" stays disabled
   until the offer has been scrolled to the end at least once. It
   is a small friction, and it is the difference between a record
   that says a button was clicked and a record that says the text
   was put in front of someone and moved through. Short content
   that needs no scrolling enables the button immediately — the
   test is "did the end of the document reach the screen", not
   "did you scroll a fixed distance".

   Read-only mode (from cabinet settings) drops the acceptance
   footer and leaves the reader with a close button.

   Rendering comes from legal-render.js, so this shows exactly
   what oferta.html shows. Two renderers would eventually mean
   people accepting terms that differ from the published ones.
   ============================================================ */
(function (global) {
  "use strict";

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };

  var LANGS = ["uz", "ru", "en"];
  function li() {
    var l = localStorage.getItem("kg_lang") || "uz";
    var i = LANGS.indexOf(l);
    return i < 0 ? 0 : i;
  }
  var lang = function () { return LANGS[li()]; };
  var T = function (k) { return (STR[k] || ["", "", ""])[li()]; };

  var STR = {
    title:    ["Ro'yxatdan o'tishdan oldin", "Перед регистрацией", "Before you register"],
    title_ro: ["Huquqiy hujjatlar", "Правовые документы", "Legal documents"],
    lead:     ["Arizani yuborish ushbu ommaviy offertani qabul qilish hisoblanadi (Fuqarolik kodeksi, 370-modda). Iltimos, davom etishdan oldin o'qing.",
               "Отправка заявки означает акцепт настоящей публичной оферты (ст. 370 Гражданского кодекса). Пожалуйста, ознакомьтесь перед продолжением.",
               "Submitting the application constitutes acceptance of this public offer (Civil Code art. 370). Please read it before continuing."],
    tab_of:   ["Ommaviy oferta", "Публичная оферта", "Public offer"],
    tab_mx:   ["Maxfiylik siyosati", "Политика конфиденциальности", "Privacy policy"],
    hint:     ["Davom etish uchun offertani oxirigacha o'qing", "Для продолжения прочитайте оферту до конца", "Read the offer to the end to continue"],
    ready:    ["O'qildi — davom etishingiz mumkin", "Прочитано — можно продолжить", "Read — you may continue"],
    accept:   ["Roziman va davom etaman", "Согласен и продолжаю", "I accept and continue"],
    cancel:   ["Bekor qilish", "Отмена", "Cancel"],
    close:    ["Yopish", "Закрыть", "Close"],
    loading:  ["Yuklanmoqda…", "Загрузка…", "Loading…"],
    failed:   ["Hujjat matnini yuklab bo'lmadi. Iltimos, sahifani yangilang — matnni ko'rmasdan rozilik berish mumkin emas.",
               "Не удалось загрузить текст документа. Обновите страницу — дать согласие, не видя текста, нельзя.",
               "The document text could not be loaded. Please refresh — consent cannot be given without seeing it."]
  };

  var openEl = null;

  function lockScroll(on) {
    document.documentElement.style.overflow = on ? "hidden" : "";
  }

  /**
   * @param {{readOnly?:boolean}} opts
   * @returns {Promise<boolean>} true when accepted, false when dismissed.
   */
  function show(opts) {
    opts = opts || {};
    var readOnly = !!opts.readOnly;
    if (openEl) return Promise.resolve(false);

    return new Promise(function (resolve) {
      var back = document.createElement("div");
      back.className = "lgate-back";
      back.innerHTML =
        '<div class="lgate" role="dialog" aria-modal="true" aria-labelledby="lgate-t">'
        + '<header class="lgate-head">'
        +   '<h2 id="lgate-t">' + esc(readOnly ? T("title_ro") : T("title")) + "</h2>"
        +   (readOnly ? "" : '<p class="lgate-lead">' + esc(T("lead")) + "</p>")
        +   '<nav class="lgate-tabs">'
        +     '<button type="button" data-doc="oferta" class="on">' + esc(T("tab_of")) + "</button>"
        +     '<button type="button" data-doc="maxfiylik">' + esc(T("tab_mx")) + "</button>"
        +   "</nav>"
        + "</header>"
        + '<div class="lgate-body" id="lgateBody" tabindex="0"><p>' + esc(T("loading")) + "</p></div>"
        + '<footer class="lgate-foot">'
        +   (readOnly
              ? '<button type="button" class="btn btn-primary lgate-close">' + esc(T("close")) + "</button>"
              : '<span class="lgate-hint" id="lgateHint">' + esc(T("hint")) + "</span>"
                + '<span class="lgate-acts">'
                + '<button type="button" class="btn btn-ghost lgate-cancel">' + esc(T("cancel")) + "</button>"
                + '<button type="button" class="btn btn-primary lgate-ok" disabled>' + esc(T("accept")) + "</button>"
                + "</span>")
        + "</footer></div>";

      document.body.appendChild(back);
      openEl = back;
      lockScroll(true);

      var body = back.querySelector("#lgateBody");
      var hint = back.querySelector("#lgateHint");
      var okBtn = back.querySelector(".lgate-ok");
      var current = "oferta";
      var seenEnd = false;

      function settle(v) {
        if (!openEl) return;
        lockScroll(false);
        document.removeEventListener("keydown", onKey, true);
        back.remove();
        openEl = null;
        resolve(v);
      }
      function onKey(e) {
        if (e.key === "Escape") { e.preventDefault(); settle(false); }
      }
      document.addEventListener("keydown", onKey, true);

      /* The end of the OFFER is what unlocks acceptance — the privacy policy is
         freely readable but is not the contract being accepted here. A document
         short enough to need no scrolling counts as read on sight. */
      /* Fails CLOSED. An empty body has scrollHeight === clientHeight, which
         reads as "already at the end" — so a renderer that produced nothing
         would enable acceptance with no text ever shown. `painted` is the
         guard: no document, no acceptance. */
      var painted = false;
      function checkEnd() {
        if (readOnly || seenEnd || !painted || current !== "oferta") return;
        var atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 24;
        if (!atEnd) return;
        seenEnd = true;
        okBtn.disabled = false;
        hint.textContent = T("ready");
        hint.classList.add("ok");
      }
      body.addEventListener("scroll", checkEnd);

      function paint(cfg) {
        var out = LegalDoc.render(current, cfg, lang());
        if (!out.ok || !out.html) {
          painted = false;
          body.innerHTML = '<div class="lg-note lg-note-warn">' + esc(T("failed")) + "</div>";
          if (okBtn) { okBtn.disabled = true; }
          if (hint) hint.textContent = T("failed");
          return;
        }
        painted = true;
        body.innerHTML = '<div class="lg-body">' + out.html + "</div>";
        body.scrollTop = 0;
        /* Re-measure after layout: a short document is already "at the end". */
        requestAnimationFrame(checkEnd);
      }

      LegalDoc.config().then(function (cfg) {
        paint(cfg);
        back.querySelectorAll(".lgate-tabs button").forEach(function (b) {
          b.addEventListener("click", function () {
            back.querySelectorAll(".lgate-tabs button").forEach(function (x) { x.classList.remove("on"); });
            b.classList.add("on");
            current = b.dataset.doc;
            paint(cfg);
          });
        });
      });

      var close = back.querySelector(".lgate-close");
      if (close) close.addEventListener("click", function () { settle(false); });
      var cancel = back.querySelector(".lgate-cancel");
      if (cancel) cancel.addEventListener("click", function () { settle(false); });
      if (okBtn) okBtn.addEventListener("click", function () { settle(true); });

      /* Clicking the backdrop dismisses a read-only view, but never an
         acceptance prompt — dismissing that by accident would be a decision. */
      back.addEventListener("mousedown", function (e) {
        if (e.target === back && readOnly) settle(false);
      });

      body.focus();
    });
  }

  /**
   * Wire a registration form to the gate.
   *
   * The form's own submit handler stays exactly as it was; this intercepts in
   * the capture phase BEFORE it runs, and re-dispatches the same submit once
   * the offer has been accepted. That way the gate cannot be forgotten by a
   * later change to the form's validation, and the validation cannot be
   * skipped by the gate.
   */
  function guard(formSel, boxSel) {
    var form = document.querySelector(formSel);
    var box = document.querySelector(boxSel);
    if (!form || !box) return;
    var accepted = false;

    /* Attached to DOCUMENT, not to the form. A capture listener on the target
       element itself fires in registration order alongside the bubble ones, so
       binding here would only beat the form's own handler if this script
       happened to load first. On an ancestor, the capture phase genuinely
       precedes the target — the guard runs first no matter the script order. */
    document.addEventListener("submit", function (e) {
      if (e.target !== form) return;
      if (accepted) return;                       // let the real handler run
      e.preventDefault();
      e.stopImmediatePropagation();
      show({}).then(function (ok) {
        if (!ok) return;
        accepted = true;
        box.checked = true;
        box.dispatchEvent(new Event("change", { bubbles: true }));
        /* requestSubmit runs validation and fires submit again — this time the
           guard steps aside and the form's own handler takes it. */
        if (form.requestSubmit) form.requestSubmit();
        else form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      });
    }, true);

    /* Unticking after acceptance means the person changed their mind, so the
       gate arms again rather than remembering a consent they just revoked. */
    box.addEventListener("change", function () { if (!box.checked) accepted = false; });
  }

  global.LegalGate = { show: show, guard: guard };
})(window);
