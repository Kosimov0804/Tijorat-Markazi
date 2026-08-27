/* ============================================================
   TIJORAT MARKAZI — group chat, full screen

   Two kinds of room:
     assoc:<id>   one association's chairman with its member companies
     chairmen     the association heads together

   The widget never decides who may read a room. It renders whatever
   /api/group returns for the caller's own credentials; the server owns
   membership.
   ============================================================ */

var KG_GROUP_T = {
  rooms:    ["Guruhlar", "Группы", "Groups"],
  members:  ["a'zo", "участн.", "members"],
  empty:    ["Hali xabar yo'q. Birinchi bo'lib yozing.",
             "Сообщений пока нет. Напишите первым.",
             "No messages yet. Be the first to write."],
  none:     ["Siz hech qaysi guruhda emassiz.",
             "Вы не состоите ни в одной группе.",
             "You are not in any group."],
  ph:       ["Xabar yozing…", "Напишите сообщение…", "Write a message…"],
  send:     ["Yuborish", "Отправить", "Send"],
  failed:   ["Yuborilmadi — qayta urinib ko'ring.",
             "Не отправлено — попробуйте ещё раз.",
             "Not sent — please try again."],
  loading:  ["Yuklanmoqda…", "Загрузка…", "Loading…"],
  chairmen: ["Raislar kengashi", "Совет председателей", "Council of chairmen"],
  observer: ["kuzatuvchi", "наблюдатель", "observer"],
  back:     ["← Panelga qaytish", "← Вернуться в панель", "← Back to the profile"],
  today:    ["Bugun", "Сегодня", "Today"],
  yesterday:["Kecha", "Вчера", "Yesterday"],
  search:   ["Qidirish…", "Поиск…", "Search…"],
  cancel:   ["Bekor", "Отмена", "Cancel"],
  link:     ["Havola qo‘shish", "Вставить ссылку", "Insert link"],
  link_url: ["Havola manzili (https://…)", "Адрес ссылки (https://…)", "Link address (https://…)"],
  link_txt: ["Havola matni", "Текст ссылки", "Link text"],
  link_bad: ["Faqat http:// yoki https:// havolalar qabul qilinadi",
             "Принимаются только http:// или https:// ссылки",
             "Only http:// or https:// links are accepted"],
  typing:   ["yozmoqda…", "печатает…", "is typing…"],
  edited:   ["tahrirlangan", "изменено", "edited"],
  removed:  ["Xabar o‘chirildi", "Сообщение удалено", "Message deleted"],
  reply:    ["Javob berish", "Ответить", "Reply"],
  edit:     ["Tahrirlash", "Изменить", "Edit"],
  del:      ["O‘chirish", "Удалить", "Delete"],
  react:    ["Reaksiya", "Реакция", "React"],
  read_by:  ["O‘qidi", "Прочитали", "Read by"],
  del_ask:  ["Bu xabar o‘chirilsinmi?", "Удалить это сообщение?", "Delete this message?"],
  too_big:  ["Fayl juda katta (12 MB gacha)", "Файл слишком большой (до 12 МБ)", "File too large (12 MB max)"],
  mic_denied:["Mikrofonga ruxsat berilmadi", "Доступ к микрофону запрещён", "Microphone permission denied"],
  mic_https:["Ovozli xabar uchun himoyalangan ulanish kerak. Xavfsiz manzilga o‘ting:",
             "Для голосовых сообщений нужно защищённое соединение. Откройте безопасный адрес:",
             "Voice messages need a secure connection. Open the secure address:"],
  mic_open: ["Xavfsiz manzilni ochish", "Открыть безопасный адрес", "Open the secure address"],
  mic_no:   ["Bu brauzer ovoz yozishni qo‘llab-quvvatlamaydi",
             "Этот браузер не поддерживает запись голоса",
             "This browser cannot record audio"],
  info:     ["Guruh a'zolari", "Участники группы", "Group members"],
  close:    ["Yopish", "Закрыть", "Close"],
  you:      ["siz", "вы", "you"],
  write:    ["Shaxsiy xabar yozish", "Написать лично", "Send a direct message"],
  dm_note:  ["Shaxsiy suhbat — faqat ikkovingiz ko'rasiz.",
             "Личный чат — видите только вы двое.",
             "Direct chat — only the two of you can see it."]
};

