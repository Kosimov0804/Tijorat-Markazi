/* ============================================================
   Shared client runtime for the three market pages.
   Loaded after data.js (which supplies LANGS, T, ICON_SUN/MOON)
   and before bozor.js / moliya.js / mehnat.js.

   Holds what all three need and nothing a single page owns:
   chrome (theme, language, burger), the fetch wrapper, identity,
   and the render primitives the design system is built from.
   ============================================================ */
const MK = (() => {

/* ---------- language + dom ---------- */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/** Page-local strings live in a per-page dictionary merged over the global T. */
let DICT = {};
const t = (key, fallback) => {
  const row = DICT[key] || (typeof T !== "undefined" ? T[key] : null);
  return row ? row[L()] : (fallback != null ? fallback : key);
};
const setDict = d => { DICT = d || {}; };

/* ---------- escaping ---------- */
const esc = s => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escA = s => esc(s).replace(/"/g, "&quot;");
const safeUrl = u => /^https?:\/\//i.test(String(u || "")) ? String(u) : "";

/* ---------- numbers ---------- */
const LOCALE = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };
function num(n, digits){
  const v = Number(n);
  if(!Number.isFinite(v)) return "—";
  return v.toLocaleString(LOCALE[LANG] || "en-US", {
    minimumFractionDigits: digits || 0, maximumFractionDigits: digits == null ? 2 : digits });
}
/** Big sums stay readable: 3 200 000 000 UZS → "3.2 mlrd UZS". */
function money(n, cur){
  const v = Number(n);
  if(!Number.isFinite(v) || !v) return "—";
  const c = cur ? " " + esc(cur) : "";
  const unit = { uz: ["mln", "mlrd"], ru: ["млн", "млрд"], en: ["M", "B"] }[LANG] || ["M", "B"];
  if(Math.abs(v) >= 1e9) return num(v / 1e9, 2) + " " + unit[1] + c;
  if(Math.abs(v) >= 1e6) return num(v / 1e6, 2) + " " + unit[0] + c;
  return num(v) + c;
}
const pctTxt = n => (Number.isFinite(Number(n)) ? num(n, 0) + "%" : "—");
const day = ts => { const d = new Date(Number(ts) || 0);
  return Number.isFinite(d.getTime()) && ts ? d.toLocaleDateString(LOCALE[LANG] || "en-US") : "—"; };

/* ---------- fetch ---------- */
async function api(path, body){
  try{
    const opt = body
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      : undefined;
    const r = await fetch(path, opt);
    const j = await r.json().catch(() => ({ error: "bad_response" }));
    return j;
  }catch(e){ return { error: "network" }; }
}
const qs = o => Object.entries(o || {})
  .filter(([, v]) => v !== "" && v != null && v !== false)
  .map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v)).join("&");

/* ---------- identity ----------
   Company credentials are kept for the session only (sessionStorage), so a
   shared machine does not leave a seller cabinet unlocked. The e-mail
   identity is not a credential and persists like the language choice. */
const ident = {
  company(){ try { return JSON.parse(sessionStorage.getItem("mk_co") || "null"); } catch(e){ return null; } },
  setCompany(c){ c ? sessionStorage.setItem("mk_co", JSON.stringify(c)) : sessionStorage.removeItem("mk_co"); },
  email(){ return localStorage.getItem("mk_email") || ""; },
  name(){ return localStorage.getItem("mk_name") || ""; },
  setPerson(email, name){
    if(email) localStorage.setItem("mk_email", email); else localStorage.removeItem("mk_email");
    if(name) localStorage.setItem("mk_name", name);
  },
  /** Credentials to attach to a request that needs a company. */
  co(extra){
    const c = ident.company();
    return Object.assign({}, extra || {}, c ? { login: c.login, password: c.password } : {});
  },
  /** Identity to attach to a request that accepts a person. */
  me(extra){
    return Object.assign({}, extra || {}, { email: ident.email(), name: ident.name() });
  },
};

/** Sign in with the same company credentials company.html issues. */
async function companyLogin(login, password){
  const r = await api("/api/company/login", { login, password });
  if(!r || !r.ok) return { error: (r && r.error) || "invalid" };
  ident.setCompany({ login, password, id: r.company.id, name: r.company.name, sector: r.company.sector });
  return { ok: true, company: r.company };
}

/* ---------- render primitives ---------- */
const chip = (label, kind) => `<span class="mk-chip${kind ? " is-" + kind : ""}">${esc(label)}</span>`;
const chips = (list, kind) => `<div class="mk-chips">${(list || []).map(x => chip(x, kind)).join("")}</div>`;

