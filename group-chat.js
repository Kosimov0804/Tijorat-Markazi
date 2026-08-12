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

  var api = function (body) {
    var p = {};
    for (var k in creds) p[k] = creds[k];
    for (var j in body) p[j] = body[j];
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
        '<form class="tg-compose" id="tgForm">' +
          '<input id="tgInput" autocomplete="off" placeholder="' + esc(t("ph")) + '">' +
          '<button class="tg-send" type="submit" aria-label="' + esc(t("send")) + '">' +
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>' +
          "</button>" +
        "</form>" +
      "</section>" +
    "</div>";

  var $ = function (s) { return mount.querySelector(s); };

  $("#tgForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var inp = $("#tgInput"), text = inp.value.trim();
    if (!text || !active) return;
    inp.value = "";
    var wasEmpty = !groups.some(function (g) { return g.id === active && g.count; });
    api({ op: "send", group: active, text: text }).then(function (r) {
      if (!r || !r.ok) { inp.value = text; note(t("failed"), true); return; }
      paint(r.messages);
      // The first message in a DM is what creates it server-side, so the
      // room list is re-read once to pick it up properly.
      if (wasEmpty) refreshList();
    });
  });
  $("#tgSearch").addEventListener("input", function (e) {
    filter = e.target.value.trim().toLowerCase();
    paintList();
  });

  function note(msg, bad) {
    var b = $("#tgBody");
    if (!b) return;
    var p = document.createElement("p");
    p.className = "tg-note" + (bad ? " bad" : "");
    p.textContent = msg;
    b.appendChild(p);
    b.scrollTop = b.scrollHeight;
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
      html += '<div class="tg-msg' + (mine ? " mine" : "") + (sameSpeaker ? " cont" : "") + '">' +
        (mine || sameSpeaker ? "" :
          '<span class="tg-from">' + esc(m.fromName) +
          '<i class="tg-role tg-' + esc(m.from) + '">' + esc(m.from) + "</i></span>") +
        '<span class="tg-text">' + esc(m.text) + "</span>" +
        '<span class="tg-time">' + clock(m.time) + "</span>" +
        "</div>";
    });
    body.innerHTML = html;
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
      paint(r.messages);
    });
  }

  /* Other members post too, so the open room is re-read on a slow
     interval — paused while the tab is hidden. */
  function poll() {
    timer = setInterval(function () {
      if (dead || !active || document.hidden) return;
      api({ op: "thread", group: active }).then(function (r) {
        if (!dead && r && r.ok) paint(r.messages);
      });
    }, 10000);
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
    poll();
  });

  return { destroy: function () { dead = true; if (timer) clearInterval(timer); } };
}
