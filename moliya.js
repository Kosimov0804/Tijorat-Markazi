/* ============================================================
   MOLIYA BOZORI — client
   Marketplace · Reverse auction · Capital market · Cabinet · Intelligence
   ============================================================ */
(() => {
const { $, $$, t, esc, escA, num, money, pctTxt, day, api, qs, ident, chip, chips,
        match, meters, ranks, kpi, funnel, rail, draft, empty, loading, say,
        tabs, segment, drawer, closeDrawer, applyStatic, chrome } = MK;

MK.setDict(typeof T_MOLIYA !== "undefined" ? T_MOLIYA : {});

/* Form markup lives in moliya-forms.js — see the note there. */
const { capitalForm, wireCapitalForm, passportFormHtml, providerFormHtml, stackHtml, investorReadyHtml } = ML_FORMS;
ML_FORMS.bind({ reloadCapital: () => loadCapital() });

const state = { category: "", capSeg: "projects", meta: null, products: [], requests: [], cap: [] };

async function meta(){
  if(!state.meta) state.meta = await api("/api/moliya/meta");
  return state.meta;
}

/* ---------- marketplace ---------- */
async function loadProducts(){
  const grid = $("#mlGrid");
  grid.innerHTML = loading();
  const r = await api("/api/moliya/products?" + qs({
    q: $("#mlQ").value.trim(), category: state.category,
    amount: $("#mlAmount").value, tenor: $("#mlTenor").value,
    currency: $("#mlCurrency").value, sharia: $("#mlSharia").checked,
  }));
  state.products = r.items || [];
  $("#mlCount").textContent = t("ml_count").replace("{n}", num(r.total || 0, 0));
  $("#mlDisclaimer").textContent = r.disclaimer || "";
  grid.innerHTML = state.products.length ? state.products.map(productCard).join("") : empty(t("ml_empty"));
}

function productCard(p){
  const range = p.minAmount || p.maxAmount
    ? `${money(p.minAmount, "")} – ${money(p.maxAmount, p.currency)}` : "—";
  const tenor = p.tenorMin || p.tenorMax ? `${num(p.tenorMin, 0)}–${num(p.tenorMax, 0)} ${t("ml_months")}` : "—";
  return `<article class="mk-card" data-fp="${escA(p.id)}" tabindex="0" role="button">
    <div class="mk-chips">
      ${chip(t("ml_cat_" + p.category), "accent")}
      ${p.sharia ? chip(t("ml_sharia_badge"), "good") : ""}
      ${p.stale ? chip(t("ml_stale"), "warn") : ""}
    </div>
    <h3>${esc(p.name)}</h3>
    ${p.summary ? `<p class="mk-desc">${esc(p.summary)}</p>` : ""}
    <div class="mk-meta">
      <span>${esc(p.providerName)}</span>
      ${p.instrument ? `<span><b>${esc(p.instrument)}</b></span>` : ""}
      ${p.sla ? `<span>SLA <b>${num(p.sla, 0)} ${esc(t("ml_days"))}</b></span>` : ""}
    </div>
    <div class="mk-card-foot">
      <span class="mk-price" style="font-size:16px">${range}</span>
      <span class="mk-chip is-ghost">${esc(tenor)}</span>
    </div>
  </article>`;
}

function openProduct(id){
  const p = state.products.find(x => x.id === id);
  if(!p) return;
  const rows = [
    [t("ml_provider"), p.providerName], [t("ml_instrument"), p.instrument],
    [t("ml_f_amount"), (p.minAmount || p.maxAmount) ? money(p.minAmount, "") + " – " + money(p.maxAmount, p.currency) : ""],
    [t("ml_f_tenor"), (p.tenorMin || p.tenorMax) ? num(p.tenorMin, 0) + "–" + num(p.tenorMax, 0) + " " + t("ml_months") : ""],
    [t("ml_rate"), p.rate], [t("ml_fee"), p.feeModel], [t("ml_f_collateral"), p.collateral],
    [t("ml_eligibility"), p.eligibility], [t("ml_docs"), (p.docs || []).join(", ")],
    [t("ml_segments"), (p.segments || []).map(s => t("ml_seg_" + s, s)).join(", ")],
    [t("ml_licence"), p.licence], [t("ml_updated"), day(p.updated)],
  ].filter(r => r[1]).map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join("");
  drawer(`
    <div class="mk-chips">${chip(t("ml_cat_" + p.category), "accent")}${p.sharia ? chip(t("ml_sharia_badge"), "good") : ""}</div>
    <dl class="mk-kv">${rows}</dl>
    ${(p.rejectReasons || []).length ? `<div class="mk-assume"><b>${esc(t("ml_reject_reasons"))}</b><ul>${
      p.rejectReasons.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    <div class="mk-actions">
      <button class="btn btn-primary" type="button" id="mlToReq">${esc(t("ml_to_request"))}</button>
      ${MK.safeUrl(p.link) ? `<a class="btn btn-ghost" href="${escA(p.link)}" target="_blank" rel="noopener noreferrer">${esc(t("ml_official"))}</a>` : ""}
    </div>
    <p class="mk-note">${esc(t("ml_disclaimer_card"))}</p>`, p.name);
  const b = $("#mlToReq");
  if(b) b.addEventListener("click", () => {
    closeDrawer();
    $$(".mk-tab").find(x => x.dataset.tab === "auction").click();
    $("#frCategory").value = p.category;
    if(p.currency) $("#frCurrency").value = p.currency;
    $("#frAmount").focus();
  });
}

/* Smart Finance Finder: NL → structured query, then apply it to the filters. */
async function financeFinder(){
  const out = $("#mlNlOut");
  const text = $("#mlNl").value.trim();
  if(!text) return say(out, t("ml_finder_need"), "err");
  out.innerHTML = loading();
  const r = await api("/api/copilot", ident.co(ident.me({ agent: "moliya.finance-need", lang: MK.lang(), text })));
  out.innerHTML = draft(r, [
    { label: t("ml_f_amount"), get: d => d.amount ? money(d.amount, d.currency) : "" },
    { label: t("ml_f_tenor"), get: d => d.tenor ? d.tenor + " " + t("ml_months") : "" },
    { label: t("ml_f_purpose"), get: d => d.purpose },
    { label: t("ml_f_category"), get: d => d.category ? t("ml_cat_" + d.category, d.category) : "" },
    { label: t("ml_instrument"), get: d => (d.instruments || []).join(", ") },
    { label: t("ml_why_these"), get: d => (d.whyThese || []).join(" · ") },
    { label: t("ml_docs"), get: d => (d.documentsLikelyNeeded || []).join(", ") },
  ]);
  if(r.ok && r.data){
    const d = r.data;
    if(d.amount) $("#mlAmount").value = d.amount;
    if(d.tenor) $("#mlTenor").value = d.tenor;
    if(d.currency) $("#mlCurrency").value = d.currency;
    $("#mlSharia").checked = !!d.sharia;
    if(d.category){
      state.category = d.category;
      $$("#mlCategory button").forEach(b => b.classList.toggle("is-on", b.dataset.value === d.category));
    }
    loadProducts();
  }
}

/* ---------- reverse auction ---------- */
async function loadRequests(){
  const grid = $("#mlReqGrid");
  grid.innerHTML = loading();
  const r = await api("/api/moliya/requests");
  state.requests = r.items || [];
  $("#mlReqCount").textContent = t("ml_req_count").replace("{n}", num(state.requests.length, 0));
  grid.innerHTML = state.requests.length ? state.requests.map(reqCard).join("") : empty(t("ml_req_empty"));
}

function reqCard(r){
  const st = { open: "good", offers: "accent", shortlisted: "warn", underwriting: "warn", closed: "ghost" }[r.status] || "ghost";
  return `<article class="mk-card" data-req="${escA(r.id)}" tabindex="0" role="button">
    <div class="mk-chips">${chip(t("status_" + r.status), st)}
      ${r.category ? chip(t("ml_cat_" + r.category), "ghost") : ""}
      ${r.sharia ? chip(t("ml_sharia_badge"), "good") : ""}</div>
    <h3>${money(r.amount, r.currency)}</h3>
    ${r.purpose ? `<p class="mk-desc">${esc(r.purpose)}</p>` : ""}
    <div class="mk-meta">
      <span>${esc(r.ownerName)}</span>
      ${r.tenor ? `<span><b>${num(r.tenor, 0)} ${esc(t("ml_months"))}</b></span>` : ""}
      ${r.sector ? `<span>${esc(r.sector)}</span>` : ""}
      ${r.region ? `<span>📍 ${esc(r.region)}</span>` : ""}
    </div>
    <div class="mk-card-foot">
      <span class="mk-chip is-accent">${esc(t("ml_offers"))}: ${num(r.offerCount || 0, 0)}</span>
      <span style="font-size:12px;color:var(--muted)">${day(r.created)}</span>
    </div>
  </article>`;
}

async function openRequest(id){
  drawer(loading(), "");
  const [m, o] = await Promise.all([
    api("/api/moliya/request/matches?" + qs({ id })),
    api("/api/moliya/offers?" + qs({ requestId: id })),
  ]);
  if(m.error) return drawer(empty(t("ml_req_empty")), "");
  const r = m.request;
  const matchHtml = (m.matches || []).slice(0, 6).map(x =>
    match(x, `${esc(x.product.name)} — <span style="color:var(--muted);font-weight:500">${esc(x.product.providerName)}</span>`)).join("");
  const rows = (o.offers || []).map(x => `<tr class="${x.bestCost ? "is-best" : ""}">
      <td>${esc(x.providerName)}</td>
      <td class="num">${num(x.ratePct, 2)}%</td>
      <td class="num">${num(x.feePct, 2)}%</td>
      <td class="num">${num(x.tenor, 0)}</td>
      <td class="num"><b>${num(x.allInPct, 2)}%</b>${x.bestCost ? " ★" : ""}</td>
      <td>${esc(x.validity || "—")}</td>
    </tr>`).join("");

  drawer(`
    <div class="mk-chips">${chip(t("status_" + r.status), "accent")}${r.sharia ? chip(t("ml_sharia_badge"), "good") : ""}</div>
    <div class="mk-score-big"><b>${money(r.amount, "")}</b><span>${esc(r.currency)}</span></div>
    <dl class="mk-kv">
      ${r.purpose ? `<dt>${esc(t("ml_f_purpose"))}</dt><dd>${esc(r.purpose)}</dd>` : ""}
      ${r.tenor ? `<dt>${esc(t("ml_f_tenor"))}</dt><dd>${num(r.tenor, 0)} ${esc(t("ml_months"))}</dd>` : ""}
      ${r.sector ? `<dt>${esc(t("ml_f_sector"))}</dt><dd>${esc(r.sector)}</dd>` : ""}
      ${r.collateral ? `<dt>${esc(t("ml_f_collateral"))}</dt><dd>${esc(r.collateral)}</dd>` : ""}
      <dt>${esc(t("ml_created"))}</dt><dd>${day(r.created)}</dd>
    </dl>
    <h3 class="mk-h">${esc(t("ml_routed"))}</h3>
    <div class="mk-stack">${matchHtml || empty(t("ml_no_match"))}</div>
    ${rows ? `<h3 class="mk-h">${esc(t("ml_offer_compare"))}</h3>
      <div class="mk-tablewrap"><table class="mk-table">
        <thead><tr><th>${esc(t("ml_provider"))}</th><th class="num">${esc(t("ml_rate"))}</th>
          <th class="num">${esc(t("ml_fee"))}</th><th class="num">${esc(t("ml_months"))}</th>
          <th class="num">All-in</th><th>${esc(t("ml_validity"))}</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
      <p class="mk-note">${esc(o.method)}</p>
      <p class="mk-note">${esc(o.disclaimer)}</p>` : `<p class="mk-note">${esc(t("ml_no_offers"))}</p>`}
    ${ident.company() ? `<div class="mk-actions"><button class="btn btn-primary" type="button" id="mlOfferBtn">${esc(t("ml_make_offer"))}</button></div>` : ""}
  `, t("ml_request"));

  const ob = $("#mlOfferBtn");
  if(ob) ob.addEventListener("click", () => offerDrawer(r));
}

function offerDrawer(r){
  drawer(`<form class="mk-form" id="mlOfferForm">
      <div class="mk-f"><label>${esc(t("ml_f_amount"))}</label><input id="ofAmount" type="number" value="${escA(r.amount)}" /></div>
      <div class="mk-f"><label>${esc(t("ml_f_currency"))}</label>
        <select id="ofCurrency"><option>UZS</option><option>USD</option><option>EUR</option><option>RUB</option></select></div>
      <div class="mk-f"><label>${esc(t("ml_rate"))} (%)</label><input id="ofRate" type="number" step="0.01" required /></div>
      <div class="mk-f"><label>${esc(t("ml_fee"))} (%)</label><input id="ofFee" type="number" step="0.01" /></div>
      <div class="mk-f"><label>${esc(t("ml_f_tenor"))}</label><input id="ofTenor" type="number" value="${escA(r.tenor)}" /></div>
      <div class="mk-f"><label>${esc(t("ml_grace"))}</label><input id="ofGrace" type="number" /></div>
      <div class="mk-f wide"><label>${esc(t("ml_f_collateral"))}</label><input id="ofCollateral" /></div>
      <div class="mk-f wide"><label>${esc(t("ml_covenants"))}</label><textarea id="ofCovenants"></textarea></div>
      <div class="mk-f wide"><label>${esc(t("ml_conditions"))}</label><textarea id="ofConditions"></textarea></div>
      <div class="mk-f"><label>${esc(t("ml_validity"))}</label><input id="ofValidity" type="date" /></div>
      <div class="mk-f"><label>SLA (${esc(t("ml_days"))})</label><input id="ofSla" type="number" /></div>
      <div class="mk-actions wide"><button class="btn btn-primary" type="submit">${esc(t("ml_send_offer"))}</button></div>
      <p class="mk-note wide">${esc(t("ml_offer_note"))}</p>
      <p class="mk-msg wide" id="mlOfMsg" hidden></p>
    </form>`, t("ml_make_offer"));
  const cur = $("#ofCurrency"); if(cur && r.currency) cur.value = r.currency;
  $("#mlOfferForm").addEventListener("submit", async e => {
    e.preventDefault();
    const res = await api("/api/moliya/offer", ident.co({
      requestId: r.id, amount: $("#ofAmount").value, currency: $("#ofCurrency").value,
      ratePct: $("#ofRate").value, feePct: $("#ofFee").value, tenor: $("#ofTenor").value,
      grace: $("#ofGrace").value, collateral: $("#ofCollateral").value,
      covenants: $("#ofCovenants").value, conditions: $("#ofConditions").value,
      validity: $("#ofValidity").value, slaDays: $("#ofSla").value }));
    if(!res.ok) return say($("#mlOfMsg"), t("ml_offer_fail"), "err");
    say($("#mlOfMsg"), t("ml_offer_ok"), "ok");
    setTimeout(() => { closeDrawer(); loadRequests(); }, 900);
  });
}

async function submitRequest(e){
  e.preventDefault();
  const msg = $("#mlReqMsg");
  const body = ident.co(ident.me({
    amount: $("#frAmount").value, currency: $("#frCurrency").value, tenor: $("#frTenor").value,
    category: $("#frCategory").value, purpose: $("#frPurpose").value, sector: $("#frSector").value,
    region: $("#frRegion").value, revenue: $("#frRevenue").value, collateral: $("#frCollateral").value,
    sharia: $("#frSharia").checked, anonymous: $("#frAnon").checked, contact: $("#frContact").value,
  }));
  if(!body.amount) return say(msg, t("ml_need_amount"), "err");
  const r = await api("/api/moliya/request", body);
  if(!r.ok) return say(msg, t("ml_req_fail"), "err");
  say(msg, t("ml_req_ok").replace("{n}", (r.matches || []).length), "ok");
  $("#mlReqForm").reset(); $("#frAnon").checked = true;
  $("#mlReqMatches").innerHTML = (r.matches || []).length
    ? `<div class="mk-box w12"><h3>${esc(t("ml_routed"))}</h3><div class="mk-stack">${
        r.matches.slice(0, 5).map(x => match(x,
          `${esc(x.product.name)} — <span style="color:var(--muted);font-weight:500">${esc(x.product.providerName)}</span>`)).join("")
      }</div></div>` : "";
  loadRequests();
}

/* ---------- capital market ---------- */
async function loadCapital(){
  const grid = $("#mlCapGrid");
  grid.innerHTML = loading();
  const seg = state.capSeg;
  const path = { projects: "/api/moliya/projects", startups: "/api/moliya/startups",
                 investors: "/api/moliya/investors", ideas: "/api/moliya/ideas" }[seg];
  const r = await api(path);
  state.cap = r.items || [];
  $("#mlCapCount").textContent = t("ml_cap_count").replace("{n}", num(state.cap.length, 0));
  const render = { projects: projectCard, startups: startupCard, investors: investorCard, ideas: ideaCard }[seg];
  grid.innerHTML = state.cap.length ? state.cap.map(render).join("") : empty(t("ml_cap_empty"));
  $("#mlCapForm").innerHTML = capitalForm(seg);
  wireCapitalForm(seg);
  applyStatic();
}

const projectCard = p => `<article class="mk-card" data-cap="${escA(p.id)}" tabindex="0" role="button">
    <div class="mk-chips">${chip(p.gate, "accent")}${p.sector ? chip(p.sector, "ghost") : ""}</div>
    <h3>${esc(p.name)}</h3>
    ${p.summary ? `<p class="mk-desc">${esc(p.summary)}</p>` : ""}
    <div class="mk-meta">
      ${p.capex ? `<span>CAPEX <b>${money(p.capex, p.currency)}</b></span>` : ""}
      ${p.irr ? `<span>IRR <b>${num(p.irr, 1)}%</b></span>` : ""}
      ${p.jobs ? `<span>${esc(t("ml_jobs"))} <b>${num(p.jobs, 0)}</b></span>` : ""}
    </div>
    <div class="mk-card-foot">
      <span class="mk-price" style="font-size:16px">${p.ask ? money(p.ask, p.currency) : "—"}</span>
      <span class="mk-chip is-accent">${esc(t("ml_readiness"))} ${num(p.readiness, 0)}%</span>
    </div></article>`;

const startupCard = s => `<article class="mk-card" data-cap="${escA(s.id)}" tabindex="0" role="button">
    <div class="mk-chips">${chip(s.stage, "accent")}${s.sector ? chip(s.sector, "ghost") : ""}</div>
    <h3>${esc(s.name)}</h3>
    ${s.pitch ? `<p class="mk-desc">${esc(s.pitch)}</p>` : ""}
    <div class="mk-meta">
      ${s.mrr ? `<span>MRR <b>${money(s.mrr, s.currency)}</b></span>` : ""}
      ${s.users ? `<span>${esc(t("ml_users"))} <b>${num(s.users, 0)}</b></span>` : ""}
      ${s.runway ? `<span>Runway <b>${num(s.runway, 0)} ${esc(t("ml_months"))}</b></span>` : ""}
    </div>
    <div class="mk-card-foot"><span class="mk-price" style="font-size:16px">${s.ask ? money(s.ask, s.currency) : "—"}</span>
      ${s.valuation ? `<span class="mk-chip is-ghost">${esc(t("ml_valuation"))} ${money(s.valuation, s.currency)}</span>` : ""}</div>
  </article>`;

const investorCard = i => `<article class="mk-card">
    <div class="mk-chips">${chip(t("ml_inv_" + i.type, i.type), "accent")}
      ${i.verified ? chip(t("ml_verified"), "good") : ""}</div>
    <h3>${esc(i.name)}</h3>
    ${i.thesis ? `<p class="mk-desc">${esc(i.thesis)}</p>` : ""}
    ${chips((i.sectors || []).slice(0, 4), "ghost")}
    <div class="mk-card-foot">
      <span class="mk-price" style="font-size:15px">${money(i.ticketMin, "")} – ${money(i.ticketMax, i.currency)}</span>
      <span class="mk-chip">${esc((i.stages || []).join(", "))}</span>
    </div></article>`;

const ideaCard = i => `<article class="mk-card" data-cap="${escA(i.id)}" tabindex="0" role="button">
    <div class="mk-chips">${chip(t("ml_idea_" + i.model, i.model), "accent")}
      ${i.sector ? chip(i.sector, "ghost") : ""}
      ${i.ndaCount ? chip("NDA " + i.ndaCount, "ghost") : ""}</div>
    <h3>${esc(i.title)}</h3>
    <p class="mk-desc">${esc(i.teaser)}</p>
    <div class="mk-meta"><span>${esc(i.author)}</span>${i.ipStatus ? `<span>${esc(i.ipStatus)}</span>` : ""}</div>
    <div class="mk-card-foot">
      <span class="mk-price" style="font-size:16px">${i.price ? money(i.price, i.currency) : esc(t("ml_negotiable"))}</span>
      <span class="mk-chip is-warn">🔒 ${esc(t("ml_nda_gate"))}</span>
    </div></article>`;

async function openCapital(id){
  const seg = state.capSeg;
  if(seg === "ideas") return openIdea(id);
  const row = state.cap.find(x => x.id === id);
  if(!row) return;
  drawer(loading(), row.name);
  const m = await api("/api/moliya/match?" + qs({ kind: seg === "projects" ? "project" : "startup", id }));
  const matches = (m.matches || []).slice(0, 6).map(x =>
    match(x, `${esc(x.investor.name)} — <span style="color:var(--muted);font-weight:500">${esc(t("ml_inv_" + x.investor.type, x.investor.type))}</span>`)).join("");

  const detail = seg === "projects"
    ? `${rail(["G0","G1","G2","G3","G4","G5","G6","G7","G8"], row.gate)}
       <dl class="mk-kv">
        ${row.summary ? `<dt>${esc(t("ml_summary"))}</dt><dd>${esc(row.summary)}</dd>` : ""}
        ${row.capex ? `<dt>CAPEX</dt><dd>${money(row.capex, row.currency)}</dd>` : ""}
        ${row.opex ? `<dt>OPEX</dt><dd>${money(row.opex, row.currency)}</dd>` : ""}
        ${row.revenue ? `<dt>${esc(t("ml_f_revenue"))}</dt><dd>${money(row.revenue, row.currency)}</dd>` : ""}
        ${row.irr ? `<dt>IRR</dt><dd>${num(row.irr, 1)}%</dd>` : ""}
        ${row.npv ? `<dt>NPV</dt><dd>${money(row.npv, row.currency)}</dd>` : ""}
        ${row.dscr ? `<dt>DSCR</dt><dd>${num(row.dscr, 2)}</dd>` : ""}
        ${row.ask ? `<dt>${esc(t("ml_ask"))}</dt><dd>${money(row.ask, row.currency)}</dd>` : ""}
        ${row.jobs ? `<dt>${esc(t("ml_jobs"))}</dt><dd>${num(row.jobs, 0)}</dd>` : ""}
        ${row.risks ? `<dt>${esc(t("ml_risks"))}</dt><dd>${esc(row.risks)}</dd>` : ""}
       </dl>`
    : `<dl class="mk-kv">
        ${row.pitch ? `<dt>Pitch</dt><dd>${esc(row.pitch)}</dd>` : ""}
        ${row.mrr ? `<dt>MRR</dt><dd>${money(row.mrr, row.currency)}</dd>` : ""}
        ${row.users ? `<dt>${esc(t("ml_users"))}</dt><dd>${num(row.users, 0)}</dd>` : ""}
        ${row.growth ? `<dt>${esc(t("ml_growth"))}</dt><dd>${num(row.growth, 1)}% / ${esc(t("ml_month"))}</dd>` : ""}
        ${row.runway ? `<dt>Runway</dt><dd>${num(row.runway, 0)} ${esc(t("ml_months"))}</dd>` : ""}
        ${row.ask ? `<dt>${esc(t("ml_ask"))}</dt><dd>${money(row.ask, row.currency)}</dd>` : ""}
        ${row.valuation ? `<dt>${esc(t("ml_valuation"))}</dt><dd>${money(row.valuation, row.currency)}</dd>` : ""}
        ${(row.founders || []).length ? `<dt>${esc(t("ml_founders"))}</dt><dd>${esc(row.founders.join(", "))}</dd>` : ""}
       </dl>`;

  drawer(`${detail}
    <h3 class="mk-h">${esc(t("ml_investor_match"))}</h3>
    <div class="mk-stack">${matches || empty(t("ml_no_match"))}</div>
    <p class="mk-note">${esc(t("ml_match_note"))}</p>`, row.name);
}

/* Idea Exchange: teaser first, confidential body only after an NDA is recorded. */
async function openIdea(id){
  const r = await api("/api/moliya/idea", ident.me({ op: "open", id }));
  if(r.error === "identify_first") return drawer(empty(t("ml_need_email")), "");
  if(!r.ok) return;
  const i = r.idea;
  const body = r.ndaSigned
    ? `<div class="mk-draft"><h3 class="mk-h">${esc(t("ml_confidential"))}</h3>
        <p style="white-space:pre-wrap">${esc(r.confidential)}</p>
        ${r.terms ? `<div class="mk-assume"><b>${esc(t("ml_terms"))}</b><p>${esc(r.terms)}</p></div>` : ""}</div>`
    : `<div class="mk-ai"><h3>🔒 ${esc(t("ml_nda_gate"))}</h3>
        <p style="font-size:13.5px">${esc(r.notice || "")}</p>
        <div class="mk-actions"><button class="btn btn-primary" type="button" id="mlNda">${esc(t("ml_accept_nda"))}</button></div></div>`;
  drawer(`
    <div class="mk-chips">${chip(t("ml_idea_" + i.model, i.model), "accent")}${i.sector ? chip(i.sector, "ghost") : ""}</div>
    <p class="mk-desc" style="-webkit-line-clamp:99">${esc(i.teaser)}</p>
    <dl class="mk-kv">
      <dt>${esc(t("ml_author"))}</dt><dd>${esc(i.author)}</dd>
      ${i.price ? `<dt>${esc(t("ml_price"))}</dt><dd>${money(i.price, i.currency)}</dd>` : ""}
      ${i.ipStatus ? `<dt>IP</dt><dd>${esc(i.ipStatus)}</dd>` : ""}
      <dt>NDA</dt><dd>${num(i.ndaCount, 0)}</dd>
    </dl>
    ${body}
    <p class="mk-note">${esc(t("ml_idea_note"))}</p>`, i.title);
  const b = $("#mlNda");
  if(b) b.addEventListener("click", async () => {
    if(!ident.email()) return say($("#mkDrawerBody"), t("ml_need_email"), "err");
    if(!await UI.confirm(t("ml_nda_confirm"))) return;
    await api("/api/moliya/idea", ident.me({ op: "nda", id }));
    openIdea(id);
  });
}

/* ---------- cabinet ---------- */
function renderId(){
  const c = ident.company();
  const bar = $("#mlId");
  bar.innerHTML = `
    <span>${esc(t("ml_id_email"))}</span>
    <input id="mlEmail" type="email" value="${escA(ident.email())}" placeholder="email@company.uz" />
    <button class="btn btn-ghost" type="button" id="mlSaveEmail">${esc(t("ml_save"))}</button>
    <span class="mk-id-r">
      ${c ? `<b>${esc(c.name)}</b> <button class="btn btn-ghost" type="button" id="mlOut">${esc(t("ml_logout"))}</button>`
          : `<input id="mlLogin" placeholder="${escA(t("ml_login"))}" autocomplete="username" />
             <input id="mlPass" type="password" placeholder="${escA(t("ml_pass"))}" autocomplete="current-password" />
             <button class="btn btn-primary" type="button" id="mlIn">${esc(t("ml_enter"))}</button>`}
    </span>`;
  $("#mlSaveEmail").addEventListener("click", () => {
    ident.setPerson($("#mlEmail").value.trim(), ident.name());
    renderCabinet();
  });
  if(c) $("#mlOut").addEventListener("click", () => { ident.setCompany(null); renderId(); renderCabinet(); });
  else {
    const go = async () => {
      const r = await MK.companyLogin($("#mlLogin").value.trim(), $("#mlPass").value);
      if(r.error) return say($("#mlId"), t("ml_login_fail"), "err");
      renderId(); renderCabinet();
    };
    $("#mlIn").addEventListener("click", go);
    $("#mlPass").addEventListener("keydown", e => { if(e.key === "Enter") go(); });
  }
}

async function renderCabinet(){
  const host = $("#mlCabinet");
  host.innerHTML = loading();
  const co = ident.company();
  const [pass, mine, prov] = await Promise.all([
    ident.email() ? api("/api/moliya/passport", ident.me({ op: "get" })) : Promise.resolve({}),
    ident.email() ? api("/api/moliya/request/mine", ident.co(ident.me({}))) : Promise.resolve({}),
    co ? api("/api/moliya/provider", ident.co()) : Promise.resolve({}),
  ]);

  const providerBox = prov.ok ? `
    <div class="mk-box w12">
      <h3>${esc(t("ml_provider_desk"))}</h3>
      <div class="mk-stack">
        ${(prov.leads || []).slice(0, 5).map(x => match(x,
          `${esc(x.product)} · <span style="color:var(--muted);font-weight:500">${money(x.amount, x.currency)} · ${num(x.tenor, 0)} ${esc(t("ml_months"))}</span>`,
          `<div class="mk-actions" style="margin-top:8px">
             <button class="btn btn-ghost" type="button" data-offer="${escA(x.id)}">${esc(t("ml_make_offer"))}</button></div>`)).join("")
          || empty(t("ml_no_leads"))}
      </div>
      <h3 style="margin-top:14px">${esc(t("ml_my_products"))}</h3>
      <div class="mk-grid">${(prov.products || []).map(productCard).join("") || empty(t("ml_no_products"))}</div>
      ${providerFormHtml()}
    </div>` : "";

  host.innerHTML = `<div class="mk-bento">
      <div class="mk-box w6 is-lead">
        <h3>${esc(t("ml_passport"))}</h3>
        ${pass.readiness
          ? `<div class="mk-score-big"><b>${num(pass.readiness.score, 0)}</b><span>/ 100</span></div>
             ${meters(pass.readiness.blocks)}
             <p class="mk-note">${esc(pass.readiness.note)}</p>`
          : empty(t("ml_no_passport"))}
      </div>
      <div class="mk-box w6">
        <h3>${esc(t("ml_my_requests"))}</h3>
        <div class="mk-stack">${(mine.items || []).map(r => `
          <div class="mk-card" style="gap:7px">
            <div class="mk-chips">${chip(t("status_" + r.status), "accent")}</div>
            <h3>${money(r.amount, r.currency)}</h3>
            <div class="mk-meta"><span>${esc(r.purpose || "")}</span>
              <span class="mk-chip">${esc(t("ml_offers"))}: ${num(r.offerCount, 0)}</span></div>
            <div class="mk-actions"><button class="btn btn-ghost" type="button" data-openreq="${escA(r.id)}">${esc(t("ml_open"))}</button></div>
          </div>`).join("") || empty(t("ml_no_requests"))}</div>
      </div>
      <div class="mk-box w6">${passportFormHtml(pass.passport)}</div>
      <div class="mk-box w6">${stackHtml()}</div>
      <div class="mk-box w12">${investorReadyHtml()}</div>
      ${providerBox}
    </div>`;

  wireCabinet();
  applyStatic();
}

function wireCabinet(){
  const host = $("#mlCabinet");

  const pf = $("#mlPassForm");
  if(pf) pf.addEventListener("submit", async e => {
    e.preventDefault();
    const msg = $("#mlPassMsg");
    if(!ident.email()) return say(msg, t("ml_need_email"), "err");
    ident.setPerson(ident.email(), $("#fpName").value.trim());
    const r = await api("/api/moliya/passport", ident.me({
      sector: $("#fpSector").value, region: $("#fpRegion").value, legalForm: $("#fpLegal").value,
      founded: $("#fpFounded").value, employees: $("#fpEmployees").value, revenue: $("#fpRevenue").value,
      ebitda: $("#fpEbitda").value, currency: $("#fpCurrency").value, need: $("#fpNeed").value,
      tenor: $("#fpTenor").value, purpose: $("#fpPurpose").value, collateral: $("#fpCollateral").value,
      collateralValue: $("#fpCollValue").value, docs: $("#fpDocs").value, risks: $("#fpRisks").value }));
    if(!r.ok) return say(msg, t("ml_save_fail"), "err");
    say(msg, t("ml_save_ok"), "ok");
    renderCabinet();
  });

  const prod = $("#mlProdForm");
  if(prod) prod.addEventListener("submit", async e => {
    e.preventDefault();
    const msg = $("#mlProdMsg");
    const r = await api("/api/moliya/product", ident.co({
      name: $("#mpName").value, category: $("#mpCategory").value, instrument: $("#mpInstrument").value,
      summary: $("#mpSummary").value, minAmount: $("#mpMin").value, maxAmount: $("#mpMax").value,
      currency: $("#mpCurrency").value, tenorMin: $("#mpTenorMin").value, tenorMax: $("#mpTenorMax").value,
      rate: $("#mpRate").value, feeModel: $("#mpFee").value, sla: $("#mpSla").value,
      collateral: $("#mpCollateral").value, eligibility: $("#mpEligibility").value,
      docs: $("#mpDocs").value, licence: $("#mpLicence").value, sharia: $("#mpSharia").checked }));
    if(!r.ok) return say(msg, t("ml_save_fail"), "err");
    say(msg, t("ml_save_ok"), "ok");
    prod.reset(); renderCabinet();
  });

  const sf = $("#mlStackForm");
  if(sf) sf.addEventListener("submit", async e => {
    e.preventDefault();
    const out = $("#mlStackOut");
    out.innerHTML = loading();
    const r = await api("/api/moliya/capital-stack", {
      amount: $("#csAmount").value, currency: $("#csCurrency").value, ebitda: $("#csEbitda").value,
      receivables: $("#csReceivables").value, collateral: $("#csCollateral").checked,
      exporter: $("#csExporter").checked, equipment: $("#csEquipment").checked, sharia: $("#csSharia").checked });
    if(!r.ok) return say(out, t("ml_stack_fail"), "err");
    out.innerHTML = `<div class="mk-stack" style="margin-top:12px">${r.scenarios.map(s => `
      <div class="mk-card" style="gap:9px">
        <h3>${esc(s.name)}</h3>
        <div class="mk-meta"><span>${esc(t("ml_cost"))} <b>${esc(s.costOfCapital)}</b></span>
          <span>${esc(t("ml_dilution"))} <b>${num(s.dilution, 0)}%</b></span></div>
        ${ranks(s.sources.map(x => ({ label: x.label + " — " + MK.money(x.amount, r.currency), n: x.pct })),
          { limit: 8, fmt: x => num(x.n, 0) + "%" })}
        <p style="font-size:13px;color:var(--muted)">${esc(s.note)}</p>
      </div>`).join("")}</div>
      <p class="mk-note" style="margin-top:10px">${esc(r.disclaimer)}</p>`;
  });

  const ir = $("#mlIrGo");
  if(ir) ir.addEventListener("click", async () => {
    const out = $("#mlIrOut");
    const text = $("#mlIrText").value.trim();
    if(!text) return say(out, t("ml_ir_need"), "err");
    out.innerHTML = loading();
    const r = await api("/api/copilot", ident.co(ident.me({
      agent: "moliya.investor-ready", lang: MK.lang(), text,
      ask: $("#mlIrAsk").value, sector: $("#mlIrSector").value })));
    out.innerHTML = draft(r, [
      { label: t("ml_ir_problem"), get: d => d.teaser && d.teaser.problem },
      { label: t("ml_ir_solution"), get: d => d.teaser && d.teaser.solution },
      { label: t("ml_ir_market"), get: d => d.teaser && d.teaser.market },
      { label: t("ml_ask"), get: d => d.teaser && d.teaser.ask },
      { label: t("ml_ir_use"), get: d => d.teaser && d.teaser.useOfFunds },
      { label: t("ml_ir_deck"), html: true,
        get: d => (d.deckOutline || []).length
          ? "<ol style='margin-left:16px'>" + d.deckOutline.map(s =>
              `<li><b>${esc(s.slide)}</b> — ${esc(s.content)}</li>`).join("") + "</ol>" : "" },
      { label: t("ml_ir_risks"), html: true,
        get: d => (d.riskRegister || []).length
          ? "<ul style='margin-left:16px'>" + d.riskRegister.map(x =>
              `<li>[${esc(x.severity)}] <b>${esc(x.risk)}</b> — ${esc(x.mitigation)}</li>`).join("") + "</ul>" : "" },
      { label: t("ml_ir_dataroom"), html: true,
        get: d => (d.dataRoomChecklist || []).length
          ? "<ul style='margin-left:16px'>" + d.dataRoomChecklist.map(x =>
              `<li>${x.required ? "★ " : ""}${esc(x.item)}</li>`).join("") + "</ul>" : "" },
      { label: t("ml_ir_figures"), html: true,
        get: d => (d.figures || []).length
          ? "<ul style='margin-left:16px'>" + d.figures.map(x =>
              `<li>${esc(x.label)}: <b>${esc(x.value)}</b> <span class="mk-chip is-${x.source === "assumption" ? "warn" : "good"}">${esc(x.source)}</span></li>`).join("") + "</ul>" : "" },
    ]);
  });

  host.addEventListener("click", e => {
    const o = e.target.closest("[data-openreq]");
    if(o) return openRequest(o.dataset.openreq);
    const of = e.target.closest("[data-offer]");
    if(of){
      const r = (state.requests || []).find(x => x.id === of.dataset.offer);
      return offerDrawer(r || { id: of.dataset.offer, amount: "", tenor: "", currency: "UZS" });
    }
  });
}

/* ---------- intelligence ---------- */
async function loadIntel(){
  const host = $("#mlIntel");
  host.innerHTML = loading();
  const d = await api("/api/moliya/intel");
  const h = d.headline || {};
  const gates = d.projectPipeline || [];
  host.innerHTML = `
    <div class="mk-kpis" style="margin-bottom:var(--mk-gap)">
      ${kpi(money(h.capitalProgressed, ""), t("ml_k_progressed"), { hero: true, note: t("ml_k_northstar") })}
      ${kpi(num(h.providers, 0), t("ml_k_providers"))}
      ${kpi(num(h.products, 0), t("ml_k_products"), { note: h.staleProducts ? h.staleProducts + " " + t("ml_stale") : "" })}
      ${kpi(num(h.investors, 0), t("ml_k_investors"))}
      ${kpi(num(h.requests, 0), t("ml_k_requests"))}
      ${kpi(pctTxt(h.fundingGapPct), t("ml_k_gap"))}
    </div>
    <div class="mk-bento">
      <div class="mk-box w6 is-lead"><h3>${esc(t("ml_demand_sector"))}</h3>
        ${ranks(d.demandMap.bySector, { value: "requests", limit: 8,
          fmt: r => `${r.answered}/${r.requests} · ${r.gap}% gap` })}
      </div>
      <div class="mk-box w6"><h3>${esc(t("ml_terms_monitor"))}</h3>
        ${termsTable(d.termsMonitor)}
        ${d.termsMonitor.note ? `<p class="mk-note">${esc(d.termsMonitor.note)}</p>` : ""}
      </div>
      <div class="mk-box w12"><h3>${esc(t("ml_pgo_pipeline"))}</h3>
        <div class="mk-funnel">${gates.map(g =>
          `<div><b>${num(g.n, 0)}</b><span>${esc(g.gate)}</span></div>`).join("")}</div>
        <p class="mk-note">${gates.map(g => esc(g.gate + " " + g.label)).join(" · ")}</p>
      </div>
      <div class="mk-box w4"><h3>${esc(t("ml_appetite"))}</h3>${ranks(d.investorAppetite.bySector, { limit: 7 })}</div>
      <div class="mk-box w4"><h3>${esc(t("ml_supply_cat"))}</h3>
        ${ranks((d.supply.byCategory || []).map(c => ({ label: t("ml_cat_" + c.label, c.label), n: c.n })), { limit: 7 })}</div>
      <div class="mk-box w4"><h3>${esc(t("ml_startup_pulse"))}</h3>
        ${ranks((d.startupPulse.byStage || []), { limit: 6 })}
        <p class="mk-note">${esc(t("ml_idea_conv"))}: ${pctTxt(d.ideaExchange.conversion)} · NDA ${num(d.ideaExchange.ndas, 0)}</p></div>
      <div class="mk-box w12"><p class="mk-note">${esc(d.privacy)}</p></div>
    </div>`;
}

function termsTable(m){
  const row = (label, s, suffix) => s && s.stats
    ? `<tr><td>${esc(label)}</td><td class="num">${num(s.stats.p25, 2)}${suffix}</td>
       <td class="num">${num(s.stats.median, 2)}${suffix}</td><td class="num">${num(s.stats.p75, 2)}${suffix}</td></tr>` : "";
  const body = row(t("ml_rate"), { stats: m.ratePct }, "%") + row(t("ml_fee"), { stats: m.feePct }, "%")
    + row(t("ml_months"), { stats: m.tenor }, "");
  return body
    ? `<div class="mk-tablewrap"><table class="mk-table" style="min-width:0">
        <thead><tr><th></th><th class="num">P25</th><th class="num">${esc(t("ml_median"))}</th><th class="num">P75</th></tr></thead>
        <tbody>${body}</tbody></table></div>`
    : `<p class="mk-loading">${esc(t("mk_nodata"))}</p>`;
}

async function loadPulse(){
  const p = await api("/api/market/pulse");
  if(!p.ok) return;
  $("#mlPulse").innerHTML = [
    [p.moliya.products, t("ml_k_products")], [p.moliya.providers, t("ml_k_providers")],
    [p.moliya.requests, t("ml_k_requests")], [p.moliya.investors, t("ml_k_investors")],
  ].map(([v, l]) => `<div><b>${num(v, 0)}</b><span>${esc(l)}</span></div>`).join("");
}

/* ---------- wiring ---------- */
let debounce;
["#mlQ", "#mlAmount", "#mlTenor", "#mlCurrency", "#mlSharia"].forEach(sel => {
  const el = $(sel); if(!el) return;
  el.addEventListener(el.tagName === "INPUT" && el.type !== "checkbox" ? "input" : "change", () => {
    clearTimeout(debounce); debounce = setTimeout(loadProducts, 300);
  });
});
segment("#mlCategory", v => { state.category = v; loadProducts(); });
segment("#mlCapSeg", v => { state.capSeg = v; loadCapital(); });
$("#mlGrid").addEventListener("click", e => {
  const c = e.target.closest("[data-fp]"); if(c) openProduct(c.dataset.fp);
});
$("#mlReqGrid").addEventListener("click", e => {
  const c = e.target.closest("[data-req]"); if(c) openRequest(c.dataset.req);
});
$("#mlCapGrid").addEventListener("click", e => {
  const c = e.target.closest("[data-cap]"); if(c) openCapital(c.dataset.cap);
});
$("#mlReqForm").addEventListener("submit", submitRequest);
$("#mlNlGo").addEventListener("click", financeFinder);

const loaded = {};
tabs("#mlTabs", tab => {
  if(tab === "auction" && !loaded.auction){ loaded.auction = 1; loadRequests(); }
  if(tab === "capital" && !loaded.capital){ loaded.capital = 1; loadCapital(); }
  if(tab === "cabinet" && !loaded.cabinet){ loaded.cabinet = 1; renderId(); renderCabinet(); }
  if(tab === "intel" && !loaded.intel){ loaded.intel = 1; loadIntel(); }
});

(async () => {
  const m = await meta();
  const sel = $("#frCategory");
  if(sel && m.categories) sel.innerHTML = `<option value="">${esc(t("ml_cat_all"))}</option>` +
    m.categories.map(c => `<option value="${c}">${esc(t("ml_cat_" + c, c))}</option>`).join("");
})();

chrome(() => {
  loadProducts(); loadPulse();
  if(loaded.auction) loadRequests();
  if(loaded.capital) loadCapital();
  if(loaded.cabinet){ renderId(); renderCabinet(); }
  if(loaded.intel) loadIntel();
});
loadProducts();
loadPulse();
if(location.hash === "#request") $$(".mk-tab").find(x => x.dataset.tab === "auction").click();
})();
