/* ============================================================
   XARIDOR — the B2B buyer cabinet

   The one cabinet on the platform that belongs to the side doing
   the buying. Everything it can do is something the market
   already supported; what was missing was an account to hang it
   on, so the buyer half of an RFQ, a quote or a thread had no
   owner and no place to be read from.

   Shape, and why:

   • ONE payload. /api/buyer/home returns the profile, requests,
     orders, threads and shortlist together. Switching tabs is
     then free, and the buyer never watches four spinners to see
     what is really one state.

   • Credentials, never ids. Every call sends the login pair and
     the server resolves who that is. Nothing here passes a buyer
     id, because a client-supplied id is a claim.

   • B2B is not a filter the user can clear. It is pinned server
     side (buyer.js CHANNEL) and simply stated in the topbar —
     an unclearable filter chip would invite the question of how
     to clear it.
   ============================================================ */
(() => {
const { $, $$, t, esc, escA, num, money, day, api, empty, loading, say,
        rail, drawer, closeDrawer, applyStatic, chrome } = MK;

MK.setDict(typeof T_XARIDOR !== "undefined" ? T_XARIDOR : {});

const VIEWS = [
  { v: "catalog", k: "xr_v_catalog", ic: "🔎" },
  { v: "rfq",     k: "xr_v_rfq",     ic: "📩" },
  { v: "orders",  k: "xr_v_orders",  ic: "📦" },
  { v: "threads", k: "xr_v_threads", ic: "💬" },
  { v: "profile", k: "xr_v_profile", ic: "🏢" },
  /* Rights under modda 21-22 ZRU-547, where the account already is. */
  { v: "legal",   k: "xr_v_legal",   ic: "⚙️" },
];

let creds = null;      // { login, password }
let HOME  = null;      // the whole cabinet state, from /api/buyer/home
let view  = "catalog";
let catalogRows = null;   // last search result, kept so a re-render is free

/* ---------- transport ---------- */
const post = (path, body) => api(path, Object.assign({}, creds, body || {}));

const stored = () => { try { return JSON.parse(sessionStorage.getItem("kg_by") || "null"); }
                       catch(e){ return null; } };

/* ============================================================
   SIGN IN
   ============================================================ */
async function signIn(e){
  e.preventDefault();
  const btn = $("#xrBtn"), err = $("#xrErr");
  const login = $("#xrLogin").value.trim(), password = $("#xrPass").value;
  if(!login || !password) return;

  btn.disabled = true; err.textContent = "";
  try {
    /* The shared resolver knows every tier. Someone who types a company or
       admin login here is sent to THEIR cabinet rather than refused — the
       platform is one system with many doors. */
    const target = await kgResolveLogin(login, password);
    if(target === "xaridor.html"){ creds = stored(); await start(); return; }
    if(target){ location.href = target; return; }
    err.textContent = t("xr_login_err");
    $("#xrPass").value = "";
    $("#xrPass").focus();
  } catch(_){
    err.textContent = t("xr_login_err");
  } finally { btn.disabled = false; }
}

async function start(){
  const r = await post("/api/buyer/home");
  if(!r || !r.ok){
    /* A stale session key survives a server restart; it should send the buyer
       back to the form, not into an empty cabinet. */
    sessionStorage.removeItem("kg_by");
    creds = null;
    $("#xrErr").textContent = t("xr_e_load");
    return;
  }
  HOME = r;
  $("#xrLoginView").style.display = "none";
  $("#xrShell").hidden = false;
  $("#xrBrandSub").textContent = HOME.buyer.name || t("xr_brand");
  $("#xrChannel").textContent = String(HOME.meta.channel || "b2b").toUpperCase();
  $("#xrChannel").title = t("xr_b2b_note");
  buildNav();
  render();
}

/** Pull fresh state after anything that changes it, then repaint. */
async function refresh(){
  const r = await post("/api/buyer/home");
  if(r && r.ok) HOME = r;
  render();
}

/* ============================================================
   CHROME
   ============================================================ */
function buildNav(){
  const nav = $("#xrNav");
  nav.innerHTML = "";
  VIEWS.forEach(n => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = n.v === view ? "active" : "";
    b.innerHTML = `<span aria-hidden="true">${n.ic}</span><span>${esc(t(n.k))}</span>${badge(n.v)}`;
    b.addEventListener("click", () => { view = n.v; buildNav(); render(); });
    nav.appendChild(b);
  });
}

/** Counts that answer "is there anything waiting for me here". */
function badge(v){
  if(!HOME) return "";
  const n = v === "rfq"     ? (HOME.rfqs || []).filter(r => r.quoteCount > 0).length
          : v === "orders"  ? (HOME.deals || []).filter(d => d.stage !== "closed").length
          : v === "threads" ? (HOME.inquiries || []).filter(i => i.status === "answered").length
          : 0;
  return n ? `<em class="co-badge">${num(n, 0)}</em>` : "";
}

function render(){
  VIEWS.forEach(n => $("#view-" + n.v).classList.toggle("active", n.v === view));
  $("#xrViewTitle").textContent = t(VIEWS.find(n => n.v === view).k);
  if(view === "catalog") renderCatalog();
  if(view === "rfq")     renderRfq();
  if(view === "orders")  renderOrders();
  if(view === "threads") renderThreads();
  if(view === "profile") renderProfile();
  if(view === "legal") LegalPanel.mount($("#view-legal"), {
    creds: () => creds, panelClass: "panel co-panel", profileHref: "xaridor.html",
    onWithdrawn: () => { sessionStorage.removeItem("kg_by"); location.href = "index.html"; } });
}

/* ============================================================
   CATALOG — the B2B shelf
   ============================================================ */
function renderCatalog(){
  const host = $("#view-catalog");
  if(!host.dataset.built){
    host.innerHTML = `<div class="panel co-panel">
      <div class="co-panel-head"><span class="co-ic">🔎</span><h2>${esc(t("xr_v_catalog"))}</h2></div>
      <p class="co-sub">${esc(t("xr_b2b_note"))}</p>
      <form class="mk-filter" id="xrCatForm">
        <input type="search" id="xrQ" autocomplete="off"
               placeholder="${escA(t("xr_search_ph"))}" />
        <input type="text" id="xrRegion" placeholder="${escA(t("xr_f_region"))}" />
        <input type="number" id="xrLead" min="0" placeholder="${escA(t("xr_f_maxlead"))}" />
        <input type="number" id="xrMoq" min="0" placeholder="${escA(t("xr_f_maxmoq"))}" />
        <label class="mk-chip is-ghost" style="cursor:pointer">
          <input type="checkbox" id="xrCert" style="accent-color:var(--mk)" />
          <span>${esc(t("xr_f_cert"))}</span></label>
        <button class="btn btn-primary" type="submit">${esc(t("xr_search"))}</button>
        <button class="btn btn-ghost" type="button" id="xrClear">${esc(t("xr_reset"))}</button>
        <span class="mk-count" id="xrCount"></span>
      </form>
      <div id="xrCatOut"></div></div>`;
    host.dataset.built = "1";
    $("#xrCatForm").addEventListener("submit", e => { e.preventDefault(); searchCatalog(); });
    $("#xrClear").addEventListener("click", () => { $("#xrCatForm").reset(); searchCatalog(); });
    applyStatic();
    searchCatalog();
    return;
  }
  if(catalogRows) paintCatalog(catalogRows);
}

async function searchCatalog(){
  const out = $("#xrCatOut");
  out.innerHTML = loading();
  const qs = new URLSearchParams();
  const put = (k, v) => { if(v) qs.set(k, v); };
  put("q",       $("#xrQ").value.trim());
  put("region",  $("#xrRegion").value.trim());
  put("maxLead", $("#xrLead").value.trim());
  put("maxMoq",  $("#xrMoq").value.trim());
  if($("#xrCert").checked) qs.set("certified", "1");
  /* /api/buyer/products pins the channel server side; nothing here can widen
     it, which is why no channel parameter is sent at all. */
  const r = await api("/api/buyer/products?" + qs.toString());
  catalogRows = (r && r.items) || [];
  paintCatalog(catalogRows);
}

function paintCatalog(rows){
  const out = $("#xrCatOut"), count = $("#xrCount");
  if(count) count.textContent = t("xr_found").replace("{n}", num(rows.length, 0));
  if(!rows.length){ out.innerHTML = empty(t("xr_cat_empty")); return; }
  out.innerHTML = `<div class="mk-grid">${rows.map(productCard).join("")}</div>`;
}

function productCard(p){
  const on = (HOME.saved || []).some(s => s.id === p.companyId);
  const kv = (label, value) => value ? `<dt>${esc(label)}</dt><dd>${value}</dd>` : "";
  /* bozor.js view() publishes the seller as `company`, not `companyName` —
     the latter is the internal field name and never leaves the server. */
  return `<article class="mk-card">
    <h3>${esc(p.title)}</h3>
    <p class="mk-sub">${esc(p.company)}${p.region ? " · " + esc(p.region) : ""}</p>
    <p class="mk-price">${p.price ? esc(money(p.price, p.currency)) : "—"}
      ${p.unit ? `<small>/ ${esc(p.unit)}</small>` : ""}</p>
    <dl class="mk-kv">
      ${kv(t("xr_moq"), p.moq ? esc(num(p.moq, 0) + " " + (p.unit || "")) : "")}
      ${kv(t("xr_lead"), p.leadTime ? esc(num(p.leadTime, 0) + " " + t("xr_days")) : "")}
    </dl>
    <div class="mk-card-foot">
      <button class="btn btn-primary" type="button" data-ask="${escA(p.id)}">${esc(t("xr_ask"))}</button>
      <button class="btn btn-ghost" type="button" data-save="${escA(p.companyId)}">${
        esc(on ? t("xr_saved_on") : t("xr_save"))}</button>
    </div>
  </article>`;
}

/* ---- ask one seller about one product ---- */
function askDrawer(productId){
  const p = (catalogRows || []).find(x => x.id === productId);
  if(!p) return;
  drawer(`<form id="xrAskForm" class="mk-form">
      <p class="mk-sub">${esc(p.company)}</p>
      <div class="mk-f"><label for="xrAskQty">${esc(t("xr_ask_qty"))}</label>
        <input id="xrAskQty" type="number" min="0" /></div>
      <div class="mk-f wide"><label for="xrAskMsg">${esc(t("xr_ask_msg"))}</label>
        <textarea id="xrAskMsg" rows="5" required></textarea></div>
      <div class="mk-actions">
        <button class="btn btn-primary" type="submit">${esc(t("xr_ask_send"))}</button></div>
      <p class="mk-msg" id="xrAskMsgOut" hidden></p>
    </form>`, t("xr_ask_h") + " — " + p.title);

  $("#xrAskForm").addEventListener("submit", async e => {
    e.preventDefault();
    const out = $("#xrAskMsgOut");
    const text = $("#xrAskMsg").value.trim();
    if(!text) return say(out, t("xr_ask_empty"), "err");
    const r = await post("/api/buyer/inquiry", {
      productId, qty: $("#xrAskQty").value, unit: p.unit, message: text });
    if(!r || !r.ok) return say(out, t(r && r.error === "not_b2b" ? "xr_e_forbidden" : "xr_e_save"), "err");
    say(out, t("xr_ask_ok"), "ok");
    setTimeout(() => { closeDrawer(); refresh(); }, 900);
  });
}

async function toggleSaved(companyId, btn){
  btn.disabled = true;
  const r = await post("/api/buyer/saved", { companyId });
  btn.disabled = false;
  if(!r || !r.ok) return;
  HOME.saved = r.suppliers || [];
  btn.textContent = r.on ? t("xr_saved_on") : t("xr_save");
}

/* ============================================================
   PRICE REQUESTS — one request, many offers
   ============================================================ */
function renderRfq(){
  const host = $("#view-rfq");
  const rows = HOME.rfqs || [];
  host.innerHTML = `
    <div class="panel co-panel">
      <div class="co-panel-head"><span class="co-ic">📩</span><h2>${esc(t("xr_rfq_new"))}</h2></div>
      <p class="co-sub">${esc(t("xr_rfq_sub"))}</p>
      <form class="mk-form" id="xrRfqForm">
        <div class="mk-f wide"><label for="xrRqTitle">${esc(t("xr_rfq_title"))}</label>
          <input id="xrRqTitle" required /></div>
        <div class="mk-f wide"><label for="xrRqSpec">${esc(t("xr_rfq_spec"))}</label>
          <textarea id="xrRqSpec" rows="3"></textarea></div>
        <div class="mk-f"><label for="xrRqCat">${esc(t("xr_rfq_cat"))}</label><input id="xrRqCat" /></div>
        <div class="mk-f"><label for="xrRqQty">${esc(t("xr_rfq_qty"))}</label>
          <input id="xrRqQty" type="number" min="0" /></div>
        <div class="mk-f"><label for="xrRqUnit">${esc(t("xr_rfq_unit"))}</label><input id="xrRqUnit" /></div>
        <div class="mk-f"><label for="xrRqBudget">${esc(t("xr_rfq_budget"))}</label>
          <input id="xrRqBudget" type="number" min="0" /></div>
        <div class="mk-f"><label for="xrRqCur">${esc(t("xr_rfq_cur"))}</label>
          <select id="xrRqCur">${(HOME.meta.currencies || ["UZS"]).map(c =>
            `<option value="${escA(c)}">${esc(c)}</option>`).join("")}</select></div>
        <div class="mk-f"><label for="xrRqRegion">${esc(t("xr_rfq_region"))}</label><input id="xrRqRegion" /></div>
        <div class="mk-f"><label for="xrRqLead">${esc(t("xr_rfq_lead"))}</label>
          <input id="xrRqLead" type="number" min="0" /></div>
        <div class="mk-f"><label for="xrRqDl">${esc(t("xr_rfq_dl"))}</label>
          <input id="xrRqDl" type="date" /></div>
        <div class="mk-actions">
          <button class="btn btn-primary" type="submit">${esc(t("xr_rfq_send"))}</button></div>
      </form>
      <p class="mk-msg" id="xrRqMsg" hidden></p>
    </div>

    <div class="panel co-panel">
      <div class="co-panel-head"><span class="co-ic">📋</span><h2>${esc(t("xr_v_rfq"))}</h2></div>
      <div class="rq-list">${rows.length ? rows.map(rfqCard).join("") : empty(t("xr_rfq_empty"))}</div>
    </div>`;
  $("#xrRfqForm").addEventListener("submit", submitRfq);
}

function rfqCard(r){
  const offers = r.quoteCount
    ? t("xr_rfq_offers").replace("{n}", num(r.quoteCount, 0))
    : t("xr_rfq_none");
  return `<article class="rq-card is-${escA(r.status === "open" ? "pending" : "approved")}">
    <div class="rq-top">
      <span class="rq-badge">${esc(t("status_" + r.status, r.status))}</span>
      <b>${esc(r.title)}</b>
      <span class="rq-ref">${esc(day(r.created))}</span>
    </div>
    ${r.spec ? `<p class="rq-about">${esc(r.spec)}</p>` : ""}
    <dl class="rq-kv">
      ${r.qty ? `<dt>${esc(t("xr_rfq_qty"))}</dt><dd>${esc(num(r.qty, 0))} ${esc(r.unit || "")}</dd>` : ""}
      ${r.budget ? `<dt>${esc(t("xr_rfq_budget"))}</dt><dd>${esc(money(r.budget, r.currency))}</dd>` : ""}
      ${r.maxLead ? `<dt>${esc(t("xr_rfq_lead"))}</dt><dd>${esc(num(r.maxLead, 0))} ${esc(t("xr_days"))}</dd>` : ""}
      <dt>${esc(t("xr_q_h"))}</dt><dd>${esc(offers)}</dd>
    </dl>
    ${r.quoteCount ? `<div class="rq-actions">
      <button class="btn btn-primary" type="button" data-quotes="${escA(r.id)}">${
        esc(t("xr_rfq_open"))}</button></div>` : ""}
  </article>`;
}

async function submitRfq(e){
  e.preventDefault();
  const out = $("#xrRqMsg");
  const val = id => $("#" + id).value.trim();
  if(!val("xrRqTitle")) return say(out, t("xr_rfq_e_title"), "err");

  const r = await post("/api/buyer/rfq", {
    title: val("xrRqTitle"), spec: val("xrRqSpec"), category: val("xrRqCat"),
    qty: val("xrRqQty"), unit: val("xrRqUnit"),
    budget: val("xrRqBudget"), currency: val("xrRqCur"),
    region: val("xrRqRegion"), maxLead: val("xrRqLead"), deadline: val("xrRqDl"),
  });
  if(!r || !r.ok) return say(out, t("xr_e_save"), "err");

  /* The matcher already knows who fits. Saying so straight away is the
     difference between "published" and "published, and N sellers will see it". */
  const n = (r.matches || []).length;
  say(out, t("xr_rfq_ok") + (n ? " " + t("xr_rfq_matched").replace("{n}", num(n, 0)) : ""), "ok");
  $("#xrRfqForm").reset();
  await refresh();
}

/* ---- compare the offers on one request ---- */
async function quotesDrawer(rfqId){
  drawer(loading(), t("xr_q_h"));
  const r = await post("/api/buyer/quotes", { rfqId });
  if(!r || !r.ok){ $("#mkDrawerBody").innerHTML = empty(t("xr_e_forbidden")); return; }

  const rows = r.quotes || [];
  $("#mkDrawerTitle").textContent = t("xr_q_h") + " — " + r.rfq.title;
  $("#mkDrawerBody").innerHTML = rows.length
    ? `<div class="rq-list">${rows.map(quoteCard).join("")}</div>`
    : empty(t("xr_rfq_none"));
}

function quoteCard(q){
  const flag = (on, key) => on ? `<span class="mk-chip">${esc(t(key))}</span>` : "";
  return `<article class="rq-card is-pending">
    <div class="rq-top">
      <b>${esc(q.sellerName)}</b>
      ${flag(q.bestPrice, "xr_q_best_p")}${flag(q.bestLead, "xr_q_best_l")}
    </div>
    <dl class="rq-kv">
      <dt>${esc(t("xr_q_price"))}</dt><dd>${esc(money(q.price, q.currency))}${
        q.qty ? ` × ${esc(num(q.qty, 0))}` : ""}</dd>
      ${q.leadTime ? `<dt>${esc(t("xr_q_lead"))}</dt><dd>${esc(num(q.leadTime, 0))} ${esc(t("xr_days"))}</dd>` : ""}
      ${q.validity ? `<dt>${esc(t("xr_q_valid"))}</dt><dd>${esc(q.validity)}</dd>` : ""}
      ${q.incoterm ? `<dt>Incoterm</dt><dd>${esc(q.incoterm)}</dd>` : ""}
    </dl>
    ${q.terms ? `<p class="rq-about">${esc(q.terms)}</p>` : ""}
    <div class="rq-actions">
      <button class="btn btn-primary" type="button" data-accept="${escA(q.id)}">${
        esc(t("xr_q_accept"))}</button></div>
  </article>`;
}

async function acceptQuote(quoteId){
  if(!await UI.confirm(t("xr_q_accept_q"))) return;
  const r = await post("/api/buyer/deal", { quoteId });
  if(!r || !r.ok) return UI.alert(t("xr_e_forbidden"));
  closeDrawer();
  view = "orders";
  await refresh();
  buildNav();
}

/* ============================================================
   ORDERS — what happens after a quote is accepted
   ============================================================ */
function renderOrders(){
  const host = $("#view-orders");
  const rows = HOME.deals || [];
  host.innerHTML = `<div class="panel co-panel">
    <div class="co-panel-head"><span class="co-ic">📦</span><h2>${esc(t("xr_v_orders"))}</h2></div>
    <div class="rq-list">${rows.length ? rows.map(dealCard).join("") : empty(t("xr_or_empty"))}</div>
  </div>`;
}

function dealCard(d){
  const stages = HOME.meta.stages || [];
  const risks = (d.risks || []).map(x => `<li>${esc(x)}</li>`).join("");
  return `<article class="rq-card is-${escA(d.stage === "closed" ? "approved" : "pending")}">
    <div class="rq-top">
      <span class="rq-badge">${esc(t("stage_" + d.stage, d.stage))}</span>
      <b>${esc(d.title)}</b>
      <span class="rq-ref">${esc(day(d.updated))}</span>
    </div>
    ${rail(stages, d.stage)}
    <dl class="rq-kv">
      <dt>${esc(t("xr_seller"))}</dt><dd>${esc(d.sellerName)}</dd>
      <dt>${esc(t("xr_or_value"))}</dt><dd>${esc(money(d.value, d.currency))}</dd>
      ${d.nextAction ? `<dt>${esc(t("xr_or_next"))}</dt><dd>${esc(d.nextAction)}</dd>` : ""}
    </dl>
    ${risks ? `<div class="mk-assume"><b>${esc(t("xr_or_risks"))}</b><ul>${risks}</ul></div>` : ""}
    ${(d.notes || []).length ? `<div class="rq-about">${(d.notes || []).slice(-4).map(n =>
      `<p><b>${esc(n.by)}</b> · ${esc(day(n.t))}<br />${esc(n.text)}</p>`).join("")}</div>` : ""}
    <form class="mk-form" data-deal="${escA(d.id)}">
      <div class="mk-f"><label>${esc(t("xr_or_stage"))}</label>
        <select name="stage">${stages.map(s =>
          `<option value="${escA(s)}"${s === d.stage ? " selected" : ""}>${
            esc(t("stage_" + s, s))}</option>`).join("")}</select></div>
      <div class="mk-f wide"><label>${esc(t("xr_or_note"))}</label>
        <input name="note" /></div>
      <div class="mk-actions">
        <button class="btn btn-ghost" type="submit">${esc(t("xr_or_send"))}</button></div>
    </form>
  </article>`;
}

async function saveDeal(form){
  const id = form.dataset.deal;
  const r = await post("/api/buyer/deal/update", {
    id, stage: form.stage.value, note: form.note.value.trim() });
  if(!r || !r.ok) return UI.alert(t("xr_e_forbidden"));
  await refresh();
  buildNav();
}

/* ============================================================
   MESSAGE THREADS — the private channel with one seller
   ============================================================ */
function renderThreads(){
  const host = $("#view-threads");
  const rows = HOME.inquiries || [];
  host.innerHTML = `<div class="panel co-panel">
    <div class="co-panel-head"><span class="co-ic">💬</span><h2>${esc(t("xr_v_threads"))}</h2></div>
    <div class="rq-list">${rows.length ? rows.map(threadCard).join("") : empty(t("xr_th_empty"))}</div>
  </div>`;
}

function threadCard(i){
  const label = i.status === "answered" ? t("xr_th_answered")
              : i.status === "closed"   ? t("xr_th_closed") : t("xr_th_waiting");
  const replies = (i.replies || []).map(rep =>
    `<p><b>${esc(rep.side === "buyer" ? t("xr_th_you") : rep.by)}</b> · ${esc(day(rep.t))}<br />${
      esc(rep.text)}</p>`).join("");
  return `<article class="rq-card is-${escA(i.status === "answered" ? "approved" : "pending")}">
    <div class="rq-top">
      <span class="rq-badge">${esc(label)}</span>
      <b>${esc(i.companyName)}</b>
      <span class="rq-ref">${esc(day(i.updated))}</span>
    </div>
    ${i.productName ? `<p class="mk-sub">${esc(i.productName)}</p>` : ""}
    <p class="rq-about">${esc(i.message)}</p>
    ${replies ? `<div class="rq-about">${replies}</div>` : ""}
    ${i.status !== "closed" ? `<form class="mk-form" data-thread="${escA(i.id)}">
      <div class="mk-f wide"><label>${esc(t("xr_th_reply"))}</label>
        <textarea name="text" rows="2"></textarea></div>
      <div class="mk-actions">
        <button class="btn btn-ghost" type="submit">${esc(t("xr_th_send"))}</button></div>
    </form>` : ""}
  </article>`;
}

async function askAgain(form){
  const text = form.text.value.trim();
  if(!text) return;
  const r = await post("/api/buyer/inquiry/ask", { id: form.dataset.thread, text });
  if(!r || !r.ok) return UI.alert(t("xr_e_save"));
  await refresh();
  buildNav();
}

/* ============================================================
   PROFILE + saved suppliers
   ============================================================ */
function renderProfile(){
  const b = HOME.buyer;
  const f = (id, label, value, type) => `<div class="mk-f"><label for="${id}">${esc(label)}</label>
    <input id="${id}" type="${type || "text"}" value="${escA(value || "")}" /></div>`;
  $("#view-profile").innerHTML = `
    <div class="panel co-panel">
      <div class="co-panel-head"><span class="co-ic">🏢</span><h2>${esc(t("xr_pr_h"))}</h2></div>
      <p class="co-sub">${esc(t("xr_pr_sub"))}</p>
      <form class="mk-form" id="xrPrForm">
        ${f("xrPrName", t("br_f_name"), b.name)}
        ${f("xrPrPhone", t("br_f_phone"), b.phone, "tel")}
        ${f("xrPrContact", t("rg_f_contact"), b.contactName)}
        ${f("xrPrRole", t("rg_f_role"), b.role)}
        ${f("xrPrCPhone", t("br_f_cphone"), b.contactPhone, "tel")}
        ${f("xrPrRegion", t("xr_f_region"), b.region)}
        <div class="mk-f"><label>${esc(t("xr_pr_login"))}</label>
          <input value="${escA(b.login)}" disabled /></div>
        <div class="mk-f wide"><label for="xrPrAbout">${esc(t("br_f_about"))}</label>
          <textarea id="xrPrAbout" rows="3">${esc(b.about || "")}</textarea></div>
        <div class="mk-actions">
          <button class="btn btn-primary" type="submit">${esc(t("xr_pr_save"))}</button></div>
      </form>
      <p class="mk-msg" id="xrPrMsg" hidden></p>
    </div>

    <div class="panel co-panel">
      <div class="co-panel-head"><span class="co-ic">⭐</span><h2>${esc(t("xr_sup_h"))}</h2></div>
      <div class="rq-list">${(HOME.saved || []).length
        ? (HOME.saved || []).map(supplierCard).join("")
        : empty(t("xr_sup_empty"))}</div>
    </div>`;
  $("#xrPrForm").addEventListener("submit", saveProfile);
}

function supplierCard(c){
  const tel = String(c.phone || "").replace(/[^+0-9]/g, "");
  return `<article class="rq-card">
    <div class="rq-top"><b>${esc(c.name)}</b>
      ${c.sector ? `<span class="rq-badge">${esc(c.sector)}</span>` : ""}</div>
    <div class="rq-contact">
      ${c.email ? `<a href="mailto:${escA(c.email)}">✉ ${esc(c.email)}</a>` : ""}
      ${tel ? `<a href="tel:${escA(tel)}">📞 ${esc(c.phone)}</a>` : ""}
    </div>
    <div class="rq-actions">
      <button class="btn btn-ghost" type="button" data-save="${escA(c.id)}">${
        esc(t("xr_sup_drop"))}</button></div>
  </article>`;
}

async function saveProfile(e){
  e.preventDefault();
  const out = $("#xrPrMsg");
  const v = id => $("#" + id).value.trim();
  if(!v("xrPrName"))  return say(out, t("xr_e_name"), "err");
  if(!v("xrPrPhone")) return say(out, t("xr_e_phone"), "err");

  const r = await post("/api/buyer/profile", {
    name: v("xrPrName"), phone: v("xrPrPhone"),
    contactName: v("xrPrContact"), role: v("xrPrRole"), contactPhone: v("xrPrCPhone"),
    region: v("xrPrRegion"), about: v("xrPrAbout"),
  });
  if(!r || !r.ok) return say(out, t("xr_e_save"), "err");
  HOME.buyer = r.buyer;
  $("#xrBrandSub").textContent = r.buyer.name || t("xr_brand");
  say(out, t("xr_pr_saved"), "ok");
}

/* ============================================================
   WIRING
   One delegated listener for every card action: the lists are
   re-rendered constantly, and per-card handlers would leak.
   ============================================================ */
document.addEventListener("click", e => {
  const hit = sel => e.target.closest && e.target.closest(sel);
  const ask = hit("[data-ask]");        if(ask)    return askDrawer(ask.dataset.ask);
  const sv  = hit("[data-save]");       if(sv)     return toggleSaved(sv.dataset.save, sv);
  const qz  = hit("[data-quotes]");     if(qz)     return quotesDrawer(qz.dataset.quotes);
  const ac  = hit("[data-accept]");     if(ac)     return acceptQuote(ac.dataset.accept);
});

document.addEventListener("submit", e => {
  if(e.target.dataset && e.target.dataset.deal){ e.preventDefault(); return saveDeal(e.target); }
  if(e.target.dataset && e.target.dataset.thread){ e.preventDefault(); return askAgain(e.target); }
});

$("#xrForm").addEventListener("submit", signIn);
$("#xrLogout").addEventListener("click", () => {
  sessionStorage.removeItem("kg_by");
  location.href = "index.html";
});

/* A language switch has to repaint the whole cabinet: almost every string on
   screen was built by a render function, not by data-i18n. The catalogue is
   the one view built once and kept, so it is torn down explicitly — with the
   filters carried across, because losing what someone typed is a worse
   outcome than a stale label would have been. */
chrome(() => {
  if(!HOME) return;
  const host = $("#view-catalog");
  if(host.dataset.built){
    const keep = ["xrQ", "xrRegion", "xrLead", "xrMoq"].map(id => [id, $("#" + id).value]);
    const cert = $("#xrCert").checked;
    host.dataset.built = "";
    host.innerHTML = "";
    renderCatalog();
    keep.forEach(([id, v]) => { const el = $("#" + id); if(el) el.value = v; });
    $("#xrCert").checked = cert;
  }
  buildNav();
  render();
});

creds = stored();
if(creds && creds.login) start();
else $("#xrLogin").focus();
})();
