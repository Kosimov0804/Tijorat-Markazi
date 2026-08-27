/* ============================================================
   TIJORAT MARKAZI — Showroom page (standalone)
   Public product catalog of all member companies, with filters.
   ============================================================ */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $ = (s,r=document)=>r.querySelector(s);
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
const escH=s=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const escAt=s=>String(s||"").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

let SHOW_ITEMS=[];
/* canonical association name -> its name in each language. Filtering matches on
   the canonical name; only the label the visitor reads is translated. */
let ASSOC_I18N={};
const assocLabel = v => (ASSOC_I18N[v] && ASSOC_I18N[v][LANG]) || v;

/* ---- data ---- */
async function loadShowroom(){
  const grid=$("#homeShowGrid");
  try{
    const r=await fetch("/api/showroom"); if(!r.ok) throw 0;
    const j=await r.json();
    SHOW_ITEMS=j.items||[];
    ASSOC_I18N=j.assocI18n||{};
    fillFilter($("#showSector"),  j.sectors,   T.show_all_sectors[L()]);
    fillFilter($("#showAssoc"),   j.assocs,    T.show_all_assocs[L()], assocLabel);
    fillFilter($("#showCompany"), j.companies, T.show_all_companies[L()]);
    // pre-filter by company when opened from an association page (?company=Name)
    const wantCo=new URLSearchParams(location.search).get("company");
    if(wantCo){ const sel=$("#showCompany"); if(sel){ sel.value=wantCo; } }
    renderShowroom();
  }catch(e){
    SHOW_ITEMS=[];
    if(grid) grid.innerHTML="";
    const empty=$("#showEmpty"); if(empty){ empty.hidden=false; }
  }
}
function fillFilter(sel, values, allLabel, labelFn){
  if(!sel) return;
  const cur=sel.value;
  sel.innerHTML="";
  sel.appendChild(el("option",null,allLabel)); sel.lastChild.value="";
  (values||[]).forEach(v=>{ const o=el("option",null,escH(labelFn?labelFn(v):v)); o.value=v; sel.appendChild(o); });
  sel.value=cur||"";
}
/* Export = what members sell abroad, Import = what they want to buy in.
   Empty string shows both. */
let TRADE="";
document.addEventListener("click",e=>{
  const t=e.target && e.target.closest && e.target.closest("#showTrade .trade-tab");
  if(!t) return;
  TRADE=t.dataset.trade||"";
  document.querySelectorAll("#showTrade .trade-tab").forEach(b=>b.classList.toggle("is-on",b===t));
  renderShowroom();
});
function renderShowroom(){
  const grid=$("#homeShowGrid"); if(!grid) return;
  const q=($("#showSearch")?.value||"").trim().toLowerCase();
  const sec=$("#showSector")?.value||"", as=$("#showAssoc")?.value||"", co=$("#showCompany")?.value||"";
  const list=SHOW_ITEMS.filter(it=>{
    if(TRADE && (it.trade||"export")!==TRADE) return false;   // export / import catalogue
    if(sec && it.sector!==sec) return false;
    if(as && it.assoc!==as) return false;
    if(co && it.company!==co) return false;
    if(q){ const hay=(it.name+" "+it.company+" "+it.desc+" "+it.sector).toLowerCase(); if(!hay.includes(q)) return false; }
    return true;
  });
  const cnt=$("#showCount"); if(cnt) cnt.textContent=T.show_count[L()].replace("{n}",list.length);
  const empty=$("#showEmpty"); if(empty) empty.hidden=list.length>0;
  /* Each card is now a link to that product's own page, where the visitor can
     reach the company that published it. Entries stored before ids existed
     stay as plain cards rather than linking nowhere. */
  grid.innerHTML=list.map(it=>{
    const inner=`
      ${it.img?`<img class="show-img" src="${escAt(it.img)}" alt="" loading="lazy">`:`<div class="show-img show-img-ph">🛍️</div>`}
      <div class="show-body">
        <b>${escH(it.name)}</b>${it.price?`<span class="show-price">${escH(it.price)}</span>`:""}
        ${it.desc?`<p>${escH(it.desc)}</p>`:""}
        <span class="show-org">${escH(it.company)}${it.sector?` · ${escH(it.sector)}`:""}</span>
        <span class="trade-badge trade-${(it.trade||"export")}">${(it.trade||"export")==="import"?T.show_trade_imp[L()]:T.show_trade_exp[L()]}</span>
        <span class="show-more">${escH(T.show_more[L()])}</span>
      </div>`;
    return it.id
      ? `<a class="show-card show-card-link" href="mahsulot.html?id=${encodeURIComponent(it.id)}">${inner}</a>`
      : `<div class="show-card">${inner}</div>`;
  }).join("");
}

/* ---- static text + language + theme ---- */
function applyStatic(){
  document.querySelectorAll("[data-i18n]").forEach(n=>{const k=n.dataset.i18n;if(T[k])n.textContent=T[k][L()];});
  document.querySelectorAll("[data-i18n-html]").forEach(n=>{const k=n.dataset.i18nHtml;if(T[k])n.innerHTML=T[k][L()];});
  document.querySelectorAll("[data-i18n-ph]").forEach(n=>{const k=n.dataset.i18nPh;if(T[k])n.placeholder=T[k][L()];});
}
function setLang(lang){
  LANG=lang;localStorage.setItem("kg_lang",lang);document.documentElement.lang=lang;
  $("#langBtn").textContent=lang.toUpperCase();
  applyStatic();
  fillFilter($("#showSector"), [...new Set(SHOW_ITEMS.map(i=>i.sector).filter(Boolean))].sort(), T.show_all_sectors[L()]);
  fillFilter($("#showAssoc"),  [...new Set(SHOW_ITEMS.map(i=>i.assoc).filter(Boolean))].sort(),  T.show_all_assocs[L()], assocLabel);
  fillFilter($("#showCompany"),[...new Set(SHOW_ITEMS.map(i=>i.company).filter(Boolean))].sort(),T.show_all_companies[L()]);
  renderShowroom();
}
$("#langBtn").addEventListener("click",()=>setLang(LANGS[(L()+1)%LANGS.length]));

const themeBtn=$("#themeBtn");
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("kg_theme",theme);themeBtn.innerHTML=theme==="dark"?ICON_SUN:ICON_MOON;}
themeBtn.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));

const burger=$("#burger"),nav=$("#nav");
burger.addEventListener("click",()=>nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

["showSearch","showSector","showAssoc","showCompany"].forEach(id=>{ const n=$("#"+id); if(n) n.addEventListener("input",renderShowroom); });

/* ---- init ---- */
setTheme(localStorage.getItem("kg_theme")||"light");
document.documentElement.lang=LANG;$("#langBtn").textContent=LANG.toUpperCase();
applyStatic();
loadShowroom();
