/* ============================================================
   Business ID — the platform's public identity card.

   One page, three states, chosen by the query string:

     ?id=TM-CO-0042-K   the card itself
     (nothing)          the lookup: verify a number, browse the directory

   The card is the only page on the platform that is meant to be
   reached from outside it — off a printed number, off a scanned QR —
   so it asks for nothing and assumes nothing about the visitor.

   Everything shown here comes from /api/business-id, which builds its
   payload from a field whitelist. Nothing on this page is trusted
   enough to be written as markup: every value goes through esc().
   ============================================================ */
(() => {
const { $, $$, t, esc, escA, safeUrl, num, day, api, qs, empty, loading, applyStatic, chrome } = MK;

MK.setDict(typeof T_BIZID !== "undefined" ? T_BIZID : {});

const ID = new URLSearchParams(location.search).get("id") || "";
let DIRECTORY = null;

/* ---------- small shared pieces ---------- */

const kindLabel = k => t(k === "assoc" ? "bid_assoc" : "bid_company");

/**
 * Product photos live under /uploads, which MK.safeUrl rejects because it
 * only passes absolute http(s) addresses. This accepts those plus a
 * same-origin path — but not a protocol-relative "//host/x.jpg", which
 * looks like a path and loads from somebody else's server.
 */
const imgSrc = u => {
  const s = String(u || "");
  if(safeUrl(s)) return s;
  return s.startsWith("/") && !s.startsWith("//") ? s : "";
};

/** The number, set in the monospace it is meant to be read and typed in. */
const idPlate = id => `<span class="bid-plate">${esc(id)}</span>`;

/** A contact row renders only when it has a value — an empty card shows a note. */
function contactRows(c){
  const rows = [];
  const add = (labelKey, value, href, icon) => {
    if(!value) return;
    rows.push(`<div class="bid-row">
      <span class="bid-row-k">${esc(t(labelKey))}</span>
      ${href ? `<a class="bid-row-v" href="${escA(href)}"${/^https?:/.test(href) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(value)}</a>`
             : `<span class="bid-row-v">${esc(value)}</span>`}
    </div>`);
  };
  add("bid_phone", c.phone, c.phone ? "tel:" + c.phone.replace(/[^\d+]/g, "") : "");
  add("bid_email", c.email, c.email ? "mailto:" + c.email : "");
  add("bid_location", c.location, "");
  /* safeUrl is what keeps a javascript: address off the page even though
     the server already refused to store one. */
  add("bid_website", c.website, c.website ? safeUrl(c.website) : "");
  return rows.length ? rows.join("") : `<p class="bid-empty">${esc(t("bid_no_contact"))}</p>`;
}

/* ---------- the card ---------- */

function memberList(card){
  if(!card.companies.length) return `<p class="bid-empty">${esc(t("bid_no_members"))}</p>`;
  /* The name opens the company itself; its number opens the company's own
     card. Listing members straight to their cards made the card the only
     way into a company, which is backwards — the card is the contact sheet,
     not the company page. */
  return `<ul class="bid-members">${card.companies.map(c => `
    <li>
      <a href="korxona.html?id=${encodeURIComponent(c.bizId)}">
        <b>${esc(c.name)}</b>
      </a>
      <a class="bid-mono bid-memberid" href="biznes-id.html?id=${encodeURIComponent(c.bizId)}"
         title="Business ID">${esc(c.bizId)}</a>
      <span class="bid-meta">${esc(c.sector || "—")}${c.products ? ` · ${num(c.products, 0)} ${esc(t("bid_products"))}` : ""}</span>
    </li>`).join("")}</ul>`;
}

function showroomGrid(card){
  if(!card.showroom.length) return `<p class="bid-empty">${esc(t("bid_no_products"))}</p>`;
  return `<div class="bid-goods">${card.showroom.map(p => {
    const src = imgSrc(p.img);
    return `<a class="bid-good" href="mahsulot.html?id=${encodeURIComponent(p.id)}">
      ${src ? `<img src="${escA(src)}" alt="${escA(p.name)}" loading="lazy" />`
            : `<span class="bid-good-blank" aria-hidden="true"></span>`}
      <b>${esc(p.name)}</b>
      <span>${esc(p.price || t("pd_price_ask"))}</span>
    </a>`;
  }).join("")}</div>`;
}

function renderCard(card){
  const name = (card.i18n && card.i18n[MK.lang()]) || card.name;
  const isAssoc = card.kind === "assoc";

  /* The QR is an <img> onto the server-rendered SVG: the same code on
     screen, in print and in a screenshot, with no client-side library. */
  const qr = `<figure class="bid-qr">
      <img src="/api/business-id/qr.svg?id=${encodeURIComponent(card.bizId)}"
           alt="${escA(card.bizId)} QR" width="132" height="132" />
      <figcaption>${esc(t("bid_scan"))}</figcaption>
    </figure>`;

  const facts = isAssoc
    ? [["bid_chairman", card.chairman],
       ["bid_members", card.memberCount ? num(card.memberCount, 0) : ""],
       ["bid_products", card.productCount ? num(card.productCount, 0) : ""]]
    : [["bid_sector", card.sector],
       ["bid_member_of", card.assoc ? card.assoc.name : ""],
       ["bid_products", card.productCount ? num(card.productCount, 0) : ""]];

  const factRows = facts.filter(([, v]) => v !== "" && v != null).map(([k, v]) => `
    <div class="bid-row"><span class="bid-row-k">${esc(t(k))}</span>
      <span class="bid-row-v">${
        k === "bid_member_of" && card.assoc && card.assoc.bizId
          ? `<a href="biznes-id.html?id=${encodeURIComponent(card.assoc.bizId)}">${esc(v)}</a>`
          : esc(v)
      }</span></div>`).join("");

  return `
  <article class="bid-card" data-kind="${escA(card.kind)}">
    <span class="bid-weave" aria-hidden="true"></span>
    <header class="bid-head">
      <div class="bid-head-main">
        <span class="bid-kind">${esc(kindLabel(card.kind))}</span>
        <h1>${esc(name)}</h1>
        <p class="bid-official">${esc(t("bid_official"))}</p>
      </div>
      ${qr}
    </header>

    <!-- The written record sits on its own panel, lifted off the weave.
         The pattern stays legible as ground without ever competing with
         the text, which is what the two-layer treatment is for. -->
    <div class="bid-panel">
      <div class="bid-num">
        <span class="bid-row-k">${esc(t("bid_number"))}</span>
        ${idPlate(card.bizId)}
        ${card.since ? `<span class="bid-meta">${esc(t("bid_since"))}: ${esc(day(card.since))}</span>` : ""}
      </div>

      <div class="bid-cols">
        <section class="bid-block">
          <h2>${esc(t("bid_contact"))}</h2>
          ${contactRows(card.contact)}
        </section>
        <section class="bid-block">
          <h2>${esc(kindLabel(card.kind))}</h2>
          ${factRows || `<p class="bid-empty">—</p>`}
        </section>
      </div>
    </div>

    <div class="bid-actions">
      <button class="btn btn-primary" type="button" id="bidPrint">${esc(t("bid_print"))}</button>
      <button class="btn btn-ghost" type="button" id="bidCopy">${esc(t("bid_copy"))}</button>
    </div>
  </article>

  <section class="bid-extra">
    <h2>${esc(t(isAssoc ? "bid_members" : "bid_showroom"))}</h2>
    ${isAssoc ? memberList(card) : showroomGrid(card)}
  </section>`;
}

/* ---------- the lookup ---------- */

function verdict(v){
  if(v.ok) return `<div class="bid-verdict is-ok">
      <b>${esc(t("bid_valid"))}</b>
      <p>${idPlate(v.bizId)} — ${esc(v.name)} <span class="bid-meta">(${esc(kindLabel(v.kind))})</span></p>
      <a class="btn btn-primary" href="biznes-id.html?id=${encodeURIComponent(v.bizId)}">${esc(t("bid_open_card"))}</a>
    </div>`;
  return `<div class="bid-verdict is-bad">
      <b>${esc(t(v.reason === "unknown" ? "bid_unknown" : "bid_malformed"))}</b>
    </div>`;
}

/**
 * The register as cards rather than rows. A card carries the three things
 * someone scanning the list actually compares — who it is, which kind, and
 * the number they may have been given — and the kind is colour-coded so the
 * filter above has a visible effect even before you read the labels.
 */
function directoryList(rows){
  if(!rows.length) return `<p class="bid-empty">${esc(t("bid_nothing"))}</p>`;
  return `<div class="bid-cards">${rows.map(r => {
    const nm = (r.i18n && r.i18n[MK.lang()]) || r.name || "";
    const isAssoc = r.kind === "assoc";
    /* Companies show their sector when they have one; it is the more useful
       label there, and the kind is already carried by the colour and letter. */
    const meta = isAssoc ? t("bid_assoc") : (r.sector || t("bid_company"));
    return `<a class="bid-c" data-kind="${escA(r.kind)}"
       href="biznes-id.html?id=${encodeURIComponent(r.bizId)}">
      <span class="bid-c-mark" aria-hidden="true">${esc((nm.trim()[0] || "?").toUpperCase())}</span>
      <span class="bid-c-body">
        <b>${esc(nm)}</b>
        <span class="bid-c-meta">${esc(meta)}</span>
      </span>
      <span class="bid-c-id">${esc(r.bizId)}</span>
    </a>`;
  }).join("")}</div>`;
}

function renderLookup(){
  return `
  <div class="bid-lead">
    <h1>${esc(t("bid_title"))}</h1>
    <p>${esc(t("bid_lead"))}</p>
  </div>

  <section class="bid-block bid-verify">
    <h2>${esc(t("bid_lookup"))}</h2>
    <p class="bid-meta">${esc(t("bid_lookup_lead"))}</p>
    <form class="bid-form" id="bidForm" autocomplete="off">
      <input id="bidInput" type="text" inputmode="latin" spellcheck="false"
             placeholder="${escA(t("bid_lookup_ph"))}" aria-label="${escA(t("bid_lookup"))}" />
      <button class="btn btn-primary" type="submit">${esc(t("bid_check"))}</button>
    </form>
    <div id="bidVerdict" aria-live="polite"></div>
  </section>

  <section class="bid-block">
    <h2>${esc(t("bid_directory"))}</h2>
    <div class="bid-filters">
      <div class="mk-seg" id="bidKind" role="group" aria-label="${escA(t("bid_directory"))}">
        <button type="button" data-value="" class="is-on">${esc(t("bid_f_all"))}</button>
        <button type="button" data-value="assoc">${esc(t("bid_f_assocs"))}</button>
        <button type="button" data-value="company">${esc(t("bid_f_companies"))}</button>
      </div>
      <span class="bid-count" id="bidCount" aria-live="polite"></span>
    </div>
    <input id="bidSearch" class="bid-search" type="search" spellcheck="false"
           placeholder="${escA(t("bid_search_ph"))}" aria-label="${escA(t("bid_search_ph"))}" />
    <div id="bidDir">${loading()}</div>
  </section>`;
}

/* ---------- wiring ---------- */

function wireCard(card){
  const p = $("#bidPrint"); if(p) p.addEventListener("click", () => window.print());
  const c = $("#bidCopy");
  if(c) c.addEventListener("click", async () => {
    const link = card.url || location.href;
    try{ await navigator.clipboard.writeText(link); UI.toast(t("bid_copied"), { tone: "success" }); }
    catch(e){ await UI.prompt(t("bid_copy"), link); }
  });
}

function wireLookup(){
  const form = $("#bidForm"), input = $("#bidInput"), out = $("#bidVerdict");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const v = input.value.trim();
    if(!v){ out.innerHTML = ""; return; }
    out.innerHTML = loading();
    const r = await api("/api/business-id/verify?" + qs({ id: v }));
    out.innerHTML = verdict(r && typeof r.ok === "boolean" ? r : { ok: false, reason: "malformed" });
  });

  const search = $("#bidSearch"), host = $("#bidDir"), count = $("#bidCount");
  /* Kind and text narrow the same list rather than replacing each other, so
     "Korxonalar" + a search term means both, which is what a filter pair is
     expected to do. */
  let kind = "";

  const paint = () => {
    const q = search.value.trim().toLowerCase();
    const rows = (DIRECTORY || []).filter(r => {
      if(kind && r.kind !== kind) return false;
      if(!q) return true;
      const nm = ((r.i18n && r.i18n[MK.lang()]) || r.name || "").toLowerCase();
      return nm.includes(q)
        || (r.bizId || "").toLowerCase().includes(q)
        || (r.sector || "").toLowerCase().includes(q);
    });
    if(count) count.textContent = t("bid_count").replace("{n}", num(rows.length, 0));
    host.innerHTML = directoryList(rows.slice(0, 120));
  };

  search.addEventListener("input", paint);
  MK.segment("#bidKind", v => { kind = v; paint(); });

  api("/api/business-id/directory").then(r => {
    DIRECTORY = (r && r.items) || [];
    paint();
  });
}

/* ---------- boot ---------- */

async function load(){
  const root = $("#bidRoot");

  if(!ID){
    root.innerHTML = renderLookup();
    wireLookup();
    return;
  }

  root.innerHTML = loading();
  const card = await api("/api/business-id?" + qs({ id: ID }));
  if(!card || !card.ok){
    root.innerHTML = `<div class="bid-lead"><h1>${esc(t("bid_title"))}</h1></div>`
      + empty(t("bid_notfound"))
      + `<p class="bid-actions"><a class="btn btn-ghost" href="biznes-id.html">${esc(t("bid_lookup"))}</a></p>`;
    return;
  }
  document.title = ((card.i18n && card.i18n[MK.lang()]) || card.name) + " — Business ID";
  root.innerHTML = renderCard(card);
  wireCard(card);
}

chrome();
applyStatic();
load();
})();
