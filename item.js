/* ============================================================
   TIJORAT MARKAZI — detail page (?type=center|module|future&i=...)
   ============================================================ */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $ = (s,r=document)=>r.querySelector(s);

const params = new URLSearchParams(location.search);
const TYPE = params.get("type");
const IDX  = params.get("i");

/* ---- module lead template ---- */
function capsList(kind){
  return `<ul class="caps">${CAPS[kind].map(c=>`<li>${c[L()]}</li>`).join("")}</ul>`;
}
function relCard(href, icon, title, sub){
  return `<a class="rel-card" href="${href}">
    <span class="rel-icon">${icon}</span>
    <span class="rel-body"><b>${title}</b><em>${sub}</em></span>
    <span class="rel-arr">→</span></a>`;
}

/* ---- build content for current item ---- */
function build(){
  const root = $("#detail");

  // not found
  function notFound(){
    document.title = "TIJORAT MARKAZI — 404";
    root.innerHTML = `<section class="section"><div class="container detail-notfound">
      <h1>${T.d_notfound[L()]}</h1><p>${T.d_notfound_p[L()]}</p>
      <a class="btn btn-primary btn-lg" href="index.html">← ${T.d_home[L()]}</a>
    </div></section>`;
  }

  let icon, badge, secName, secHref, title, lead, kind, facts, related, relTitle;

  if(TYPE==="center"){
    const c = CENTERS[+IDX]; if(!c) return notFound();
    icon=ICONS[c.icon]; badge=T.d_badge_center[L()]; secName=T.d_sec_center[L()]; secHref="index.html#blocks";
    title=c.name; lead=c.desc[L()]; kind="center";
    facts=[[T.d_type[L()],T.d_badge_center[L()]],[T.d_number[L()],c.tag],[T.d_status[L()],T.d_status_active[L()]]];
    // related: the other centres, now that modules are gone
    relTitle=T.d_related_center[L()];
    related=CENTERS.map((x,j)=>({x,j})).filter(o=>o.j!==+IDX).slice(0,6)
      .map(o=>relCard(`item.html?type=center&i=${o.j}`,ICONS[o.x.icon],o.x.name,o.x.desc[L()])).join("");

  } else if(TYPE==="future"){
    const f = FUTURE[+IDX]; if(!f) return notFound();
    icon=ICONS[f.i]; badge=T.d_badge_future[L()]; secName=T.d_sec_future[L()]; secHref="index.html#future";
    title=f.name; lead=f.desc[L()]; kind="future";
    facts=[[T.d_type[L()],"Version 2.0"],[T.d_status[L()],T.d_status_planned[L()]]];
    relTitle=T.d_related_future[L()];
    related=FUTURE.map((x,j)=>({x,j})).filter(o=>o.j!==+IDX)
      .map(o=>relCard(`item.html?type=future&i=${o.j}`,ICONS[o.x.i],o.x.name,o.x.desc[L()])).join("");
  } else {
    return notFound();
  }

  document.title = `${title} — TIJORAT MARKAZI`;
  const factsHtml = facts.map(f=>`<div class="fact"><span>${f[0]}</span><b>${f[1]}</b></div>`).join("");

  root.innerHTML = `
    <nav class="crumb">
      <div class="container">
        <a href="index.html">${T.d_home[L()]}</a><span>/</span>
        <a href="${secHref}">${secName}</a><span>/</span>
        <strong>${title}</strong>
      </div>
    </nav>

    <section class="detail-hero ${kind==='future'?'is-future':''}">
      <div class="container detail-hero-inner">
        <div class="detail-icon">${icon}</div>
        <div class="detail-headtext">
          <span class="detail-badge">${badge}</span>
          <h1>${title}</h1>
          <p class="detail-lead">${lead}</p>
          <a class="btn btn-primary btn-lg" href="index.html#contact" data-i18n="d_open">${T.d_open[L()]}</a>
        </div>
      </div>
    </section>

    <section class="section detail-body">
      <div class="container detail-grid">
        <div class="detail-main">
          <h2>${T.d_overview[L()]}</h2>
          <p class="detail-overview">${OVERVIEW[kind][L()]}</p>
          <h3>${T.d_caps[L()]}</h3>
          ${capsList(kind)}
        </div>
        <aside class="detail-side">
          <h4>${T.d_facts[L()]}</h4>
          ${factsHtml}
          <div class="ad-slot ad-sidebar" data-slot="detail-side"></div>
        </aside>
      </div>

      ${related ? `<div class="container detail-related">
        <h2>${relTitle}</h2>
        <div class="rel-grid">${related}</div>
      </div>` : ``}
    </section>`;

  // re-apply static i18n to header/footer/cta + render ad slots
  applyStatic();
  renderAds();
}

/* ---- static text ---- */
function applyStatic(){
  document.querySelectorAll("[data-i18n]").forEach(n=>{const k=n.dataset.i18n;if(T[k])n.textContent=T[k][L()];});
  document.querySelectorAll("[data-i18n-html]").forEach(n=>{const k=n.dataset.i18nHtml;if(T[k])n.innerHTML=T[k][L()];});
  document.querySelectorAll("[data-i18n-ph]").forEach(n=>{const k=n.dataset.i18nPh;if(T[k])n.placeholder=T[k][L()];});
}

/* ---- language + theme ---- */
function setLang(lang){
  LANG=lang;localStorage.setItem("kg_lang",lang);
  document.documentElement.lang=lang;
  $("#langBtn").textContent=lang.toUpperCase();
  build();
}
$("#langBtn").addEventListener("click",()=>setLang(LANGS[(L()+1)%LANGS.length]));

const themeBtn=$("#themeBtn");
function setTheme(theme){
  document.documentElement.dataset.theme=theme;
  localStorage.setItem("kg_theme",theme);
  themeBtn.innerHTML = theme==="dark" ? ICON_SUN : ICON_MOON;
}
themeBtn.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));

/* ---- nav + cta form ---- */
const burger=$("#burger"),nav=$("#nav");
burger.addEventListener("click",()=>nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
const ctaForm=$("#ctaForm");
if(ctaForm) ctaForm.addEventListener("submit",e=>{e.preventDefault();e.target.querySelectorAll("input").forEach(i=>i.value="");$("#ctaNote").hidden=false;});

/* ---- init ---- */
setTheme(localStorage.getItem("kg_theme")||"light");
document.documentElement.lang=LANG;
$("#langBtn").textContent=LANG.toUpperCase();
build();
window.scrollTo(0,0);
