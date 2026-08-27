/* ============================================================
   TIJORAT MARKAZI — dialogs and toasts

   Replaces window.alert / confirm / prompt, which render Chrome's
   own grey box ("localhost:4321 says") and can be neither styled
   nor translated. These read as part of the platform: the arch
   niche above the title, the gilded hairline, Source Serif for the
   heading and Inter for the question.

   All three are ASYNC — the native ones block the thread and return
   a value, these return a Promise. Every call site must await:

     if(!await UI.confirm(t("del_ask"))) return;
     const why = await UI.prompt("Sabab?");
     await UI.alert("Saqlandi");

   Never `if(UI.confirm(...))` — a Promise is always truthy, so the
   guard would silently always pass.

   Colours come from the CSS custom properties in styles.css, so
   light and dark themes both work with no extra rules here.
   ============================================================ */
(function (global) {
  "use strict";

  var LANG_KEY = "kg_lang";
  var LANG_ORDER = ["uz", "ru", "en"];

  /* Callers pass their own title and message already translated;
     only the buttons and fallback headings live here. */
  var LABEL = {
    ok:      ["OK", "OK", "OK"],
    cancel:  ["Bekor qilish", "Отмена", "Cancel"],
    yes:     ["Ha", "Да", "Yes"],
    no:      ["Yo‘q", "Нет", "No"],
    confirm: ["Tasdiqlang", "Подтвердите", "Confirm"],
    notice:  ["Xabar", "Уведомление", "Notice"],
    input:   ["Ma’lumot kiriting", "Введите данные", "Enter a value"]
  };

  function langIndex() {
    var stored = null;
    try { stored = global.localStorage.getItem(LANG_KEY); } catch (e) { stored = null; }
    var i = LANG_ORDER.indexOf(stored || "uz");
    return i < 0 ? 0 : i;
  }

  function label(key) { return LABEL[key][langIndex()]; }

  /* ---------- one-time stylesheet ---------- */

  var STYLE_ID = "ui-dialog-style";

  var CSS = [
    ".uid-back{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:24px;",
      "background:rgba(8,15,28,.58);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);",
      "opacity:0;transition:opacity .22s var(--ease,ease)}",
    ".uid-back.is-open{opacity:1}",

    ".uid-panel{position:relative;width:100%;max-width:432px;background:var(--card,#fffdf7);",
      "border:1px solid var(--line,#e2dac9);border-radius:26px 26px 16px 16px;",
      "box-shadow:var(--shadow-lift,0 26px 52px -26px rgba(26,35,51,.34));",
      "padding:0 26px 22px;text-align:center;overflow:hidden;",
      "transform:translateY(10px) scale(.97);opacity:0;",
      "transition:transform .26s var(--ease,ease),opacity .26s var(--ease,ease)}",
    ".uid-back.is-open .uid-panel{transform:none;opacity:1}",

    /* the gilded frame around the arch, as a hairline */
    ".uid-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;",
      "background:linear-gradient(90deg,transparent,var(--gold-soft,#d8ae5c),",
      "var(--gold,#b8873a),var(--gold-soft,#d8ae5c),transparent)}",

    /* the niche: a portal arch holding the icon */
    ".uid-niche{width:46px;height:52px;margin:26px auto 16px;display:grid;place-items:center;",
      "border-radius:23px 23px 6px 6px;border:1.5px solid var(--gold-soft,#d8ae5c);",
      "background:linear-gradient(170deg,var(--navy-3,#2f6ba3),var(--navy-2,#163a5c));",
      "box-shadow:inset 0 -8px 18px -10px rgba(0,0,0,.5)}",
    ".uid-niche svg{width:22px;height:22px;stroke:#fff;fill:none;stroke-width:2;",
      "stroke-linecap:round;stroke-linejoin:round}",
    ".uid-panel[data-tone='danger'] .uid-niche{border-color:#e0a0a0;",
      "background:linear-gradient(170deg,#b4453f,#82302c)}",
    ".uid-panel[data-tone='success'] .uid-niche{border-color:var(--gold-soft,#d8ae5c);",
      "background:linear-gradient(170deg,#1e9273,var(--green,#15795c))}",

    ".uid-title{font-family:'Source Serif 4',Georgia,serif;font-weight:700;font-size:19px;",
      "letter-spacing:-.02em;color:var(--ink,#1a2333);margin:0 0 8px;line-height:1.25}",
    ".uid-msg{font-size:14.5px;line-height:1.6;color:var(--text,#565e72);margin:0;",
      "white-space:pre-wrap;word-wrap:break-word}",

    ".uid-field{width:100%;margin-top:16px;padding:11px 14px;font:inherit;font-size:14.5px;",
      "color:var(--ink,#1a2333);background:var(--bg-soft,#f3ecdf);",
      "border:1px solid var(--line,#e2dac9);border-radius:12px;outline:none;",
      "transition:border-color .16s ease,box-shadow .16s ease}",
    ".uid-field:focus{border-color:var(--navy-3,#2f6ba3);",
      "box-shadow:0 0 0 3px rgba(47,107,163,.18)}",

    ".uid-foot{display:flex;gap:10px;justify-content:center;margin-top:22px}",
    ".uid-btn{flex:1 1 0;min-width:0;padding:11px 18px;font:inherit;font-size:14.5px;",
      "font-weight:600;border-radius:999px;border:1px solid transparent;cursor:pointer;",
      "transition:background .16s ease,border-color .16s ease,color .16s ease,transform .12s ease}",
    ".uid-btn:active{transform:translateY(1px)}",
    /* gold ring rather than navy — it reads as intentional on both the
       navy primary and the red destructive button */
    ".uid-btn:focus-visible{outline:2px solid var(--gold,#b8873a);outline-offset:2px}",
    ".uid-ok{background:var(--navy,#1f4e79);border-color:var(--navy,#1f4e79);color:#fff}",
    ".uid-ok:hover{background:var(--navy-2,#163a5c);border-color:var(--navy-2,#163a5c)}",
    ".uid-panel[data-tone='danger'] .uid-ok{background:#b4453f;border-color:#b4453f}",
    ".uid-panel[data-tone='danger'] .uid-ok:hover{background:#9a3a35;border-color:#9a3a35}",
    ".uid-cancel{background:transparent;border-color:var(--gold-soft,#d8ae5c);",
      "color:var(--navy,#1f4e79)}",
    ".uid-cancel:hover{border-color:var(--gold,#b8873a);background:var(--bg-soft-2,#ebe3d2)}",

    /* toasts — the non-blocking half of this module */
    ".uid-toasts{position:fixed;z-index:1300;left:50%;bottom:26px;transform:translateX(-50%);",
      "display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none}",
    ".uid-toast{display:flex;align-items:center;gap:9px;max-width:min(90vw,420px);",
      "padding:11px 17px;border-radius:999px;font-size:14px;font-weight:500;",
      "color:var(--ink,#1a2333);background:var(--card,#fffdf7);",
      "border:1px solid var(--line,#e2dac9);border-left:3px solid var(--navy,#1f4e79);",
      "box-shadow:var(--shadow,0 20px 44px -24px rgba(26,35,51,.28));",
      "opacity:0;transform:translateY(8px);transition:opacity .2s ease,transform .2s ease}",
    ".uid-toast.is-open{opacity:1;transform:none}",
    ".uid-toast[data-tone='danger']{border-left-color:#b4453f}",
    ".uid-toast[data-tone='success']{border-left-color:var(--green,#15795c)}",

    "@media (max-width:480px){.uid-foot{flex-direction:column-reverse}}",
    "@media (prefers-reduced-motion:reduce){",
      ".uid-back,.uid-panel,.uid-toast{transition:none}}"
  ].join("");

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  /* ---------- icons ---------- */

  var ICON = {
    question: "<path d='M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6v.6'/>" +
              "<circle cx='12' cy='17.5' r='1.2' fill='#fff' stroke='none'/>",
    danger:   "<path d='M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z'/>" +
              "<path d='M12 9v4.2'/><circle cx='12' cy='16.8' r='1.1' fill='#fff' stroke='none'/>",
    info:     "<circle cx='12' cy='12' r='9'/><path d='M12 11v5'/>" +
              "<circle cx='12' cy='7.8' r='1.2' fill='#fff' stroke='none'/>",
    success:  "<circle cx='12' cy='12' r='9'/><path d='m8.2 12.3 2.6 2.6 5-5.2'/>",
    input:    "<path d='M4 7h16M4 12h10M4 17h7'/>"
  };

  function iconFor(tone, kind) {
    if (tone === "danger") return ICON.danger;
    if (tone === "success") return ICON.success;
    if (kind === "prompt") return ICON.input;
    if (kind === "alert") return ICON.info;
    return ICON.question;
  }

  /* ---------- the shared dialog engine ---------- */

  var openCount = 0;

  function lockScroll(on) {
    openCount += on ? 1 : -1;
    if (openCount < 0) openCount = 0;
    document.documentElement.style.overflow = openCount > 0 ? "hidden" : "";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function assign(target, src) {
    for (var k in src) { if (Object.prototype.hasOwnProperty.call(src, k)) target[k] = src[k]; }
    return target;
  }

  /* kind: "alert" | "confirm" | "prompt" */
  function open(kind, opts) {
    ensureStyle();
    opts = opts || {};

    var tone = opts.tone || (kind === "alert" ? "info" : "default");
    var withCancel = kind !== "alert";
    var withField = kind === "prompt";

    var okLabel = opts.ok || label(kind === "confirm" ? "yes" : "ok");
    var cancelLabel = opts.cancel || label(kind === "confirm" ? "no" : "cancel");
    var title = opts.title != null ? opts.title
      : kind === "confirm" ? label("confirm")
      : kind === "prompt" ? label("input")
      : label("notice");

    var back = document.createElement("div");
    back.className = "uid-back";
    back.innerHTML =
      "<div class='uid-panel' role='" + (withField ? "dialog" : "alertdialog") + "'" +
        " aria-modal='true' aria-labelledby='uid-t' aria-describedby='uid-m'" +
        " data-tone='" + esc(tone) + "'>" +
        "<div class='uid-niche' aria-hidden='true'><svg viewBox='0 0 24 24'>" +
          iconFor(tone, kind) + "</svg></div>" +
        "<h2 class='uid-title' id='uid-t'>" + esc(title) + "</h2>" +
        "<p class='uid-msg' id='uid-m'>" + esc(opts.message) + "</p>" +
        (withField
          ? "<input class='uid-field' value='" + esc(opts.value) + "'" +
            " placeholder='" + esc(opts.placeholder || "") + "' />"
          : "") +
        "<div class='uid-foot'>" +
          (withCancel
            ? "<button type='button' class='uid-btn uid-cancel'>" + esc(cancelLabel) + "</button>"
            : "") +
          "<button type='button' class='uid-btn uid-ok'>" + esc(okLabel) + "</button>" +
        "</div>" +
      "</div>";

    document.body.appendChild(back);
    lockScroll(true);
    requestAnimationFrame(function () { back.classList.add("is-open"); });

    var panel = back.querySelector(".uid-panel");
    var okBtn = back.querySelector(".uid-ok");
    var cancelBtn = back.querySelector(".uid-cancel");
    var field = back.querySelector(".uid-field");
    var lastFocus = document.activeElement;

    return new Promise(function (resolve) {
      var done = false;

      /* what a dismissal returns, matching the natives it replaces */
      function cancelValue() {
        return kind === "confirm" ? false : kind === "prompt" ? null : undefined;
      }
      function acceptValue() {
        return kind === "confirm" ? true : kind === "prompt" ? (field ? field.value : "") : undefined;
      }

      function settle(value) {
        if (done) return;
        done = true;
        document.removeEventListener("keydown", onKey, true);
        back.classList.remove("is-open");
        lockScroll(false);
        setTimeout(function () {
          if (back.parentNode) back.parentNode.removeChild(back);
          /* Hand focus back only if nothing else claimed it while we were
             closing — callers often focus an input straight after awaiting,
             and stealing it back 220ms later would undo that. */
          var free = !document.activeElement || document.activeElement === document.body;
          try { if (free && lastFocus && lastFocus.focus) lastFocus.focus(); } catch (e) {}
        }, 220);
        resolve(value);
      }

      function trapTab(e) {
        var f = panel.querySelectorAll("button,input");
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }

      function onKey(e) {
        if (e.key === "Escape") { e.preventDefault(); settle(cancelValue()); return; }
        /* Enter submits only from the text field. When a button holds focus
           the browser clicks it natively, which is what makes the Cancel
           default on destructive dialogs actually mean something. */
        if (e.key === "Enter" && field && document.activeElement === field) {
          e.preventDefault(); settle(acceptValue()); return;
        }
        if (e.key === "Tab") trapTab(e);
      }

      okBtn.addEventListener("click", function () { settle(acceptValue()); });
      if (cancelBtn) cancelBtn.addEventListener("click", function () { settle(cancelValue()); });
      back.addEventListener("mousedown", function (e) { if (e.target === back) settle(cancelValue()); });
      document.addEventListener("keydown", onKey, true);

      /* A destructive dialog opens with Cancel focused, so a stray Enter
         backs out instead of deleting. Everything else focuses the field
         if there is one, otherwise the confirming button. */
      var initial = field || (tone === "danger" && cancelBtn ? cancelBtn : okBtn);
      setTimeout(function () { initial.focus(); }, 40);
    });
  }

  /* ---------- toasts ---------- */

  var toastHost = null;

  function toastRoot() {
    if (toastHost && toastHost.parentNode) return toastHost;
    toastHost = document.createElement("div");
    toastHost.className = "uid-toasts";
    toastHost.setAttribute("role", "status");
    toastHost.setAttribute("aria-live", "polite");
    document.body.appendChild(toastHost);
    return toastHost;
  }

  function toast(message, opts) {
    ensureStyle();
    opts = opts || {};
    var el = document.createElement("div");
    el.className = "uid-toast";
    el.setAttribute("data-tone", opts.tone || "default");
    el.textContent = String(message == null ? "" : message);
    toastRoot().appendChild(el);
    requestAnimationFrame(function () { el.classList.add("is-open"); });
    setTimeout(function () {
      el.classList.remove("is-open");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 240);
    }, opts.duration || 3200);
  }

  /* ---------- public surface ---------- */

  global.UI = {
    alert: function (message, opts) {
      return open("alert", assign({ message: message }, opts || {}));
    },
    confirm: function (message, opts) {
      return open("confirm", assign({ message: message }, opts || {}));
    },
    prompt: function (message, value, opts) {
      return open("prompt", assign({ message: message, value: value == null ? "" : value }, opts || {}));
    },
    toast: toast,
    LABEL: LABEL
  };
})(window);
