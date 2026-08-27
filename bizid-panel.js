/* ============================================================
   Business ID — the cabinet side.

   The public card at biznes-id.html is read-only; this is the one
   place its contact block can be written. Both cabinets mount the
   same panel; a second copy of this form would only drift.

   The field set is NOT the same for both. A company carries phone,
   e-mail, address and site; an association carries only phone and
   site, because a street address and a general mailbox say nothing
   useful about a body that represents its members. The server tells
   the panel which fields apply, so this file never has to know.

     BizIdPanel.mount(hostElement, { login, password })

   The panel never receives an org id: the server reads identity from
   the credentials, so the only card these fields can ever reach is
   the caller's own. Labels are carried here rather than added to each
   cabinet's dictionary, for the same reason the form is shared.
   ============================================================ */
(function (global) {
  "use strict";

  var LANGS = ["uz", "ru", "en"];
  var T = {
    title:   ["Business ID", "Business ID", "Business ID"],
    lead:    ["Bu ma'lumotlar sizning ochiq kartangizda ko'rinadi — uni QR kod orqali istalgan kishi ocha oladi.",
              "Эти данные видны на вашей публичной карточке — её может открыть любой по QR-коду.",
              "These details appear on your public card, which anyone can open from its QR code."],
    number:  ["ID raqamingiz", "Ваш ID номер", "Your ID number"],
    phone:   ["Telefon", "Телефон", "Phone"],
    email:   ["E-pochta", "E-mail", "Email"],
    location:["Manzil", "Адрес", "Location"],
    website: ["Veb-sayt", "Веб-сайт", "Website"],
    ph_phone:["+998 90 123 45 67", "+998 90 123 45 67", "+998 90 123 45 67"],
    ph_mail: ["info@korxona.uz", "info@company.uz", "info@company.uz"],
    ph_loc:  ["Toshkent, Amir Temur ko'chasi 1", "Ташкент, улица Амира Темура 1", "Tashkent, Amir Temur street 1"],
    ph_web:  ["korxona.uz", "company.uz", "company.uz"],
    save:    ["Saqlash", "Сохранить", "Save"],
    saving:  ["Saqlanmoqda…", "Сохранение…", "Saving…"],
    saved:   ["Saqlandi", "Сохранено", "Saved"],
    view:    ["Kartani ko'rish", "Посмотреть карточку", "View card"],
    copy:    ["Havolani nusxalash", "Копировать ссылку", "Copy link"],
    copied:  ["Havola nusxalandi", "Ссылка скопирована", "Link copied"],
    fail:    ["Saqlab bo'lmadi. Qaytadan urinib ko'ring.", "Не удалось сохранить. Попробуйте ещё раз.", "Could not save. Please try again."],
    email_invalid:  ["E-pochta manzili noto'g'ri.", "Неверный адрес e-mail.", "That email address is not valid."],
    phone_invalid:  ["Telefon raqami noto'g'ri.", "Неверный номер телефона.", "That phone number is not valid."],
    website_invalid:["Veb-sayt manzili noto'g'ri.", "Неверный адрес сайта.", "That website address is not valid."],
  };

  function L(){
    var v;
    try { v = global.localStorage.getItem("kg_lang"); } catch (e) { v = null; }
    var i = LANGS.indexOf(v || "uz");
    return i < 0 ? 0 : i;
  }
  var t = function (k) { return T[k][L()]; };

  function esc(s){
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  var FIELDS = [
    { key: "phone",    label: "phone",    ph: "ph_phone", type: "tel" },
    { key: "email",    label: "email",    ph: "ph_mail",  type: "email" },
    { key: "location", label: "location", ph: "ph_loc",   type: "text" },
    { key: "website",  label: "website",  ph: "ph_web",   type: "text" },
  ];

  /* Field-level server errors map onto a readable line rather than a code. */
  function messageFor(error){
    return T[error] ? t(error) : t("fail");
  }

  function post(body){
    return fetch("/api/business-id/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(function (r) { return r.json().catch(function () { return null; }); })
      .catch(function () { return null; });
  }

  /* The server is the authority on which fields this kind carries — an
     association has no address or mailbox on its card — so the form renders
     what it was told rather than a fixed list. */
  function fieldsOf(state){
    if(!state.fields || !state.fields.length) return FIELDS;
    return FIELDS.filter(function (f) { return state.fields.indexOf(f.key) !== -1; });
  }

  function template(state){
    var rows = fieldsOf(state).map(function (f) {
      return '<label class="bidp-field">' +
        '<span>' + esc(t(f.label)) + '</span>' +
        '<input type="' + f.type + '" data-bidp="' + f.key + '" ' +
          'value="' + esc(state.contact[f.key] || "") + '" ' +
          'placeholder="' + esc(t(f.ph)) + '" />' +
      '</label>';
    }).join("");

    var link = state.bizId ? "biznes-id.html?id=" + encodeURIComponent(state.bizId) : "";

    return '' +
      '<div class="bidp">' +
        '<div class="bidp-head">' +
          '<div>' +
            '<h3>' + esc(t("title")) + '</h3>' +
            '<p>' + esc(t("lead")) + '</p>' +
          '</div>' +
          (state.bizId
            ? '<div class="bidp-id"><span>' + esc(t("number")) + '</span>' +
              '<b>' + esc(state.bizId) + '</b></div>'
            : '') +
        '</div>' +
        '<div class="bidp-grid" data-cols="' + fieldsOf(state).length + '">' + rows + '</div>' +
        '<div class="bidp-foot">' +
          '<button class="btn btn-primary" type="button" data-bidp-save>' + esc(t("save")) + '</button>' +
          (link ? '<a class="btn btn-ghost" href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(t("view")) + '</a>' : '') +
          (link ? '<button class="btn btn-ghost" type="button" data-bidp-copy>' + esc(t("copy")) + '</button>' : '') +
          '<span class="bidp-say" data-bidp-say aria-live="polite"></span>' +
        '</div>' +
      '</div>';
  }

  function style(){
    if(document.getElementById("bidp-style")) return;
    var el = document.createElement("style");
    el.id = "bidp-style";
    el.textContent = [
      ".bidp{background:var(--card,#fffdf7);border:1px solid var(--line,#e2dac9);",
        "border-radius:16px;padding:22px 24px;max-width:760px}",
      ".bidp-head{display:flex;gap:20px;justify-content:space-between;align-items:flex-start;",
        "flex-wrap:wrap;margin-bottom:18px}",
      ".bidp-head h3{font-family:'Source Serif 4',Georgia,serif;font-size:19px;",
        "color:var(--ink,#1a2333);margin:0 0 6px}",
      ".bidp-head p{color:var(--muted,#838ba0);font-size:13.5px;line-height:1.55;margin:0;max-width:46ch}",
      ".bidp-id{text-align:right;flex:0 0 auto}",
      ".bidp-id span{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;",
        "color:var(--muted,#838ba0);margin-bottom:5px}",
      ".bidp-id b{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:15px;",
        "letter-spacing:.09em;color:var(--navy,#1f4e79);background:var(--bg-soft,#f3ecdf);",
        "border:1px solid var(--line-2,#d3c8b0);border-radius:8px;padding:5px 11px;display:inline-block}",
      ".bidp-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}",
      /* two fields side by side, not two plus a hole */
      '.bidp-grid[data-cols="1"],.bidp-grid[data-cols="2"]{grid-template-columns:1fr 1fr}',
      '.bidp-grid[data-cols="1"]{grid-template-columns:1fr;max-width:360px}',
      ".bidp-field{display:block}",
      ".bidp-field span{display:block;font-size:12.5px;color:var(--muted,#838ba0);margin-bottom:5px}",
      ".bidp-field input{width:100%;padding:10px 13px;font:inherit;font-size:14.5px;",
        "color:var(--ink,#1a2333);background:var(--bg-soft,#f3ecdf);",
        "border:1px solid var(--line,#e2dac9);border-radius:10px;outline:none;",
        "transition:border-color .16s ease,box-shadow .16s ease}",
      ".bidp-field input:focus{border-color:var(--navy-3,#2f6ba3);",
        "box-shadow:0 0 0 3px rgba(47,107,163,.16)}",
      ".bidp-foot{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:18px}",
      ".bidp-say{font-size:13.5px;color:var(--muted,#838ba0)}",
      ".bidp-say.is-ok{color:var(--green,#15795c)}",
      ".bidp-say.is-bad{color:#b4453f}",
      "@media (max-width:640px){.bidp-grid{grid-template-columns:1fr}.bidp-id{text-align:left}}",
    ].join("");
    document.head.appendChild(el);
  }

  /**
   * Render the panel into `host` and keep it in sync with the server.
   * Safe to call again — it re-fetches and re-renders from scratch.
   */
  async function mount(host, creds){
    if(!host) return;
    style();
    host.innerHTML = '<p class="co-sub">…</p>';

    var loaded = await post({ login: creds.login, password: creds.password, op: "get" });
    if(!loaded || !loaded.ok){
      host.innerHTML = '<p class="co-sub">' + esc(t("fail")) + '</p>';
      return;
    }

    var state = { bizId: loaded.bizId || "", contact: loaded.contact || {},
                  fields: loaded.fields || null, url: loaded.url || "" };
    host.innerHTML = template(state);

    var say = host.querySelector("[data-bidp-say]");
    var saveBtn = host.querySelector("[data-bidp-save]");
    var copyBtn = host.querySelector("[data-bidp-copy]");

    function tell(msg, kind){
      say.textContent = msg;
      say.className = "bidp-say" + (kind ? " is-" + kind : "");
    }

    saveBtn.addEventListener("click", async function (){
      var body = { login: creds.login, password: creds.password };
      fieldsOf(state).forEach(function (f){
        var el = host.querySelector('[data-bidp="' + f.key + '"]');
        body[f.key] = el ? el.value.trim() : "";
      });

      saveBtn.disabled = true;
      var was = saveBtn.textContent;
      saveBtn.textContent = t("saving");
      var r = await post(body);
      saveBtn.disabled = false;
      saveBtn.textContent = was;

      if(!r || !r.ok){ tell(messageFor(r && r.error), "bad"); return; }

      /* Show the normalised values back — the server may have lowercased an
         address or added the scheme to a bare domain. */
      state.contact = r.contact || {};
      state.fields = r.fields || state.fields;
      fieldsOf(state).forEach(function (f){
        var el = host.querySelector('[data-bidp="' + f.key + '"]');
        if(el) el.value = state.contact[f.key] || "";
      });
      tell(t("saved"), "ok");
      if(global.UI && UI.toast) UI.toast(t("saved"), { tone: "success" });
    });

    if(copyBtn) copyBtn.addEventListener("click", async function (){
      var link = state.url || (location.origin + "/biznes-id.html?id=" + encodeURIComponent(state.bizId));
      try{
        await navigator.clipboard.writeText(link);
        if(global.UI && UI.toast) UI.toast(t("copied"), { tone: "success" }); else tell(t("copied"), "ok");
      }catch(e){
        if(global.UI && UI.prompt) await UI.prompt(t("copy"), link); else tell(link, "");
      }
    });
  }

  global.BizIdPanel = { mount: mount, T: T };
})(window);
