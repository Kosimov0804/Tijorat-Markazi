/* The header collapses to a burger below 1080px; without this the menu had
   no way to open on this page. Every other page binds the same two lines. */
(function(){
  var burger=document.getElementById("burger"), nav=document.getElementById("nav");
  if(!burger||!nav) return;
  burger.addEventListener("click",function(){ nav.classList.toggle("open"); });
  Array.prototype.forEach.call(nav.querySelectorAll("a"),function(a){
    a.addEventListener("click",function(){ nav.classList.remove("open"); });
  });
})();

/* ============================================================
   TIJORAT MARKAZI — Associations directory (public catalog)
   ============================================================ */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $ = (s,r=document)=>r.querySelector(s);

let LIST = [];

const DT = {
  eyebrow:["TIJORAT MARKAZI a'zolari","Члены TIJORAT MARKAZI","TIJORAT MARKAZI members"],
  sub:["Har bir uyushmaning o'z sahifasi va boshqaruv paneli bor.","У каждой ассоциации своя страница и панель управления.","Each association has its own page and management panel."],
  search:["Qidirish…","Поиск…","Search…"],
  gate_title:["Faqat admin uchun","Только для админа","Admins only"],
  gate_sub:["Uyushmalar katalogini ko'rish uchun admin paroli kerak.","Для просмотра каталога ассоциаций нужен пароль админа.","The admin password is required to view the associations catalog."],
  gate_btn:["Kirish →","Войти →","Sign in →"],
  gate_err:["Noto'g'ri parol","Неверный пароль","Wrong password"],
  chair:["Rais","Председатель","Chairman"],
  companies:["kompaniya","компаний","companies"],
  open:["Ochish →","Открыть →","Open →"],
  none:["Hech narsa topilmadi.","Ничего не найдено.","Nothing found."],
};
const dt = k => DT[k][L()];
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
/** An association's name in the active language. */
const aName = a => ((a && a.i18n && a.i18n[LANG]) || (a && a.name) || "").replace(/^[-\s]+/,"");

function render(filter=""){
  const q=filter.trim().toLowerCase();
  // search every language, so a Russian query still finds an association
  const list=LIST.filter(a=>{
    if(q==="") return true;
    const hay=[aName(a), a.name, a.i18n&&a.i18n.uz, a.i18n&&a.i18n.ru, a.i18n&&a.i18n.en, a.chairman]
      .filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  });
  const grid=$("#dirGrid");
  if(!list.length){ grid.innerHTML=`<p class="empty-state">${dt("none")}</p>`; return; }
  /* The card opens the association itself. Its Business ID is a separate
     control, and it has to live OUTSIDE the card's <a> — an anchor inside
     an anchor is invalid and browsers unnest it — so it is overlaid. */
  grid.innerHTML=list.map(a=>`
    <div class="dir-item">
      <a class="dir-card" href="association.html?id=${encodeURIComponent(a.id)}">
        <span class="dir-mark">${esc(aName(a).charAt(0).toUpperCase())}</span>
        <span class="dir-body">
          <b>${esc(aName(a))}</b>
          ${a.chairman?`<em>${dt("chair")}: ${esc(a.chairman)}</em>`:`<em>&nbsp;</em>`}
          <span class="dir-count">${a.companies} ${dt("companies")}</span>
        </span>
        <span class="dir-open">${dt("open")}</span>
      </a>
      ${a.bizId?`<a class="dir-bizbtn" href="biznes-id.html?id=${encodeURIComponent(a.bizId)}"
        title="Business ID">${esc(a.bizId)}</a>`:""}
    </div>`).join("");
}

function applyStatic(){
  document.querySelectorAll("[data-i18n]").forEach(n=>{const k=n.dataset.i18n;if(T[k])n.textContent=T[k][L()];});
  $("#dirEyebrow").textContent=dt("eyebrow");
  $("#dirSub").textContent=dt("sub");
  $("#dirSearch").placeholder=dt("search");
}
function setLang(lang){
  LANG=lang; localStorage.setItem("kg_lang",lang); document.documentElement.lang=lang;
  $("#langBtn").textContent=lang.toUpperCase();
  applyStatic(); render($("#dirSearch").value);
}
$("#langBtn").addEventListener("click",()=>setLang(LANGS[(L()+1)%LANGS.length]));

const themeBtn=$("#themeBtn");
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("kg_theme",theme);themeBtn.innerHTML=theme==="dark"?ICON_SUN:ICON_MOON;}
themeBtn.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));

$("#dirSearch").addEventListener("input",e=>render(e.target.value));

/* ---- public catalog (open to all visitors) ---- */
function openCatalog(){
  const app=$("#dirApp"); if(app) app.hidden=false;
  fetch("/api/assoc/list").then(r=>r.json()).then(d=>{ LIST=Array.isArray(d)?d:[]; render(); }).catch(()=>{});
}

/* init */
setTheme(localStorage.getItem("kg_theme")||"light");
document.documentElement.lang=LANG; $("#langBtn").textContent=LANG.toUpperCase();
applyStatic();
openCatalog();
