/* ============================================================
   TIJORAT MARKAZI — Rais panel (top oversight)
   Sees ALL associations; drills into each to see its companies & products
   ============================================================ */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $ = (s,r=document)=>r.querySelector(s);

let creds = null;
let DATA = [];      // associations with companies
try{ creds = JSON.parse(sessionStorage.getItem("kg_rais")||"null"); }catch(e){ creds=null; }

const RT = {
  lg_title:["Rais paneli","Панель раиса","Rais panel"],
  lg_sub:["Login va parol bilan kiring.","Войдите по логину и паролю.","Sign in with your login and password."],
  lg_btn:["Kirish →","Войти →","Sign in →"],
  err:["Login yoki parol noto'g'ri","Неверный логин или пароль","Wrong login or password"],
  logout:["Chiqish","Выход","Logout"],
  kicker:["Bosh nazorat","Главный контроль","Top oversight"],
  title:["Barcha uyushmalar","Все ассоциации","All associations"],
  nav_orgs:["Uyushmalar","Ассоциации","Associations"],
  nav_meeting:["Uchrashuv","Встреча","Meeting"],
  nav_questions:["Savollar","Вопросы","Questions"],
  nav_reports:["Hisobotlar","Отчёты","Reports"],
  nav_ai:["AI Assistant","AI Ассистент","AI Assistant"],
  rep_title:["Oylik hisobotlar","Месячные отчёты","Monthly reports"],
  rep_sub:["Har oy oxirida hisobot avtomatik tayyorlanadi va arxivlanadi.","В конце каждого месяца отчёт готовится и архивируется автоматически.","At the end of each month the report is auto-generated and archived."],
  rep_dl:["⬇ Word","⬇ Word","⬇ Word"],
  rep_refresh:["🔄 Yangilash","🔄 Обновить","🔄 Refresh"],
  rep_archived:["arxivlangan","в архиве","archived"],
  rep_empty:["Hozircha hisobotlar yo'q.","Отчётов пока нет.","No reports yet."],
  rep_tg_on:["✅ Telegram orqali raisga yuborish yoqilgan.","✅ Отправка раису в Telegram включена.","✅ Telegram delivery to the rais is enabled."],
  rep_tg_off:["ℹ️ Telegram'ga yuborish uchun admin panelda Rais Telegram chat ID kiriting.","ℹ️ Для отправки в Telegram укажите Rais Telegram chat ID в админ-панели.","ℹ️ To enable Telegram delivery, set the Rais Telegram chat ID in the admin panel."],
  search:["Qidirish…","Поиск…","Search…"],
  chair:["Rais","Председатель","Chairman"],
  companies:["kompaniya","компаний","companies"],
  open:["Ko'rish →","Открыть →","Open →"],
  back:["← Orqaga","← Назад","← Back"],
  none:["Hech narsa topilmadi.","Ничего не найдено.","Nothing found."],
  no_comp:["Bu uyushmada kompaniyalar yo'q.","В этой ассоциации нет компаний.","No companies in this association."],
  products:["mahsulot","товаров","products"],
  no_prod:["mahsulot yo'q","нет товаров","no products"],
  stats:["uyushma","ассоциаций","associations"],
  mt_title:["Zoom uchrashuv tayinlash","Назначить Zoom-встречу","Schedule a Zoom meeting"],
  mt_sub:["Uchrashuv tayinlang — barcha uyushma va kompaniyalar xabardor bo'ladi.","Назначьте встречу — все ассоциации и компании получат уведомление.","Schedule a meeting — all associations and companies get notified."],
  mt_topic:["Mavzu","Тема","Topic"],
  mt_desc:["Tavsif (ixtiyoriy)","Описание (необязательно)","Description (optional)"],
  mt_save:["Tayinlash","Назначить","Schedule"],
  mt_clear:["O'chirish","Удалить","Remove"],
  mt_saved:["✓ Tayinlandi — hammaga yuborildi","✓ Назначено — отправлено всем","✓ Scheduled — sent to everyone"],
  mt_cleared:["Uchrashuv o'chirildi","Встреча удалена","Meeting removed"],
  mt_link_err:["To'g'ri havola kiriting (https://…)","Введите корректную ссылку (https://…)","Enter a valid link (https://…)"],
  q_title:["Savollar hisoboti (oylik)","Отчёт по вопросам (месячный)","Questions report (monthly)"],
  q_sub:["Foydalanuvchilar bergan barcha savollar. Takroriy savol yonida — kompaniya nomi.","Все вопросы пользователей. У повторных — имя компании.","All user questions. Repeated ones show the company name."],
  q_empty:["Bu oyda savollar yo'q.","В этом месяце вопросов нет.","No questions this month."],
  q_question:["Savol","Вопрос","Question"],
  q_count:["Soni","Кол-во","Count"],
  q_who:["Kim / Kompaniya","Кто / Компания","Who / Company"],
  q_repeat:["takror","повтор","repeat"],
  q_users:["Murojaat qilgan foydalanuvchilar","Обратившиеся пользователи","Users who contacted"],
  q_reqs:["so'rov","запросов","requests"],
  q_makeletter:["✉️ Rasmiy xat","✉️ Офиц. письмо","✉️ Official letter"],
  q_gen:["✍️ yozilmoqda…","✍️ пишется…","✍️ writing…"],
  ltr_to:["Kimga","Кому","To"],
  ltr_copy:["Nusxa olish","Копировать","Copy"],
  ltr_print:["Chop etish","Печать","Print"],
  ltr_copied:["✓ Nusxa olindi","✓ Скопировано","✓ Copied"],
  ltr_sent:["Xat foydalanuvchi paneliga yuborildi","Письмо отправлено в панель пользователя","Letter delivered to the user's panel"],
};
const rt = k => RT[k][L()];
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function clean(s){return String(s||"").replace(/^[-\s]+/,"");}
/** An association's name in the active language. */
const aName = a => clean((a && a.i18n && a.i18n[LANG]) || (a && a.name) || "");

