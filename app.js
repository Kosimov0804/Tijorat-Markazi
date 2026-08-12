/* ============================================================
   TIJORAT MARKAZI — index page logic (data from data.js)
   ============================================================ */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);

const $ = (s,r=document)=>r.querySelector(s);
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};

const fg=$("#futureGrid");

function renderFuture(){
  if(!fg)return;
  fg.innerHTML="";
  FUTURE.forEach((f,idx)=>{
    const card=el("a","future-card reveal",
      `<span class="fi">${ICONS[f.i]||""}</span><h4>${f.name}</h4><p>${f.desc[L()]}</p>`);
    card.href=`item.html?type=future&i=${idx}`;
    fg.appendChild(card);
  });
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
  applyStatic();renderFuture();
  document.querySelectorAll(".reveal").forEach(n=>n.classList.add("in"));
  if(typeof startHeroChat==="function") startHeroChat();   // restart hero chat in the new language at once
}
$("#langBtn").addEventListener("click",()=>setLang(LANGS[(L()+1)%LANGS.length]));

const themeBtn=$("#themeBtn");
function setTheme(theme){
  document.documentElement.dataset.theme=theme;
  localStorage.setItem("kg_theme",theme);
  themeBtn.innerHTML = theme==="dark" ? ICON_SUN : ICON_MOON;
}
themeBtn.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));

/* ---- counters, ticker, forms, nav, reveal ---- */
function animateCount(node){const target=+node.dataset.count;let cur=0;const step=Math.max(1,Math.ceil(target/45));
  (function tick(){cur=Math.min(target,cur+step);node.textContent=cur;if(cur<target)requestAnimationFrame(tick);})();}
const countObs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){animateCount(e.target);countObs.unobserve(e.target);}}),{threshold:.4});
document.querySelectorAll("[data-count]").forEach(c=>countObs.observe(c));

const tickerNode=$("#aiTicker");let ti=0;
function showTicker(){ if(tickerNode) tickerNode.textContent=TICKERS[LANG][ti]; }
if(tickerNode){
  tickerNode.style.transition="opacity .3s";
  setInterval(()=>{ti=(ti+1)%TICKERS[LANG].length;tickerNode.style.opacity=0;
    setTimeout(()=>{showTicker();tickerNode.style.opacity=1;},300);},3600);
}

const ctaForm=$("#ctaForm");
if(ctaForm) ctaForm.addEventListener("submit",e=>{e.preventDefault();e.target.querySelectorAll("input").forEach(i=>i.value="");$("#ctaNote").hidden=false;});

const burger=$("#burger"),nav=$("#nav");
burger.addEventListener("click",()=>nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

const revealObs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");revealObs.unobserve(e.target);}}),{threshold:.12});
function observeReveals(){document.querySelectorAll(".reveal:not(.in)").forEach(n=>revealObs.observe(n));}

/* ---- init ---- */
setTheme(localStorage.getItem("kg_theme")||"light");
document.documentElement.lang=LANG;
$("#langBtn").textContent=LANG.toUpperCase();
applyStatic();renderFuture();showTicker();
observeReveals();

/* ---- hero AI chat animation (replaces the old dashboard widget) ---- */
const HERO_CHAT={
  uz:[["user","Eksport bozorlarini tahlil qil"],
      ["bot","4 ta yangi tender topildi: Qozogʻiston, BAA, Xitoy. Oʻrtacha marja ~18%."],
      ["user","Qaysi kompaniya mos keladi?"],
      ["bot","“GreenAgro” — mahsulot va hajm mos. Hamkorlikka tayyor."],
      ["user","Rasmiy hujjatlarni tayyorla"],
      ["bot","✅ Shartnoma loyihasi va rasmiy xat tayyor. Yuborilsinmi?"]],
  ru:[["user","Проанализируй экспортные рынки"],
      ["bot","Найдено 4 новых тендера: Казахстан, ОАЭ, Китай. Средняя маржа ~18%."],
      ["user","Какая компания подходит?"],
      ["bot","«GreenAgro» — продукт и объём совпадают. Готовы к сотрудничеству."],
      ["user","Подготовь официальные документы"],
      ["bot","✅ Проект договора и официальное письмо готовы. Отправить?"]],
  en:[["user","Analyze the export markets"],
      ["bot","Found 4 new tenders: Kazakhstan, UAE, China. Avg. margin ~18%."],
      ["user","Which company is a fit?"],
      ["bot","“GreenAgro” — product and volume match. Ready to partner."],
      ["user","Prepare the official documents"],
      ["bot","✅ Draft contract and official letter are ready. Send them?"]]
};
let heroRun=0;
function startHeroChat(){
  const box=$("#heroChat");
  if(!box) return;
  const myRun=++heroRun;                       // any new call cancels the previous loop
  const seq=HERO_CHAT[HERO_CHAT[LANG]?LANG:"uz"];
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const add=(who,text)=>{const m=document.createElement("div");m.className="msg "+who;m.textContent=text;box.appendChild(m);return m;};
  const typing=()=>{const m=document.createElement("div");m.className="msg bot typing";m.innerHTML="<span></span><span></span><span></span>";box.appendChild(m);return m;};
  const trim=()=>{ while(box.scrollHeight>box.clientHeight && box.firstChild) box.removeChild(box.firstChild); };
  (async function loop(){
    while(myRun===heroRun){
      box.innerHTML="";
      for(const [who,text] of seq){
        if(myRun!==heroRun) return;
        if(who==="user"){ add("user",text); trim(); await wait(1000); }
        else{ const t=typing(); trim(); await wait(1200); if(myRun!==heroRun) return; t.remove(); add("bot",text); trim(); await wait(2000); }
      }
      await wait(2200);
    }
  })();
}
startHeroChat();

console.log("%cTIJORAT MARKAZI","font-size:18px;font-weight:bold;color:#0a2540","— UZ/RU/EN · light/dark.");