/**
 * Render the full-screen group chat.
 *
 * @param {object} o
 * @param {HTMLElement} o.mount    container filling the viewport
 * @param {object} o.creds         {login,password} or {pass:"admin"}
 * @param {string} o.lang          "uz" | "ru" | "en"
 * @param {string} o.backHref      where the back button goes
 * @returns {{destroy:function}}
 */
function kgGroupChat(o) {
  var mount = o.mount, creds = o.creds || {};
  var idx = { uz: 0, ru: 1, en: 2 };
  var li = idx[o.lang] != null ? idx[o.lang] : 0;
  var t = function (k) { return KG_GROUP_T[k][li]; };
  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };

  var groups = [], active = null, me = null, timer = null, dead = false, filter = "";
  var thread = [], replyTo = null;

  var api = function (body) {
    var p = {};
    for (var k in creds) p[k] = creds[k];
    for (var j in body) p[j] = body[j];
    // room titles carry an association name, so they follow the reader's language
    if (p.lang == null) p.lang = (localStorage.getItem("kg_lang") || "uz");
    return fetch("/api/group", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p)
    }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  };

  var pad = function (n) { return String(n).padStart(2, "0"); };
  var clock = function (ms) { var d = new Date(ms); return isNaN(d) ? "" : pad(d.getHours()) + ":" + pad(d.getMinutes()); };
  var dayKey = function (ms) { var d = new Date(ms); return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate(); };
  var dayLabel = function (ms) {
    var d = new Date(ms), now = new Date();
    if (dayKey(ms) === dayKey(now.getTime())) return t("today");
    if (dayKey(ms) === dayKey(now.getTime() - 864e5)) return t("yesterday");
    return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear();
  };
  var initials = function (name) {
    var parts = String(name || "?").trim().split(/\s+/);
    return ((parts[0] || "?")[0] + (parts.length > 1 ? parts[1][0] : "")).toUpperCase();
  };
  var roomTitle = function (g) { return g.id === "chairmen" ? t("chairmen") : g.title; };

  /* ---- shell ---- */
  mount.innerHTML =
    '<div class="tg">' +
      '<aside class="tg-side">' +
        '<div class="tg-side-top">' +
          '<a class="tg-back" href="' + esc(o.backHref || "index.html") + '">' + esc(t("back")) + "</a>" +
          '<input class="tg-search" id="tgSearch" placeholder="' + esc(t("search")) + '" autocomplete="off">' +
        "</div>" +
        '<div class="tg-list" id="tgList"><p class="tg-note">' + esc(t("loading")) + "</p></div>" +
      "</aside>" +
      '<section class="tg-main" id="tgMain">' +
        '<header class="tg-head" id="tgHead"></header>' +
        '<aside class="tg-info" id="tgInfo" hidden></aside>' +
        '<div class="tg-body" id="tgBody"></div>' +
        '<div class="tg-replybar" id="tgReply" hidden></div>' +
        '<form class="tg-compose" id="tgForm">' +
          '<input type="file" id="tgFile" hidden multiple>' +
          '<button class="tg-ico" id="tgAttach" type="button" title="Fayl" aria-label="Fayl">' +
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round"><path d="M21.4 11.05 12.25 20.2a5.5 5.5 0 0 1-7.78-7.78l9.2-9.19a3.67 3.67 0 0 1 5.18 5.18l-9.2 9.2a1.83 1.83 0 0 1-2.6-2.6l8.5-8.48"/></svg>' +
          "</button>" +
          '<button class="tg-ico" id="tgEmoji" type="button" title="Emoji" aria-label="Emoji">' +
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">' +
            '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.2 4.2 0 0 0 7 0" stroke-linecap="round"/>' +
            '<circle cx="9" cy="9.5" r="1.1" fill="currentColor" stroke="none"/>' +
            '<circle cx="15" cy="9.5" r="1.1" fill="currentColor" stroke="none"/></svg>' +
          "</button>" +
          '<button class="tg-ico" id="tgLink" type="button" title="' + esc(t("link")) +
            '" aria-label="' + esc(t("link")) + '">' +
            '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" ' +
            'stroke-width="2" stroke-linecap="round">' +
            '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/>' +
            '<path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>' +
          "</button>" +
          '<input id="tgInput" autocomplete="off" placeholder="' + esc(t("ph")) + '">' +
          '<span class="tg-rec" id="tgRec" hidden><i></i><b id="tgRecT">0:00</b>' +
            '<button type="button" id="tgRecX">' + esc(t("cancel")) + "</button></span>" +
          '<button class="tg-ico tg-mic" id="tgMic" type="button" title="Ovoz" aria-label="Ovoz">' +
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round"><rect x="9" y="2" width="6" height="11" rx="3"/>' +
            '<path d="M5 11a7 7 0 0 0 14 0M12 18v4"/></svg>' +
          "</button>" +
          '<button class="tg-send" type="submit" aria-label="' + esc(t("send")) + '">' +
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>' +
          "</button>" +
        "</form>" +
        '<div class="tg-queue" id="tgQueue" hidden></div>' +
      "</section>" +
    "</div>";

  var $ = function (s) { return mount.querySelector(s); };

  /* ---- sending: text, attachments and voice all go the same way ---- */
  function send(text, attach) {
    if (!active) return Promise.resolve();
    var wasEmpty = !groups.some(function (g) { return g.id === active && g.count; });
    var payload = { op: "send", group: active, text: text || "", attach: attach || null };
    if (replyTo) { payload.reply = replyTo; setReply(null); }
    // over the socket the echo comes back as a "new" event
    if (wsSend(payload)) { if (wasEmpty) setTimeout(refreshList, 400); return Promise.resolve(true); }
    return api(payload).then(function (r) {
      if (!r || !r.ok) { note(t("failed"), true); return false; }
      thread = r.messages; paint(thread);
      if (wasEmpty) refreshList();
      return true;
    });
  }

  $("#tgForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var inp = $("#tgInput"), text = inp.value.trim();
    if (!text) return;
    if (editing) {
      var id = editing;
      cancelEdit();
      if (!wsSend({ op: "edit", group: active, id: id, text: text })) {
        api({ op: "edit", group: active, id: id, text: text }).then(reload);
      }
      return;
    }
    inp.value = "";
    send(text).then(function (ok) { if (!ok) inp.value = text; });
  });

  /* ---- files and images ---- */
  var fileInput = $("#tgFile"), queue = $("#tgQueue");
  $("#tgAttach").addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function () {
    var files = [].slice.call(fileInput.files || []);
    fileInput.value = "";
    files.forEach(function (f) {
      queue.hidden = false;
      var row = document.createElement("div");
      row.className = "tg-qrow";
      row.textContent = f.name + " — " + KGChat.humanSize(f.size);
      queue.appendChild(row);
      KGChat.fileToAttach(f).then(function (att) {
        return send("", att);
      }).then(function () {
        row.remove(); if (!queue.children.length) queue.hidden = true;
      }).catch(function (err) {
        row.classList.add("bad");
        row.textContent = f.name + " — " + (err.message === "too-large" ? t("too_big") : t("failed"));
        setTimeout(function () { row.remove(); if (!queue.children.length) queue.hidden = true; }, 4000);
      });
    });
  });

  /* ---- voice notes: press to start, press again to send ---- */
  var mic = $("#tgMic"), recBox = $("#tgRec"), recT = $("#tgRecT");
  var rec = KGChat.recorder(
    function (att) { send("", att); },
    function (sec) { recT.textContent = KGChat.clock(sec); },
    function () { note(t("mic_denied"), true); mic.classList.remove("on"); recBox.hidden = true; }
  );
  var micState = KGChat.recordState();
  if (micState !== "ok") mic.classList.add("blocked");
  mic.addEventListener("click", function () {
    /* Off a secure origin the browser removes the microphone API
       altogether, so say so and offer the https address rather than
       leaving the button silently missing. */
    if (micState === "insecure") { note(t("mic_https") + " " + KGChat.secureUrl(), true, KGChat.secureUrl()); return; }
    if (micState === "no") { note(t("mic_no"), true); return; }
    if (mic.classList.contains("on")) {           // second press → send
      mic.classList.remove("on"); recBox.hidden = true; rec.stop();
    } else {
      mic.classList.add("on"); recBox.hidden = false; recT.textContent = "0:00"; rec.start();
    }
  });
  $("#tgRecX").addEventListener("click", function () {
    mic.classList.remove("on"); recBox.hidden = true; rec.cancel();
  });

  KGChat.emojiPicker($("#tgEmoji"), $("#tgInput"), mount.querySelector(".tg-main"));
  /* select text in the box first and it becomes the link's label */
  KGChat.linkButton($("#tgLink"), $("#tgInput"),
    { url: t("link_url"), label: t("link_txt"), bad: t("link_bad") });

  /* one delegated listener for the whole thread */
  $("#tgBody").addEventListener("click", function (e) {
    var more = e.target.closest(".tg-more");
    if (more) {
      var msg = thread.filter(function (x) { return x.id === more.dataset.id; })[0];
      if (msg) openMenu(more, msg);
      return;
    }
    var chip = e.target.closest(".tg-react");
    if (chip) { act_react(chip.dataset.id, chip.dataset.e); return; }
    closeMenus();
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".tg-menu") && !e.target.closest(".tg-more")) closeMenus();
  });

  /* typing: tell the room, but no more than once every two seconds */
  var lastTyped = 0;
  $("#tgInput").addEventListener("input", function () {
    var now = Date.now();
    if (now - lastTyped > 2000 && active) { lastTyped = now; wsSend({ op: "typing", group: active }); }
  });
  $("#tgInput").addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (editing) cancelEdit(); else setReply(null); }
  });
  $("#tgSearch").addEventListener("input", function (e) {
    filter = e.target.value.trim().toLowerCase();
    paintList();
  });

  function note(msg, bad, href) {
    var b = $("#tgBody");
    if (!b) return;
    var p = document.createElement("p");
    p.className = "tg-note" + (bad ? " bad" : "");
    p.textContent = msg;
    if (href) {
      var a = document.createElement("a");
      a.href = href; a.className = "tg-note-link"; a.textContent = t("mic_open");
      p.appendChild(document.createElement("br")); p.appendChild(a);
    }
    b.appendChild(p);
    b.scrollTop = b.scrollHeight;
    setTimeout(function () { p.remove(); }, href ? 20000 : 6000);
  }

  function paintList() {
    var box = $("#tgList");
    var shown = groups.filter(function (g) {
      return !filter || roomTitle(g).toLowerCase().indexOf(filter) >= 0;
    });
    if (!shown.length) { box.innerHTML = '<p class="tg-note">' + esc(groups.length ? "—" : t("none")) + "</p>"; return; }
    box.innerHTML = shown.map(function (g) {
      var title = roomTitle(g);
      return '<button class="tg-room' + (g.id === active ? " on" : "") + '" data-g="' + esc(g.id) + '">' +
        '<span class="tg-av' + (g.id === "chairmen" ? " gold" : "") + (g.dm ? " dm" : "") + '">' +
          esc(initials(title)) + "</span>" +
        '<span class="tg-room-txt">' +
          '<span class="tg-room-top"><b>' + esc(title) + "</b>" +
            (g.time ? '<time>' + clock(g.time) + "</time>" : "") + "</span>" +
          '<span class="tg-room-sub">' +
            (g.last ? esc(g.lastFrom) + ": " + esc(g.last)
                    : g.members.length + " " + esc(t("members"))) +
          "</span>" +
        "</span></button>";
    }).join("");
    box.querySelectorAll(".tg-room").forEach(function (b) {
      b.addEventListener("click", function () { open(b.dataset.g); });
    });
  }

  function paint(messages) {
    // deleted messages never reach the renderer
    messages = (messages || []).filter(function (m) { return !m.deleted; });
    var body = $("#tgBody"), head = $("#tgHead");
    var g = groups.filter(function (x) { return x.id === active; })[0];
    if (!body || !g) return;

    var who = g.dm ? esc(t("dm_note")) : g.members.map(function (m) {
      return m.observer
        ? '<i class="tg-obs">' + esc(m.name) + " (" + esc(t("observer")) + ")</i>"
        : esc(m.name);
    }).join(", ");
    // The whole header is the way into the member list, as in Telegram.
    head.innerHTML =
      '<button class="tg-head-btn" id="tgHeadBtn"' + (g.dm ? " disabled" : "") + '>' +
        '<span class="tg-av' + (g.id === "chairmen" ? " gold" : "") + '">' + esc(initials(roomTitle(g))) + "</span>" +
        '<span class="tg-head-txt"><b>' + esc(roomTitle(g)) + "</b>" +
        '<span class="tg-head-sub">' + who + "</span></span>" +
        (g.dm ? "" : '<span class="tg-chev">›</span>') +
      "</button>";
    if (!g.dm) head.querySelector("#tgHeadBtn").addEventListener("click", function () { showInfo(g); });

    if (!messages || !messages.length) {
      body.innerHTML = '<p class="tg-note">' + esc(t("empty")) + "</p>";
      return;
    }
    var html = "", lastDay = "", lastWho = "";
    messages.forEach(function (m) {
      var k = dayKey(m.time);
      if (k !== lastDay) {
        html += '<div class="tg-day"><span>' + esc(dayLabel(m.time)) + "</span></div>";
        lastDay = k; lastWho = "";
      }
      var mine = me && m.from === me.type && m.fromName === me.name;
      var sameSpeaker = lastWho === m.from + "|" + m.fromName;
      lastWho = m.from + "|" + m.fromName;
      // a deleted message is simply gone
      if (m.deleted) { lastWho = ""; return; }
      var att = m.att ? KGChat.renderAttachment(m.att) : "";
      var reacts = "";
      if (m.reactions) {
        var keys = Object.keys(m.reactions);
        if (keys.length) {
          reacts = '<span class="tg-reacts">' + keys.map(function (k) {
            var who = m.reactions[k];
            var byMe = me && who.some(function (w) { return String(w.id) === String(me.id); });
            return '<button class="tg-react' + (byMe ? " on" : "") + '" data-id="' + esc(m.id) +
                   '" data-e="' + esc(k) + '" title="' + esc(who.map(function (w) { return w.name; }).join(", ")) +
                   '">' + k + "<b>" + who.length + "</b></button>";
          }).join("") + "</span>";
        }
      }
      // ticks only on your own messages: one when sent, two once read
      var ticks = "";
      if (mine) {
        var readers = (m.readBy || []).filter(function (r) { return String(r.id) !== String(me.id); });
        ticks = '<span class="tg-ticks' + (readers.length ? " seen" : "") + '" title="' +
          (readers.length ? esc(t("read_by")) + ": " + esc(readers.map(function (r) { return r.name; }).join(", ")) : "") +
          '">' + (readers.length ? "✓✓" : "✓") + "</span>";
      }
      var quote = m.reply ? '<span class="tg-quote"><b>' + esc(m.reply.name) + "</b>" +
        esc(String(m.reply.text || "").slice(0, 90)) + "</span>" : "";

      html += '<div class="tg-msg' + (mine ? " mine" : "") + (sameSpeaker ? " cont" : "") +
        (m.att && m.att.kind === "image" ? " has-img" : "") + '" data-id="' + esc(m.id) + '">' +
        (mine || sameSpeaker ? "" :
          '<span class="tg-from">' + esc(m.fromName) +
          '<i class="tg-role tg-' + esc(m.from) + '">' + esc(m.from) + "</i></span>") +
        quote + att +
        (m.text ? '<span class="tg-text">' + KGChat.linkify(m.text) + "</span>" : "") +
        '<span class="tg-meta">' +
          (m.edited ? '<i class="tg-edited">' + esc(t("edited")) + "</i>" : "") +
          '<span class="tg-time">' + clock(m.time) + "</span>" + ticks +
        "</span>" + reacts +
        '<button class="tg-more" data-id="' + esc(m.id) + '" aria-label="…">⋯</button>' +
        "</div>";
    });
    body.innerHTML = html;
    KGChat.bindVoice(body);
    KGChat.bindImages(body, function () {
      return thread.filter(function (m) { return !m.deleted && m.att && m.att.kind === "image"; })
        .map(function (m) {
          return { url: m.att.url, name: m.att.name, from: m.fromName, time: m.time };
        });
    });
    body.scrollTop = body.scrollHeight;
  }

  /* Member list for the open room. Clicking anyone but yourself opens
     the direct chat with them — the room id is derived from the two
     ids, sorted, so both sides land in the same place. */
  function showInfo(g) {
    var box = $("#tgInfo");
    box.hidden = false;
    box.innerHTML =
      '<div class="tg-info-top"><b>' + esc(t("info")) + " · " + g.members.length + "</b>" +
        '<button class="tg-info-x" id="tgInfoX" aria-label="' + esc(t("close")) + '">✕</button></div>' +
      '<div class="tg-info-list">' + g.members.map(function (m) {
        var self = me && String(m.id) === String(me.id);
        return '<button class="tg-person" data-id="' + esc(m.id) + '" data-name="' + esc(m.name) + '"' +
          (self ? " disabled" : "") + '>' +
          '<span class="tg-av' + (m.observer ? " gold" : "") + '">' + esc(initials(m.name)) + "</span>" +
          '<span class="tg-person-txt"><b>' + esc(m.name) + (self ? " (" + esc(t("you")) + ")" : "") + "</b>" +
            '<span class="tg-person-sub">' + esc(m.role) +
            (m.observer ? " · " + esc(t("observer")) : "") + "</span></span>" +
          (self ? "" : '<span class="tg-person-go" title="' + esc(t("write")) + '">✎</span>') +
          "</button>";
      }).join("") + "</div>";
    box.querySelector("#tgInfoX").addEventListener("click", function () { box.hidden = true; });
    box.querySelectorAll(".tg-person:not([disabled])").forEach(function (b) {
      b.addEventListener("click", function () {
        box.hidden = true;
        openDm(b.dataset.id, b.dataset.name);
      });
    });
  }

  /* A DM room only exists once someone writes in it, so until then it
     is added to the list locally to give the thread something to show. */
  function openDm(otherId, otherName) {
    var gid = "dm:" + [String(me.id), String(otherId)].sort().join("|");
    if (!groups.some(function (x) { return x.id === gid; })) {
      groups.unshift({ id: gid, title: otherName, dm: true, count: 0, last: "", lastFrom: "", time: 0,
        members: [{ id: me.id, role: me.type, name: me.name }, { id: otherId, role: "", name: otherName }] });
    }
    open(gid);
  }

  function open(gid) {
    active = gid;
    $("#tgInfo").hidden = true;
    paintList();
    mount.querySelector(".tg").classList.add("open");   // mobile: show the thread
    api({ op: "thread", group: gid }).then(function (r) {
      if (dead || !r || !r.ok) return;
      me = r.me || me;
      thread = r.messages || [];
      paint(thread);
      markRead();
    });
  }

  /* ---- realtime ---------------------------------------------------
     The socket carries everything: new messages, edits, deletes,
     reactions, read receipts and typing. Polling stays only as the
     fallback for a browser that cannot open one, and it backs off to
     a slow interval instead of driving the UI. */
  var sock = null, sockReady = false, retry = 0, typingTimer = null;

  function connect() {
    if (dead) return;
    var proto = location.protocol === "https:" ? "wss://" : "ws://";
    try { sock = new WebSocket(proto + location.host + "/ws"); }
    catch (e) { return fallbackPoll(); }

    sock.addEventListener("open", function () {
      retry = 0;
      sock.send(JSON.stringify(Object.assign({ op: "auth" }, creds)));
    });
    sock.addEventListener("message", function (e) {
      var m = null;
      try { m = JSON.parse(e.data); } catch (err) { return; }
      onSocket(m);
    });
    sock.addEventListener("close", function () {
      sockReady = false;
      if (dead) return;
      // exponential back-off, capped, then keep trying quietly
      retry = Math.min(retry + 1, 6);
      setTimeout(connect, 500 * Math.pow(2, retry));
    });
    sock.addEventListener("error", function () { try { sock.close(); } catch (e) {} });
  }

  function wsSend(obj) {
    if (sock && sockReady && sock.readyState === 1) { sock.send(JSON.stringify(obj)); return true; }
    return false;
  }

  function onSocket(m) {
    if (m.op === "auth") { sockReady = !!m.ok; if (m.ok) markRead(); return; }
    if (m.op === "error") { if (m.error !== "forbidden") note(m.error, true); return; }
    if (m.group !== active) { if (m.op === "new") refreshList(); return; }

    if (m.op === "new") {
      thread.push(m.msg);
      paint(thread);
      markRead();
      refreshList();
      return;
    }
    if (m.op === "delete") {
      thread = thread.filter(function (x) { return x.id !== m.msg.id; });
      paint(thread); refreshList();
      return;
    }
    if (m.op === "edit" || m.op === "react") {
      var i = thread.findIndex(function (x) { return x.id === m.msg.id; });
      if (i >= 0) { thread[i] = m.msg; paint(thread); }
      return;
    }
    if (m.op === "read") {
      m.ids.forEach(function (id) {
        var x = thread.filter(function (y) { return y.id === id; })[0];
        if (!x) return;
        x.readBy = x.readBy || [];
        if (!x.readBy.some(function (r) { return String(r.id) === String(m.by.id); })) x.readBy.push(m.by);
      });
      paint(thread);
      return;
    }
    if (m.op === "typing") {
      showTyping(m.who);
      return;
    }
  }

  /* Only used when the socket cannot be opened at all. */
  function fallbackPoll() {
    timer = setInterval(function () {
      if (dead || !active || document.hidden || sockReady) return;
      api({ op: "thread", group: active }).then(function (r) {
        if (!dead && r && r.ok) { thread = r.messages; paint(thread); }
      });
    }, 8000);
  }

  var typingBox = null;
  function showTyping(who) {
    var body = $("#tgBody");
    if (!body) return;
    if (!typingBox) {
      typingBox = document.createElement("div");
      typingBox.className = "tg-typing";
      body.appendChild(typingBox);
    }
    typingBox.innerHTML = "<i></i><i></i><i></i><span>" + esc(who) + " " + esc(t("typing")) + "</span>";
    typingBox.hidden = false;
    body.scrollTop = body.scrollHeight;
    clearTimeout(typingTimer);
    typingTimer = setTimeout(function () { if (typingBox) typingBox.hidden = true; }, 2600);
  }

  /* ---- acting on a message: reply, react, edit, delete ------------- */
  var QUICK = ["👍", "❤️", "🔥", "👏", "😂", "🙏"];

  function closeMenus() {
    mount.querySelectorAll(".tg-menu").forEach(function (x) { x.remove(); });
  }

  /* The menu is anchored to the message bubble, so on a narrow column — or
     inside the panel's embedded chat — it can hang past the edge of the
     scrolling area and get clipped. Nudge it back into view, and flip it
     above the message when there is no room below. */
  function fitMenu(el) {
    var box = mount.querySelector(".tg-body") || mount;
    if (!box) return;
    var b = box.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    var PAD = 8;

    var dx = 0;
    if (r.width <= b.width - PAD * 2) {
      if (r.left < b.left + PAD) dx = (b.left + PAD) - r.left;
      else if (r.right > b.right - PAD) dx = (b.right - PAD) - r.right;
    } else {
      // genuinely wider than the column: pin to the left edge and let it wrap
      dx = (b.left + PAD) - r.left;
      el.style.maxWidth = Math.round(b.width - PAD * 2) + "px";
    }
    if (dx) el.style.transform = "translateX(" + Math.round(dx) + "px)";

    r = el.getBoundingClientRect();
    if (r.bottom > b.bottom - PAD && r.height < b.height) {
      el.style.top = "auto";
      el.style.bottom = "24px";           // open upwards instead
    }
  }

  function openMenu(btn, m) {
    closeMenus();
    var mine = me && String(m.fromId) === String(me.id);
    var mod = me && (me.type === "admin" || me.type === "rais");
    var el = document.createElement("div");
    el.className = "tg-menu";
    el.innerHTML =
      '<div class="tg-menu-quick">' + QUICK.map(function (e) {
        return '<button data-act="react" data-e="' + e + '">' + e + "</button>";
      }).join("") + "</div>" +
      '<button data-act="reply">' + esc(t("reply")) + "</button>" +
      (mine ? '<button data-act="edit">' + esc(t("edit")) + "</button>" : "") +
      (mine || mod ? '<button data-act="del" class="bad">' + esc(t("del")) + "</button>" : "");
    btn.parentNode.appendChild(el);
    fitMenu(el);
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var act = b.dataset.act;
      closeMenus();
      if (act === "react") act_react(m.id, b.dataset.e);
      if (act === "reply") setReply({ id: m.id, name: m.fromName, text: m.text || (m.att ? m.att.name : "") });
      if (act === "edit") startEdit(m);
      if (act === "del") act_delete(m.id);
    });
  }

  function act_react(id, emoji) {
    if (!wsSend({ op: "react", group: active, id: id, emoji: emoji })) {
      api({ op: "react", group: active, id: id, emoji: emoji }).then(reload);
    }
  }
  async function act_delete(id) {
    if (!await UI.confirm(t("del_ask"), { tone: "danger" })) return;
    if (!wsSend({ op: "delete", group: active, id: id })) {
      api({ op: "delete", group: active, id: id }).then(reload);
    }
  }
  function reload() {
    api({ op: "thread", group: active }).then(function (r) {
      if (r && r.ok) { thread = r.messages; paint(thread); }
    });
  }

  /* Editing reuses the composer: the text goes back into the box and
     the next submit updates instead of sending. */
  var editing = null;
  function startEdit(m) {
    editing = m.id;
    var inp = $("#tgInput");
    inp.value = m.text || "";
    inp.focus();
    mount.querySelector(".tg-compose").classList.add("editing");
    setReply(null);
  }
  function cancelEdit() {
    editing = null;
    $("#tgInput").value = "";
    mount.querySelector(".tg-compose").classList.remove("editing");
  }

  /** The quoted message shown above the composer while replying. */
  function setReply(r) {
    replyTo = r;
    var bar = $("#tgReply");
    if (!bar) return;
    if (!r) { bar.hidden = true; bar.innerHTML = ""; return; }
    bar.hidden = false;
    bar.innerHTML = '<span><b>' + esc(r.name) + "</b>" + esc(String(r.text || "").slice(0, 80)) + "</span>" +
                    '<button type="button" id="tgReplyX">✕</button>';
    bar.querySelector("#tgReplyX").addEventListener("click", function () { setReply(null); });
  }

  /** Tell the room we have seen everything currently on screen. */
  function markRead() {
    if (!active || !thread.length) return;
    var last = thread[thread.length - 1];
    if (!last || !last.id) return;
    if (!wsSend({ op: "read", group: active, id: last.id })) {
      api({ op: "read", group: active, id: last.id });
    }
  }

  /** Re-read the room list, keeping any locally-opened empty DM. */
  function refreshList() {
    return api({ op: "list" }).then(function (r) {
      if (dead || !r || !r.ok) return;
      me = r.me;
      var fresh = r.groups || [];
      groups.forEach(function (g) {                       // keep unsent DMs visible
        if (g.dm && !g.count && !fresh.some(function (x) { return x.id === g.id; })) fresh.unshift(g);
      });
      groups = fresh;
      paintList();
    });
  }

  api({ op: "list" }).then(function (r) {
    if (dead) return;
    if (!r || !r.ok) { $("#tgList").innerHTML = '<p class="tg-note bad">' + esc(t("failed")) + "</p>"; return; }
    me = r.me;
    groups = r.groups || [];
    paintList();
    if (!groups.length) { $("#tgBody").innerHTML = '<p class="tg-note">' + esc(t("none")) + "</p>"; return; }
    open(groups[0].id);
    connect();
    fallbackPoll();
  });

  return { destroy: function () { dead = true; if (timer) clearInterval(timer); if (sock) try { sock.close(); } catch (e) {} } };
}