/* ---- auth ---- */
function showLogin(){ $("#raLogin").hidden=false; $("#raApp").hidden=true; $("#logoutBtn").hidden=true; $("#aiNav").hidden=true; setTimeout(()=>$("#raLoginInp").focus(),50); }
async function tryLogin(login,password){
  const r=await fetch("/api/rais/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({login,password})});
  if(!r.ok) return false;
  const j=await r.json(); DATA=j.associations||[]; creds={login,password};
  sessionStorage.setItem("kg_rais",JSON.stringify(creds)); return true;
}
function startApp(){
  $("#raLogin").hidden=true; $("#raApp").hidden=false; $("#logoutBtn").hidden=false; $("#aiNav").hidden=false;
  const totalC=DATA.reduce((s,a)=>s+a.companies.length,0);
  $("#raStats").textContent=`${DATA.length} ${rt("stats")} · ${totalC} ${rt("companies")}`;
  buildNav();
  showSection(activeSec);
}

/* ---- sidebar control panel ---- */
let activeSec="orgs";
const NAV=[
  {s:"orgs",k:"nav_orgs",i:"🏛️"},
  {s:"meeting",k:"nav_meeting",i:"🎥"},
  {s:"questions",k:"nav_questions",i:"📋"},
  {s:"reports",k:"nav_reports",i:"📂"},
  {s:"ai",k:"nav_ai",i:"🤖",href:true},
];
function buildNav(){
  const nav=$("#raNav"); nav.innerHTML="";
  NAV.forEach(n=>{
    const b=document.createElement(n.href?"a":"button");
    if(n.href) b.href="assistant.html";
    b.className="snav-btn"+(n.s===activeSec&&!n.href?" active":"");
    b.innerHTML=`<span class="snav-ic">${n.i}</span><span>${rt(n.k)}</span>`;
    if(!n.href) b.addEventListener("click",()=>showSection(n.s));
    nav.appendChild(b);
  });
}
function showSection(sec){
  activeSec=sec;
  document.querySelectorAll("#raApp .co-sec").forEach(s=>s.hidden=(s.dataset.sec!==sec));
  buildNav();
  if(sec==="orgs") renderGrid($("#raSearch")?$("#raSearch").value:"");
  if(sec==="meeting") loadMeeting();
  if(sec==="questions") loadQuestions();
  if(sec==="reports") loadReports();
}

/* ---- monthly reports archive ---- */
async function loadReports(){
  $("#repTitle").textContent=rt("rep_title"); $("#repSub").textContent=rt("rep_sub");
  let j={};
  try{ const r=await fetch("/api/rais/reports",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({login:creds.login,password:creds.password})}); if(r.ok) j=await r.json(); }catch(e){}
  $("#repTg").textContent = j.tgChat ? rt("rep_tg_on") : rt("rep_tg_off");
  const months=j.months||[]; const arch=new Set(j.archived||[]);
  const box=$("#repList");
  if(!months.length){ box.innerHTML=`<p class="co-sub">${rt("rep_empty")}</p>`; return; }
  box.innerHTML=months.map(m=>`
    <div class="quser-row">
      <span class="quser-name">📄 ${esc(m)}${arch.has(m)?` <span class="q-badge" style="background:var(--green)">${rt("rep_archived")}</span>`:""}</span>
      <a class="btn btn-primary" href="/api/monthly.doc?ym=${encodeURIComponent(m)}" target="_blank" style="padding:6px 12px;font-size:13px">${rt("rep_dl")}</a>
      <a class="btn btn-ghost" href="/api/monthly.doc?ym=${encodeURIComponent(m)}&fresh=1" target="_blank" style="padding:6px 12px;font-size:13px">${rt("rep_refresh")}</a>
    </div>`).join("");
}