/** Score dial + the reasons and gaps behind it — never a bare number. */
function match(m, title, extra){
  const why = (m.reasons || []).slice(0, 4).map(r => `<li>${esc(r)}</li>`).join("")
    + (m.gaps || []).slice(0, 3).map(g => `<li class="is-gap">${esc(g)}</li>`).join("");
  return `<div class="mk-match">
    <div class="mk-dial" style="--v:${Math.max(0, Math.min(100, m.score || 0))}"><b>${num(m.score || 0, 0)}</b></div>
    <div>
      ${title ? `<div class="mk-h">${title}</div>` : ""}
      <ul class="mk-why">${why || `<li class="is-gap">${esc(t("mk_no_reason", "Izoh yo'q"))}</li>`}</ul>
      ${extra || ""}
      <div class="mk-conf">${esc(t("mk_conf", "Ishonchlilik"))}: ${num(m.confidence || 0, 0)}%</div>
    </div>
  </div>`;
}

/** Readiness blocks: percentage bars with the missing step spelled out. */
function meters(blocks){
  return `<div class="mk-meters">${(blocks || []).map(b => {
    const p = b.pct != null ? b.pct : (b.ok ? 100 : 0);
    return `<div class="mk-meter">
      <b>${esc(b.key)}<span>${p}%</span></b>
      <div class="mk-bar"><i style="width:${p}%"></i></div>
      ${b.hint ? `<em>${esc(b.hint)}</em>` : ""}
    </div>`;
  }).join("")}</div>`;
}

/** Ranked bars — the label, its count, and a proportional rule underneath. */
function ranks(rows, opts){
  const o = opts || {};
  const key = o.value || "n", label = o.label || "label";
  const list = (rows || []).slice(0, o.limit || 8);
  if(!list.length) return `<p class="mk-loading">${esc(t("mk_nodata", "Ma'lumot yo'q"))}</p>`;
  const max = Math.max.apply(null, list.map(r => Number(r[key]) || 0)) || 1;
  return `<div class="mk-ranks">${list.map(r => {
    const v = Number(r[key]) || 0;
    return `<div class="mk-rank${o.gap ? " is-gap" : ""}">
      <span title="${escA(r[label])}">${esc(r[label])}</span>
      <b>${o.fmt ? o.fmt(r) : num(v, o.digits == null ? 0 : o.digits)}</b>
      <i style="width:${Math.max(2, Math.round(100 * v / max))}%"></i>
    </div>`;
  }).join("")}</div>`;
}

const kpi = (value, label, opts) => {
  const o = opts || {};
  return `<div class="mk-kpi${o.hero ? " is-hero" : ""}">
    <b>${value}</b><span>${esc(label)}</span>${o.note ? `<em>${esc(o.note)}</em>` : ""}</div>`;
};

const funnel = steps => `<div class="mk-funnel">${steps.map(s =>
  `<div><b>${num(s.n, 0)}</b><span>${esc(s.label)}</span></div>`).join("")}</div>`;

/** Horizontal stage rail with everything before `current` marked done. */
function rail(steps, current, labels){
  const i = steps.indexOf(current);
  return `<div class="mk-railbar">${steps.map((s, k) => {
    const cls = k < i ? "is-done" : k === i ? "is-now" : "";
    const sub = labels && labels[s] ? `<small>${esc(labels[s])}</small>` : "";
    return `<div class="mk-step ${cls}">${esc(t("stage_" + s, s))}${sub}</div>`;
  }).join("")}</div>`;
}

/** A finished AI draft, always shown with its review notice and assumptions. */
function draft(res, rows){
  if(!res || !res.ok) return `<p class="mk-msg is-err">${esc(aiError(res))}</p>`;
  const d = res.data || {};
  const body = rows.map(r => {
    const v = r.get(d);
    if(v == null || v === "" || (Array.isArray(v) && !v.length)) return "";
    return `<dt>${esc(r.label)}</dt><dd>${r.html ? v : esc(Array.isArray(v) ? v.join(", ") : v)}</dd>`;
  }).join("");
  const assume = (d.assumptions || []).map(a =>
    `<li><b style="display:inline;text-transform:none;letter-spacing:0">${esc(a.field)}:</b> ${esc(a.assumed)} — <i>${esc(a.why)}</i></li>`).join("");
  const missing = (d.missing || []).map(m => `<li>${esc(m)}</li>`).join("");
  const expert = (d.expertReview || []).map(m => `<li>${esc(m)}</li>`).join("");
  return `<div class="mk-draft">
    <div class="mk-draft-note">⚠ ${esc(res.review || "")}</div>
    <dl class="mk-kv">${body}</dl>
    ${assume ? `<div class="mk-assume"><b>${esc(t("mk_assumptions", "AI taxminlari"))}</b><ul>${assume}</ul></div>` : ""}
    ${missing ? `<div class="mk-assume"><b>${esc(t("mk_missing", "To'ldirilishi kerak"))}</b><ul>${missing}</ul></div>` : ""}
    ${expert ? `<div class="mk-assume"><b>${esc(t("mk_expert", "Ekspert ko'rigi kerak"))}</b><ul>${expert}</ul></div>` : ""}
  </div>`;
}

