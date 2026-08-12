/* ============================================================
   TIJORAT MARKAZI — Super Admin (uyushma) panel
   Same shell/interface as the admin panel, scoped to the
   association's OWN companies only.
   ============================================================ */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $ = (s,r=document)=>r.querySelector(s);

let creds = null;          // {login, password}
let assoc = null;          // {id, name, chairman}
let companies = [];
let CONF_ACTIVE = false;
let CUR_YM = "";
let activeView = "dashboard";
try{ creds = JSON.parse(sessionStorage.getItem("kg_as")||"null"); }catch(e){ creds=null; }

function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function escA(s){return esc(s).replace(/"/g,"&quot;");}
const MN={uz:["yan","fev","mar","apr","may","iyn","iyl","avg","sen","okt","noy","dek"],ru:["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"],en:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]};
const MNF={uz:["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"],ru:["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],en:["January","February","March","April","May","June","July","August","September","October","November","December"]};
function fmtDateTime(s){const d=new Date(s);if(isNaN(d))return s||"";return `${d.getDate()} ${MNF[LANG][d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;}

/* ---- translations ---- */
const AT = {
  lg_title:["Super Admin paneli","Панель супер-админа","Super Admin panel"],
  lg_sub:["Login va parol bilan kiring (admin bergan).","Войдите по логину и паролю (выданы админом).","Sign in with the login/password issued by the admin."],
  lg_btn:["Kirish →","Войти →","Sign in →"],
  err:["Login yoki parol noto'g'ri","Неверный логин или пароль","Wrong login or password"],
  logout:["Chiqish","Выход","Logout"],
  back:["← Saytga qaytish","← Вернуться на сайт","← Back to site"],
  nav_dash:["Dashboard","Дашборд","Dashboard"],
  nav_comp:["Kompaniyalar","Компании","Companies"],
  nav_quest:["Murojaatlar","Обращения","Appeals"],
  nav_news:["Yangiliklar","Новости","News"],
  nav_report:["Oylik hisobot","Месячный отчёт","Monthly report"],
  nav_groups:["Guruh chat","Групповой чат","Group chat"],
  nav_conf:["Onlayn uchrashuv","Онлайн-встреча","Online meeting"],
  news_intro:["Uyushmangiz sohasiga oid AI yangiliklar.","AI-новости по сфере вашей ассоциации.","AI news for your association's sphere."],
  news_loading:["⏳ Yangiliklar yuklanmoqda…","⏳ Загрузка новостей…","⏳ Loading news…"],
  news_empty:["Yangiliklar yo'q.","Новостей нет.","No news yet."],
  /* dashboard */
  d_companies:["Kompaniyalar","Компании","Companies"],
  d_products:["Jami mahsulotlar","Всего товаров","Total products"],
  d_with:["Mahsulotli","С товарами","With products"],
  d_meeting:["Faol uchrashuv","Активная встреча","Active meeting"],
  yes:["Bor","Есть","Yes"], no:["Yo'q","Нет","No"],
  flow:["Kompaniyalar o'sishi","Рост компаний","Company growth"],
  flow_sub:["Har oy oxiridagi jami a'zo kompaniyalar soni — so'nggi 12 oy.",
            "Общее число компаний-членов на конец каждого месяца — последние 12 месяцев.",
            "Cumulative member companies at each month end — last 12 months."],
  flow_empty:["Hali kompaniya qo'shilmagan","Компании ещё не добавлены","No companies added yet"],
  flow_undated:["shundan sanasi noma'lum: ","из них без даты: ","of which undated: "],
  recent:["So'nggi kompaniyalar","Последние компании","Recent companies"],
  /* companies */
  cmp_intro:["Faqat o'z kompaniyalaringizni qo'shing va boshqaring. Har biriga login/parol bering.","Добавляйте и управляйте только своими компаниями. Каждой выдайте логин/пароль.","Add and manage only your own companies. Issue each a login/password."],
  c_name:["Kompaniya","Компания","Company"],
  c_sector:["Soha","Отрасль","Sector"],
  c_login:["Login","Логин","Login"],
  c_pass:["Parol","Пароль","Password"],
  c_prod:["Mahsulot","Товаров","Products"],
  add:["Qo'shish","Добавить","Add"],
  del:["O'chirish","Удалить","Delete"],
  view:["📊 Statistika","📊 Статистика","📊 Stats"],
  ph_name:["Kompaniya nomi","Название компании","Company name"],
  need:["Login va parol kiriting","Введите логин и пароль","Enter login and password"],
  taken:["Bu login band","Этот логин занят","This login is taken"],
  cmp_empty:["Hali kompaniya qo'shilmagan.","Компании ещё не добавлены.","No companies yet."],
  hint:["Kompaniya o'z paneliga shu yerda kiradi:","Компания входит в свою панель здесь:","The company signs into its panel here:"],
  cd_back:["← Orqaga","← Назад","← Back"],
  cd_info:["Ma'lumotlar","Данные","Company data"],
  cd_products:["Mahsulotlar","Товары","Products"],
  st_products:["Mahsulotlar","Товаров","Products"],
  st_priced:["Narxli","С ценой","Priced"],
  st_photo:["Rasmli","С фото","With photo"],
  cd_empty:["Bu kompaniyada hali mahsulot yo'q.","У этой компании пока нет товаров.","No products yet."],
  i_name:["Kompaniya nomi","Название компании","Company name"],
  i_sector:["Soha","Отрасль","Sector"],
  i_login:["Login","Логин","Login"],
  i_pass:["Parol","Пароль","Password"],
  i_created:["Ro'yxatdan o'tgan","Дата регистрации","Registered"],
  i_products:["Mahsulotlar soni","Кол-во товаров","Products count"],
  /* questions */
  q_sub:["Faqat o'z kompaniyalaringiz bergan murojaatlar.","Обращения только ваших компаний.","Appeals from your own companies only."],
  q_users:["Murojaat qilgan kompaniyalar","Обратившиеся компании","Companies that contacted"],
  q_reqs:["so'rov","запросов","requests"],
  q_makeletter:["✉️ Rasmiy xat","✉️ Офиц. письмо","✉️ Official letter"],
  q_gen:["✍️ yozilmoqda…","✍️ пишется…","✍️ writing…"],
  q_question:["Savol","Вопрос","Question"],
  q_count:["Soni","Кол-во","Count"],
  q_who:["Kompaniya","Компания","Company"],
  q_repeat:["takror","повтор","repeat"],
  q_questionsh:["Savollar","Вопросы","Questions"],
  q_empty:["Bu oyda murojaatlar yo'q.","В этом месяце обращений нет.","No appeals this month."],
  /* report */
  rep_intro:["O'z kompaniyalaringizning oylik natijalari — rasmiy xatlar Word shablonida.","Месячные результаты ваших компаний — официальные письма в Word.","Monthly results of your companies — official letters as a Word file."],
  rep_month:["Oy","Месяц","Month"],
  rep_download:["Word'da yuklab olish","Скачать в Word","Download Word"],
  rep_comp:["Kompaniya","Компания","Company"],
  rep_prod:["Mahsulotlar","Товаров","Products"],
  rep_q:["Murojaatlar","Обращений","Appeals"],
  rep_empty:["Bu oyda muammoli murojaatlar yo'q.","В этом месяце проблемных обращений нет.","No problem appeals this month."],
  rep_count:["Murojaatli kompaniyalar","Компаний с обращениями","Companies with appeals"],
  /* conference */
  conf_intro:["O'z kompaniyalaringiz uchun Zoom uchrashuv vaqtini belgilang. Ular buni ko'radi.","Назначьте время Zoom-встречи для своих компаний. Они это увидят.","Set a Zoom meeting time for your companies. They will see it."],
  conf_title:["Sarlavha","Заголовок","Title"],
  conf_title_ph:["Masalan: A'zolar bilan uchrashuv","Например: Встреча с участниками","E.g. Meeting with members"],
  conf_dt:["Sana va vaqt","Дата и время","Date & time"],
  conf_link:["Havola (Zoom / Meet)","Ссылка (Zoom / Meet)","Link (Zoom / Meet)"],
  conf_desc:["Tavsif (ixtiyoriy)","Описание (необязательно)","Description (optional)"],
  conf_save:["Saqlash","Сохранить","Save"],
  conf_clear:["O'chirish","Удалить","Remove"],
  conf_saved:["✓ Saqlandi","✓ Сохранено","✓ Saved"],
  conf_cleared:["Uchrashuv o'chirildi","Встреча удалена","Meeting removed"],
  conf_link_err:["To'g'ri havola kiriting (https://…)","Введите корректную ссылку (https://…)","Enter a valid link (https://…)"],
  conf_current:["Joriy uchrashuv","Текущая встреча","Current meeting"],
  conf_add:["+ Qo'shish","+ Добавить","+ Add"],
  conf_listh:["Rejalashtirilgan uchrashuvlar","Запланированные встречи","Scheduled meetings"],
  conf_added:["✓ Qo'shildi","✓ Добавлено","✓ Added"],
  conf_none_list:["Hozircha uchrashuv yo'q.","Встреч пока нет.","No meetings yet."],
  /* letter modal */
  ltr_to:["Kimga","Кому","To"],
  ltr_copy:["Nusxa olish","Копировать","Copy"],
  ltr_print:["Chop etish","Печать","Print"],
  ltr_copied:["✓ Nusxa olindi","✓ Скопировано","✓ Copied"],
  /* public page */
  kicker:["Uyushma","Ассоциация","Association"],
  cmp_title:["A'zo kompaniyalar","Компании-члены","Member companies"],
  back_dir:["← Uyushmalar","← Ассоциации","← Associations"],
  login_chair:["🔑 Super admin sifatida kirish","🔑 Войти как супер-админ","🔑 Sign in as super admin"],
  pub_empty:["Bu uyushmada hali kompaniyalar yo'q.","В этой ассоциации пока нет компаний.","No companies in this association yet."],
  open:["Ochish →","Открыть →","Open →"],
};
const t = k => AT[k][L()];

/* ---- nav ---- */
const NAV = [
  {v:"dashboard", k:"nav_dash", ic:svg('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>')},
  {v:"companies", k:"nav_comp", ic:(typeof ICONS!=="undefined"&&ICONS.business)?ICONS.business:svg('<path d="M3 21h18"/><path d="M5 21V8l7-4 7 4v13"/>')},
  {v:"questions", k:"nav_quest", ic:svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>')},
  {v:"news", k:"nav_news", ic:svg('<path d="M4 4h13a1 1 0 0 1 1 1v13a2 2 0 0 0 2-2V7"/><path d="M4 4a1 1 0 0 0-1 1v13a2 2 0 0 0 2 2h13"/><path d="M7 8h7M7 12h7M7 16h4"/>')},
  {v:"report", k:"nav_report", ic:svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M8 9h2"/>')},
  {v:"groups", k:"nav_groups", href:"chat.html", ic:svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>')},
  {v:"conference", k:"nav_conf", ic:svg('<path d="M15 10l5-3v10l-5-3z"/><rect x="3" y="6" width="12" height="12" rx="2"/>')},
];
const VIEW_TITLE = {dashboard:"nav_dash",companies:"nav_comp",questions:"nav_quest",news:"nav_news",report:"nav_report",conference:"nav_conf"};

/* ============================================================
   API helpers
   ============================================================ */
function assocReq(path, body){
  return fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(Object.assign({login:creds.login,password:creds.password},body))}).then(r=>r.json());
}
function credQ(){ return "login="+encodeURIComponent(creds.login)+"&password="+encodeURIComponent(creds.password); }

/* ============================================================
   VIEW: DASHBOARD
   ============================================================ */
function renderDashboard(){
  const total=companies.length;
  const products=companies.reduce((s,c)=>s+((c.showroom||[]).length),0);
  const withP=companies.filter(c=>(c.showroom||[]).length>0).length;
  const cards=[
    {l:t("d_companies"),v:total,s:"▲"},
    {l:t("d_products"),v:products,s:"🛍️"},
    {l:t("d_with"),v:withP+" / "+total,s:""},
    {l:t("d_meeting"),v:CONF_ACTIVE?t("yes"):t("no"),s:""},
  ].map(c=>`<div class="admin-card"><div class="ac-label">${c.l}</div><div class="ac-val">${c.v}</div>${c.s?`<div class="ac-sub">${c.s}</div>`:""}</div>`).join("");
  const recent=companies.slice().reverse().slice(0,6).map(c=>`<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.sector)||"—"}</td><td>${(c.showroom||[]).length}</td><td><code>${esc(c.login)}</code></td></tr>`).join("")
    || `<tr><td colspan="4" class="ac-label">${t("cmp_empty")}</td></tr>`;

  // Real series from the member companies' own creation dates.
  const series=kgMonthlySeries(companies);
  const chart=kgAreaChart(
    series.buckets.map(b=>({label:MN[LANG][b.m], total:b.total, added:b.added})),
    { emptyText:t("flow_empty"),
      ariaLabel:`${t("flow")}: ${series.buckets.map(b=>`${MN[LANG][b.m]} ${b.total}`).join(", ")}` });
  $("#view-dashboard").innerHTML=`
    <div class="admin-cards">${cards}</div>
    <div class="admin-panel">
      <h2>${t("flow")}</h2>
      <p class="ac-label" style="margin:-8px 0 16px">${t("flow_sub")}${
        series.undated ? ` (${t("flow_undated")}${series.undated})` : ""}</p>
      ${chart}
    </div>
    <div class="admin-panel">
      <h2>${t("recent")}</h2>
      <table class="admin-table"><thead><tr><th>${t("c_name")}</th><th>${t("c_sector")}</th><th>${t("c_prod")}</th><th>${t("c_login")}</th></tr></thead><tbody>${recent}</tbody></table>
    </div>`;
}

/* ============================================================
   VIEW: COMPANIES (own only) + detail
   ============================================================ */
let detailId=null;
function renderCompanies(){
  const view=$("#view-companies");
  if(detailId){ renderCompanyDetail(view); return; }
  const rows=companies.slice().reverse().map(c=>`<tr>
    <td><a href="#" class="cd-open" data-id="${c.id}"><b>${esc(c.name)}</b></a></td>
    <td>${esc(c.sector)||"—"}</td>
    <td><code>${esc(c.login)}</code></td>
    <td><code>${esc(c.password)}</code></td>
    <td style="text-align:center">${(c.showroom||[]).length}</td>
    <td style="white-space:nowrap">
      <button class="btn btn-ghost cd-stat" data-id="${c.id}" style="padding:5px 10px;font-size:13px">${t("view")}</button>
      <button class="tdel" data-id="${c.id}">${t("del")}</button></td></tr>`).join("")
    || `<tr><td colspan="6" class="ac-label">${t("cmp_empty")}</td></tr>`;
  view.innerHTML=`
    <div class="admin-panel">
      <h2>${t("nav_comp")} (${companies.length})</h2>
      <p style="color:var(--muted);font-size:14px;margin-bottom:14px">${t("cmp_intro")}</p>
      <table class="admin-table"><thead><tr><th>${t("c_name")}</th><th>${t("c_sector")}</th><th>${t("c_login")}</th><th>${t("c_pass")}</th><th style="text-align:center">${t("c_prod")}</th><th></th></tr></thead><tbody>${rows}</tbody></table>
      <div class="err" id="cmpErr" style="margin-top:10px"></div>
      <form class="admin-form mb-form" id="cmpForm">
        <input id="cmp-name" placeholder="${t("ph_name")}" required>
        <input id="cmp-sector" placeholder="${t("c_sector")}">
        <input id="cmp-login" placeholder="${t("c_login")}" required>
        <input id="cmp-pass" placeholder="${t("c_pass")}" required>
        <button class="btn btn-primary" type="submit">${t("add")}</button>
      </form>
      <p style="color:var(--muted);font-size:13px;margin-top:12px">${t("hint")} <a href="company.html" target="_blank">company.html</a></p>
    </div>`;
  $("#cmpForm").addEventListener("submit",async e=>{e.preventDefault();
    const clogin=$("#cmp-login").value.trim(), cpass=$("#cmp-pass").value;
    if(!clogin||!cpass){ $("#cmpErr").textContent=t("need"); return; }
    const ok=await op({op:"add",name:$("#cmp-name").value.trim(),sector:$("#cmp-sector").value.trim(),clogin,cpassword:cpass});
    if(ok) renderCompanies();
  });
  view.querySelectorAll(".tdel").forEach(b=>b.addEventListener("click",()=>op({op:"del",id:b.dataset.id}).then(()=>renderCompanies())));
  view.querySelectorAll(".cd-open,.cd-stat").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();detailId=b.dataset.id;renderCompanies();}));
}
function renderCompanyDetail(view){
  const c=companies.find(x=>x.id===detailId);
  if(!c){ detailId=null; renderCompanies(); return; }
  const prods=c.showroom||[];
  const priced=prods.filter(p=>p.price&&String(p.price).trim()).length;
  const photo=prods.filter(p=>p.img&&String(p.img).trim()).length;
  const card=(l,v)=>`<div class="admin-card"><div class="ac-label">${l}</div><div class="ac-val">${v}</div></div>`;
  const row=(l,v)=>`<tr><td style="color:var(--muted);width:200px">${l}</td><td>${v}</td></tr>`;
  const grid=prods.length?prods.map(p=>`
    <div class="show-card">
      ${p.img?`<img class="show-img" src="${escA(p.img)}" alt="" loading="lazy">`:`<div class="show-img show-img-ph">🛍️</div>`}
      <div class="show-body"><b>${esc(p.name)}</b>${p.price?`<span class="show-price">${esc(p.price)}</span>`:""}${p.desc?`<p>${esc(p.desc)}</p>`:""}</div>
    </div>`).join(""):`<p class="ac-label">${t("cd_empty")}</p>`;
  view.innerHTML=`
    <button class="btn btn-ghost" id="cdBack" style="margin-bottom:14px">${t("cd_back")}</button>
    <div class="admin-cards">${card(t("st_products"),prods.length)+card(t("st_priced"),priced)+card(t("st_photo"),photo)}</div>
    <div class="admin-panel">
      <h2>${esc(c.name)}</h2>
      <table class="admin-table"><tbody>
        ${row(t("i_name"),esc(c.name))}
        ${row(t("i_sector"),esc(c.sector)||"—")}
        ${row(t("i_login"),`<code>${esc(c.login)}</code>`)}
        ${row(t("i_pass"),`<code>${esc(c.password)}</code>`)}
        ${row(t("i_created"),c.created?fmtDateTime(c.created):"—")}
        ${row(t("i_products"),prods.length)}
      </tbody></table>
    </div>
    <div class="admin-panel">
      <h2>${t("cd_products")}</h2>
      <div class="show-grid">${grid}</div>
    </div>`;
  $("#cdBack").addEventListener("click",()=>{detailId=null;renderCompanies();});
}
async function op(body){
  const j=await assocReq("/api/assoc/companies",body);
  if(j.error){ const e=$("#cmpErr"); if(e) e.textContent=j.error==="login exists"?t("taken"):t("need"); return false; }
  companies=j.companies||[]; return true;
}

/* ============================================================
   VIEW: QUESTIONS (own companies only) + official letters
   ============================================================ */
function renderQuestions(){
  $("#view-questions").innerHTML=`<div class="admin-panel">
    <h2>${t("nav_quest")} <select class="adm-search mono" id="qMonth" style="float:right;max-width:160px"></select></h2>
    <p style="color:var(--muted);font-size:14px;margin-bottom:16px">${t("q_sub")}</p>
    <h3 style="font-size:15px;margin:6px 0 10px">${t("q_users")}</h3>
    <div id="qUsers" style="margin-bottom:22px"></div>
    <h3 style="font-size:15px;margin:6px 0 10px">${t("q_questionsh")}</h3>
    <div id="qReport"></div>
  </div>`;
  $("#qMonth").addEventListener("change",e=>loadQ(e.target.value));
  loadQ();
}
function loadQ(ym){
  assocReq("/api/assoc/questions",{ym}).then(j=>{
    if(j.error) return;
    CUR_YM=j.ym;
    const sel=$("#qMonth"); sel.innerHTML=(j.months||[]).map(m=>`<option value="${m}" ${m===j.ym?"selected":""}>${m}</option>`).join("")||`<option>—</option>`;
    const users=j.users||[];
    $("#qUsers").innerHTML=users.length?users.map((u,i)=>`
      <div class="quser-row">
        <span class="quser-name">🏢 ${escA(u.label)}</span>
        <span class="quser-count">${u.count} ${t("q_reqs")}</span>
        <button class="btn btn-ghost quser-letter" data-i="${i}" style="padding:6px 12px;font-size:13px">${t("q_makeletter")}</button>
      </div>`).join(""):`<p class="ac-label">${t("q_empty")}</p>`;
    $("#qUsers").querySelectorAll(".quser-letter").forEach(btn=>btn.addEventListener("click",()=>makeLetter(users[+btn.dataset.i],btn)));
    const rep=j.report||[];
    $("#qReport").innerHTML=rep.length
      ? `<table class="admin-table"><thead><tr><th>${t("q_question")}</th><th style="text-align:center">${t("q_count")}</th><th>${t("q_who")}</th></tr></thead><tbody>`
        + rep.map(q=>{const who=(q.companies||[]).map(escA).join(", ");
          return `<tr class="${q.repeated?"q-rep":""}"><td>${esc(q.question)}${q.repeated?` <span class="q-badge">${t("q_repeat")}</span>`:""}</td><td style="text-align:center"><b>${q.count}</b></td><td>${who||"—"}</td></tr>`;}).join("")
        + `</tbody></table>`
      : `<p class="ac-label">${t("q_empty")}</p>`;
  });
}
async function makeLetter(user,btn){
  const old=btn.textContent; btn.textContent=t("q_gen"); btn.disabled=true;
  const j=await assocReq("/api/assoc/letter",{type:user.type,key:user.key,ym:CUR_YM,lang:LANG});
  if(j.ok) openLetter(j.letter);
  btn.textContent=old; btn.disabled=false;
}
function openLetter(ltr){
  $("#ltrTo").textContent=t("ltr_to")+": "+ltr.recipientLabel+" 🏢";
  $("#ltrBody").textContent=ltr.body;
  $("#ltrCopy").textContent=t("ltr_copy"); $("#ltrPrint").textContent=t("ltr_print");
  $("#letterModal").hidden=false;
}

/* ============================================================
   VIEW: NEWS (AI news for the association's sphere, read-only)
   ============================================================ */
async function renderNews(){
  $("#view-news").innerHTML=`<div class="admin-panel">
    <h2>${t("nav_news")}</h2>
    <p style="color:var(--muted);font-size:14px;margin-bottom:16px">${t("news_intro")}</p>
    <div class="mod-list" id="asNewsList"><p class="ac-label">${t("news_loading")}</p></div>
  </div>`;
  try{
    const j=await assocReq("/api/assoc/news",{lang:LANG});
    const items=(j&&j.items)||[];
    $("#asNewsList").innerHTML=items.length?items.map(it=>`
      <div class="mod-item">
        <div class="mi-head"><b>${esc(it.title)}</b>${j.sphere?`<span class="mi-badge">${esc(j.sphere)}</span>`:""}</div>
        ${it.body?`<p>${esc(it.body)}</p>`:""}
        ${it.time?`<div class="mi-foot"><span>🕓 ${fmtDateTime(it.time)}</span></div>`:""}
      </div>`).join(""):`<p class="ac-label">${t("news_empty")}</p>`;
  }catch(e){ $("#asNewsList").innerHTML=`<p class="ac-label">${t("news_empty")}</p>`; }
}

/* ============================================================
   VIEW: MONTHLY REPORT (own companies only)
   ============================================================ */
function renderReport(){
  $("#view-report").innerHTML=`
    <div class="admin-panel">
      <h2>${t("nav_report")}</h2>
      <p style="color:var(--muted);font-size:14px;margin-bottom:16px">${t("rep_intro")}</p>
      <div class="admin-form" style="align-items:end">
        <div><div class="ac-label">${t("rep_month")}</div><input type="month" id="repMonth" style="padding:10px 12px;border:1px solid var(--line-2);border-radius:8px;background:var(--bg-soft);color:var(--ink);font-family:inherit"></div>
        <a class="btn btn-primary" id="repDl" href="#" target="_blank">⬇ ${t("rep_download")}</a>
      </div>
      <div id="repPreview" style="margin-top:18px"></div>
    </div>`;
  const load=(ym)=>{
    assocReq("/api/assoc/report",{ym}).then(d=>{
      if(d.error) return;
      const m=$("#repMonth"); if(!m.value) m.value=d.ym;
      $("#repDl").href="/api/assoc/report.doc?"+credQ()+"&ym="+encodeURIComponent(d.ym);
      const comps=d.companies||[];
      $("#repPreview").innerHTML=comps.length
        ? `<p class="ac-label" style="margin-bottom:10px">${t("rep_count")}: <b>${d.companyCount}</b> · ${t("rep_q")}: <b>${d.questions}</b></p>
           <table class="admin-table"><thead><tr><th>${t("rep_comp")}</th><th style="text-align:center">${t("rep_prod")}</th><th style="text-align:center">${t("rep_q")}</th></tr></thead><tbody>`
          + comps.map(c=>`<tr><td><b>${esc(c.name)}</b></td><td style="text-align:center">${c.products}</td><td style="text-align:center">${c.questions}</td></tr>`).join("")
          + `</tbody></table>`
        : `<p class="ac-label">${t("rep_empty")}</p>`;
    });
  };
  $("#repMonth").addEventListener("change",e=>load(e.target.value));
  load("");
}

/* ============================================================
   VIEW: ONLINE MEETING (own Zoom, per association)
   ============================================================ */
function confDT(s){const d=new Date(s);if(isNaN(d))return s||"";return d.toLocaleString();}
function renderConference(){
  $("#view-conference").innerHTML=`
    <div class="admin-panel">
      <h2>${t("nav_conf")}</h2>
      <p style="color:var(--muted);font-size:14px;margin-bottom:16px">${t("conf_intro")}</p>
      <form class="admin-form" id="confForm" style="align-items:flex-end">
        <div><div class="ac-label">${t("conf_title")}</div><input id="conf-title" placeholder="${t("conf_title_ph")}" required></div>
        <div><div class="ac-label">${t("conf_dt")}</div><input id="conf-dt" type="datetime-local" required></div>
        <div><div class="ac-label">${t("conf_link")}</div><input id="conf-link" type="url" placeholder="https://meet.google.com/…" required></div>
        <div><div class="ac-label">${t("conf_desc")}</div><input id="conf-desc" placeholder="…"></div>
        <button class="btn btn-primary" type="submit">${t("conf_add")}</button>
        <span class="ac-sub" id="confMsg" style="opacity:0"></span>
      </form>
      <h3 style="font-size:15px;margin:24px 0 10px">${t("conf_listh")}</h3>
      <div id="confList"></div>
    </div>`;
  const msg=(text,ok=true)=>{const m=$("#confMsg");m.textContent=text;m.style.color=ok?"var(--green)":"var(--gold)";m.style.opacity=1;clearTimeout(window._cmt);window._cmt=setTimeout(()=>m.style.opacity=0,2200);};
  const paint=(meetings)=>{
    CONF_ACTIVE=!!(meetings&&meetings.length);
    const box=$("#confList"); if(!box) return;
    box.innerHTML=(meetings&&meetings.length)
      ? meetings.map(m=>`<div class="conf-row"><div class="conf-row-main"><b>${esc(m.title)}</b><span>${esc(confDT(m.datetime))}${m.desc?" · "+esc(m.desc):""}</span>${m.link?`<a href="${escA(m.link)}" target="_blank" rel="noopener">${esc(m.link)}</a>`:""}</div><button class="tdel" data-id="${m.id}">${t("del")}</button></div>`).join("")
      : `<p class="ac-label">${t("conf_none_list")}</p>`;
    box.querySelectorAll(".tdel").forEach(b=>b.addEventListener("click",()=>{
      assocReq("/api/assoc/conference",{removeId:b.dataset.id}).then(j=>paint(j.meetings));}));
  };
  assocReq("/api/assoc/conference",{op:"list"}).then(j=>paint(j.meetings));
  $("#confForm").addEventListener("submit",e=>{e.preventDefault();
    const link=$("#conf-link").value.trim();
    if(!/^https?:\/\/.+/i.test(link)){msg(t("conf_link_err"),false);return;}
    assocReq("/api/assoc/conference",{title:$("#conf-title").value.trim(),datetime:$("#conf-dt").value,link,desc:$("#conf-desc").value.trim()})
      .then(j=>{ paint(j.meetings); $("#confForm").reset(); msg(t("conf_added")); }).catch(()=>msg("Error",false));
  });
}

/* ============================================================
   SHELL: nav + view switching
   ============================================================ */
function renderView(){
  ["dashboard","companies","questions","news","report","conference"].forEach(v=>$("#view-"+v)&&$("#view-"+v).classList.toggle("active",v===activeView));
  if(activeView==="dashboard")  renderDashboard();
  if(activeView==="companies"){ detailId=null; renderCompanies(); }
  if(activeView==="questions")  renderQuestions();
  if(activeView==="news")       renderNews();
  if(activeView==="report")     renderReport();
  if(activeView==="conference") renderConference();
  $("#viewTitle").textContent=t(VIEW_TITLE[activeView]);
}
function buildNav(){
  const nav=$("#asNav"); nav.innerHTML="";
  NAV.forEach(n=>{
    const b=document.createElement("button"); b.className=(n.v===activeView?"active":"");
    b.innerHTML=n.ic+`<span>${t(n.k)}</span>`;
    // The group chat is its own full-screen page, not a panel view.
    b.addEventListener("click",()=> n.href ? (location.href=n.href)
      : (activeView=n.v, buildNav(), renderView()));
    nav.appendChild(b);
  });
}

/* ============================================================
   AUTH + public page
   ============================================================ */
const PAGE_ID = new URLSearchParams(location.search).get("id");
function showLogin(){ $("#asLogin").hidden=false; $("#asShell").hidden=true; $("#asPublic").hidden=true; setTimeout(()=>$("#asLoginInp").focus(),50); }
async function tryLogin(login,password){
  const r=await fetch("/api/assoc/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({login,password})});
  if(!r.ok) return false;
  const j=await r.json();
  assoc=j.assoc; companies=j.companies||[]; creds={login,password};
  sessionStorage.setItem("kg_as",JSON.stringify(creds));
  return true;
}
async function startApp(){
  $("#asLogin").hidden=true; $("#asPublic").hidden=true; $("#asShell").hidden=false;
  $("#aiNav").href="assistant.html?panel=assoc&co="+encodeURIComponent(assoc.name||"");
  // detect an active meeting for the dashboard KPI
  try{ const r=await fetch("/api/conference?assoc="+encodeURIComponent(assoc.id)); const c=r.ok?await r.json():{}; CONF_ACTIVE=!!(c&&c.title); }catch(e){}
  buildNav(); renderView();
}
async function loadPublic(id){
  try{
    const r=await fetch("/api/assoc/public?id="+encodeURIComponent(id));
    if(!r.ok){ location.href="associations.html"; return; }
    const j=await r.json();
    $("#asLogin").hidden=true; $("#asShell").hidden=true; $("#asPublic").hidden=false;
    $("#pubName").textContent=j.assoc.name||"—";
    $("#pubChair").textContent=j.assoc.chairman?("Rahbar: "+j.assoc.chairman):"";
    $("#pubCount").textContent=(j.companies||[]).length;
    const grid=$("#pubCompanies");
    if(!j.companies||!j.companies.length){ grid.innerHTML=`<p class="co-sub">${t("pub_empty")}</p>`; }
    else grid.innerHTML=j.companies.map(c=>{
      const inner=`
        <span class="dir-mark">${esc((c.name||"?").charAt(0).toUpperCase())}</span>
        <span class="dir-body"><b>${esc(c.name)}</b><em>${esc(c.sector)||"&nbsp;"}</em>
          ${c.products?`<span class="dir-count">🛍️ ${c.products}</span>`:""}</span>`;
      // only companies that actually have products in the showroom are clickable
      return c.products
        ? `<a class="dir-card" href="showroom.html?company=${encodeURIComponent(c.name||"")}">${inner}<span class="dir-open">${esc(t("open"))}</span></a>`
        : `<div class="dir-card" style="cursor:default">${inner}</div>`;
    }).join("");
  }catch(e){ location.href="associations.html"; }
}
$("#asForm").addEventListener("submit",async e=>{e.preventDefault();
  const login=$("#asLoginInp").value.trim(), pass=$("#asPassInp").value;
  if(await tryLogin(login,pass)){ $("#asErr").textContent=""; startApp(); return; }
  // not an association account → maybe admin / super-admin / company: route them there
  const target=await kgResolveLogin(login,pass);
  if(target && target!=="association.html"){ location.href=target; return; }
  $("#asErr").textContent=t("err");
});
$("#logoutBtn").addEventListener("click",()=>{ sessionStorage.removeItem("kg_as"); creds=null; assoc=null; location.href= PAGE_ID ? "association.html?id="+encodeURIComponent(PAGE_ID) : "associations.html"; });

/* ---- letter modal ---- */
$("#ltrClose").addEventListener("click",()=>$("#letterModal").hidden=true);
$("#letterModal").addEventListener("click",e=>{ if(e.target.id==="letterModal") $("#letterModal").hidden=true; });
$("#ltrCopy").addEventListener("click",()=>{ const x=$("#ltrBody").textContent; if(navigator.clipboard)navigator.clipboard.writeText(x); $("#ltrCopy").textContent=t("ltr_copied"); setTimeout(()=>$("#ltrCopy").textContent=t("ltr_copy"),1500); });
$("#ltrPrint").addEventListener("click",()=>{ const w=window.open("","_blank"); if(w){ w.document.write("<pre style='font-family:Georgia,serif;white-space:pre-wrap;padding:40px;line-height:1.6'>"+$("#ltrBody").textContent.replace(/</g,"&lt;")+"</pre>"); w.document.close(); w.print(); } });

/* ============================================================
   CHROME: lang + theme + static
   ============================================================ */
function applyChrome(){
  $("#langBtn").textContent=LANG.toUpperCase();
  $("#logoutBtn").textContent=t("logout");
  $("#backSite").textContent=t("back");
  $("#aiNav").textContent="🤖 "+["AI Assistant","AI Ассистент","AI Assistant"][L()];
  $("#lgTitle").textContent=t("lg_title"); $("#lgSub").textContent=t("lg_sub"); $("#lgBtn").textContent=t("lg_btn");
  $("#backDir").textContent=t("back_dir"); $("#pubKicker").textContent=t("kicker");
  $("#pubCmpTitle").textContent=t("cmp_title");
  document.documentElement.lang=LANG;
}
function setLang(lang){ LANG=lang; localStorage.setItem("kg_lang",lang); applyChrome();
  if(!$("#asShell").hidden){ buildNav(); renderView(); }
  if(!$("#asPublic").hidden && PAGE_ID) loadPublic(PAGE_ID);
}
$("#langBtn").addEventListener("click",()=>setLang(LANGS[(L()+1)%LANGS.length]));

const themeBtn=$("#themeBtn");
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("kg_theme",theme);themeBtn.innerHTML=theme==="dark"?ICON_SUN:ICON_MOON;}
themeBtn.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));

/* ============================================================
   INIT
   ============================================================ */
(async function init(){
  setTheme(localStorage.getItem("kg_theme")||"light");
  document.documentElement.lang=LANG; applyChrome();

  // ?id=… is an explicit request for one association's PUBLIC page, so it wins
  // even when a chairman is signed in — otherwise they could never look at
  // another association's profile.
  if(PAGE_ID){ loadPublic(PAGE_ID); return; }

  // No id → this is the panel. Re-verify any stored session against the server
  // rather than trusting sessionStorage, then open it.
  if(creds && creds.login){
    if(await tryLogin(creds.login, creds.password)){ startApp(); return; }
    sessionStorage.removeItem("kg_as"); creds=null;
  }
  showLogin();
})();
