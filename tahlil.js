/* ============================================================
   TAHLIL PANELI — the data analyst's cabinet.

   Read-only by construction: every endpoint it calls returns
   aggregates, and nothing here can write. Four views, each
   answering a different question:

     Umumiy    what does the whole platform look like right now
     Segmentlar  which slice of it is moving
     Dinamika  how has that slice moved over time
     Hisobotlar  give me that as a file

   It reuses the cabinet shell the other panels use, so an
   analyst who has seen the association panel already knows it.
   ============================================================ */
(() => {
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const T = Object.assign({}, typeof T_ANALYST !== "undefined" ? T_ANALYST : {});
const t = k => (T[k] ? T[k][L()] : k);

const esc = s => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escA = s => esc(s).replace(/"/g, "&quot;");
const LOCALE = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };
const num = (n, d) => Number.isFinite(Number(n))
  ? Number(n).toLocaleString(LOCALE[LANG] || "en-US",
      { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 1 : d })
  : "—";
function money(n){
  const v = Number(n);
  if(!Number.isFinite(v) || !v) return "—";
  const u = { uz: ["mln", "mlrd"], ru: ["млн", "млрд"], en: ["M", "B"] }[LANG] || ["M", "B"];
  if(Math.abs(v) >= 1e9) return num(v / 1e9, 2) + " " + u[1];
  if(Math.abs(v) >= 1e6) return num(v / 1e6, 2) + " " + u[0];
  return num(v, 0);
}
const pct = n => (n == null || !Number.isFinite(Number(n))) ? "—" : num(n, 0) + "%";

let creds = null, me = null, meta = null;
let view = "overview", DAYS = 90;
let SEG = { module: "bozor", dimension: "" };
let TREND = { module: "bozor", metric: "", bucket: "week" };

try { creds = JSON.parse(sessionStorage.getItem("kg_an") || "null"); } catch(e){ creds = null; }

const api = (path, extra) => fetch("/api/analyst/" + path, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify(Object.assign({}, creds || {}, { days: DAYS }, extra || {})),
}).then(r => r.json()).catch(() => ({ error: "network" }));

/* ---------- shell ---------- */
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
  stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const NAV = [
  { v: "overview", k: "an_nav_overview", ic: svg('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>') },
  { v: "segments", k: "an_nav_segments", ic: svg('<path d="M3 12h18M3 6h18M3 18h10"/>') },
  { v: "trends",   k: "an_nav_trends",   ic: svg('<path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>') },
  { v: "reports",  k: "an_nav_reports",  ic: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8"/>') },
];

function buildNav(){
  const nav = $("#anNav");
  nav.innerHTML = "";
  NAV.forEach(n => {
    const b = document.createElement("button");
    b.className = n.v === view ? "active" : "";
    b.innerHTML = n.ic + `<span>${esc(t(n.k))}</span>`;
    b.addEventListener("click", () => { view = n.v; buildNav(); render(); });
    nav.appendChild(b);
  });
}

function periodBar(){
  $("#anPeriod").innerHTML = [30, 90, 180, 365].map(d =>
    `<button type="button" class="an-per${d === DAYS ? " is-on" : ""}" data-days="${d}">${d}${esc(t("an_days"))}</button>`).join("");
}

/* ---------- primitives ---------- */
const kpi = (v, label, note) => `<div class="an-kpi"><b>${v}</b><span>${esc(label)}</span>${
  note ? `<em>${esc(note)}</em>` : ""}</div>`;

function bars(rows, opts){
  const o = opts || {};
  if(!rows || !rows.length) return `<p class="co-sub">${esc(t("an_nodata"))}</p>`;
  const max = Math.max.apply(null, rows.map(r => Number(r[o.value || "n"]) || 0)) || 1;
  return `<div class="an-bars">${rows.slice(0, o.limit || 12).map(r => {
    const v = Number(r[o.value || "n"]) || 0;
    return `<div class="an-bar">
      <span title="${escA(r.label)}">${esc(r.label)}</span>
      <b>${o.fmt ? o.fmt(r) : num(v, 0)}</b>
      <i style="width:${Math.max(2, Math.round(100 * v / max))}%"></i>
    </div>`;
  }).join("")}</div>`;
}

/** A compact column chart drawn as inline SVG — no chart library, no CDN.
    Empty buckets are left empty rather than drawn as hairlines: a row of
    1px stubs reads as a dotted rule and hides where the data actually is. */
function spark(points, label){
  if(!points || !points.length) return `<p class="co-sub">${esc(t("an_nodata"))}</p>`;
  const max = Math.max.apply(null, points.map(p => p.n)) || 1;
  const w = 100 / points.length;
  const cols = points.map((p, i) => {
    if(!p.n) return "";
    const h = Math.max(2, (p.n / max) * 86);
    return `<rect x="${(i * w + w * 0.15).toFixed(2)}" y="${(94 - h).toFixed(2)}"
      width="${Math.max(0.6, w * 0.7).toFixed(2)}" height="${h.toFixed(2)}" rx="0.5"><title>${
      esc(new Date(p.to).toLocaleDateString(LOCALE[LANG] || "en-US"))}: ${p.n}</title></rect>`;
  }).join("");
  const from = new Date(points[0].from).toLocaleDateString(LOCALE[LANG] || "en-US");
  const to = new Date(points[points.length - 1].to).toLocaleDateString(LOCALE[LANG] || "en-US");
  return `<figure class="an-chart" role="img" aria-label="${escA(label || "")}">
    <div class="an-chart-wrap">
      <span class="an-chart-max">${num(max, 0)}</span>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line class="an-axis" x1="0" y1="94" x2="100" y2="94"/>
        ${cols}
      </svg>
    </div>
    <figcaption><span>${esc(from)}</span><span>${esc(to)}</span></figcaption></figure>`;
}

const funnelRow = f => `<div class="an-funnel">
  <b>${esc(t("an_mod_" + f.module))}</b>
  <div class="an-funnel-steps">${f.steps.map(s =>
    `<div><b>${num(s.n, 0)}</b><span>${esc(t("an_step_" + s.label) || s.label)}</span></div>`).join("")}</div>
</div>`;

const dist = c => c && !c.suppressed && c.stats
  ? `${money(c.stats.p25)} – <b>${money(c.stats.median)}</b> – ${money(c.stats.p75)}`
  : `<i class="an-supp">${esc(t("an_suppressed"))}</i>`;

/* ---------- views ---------- */
async function render(){
  $("#anViewTitle").textContent = t("an_nav_" + view);
  $$(".admin-view").forEach(s => s.classList.toggle("active", s.id === "view-" + view));
  periodBar();
  if(view === "overview") return renderOverview();
  if(view === "segments") return renderSegments();
  if(view === "trends")   return renderTrends();
  if(view === "reports")  return renderReports();
}

async function renderOverview(){
  const host = $("#view-overview");
  host.innerHTML = `<p class="co-sub">${esc(t("an_loading"))}</p>`;
  const d = await api("overview");
  if(!d.ok){ host.innerHTML = `<p class="empty-note">${esc(t("an_fail"))}</p>`; return; }

  host.innerHTML = `
    <div class="an-kpis">
      ${kpi(num(d.platform.companies, 0), t("an_k_companies"), d.platform.newCompanies ? "+" + d.platform.newCompanies + " " + t("an_k_new") : "")}
      ${kpi(num(d.platform.associations, 0), t("an_k_assocs"))}
      ${kpi(num(d.bozor.products, 0), t("an_k_products"))}
      ${kpi(num(d.mehnat.vacancies, 0), t("an_k_vacancies"))}
      ${kpi(money(d.moliya.askedValue), t("an_k_asked"))}
      ${kpi(pct(d.moliya.fundingGapPct), t("an_k_gap"))}
    </div>

    <div class="an-grid">
      <div class="an-box">
        <h3>${esc(t("an_mod_bozor"))}</h3>
        ${bars([
          { label: t("an_k_products"), n: d.bozor.products },
          { label: "RFQ", n: d.bozor.rfqs },
          { label: t("an_k_quotes"), n: d.bozor.quotes },
          { label: t("an_k_deals"), n: d.bozor.deals },
          { label: t("an_k_inquiries"), n: d.bozor.inquiries },
        ])}
        <p class="an-note">Match rate: <b>${pct(d.bozor.matchRate)}</b></p>
      </div>
      <div class="an-box">
        <h3>${esc(t("an_mod_moliya"))}</h3>
        ${bars([
          { label: t("an_k_providers"), n: d.moliya.providers },
          { label: t("an_k_finprod"), n: d.moliya.products },
          { label: t("an_k_investors"), n: d.moliya.investors },
          { label: t("an_k_requests"), n: d.moliya.requests },
          { label: t("an_k_offers"), n: d.moliya.offers },
          { label: t("an_k_projects"), n: d.moliya.projects },
        ])}
        <p class="an-note">${esc(t("an_k_progressed"))}: <b>${money(d.moliya.capitalProgressed)}</b></p>
      </div>
      <div class="an-box">
        <h3>${esc(t("an_mod_mehnat"))}</h3>
        ${bars([
          { label: t("an_k_vacancies"), n: d.mehnat.vacancies },
          { label: t("an_k_seats"), n: d.mehnat.seats },
          { label: t("an_k_candidates"), n: d.mehnat.candidates },
          { label: t("an_k_apps"), n: d.mehnat.applications },
          { label: t("an_k_hires"), n: d.mehnat.hires },
        ])}
        <p class="an-note">Shortage index: <b>${d.mehnat.shortageIndex == null ? "—" : num(d.mehnat.shortageIndex, 2)}</b></p>
      </div>
    </div>

    <div class="an-box an-wide">
      <h3>${esc(t("an_funnels"))}</h3>
      <p class="an-note">${esc(t("an_funnels_p"))}</p>
      ${d.funnels.map(funnelRow).join("")}
    </div>`;
}

async function renderSegments(){
  const host = $("#view-segments");
  const mod = SEG.module;
  host.innerHTML = `<p class="co-sub">${esc(t("an_loading"))}</p>`;
  const d = await api("segment", { module: mod, dimension: SEG.dimension });
  if(!d.ok){ host.innerHTML = `<p class="empty-note">${esc(t("an_fail"))}</p>`; return; }
  SEG.dimension = d.dimension;

  const head = mod === "mehnat"
    ? [t("an_c_label"), t("an_k_vacancies"), t("an_k_seats"), t("an_k_candidates"), "Shortage", t("an_c_offered")]
    : mod === "moliya"
    ? [t("an_c_label"), t("an_k_finprod"), t("an_k_requests"), t("an_c_answered"), t("an_c_amount")]
    : [t("an_c_label"), t("an_k_products"), t("an_c_demand"), t("an_c_ratio"), t("an_c_price")];

  const rows = d.rows.map(r => mod === "mehnat"
    ? `<tr><td>${esc(r.label)}</td><td class="num">${num(r.n,0)}</td><td class="num">${num(r.seats,0)}</td>
        <td class="num">${num(r.supply,0)}</td><td class="num">${r.shortage==null?"—":num(r.shortage,2)}</td>
        <td>${dist(r.offered)}</td></tr>`
    : mod === "moliya"
    ? `<tr><td>${esc(r.label)}</td><td class="num">${num(r.n,0)}</td><td class="num">${num(r.demand,0)}</td>
        <td class="num">${pct(r.answeredPct)}</td><td>${dist(r.amount)}</td></tr>`
    : `<tr><td>${esc(r.label)}</td><td class="num">${num(r.n,0)}</td><td class="num">${num(r.demand,0)}</td>
        <td class="num">${num(r.ratio,1)}</td><td>${dist(r.price)}</td></tr>`).join("");

  host.innerHTML = `
    <div class="an-controls">
      <div class="an-seg" id="segModule">${(meta.modules||[]).map(m =>
        `<button type="button" data-mod="${m}" class="${m===mod?"is-on":""}">${esc(t("an_mod_"+m))}</button>`).join("")}</div>
      <div class="an-seg" id="segDim">${(d.dimensions||[]).map(x =>
        `<button type="button" data-dim="${escA(x)}" class="${x===d.dimension?"is-on":""}">${esc(t("an_d_"+x) || x)}</button>`).join("")}</div>
    </div>
    <div class="an-box an-wide">
      <h3>${esc(t("an_mod_"+mod))} · ${esc(t("an_d_"+d.dimension) || d.dimension)}</h3>
      ${d.rows.length ? `<div class="an-tablewrap"><table class="an-table">
        <thead><tr>${head.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead>
        <tbody>${rows}</tbody></table></div>` : `<p class="co-sub">${esc(t("an_nodata"))}</p>`}
      <p class="an-note">${esc(d.note)}</p>
    </div>`;
}

async function renderTrends(){
  const host = $("#view-trends");
  const mod = TREND.module;
  host.innerHTML = `<p class="co-sub">${esc(t("an_loading"))}</p>`;
  const d = await api("series", { module: mod, metric: TREND.metric, bucket: TREND.bucket });
  if(!d.ok){ host.innerHTML = `<p class="empty-note">${esc(t("an_fail"))}</p>`; return; }
  TREND.metric = d.metric;

  const trend = d.trendPct == null ? "" :
    `<span class="an-trend ${d.trendPct >= 0 ? "is-up" : "is-down"}">${d.trendPct >= 0 ? "▲" : "▼"} ${pct(Math.abs(d.trendPct))}</span>`;

  host.innerHTML = `
    <div class="an-controls">
      <div class="an-seg" id="trModule">${(meta.modules||[]).map(m =>
        `<button type="button" data-mod="${m}" class="${m===mod?"is-on":""}">${esc(t("an_mod_"+m))}</button>`).join("")}</div>
      <div class="an-seg" id="trMetric">${(d.metrics||[]).map(x =>
        `<button type="button" data-metric="${escA(x)}" class="${x===d.metric?"is-on":""}">${esc(t("an_m_"+x) || x)}</button>`).join("")}</div>
      <div class="an-seg" id="trBucket">${["day","week","month"].map(x =>
        `<button type="button" data-bucket="${x}" class="${x===d.bucket?"is-on":""}">${esc(t("an_b_"+x))}</button>`).join("")}</div>
    </div>
    <div class="an-box an-wide">
      <h3>${esc(t("an_mod_"+mod))} · ${esc(t("an_m_"+d.metric) || d.metric)} ${trend}</h3>
      <p class="an-note">${esc(t("an_total"))}: <b>${num(d.total,0)}</b> · ${esc(t("an_bucket"))}: ${esc(t("an_b_"+d.bucket))}</p>
      ${spark(d.points, t("an_m_"+d.metric) || d.metric)}
    </div>`;
}

function renderReports(){
  const host = $("#view-reports");
  host.innerHTML = `
    <div class="an-box an-wide">
      <h3>${esc(t("an_rep_h"))}</h3>
      <p class="an-note">${esc(t("an_rep_p"))}</p>
      <ul class="an-list">
        <li>${esc(t("an_rep_i1"))}</li>
        <li>${esc(t("an_rep_i2"))}</li>
        <li>${esc(t("an_rep_i3"))}</li>
      </ul>
      <div class="an-actions">
        <button class="btn btn-primary" type="button" data-export="xlsx">${esc(t("an_dl_xlsx"))}</button>
        <button class="btn btn-ghost" type="button" data-export="doc">${esc(t("an_dl_doc"))}</button>
      </div>
      <p class="an-note">${esc(t("an_rep_privacy"))}</p>
    </div>`;
}

/** A POST download needs the response as a blob, not a navigation. */
async function download(kind){
  const r = await fetch("/api/analyst/export", { method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.assign({}, creds || {}, { days: DAYS, kind })) });
  if(!r.ok) return UI.alert(t("an_fail"));
  const blob = await r.blob();
  const cd = r.headers.get("Content-Disposition") || "";
  const m = cd.match(/filename="([^"]+)"/);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = m ? m[1] : ("tahlil." + kind);
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ---------- events ---------- */
document.addEventListener("click", e => {
  const per = e.target.closest("[data-days]");
  if(per){ DAYS = Number(per.dataset.days) || 90; return render(); }
  const sm = e.target.closest("#segModule [data-mod]");
  if(sm){ SEG = { module: sm.dataset.mod, dimension: "" }; return renderSegments(); }
  const sd = e.target.closest("#segDim [data-dim]");
  if(sd){ SEG.dimension = sd.dataset.dim; return renderSegments(); }
  const tm = e.target.closest("#trModule [data-mod]");
  if(tm){ TREND = { module: tm.dataset.mod, metric: "", bucket: TREND.bucket }; return renderTrends(); }
  const tt = e.target.closest("#trMetric [data-metric]");
  if(tt){ TREND.metric = tt.dataset.metric; return renderTrends(); }
  const tb = e.target.closest("#trBucket [data-bucket]");
  if(tb){ TREND.bucket = tb.dataset.bucket; return renderTrends(); }
  const dl = e.target.closest("[data-export]");
  if(dl) return download(dl.dataset.export);
});

/* ---------- auth ---------- */
async function tryLogin(login, password){
  const r = await fetch("/api/analyst/login", { method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }) }).then(x => x.json()).catch(() => ({}));
  if(!r || !r.ok) return false;
  creds = { login, password };
  me = r.analyst; meta = r;
  try { sessionStorage.setItem("kg_an", JSON.stringify(creds)); } catch(e){}
  return true;
}