/* ---- monthly questions report ---- */
async function loadQuestions(ym){
  const r=await fetch("/api/rais/questions",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({login:creds.login,password:creds.password,ym})});
  if(!r.ok) return;
  const j=await r.json();
  $("#qTitle").textContent=rt("q_title"); $("#qSub").textContent=rt("q_sub");
  const sel=$("#qMonth");
  sel.innerHTML=(j.months||[]).map(m=>`<option value="${m}" ${m===j.ym?"selected":""}>${m}</option>`).join("")||`<option>—</option>`;
  // users who contacted + generate-letter buttons
  CUR_YM=j.ym;
  $("#qUsersTitle").textContent=rt("q_users");
  $("#qReportTitle").textContent=rt("q_question");
  const users=j.users||[];
  const ubox=$("#qUsers");
  ubox.innerHTML=users.length?users.map((u,i)=>`
    <div class="quser-row">
      <span class="quser-name">${u.type==="company"?"🏢":"📧"} ${esc(u.label)}</span>
      <span class="quser-count">${u.count} ${rt("q_reqs")}</span>
      <button class="btn btn-ghost quser-letter" data-i="${i}" style="padding:6px 12px;font-size:13px">${rt("q_makeletter")}</button>
    </div>`).join(""):`<p class="co-sub">${rt("q_empty")}</p>`;
  ubox.querySelectorAll(".quser-letter").forEach(btn=>btn.addEventListener("click",()=>makeLetter(users[+btn.dataset.i],btn)));

  const rep=j.report||[];
  const box=$("#qReport");
  if(!rep.length){ box.innerHTML=`<p class="co-sub">${rt("q_empty")}</p>`; return; }
  const rows=rep.map(q=>{
    const who=(q.companies&&q.companies.length?q.companies:q.askers||[]).map(esc).join(", ");
    return `<tr class="${q.repeated?"q-rep":""}">
      <td>${esc(q.question)}${q.repeated?` <span class="q-badge">${rt("q_repeat")}</span>`:""}</td>
      <td style="text-align:center"><b>${q.count}</b></td>
      <td>${who||"—"}</td></tr>`;
  }).join("");
  box.innerHTML=`<table class="admin-table"><thead><tr><th>${rt("q_question")}</th><th style="text-align:center">${rt("q_count")}</th><th>${rt("q_who")}</th></tr></thead><tbody>${rows}</tbody></table>`;
}
document.addEventListener("change",e=>{ if(e.target&&e.target.id==="qMonth") loadQuestions(e.target.value); });

