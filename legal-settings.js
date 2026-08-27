/* ============================================================
   LEGAL PANEL — "Ma'lumotlarim va huquqlarim" inside a cabinet

   The rights under modda 21-22 ZRU-547 were only reachable from a
   standalone page, which meant they were reachable in theory.
   Nobody navigates to a URL they have never been told about. So
   the same panel now mounts inside every cabinet's settings, next
   to the things people actually open.

   DEPENDENCY-FREE, on purpose. The company, buyer and association
   cabinets each load a different dictionary through MK.setDict(),
   so a module that called MK.t() would need its keys copied into
   three dictionaries and kept in step with them. This one carries
   its own strings and reads kg_lang directly — exactly the choice
   legal-footer.js makes, for exactly the same reason. Drop the
   script on a page, call LegalPanel.mount(el, {creds}), done.

   The standalone page (mening-malumotlarim.html) renders the same
   panel after its own sign-in, so there is one implementation of
   these four rights rather than two that drift.

   WHY WITHDRAWAL ASKS FOR A TYPED WORD: it takes effect the moment
   it returns and closes the cabinet the person is standing in.
   That is the correct behaviour — consent was the ground the
   cabinet ran on — but it is not a thing to do by misclick.
   ============================================================ */
(function (global) {
  "use strict";

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  var escA = function (s) { return esc(s).replace(/"/g, "&quot;"); };

  var LANGS = ["uz", "ru", "en"];
  function li() {
    var l = localStorage.getItem("kg_lang") || "uz";
    var i = LANGS.indexOf(l);
    return i < 0 ? 0 : i;
  }
  /* Documents exist in uz and ru; an English reader gets the Uzbek text with a
     notice on the document page itself, so labels here follow the same rule. */
  function dl() { return li() === 1 ? "ru" : "uz"; }
  var T = function (k) { return (STR[k] || ["", "", ""])[li()] || (STR[k] || [""])[0]; };

  var STR = {
    h:        ["Ma'lumotlarim va huquqlarim", "Мои данные и права", "My data and rights"],
    intro:    ["«Shaxsga doir ma'lumotlar to'g'risida»gi Qonunning (ZRU-547) 21 va 22-moddalari sizga quyidagi huquqlarni beradi. Murojaatlar 10 ish kuni ichida ko'rib chiqiladi.",
               "Статьи 21 и 22 Закона «О персональных данных» (ЗРУ-547) предоставляют вам следующие права. Обращения рассматриваются в течение 10 рабочих дней.",
               "Articles 21 and 22 of the Law on Personal Data (ZRU-547) give you the following rights. Requests are answered within 10 working days."],

    docs_h:   ["Huquqiy hujjatlar", "Правовые документы", "Legal documents"],
    reread:   ["Ommaviy ofertani o'qish", "Читать публичную оферту", "Read the public offer"],

    consent_h:["Rozilik", "Согласие", "Consent"],
    consent_on:["Rozilik berilgan:", "Согласие дано:", "Consent given:"],
    consent_ver:["hujjat versiyasi", "версия документа", "document version"],
    consent_no:["Rozilik yozuvi topilmadi — hisobingiz ushbu tizim joriy etilishidan oldin yaratilgan.",
                "Запись о согласии не найдена — учётная запись создана до внедрения этой системы.",
                "No consent record found — this account was created before this system existed."],

    export_h: ["Ma'lumot olish huquqi", "Право на получение сведений", "Right of access"],
    export_p: ["Siz haqingizda saqlanayotgan hamma narsa: hisob yozuvi, ariza, rozilik dalili va AI yordamchisi bilan yozishmalar. Parol qaytarilmas shaklda saqlangani uchun faylga kirmaydi.",
               "Всё, что о вас хранится: учётная запись, заявка, доказательство согласия и переписка с ИИ-помощником. Пароль не входит в файл, так как хранится в необратимой форме.",
               "Everything held about you: the account record, the application, the consent evidence and your AI assistant conversations. The password is not in the file, because it is stored irreversibly."],
    export_btn:["Faylni yuklab olish (JSON)", "Скачать файл (JSON)", "Download the file (JSON)"],

    fix_h:    ["Aniqlashtirish huquqi", "Право на уточнение", "Right to correction"],
    fix_p:    ["Noto'g'ri yoki eskirgan ma'lumotni profil bo'limida o'zingiz tuzatasiz — murojaat yozish shart emas.",
               "Неточные или устаревшие сведения вы исправляете сами в разделе профиля — обращение не требуется.",
               "You correct inaccurate or outdated details yourself in the profile section — no request needed."],

    erase_h:  ["O'chirishni talab qilish", "Требование об удалении", "Request erasure"],
    erase_p:  ["Murojaat qayd etiladi va 10 ish kuni ichida asoslantirilgan javob beriladi: qaysi ma'lumot o'chirildi, qaysi biri qonun talabi bo'yicha saqlandi (bitim va buxgalteriya hujjatlari — 5 yil).",
               "Обращение регистрируется, и в течение 10 рабочих дней даётся мотивированный ответ: какие данные удалены, какие сохранены по требованию закона (документы сделок и бухгалтерии — 5 лет).",
               "The request is registered and answered with reasons within 10 working days: what was erased, and what was retained because the law requires it (transaction and accounting records — 5 years)."],
    erase_note:["Izoh (ixtiyoriy)", "Комментарий (необязательно)", "Note (optional)"],
    erase_btn:["Murojaat yuborish", "Отправить обращение", "File the request"],
    erase_ok: ["Murojaat qabul qilindi. Raqami: {ref} · javob muddati: {due}",
               "Обращение принято. Номер: {ref} · срок ответа: {due}",
               "Request received. Reference: {ref} · answer due: {due}"],

    wd_h:     ["Rozilikni qaytarib olish", "Отзыв согласия", "Withdraw consent"],
    wd_warn:  ["DIQQAT: rozilik qaytarib olingan zahoti kabinetga kirish to'xtatiladi — qayta ishlash asosi aynan shu rozilik edi. Bitim va buxgalteriya hujjatlari qonuniy muddat davomida saqlanadi. Kirishni faqat administrator tiklaydi.",
               "ВНИМАНИЕ: сразу после отзыва доступ в кабинет прекращается — основанием обработки было именно это согласие. Документы сделок и бухгалтерии хранятся установленный законом срок. Доступ восстанавливает только администратор.",
               "WARNING: access to the cabinet stops the moment consent is withdrawn — that consent was the ground for processing. Transaction and accounting records are kept for the statutory period. Only an administrator can restore access."],
    wd_type:  ["Tasdiqlash uchun quyidagi so'zni yozing:", "Для подтверждения введите слово:", "To confirm, type the word:"],
    wd_word:  ["QAYTARIB OLAMAN", "ОТЗЫВАЮ", "WITHDRAW"],
    wd_btn:   ["Rozilikni qaytarib olish", "Отозвать согласие", "Withdraw consent"],
    wd_need:  ["Tasdiqlash so'zi mos kelmadi.", "Слово подтверждения не совпало.", "The confirmation word does not match."],
    wd_bye:   ["Rozilik qaytarib olindi. Chiqilmoqda…", "Согласие отозвано. Выполняется выход…", "Consent withdrawn. Signing out…"],
    wd_already:["Rozilik allaqachon qaytarib olingan.", "Согласие уже отозвано.", "Consent has already been withdrawn."],

    reqs_h:   ["Murojaatlaringiz", "Ваши обращения", "Your requests"],
    c_ref:    ["№", "№", "Ref"],
    c_kind:   ["Turi", "Тип", "Kind"],
    c_status: ["Holati", "Статус", "Status"],
    c_due:    ["Javob muddati", "Срок ответа", "Answer due"],
    k_access: ["Ma'lumot olish", "Получение сведений", "Access"],
    k_withdraw:["Rozilikni qaytarib olish", "Отзыв согласия", "Withdrawal"],
    k_erase:  ["O'chirish", "Удаление", "Erasure"],
    s_open:   ["Ko'rib chiqilmoqda", "На рассмотрении", "Open"],
    s_answered:["Javob berilgan", "Дан ответ", "Answered"],
    s_refused:["Rad etilgan", "Отказано", "Refused"],
    loading:  ["Yuklanmoqda…", "Загрузка…", "Loading…"],
    failed:   ["Ma'lumotni olish imkoni bo'lmadi.", "Не удалось получить данные.", "Could not load the data."]
  };

  var DOCS = [
    ["oferta.html",    { uz: "Ommaviy oferta", ru: "Публичная оферта" }],
    ["maxfiylik.html", { uz: "Maxfiylik siyosati", ru: "Политика конфиденциальности" }],
    ["shartlar.html",  { uz: "Foydalanish shartlari", ru: "Условия использования" }]
  ];

  function day(ms) {
    if (!ms) return "—";
    var d = new Date(ms), p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  function post(path, body) {
    return fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    }).then(function (r) { return r.json(); }).catch(function () { return null; });
  }

  /**
   * Render the panel into `host`.
   *
   * opts.creds       () => {login, password} — read at call time, never cached,
   *                  so a cabinet that re-authenticates does not go stale.
   * opts.panelClass  wrapper class; cabinets differ ("admin-panel" / "panel co-panel").
   * opts.profileHref where "correct your details yourself" points.
   * opts.onWithdrawn called after a successful withdrawal, to sign the user out.
   */
  function mount(host, opts) {
    if (!host) return;
    opts = opts || {};
    var panelClass = opts.panelClass || "admin-panel";
    var creds = opts.creds || function () { return null; };
    var DATA = null;

    host.innerHTML = '<div class="' + escA(panelClass) + '"><p class="ac-label">' + esc(T("loading")) + "</p></div>";

    function load() {
      var c = creds();
      if (!c || !c.login) { host.innerHTML = ""; return; }
      post("/api/legal/export", c).then(function (r) {
        if (!r || !r.ok) {
          host.innerHTML = '<div class="' + escA(panelClass) + '"><p class="ac-label">' + esc(T("failed")) + "</p></div>";
          return;
        }
        DATA = r.data;
        draw();
      });
    }

    function consentBlock() {
      var app = (DATA.applications || [])[0];
      var c = app && app.consent;
      if (!c) return "<p>" + esc(T("consent_no")) + "</p>";
      return "<p>" + esc(T("consent_on")) + " <b>" + esc(day(c.at)) + "</b> · "
        + esc(T("consent_ver")) + " <code>" + esc(c.version || "—") + "</code></p>";
    }

    function reqsBlock() {
      var rows = DATA.rightsRequests || [];
      if (!rows.length) return "";
      var kind = { access: T("k_access"), withdraw: T("k_withdraw"), erase: T("k_erase") };
      var stat = { open: T("s_open"), answered: T("s_answered"), refused: T("s_refused") };
      return '<div class="lg-tablewrap"><table class="lg-table"><thead><tr>'
        + "<th>" + esc(T("c_ref")) + "</th><th>" + esc(T("c_kind")) + "</th>"
        + "<th>" + esc(T("c_status")) + "</th><th>" + esc(T("c_due")) + "</th>"
        + "</tr></thead><tbody>"
        + rows.map(function (r) {
            return "<tr><td><code>" + esc(r.ref) + "</code></td>"
              + "<td>" + esc(kind[r.kind] || r.kind) + "</td>"
              + "<td>" + esc(stat[r.status] || r.status)
              + (r.answer ? '<div class="ac-label">' + esc(r.answer) + "</div>" : "")
              + "</td><td>" + esc(day(r.due)) + "</td></tr>";
          }).join("")
        + "</tbody></table></div>";
    }

    function draw() {
      var links = DOCS.map(function (d) {
        return '<a href="' + d[0] + '" target="_blank">' + esc(d[1][dl()] || d[1].uz) + " &rarr;</a>";
      }).join(" ");

      host.innerHTML =
        '<div class="' + escA(panelClass) + ' lg-settings">'
        + "<h2>" + esc(T("h")) + "</h2>"
        + '<p class="lg-set-intro">' + esc(T("intro")) + "</p>"

        + '<section class="lg-set-sec"><h3>' + esc(T("docs_h")) + "</h3>"
        + '<p class="lg-links">' + links + "</p>"
        + '<button type="button" class="btn btn-ghost" id="lgsOferta">' + esc(T("reread")) + "</button>"
        + "</section>"

        + '<section class="lg-set-sec"><h3>' + esc(T("consent_h")) + "</h3>"
        + consentBlock() + "</section>"

        + '<section class="lg-set-sec"><h3>' + esc(T("export_h")) + "</h3>"
        + "<p>" + esc(T("export_p")) + "</p>"
        + '<button type="button" class="btn btn-primary" id="lgsDl">' + esc(T("export_btn")) + "</button>"
        + "</section>"

        + (opts.profileHref
            ? '<section class="lg-set-sec"><h3>' + esc(T("fix_h")) + "</h3><p>" + esc(T("fix_p")) + "</p></section>"
            : "")

        + (reqsBlock()
            ? '<section class="lg-set-sec"><h3>' + esc(T("reqs_h")) + "</h3>" + reqsBlock() + "</section>"
            : "")

        + '<section class="lg-set-sec"><h3>' + esc(T("erase_h")) + "</h3>"
        + '<div class="lg-note">' + esc(T("erase_p")) + "</div>"
        + '<label class="lg-set-lbl">' + esc(T("erase_note")) + "</label>"
        + '<textarea id="lgsNote" rows="2" maxlength="1000" class="lg-set-ta"></textarea>'
        + '<button type="button" class="btn btn-ghost" id="lgsErase">' + esc(T("erase_btn")) + "</button>"
        + "</section>"

        + '<section class="lg-set-sec lg-set-danger"><h3>' + esc(T("wd_h")) + "</h3>"
        + '<div class="lg-note lg-note-warn">' + esc(T("wd_warn")) + "</div>"
        + '<label class="lg-set-lbl">' + esc(T("wd_type")) + "</label>"
        + '<input id="lgsWord" class="lg-set-in" spellcheck="false" autocomplete="off" placeholder="'
        + escA(T("wd_word")) + '" />'
        + '<button type="button" class="btn btn-ghost" id="lgsWd">' + esc(T("wd_btn")) + "</button>"
        + '<p class="lg-set-msg" id="lgsMsg" hidden></p>'
        + "</section></div>";

      var $ = function (id) { return host.querySelector(id); };
      var say = function (text, bad) {
        var m = $("#lgsMsg");
        m.hidden = false;
        m.className = "lg-set-msg" + (bad ? " err" : " ok");
        m.textContent = text;
      };

      $("#lgsOferta").addEventListener("click", function () {
        if (global.LegalGate && global.LegalGate.show) global.LegalGate.show({ readOnly: true });
        else window.open("oferta.html", "_blank");
      });

      /* Handed over as a file rather than a screen — "provide the information"
         means the person keeps a copy, not that they transcribe one. */
      $("#lgsDl").addEventListener("click", function () {
        var blob = new Blob([JSON.stringify(DATA, null, 2)], { type: "application/json" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "mening-malumotlarim-" + new Date().toISOString().slice(0, 10) + ".json";
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      });

      $("#lgsErase").addEventListener("click", function () {
        var c = creds();
        post("/api/legal/erase", Object.assign({}, c, { note: $("#lgsNote").value.trim() }))
          .then(function (r) {
            if (!r || !r.ok) return;
            say(T("erase_ok").replace("{ref}", r.ref).replace("{due}", day(r.due)), false);
            load();
          });
      });

      $("#lgsWd").addEventListener("click", function () {
        if ($("#lgsWord").value.trim().toUpperCase() !== T("wd_word").toUpperCase())
          return say(T("wd_need"), true);
        post("/api/legal/withdraw", creds()).then(function (r) {
          if (r && r.error === "already_withdrawn") return say(T("wd_already"), true);
          if (!r || !r.ok) return;
          say(T("wd_bye"), false);
          setTimeout(function () {
            if (opts.onWithdrawn) opts.onWithdrawn();
            else { ["kg_co", "kg_by", "kg_as"].forEach(function (k) { sessionStorage.removeItem(k); });
                   location.href = "index.html"; }
          }, 1400);
        });
      });
    }

    load();
    return { reload: load };
  }

  global.LegalPanel = { mount: mount, STR: STR };
})(window);