function aiError(res){
  const code = (res && res.error) || "unknown";
  if(res && res.limit) return t("mk_ai_limit", "Bepul AI limiti tugadi.");
  if(code === "ai_off") return t("mk_ai_off", "AI hozircha yoqilmagan.");
  if(code === "identify_first") return t("mk_ai_id", "Avval email kiriting yoki kompaniya sifatida kiring.");
  return t("mk_ai_err", "AI javob bermadi. Qayta urinib ko'ring.");
}

const empty = msg => `<p class="mk-empty">${esc(msg)}</p>`;
const loading = () => `<p class="mk-loading">${esc(t("mk_loading", "Yuklanmoqda…"))}</p>`;

/** Inline result line under a form. */
function say(el, message, kind){
  if(!el) return;
  el.className = "mk-msg is-" + (kind || "ok");
  el.textContent = message;
  el.hidden = false;
}

/* ---------- tabs ---------- */
function tabs(root, onChange){
  const bar = $(root);
  if(!bar) return;
  bar.addEventListener("click", e => {
    const b = e.target.closest(".mk-tab");
    if(!b) return;
    $$(".mk-tab", bar).forEach(x => x.classList.toggle("is-on", x === b));
    $$("[data-panel]").forEach(p => { p.hidden = p.dataset.panel !== b.dataset.tab; });
    if(onChange) onChange(b.dataset.tab);
  });
}

/** Segmented control: returns the chosen value through the callback. */
function segment(root, onChange){
  const bar = $(root);
  if(!bar) return;
  bar.addEventListener("click", e => {
    const b = e.target.closest("button");
    if(!b) return;
    $$("button", bar).forEach(x => x.classList.toggle("is-on", x === b));
    if(onChange) onChange(b.dataset.value || "");
  });
}

/* ---------- drawer ---------- */
function drawer(html, title){
  let d = $("#mkDrawer");
  if(!d){
    d = document.createElement("div");
    d.id = "mkDrawer"; d.className = "mk-drawer";
    d.innerHTML = `<div class="mk-drawer-bg" data-close></div>
      <aside class="mk-drawer-panel" role="dialog" aria-modal="true">
        <div class="mk-drawer-head"><h2 id="mkDrawerTitle"></h2>
          <button class="mk-x" type="button" data-close aria-label="Yopish">×</button></div>
        <div id="mkDrawerBody"></div>
      </aside>`;
    document.body.appendChild(d);
    d.addEventListener("click", e => { if(e.target.closest("[data-close]")) closeDrawer(); });
    document.addEventListener("keydown", e => { if(e.key === "Escape") closeDrawer(); });
  }
  $("#mkDrawerTitle", d).textContent = title || "";
  $("#mkDrawerBody", d).innerHTML = html;
  d.classList.add("is-open");
  document.body.style.overflow = "hidden";
  return d;
}
function closeDrawer(){
  const d = $("#mkDrawer");
  if(d) d.classList.remove("is-open");
  document.body.style.overflow = "";
}

/* ---------- page chrome ---------- */
function applyStatic(){
  $$("[data-i18n]").forEach(n => { const v = t(n.dataset.i18n, null); if(v !== n.dataset.i18n) n.textContent = v; });
  $$("[data-i18n-html]").forEach(n => { const v = t(n.dataset.i18nHtml, null); if(v !== n.dataset.i18nHtml) n.innerHTML = v; });
  $$("[data-i18n-ph]").forEach(n => { const v = t(n.dataset.i18nPh, null); if(v !== n.dataset.i18nPh) n.placeholder = v; });
}

/** Wire theme/lang/burger exactly as the rest of the site does. */
function chrome(onLang){
  const themeBtn = $("#themeBtn");
  const setTheme = th => {
    document.documentElement.dataset.theme = th;
    localStorage.setItem("kg_theme", th);
    if(themeBtn) themeBtn.innerHTML = th === "dark" ? ICON_SUN : ICON_MOON;
  };
  if(themeBtn) themeBtn.addEventListener("click", () =>
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  setTheme(localStorage.getItem("kg_theme") || "light");

  const langBtn = $("#langBtn");
  if(langBtn){
    langBtn.textContent = LANG.toUpperCase();
    langBtn.addEventListener("click", () => {
      LANG = LANGS[(L() + 1) % LANGS.length];
      localStorage.setItem("kg_lang", LANG);
      document.documentElement.lang = LANG;
      langBtn.textContent = LANG.toUpperCase();
      applyStatic();
      if(onLang) onLang();
    });
  }
  const burger = $("#burger"), nav = $("#nav");
  if(burger && nav){
    burger.addEventListener("click", () => nav.classList.toggle("open"));
    $$("a", nav).forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
  }
  document.documentElement.lang = LANG;
  applyStatic();
}

return { L, lang: () => LANG, $, $$, t, setDict, esc, escA, safeUrl, num, money, pctTxt, day,
  api, qs, ident, companyLogin, chip, chips, match, meters, ranks, kpi, funnel, rail,
  draft, aiError, empty, loading, say, tabs, segment, drawer, closeDrawer, applyStatic, chrome };
})();