/* ---- AI official letter (one per recipient, never mixed) ---- */
let CUR_YM="";
async function makeLetter(user, btn){
  const old=btn.textContent; btn.textContent=rt("q_gen"); btn.disabled=true;
  try{
    const r=await fetch("/api/rais/letter",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({login:creds.login,password:creds.password,type:user.type,key:user.key,ym:CUR_YM,lang:LANG})});
    const j=await r.json();
    if(j.ok){ openLetter(j.letter); }
  }catch(e){}
  btn.textContent=old; btn.disabled=false;
}
function openLetter(ltr){
  $("#ltrTo").textContent=rt("ltr_to")+": "+ltr.recipientLabel+(ltr.recipientType==="company"?" 🏢":"");
  $("#ltrBody").textContent=ltr.body;
  $("#ltrCopy").textContent=rt("ltr_copy"); $("#ltrPrint").textContent=rt("ltr_print");
  $("#letterModal").hidden=false;
  $("#letterModal").dataset.sent=rt("ltr_sent");
}
$("#ltrClose").addEventListener("click",()=>$("#letterModal").hidden=true);
$("#letterModal").addEventListener("click",e=>{ if(e.target.id==="letterModal") $("#letterModal").hidden=true; });
$("#ltrCopy").addEventListener("click",()=>{ const t=$("#ltrBody").textContent; navigator.clipboard&&navigator.clipboard.writeText(t); $("#ltrCopy").textContent=rt("ltr_copied"); setTimeout(()=>$("#ltrCopy").textContent=rt("ltr_copy"),1500); });
$("#ltrPrint").addEventListener("click",()=>{ const w=window.open("","_blank"); if(w){ w.document.write("<pre style='font-family:Georgia,serif;white-space:pre-wrap;padding:40px;line-height:1.6'>"+$("#ltrBody").textContent.replace(/</g,"&lt;")+"</pre>"); w.document.close(); w.print(); } });

/* ---- Zoom meeting scheduler ---- */
function mtMsg(text,ok){const m=$("#mtMsg");m.textContent=text;m.style.color=ok?"var(--green)":"var(--gold)";m.style.opacity=1;clearTimeout(window._mt);window._mt=setTimeout(()=>m.style.opacity=0,2600);}
async function loadMeeting(){
  try{ const r=await fetch("/api/conference"); const c=r.ok?await r.json():{};
    if(c&&c.title){ $("#mt-title").value=c.title||""; $("#mt-dt").value=c.datetime||""; $("#mt-link").value=c.link||""; $("#mt-desc").value=c.desc||""; }
  }catch(e){}
}
$("#mtForm").addEventListener("submit",e=>{e.preventDefault();
  const link=$("#mt-link").value.trim();
  if(!/^https?:\/\/.+/i.test(link)){ mtMsg(rt("mt_link_err"),false); return; }
  fetch("/api/rais/conference",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({login:creds.login,password:creds.password,title:$("#mt-title").value.trim(),datetime:$("#mt-dt").value,link,desc:$("#mt-desc").value.trim()})})
    .then(r=>r.json()).then(j=>{ if(j.error){mtMsg("Error",false);return;} mtMsg(rt("mt_saved"),true); }).catch(()=>mtMsg("Error",false));
});
$("#mtClear").addEventListener("click",()=>{
  fetch("/api/rais/conference",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({login:creds.login,password:creds.password,clear:true})})
    .then(r=>r.json()).then(()=>{ $("#mtForm").reset(); mtMsg(rt("mt_cleared"),true); }).catch(()=>mtMsg("Error",false));
});
$("#raForm").addEventListener("submit",async e=>{e.preventDefault();
  const login=$("#raLoginInp").value.trim(), pass=$("#raPassInp").value;
  if(await tryLogin(login,pass)){ $("#raErr").textContent=""; startApp(); }
  else $("#raErr").textContent=rt("err");
});
$("#logoutBtn").addEventListener("click",()=>{ sessionStorage.removeItem("kg_rais"); creds=null; showLogin(); });

