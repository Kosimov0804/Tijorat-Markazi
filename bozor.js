/* ============================================================
   BOZOR — client
   Catalog · RFQ exchange · Seller Center · Market Intelligence
   ============================================================ */
(() => {
const { $, $$, t, esc, escA, num, money, day, api, qs, ident, chip, chips,
        match, meters, ranks, kpi, funnel, rail, draft, empty, loading, say,
        tabs, segment, drawer, closeDrawer, applyStatic, chrome } = MK;

MK.setDict(typeof T_BOZOR !== "undefined" ? T_BOZOR : {});

const state = { channel: "", rfqChannel: "", products: [], facets: null, rfqs: [], seller: null };

/* ---------- catalog ---------- */
async function loadCatalog(){
  const grid = $("#bzGrid");
  grid.innerHTML = loading();
  const r = await api("/api/bozor/products?" + qs({
    q: $("#bzQ").value.trim(), channel: state.channel,
    sector: $("#bzSector").value, category: $("#bzCategory").value, region: $("#bzRegion").value,
    certified: $("#bzCert").checked, local: $("#bzLocal").checked,
  }));
  state.products = r.items || [];
  if(r.facets && !state.facets){ state.facets = r.facets; fillFacets(r.facets); }
  $("#bzCount").textContent = t("bz_count").replace("{n}", num(r.total || 0, 0));
  grid.innerHTML = state.products.length
    ? state.products.map(productCard).join("")
    : empty(t("bz_empty"));
}

function fillFacets(f){
  const put = (sel, values, allKey) => {
    const el = $(sel); if(!el) return;
    el.innerHTML = `<option value="">${esc(t(allKey))}</option>` +
      (values || []).map(v => `<option value="${escA(v)}">${esc(v)}</option>`).join("");
  };
  put("#bzSector", f.sectors, "bz_all_sectors");
  put("#bzCategory", f.categories, "bz_all_cats");
  put("#bzRegion", f.regions, "bz_all_regions");
}

function chanChips(list){
  return `<div class="mk-chips">${(list || []).map(c =>
    `<span class="mk-chip is-${esc(c)}">${esc(c === "export" ? t("bz_ch_export") : c.toUpperCase())}</span>`).join("")}</div>`;
}

function productCard(p){
  const price = p.price ? `${num(p.price, 2)} <small>${esc(p.currency)}/${esc(p.unit)}</small>` : "—";
  return `<article class="mk-card" data-product="${escA(p.id)}" tabindex="0" role="button">
    ${chanChips(p.channels)}
    <h3>${esc(p.title)}</h3>
    ${p.desc ? `<p class="mk-desc">${esc(p.desc)}</p>` : ""}
    <div class="mk-meta">
      <span>${esc(p.company)}</span>
      ${p.region ? `<span>📍 <b>${esc(p.region)}</b></span>` : ""}
      ${p.moq ? `<span>MOQ <b>${num(p.moq, 0)}</b></span>` : ""}
      ${p.leadTime ? `<span>${esc(t("bz_lead_label"))} <b>${num(p.leadTime, 0)} ${esc(t("bz_days"))}</b></span>` : ""}
    </div>
    ${p.certificates && p.certificates.length ? chips(p.certificates.slice(0, 3), "ghost") : ""}
    <div class="mk-card-foot">
      <span class="mk-price">${price}</span>
      ${p.localMade ? `<span class="mk-chip is-accent">${esc(t("bz_local"))}</span>` : ""}
      ${p.verified ? `<span class="mk-badge">${esc(t("bz_verified"))}</span>` : ""}
    </div>
  </article>`;
}

/* Product detail — the TZ's "one-click actions" live here (§4.2). */
function openProduct(id){
  const p = state.products.find(x => x.id === id);
  if(!p) return;
  const tiers = (p.tiers || []).length
    ? `<div class="mk-tablewrap"><table class="mk-table" style="min-width:0">
        <thead><tr><th>${esc(t("bz_from_qty"))}</th><th class="num">${esc(t("bz_unit_price"))}</th></tr></thead>
        <tbody>${p.tiers.map(x => `<tr><td>${num(x.from, 0)} ${esc(p.unit)}</td>
          <td class="num">${num(x.price, 2)} ${esc(p.currency)}</td></tr>`).join("")}</tbody></table></div>` : "";
  const rows = [
    [t("bz_f_category"), p.category], [t("bz_sku"), p.sku], [t("bz_brand"), p.brand],
    [t("bz_specs"), p.specs], [t("bz_f_region"), p.region],
    [t("bz_stock"), p.stock ? num(p.stock, 0) + " " + p.unit : ""],
    ["HS-code", p.hs], ["Incoterms", (p.incoterms || []).join(", ")],
    [t("bz_markets"), (p.markets || []).join(", ")],
    [t("bz_f_certs"), (p.certificates || []).join(", ")],
  ].filter(r => r[1]).map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join("");

  drawer(`
    ${chanChips(p.channels)}
    <p class="mk-desc" style="-webkit-line-clamp:99">${esc(p.desc)}</p>
    <div class="mk-price" style="font-size:26px">${p.price ? num(p.price, 2) + ` <small>${esc(p.currency)}/${esc(p.unit)}</small>` : "—"}</div>
    ${tiers}
    <dl class="mk-kv">${rows}</dl>
    <div class="mk-actions">
      <button class="btn btn-primary" type="button" data-act="rfq" data-i18n="bz_act_rfq">Taklif so'rash (RFQ)</button>
      <a class="btn btn-ghost" href="moliya.html#request">${esc(t("bz_act_finance"))}</a>
    </div>
    <p class="mk-note">${esc(t("bz_seller_note"))} <b>${esc(p.company)}</b>${p.sector ? " · " + esc(p.sector) : ""}</p>
  `, p.title);

  const btn = $("#mkDrawerBody [data-act='rfq']");
  if(btn) btn.addEventListener("click", () => {
    closeDrawer();
    $$(".mk-tab").find(x => x.dataset.tab === "rfq").click();
    $("#rqTitle").value = p.title;
    $("#rqCategory").value = p.category || "";
    $("#rqUnit").value = p.unit || "";
    $("#rqChannel").value = (p.channels || ["b2b"])[0];
    $("#rqCerts").value = (p.certificates || []).join(", ");
    $("#rqTitle").focus();
  });
  applyStatic();
}

/* ---------- RFQ exchange ---------- */
async function loadRfqs(){
  const grid = $("#bzRfqGrid");
  grid.innerHTML = loading();
  const r = await api("/api/bozor/rfqs?" + qs({ channel: state.rfqChannel }));
  state.rfqs = r.items || [];
  $("#bzRfqCount").textContent = t("bz_rfq_count").replace("{n}", num(state.rfqs.length, 0));
  grid.innerHTML = state.rfqs.length ? state.rfqs.map(rfqCard).join("") : empty(t("bz_rfq_empty"));
}

function rfqCard(r){
  const st = { open: "good", shortlisted: "warn", awarded: "accent", closed: "ghost" }[r.status] || "ghost";
  return `<article class="mk-card" data-rfq="${escA(r.id)}" tabindex="0" role="button">
    <div class="mk-chips">
      <span class="mk-chip is-${esc(r.channel)}">${esc(r.channel === "export" ? t("bz_ch_export") : r.channel.toUpperCase())}</span>
      ${chip(t("status_" + r.status), st)}
    </div>
    <h3>${esc(r.title)}</h3>
    ${r.spec ? `<p class="mk-desc">${esc(r.spec)}</p>` : ""}
    <div class="mk-meta">
      <span>${esc(r.buyerName)}</span>
      ${r.qty ? `<span>${esc(t("bz_f_qty"))} <b>${num(r.qty, 0)} ${esc(r.unit)}</b></span>` : ""}
      ${r.country ? `<span>🌍 <b>${esc(r.country)}</b></span>` : r.region ? `<span>📍 <b>${esc(r.region)}</b></span>` : ""}
      ${r.deadline ? `<span>⏳ <b>${esc(r.deadline)}</b></span>` : ""}
    </div>
    <div class="mk-card-foot">
      <span class="mk-price">${r.budget ? money(r.budget, r.currency) : "—"}</span>
      <span class="mk-chip">${esc(t("bz_quotes"))}: ${num(r.quoteCount || 0, 0)}</span>
    </div>
  </article>`;
}

/* RFQ detail: matched suppliers with reasons, plus the quote comparison. */
async function openRfq(id){
  drawer(loading(), "");
  const [m, q] = await Promise.all([
    api("/api/bozor/rfq/matches?" + qs({ id })),
    api("/api/bozor/quotes?" + qs({ rfqId: id })),
  ]);
  if(m.error) return drawer(empty(t("bz_rfq_empty")), "");
  const r = m.rfq;
  const matchHtml = (m.matches || []).slice(0, 6).map(x =>
    match(x, `${esc(x.product.title)} — <span style="color:var(--muted);font-weight:500">${esc(x.product.company)}</span>`)).join("");
  const quoteRows = (q.quotes || []).map(x => `<tr class="${x.bestPrice ? "is-best" : ""}">
      <td>${esc(x.sellerName)}</td>
      <td class="num">${num(x.price, 2)} ${esc(x.currency)}${x.bestPrice ? " ★" : ""}</td>
      <td class="num">${x.leadTime ? num(x.leadTime, 0) : "—"}</td>
      <td>${esc(x.incoterm || "—")}</td>
      <td>${esc(x.validity || "—")}</td>
    </tr>`).join("");

  drawer(`
    <div class="mk-chips">
      <span class="mk-chip is-${esc(r.channel)}">${esc(r.channel === "export" ? t("bz_ch_export") : r.channel.toUpperCase())}</span>
      ${chip(t("status_" + r.status), "ghost")}
    </div>
    <p class="mk-desc" style="-webkit-line-clamp:99">${esc(r.spec)}</p>
    <dl class="mk-kv">
      ${r.qty ? `<dt>${esc(t("bz_f_qty"))}</dt><dd>${num(r.qty, 0)} ${esc(r.unit)}</dd>` : ""}
      ${r.budget ? `<dt>${esc(t("bz_f_budget"))}</dt><dd>${money(r.budget, r.currency)}</dd>` : ""}
      ${r.maxLead ? `<dt>${esc(t("bz_f_maxlead"))}</dt><dd>${num(r.maxLead, 0)} ${esc(t("bz_days"))}</dd>` : ""}
      ${r.country ? `<dt>${esc(t("bz_f_country"))}</dt><dd>${esc(r.country)}</dd>` : ""}
      ${(r.certificates || []).length ? `<dt>${esc(t("bz_f_certs"))}</dt><dd>${esc(r.certificates.join(", "))}</dd>` : ""}
      <dt>${esc(t("bz_created"))}</dt><dd>${day(r.created)}</dd>
    </dl>
    <h3 class="mk-h">${esc(t("bz_matched"))}</h3>
    <div class="mk-stack">${matchHtml || empty(t("bz_no_match"))}</div>
    ${quoteRows ? `<h3 class="mk-h">${esc(t("bz_quote_compare"))}</h3>
      <div class="mk-tablewrap"><table class="mk-table">
        <thead><tr><th>${esc(t("bz_seller"))}</th><th class="num">${esc(t("bz_price"))}</th>
        <th class="num">${esc(t("bz_lead_label"))}</th><th>Incoterm</th><th>${esc(t("bz_validity"))}</th></tr></thead>
        <tbody>${quoteRows}</tbody></table></div>` : ""}
  `, r.title);
}

async function submitRfq(e){
  e.preventDefault();
  const msg = $("#bzRfqMsg");
  const body = ident.me({
    title: $("#rqTitle").value, spec: $("#rqSpec").value, channel: $("#rqChannel").value,
    category: $("#rqCategory").value, qty: $("#rqQty").value, unit: $("#rqUnit").value,
    budget: $("#rqBudget").value, currency: $("#rqCurrency").value, region: $("#rqRegion").value,
    country: $("#rqCountry").value, maxLead: $("#rqMaxLead").value, incoterm: $("#rqIncoterm").value,
    certificates: $("#rqCerts").value, contact: $("#rqContact").value,
  });
  if(!body.title.trim()) return say(msg, t("bz_need_title"), "err");
  const r = await api("/api/bozor/rfq", body);
  if(!r.ok) return say(msg, t("bz_rfq_fail"), "err");
  say(msg, t("bz_rfq_ok").replace("{n}", (r.matches || []).length), "ok");
  $("#bzRfqForm").reset();
  $("#bzRfqMatches").innerHTML = (r.matches || []).length
    ? `<div class="mk-box w12"><h3>${esc(t("bz_instant_match"))}</h3><div class="mk-stack">${
        r.matches.slice(0, 5).map(x => match(x,
          `${esc(x.product.title)} — <span style="color:var(--muted);font-weight:500">${esc(x.product.company)}</span>`)).join("")
      }</div></div>` : "";
  loadRfqs();
}

/* ---------- seller center ---------- */
function renderId(){
  const c = ident.company();
  const bar = $("#bzId");
  bar.innerHTML = c
    ? `<b>${esc(c.name)}</b> <span class="mk-chip is-accent">${esc(c.sector || "—")}</span>
       <span class="mk-id-r"><button class="btn btn-ghost" type="button" id="bzOut">${esc(t("bz_logout"))}</button></span>`
    : `<span>${esc(t("bz_login_hint"))}</span>
       <span class="mk-id-r">
         <input id="bzLogin" placeholder="${escA(t("bz_login"))}" autocomplete="username" />
         <input id="bzPass" type="password" placeholder="${escA(t("bz_pass"))}" autocomplete="current-password" />
         <button class="btn btn-primary" type="button" id="bzIn">${esc(t("bz_enter"))}</button>
       </span>`;
  if(c) $("#bzOut").addEventListener("click", () => { ident.setCompany(null); renderId(); renderSeller(); });
  else {
    const go = async () => {
      const r = await MK.companyLogin($("#bzLogin").value.trim(), $("#bzPass").value);
      if(r.error) return say($("#bzId"), t("bz_login_fail"), "err");
      renderId(); renderSeller();
    };
    $("#bzIn").addEventListener("click", go);
    $("#bzPass").addEventListener("keydown", e => { if(e.key === "Enter") go(); });
  }
}

async function renderSeller(){
  const host = $("#bzSeller");
  if(!ident.company()){ host.innerHTML = empty(t("bz_login_needed")); return; }
  host.innerHTML = loading();
  const r = await api("/api/bozor/seller", ident.co());
  if(!r.ok){ ident.setCompany(null); renderId(); host.innerHTML = empty(t("bz_login_needed")); return; }
  state.seller = r;

  const inbox = (r.inbox || []).slice(0, 5).map(x => `
    <div class="mk-match">
      <div class="mk-dial" style="--v:${x.score}"><b>${num(x.score, 0)}</b></div>
      <div>
        <div class="mk-h">${esc(x.title)}</div>
        <div class="mk-meta"><span>${esc(x.buyerName)}</span>
          ${x.qty ? `<span>${num(x.qty, 0)} ${esc(x.unit)}</span>` : ""}
          ${x.budget ? `<span>${money(x.budget, x.currency)}</span>` : ""}</div>
        <ul class="mk-why">${(x.reasons || []).slice(0, 2).map(y => `<li>${esc(y)}</li>`).join("")}
          ${(x.gaps || []).slice(0, 1).map(y => `<li class="is-gap">${esc(y)}</li>`).join("")}</ul>
        <div class="mk-actions" style="margin-top:8px">
          <button class="btn btn-ghost" type="button" data-quote="${escA(x.id)}" data-pid="${escA(x.productId)}"
            data-unit="${escA(x.unit)}" data-cur="${escA(x.currency)}" data-qty="${escA(x.qty)}">${esc(t("bz_send_quote"))}</button>
        </div>
      </div>
    </div>`).join("");

  const deals = (r.deals || []).map(d => `
    <div class="mk-card" style="gap:8px">
      <div class="mk-chips"><span class="mk-chip is-${esc(d.channel)}">${esc(d.channel.toUpperCase())}</span>
        ${chip(t("stage_" + d.stage), "accent")}</div>
      <h3>${esc(d.title)}</h3>
      <div class="mk-meta"><span>${esc(d.buyerName)} → ${esc(d.sellerName)}</span>
        <span class="mk-price" style="font-size:15px">${money(d.value, d.currency)}</span></div>
      ${(d.risks || []).length ? `<div class="mk-chips">${d.risks.map(x => chip(x, "warn")).join("")}</div>` : ""}
      ${rail(["lead","qualified","rfq","quote","negotiation","order","fulfilment","closed"], d.stage)}
    </div>`).join("");

  host.innerHTML = `
    <div class="mk-bento">
      <div class="mk-box w3 is-lead">
        <h3>${esc(t("bz_trust"))}</h3>
        <div class="mk-score-big"><b>${esc(r.trust.level)}</b><span>${esc(r.trust.badge)}</span></div>
        <div class="mk-meta"><span>${esc(t("bz_products"))} <b>${num(r.trust.products, 0)}</b></span>
          <span>${esc(t("bz_deals"))} <b>${num(r.trust.deals, 0)}</b></span></div>
      </div>
      <div class="mk-box w3">
        <h3>${esc(t("bz_export_ready"))}</h3>
        <div class="mk-score-big"><b>${num(r.exportReadiness.score, 0)}</b><span>/ 100</span></div>
        ${meters(r.exportReadiness.blocks)}
      </div>
      <div class="mk-box w6">
        <h3>${esc(t("bz_inbox"))}</h3>
        <div class="mk-stack">${inbox || empty(t("bz_inbox_empty"))}</div>
      </div>

      <div class="mk-box w6">
        <h3>${esc(t("bz_my_products"))}</h3>
        <div class="mk-stack" id="bzMine">${(r.products || []).map(p => `
          <div class="mk-card" style="gap:7px">
            ${chanChips(p.channels)}
            <h3>${esc(p.title)}</h3>
            <div class="mk-meta">
              <span class="mk-price" style="font-size:15px">${p.price ? num(p.price, 2) + " " + esc(p.currency) + "/" + esc(p.unit) : "—"}</span>
              ${p.moq ? `<span>MOQ <b>${num(p.moq, 0)}</b></span>` : ""}
              ${chip(t("status_" + p.status), p.status === "live" ? "good" : "ghost")}
            </div>
            <div class="mk-actions"><button class="btn btn-ghost" type="button" data-del="${escA(p.id)}">${esc(t("bz_delete"))}</button></div>
          </div>`).join("") || empty(t("bz_no_products"))}</div>
      </div>

      <div class="mk-box w6">
        <h3>${esc(t("bz_inquiries"))} <span class="mk-chip">${num((r.inquiries || []).filter(i => i.status === "new").length, 0)} ${esc(t("bz_iq_new"))}</span></h3>
        <div class="mk-stack">${inquiryList(r.inquiries)}</div>
      </div>
      <div class="mk-box w6">${aiBlock()}</div>
      <div class="mk-box w12">${productFormHtml()}</div>
      <div class="mk-box w12"><h3>${esc(t("bz_deals"))}</h3>
        <div class="mk-grid">${deals || empty(t("bz_no_deals"))}</div></div>
    </div>`;

  wireSeller();
  applyStatic();
}

/* Direct enquiries from the showroom product pages. A company that never opens
   Bozor still gets its leads here, because this is where its cabinet lives. */
function inquiryList(rows){
  if(!(rows || []).length) return empty(t("bz_no_inquiries"));
  return rows.map(i => `
    <div class="mk-card" style="gap:8px">
      <div class="mk-chips">
        ${chip(t("bz_iq_" + i.status, i.status), i.status === "new" ? "warn" : i.status === "answered" ? "good" : "ghost")}
        ${i.source ? chip(i.source, "ghost") : ""}
      </div>
      <h3>${esc(i.productName || t("bz_iq_general"))}</h3>
      ${i.message ? `<p class="mk-desc">${esc(i.message)}</p>` : ""}
      <div class="mk-meta">
        <span><b>${esc(i.buyerName)}</b>${i.company ? " · " + esc(i.company) : ""}</span>
        ${i.country ? `<span>🌍 ${esc(i.country)}</span>` : ""}
        ${i.qty ? `<span>${num(i.qty, 0)} ${esc(i.unit || "")}</span>` : ""}
        <span>${day(i.created)}</span>
      </div>
      <div class="mk-meta" style="font-size:13.5px">
        ${i.buyerEmail ? `<span>✉ <a href="mailto:${escA(i.buyerEmail)}" style="color:var(--mk);font-weight:600">${esc(i.buyerEmail)}</a></span>` : ""}
        ${i.contact ? `<span>📞 <b>${esc(i.contact)}</b></span>` : ""}
      </div>
      ${(i.replies || []).map(rep => `
        <div style="padding:9px 12px;background:var(--mk-soft);border-radius:var(--radius-sm);font-size:13.5px">
          <b>${esc(rep.by)}</b> — ${esc(rep.text)}
        </div>`).join("")}
      ${i.status !== "closed" ? `
        <div class="mk-row">
          <input data-reply-for="${escA(i.id)}" placeholder="${escA(t("bz_iq_reply_ph"))}"
            style="flex:1 1 200px;padding:8px 11px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--card);color:var(--ink);font:inherit;font-size:14px" />
          <button class="btn btn-ghost" type="button" data-reply="${escA(i.id)}" style="padding:6px 14px;font-size:13px">${esc(t("bz_iq_reply"))}</button>
          <button class="btn btn-ghost" type="button" data-close-iq="${escA(i.id)}" style="padding:6px 14px;font-size:13px">${esc(t("bz_iq_close"))}</button>
        </div>` : ""}
    </div>`).join("");
}

const aiBlock = () => `
  <h3>${esc(t("bz_ai_title"))}</h3>
  <div class="mk-ai">
    <h3>${esc(t("bz_ai_catalog"))}</h3>
    <p style="font-size:13.5px;color:var(--text)">${esc(t("bz_ai_hint"))}</p>
    <textarea id="bzAiText" class="mk-f" style="width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--card);color:var(--ink);font:inherit"
      placeholder="${escA(t("bz_ai_ph"))}"></textarea>
    <div class="mk-actions">
      <button class="btn btn-primary" type="button" id="bzAiGo">${esc(t("bz_ai_go"))}</button>
      <button class="btn btn-ghost" type="button" id="bzAiApply" hidden>${esc(t("bz_ai_apply"))}</button>
    </div>
    <div id="bzAiOut"></div>
  </div>`;

const productFormHtml = () => `
  <h3>${esc(t("bz_add_product"))}</h3>
  <form class="mk-form" id="bzProductForm">
    <div class="mk-f wide"><label>${esc(t("bz_f_title"))}</label><input id="pTitle" required /></div>
    <div class="mk-f wide"><label>${esc(t("bz_f_desc"))}</label><textarea id="pDesc"></textarea></div>
    <div class="mk-f"><label>${esc(t("bz_f_category"))}</label><input id="pCategory" /></div>
    <div class="mk-f"><label>${esc(t("bz_brand"))}</label><input id="pBrand" /></div>
    <div class="mk-f"><label>${esc(t("bz_price"))}</label><input id="pPrice" type="number" step="0.01" min="0" /></div>
    <div class="mk-f"><label>${esc(t("bz_f_currency"))}</label>
      <select id="pCurrency"><option>UZS</option><option>USD</option><option>EUR</option><option>RUB</option><option>CNY</option></select></div>
    <div class="mk-f"><label>${esc(t("bz_f_unit"))}</label><input id="pUnit" placeholder="kg" /></div>
    <div class="mk-f"><label>MOQ</label><input id="pMoq" type="number" min="0" /></div>
    <div class="mk-f"><label>${esc(t("bz_lead_label"))} (${esc(t("bz_days"))})</label><input id="pLead" type="number" min="0" /></div>
    <div class="mk-f"><label>${esc(t("bz_stock"))}</label><input id="pStock" type="number" min="0" /></div>
    <div class="mk-f"><label>${esc(t("bz_f_region"))}</label><input id="pRegion" /></div>
    <div class="mk-f"><label>HS-code</label><input id="pHs" /></div>
    <div class="mk-f"><label>Incoterms</label><input id="pIncoterms" placeholder="FOB, CIF" /></div>
    <div class="mk-f"><label>${esc(t("bz_markets"))}</label><input id="pMarkets" placeholder="Russia, Poland" /></div>
    <div class="mk-f wide"><label>${esc(t("bz_f_certs"))}</label><input id="pCerts" placeholder="ISO 22000, Halal" /></div>
    <div class="mk-f wide"><label>${esc(t("bz_specs"))}</label><textarea id="pSpecs"></textarea></div>
    <div class="mk-f wide"><label>${esc(t("bz_channels"))}</label>
      <div class="mk-checks">
        <label><input type="checkbox" value="b2b" checked class="pCh" /> B2B</label>
        <label><input type="checkbox" value="b2g" class="pCh" /> B2G</label>
        <label><input type="checkbox" value="export" class="pCh" /> ${esc(t("bz_ch_export"))}</label>
        <label><input type="checkbox" id="pLocal" /> ${esc(t("bz_local"))}</label>
      </div></div>
    <div class="mk-actions wide">
      <button class="btn btn-primary" type="submit">${esc(t("bz_publish"))}</button>
      <p class="mk-msg" id="bzPMsg" hidden></p>
    </div>
  </form>`;

function wireSeller(){
  const form = $("#bzProductForm");
  if(form) form.addEventListener("submit", async e => {
    e.preventDefault();
    const msg = $("#bzPMsg");
    const r = await api("/api/bozor/product", ident.co({
      title: $("#pTitle").value, desc: $("#pDesc").value, category: $("#pCategory").value,
      brand: $("#pBrand").value, price: $("#pPrice").value, currency: $("#pCurrency").value,
      unit: $("#pUnit").value, moq: $("#pMoq").value, leadTime: $("#pLead").value,
      stock: $("#pStock").value, region: $("#pRegion").value, hs: $("#pHs").value,
      incoterms: $("#pIncoterms").value, markets: $("#pMarkets").value, certificates: $("#pCerts").value,
      specs: $("#pSpecs").value, localMade: $("#pLocal").checked,
      channels: $$(".pCh").filter(x => x.checked).map(x => x.value),
    }));
    if(!r.ok) return say(msg, t("bz_save_fail"), "err");
    say(msg, t("bz_save_ok"), "ok");
    form.reset();
    renderSeller();
  });

  $("#bzSeller").addEventListener("click", async e => {
    const del = e.target.closest("[data-del]");
    if(del){
      if(!await UI.confirm(t("bz_confirm_del"), { tone:"danger" })) return;
      await api("/api/bozor/product/delete", ident.co({ id: del.dataset.del }));
      return renderSeller();
    }
    const qBtn = e.target.closest("[data-quote]");
    if(qBtn) return quoteDrawer(qBtn.dataset);

    const rep = e.target.closest("[data-reply]");
    if(rep){
      const field = $(`[data-reply-for="${rep.dataset.reply}"]`);
      const text = field ? field.value.trim() : "";
      if(!text) return;
      await api("/api/bozor/inquiry/reply", ident.co({ id: rep.dataset.reply, text }));
      return renderSeller();
    }
    const cl = e.target.closest("[data-close-iq]");
    if(cl){
      await api("/api/bozor/inquiry/reply", ident.co({ id: cl.dataset.closeIq, status: "closed" }));
      return renderSeller();
    }
  });

  const go = $("#bzAiGo");
  if(go) go.addEventListener("click", async () => {
    const out = $("#bzAiOut");
    const text = $("#bzAiText").value.trim();
    if(!text) return say(out, t("bz_ai_need"), "err");
    out.innerHTML = loading();
    const c = ident.company();
    const r = await api("/api/copilot", ident.co({
      agent: "bozor.catalog", lang: MK.lang(), text, sector: c && c.sector, company: c && c.name }));
    out.innerHTML = draft(r, [
      { label: t("bz_f_title"), get: d => d.title },
      { label: t("bz_f_desc"), get: d => d.desc },
      { label: t("bz_f_category"), get: d => d.category },
      { label: t("bz_specs"), get: d => d.specs },
      { label: t("bz_channels"), get: d => (d.channels || []).join(", ") },
      { label: "HS-code", get: d => d.hs },
      { label: "Incoterms", get: d => (d.incoterms || []).join(", ") },
      { label: t("bz_markets"), get: d => (d.markets || []).join(", ") },
      { label: t("bz_f_certs"), get: d => (d.certificates || []).join(", ") },
    ]);
    const apply = $("#bzAiApply");
    if(r.ok && apply){
      apply.hidden = false;
      apply.onclick = () => {
        const d = r.data;
        const set = (sel, v) => { const el = $(sel); if(el && v) el.value = Array.isArray(v) ? v.join(", ") : v; };
        set("#pTitle", d.title); set("#pDesc", d.desc); set("#pCategory", d.category);
        set("#pSpecs", d.specs); set("#pHs", d.hs); set("#pIncoterms", d.incoterms);
        set("#pMarkets", d.markets); set("#pCerts", d.certificates); set("#pUnit", d.unit);
        $$(".pCh").forEach(x => { x.checked = (d.channels || []).includes(x.value); });
        $("#pTitle").scrollIntoView({ behavior: "smooth", block: "center" });
      };
    }
  });
}

/* Quote form for one inbound RFQ. */
function quoteDrawer(d){
  drawer(`
    <form class="mk-form" id="bzQuoteForm">
      <div class="mk-f"><label>${esc(t("bz_price"))}</label><input id="qPrice" type="number" step="0.01" required /></div>
      <div class="mk-f"><label>${esc(t("bz_f_currency"))}</label>
        <select id="qCurrency"><option>UZS</option><option>USD</option><option>EUR</option><option>RUB</option><option>CNY</option></select></div>
      <div class="mk-f"><label>${esc(t("bz_f_qty"))}</label><input id="qQty" type="number" value="${escA(d.qty || "")}" /></div>
      <div class="mk-f"><label>${esc(t("bz_lead_label"))} (${esc(t("bz_days"))})</label><input id="qLead" type="number" /></div>
      <div class="mk-f"><label>Incoterm</label><input id="qIncoterm" /></div>
      <div class="mk-f"><label>${esc(t("bz_validity"))}</label><input id="qValidity" type="date" /></div>
      <div class="mk-f wide"><label>${esc(t("bz_terms"))}</label><textarea id="qTerms"></textarea></div>
      <div class="mk-actions wide"><button class="btn btn-primary" type="submit">${esc(t("bz_send_quote"))}</button></div>
      <p class="mk-msg wide" id="bzQMsg" hidden></p>
    </form>`, t("bz_send_quote"));
  const cur = $("#qCurrency"); if(cur && d.cur) cur.value = d.cur;
  $("#bzQuoteForm").addEventListener("submit", async e => {
    e.preventDefault();
    const r = await api("/api/bozor/quote", ident.co({
      rfqId: d.quote, productId: d.pid, price: $("#qPrice").value, currency: $("#qCurrency").value,
      qty: $("#qQty").value, unit: d.unit, leadTime: $("#qLead").value,
      incoterm: $("#qIncoterm").value, validity: $("#qValidity").value, terms: $("#qTerms").value }));
    if(!r.ok) return say($("#bzQMsg"), t("bz_quote_fail"), "err");
    say($("#bzQMsg"), t("bz_quote_ok"), "ok");
    setTimeout(() => { closeDrawer(); renderSeller(); }, 900);
  });
}

/* ---------- intelligence ---------- */
async function loadIntel(){
  const host = $("#bzIntel");
  host.innerHTML = loading();
  const d = await api("/api/bozor/intel");
  const h = d.headline || {};
  host.innerHTML = `
    <div class="mk-kpis" style="margin-bottom:var(--mk-gap)">
      ${kpi(num(h.liveProducts, 0), t("bz_k_products"), { hero: true })}
      ${kpi(num(h.sellers, 0), t("bz_k_sellers"), { note: h.verifiedSellers ? h.verifiedSellers + " " + t("bz_verified") : "" })}
      ${kpi(num(h.rfqs, 0), t("bz_k_rfqs"))}
      ${kpi(num(h.quotes, 0), t("bz_k_quotes"))}
      ${kpi(MK.pctTxt(h.matchRate), t("bz_k_match"))}
      ${kpi(h.timeToFirstQuoteHours ? num(h.timeToFirstQuoteHours.median, 0) + " " + t("bz_hours") : "—", t("bz_k_ttfq"))}
    </div>
    <div class="mk-bento">
      <div class="mk-box w8 is-lead">
        <h3>${esc(t("bz_funnel"))}</h3>
        ${funnel([
          { n: d.funnel.search, label: t("bz_fn_search") }, { n: d.funnel.rfq, label: "RFQ" },
          { n: d.funnel.quote, label: t("bz_fn_quote") }, { n: d.funnel.deal, label: t("bz_fn_deal") },
          { n: d.funnel.won, label: t("bz_fn_won") }])}
        <p class="mk-note">${esc(t("bz_trade_value"))}: <b>${num(h.tradeValue, 0)}</b></p>
      </div>
      <div class="mk-box w4">
        <h3>${esc(t("bz_channels"))}</h3>
        ${ranks((d.channels || []).map(c => ({ label: c.id.toUpperCase(), n: c.products })), { limit: 3 })}
      </div>
      <div class="mk-box w6">
        <h3>${esc(t("bz_supply_gap"))}</h3>
        ${ranks(d.supplyGaps, { value: "ratio", digits: 1, gap: true, limit: 8,
          fmt: r => `${num(r.demand, 1)}↔${num(r.supply, 0)}` })}
        <p class="mk-note">${esc(t("bz_gap_note"))}</p>
      </div>
      <div class="mk-box w6"><h3>${esc(t("bz_top_search"))}</h3>${ranks(d.topSearches, { limit: 8 })}</div>
      <div class="mk-box w4"><h3>${esc(t("bz_top_cat"))}</h3>${ranks(d.topCategories, { limit: 7 })}</div>
      <div class="mk-box w4"><h3>${esc(t("bz_regions"))}</h3>${ranks(d.regions, { limit: 7 })}</div>
      <div class="mk-box w4"><h3>${esc(t("bz_export_markets"))}</h3>${ranks(d.exportMarkets, { limit: 7 })}</div>
    </div>`;
}

async function loadPulse(){
  const p = await api("/api/market/pulse");
  if(!p.ok) return;
  $("#bzPulse").innerHTML = [
    [p.bozor.products, t("bz_k_products")], [p.bozor.rfqs, t("bz_k_rfqs")],
    [p.bozor.deals, t("bz_fn_deal")], [MK.pctTxt(p.bozor.matchRate), t("bz_k_match")],
  ].map(([v, l]) => `<div><b>${typeof v === "number" ? num(v, 0) : v}</b><span>${esc(l)}</span></div>`).join("");
}

/* ---------- wiring ---------- */
let debounce;
["#bzQ", "#bzSector", "#bzCategory", "#bzRegion", "#bzCert", "#bzLocal"].forEach(sel => {
  const el = $(sel); if(!el) return;
  el.addEventListener(el.type === "search" ? "input" : "change", () => {
    clearTimeout(debounce); debounce = setTimeout(loadCatalog, el.type === "search" ? 300 : 0);
  });
});
segment("#bzChannel", v => { state.channel = v; loadCatalog(); });
segment("#bzRfqChannel", v => { state.rfqChannel = v; loadRfqs(); });
$("#bzGrid").addEventListener("click", e => {
  const c = e.target.closest("[data-product]"); if(c) openProduct(c.dataset.product);
});
$("#bzRfqGrid").addEventListener("click", e => {
  const c = e.target.closest("[data-rfq]"); if(c) openRfq(c.dataset.rfq);
});
$("#bzRfqForm").addEventListener("submit", submitRfq);

const loaded = {};
tabs("#bzTabs", tab => {
  if(tab === "rfq" && !loaded.rfq){ loaded.rfq = 1; loadRfqs(); }
  if(tab === "seller" && !loaded.seller){ loaded.seller = 1; renderId(); renderSeller(); }
  if(tab === "intel" && !loaded.intel){ loaded.intel = 1; loadIntel(); }
});

chrome(() => {
  state.facets = null;
  loadCatalog(); loadPulse();
  if(loaded.rfq) loadRfqs();
  if(loaded.seller){ renderId(); renderSeller(); }
  if(loaded.intel) loadIntel();
});
loadCatalog();
loadPulse();
})();
