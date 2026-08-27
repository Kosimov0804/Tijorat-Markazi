/* ============================================================
   TIJORAT MARKAZI — Davlat xizmatlari (state-service directory)
   Read-only for the public; the admin panel keeps the list.
   ============================================================ */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $ = (s,r=document)=>r.querySelector(s);

let GS_ITEMS = [];
const escH = s => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const escAt = s => escH(s).replace(/"/g,"&quot;");
/* only ever link out to real web addresses */
const safeUrl = u => /^https?:\/\//i.test(String(u||"")) ? String(u) : "";

async function loadGov(){
  try{
    const r = await fetch("/api/gov-services");
    if(!r.ok) throw 0;
    const j = await r.json();
    GS_ITEMS = j.items || [];
    fillFilter($("#gsCategory"), j.categories, T.gs_all_cat[L()]);
    fillFilter($("#gsAgency"),   j.agencies,   T.gs_all_agency[L()]);
  }catch(e){ GS_ITEMS = []; }
  render();
}

function fillFilter(sel, values, allLabel){
  if(!sel) return;
  const keep = sel.value;
  sel.innerHTML = `<option value="">${escH(allLabel)}</option>` +
    (values||[]).map(v=>`<option value="${escAt(v)}">${escH(v)}</option>`).join("");
  if(keep) sel.value = keep;
}

function render(){
  const grid = $("#gsGrid"); if(!grid) return;
  const q = ($("#gsSearch")?.value||"").trim().toLowerCase();
  const cat = $("#gsCategory")?.value||"", ag = $("#gsAgency")?.value||"";
  const list = GS_ITEMS.filter(it=>{
    if(cat && it.category!==cat) return false;
    if(ag && it.agency!==ag) return false;
    if(q){
      const hay = (it.title+" "+it.body+" "+it.agency+" "+it.category).toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
  const cnt = $("#gsCount"); if(cnt) cnt.textContent = T.gs_count[L()].replace("{n}", list.length);
  const empty = $("#gsEmpty"); if(empty) empty.hidden = list.length > 0;
  grid.innerHTML = list.map(it=>{
    const url = safeUrl(it.link);
    return `<article class="gs-card">
      ${it.category?`<span class="gs-cat">${escH(it.category)}</span>`:""}
      <b class="gs-title">${escH(it.title)}</b>
      ${it.body?`<p class="gs-body">${escH(it.body)}</p>`:""}
      <div class="gs-foot">
        ${it.agency?`<span class="gs-agency">🏛 ${escH(it.agency)}</span>`:""}
        ${url?`<a class="gs-link" href="${escAt(url)}" target="_blank" rel="noopener noreferrer">${escH(T.gs_open[L()])}</a>`:""}
      </div>
    </article>`;
  }).join("");
}

["#gsSearch","#gsCategory","#gsAgency"].forEach(sel=>{
  const el = $(sel); if(!el) return;
  el.addEventListener(sel==="#gsSearch" ? "input" : "change", render);
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
  applyStatic(); loadGov();
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
applyStatic(); loadGov();