/* ---- grid of all associations ---- */
function renderGrid(filter=""){
  $("#raDetail").hidden=true; $("#raGrid").hidden=false;
  const q=filter.trim().toLowerCase();
  // search every language, so a Russian query still finds an association
  const list=DATA.filter(a=>{
    if(q==="") return true;
    const hay=[a.name, a.i18n&&a.i18n.uz, a.i18n&&a.i18n.ru, a.i18n&&a.i18n.en, a.chairman]
      .filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  });
  const grid=$("#raGrid");
  if(!list.length){ grid.innerHTML=`<p class="empty-state">${rt("none")}</p>`; return; }
  grid.innerHTML=list.map(a=>{
    const idx=DATA.indexOf(a);
    return `<a class="dir-card" href="#" data-i="${idx}">
      <span class="dir-mark">${esc(aName(a).charAt(0).toUpperCase())}</span>
      <span class="dir-body">
        <b>${esc(aName(a))}</b>
        ${a.chairman?`<em>${rt("chair")}: ${esc(a.chairman)}</em>`:`<em>&nbsp;</em>`}
        <span class="dir-count">${a.companies.length} ${rt("companies")}</span>
      </span>
      <span class="dir-open">${rt("open")}</span>
    </a>`;
  }).join("");
  grid.querySelectorAll(".dir-card").forEach(c=>c.addEventListener("click",e=>{e.preventDefault();openDetail(+c.dataset.i);}));
}

/* ---- detail: one association → its companies → their products ---- */
function openDetail(i){
  const a=DATA[i]; if(!a) return;
  $("#raGrid").hidden=true; $("#raDetail").hidden=false;
  $("#raBack").textContent=rt("back");
  $("#dName").textContent=aName(a);
  $("#dChair").textContent=a.chairman?(rt("chair")+": "+a.chairman):"";
  const box=$("#dCompanies");
  if(!a.companies.length){ box.innerHTML=`<p class="co-sub">${rt("no_comp")}</p>`; return; }
  box.innerHTML=a.companies.map(c=>{
    const prods=(c.showroom||[]);
    const items=prods.length?prods.map(p=>`<li><b>${esc(p.name)}</b>${p.price?` — ${esc(p.price)}`:""}${p.desc?`<span>${esc(p.desc)}</span>`:""}</li>`).join(""):`<li class="muted">${rt("no_prod")}</li>`;
    return `<div class="ra-company">
      <div class="ra-company-head"><b>${esc(c.name)}</b><span>${esc(c.sector)||"—"} · ${prods.length} ${rt("products")}</span></div>
      <ul class="ra-products">${items}</ul>
    </div>`;
  }).join("");
}
$("#raBack").addEventListener("click",e=>{e.preventDefault();renderGrid($("#raSearch").value);});
$("#raSearch").addEventListener("input",e=>renderGrid(e.target.value));

/* ---- lang + theme ---- */
function applyStatic(){
  $("#lgTitle").textContent=rt("lg_title"); $("#lgSub").textContent=rt("lg_sub"); $("#lgBtn").textContent=rt("lg_btn");
  $("#logoutBtn").textContent=rt("logout"); $("#raKicker").textContent=rt("kicker");
  $("#raTitle").textContent=rt("title"); $("#raSearch").placeholder=rt("search");
  $("#mtTitle").textContent=rt("mt_title"); $("#mtSub").textContent=rt("mt_sub");
  $("#mt-title").placeholder=rt("mt_topic"); $("#mt-desc").placeholder=rt("mt_desc");
  $("#mtSave").textContent=rt("mt_save"); $("#mtClear").textContent=rt("mt_clear");
}
function setLang(lang){
  LANG=lang; localStorage.setItem("kg_lang",lang); document.documentElement.lang=lang;
  $("#langBtn").textContent=lang.toUpperCase();
  applyStatic();
  if(!$("#raApp").hidden){ startApp(); }
}
$("#langBtn").addEventListener("click",()=>setLang(LANGS[(L()+1)%LANGS.length]));

const themeBtn=$("#themeBtn");
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("kg_theme",theme);themeBtn.innerHTML=theme==="dark"?ICON_SUN:ICON_MOON;}
themeBtn.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));

/* ---- init ---- */
(async function init(){
  setTheme(localStorage.getItem("kg_theme")||"light");
  document.documentElement.lang=LANG; $("#langBtn").textContent=LANG.toUpperCase();
  applyStatic();
  if(creds && await tryLogin(creds.login,creds.password)) startApp();
  else showLogin();
})();
