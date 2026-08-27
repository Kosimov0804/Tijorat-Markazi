/* ============================================================
   TIJORAT MARKAZI — shared chat kit

   Everything a chat composer needs, in one place so the group chat,
   the direct messages and the company↔admin thread all behave the
   same way: attach a file, record a voice note, pick an emoji, turn
   typed links into real ones, and render the resulting bubbles.

   On emoji: these are plain Unicode characters, so they are drawn by
   whatever emoji font the reader's device has — which means they ARE
   Apple's artwork on an iPhone, iPad or Mac, and Segoe or Noto
   elsewhere. Apple's set cannot be bundled: the font is proprietary
   and redistributing it is not permitted. Shipping an open set
   (Twemoji, OpenMoji) is the only way to make every device match, and
   that is a deliberate choice rather than a default.
   ============================================================ */
var KGChat = (function () {

  var MAX = 12 * 1024 * 1024;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function humanSize(n) {
    if (!n) return "";
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + " KB";
    return (n / 1048576).toFixed(1) + " MB";
  }
  function clock(sec) {
    sec = Math.max(0, Math.round(sec || 0));
    return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  }

  /* ---- attachments ------------------------------------------------ */

  /** Turn a File into the payload the API expects. */
  function fileToAttach(file) {
    return new Promise(function (resolve, reject) {
      if (file.size > MAX) return reject(new Error("too-large"));
      var fr = new FileReader();
      fr.onerror = function () { reject(new Error("read-failed")); };
      fr.onload = function () {
        var s = String(fr.result || "");
        resolve({
          data: s.slice(s.indexOf(",") + 1),          // strip the data: prefix
          mime: file.type || "application/octet-stream",
          name: file.name || "file"
        });
      };
      fr.readAsDataURL(file);
    });
  }

  /* ---- links -------------------------------------------------------
     Text is escaped BEFORE anything is scanned, so nothing a sender
     types can become markup. Only http, https, mailto and tel become
     links; javascript: and data: are left as plain text, which is what
     stops a pasted "link" from running anything. */
  var SAFE = /^(https?:\/\/|mailto:|tel:)/i;
  /* Placeholder used while labelled links are held aside. A control
     character is used because a keyboard cannot produce one — a
     readable marker such as " 0 " would collide with a message that
     merely contains a number. */
  var NUL = String.fromCharCode(1);

  function safeHref(u) {
    var h = String(u || "").trim();
    if (/^www\./i.test(h)) h = "http://" + h;
    return SAFE.test(h) ? h : null;
  }
  function anchor(href, label) {
    var h = safeHref(href);
    if (!h) return esc(label);                        // unsafe scheme: plain text
    return '<a class="ck-link" href="' + esc(h) + '" target="_blank" rel="noopener noreferrer">' +
           esc(label) + "</a>";
  }

  /**
   * Message text → safe HTML with links.
   *   [label](url)  a labelled link
   *   bare url      links to itself
   */
  function linkify(raw) {
    var text = String(raw == null ? "" : raw).split(NUL).join("");
    var slots = [];

    // 1 · lift labelled links out so step 3 cannot rescan their url
    text = text.replace(/\[([^\]\n]{1,140})\]\(([^\s)]{1,500})\)/g, function (whole, label, url) {
      if (!safeHref(url)) return whole;              // unsafe scheme: leave as typed
      slots.push(anchor(url, label));
      return NUL + (slots.length - 1) + NUL;
    });

    // 2 · escape everything that remains
    text = esc(text);

    // 3 · bare urls; trailing punctuation stays outside the link so a
    //     url ending a sentence does not swallow the full stop
    text = text.replace(/(^|[\s(])((?:https?:\/\/|www\.)[^\s<]+)/gi, function (m, pre, url) {
      var trail = "", cut = url.match(/[),.;:!?]+$/);
      if (cut) { trail = cut[0]; url = url.slice(0, -trail.length); }
      var plain = url.replace(/&amp;/g, "&").replace(/&quot;/g, '"')
                     .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
      var h = safeHref(plain);
      if (!h) return m;
      return pre + '<a class="ck-link" href="' + esc(h) + '" target="_blank" rel="noopener noreferrer">' +
             url + "</a>" + trail;
    });

    // 4 · restore the labelled links
    return text.replace(new RegExp(NUL + "(\\d+)" + NUL, "g"), function (_, i) { return slots[+i]; });
  }

  /** The bubble body for one attachment. */
  function renderAttachment(att) {
    if (!att || !att.url) return "";
    var url = esc(att.url), name = esc(att.name);
    if (att.kind === "image") {
      return '<button type="button" class="ck-img" data-full="' + url + '">' +
             '<img src="' + url + '" alt="' + name + '" loading="lazy"></button>';
    }
    if (att.kind === "voice") {
      return '<span class="ck-voice" data-src="' + url + '" data-dur="' + (att.dur || 0) + '">' +
               '<button class="ck-play" type="button" aria-label="play">▶</button>' +
               '<span class="ck-wave">' + bars(att.dur) + "</span>" +
               '<span class="ck-time">' + clock(att.dur) + "</span>" +
             "</span>";
    }
    if (att.kind === "video") return '<video class="ck-video" src="' + url + '" controls preload="metadata"></video>';
    if (att.kind === "audio") return '<audio class="ck-audio" src="' + url + '" controls preload="none"></audio>';
    return '<a class="ck-file" href="' + url + '" download="' + name + '">' +
             '<span class="ck-file-ic">📎</span>' +
             '<span class="ck-file-tx"><b>' + name + "</b><em>" + esc(humanSize(att.size)) + "</em></span>" +
           "</a>";
  }

  /* A fixed bar strip — decoding the audio to draw a true waveform is
     not worth it for a 22-bar sketch. */
  function bars(dur) {
    var n = 22, out = "", seed = Math.round((dur || 3) * 97) || 7;
    for (var i = 0; i < n; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      out += '<i style="height:' + (26 + (seed / 233280) * 74).toFixed(0) + '%"></i>';
    }
    return out;
  }

  /** Play/pause for every voice bubble inside a container. */
  function bindVoice(root) {
    root.querySelectorAll(".ck-voice").forEach(function (v) {
      if (v.dataset.bound) return;
      v.dataset.bound = "1";
      var btn = v.querySelector(".ck-play"), time = v.querySelector(".ck-time");
      var wave = v.querySelector(".ck-wave"), audio = null;
      btn.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        if (!audio) {
          audio = new Audio(v.dataset.src);
          audio.addEventListener("timeupdate", function () {
            var p = audio.duration ? audio.currentTime / audio.duration : 0;
            wave.style.setProperty("--p", (p * 100).toFixed(1) + "%");
            time.textContent = clock(audio.currentTime);
          });
          audio.addEventListener("ended", function () {
            btn.textContent = "▶"; wave.style.setProperty("--p", "0%");
            time.textContent = clock(v.dataset.dur); v.classList.remove("playing");
          });
        }
        if (audio.paused) {
          document.querySelectorAll(".ck-voice.playing").forEach(function (o) {
            if (o !== v) o.querySelector(".ck-play").click();   // one at a time
          });
          audio.play(); btn.textContent = "❚❚"; v.classList.add("playing");
        } else {
          audio.pause(); btn.textContent = "▶"; v.classList.remove("playing");
        }
      });
    });
  }

  /* ---- media viewer, the way Telegram does it ----------------------
     Not a bare overlay: the photo carries who sent it and when, its
     place in the conversation, and arrows to walk the rest. */
  var box = null, gal = [], at = 0;

  function buildViewer() {
    box = document.createElement("div");
    box.className = "ck-lb";
    box.innerHTML =
      '<div class="ck-lb-bar">' +
        '<span class="ck-lb-who"><b></b><em></em></span>' +
        '<a class="ck-lb-btn ck-lb-dl" download title="Yuklab olish">⤓</a>' +
        '<button class="ck-lb-btn ck-lb-x" type="button" aria-label="close">✕</button>' +
      "</div>" +
      '<button class="ck-lb-nav prev" type="button" aria-label="previous">‹</button>' +
      '<figure class="ck-lb-stage"><img alt=""></figure>' +
      '<button class="ck-lb-nav next" type="button" aria-label="next">›</button>' +
      '<div class="ck-lb-foot"><span class="ck-lb-count"></span></div>';
    document.body.appendChild(box);

    box.querySelector(".ck-lb-x").addEventListener("click", closeViewer);
    box.querySelector(".prev").addEventListener("click", function (e) { e.stopPropagation(); step(-1); });
    box.querySelector(".next").addEventListener("click", function (e) { e.stopPropagation(); step(1); });
    box.querySelector(".ck-lb-stage").addEventListener("click", function (e) { e.stopPropagation(); });
    box.querySelector(".ck-lb-bar").addEventListener("click", function (e) { e.stopPropagation(); });
    box.addEventListener("click", closeViewer);
    document.addEventListener("keydown", function (e) {
      if (!box || !box.classList.contains("open")) return;
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }

  function stamp(ms) {
    var d = new Date(ms);
    if (isNaN(d)) return "";
    var p = function (n) { return String(n).padStart(2, "0"); };
    var time = p(d.getHours()) + ":" + p(d.getMinutes());
    if (d.toDateString() === new Date().toDateString()) return time;
    return p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear() + " " + time;
  }

  function show(i) {
    if (!gal.length) return;
    at = (i + gal.length) % gal.length;
    var it = gal[at];
    box.querySelector("img").src = it.url;
    box.querySelector(".ck-lb-who b").textContent = it.from || "";
    box.querySelector(".ck-lb-who em").textContent = stamp(it.time);
    box.querySelector(".ck-lb-count").textContent = gal.length > 1 ? (at + 1) + " / " + gal.length : "";
    var dl = box.querySelector(".ck-lb-dl");
    dl.href = it.url; dl.setAttribute("download", it.name || "photo");
    box.querySelector(".prev").hidden = gal.length < 2;
    box.querySelector(".next").hidden = gal.length < 2;
  }
  function step(d) { show(at + d); }

  function closeViewer() {
    if (!box) return;
    box.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(function () {
      if (box && !box.classList.contains("open")) box.querySelector("img").src = "";
    }, 260);
  }

  function lightbox(items, index) {
    if (!box) buildViewer();
    gal = Array.isArray(items) && items.length ? items : [{ url: items, name: "photo" }];
    show(index || 0);
    box.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  /** Images open the viewer, with the whole set available to walk. */
  function bindImages(root, getGallery) {
    root.querySelectorAll(".ck-img").forEach(function (b) {
      if (b.dataset.bound) return;
      b.dataset.bound = "1";
      b.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        var list = getGallery ? getGallery() : [];
        var i = 0;
        for (var k = 0; k < list.length; k++) if (list[k].url === b.dataset.full) { i = k; break; }
        lightbox(list.length ? list : [{ url: b.dataset.full }], i);
      });
    });
  }

  /* ---- voice recording --------------------------------------------
     Three states, needing three different answers: available, blocked
     because the page is not a secure origin (the usual case — opened
     over http:// on a LAN address), or genuinely unsupported. */
  function recordState() {
    var secure = window.isSecureContext || location.protocol === "https:" ||
                 location.hostname === "localhost" || location.hostname === "127.0.0.1";
    if (!secure) return "insecure";
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)) return "no";
    return "ok";
  }
  function canRecord() { return recordState() === "ok"; }
  function secureUrl() {
    return "https://" + location.hostname + ":4443" + location.pathname + location.search;
  }

  function recorder(onDone, onTick, onError) {
    var rec = null, chunks = [], stream = null, t0 = 0, tick = null, cancelled = false;
    function start() {
      if (!canRecord()) { onError && onError(new Error("unsupported")); return; }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
        stream = s; chunks = []; cancelled = false;
        var mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
                 : MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
        rec = mime ? new MediaRecorder(s, { mimeType: mime }) : new MediaRecorder(s);
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = function () {
          stream.getTracks().forEach(function (t) { t.stop(); });
          clearInterval(tick);
          if (cancelled || !chunks.length) return;
          var blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
          var dur = (Date.now() - t0) / 1000;
          if (dur < 0.4) return;                       // a tap, not a message
          var fr = new FileReader();
          fr.onload = function () {
            var str = String(fr.result || "");
            onDone({
              data: str.slice(str.indexOf(",") + 1),
              mime: (rec.mimeType || "audio/webm").split(";")[0],
              name: "voice", voice: true, dur: dur
            });
          };
          fr.readAsDataURL(blob);
        };
        rec.start();
        t0 = Date.now();
        tick = setInterval(function () { onTick && onTick((Date.now() - t0) / 1000); }, 200);
        onTick && onTick(0);
      }).catch(function (e) { onError && onError(e); });
    }
    return {
      start: start,
      stop: function () { if (rec && rec.state !== "inactive") rec.stop(); },
      cancel: function () { cancelled = true; if (rec && rec.state !== "inactive") rec.stop(); },
      supported: canRecord()
    };
  }

  /* ---- emoji ------------------------------------------------------- */
  var EMOJI = {
    "😀": "😀😃😄😁😆😅😂🤣😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🥳😏😒😞😔😟😕🙁😣😖😫😩🥺😢😭😤😠😡🤬🤯😳🥵🥶😱😨😰😥😓🤗🤔🤭🤫🤥😶😐😑😬🙄😯😦😧😮😲🥱😴🤤😪😵🤐🥴🤢🤮🤧😷🤒🤕🤑🤠",
    "👍": "👍👎👌🤌🤏✌️🤞🤟🤘🤙👈👉👆👇☝️✋🤚🖐️🖖👋🤝🙏✍️💪🦾🙌👏🤲🫶❤️🧡💛💚💙💜🖤🤍🤎💔❣️💕💞💓💗💖💘💝",
    "🏢": "🏢🏬🏭🏗️🏘️🏛️🕌🕍⛪🏰🏯🗼🌉🚗🚕🚙🚌🚚🚛✈️🚀🛳️⛵🚢⚓🗺️🧭🌍🌏🌎",
    "📦": "📦📫📬📭📮📝📄📃📑📊📈📉🗒️🗓️📅📆🗂️📁📂🔖🏷️💼👔🧾💳💰💵💴💶💷🪙💸🧮⚖️🤝🎯🏆🥇🎁",
    "🍎": "🍎🍊🍋🍌🍉🍇🍓🫐🍈🍒🍑🥭🍍🥥🥝🍅🍆🥑🥦🥬🥒🌶️🌽🥕🧄🧅🥔🍠🌾🌱🌿☘️🍀🪴🌸🌺🌻🌷🌹",
    "⏰": "⏰⏱️⌛⏳✅❌⭕❗❓💡🔔🔕📌📍🔗🔒🔓🔑🗝️🔍🔎⚙️🛠️🔧📱💻🖥️⌨️🖨️📞☎️📧✉️🌐"
  };

  function emojiPicker(btn, input, mount) {
    var panel = null;
    function build() {
      panel = document.createElement("div");
      panel.className = "ck-emoji";
      var cats = Object.keys(EMOJI);
      panel.innerHTML =
        '<div class="ck-emoji-tabs">' + cats.map(function (c, i) {
          return '<button type="button" class="ck-tab' + (i ? "" : " on") + '" data-c="' + i + '">' + c + "</button>";
        }).join("") + '</div><div class="ck-emoji-grid"></div>';
      (mount || btn.parentNode).appendChild(panel);
      var grid = panel.querySelector(".ck-emoji-grid");
      function fill(i) {
        grid.innerHTML = Array.from(EMOJI[cats[i]]).filter(function (ch) {
          return ch.codePointAt(0) > 0x2000;           // drop joiners between glyphs
        }).map(function (ch) {
          return '<button type="button" class="ck-e">' + ch + "</button>";
        }).join("");
      }
      fill(0);
      panel.addEventListener("click", function (e) {
        var tab = e.target.closest(".ck-tab");
        if (tab) {
          panel.querySelectorAll(".ck-tab").forEach(function (t) { t.classList.remove("on"); });
          tab.classList.add("on"); fill(+tab.dataset.c); return;
        }
        var em = e.target.closest(".ck-e");
        if (em) insertAt(input, em.textContent);
      });
    }
    btn.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      if (!panel) build();
      panel.classList.toggle("open");
    });
    document.addEventListener("click", function (e) {
      if (panel && panel.classList.contains("open") &&
          !panel.contains(e.target) && e.target !== btn) panel.classList.remove("open");
    });
  }

  /** Insert text at the caret, leaving the caret after it. */
  function insertAt(input, text) {
    var a = input.selectionStart == null ? input.value.length : input.selectionStart;
    var b = input.selectionEnd == null ? a : input.selectionEnd;
    input.value = input.value.slice(0, a) + text + input.value.slice(b);
    input.focus();
    input.selectionStart = input.selectionEnd = a + text.length;
  }

  /**
   * A "make a link" control: uses whatever is selected in the input as
   * the label, asks for the address, and writes [label](url).
   */
  function linkButton(btn, input, prompts) {
    prompts = prompts || {};
    btn.addEventListener("click", async function (e) {
      e.preventDefault();
      /* Read the selection before awaiting — opening the dialog moves focus
         out of the input, and some browsers drop the range with it. */
      var a = input.selectionStart == null ? 0 : input.selectionStart;
      var b = input.selectionEnd == null ? 0 : input.selectionEnd;
      var selected = input.value.slice(a, b);
      var url = await UI.prompt(prompts.url || "Havola manzili (https://…)", "https://");
      if (!url) return;
      if (!safeHref(url)) { UI.alert(prompts.bad || "Faqat http:// yoki https:// havolalar", { tone: "danger" }); return; }
      var label = selected || (await UI.prompt(prompts.label || "Havola matni", url)) || url;
      input.focus();
      input.setSelectionRange(a, b);
      insertAt(input, "[" + label.replace(/[\[\]]/g, "") + "](" + url + ")");
    });
  }

  return {
    fileToAttach: fileToAttach,
    linkify: linkify,
    renderAttachment: renderAttachment,
    bindVoice: bindVoice,
    bindImages: bindImages,
    lightbox: lightbox,
    recorder: recorder,
    emojiPicker: emojiPicker,
    linkButton: linkButton,
    insertAt: insertAt,
    humanSize: humanSize,
    clock: clock,
    canRecord: canRecord,
    recordState: recordState,
    secureUrl: secureUrl
  };
})();
