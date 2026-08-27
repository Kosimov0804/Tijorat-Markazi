/* ============================================================
   LEGAL FOOTER — operator requisites on every page

   Deliberately dependency-free. market-kit.js is not loaded on
   every page of this site, and the requisites have to appear on
   every page, so this file borrows nothing: its own escaper, its
   own language read, its own fetch. Drop the <script> tag on any
   page that has a footer and it works.

   WHY IT IS IN THE FOOTER AT ALL. Qoidalar 24-band (KM 185-son)
   requires an e-commerce participant to make its identifying
   information available to the buyer BEFORE the transaction.
   There is no page every visitor is guaranteed to pass through
   on the way to a deal — someone can land on a product page from
   a search engine and message a seller from there. The footer is
   the one surface present on all of them, and it is where a
   reader already looks for exactly this.

   The links are also rendered here rather than hand-written into
   thirteen footers, so adding a fourth legal document later is
   one edit instead of thirteen.
   ============================================================ */
(() => {
  const host = document.getElementById("footerLegal");
  /* Not every page has been given the slot yet; that is not an error. */
  if(!host) return;

  const esc = s => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const LANGS = ["uz", "ru", "en"];
  const lang = () => {
    const l = localStorage.getItem("kg_lang") || "uz";
    return LANGS.includes(l) ? l : "uz";
  };
  /* The documents themselves exist in uz and ru only, so an English reader
     gets the Uzbek labels here too — matching what they will see on the page
     they are about to open. */
  const tl = () => (lang() === "ru" ? "ru" : "uz");
  const pick = o => (o && (o[tl()] || o.uz)) || "";
  const val = v => (v && typeof v === "object") ? (v[tl()] || v.uz || "") : (v || "");

  const PLACEHOLDER = /^\[(TO'LDIRILSIN|ZAPOLNIT|TO BE COMPLETED)/;
  const cell = v => {
    const s = String(v == null ? "" : v);
    if(!s) return "";
    return PLACEHOLDER.test(s)
      ? `<span class="lg-todo">${esc(s)}</span>`
      : esc(s);
  };

  /* Fixed, like the cross-links in legal-page.js — an href built from fetched
     data is one refactor away from being an href built from user data. */
  const PAGES = { oferta: "oferta.html", maxfiylik: "maxfiylik.html", shartlar: "shartlar.html",
                  rights: "mening-malumotlarim.html" };
  /* Not a versioned document, so it carries its own title. It belongs in this
     list anyway: a right nobody can find is a right nobody uses. */
  const EXTRA_TITLE = { rights: { uz: "Mening ma'lumotlarim", ru: "Мои данные", en: "My data" } };

  const LBL = {
    about:  { uz: "Operator", ru: "Оператор" },
    docs:   { uz: "Huquqiy hujjatlar", ru: "Правовые документы" },
    contact:{ uz: "Aloqa", ru: "Контакты" },
    stir:   { uz: "STIR", ru: "ИНН" },
    dpo:    { uz: "Shaxsga doir ma'lumotlar bo'yicha", ru: "По персональным данным" },
  };

  function draw(cfg){
    const o = cfg.operator || {};
    const docs = cfg.docs || {};

    const links = Object.keys(PAGES).map(k => {
      const title = (docs[k] || {}).title || EXTRA_TITLE[k];
      const nm = (title && (title[tl()] || title.uz)) || k;
      return `<li><a href="${PAGES[k]}">${esc(nm)}</a></li>`;
    }).join("");

    /* The label is concatenated AFTER cell() has judged the value. Building
       "STIR: [TO'LDIRILSIN...]" first and passing the whole string in meant
       the placeholder no longer started the string, so it slipped past the
       test and rendered as ordinary body text. */
    const stir = val(o.stir)
      ? `${esc(pick(LBL.stir))}: ${cell(val(o.stir))}`
      : "";

    host.innerHTML = `
      <div>
        <h3>${esc(pick(LBL.about))}</h3>
        <p><strong>${cell(val(o.legalName))}</strong></p>
        ${val(o.legalForm) ? `<p>${cell(val(o.legalForm))}</p>` : ""}
        ${stir ? `<p>${stir}</p>` : ""}
        <p>${cell(val(o.address))}</p>
      </div>
      <div>
        <h3>${esc(pick(LBL.docs))}</h3>
        <ul>${links}</ul>
      </div>
      <div>
        <h3>${esc(pick(LBL.contact))}</h3>
        <p>${cell(val(o.email))}</p>
        <p>${cell(val(o.phone))}</p>
        ${val(o.dpoEmail) ? `<p><span style="opacity:.75">${esc(pick(LBL.dpo))}:</span> ${cell(val(o.dpoEmail))}</p>` : ""}
      </div>`;
  }

  /* Marks whichever legal page is open, for the .lg-tabs switcher. */
  function markCurrent(){
    const here = (location.pathname.split("/").pop() || "").toLowerCase();
    document.querySelectorAll(".lg-tabs a").forEach(a => {
      const target = (a.getAttribute("href") || "").toLowerCase();
      if(target && target === here) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  let CFG = null;
  fetch("/api/legal")
    .then(r => r.json())
    .then(j => { if(j && j.ok){ CFG = j; draw(j); } })
    /* A footer that cannot reach the API should not break the page it is on. */
    .catch(() => {});

  markCurrent();

  /* The language button lives in market-kit.js and does not know about this
     file, so the redraw hangs off the same click rather than off a callback
     this script would have to be registered with. */
  const langBtn = document.getElementById("langBtn");
  if(langBtn) langBtn.addEventListener("click", () => {
    setTimeout(() => { if(CFG) draw(CFG); }, 0);
  });
})();
