/* ============================================================
   TIJORAT MARKAZI — Conference page (email-gated, admin-scheduled)
   ============================================================ */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $ = (s,r=document)=>r.querySelector(s);

let email = localStorage.getItem("kg_email") || "";
let conf = null;          // current conference object
let tick = null;          // countdown interval

/* ---- translations ---- */
const CT = {
  lg_title:["Konferensiyaga kirish","Вход на конференцию","Join the conference"],
  lg_sub:["Email kiriting — konferensiyaga qo'shilish uchun.","Введите email, чтобы присоединиться к конференции.","Enter your email to join the conference."],
  lg_btn:["Davom etish →","Продолжить →","Continue →"],
  email_err:["To'g'ri email kiriting","Введите корректный email","Enter a valid email"],
  logout:["Boshqa email","Сменить email","Switch email"],
  none_title:["Konferensiya rejalashtirilmagan","Конференция не назначена","No conference scheduled"],
  none_sub:["Administrator konferensiya vaqtini belgilaganda, u shu yerda paydo bo'ladi.","Когда администратор назначит время конференции, она появится здесь.","When the admin schedules a conference, it will appear here."],
  starts_in:["Boshlanishigacha","До начала","Starts in"],
  live_now:["Konferensiya jonli efirda","Конференция идёт сейчас","Conference is live"],
  join:["Konferensiyaga qo'shilish →","Присоединиться к конференции →","Join the conference →"],
  join_soon:["Tugma boshlanishidan oldin faollashadi","Кнопка станет активной перед началом","The button activates before the start"],
  days:["kun","дн","d"],
  hours:["soat","ч","h"],
  mins:["daq","мин","m"],
  secs:["son","сек","s"],
  when:["Vaqt","Время","Time"],
};
const ct = k => CT[k][L()];

function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}

