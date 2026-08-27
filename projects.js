/* ============================================================
   TIJORAT MARKAZI — Projects page (standalone)
   Strategic projects ecosystem, filtered by direction.
   ============================================================ */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $ = (s,r=document)=>r.querySelector(s);
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};

let activeCat = "all";

/* This page was committed without its dataset: PROJECT_CATS and PROJECTS are
   referenced but defined nowhere, so every render threw. Falling back to empty
   lists makes the page show its own "no projects" state instead of a broken
   script — the content still needs to be supplied. */
const PROJECT_CATS = typeof window.PROJECT_CATS !== "undefined" ? window.PROJECT_CATS : [];
const PROJECTS     = typeof window.PROJECTS     !== "undefined" ? window.PROJECTS     : [];

function catName(id){ const c=PROJECT_CATS.find(x=>x.id===id); return c?c.name[L()]:id; }

function renderTabs(){
  const tabs=$("#projTabs"); if(!tabs) return;
  tabs.innerHTML="";
  const mk=(label,val)=>{
    const t=el("button","block-tab"+(val===activeCat?" active":""),label);
    t.dataset.cat=val;
    t.addEventListener("click",()=>{activeCat=val;[...tabs.children].forEach(x=>x.classList.toggle("active",x===t));renderProjects();});
    tabs.appendChild(t);
  };
  mk(T.pr_all[L()],"all");
  PROJECT_CATS.forEach(c=>mk(c.name[L()],c.id));
}

function renderProjects(){
  const grid=$("#projectsGrid"); if(!grid) return;
  grid.innerHTML="";
  const list=PROJECTS.filter(p=>activeCat==="all"||p.cat===activeCat);
  $("#projEmpty").hidden = list.length>0;
  list.forEach(p=>{
    const card=el("div","center-card reveal",
      `<span class="center-tag">${catName(p.cat)}</span>
       <div class="center-icon">${ICONS[p.icon]||""}</div>
       <h3>${p.name}</h3><p>${p.desc[L()]}</p>`);
    grid.appendChild(card);
  });
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
  applyStatic();renderTabs();renderProjects();
}
$("#langBtn").addEventListener("click",()=>setLang(LANGS[(L()+1)%LANGS.length]));

const themeBtn=$("#themeBtn");
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("kg_theme",theme);themeBtn.innerHTML=theme==="dark"?ICON_SUN:ICON_MOON;}
themeBtn.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));

const burger=$("#burger"),nav=$("#nav");
burger.addEventListener("click",()=>nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

/* ---- counters ---- */
function animateCount(node){const target=+node.dataset.count;let cur=0;const step=Math.max(1,Math.ceil(target/45));
  (function tick(){cur=Math.min(target,cur+step);node.textContent=cur;if(cur<target)requestAnimationFrame(tick);})();}
const countObs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){animateCount(e.target);countObs.unobserve(e.target);}}),{threshold:.4});

/* ---- init ---- */
setTheme(localStorage.getItem("kg_theme")||"light");
document.documentElement.lang=LANG;$("#langBtn").textContent=LANG.toUpperCase();
applyStatic();renderTabs();renderProjects();
document.querySelectorAll("[data-count]").forEach(c=>countObs.observe(c));