function startApp(){
  $("#anLogin").hidden = true;
  $("#anShell").hidden = false;
  $("#anBrandSub").textContent = (me && (me.org || me.name)) || t("an_brand");
  document.title = ((me && me.name) || t("an_title")) + " — TIJORAT MARKAZI";
  SEG.module = (me.scopes || [])[0] || "bozor";
  TREND.module = SEG.module;
  meta.modules = (meta.modules || []).filter(m => (me.scopes || []).includes(m));
  buildNav(); render();
}

$("#anForm").addEventListener("submit", async e => {
  e.preventDefault();
  const login = $("#anLogin1").value.trim(), pass = $("#anPass").value;
  const btn = $("#anForm").querySelector("button[type=submit]");
  btn.disabled = true;
  $("#anErr").textContent = "";
  try {
    if(await tryLogin(login, pass)){ startApp(); return; }
    /* Not an analyst account — but it may well be a company, association or
       admin one. The shared resolver routes them to their own cabinet rather
       than telling them their password is wrong. */
    const target = await kgResolveLogin(login, pass);
    if(target && target !== "tahlil.html"){ location.href = target; return; }
    $("#anErr").textContent = t("an_bad_creds");
    $("#anPass").value = "";
  } catch(_){
    $("#anErr").textContent = t("an_bad_creds");
  } finally { btn.disabled = false; }
});
$("#anOut").addEventListener("click", () => {
  try { sessionStorage.removeItem("kg_an"); } catch(e){}
  location.reload();
});

/* ---------- chrome ---------- */
function applyChrome(){
  $("#langBtn").textContent = LANG.toUpperCase();
  $("#anLgTitle").textContent = t("an_title");
  $("#anLgSub").textContent = t("an_login_sub");
  $("#anLgBtn").textContent = t("an_login_btn");
  $("#anOut").textContent = t("an_logout");
  $("#anBack").textContent = t("an_back");
  $("#anBackSite").textContent = t("an_back");
  document.documentElement.lang = LANG;
}
$("#langBtn").addEventListener("click", () => {
  LANG = LANGS[(L() + 1) % LANGS.length];
  localStorage.setItem("kg_lang", LANG);
  applyChrome();
  if(!$("#anShell").hidden){ buildNav(); render(); }
});
const themeBtn = $("#themeBtn");
function setTheme(th){ document.documentElement.dataset.theme = th;
  localStorage.setItem("kg_theme", th);
  themeBtn.innerHTML = th === "dark" ? ICON_SUN : ICON_MOON; }
themeBtn.addEventListener("click", () =>
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

setTheme(localStorage.getItem("kg_theme") || "light");
applyChrome();
(async () => {
  if(creds && creds.login && await tryLogin(creds.login, creds.password)) startApp();
})();
})();