/* ---- date helpers ---- */
const MN = {
  uz:["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"],
  ru:["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],
  en:["January","February","March","April","May","June","July","August","September","October","November","December"],
};
function fmtDateTime(dtStr){
  const d = new Date(dtStr);
  if(isNaN(d)) return dtStr || "—";
  const day=d.getDate(), mon=MN[LANG][d.getMonth()], yr=d.getFullYear();
  const hh=String(d.getHours()).padStart(2,"0"), mm=String(d.getMinutes()).padStart(2,"0");
  return `${day} ${mon} ${yr}, ${hh}:${mm}`;
}

/* ============================================================
   CONFERENCE RENDER
   ============================================================ */
function renderNone(){
  if(tick){clearInterval(tick);tick=null;}
  $("#confCard").innerHTML = `
    <div class="conf-empty">
      <div class="conf-empty-ic">📅</div>
      <h2>${ct("none_title")}</h2>
      <p>${ct("none_sub")}</p>
    </div>`;
}

function renderConf(){
  const startMs = new Date(conf.datetime).getTime();
  const hasTime = !isNaN(startMs);
  $("#confCard").innerHTML = `
    <span class="conf-eyebrow">${ct("when")}: ${fmtDateTime(conf.datetime)}</span>
    <h1 class="conf-title">${escapeHtml(conf.title)}</h1>
    ${conf.desc?`<p class="conf-desc">${escapeHtml(conf.desc)}</p>`:""}
    <div class="conf-count" id="confCount"></div>
    <a class="btn btn-primary btn-lg conf-join" id="joinBtn" target="_blank" rel="noopener">${ct("join")}</a>
    <p class="conf-hint" id="joinHint">${ct("join_soon")}</p>`;

  const joinBtn=$("#joinBtn"), hint=$("#joinHint"), count=$("#confCount");
  const OPEN_BEFORE = 10*60*1000; // joinable 10 min before start

  function update(){
    const now = Date.now();
    const diff = hasTime ? startMs - now : -1; // no time → treat as open
    const open = !hasTime || diff <= OPEN_BEFORE;

    if(open){
      // a room may still be missing (Google unreachable when it was scheduled) —
      // then the card goes live but the button stays out of reach
      if(conf.link){
        // one hop through the server: it resolves the current Google Meet room
        joinBtn.href = conf.id ? "/api/conference/join?id="+encodeURIComponent(conf.id) : conf.link;
        joinBtn.classList.remove("disabled");
        hint.hidden = true;
      } else {
        joinBtn.removeAttribute("href");
        joinBtn.classList.add("disabled");
        hint.hidden = false;
      }
      count.innerHTML = `<span class="conf-live"><span class="conf-live-dot"></span>${ct("live_now")}</span>`;
    } else {
      joinBtn.removeAttribute("href");
      joinBtn.classList.add("disabled");
      hint.hidden = false;
      count.innerHTML = `<span class="conf-count-label">${ct("starts_in")}</span>` + countdownHtml(diff);
    }
  }
  update();
  if(tick) clearInterval(tick);
  if(hasTime) tick = setInterval(update, 1000);
}

function countdownHtml(ms){
  let s = Math.max(0, Math.floor(ms/1000));
  const d=Math.floor(s/86400); s-=d*86400;
  const h=Math.floor(s/3600);  s-=h*3600;
  const m=Math.floor(s/60);    s-=m*60;
  const unit=(v,k)=>`<span class="cu"><b>${String(v).padStart(2,"0")}</b><em>${ct(k)}</em></span>`;
  return `<div class="conf-clock">${d>0?unit(d,"days"):""}${unit(h,"hours")}${unit(m,"mins")}${unit(s,"secs")}</div>`;
}

function escapeHtml(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

async function loadConference(){
  try{
    const r = await fetch("/api/conference");
    const c = r.ok ? await r.json() : {};
    conf = (c && c.title) ? c : null;
  }catch(e){ conf = null; }
  if(conf) renderConf(); else renderNone();
}

/* ============================================================
   AUTH (email gate)
   ============================================================ */
function showLogin(){ $("#confLogin").hidden=false; $("#confApp").hidden=true; setTimeout(()=>$("#emailInput").focus(),50); }
function startApp(){
  $("#confLogin").hidden=true; $("#confApp").hidden=false;
  $("#uEmail").textContent = email;
  loadConference();
}
$("#emailForm").addEventListener("submit",e=>{e.preventDefault();
  const v=$("#emailInput").value.trim().toLowerCase();
  if(!validEmail(v)){ $("#emailErr").textContent=ct("email_err"); return; }
  email=v; localStorage.setItem("kg_email",v); $("#emailErr").textContent=""; startApp();
});
$("#switchEmail").addEventListener("click",()=>{ localStorage.removeItem("kg_email"); email=""; showLogin(); });

/* ============================================================
   LANG + THEME + STATIC
   ============================================================ */
function applyStatic(){
  document.querySelectorAll("[data-i18n]").forEach(n=>{const k=n.dataset.i18n;if(T[k])n.textContent=T[k][L()];});
  $("#lgTitle").textContent=ct("lg_title");
  $("#lgSub").textContent=ct("lg_sub");
  $("#lgBtn").textContent=ct("lg_btn");
  $("#switchEmail").textContent=ct("logout");
  const ph=$("#emailInput"); if(ph) ph.placeholder="email@example.com";
}
function setLang(lang){
  LANG=lang; localStorage.setItem("kg_lang",lang); document.documentElement.lang=lang;
  $("#langBtn").textContent=lang.toUpperCase();
  applyStatic();
  if(!$("#confApp").hidden){ if(conf) renderConf(); else renderNone(); }
}
$("#langBtn").addEventListener("click",()=>setLang(LANGS[(L()+1)%LANGS.length]));

const themeBtn=$("#themeBtn");
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("kg_theme",theme);themeBtn.innerHTML=theme==="dark"?ICON_SUN:ICON_MOON;}
themeBtn.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));

const burger=$("#burger"),nav=$("#nav");
burger.addEventListener("click",()=>nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

/* ============================================================
   INIT
   ============================================================ */
setTheme(localStorage.getItem("kg_theme")||"light");
document.documentElement.lang=LANG;
$("#langBtn").textContent=LANG.toUpperCase();
applyStatic();
if(email && validEmail(email)) startApp(); else showLogin();
