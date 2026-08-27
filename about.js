/* ============================================================
   TIJORAT MARKAZI — About Us page (standalone)
   Mission, structure, 5-pillar model, values, 2030–2035 results.
   ============================================================ */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $ = (s,r=document)=>r.querySelector(s);
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};

/* Each grid is optional: a missing array must never take the page down,
   which is exactly what happened when these renderers referenced data
   that was never defined. */
const grid = (id, rows, build) => {
  const g = $(id);
  if(!g) return;
  if(!Array.isArray(rows) || !rows.length){ g.innerHTML = ""; return; }
  g.innerHTML = "";
  rows.forEach((row, i) => g.appendChild(build(row, i)));
};

/* what the platform can do today */
function renderFeatures(){
  grid("#featuresGrid", typeof AB_FEATURES !== "undefined" && AB_FEATURES, f =>
    el("div","center-card reveal",
      `<span class="center-tag">${f.code}</span>
       <div class="center-icon">${ICONS[f.icon]||""}</div>
       <h3>${f.name[L()]}</h3><p>${f.desc[L()]}</p>`));
}
/* the four cabinets */
function renderRoles(){
  grid("#rolesGrid", typeof AB_ROLES !== "undefined" && AB_ROLES, r =>
    el("div","future-card reveal",
      `<span class="fi">${ICONS[r.icon]||""}</span><h4>${r.name[L()]}</h4><p>${r.desc[L()]}</p>`));
}
/* the path an appeal travels, numbered */
function renderHow(){
  grid("#howGrid", typeof AB_HOW !== "undefined" && AB_HOW, (step, i) =>
    el("div","value-card reveal",
      `<span class="value-num">${String(i+1).padStart(2,"0")}</span><b>${step[L()]}</b>`));
}
function renderAll(){
  renderFeatures(); renderRoles(); renderHow();
  document.querySelectorAll(".reveal").forEach(n=>n.classList.add("in"));
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
