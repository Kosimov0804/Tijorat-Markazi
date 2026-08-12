/* ============================================================
   TIJORAT MARKAZI — About Us page (standalone)
   Mission, structure, 5-pillar model, values, 2030–2035 results.
   ============================================================ */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $ = (s,r=document)=>r.querySelector(s);
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};

function renderStructure(){
  const g=$("#structGrid"); if(!g) return;
  g.innerHTML="";
  AB_STRUCTURE.forEach(s=>{
    g.appendChild(el("div","center-card reveal",
      `<span class="center-tag">${s.code}</span>
       <div class="center-icon">${ICONS[s.icon]||""}</div>
       <h3>${s.name[L()]}</h3><p>${s.desc[L()]}</p>`));
  });
}
function renderPillars(){
  const g=$("#pillarsGrid"); if(!g) return;
  g.innerHTML="";
  AB_PILLARS.forEach(p=>{
    g.appendChild(el("div","future-card reveal",
      `<span class="fi">${ICONS[p.icon]||""}</span><h4>${p.name[L()]}</h4><p>${p.desc[L()]}</p>`));
  });
}
function renderValues(){
  const g=$("#valuesGrid"); if(!g) return;
  g.innerHTML="";
  AB_VALUES.forEach((v,i)=>{
    g.appendChild(el("div","value-card reveal",
      `<span class="value-num">${String(i+1).padStart(2,"0")}</span><b>${v[L()]}</b>`));
  });
}
function renderResults(){
  const g=$("#resultsGrid"); if(!g) return;
  g.innerHTML="";
  AB_RESULTS.forEach(r=>{
    g.appendChild(el("div","result-card reveal",
      `<b>${r.v}</b><span>${r.label[L()]}</span>`));
  });
}
function renderAll(){ renderStructure();renderPillars();renderValues();renderResults();
  document.querySelectorAll(".reveal").forEach(n=>n.classList.add("in")); }

/* ---- static text + language + theme ---- */
function applyStatic(){
  document.querySelectorAll("[data-i18n]").forEach(n=>{const k=n.dataset.i18n;if(T[k])n.textContent=T[k][L()];});
  document.querySelectorAll("[data-i18n-html]").forEach(n=>{const k=n.dataset.i18nHtml;if(T[k])n.innerHTML=T[k][L()];});
  document.querySelectorAll("[data-i18n-ph]").forEach(n=>{const k=n.dataset.i18nPh;if(T[k])n.placeholder=T[k][L()];});
}
function setLang(lang){
  LANG=lang;localStorage.setItem("kg_lang",lang);document.documentElement.lang=lang;
  $("#langBtn").textContent=lang.toUpperCase();
  applyStatic();renderAll();
}
$("#langBtn").addEventListener("click",()=>setLang(LANGS[(L()+1)%LANGS.length]));

const themeBtn=$("#themeBtn");
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("kg_theme",theme);themeBtn.innerHTML=theme==="dark"?ICON_SUN:ICON_MOON;}
themeBtn.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));

const burger=$("#burger"),nav=$("#nav");
burger.addEventListener("click",()=>nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

/* ---- init ---- */
setTheme(localStorage.getItem("kg_theme")||"light");
document.documentElement.lang=LANG;$("#langBtn").textContent=LANG.toUpperCase();
applyStatic();renderAll();
