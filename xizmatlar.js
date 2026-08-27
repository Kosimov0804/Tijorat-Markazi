/* ============================================================
   TIJORAT MARKAZI — Xizmatlar (services offered by member companies)
   Same shape as the showroom page, but the catalogue is services
   rather than goods, so there is no image and no export/import.
   ============================================================ */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $ = (s,r=document)=>r.querySelector(s);

let SVC_ITEMS = [];
let ASSOC_I18N = {};
const assocLabel = v => (ASSOC_I18N[v] && ASSOC_I18N[v][LANG]) || v;
const escH = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const escAt = s => escH(s).replace(/"/g,"&quot;");

async function loadServices(){
  try{
    const r = await fetch("/api/services");
    if(!r.ok) throw 0;
    const j = await r.json();
    SVC_ITEMS = j.items || [];
    ASSOC_I18N = j.assocI18n || {};
    fillFilter($("#svcSector"),  j.sectors,   T.show_all_sectors[L()]);
    fillFilter($("#svcAssoc"),   j.assocs,    T.show_all_assocs[L()], assocLabel);
    fillFilter($("#svcCompany"), j.companies, T.show_all_companies[L()]);
  }catch(e){ SVC_ITEMS = []; }
  render();
}

function fillFilter(sel, values, allLabel, label){
  if(!sel) return;
  const keep = sel.value;
  sel.innerHTML = `<option value="">${escH(allLabel)}</option>` +
    (values||[]).map(v=>`<option value="${escAt(v)}">${escH(label?label(v):v)}</option>`).join("");
  if(keep) sel.value = keep;
}

function render(){
  const grid = $("#svcGrid"); if(!grid) return;
  const q = ($("#svcSearch")?.value||"").trim().toLowerCase();
  const sec = $("#svcSector")?.value||"", as = $("#svcAssoc")?.value||"", co = $("#svcCompany")?.value||"";
  const list = SVC_ITEMS.filter(it=>{
    if(sec && it.sector!==sec) return false;
    if(as && it.assoc!==as) return false;
    if(co && it.company!==co) return false;
    if(q){
      const hay = (it.title+" "+it.company+" "+it.body+" "+it.sector).toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
  const cnt = $("#svcCount"); if(cnt) cnt.textContent = T.svc_count[L()].replace("{n}", list.length);
  const empty = $("#svcEmpty"); if(empty) empty.hidden = list.length > 0;
  grid.innerHTML = list.map(it=>`
    <article class="svc-card">
      <div class="svc-top">
        <b>${escH(it.title)}</b>
        ${it.price?`<span class="svc-price">${escH(it.price)}</span>`:""}
      </div>
      ${it.body?`<p class="svc-body">${escH(it.body)}</p>`:""}
      <div class="svc-foot">
        <span class="svc-org">${escH(it.company)}${it.sector?` · ${escH(it.sector)}`:""}</span>
        ${it.status?`<span class="svc-status">${escH(it.status)}</span>`:""}
      </div>
    </article>`).join("");
}

["#svcSearch","#svcSector","#svcAssoc","#svcCompany"].forEach(sel=>{
  const el = $(sel); if(!el) return;
  el.addEventListener(sel==="#svcSearch" ? "input" : "change", render);
});

/* ---- static text + language + theme ---- */
function applyStatic(){
  document.querySelectorAll("[data-i18n]").forEach(n=>{const k=n.dataset.i18n;if(T[k])n.textContent=T[k][L()];});
  document.querySelectorAll("[data-i18n-html]").forEach(n=>{const k=n.dataset.i18nHtml;if(T[k])n.innerHTML=T[k][L()];});
  document.querySelectorAll("[data-i18n-ph]").forEach(n=>{const k=n.dataset.i18nPh;if(T[k])n.placeholder=T[k][L()];});
}
function setLang(lang){
  LANG=lang; localStorage.setItem("kg_lang",lang); document.documentElement.lang=lang;
  $("#langBtn").textContent=lang.toUpperCase();
  applyStatic(); loadServices();
}
$("#langBtn").addEventListener("click",()=>setLang(LANGS[(L()+1)%LANGS.length]));

const themeBtn=$("#themeBtn");
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("kg_theme",theme);themeBtn.innerHTML=theme==="dark"?ICON_SUN:ICON_MOON;}
themeBtn.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));

const burger=$("#burger"), nav=$("#nav");
burger.addEventListener("click",()=>nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

setTheme(localStorage.getItem("kg_theme")||"light");
document.documentElement.lang=LANG; $("#langBtn").textContent=LANG.toUpperCase();
applyStatic(); loadServices();
