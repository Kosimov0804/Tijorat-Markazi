/* ============================================================
   A member company's own public page.

   The platform had no public face for a company. Its products were
   reachable through the showroom filter, its association listed its
   name — but a company that had not published anything yet was not
   reachable at all, and the association page rendered it as a dead
   card. This is that missing page.

   It is deliberately thinner than the Business ID card. This page
   answers "who is this and what do they sell"; the card answers "how
   do I reach them, and is this real". So contact details live there,
   behind one clearly-labelled button, rather than being duplicated
   here where they would drift.
   ============================================================ */
(() => {
const { $, t, esc, escA, safeUrl, num, day, api, qs, empty, loading, applyStatic, chrome } = MK;

MK.setDict(typeof T_KORXONA !== "undefined" ? T_KORXONA : {});

/* Accepts an internal id or a Business ID, so a scanned number and an
   in-site link land on the same page. */
const ID = new URLSearchParams(location.search).get("id") || "";

/* Same rule as the card: uploads are same-origin paths, which
   MK.safeUrl rejects, but "//host/x.jpg" must not slip through. */
const imgSrc = u => {
  const s = String(u || "");
  if(safeUrl(s)) return s;
  return s.startsWith("/") && !s.startsWith("//") ? s : "";
};

function products(list){
  if(!list.length) return `<p class="bid-empty">${esc(t("ko_empty"))}</p>`;
  return `<div class="bid-goods">${list.map(p => {
    const src = imgSrc(p.img);
    return `<a class="bid-good" href="mahsulot.html?id=${encodeURIComponent(p.id)}">
      ${src ? `<img src="${escA(src)}" alt="${escA(p.name)}" loading="lazy" />`
            : `<span class="bid-good-blank" aria-hidden="true"></span>`}
      <b>${esc(p.name)}</b>
      <span>${esc(p.price || t("pd_price_ask"))}</span>
    </a>`;
  }).join("")}</div>`;
}

function render(d){
  const c = d.company, a = d.assoc;
  const assocName = a ? ((a.i18n && a.i18n[MK.lang()]) || a.name) : "";

  const facts = [
    c.sector ? [t("ko_sector"), esc(c.sector)] : null,
    a ? [t("ko_assoc"), `<a href="association.html?id=${encodeURIComponent(a.id)}">${esc(assocName)}</a>`] : null,
    a && a.chairman ? [t("ko_chairman"), esc(a.chairman)] : null,
    c.since ? [t("ko_since"), esc(day(c.since))] : null,
    [t("ko_products"), num(d.showroom.length, 0)],
  ].filter(Boolean);

  return `
  <div class="ko-head">
    <div class="ko-head-main">
      <h1>${esc(c.name)}</h1>
      ${c.sector ? `<p class="ko-sub">${esc(c.sector)}${assocName ? " · " + esc(assocName) : ""}</p>` : ""}
      <dl class="mk-kv ko-kv">
        ${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}
      </dl>
      <div class="mk-actions">
        ${c.bizId
          ? `<a class="btn btn-primary btn-lg" href="biznes-id.html?id=${encodeURIComponent(c.bizId)}">${esc(t("ko_bizid"))}</a>`
          : ""}
        ${d.showroom.length
          ? `<a class="btn btn-ghost" href="showroom.html?company=${encodeURIComponent(c.name)}">${esc(t("ko_all"))}</a>`
          : ""}
        ${a ? `<a class="btn btn-ghost" href="association.html?id=${encodeURIComponent(a.id)}">${esc(t("ko_assoc_page"))}</a>` : ""}
      </div>
    </div>
    ${c.bizId ? `
    <aside class="ko-idcard">
      <span class="ko-idcard-k">${esc(t("ko_bizid"))}</span>
      <a class="ko-idcard-n" href="biznes-id.html?id=${encodeURIComponent(c.bizId)}">${esc(c.bizId)}</a>
      <p>${esc(t("ko_bizid_sub"))}</p>
    </aside>` : ""}
  </div>

  <section class="ko-goods">
    <h2>${esc(t("ko_products"))}</h2>
    ${products(d.showroom)}
  </section>`;
}

async function load(){
  const root = $("#koRoot");
  const crumbAssoc = $("#koCrumbAssoc"), crumbName = $("#koCrumbName");

  if(!ID){ root.innerHTML = empty(t("ko_missing")); return; }
  root.innerHTML = loading();

  const d = await api("/api/company/public?" + qs({ id: ID }));
  if(!d || !d.ok){ root.innerHTML = empty(t("ko_notfound")); return; }

  const assocName = d.assoc ? ((d.assoc.i18n && d.assoc.i18n[MK.lang()]) || d.assoc.name) : "";
  document.title = d.company.name + " — TIJORAT MARKAZI";
  if(crumbName) crumbName.textContent = d.company.name;
  if(crumbAssoc){
    crumbAssoc.textContent = assocName || "—";
    crumbAssoc.href = d.assoc ? "association.html?id=" + encodeURIComponent(d.assoc.id) : "associations.html";
  }
  root.innerHTML = render(d);
}

chrome();
applyStatic();
load();
})();
