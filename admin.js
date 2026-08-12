/* ============================================================
   TIJORAT MARKAZI — Admin panel (front-end demo, localStorage)
   ============================================================ */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $ = (s,r=document)=>r.querySelector(s);

/* ---- admin translations ---- */
const AT = {
  lg_title:["Admin panel","Админ-панель","Admin panel"],
  lg_sub:["TIJORAT MARKAZI boshqaruv paneli","Панель управления TIJORAT MARKAZI","TIJORAT MARKAZI control panel"],
  lg_btn:["Kirish","Войти","Sign In"],
  lg_hint:["Demo parol: admin","Демо-пароль: admin","Demo password: admin"],
  lg_err:["Noto'g'ri parol","Неверный пароль","Wrong password"],
  logout:["Chiqish","Выход","Logout"],
  back:["← Saytga qaytish","← Вернуться на сайт","← Back to site"],
  nav_dash:["Dashboard","Дашборд","Dashboard"],
  nav_comp:["Kompaniyalar","Компании","Companies"],
  nav_leads:["Murojaatlar","Заявки","Leads"],
  nav_quest:["Savollar va xatlar","Вопросы и письма","Questions & letters"],
  q_sub:["Foydalanuvchilar bergan savollar. Takroriy savol yonida — kompaniya nomi.","Вопросы пользователей. У повторных — имя компании.","User questions. Repeated ones show the company name."],
  q_users:["Murojaat qilgan foydalanuvchilar","Обратившиеся пользователи","Users who contacted"],
  q_reqs:["so'rov","запросов","requests"],
  q_makeletter:["✉️ Rasmiy xat","✉️ Офиц. письмо","✉️ Official letter"],
  q_assocs:["Uyushmalar bo'yicha — bitta umumiy xat","По ассоциациям — одно общее письмо","By association — one combined letter"],
  q_assocs_sub:["Uyushmaga a'zo barcha kompaniyalarning savollari bitta rasmiy xatga jamlanadi.","Вопросы всех компаний-членов ассоциации объединяются в одно официальное письмо.","All member companies' questions are merged into a single official letter."],
  q_assoc_letter:["✉️ Umumiy xat","✉️ Общее письмо","✉️ Combined letter"],
  q_comps:["kompaniya","компаний","companies"],
  q_gen:["✍️ yozilmoqda…","✍️ пишется…","✍️ writing…"],
  q_question:["Savol","Вопрос","Question"],
  q_count:["Soni","Кол-во","Count"],
  q_who:["Kim / Kompaniya","Кто / Компания","Who / Company"],
  q_repeat:["takror","повтор","repeat"],
  q_empty:["Bu oyda savollar yo'q.","В этом месяце вопросов нет.","No questions this month."],
  q_usersh:["Foydalanuvchilar","Пользователи","Users"],
  q_questionsh:["Savollar","Вопросы","Questions"],
  ltr_to:["Kimga","Кому","To"],
  ltr_copy:["Nusxa olish","Копировать","Copy"],
  ltr_dl:["Yuklab olish","Скачать","Download"],
  ltr_print:["Chop etish","Печать","Print"],
  ltr_copied:["✓ Nusxa olindi","✓ Скопировано","✓ Copied"],
  nav_assoc:["Uyushmalar","Ассоциации","Associations"],
  nav_members:["A'zo kompaniyalar","Компании-члены","Member companies"],
  nav_conf:["Konferensiya","Конференция","Conference"],
  nav_projects:["Startup loyihalar","Стартап-проекты","Startup projects"],
  nav_chat:["Loyiha chat","Чат по проектам","Project chat"],
  pr_intro:["Barcha kompaniyalarning investitsiya/startup loyihalari.","Инвест/стартап-проекты всех компаний.","Investment/startup projects of all companies."],
  pr_empty:["Hali loyiha yo'q.","Проектов пока нет.","No projects yet."],
  pr_company:["Kompaniya","Компания","Company"],
  pr_proj:["Loyiha","Проект","Project"],
  pr_amount:["Summa","Сумма","Amount"],
  pr_status:["Holati","Статус","Status"],
  pr_assoc:["Uyushma","Ассоциация","Association"],
  ch_intro:["Kompaniyalar loyihalari bo'yicha savollari. Javob yozing.","Вопросы компаний по проектам. Ответьте.","Companies' project questions. Reply here."],
  ch_empty:["Hali xabar yo'q.","Сообщений пока нет.","No messages yet."],
  ch_back:["← Suhbatlar","← Чаты","← Chats"],
  ch_ph:["Javob yozing…","Напишите ответ…","Write a reply…"],
  ch_send:["Yuborish","Отправить","Send"],
  as_intro:["Barcha uyushmalar va ularning raislari. Har bir uyushma ostida a'zo kompaniyalar bo'ladi.","Все ассоциации и их председатели. Под каждой ассоциацией — компании-члены.","All associations and their chairmen. Each association holds its member companies."],
  as_name:["Uyushma nomi","Название ассоциации","Association name"],
  as_chair:["Rais (Chairman)","Председатель","Chairman"],
  as_count:["Kompaniyalar","Компаний","Companies"],
  as_login:["Login","Логин","Login"],
  as_pass:["Parol","Пароль","Password"],
  as_panel:["Panel havolasi","Ссылка на панель","Panel link"],
  rais_title:["Rais (bosh nazorat)","Раис (главный контроль)","Rais (top oversight)"],
  rais_hint:["Rais barcha uyushmalarni va ularning mahsulotlarini ko'radi.","Раис видит все ассоциации и их продукты.","The rais sees all associations and their products."],
  rais_tg:["Rais Telegram chat ID (oylik hisobot uchun)","Rais Telegram chat ID (для месячного отчёта)","Rais Telegram chat ID (for the monthly report)"],
  as_catalog:["📇 Katalog ko'rinishi","📇 Вид каталога","📇 Catalog view"],
  as_open:["Ochish →","Открыть →","Open →"],
  as_back:["← Uyushmalar","← Ассоциации","← Associations"],
  as_children:["Dochki (a'zo) kompaniyalar","Дочерние компании","Subsidiary companies"],
  as_empty_c:["Bu uyushmada hali kompaniya yo'q.","В этой ассоциации пока нет компаний.","No companies in this association yet."],
  nav_report:["Oylik hisobot","Месячный отчёт","Monthly report"],
  rep_intro:["Barcha tashkilotlarning oylik natijalari — Word shablonida yuklab oling.","Месячные результаты всех организаций — скачайте в виде Word-шаблона.","Monthly results of all organizations — download as a Word template."],
  rep_month:["Oy","Месяц","Month"],
  rep_download:["Word'da yuklab olish","Скачать в Word","Download Word"],
  rep_orgs:["Tashkilotlar","Организаций","Organizations"],
  rep_org:["Tashkilot","Организация","Organization"],
  rep_chair:["Rais","Председатель","Chairman"],
  rep_comp:["Kompaniyalar","Компаний","Companies"],
  rep_prod:["Mahsulotlar","Товаров","Products"],
  rep_inv:["Invest","Инвест","Invest"],
  rep_news:["Yangiliklar","Новости","News"],
  rep_q:["Savollar","Вопросы","Questions"],
  rep_total:["JAMI","ИТОГО","TOTAL"],
  as_addname:["Yangi uyushma nomi","Название новой ассоциации","New association name"],
  as_addchair:["Rais ismi (ixtiyoriy)","Имя председателя (необязательно)","Chairman name (optional)"],
  mb_intro:["Kompaniyalarni uyushmaga biriktiring va ularga login/parol bering. Kompaniya o'z panelida shu login bilan kiradi.","Привяжите компании к ассоциации и выдайте им логин/пароль. Компания входит в свою панель по этому логину.","Attach companies to an association and issue them a login/password. The company signs into its panel with it."],
  mb_all:["Barcha uyushmalar","Все ассоциации","All associations"],
  mb_name:["Kompaniya","Компания","Company"],
  mb_assoc:["Uyushma","Ассоциация","Association"],
  mb_sector:["Soha","Отрасль","Sector"],
  mb_login:["Login","Логин","Login"],
  mb_pass:["Parol","Пароль","Password"],
  mb_addname:["Kompaniya nomi","Название компании","Company name"],
  mb_login_taken:["Bu login band","Этот логин занят","This login is taken"],
  mb_need:["Login va parol kiriting","Введите логин и пароль","Enter login and password"],
  nav_set:["Sozlamalar","Настройки","Settings"],
  d_companies:["Kompaniyalar","Компании","Companies"],
  d_products:["Jami mahsulotlar","Всего товаров","Total products"],
  d_with:["Mahsuloti borlar","С товарами","With products"],
  d_leads:["Murojaatlar","Заявки","Leads"],
  recent:["So'nggi murojaatlar","Последние заявки","Recent leads"],
  flow:["Kompaniyalar o'sishi","Рост компаний","Company growth"],
  flow_sub:["Platformadagi jami kompaniyalar soni, har oy oxirida — so'nggi 12 oy.",
            "Общее число компаний на платформе на конец каждого месяца — последние 12 месяцев.",
            "Cumulative companies on the platform at each month end — last 12 months."],
  flow_empty:["Hali kompaniya qo'shilmagan","Компании ещё не добавлены","No companies added yet"],
  flow_undated:["shundan sanasi noma'lum: ","из них без даты: ","of which undated: "],
  c_name:["Nomi","Название","Name"],
  c_sector:["Soha","Отрасль","Sector"],
  c_status:["Holati","Статус","Status"],
  c_invest:["Investitsiya","Инвестиции","Investment"],
  c_company:["Kompaniya","Компания","Company"],
  c_email:["Email","Email","Email"],
  c_date:["Sana","Дата","Date"],
  c_block:["Blok","Блок","Block"],
  c_actions:["","",""],
  add_company:["Kompaniya qo'shish","Добавить компанию","Add company"],
  name_ph:["Kompaniya nomi","Название компании","Company name"],
  sector_ph:["Soha","Отрасль","Sector"],
  invest_ph:["Investitsiya (masalan $50M)","Инвестиции (напр. $50M)","Investment (e.g. $50M)"],
  add:["Qo'shish","Добавить","Add"],
  del:["O'chirish","Удалить","Delete"],
  on:["Faol","Активен","Active"],
  off:["O'chiq","Выключен","Off"],
  export_word:["Murojaatlarni Word'ga yuklash","Скачать обращения в Word","Export problems to Word"],
  ads_intro:["Reklama bloklarini yoqing va matnini tahrirlang. O'zgarishlar saytda darhol ko'rinadi.","Включите рекламные блоки и отредактируйте текст. Изменения сразу видны на сайте.","Enable ad slots and edit the text. Changes appear on the site immediately."],
  ad_on:["Yoqilgan","Включено","Enabled"],
  ad_title:["Sarlavha","Заголовок","Title"],
  ad_text:["Matn","Текст","Text"],
  ad_url:["Havola (URL)","Ссылка (URL)","Link (URL)"],
  saved:["✓ Saqlandi","✓ Сохранено","✓ Saved"],
  set_theme:["Mavzu","Тема","Theme"],
  set_lang:["Til","Язык","Language"],
  light:["Yorug'","Светлая","Light"],
  dark:["Tungi","Тёмная","Dark"],
  set_note:["Bu demo panel — ma'lumotlar brauzeringizda (localStorage) saqlanadi.","Это демо-панель — данные хранятся в вашем браузере (localStorage).","This is a demo panel — data is stored in your browser (localStorage)."],
  conf_intro:["Konferensiya vaqtini va havolasini belgilang. Foydalanuvchilar konferensiya sahifasida ko'radi.","Укажите время и ссылку конференции. Пользователи увидят это на странице конференции.","Set the conference time and link. Users will see it on the conference page."],
  conf_target:["Kim uchun","Для кого","For whom"],
  conf_global:["🌐 Hammasi (umumiy)","🌐 Все (общая)","🌐 Everyone (global)"],
  conf_for_assoc:["uyushma a'zolari ko'radi","увидят члены ассоциации","the association's members will see it"],
  conf_for_global:["barcha foydalanuvchilar ko'radi","увидят все пользователи","all users will see it"],
  conf_add:["+ Qo'shish","+ Добавить","+ Add"],
  conf_listh:["Rejalashtirilgan uchrashuvlar","Запланированные встречи","Scheduled meetings"],
  conf_added:["✓ Qo'shildi","✓ Добавлено","✓ Added"],
  conf_none_list:["Hozircha uchrashuv yo'q.","Встреч пока нет.","No meetings yet."],
  conf_title:["Sarlavha","Заголовок","Title"],
  conf_title_ph:["Masalan: Investorlar bilan uchrashuv","Например: Встреча с инвесторами","E.g. Meeting with investors"],
  conf_dt:["Sana va vaqt","Дата и время","Date & time"],
  conf_link:["Havola (Zoom / Meet / YouTube)","Ссылка (Zoom / Meet / YouTube)","Link (Zoom / Meet / YouTube)"],
  conf_desc:["Tavsif (ixtiyoriy)","Описание (необязательно)","Description (optional)"],
  conf_save:["Saqlash","Сохранить","Save"],
  conf_clear:["O'chirish","Удалить","Remove"],
  conf_saved:["✓ Saqlandi","✓ Сохранено","✓ Saved"],
  conf_cleared:["Konferensiya o'chirildi","Конференция удалена","Conference removed"],
  conf_none:["Hozircha konferensiya belgilanmagan.","Конференция пока не назначена.","No conference scheduled yet."],
  conf_link_err:["To'g'ri havola kiriting (https://…)","Введите корректную ссылку (https://…)","Enter a valid link (https://…)"],
};
const t = k => AT[k][L()];

/* ---- nav icons ---- */
const NAV = [
  {v:"dashboard", k:"nav_dash", ic:svg('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>')},
  {v:"associations", k:"nav_assoc", ic:svg('<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h.01M12 9h.01M15 9h.01M9 13h.01M12 13h.01M15 13h.01M9 17h.01M15 17h.01"/>')},
  {v:"projects", k:"nav_projects", ic:svg('<path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>')},
  {v:"chat", k:"nav_chat", ic:svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')},
  {v:"questions", k:"nav_quest", ic:svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>')},
  {v:"conference", k:"nav_conf", ic:svg('<path d="M15 10l5-3v10l-5-3z"/><rect x="3" y="6" width="12" height="12" rx="2"/>')},
  {v:"settings", k:"nav_set", ic:svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 6 19.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.4 13H4a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 5.3 6L5.2 6a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 11 4.4V4a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V11a2 2 0 0 1 0 4h-.1z"/>')},
];
const VIEW_TITLE = {dashboard:"nav_dash",associations:"nav_assoc",members:"nav_members",companies:"nav_comp",leads:"nav_leads",questions:"nav_quest",projects:"nav_projects",chat:"nav_chat",report:"nav_report",conference:"nav_conf",settings:"nav_set"};

/* ---- shared org state + API ---- */
let ORGS = { associations:[], companies:[] };
function orgsApi(body){
  return fetch("/api/orgs",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(Object.assign({pass:"admin"},body))}).then(r=>r.json());
}

/* ---- storage helpers ---- */
const store={
  get(k,def){try{const v=JSON.parse(localStorage.getItem(k));return v==null?def:v;}catch(e){return def;}},
  set(k,v){localStorage.setItem(k,JSON.stringify(v));},
};
function seed(){
  if(!localStorage.getItem("kg_companies")) store.set("kg_companies",[
    {name:"UzAuto Motors",sector:"Automotive",status:"on",invest:"$890M"},
    {name:"Artel",sector:"Manufacturing",status:"on",invest:"$340M"},
    {name:"IT Park",sector:"Technology",status:"on",invest:"$210M"},
    {name:"Uzbekinvest",sector:"Finance",status:"on",invest:"$120M"},
  ]);
  if(!localStorage.getItem("kg_leads")) store.set("kg_leads",[
    {name:"Aziz Karimov",company:"GreenTech",email:"aziz@greentech.uz",date:"2026-06-24"},
    {name:"Dilnoza Saidova",company:"AgroExport",email:"d.saidova@agro.uz",date:"2026-06-25"},
    {name:"John Smith",company:"Sequoia Capital",email:"js@sequoia.com",date:"2026-06-26"},
  ]);
}

/* ============================================================
   VIEWS
   ============================================================ */
let activeView="dashboard";

function renderDashboard(){
  const draw=(assocN,compN)=>{
    const all=(ORGS&&ORGS.companies)||[];
    const productN=all.reduce((n,c)=>n+((c.showroom||[]).length),0);
    const withProdN=all.filter(c=>(c.showroom||[]).length>0).length;
    // Real series from the platform's own company records.
    const series=kgMonthlySeries((ORGS&&ORGS.companies)||[]);
    const chart=kgAreaChart(
      series.buckets.map(b=>({label:kgMonthLabel(b.m,LANG), total:b.total, added:b.added})),
      { emptyText:t("flow_empty"),
        ariaLabel:`${t("flow")}: ${series.buckets.map(b=>`${kgMonthLabel(b.m,LANG)} ${b.total}`).join(", ")}` });
    const cards=[
      {l:t("nav_assoc"),v:assocN,s:""},
      {l:t("d_companies"),v:compN,s:""},
      {l:t("d_products"),v:productN,s:""},
      {l:t("d_with"),v:withProdN+" / "+compN,s:""},
    ].map(c=>`<div class="admin-card"><div class="ac-label">${c.l}</div><div class="ac-val">${c.v}</div>${c.s?`<div class="ac-sub">${c.s}</div>`:""}</div>`).join("");
    $("#view-dashboard").innerHTML=`
      <div class="admin-cards">${cards}</div>
      <div class="admin-panel">
        <h2>${t("flow")}</h2>
        <p class="ac-label" style="margin:-8px 0 16px">${t("flow_sub")}${series.undated?` (${t("flow_undated")}${series.undated})`:""}</p>
        ${chart}
      </div>`;
  };
  draw(ORGS.associations.length, ORGS.companies.length);
  orgsApi({op:"list"}).then(r=>{ ORGS=r; draw(ORGS.associations.length, ORGS.companies.length); });
}

function renderCompanies(){
  const list=store.get("kg_companies",[]);
  const rows=list.map((c,i)=>`<tr>
    <td><b>${c.name}</b></td><td>${c.sector}</td>
    <td><span class="badge-st on">${t("on")}</span></td><td>${c.invest||"—"}</td>
    <td><button class="tdel" data-i="${i}">${t("del")}</button></td></tr>`).join("");
  $("#view-companies").innerHTML=`
    <div class="admin-panel">
      <h2>${t("nav_comp")}</h2>
      <table class="admin-table"><thead><tr><th>${t("c_name")}</th><th>${t("c_sector")}</th><th>${t("c_status")}</th><th>${t("c_invest")}</th><th></th></tr></thead><tbody>${rows}</tbody></table>
      <form class="admin-form" id="compForm">
        <input id="cf-name" placeholder="${t("name_ph")}" required>
        <input id="cf-sector" placeholder="${t("sector_ph")}" required>
        <input id="cf-invest" placeholder="${t("invest_ph")}">
        <button class="btn btn-primary" type="submit">${t("add")}</button>
      </form>
    </div>`;
  $("#compForm").addEventListener("submit",e=>{e.preventDefault();
    list.push({name:$("#cf-name").value,sector:$("#cf-sector").value,status:"on",invest:$("#cf-invest").value});
    store.set("kg_companies",list);renderCompanies();});
  $("#view-companies").querySelectorAll(".tdel").forEach(b=>b.addEventListener("click",()=>{
    list.splice(+b.dataset.i,1);store.set("kg_companies",list);renderCompanies();}));
}

function renderLeads(){
  const list=store.get("kg_leads",[]);
  const rows=list.slice().reverse().map((x,ri)=>{const i=list.length-1-ri;return `<tr>
    <td><b>${x.name}</b></td><td>${x.company}</td><td>${x.email}</td><td>${x.date}</td>
    <td><button class="tdel" data-i="${i}">${t("del")}</button></td></tr>`;}).join("");
  $("#view-leads").innerHTML=`
    <div class="admin-panel">
      <h2>${t("nav_leads")}</h2>
      <table class="admin-table"><thead><tr><th>${t("c_name")}</th><th>${t("c_company")}</th><th>${t("c_email")}</th><th>${t("c_date")}</th><th></th></tr></thead><tbody>${rows}</tbody></table>
      <div class="admin-form"><a class="btn btn-ghost" href="/api/problems.doc" target="_blank">⬇ ${t("export_word")}</a></div>
    </div>`;
  $("#view-leads").querySelectorAll(".tdel").forEach(b=>b.addEventListener("click",()=>{
    list.splice(+b.dataset.i,1);store.set("kg_leads",list);renderLeads();}));
}

function escAttr(s){return String(s||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");}

let openAssoc=null;   // when set, the associations view drills into one association's child companies
function renderAssociations(){
  const view=$("#view-associations");
  openAssoc=null;     // entering the view via nav always shows the association list first
  const draw=()=>{ openAssoc ? drawDetail(openAssoc) : drawList(); };

  /* ---- list of associations (each opens its child companies) ---- */
  const drawList=()=>{
    const rows=ORGS.associations.map(a=>{
      const cnt=ORGS.companies.filter(c=>c.assocId===a.id).length;
      return `<tr data-id="${a.id}">
        <td><a href="#" class="as-open" data-id="${a.id}"><b>${escAttr(a.name)}</b></a></td>
        <td><input class="adm-inline" data-f="chairman" value="${escAttr(a.chairman)}" placeholder="${t("as_chair")}"></td>
        <td><input class="adm-inline mono" data-f="login" value="${escAttr(a.login)}" placeholder="login"></td>
        <td><input class="adm-inline mono" data-f="password" value="${escAttr(a.password)}" placeholder="parol"></td>
        <td style="text-align:center"><span class="badge-st on">${cnt}</span></td>
        <td style="white-space:nowrap"><button class="btn btn-ghost as-open" data-id="${a.id}" style="padding:5px 11px;font-size:13px">${t("as_open")}</button> <button class="tdel" data-id="${a.id}">${t("del")}</button></td></tr>`;
    }).join("");
    const rais=ORGS.rais||{login:"",password:""};
    view.innerHTML=`
      <div class="admin-panel" style="margin-bottom:18px">
        <h2>👑 ${t("rais_title")}</h2>
        <p style="color:var(--muted);font-size:14px;margin-bottom:14px">${t("rais_hint")}</p>
        <div class="admin-form" style="grid-template-columns:repeat(2,minmax(0,1fr));max-width:480px">
          <div><div class="ac-label">${t("as_login")}</div><input class="adm-inline mono" id="rais-login" value="${escAttr(rais.login)}"></div>
          <div><div class="ac-label">${t("as_pass")}</div><input class="adm-inline mono" id="rais-pass" value="${escAttr(rais.password)}"></div>
        </div>
        <div style="max-width:480px;margin-top:10px"><div class="ac-label">${t("rais_tg")}</div><input class="adm-inline mono" id="rais-tg" value="${escAttr(rais.tgChat||"")}" placeholder="masalan: 123456789"></div>
      </div>
      <div class="admin-panel">
        <h2>${t("nav_assoc")} (${ORGS.associations.length}) <a class="btn btn-ghost" style="float:right;padding:7px 14px" href="associations.html" target="_blank">${t("as_catalog")}</a></h2>
        <p style="color:var(--muted);font-size:14px;margin-bottom:16px">${t("as_intro")}</p>
        <table class="admin-table"><thead><tr><th>${t("as_name")}</th><th>${t("as_chair")}</th><th>${t("as_login")}</th><th>${t("as_pass")}</th><th style="text-align:center">${t("as_count")}</th><th></th></tr></thead><tbody>${rows}</tbody></table>
        <form class="admin-form" id="asForm">
          <input id="as-name" placeholder="${t("as_addname")}" required>
          <input id="as-chair" placeholder="${t("as_addchair")}">
          <button class="btn btn-primary" type="submit">${t("add")}</button>
        </form>
      </div>`;
    $("#asForm").addEventListener("submit",e=>{e.preventDefault();
      orgsApi({op:"assoc.add",name:$("#as-name").value.trim(),chairman:$("#as-chair").value.trim()})
        .then(r=>{ORGS=r;draw();});});
    view.querySelectorAll(".tdel").forEach(b=>b.addEventListener("click",()=>{
      orgsApi({op:"assoc.del",id:b.dataset.id}).then(r=>{ORGS=r;draw();});}));
    view.querySelectorAll("tr .adm-inline").forEach(inp=>inp.addEventListener("change",()=>{
      const id=inp.closest("tr").dataset.id;
      orgsApi({op:"assoc.update",id,[inp.dataset.f]:inp.value}).then(r=>{ORGS=r;});}));
    view.querySelectorAll(".as-open").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();openAssoc=b.dataset.id;draw();}));
    const saveRais=()=>orgsApi({op:"rais.set",login:$("#rais-login").value.trim(),password:$("#rais-pass").value,tgChat:$("#rais-tg").value.trim()}).then(r=>{ORGS=r;});
    $("#rais-login").addEventListener("change",saveRais);
    $("#rais-pass").addEventListener("change",saveRais);
    $("#rais-tg").addEventListener("change",saveRais);
  };

  /* ---- one association → its child (subsidiary) companies ---- */
  const drawDetail=(id)=>{
    const a=ORGS.associations.find(x=>x.id===id);
    if(!a){ openAssoc=null; drawList(); return; }
    const comps=ORGS.companies.filter(c=>c.assocId===id);
    const rows=comps.slice().reverse().map(c=>`<tr data-id="${c.id}">
      <td><input class="adm-inline" data-cf="name" value="${escAttr(c.name)}"></td>
      <td><input class="adm-inline" data-cf="sector" value="${escAttr(c.sector)}" placeholder="${t("mb_sector")}"></td>
      <td><code>${escAttr(c.login)}</code></td>
      <td><input class="adm-inline mono" data-cf="password" value="${escAttr(c.password)}"></td>
      <td><button class="tdel" data-id="${c.id}">${t("del")}</button></td></tr>`).join("")
      || `<tr><td colspan="5" class="ac-label">${t("as_empty_c")}</td></tr>`;
    view.innerHTML=`
      <button class="btn btn-ghost" id="asBack" style="margin-bottom:14px">${t("as_back")}</button>
      <div class="admin-panel" style="margin-bottom:18px">
        <h2>🏛️ ${escAttr(a.name)}</h2>
        <div class="admin-form" style="grid-template-columns:repeat(3,minmax(0,1fr));max-width:680px">
          <div><div class="ac-label">${t("as_chair")}</div><input class="adm-inline" id="ad-chair" value="${escAttr(a.chairman)}"></div>
          <div><div class="ac-label">${t("as_login")}</div><input class="adm-inline mono" id="ad-login" value="${escAttr(a.login)}"></div>
          <div><div class="ac-label">${t("as_pass")}</div><input class="adm-inline mono" id="ad-pass" value="${escAttr(a.password)}"></div>
        </div>
      </div>
      <div class="admin-panel">
        <h2>${t("as_children")} (${comps.length})</h2>
        <p style="color:var(--muted);font-size:14px;margin-bottom:14px">${t("mb_intro")}</p>
        <table class="admin-table"><thead><tr><th>${t("mb_name")}</th><th>${t("mb_sector")}</th><th>${t("mb_login")}</th><th>${t("mb_pass")}</th><th></th></tr></thead><tbody>${rows}</tbody></table>
        <div class="err" id="cErr" style="margin-top:10px"></div>
        <form class="admin-form mb-form" id="cForm">
          <input id="c-name" placeholder="${t("mb_addname")}" required>
          <input id="c-sector" placeholder="${t("mb_sector")}">
          <input id="c-login" placeholder="${t("mb_login")}" required>
          <input id="c-pass" placeholder="${t("mb_pass")}" required>
          <button class="btn btn-primary" type="submit">${t("add")}</button>
        </form>
      </div>`;
    $("#asBack").addEventListener("click",()=>{openAssoc=null;draw();});
    const saveA=(f,v)=>orgsApi({op:"assoc.update",id,[f]:v}).then(r=>{ORGS=r;});
    $("#ad-chair").addEventListener("change",e=>saveA("chairman",e.target.value));
    $("#ad-login").addEventListener("change",e=>saveA("login",e.target.value));
    $("#ad-pass").addEventListener("change",e=>saveA("password",e.target.value));
    $("#cForm").addEventListener("submit",e=>{e.preventDefault();
      const login=$("#c-login").value.trim(), pass=$("#c-pass").value;
      if(!login||!pass){$("#cErr").textContent=t("mb_need");return;}
      orgsApi({op:"company.add",name:$("#c-name").value.trim(),assocId:id,sector:$("#c-sector").value.trim(),login,password:pass}).then(r=>{
        if(r.error){$("#cErr").textContent=r.error==="login exists"?t("mb_login_taken"):t("mb_need");return;}
        ORGS=r;drawDetail(id);});});
    view.querySelectorAll("tr[data-id] .adm-inline[data-cf]").forEach(inp=>inp.addEventListener("change",()=>{
      const cid=inp.closest("tr").dataset.id;
      orgsApi({op:"company.update",id:cid,[inp.dataset.cf]:inp.value}).then(r=>{ORGS=r;});}));
    view.querySelectorAll(".tdel").forEach(b=>b.addEventListener("click",()=>{
      orgsApi({op:"company.del",id:b.dataset.id}).then(r=>{ORGS=r;drawDetail(id);});}));
  };

  orgsApi({op:"list"}).then(r=>{ORGS=r;draw();});
}

function renderMembers(){
  const view=$("#view-members");
  let filter="all";
  const draw=()=>{
    const opts=`<option value="all">${t("mb_all")}</option>`+ORGS.associations.map(a=>`<option value="${a.id}" ${a.id===filter?"selected":""}>${escAttr(a.name)}</option>`).join("");
    const list=ORGS.companies.filter(c=>filter==="all"||c.assocId===filter);
    const aname=id=>{const a=ORGS.associations.find(x=>x.id===id);return a?a.name:"—";};
    const rows=list.slice().reverse().map(c=>`<tr>
      <td><b>${escAttr(c.name)}</b></td>
      <td>${escAttr(aname(c.assocId))}</td>
      <td>${escAttr(c.sector)||"—"}</td>
      <td><code>${escAttr(c.login)}</code></td>
      <td><code>${escAttr(c.password)}</code></td>
      <td><button class="tdel" data-id="${c.id}">${t("del")}</button></td></tr>`).join("");
    const addOpts=ORGS.associations.map(a=>`<option value="${a.id}">${escAttr(a.name)}</option>`).join("");
    view.innerHTML=`
      <div class="admin-panel">
        <h2>${t("nav_members")} (${ORGS.companies.length})</h2>
        <p style="color:var(--muted);font-size:14px;margin-bottom:14px">${t("mb_intro")}</p>
        <div style="margin-bottom:14px"><select class="adm-search" id="mbFilter" style="max-width:340px">${opts}</select></div>
        <table class="admin-table"><thead><tr><th>${t("mb_name")}</th><th>${t("mb_assoc")}</th><th>${t("mb_sector")}</th><th>${t("mb_login")}</th><th>${t("mb_pass")}</th><th></th></tr></thead><tbody>${rows}</tbody></table>
        <div class="err" id="mbErr" style="margin-top:10px"></div>
        <form class="admin-form mb-form" id="mbForm">
          <input id="mb-name" placeholder="${t("mb_addname")}" required>
          <select id="mb-assoc" required>${addOpts}</select>
          <input id="mb-sector" placeholder="${t("mb_sector")}">
          <input id="mb-login" placeholder="${t("mb_login")}" required>
          <input id="mb-pass" placeholder="${t("mb_pass")}" required>
          <button class="btn btn-primary" type="submit">${t("add")}</button>
        </form>
      </div>`;
    $("#mbFilter").addEventListener("change",e=>{filter=e.target.value;draw();});
    $("#mbForm").addEventListener("submit",e=>{e.preventDefault();
      const login=$("#mb-login").value.trim(), pass=$("#mb-pass").value;
      if(!login||!pass){$("#mbErr").textContent=t("mb_need");return;}
      orgsApi({op:"company.add",name:$("#mb-name").value.trim(),assocId:$("#mb-assoc").value,
        sector:$("#mb-sector").value.trim(),login,password:pass}).then(r=>{
        if(r.error){$("#mbErr").textContent=r.error==="login exists"?t("mb_login_taken"):t("mb_need");return;}
        ORGS=r;draw();});});
    view.querySelectorAll(".tdel").forEach(b=>b.addEventListener("click",()=>{
      orgsApi({op:"company.del",id:b.dataset.id}).then(r=>{ORGS=r;draw();});}));
  };
  orgsApi({op:"list"}).then(r=>{ORGS=r;draw();});
}

/* ---- questions report + official letters (merged from rais panel) ---- */
let CUR_YM="";
function raisApi(path,body){
  return fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.assign({pass:"admin"},body))}).then(r=>r.json());
}
function renderQuestions(){
  const view=$("#view-questions");
  view.innerHTML=`<div class="admin-panel">
    <h2>${t("nav_quest")} <select class="adm-search mono" id="qMonth" style="float:right;max-width:160px"></select></h2>
    <p style="color:var(--muted);font-size:14px;margin-bottom:16px">${t("q_sub")}</p>
    <h3 style="font-size:15px;margin:6px 0 4px">${t("q_assocs")}</h3>
    <p style="color:var(--muted);font-size:13px;margin-bottom:10px">${t("q_assocs_sub")}</p>
    <div id="qAssocs" style="margin-bottom:22px"></div>
    <h3 style="font-size:15px;margin:6px 0 10px">${t("q_questionsh")}</h3>
    <div id="qReport"></div>
  </div>`;
  $("#qMonth").addEventListener("change",e=>loadQ(e.target.value));
  loadQ();
}
function loadQ(ym){
  raisApi("/api/rais/questions",{ym}).then(j=>{
    if(j.error) return;
    CUR_YM=j.ym;
    const sel=$("#qMonth"); sel.innerHTML=(j.months||[]).map(m=>`<option value="${m}" ${m===j.ym?"selected":""}>${m}</option>`).join("")||`<option>—</option>`;
    const assocs=j.assocs||[];
    $("#qAssocs").innerHTML=assocs.length?assocs.map((a,i)=>`
      <div class="quser-row">
        <button type="button" class="quser-name qassoc-toggle" data-i="${i}" style="background:none;border:0;font:inherit;color:inherit;cursor:pointer;display:flex;align-items:center;gap:8px;text-align:left;padding:0">
          <span class="qassoc-caret" data-i="${i}" style="display:inline-block;transition:transform .15s;font-size:11px;color:var(--muted)">▶</span>
          🏛 ${escAttr(a.name)}
        </button>
        <span class="quser-count">${a.count} ${t("q_reqs")} · ${a.companies} ${t("q_comps")}</span>
        <button class="btn btn-primary qassoc-letter" data-i="${i}" style="padding:6px 12px;font-size:13px">${t("q_assoc_letter")}</button>
      </div>
      <div class="qassoc-detail" id="qassoc-detail-${i}" hidden style="margin:-8px 0 14px;padding:10px 14px;background:var(--bg-soft);border:1px solid var(--line);border-radius:10px">
        <table class="admin-table"><thead><tr><th>${t("q_question")}</th><th style="text-align:center">${t("q_count")}</th><th>${t("q_who")}</th></tr></thead><tbody>${
          (a.questions||[]).map(q=>`<tr class="${q.count>1?"q-rep":""}"><td>${escAttr(q.question)}${q.count>1?` <span class="q-badge">${t("q_repeat")}</span>`:""}</td><td style="text-align:center"><b>${q.count}</b></td><td>${(q.companies||[]).map(escAttr).join(", ")||"—"}</td></tr>`).join("")
          || `<tr><td colspan="3" class="ac-label">${t("q_empty")}</td></tr>`
        }</tbody></table>
      </div>`).join(""):`<p class="ac-label">${t("q_empty")}</p>`;
    $("#qAssocs").querySelectorAll(".qassoc-letter").forEach(btn=>btn.addEventListener("click",()=>makeAssocLetter(assocs[+btn.dataset.i],btn)));
    $("#qAssocs").querySelectorAll(".qassoc-toggle").forEach(btn=>btn.addEventListener("click",()=>{
      const i=btn.dataset.i, det=$("#qassoc-detail-"+i), caret=btn.querySelector(".qassoc-caret");
      det.hidden=!det.hidden;
      if(caret) caret.style.transform=det.hidden?"":"rotate(90deg)";
    }));
    const rep=j.report||[];
    $("#qReport").innerHTML=rep.length
      ? `<table class="admin-table"><thead><tr><th>${t("q_question")}</th><th style="text-align:center">${t("q_count")}</th><th>${t("q_who")}</th></tr></thead><tbody>`
        + rep.map(q=>{const who=(q.companies&&q.companies.length?q.companies:q.askers||[]).map(escAttr).join(", ");
          return `<tr class="${q.repeated?"q-rep":""}"><td>${escAttr(q.question)}${q.repeated?` <span class="q-badge">${t("q_repeat")}</span>`:""}</td><td style="text-align:center"><b>${q.count}</b></td><td>${who||"—"}</td></tr>`;}).join("")
        + `</tbody></table>`
      : `<p class="ac-label">${t("q_empty")}</p>`;
  });
}
let CUR_LETTER=null;   // letter currently shown in the modal (for download)
async function makeLetter(user,btn){
  const old=btn.textContent; btn.textContent=t("q_gen"); btn.disabled=true;
  const j=await raisApi("/api/rais/letter",{type:user.type,key:user.key,ym:CUR_YM,lang:LANG});
  if(j.ok) openLetter(j.letter);
  btn.textContent=old; btn.disabled=false;
}
// one combined letter for a whole association (all member companies' questions merged)
async function makeAssocLetter(assoc,btn){
  const old=btn.textContent; btn.textContent=t("q_gen"); btn.disabled=true;
  const j=await raisApi("/api/rais/assoc-letter",{assocId:assoc.id,ym:CUR_YM,lang:LANG});
  if(j.ok) openLetter(j.letter); else alert(t("q_empty"));
  btn.textContent=old; btn.disabled=false;
}
// Download the currently shown official letter as a Word (.doc) file (client-side).
function downloadLetter(){
  const ltr=CUR_LETTER; if(!ltr) return;
  const esc=s=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const recipient=ltr.recipientLabel||"";
  const html="<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' "+
    "xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head>"+
    "<body><p style=\"font-family:Georgia,serif;white-space:pre-wrap;line-height:1.7;font-size:13pt\">"+
    esc(ltr.body)+"</p></body></html>";
  const blob=new Blob(["﻿"+html],{type:"application/msword"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  const name="tijorat-markazi-xat-"+(recipient.toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,40)||"rasmiy")+".doc";
  a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function openLetter(ltr){
  $("#ltrTo").textContent=t("ltr_to")+": "+ltr.recipientLabel+(ltr.recipientType==="company"?" 🏢":"");
  $("#ltrBody").textContent=ltr.body;
  $("#ltrCopy").textContent=t("ltr_copy"); $("#ltrDl").textContent=t("ltr_dl"); $("#ltrPrint").textContent=t("ltr_print");
  CUR_LETTER=ltr;
  $("#letterModal").hidden=false;
}

/* ---- startup/invest projects oversight ---- */
function renderProjects(){
  const view=$("#view-projects");
  view.innerHTML=`<div class="admin-panel"><h2>${t("nav_projects")}</h2>
    <p style="color:var(--muted);font-size:14px;margin-bottom:16px">${t("pr_intro")}</p>
    <div id="prList"><p class="ac-label">…</p></div></div>`;
  raisApi("/api/admin/projects",{}).then(j=>{
    const ps=j.projects||[];
    $("#prList").innerHTML=ps.length
      ? `<table class="admin-table"><thead><tr><th>${t("pr_company")}</th><th>${t("pr_proj")}</th><th>${t("pr_amount")}</th><th>${t("pr_status")}</th><th>${t("pr_assoc")}</th></tr></thead><tbody>`
        + ps.map(p=>`<tr><td><b>${escAttr(p.company)}</b></td><td>${escAttr(p.title)}${p.body?`<br><span style="color:var(--muted);font-size:12.5px">${escAttr(p.body)}</span>`:""}</td><td>${escAttr(p.amount)||"—"}</td><td>${escAttr(p.status)||"—"}</td><td>${escAttr(p.assoc)||"—"}</td></tr>`).join("")
        + `</tbody></table>`
      : `<p class="ac-label">${t("pr_empty")}</p>`;
  });
}

/* ---- project chat (company ↔ admin) ---- */
function renderProjectChat(){
  const view=$("#view-chat");
  const drawList=()=>{
    raisApi("/api/admin/chats",{}).then(j=>{
      const chats=j.chats||[];
      view.innerHTML=`<div class="admin-panel"><h2>${t("nav_chat")}</h2>
        <p style="color:var(--muted);font-size:14px;margin-bottom:16px">${t("ch_intro")}</p>`
        + (chats.length?`<div class="chat-threads">`+chats.map(c=>`
            <button class="chat-thread" data-id="${c.companyId}" data-name="${escAttr(c.name)}">
              <b>${escAttr(c.name)}</b><span>${escAttr(c.lastFrom==="admin"?"↩ ":"")}${escAttr(c.last).slice(0,70)}</span><em>${c.count}</em>
            </button>`).join("")+`</div>`:`<p class="ac-label">${t("ch_empty")}</p>`)
        + `</div>`;
      view.querySelectorAll(".chat-thread").forEach(b=>b.addEventListener("click",()=>drawThread(b.dataset.id,b.dataset.name)));
    });
  };
  const drawThread=(cid,name)=>{
    raisApi("/api/admin/chats",{op:"thread",companyId:cid}).then(j=>renderThreadUI(cid,name,j.messages||[]));
  };
  const renderThreadUI=(cid,name,msgs)=>{
    view.innerHTML=`<button class="btn btn-ghost" id="chBack" style="margin-bottom:14px">${t("ch_back")}</button>
      <div class="admin-panel"><h2>💬 ${escAttr(name)}</h2>
        <div class="pchat-box" id="chBox">${msgs.length?msgs.map(m=>`<div class="pchat-msg ${m.from}"><span>${escAttr(m.text)}</span></div>`).join(""):`<p class="ac-label">${t("ch_empty")}</p>`}</div>
        <form class="admin-form" id="chForm" style="margin-top:12px;grid-template-columns:1fr auto">
          <input id="ch-text" placeholder="${t("ch_ph")}" required autocomplete="off"><button class="btn btn-primary" type="submit">${t("ch_send")}</button>
        </form>
      </div>`;
    $("#chBack").addEventListener("click",drawList);
    const box=$("#chBox"); box.scrollTop=box.scrollHeight;
    $("#chForm").addEventListener("submit",e=>{e.preventDefault();
      const txt=$("#ch-text").value.trim(); if(!txt)return;
      raisApi("/api/admin/chats",{op:"send",companyId:cid,text:txt}).then(j=>renderThreadUI(cid,name,j.messages||[]));});
  };
  drawList();
}

function renderReport(){
  const view=$("#view-report");
  const now=new Date();
  const curYm=now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");
  view.innerHTML=`
    <div class="admin-panel">
      <h2>${t("nav_report")}</h2>
      <p style="color:var(--muted);font-size:14px;margin-bottom:16px">${t("rep_intro")}</p>
      <div class="admin-form" style="align-items:end">
        <div><div class="ac-label">${t("rep_month")}</div><input type="month" id="repMonth" value="${curYm}" style="padding:10px 12px;border:1px solid var(--line-2);border-radius:8px;background:var(--bg-soft);color:var(--ink);font-family:inherit"></div>
        <a class="btn btn-primary" id="repDl" href="/api/monthly.doc?ym=${curYm}" target="_blank">⬇ ${t("rep_download")}</a>
      </div>
      <div id="repPreview" style="margin-top:18px"></div>
    </div>`;
  const load=(ym)=>{
    $("#repDl").href="/api/monthly.doc?ym="+ym;
    fetch("/api/monthly?ym="+ym).then(r=>r.json()).then(d=>{
      const head=`<th>#</th><th>${t("rep_org")}</th><th>${t("rep_chair")}</th><th style="text-align:center">${t("rep_comp")}</th><th style="text-align:center">${t("rep_prod")}</th><th style="text-align:center">${t("rep_inv")}</th><th style="text-align:center">${t("rep_news")}</th><th style="text-align:center">R&D</th><th style="text-align:center">${t("rep_q")}</th>`;
      const rows=d.rows.map(r=>`<tr><td>${r.n}</td><td><b>${r.name}</b></td><td>${r.chairman}</td><td style="text-align:center">${r.companies}</td><td style="text-align:center">${r.products}</td><td style="text-align:center">${r.invest}</td><td style="text-align:center">${r.news}</td><td style="text-align:center">${r.rnd}</td><td style="text-align:center">${r.questions}</td></tr>`).join("");
      const tt=d.totals;
      const totalRow=`<tr style="font-weight:700;background:var(--bg-soft-2)"><td></td><td>${t("rep_total")}</td><td></td><td style="text-align:center">${tt.companies}</td><td style="text-align:center">${tt.products}</td><td style="text-align:center">${tt.invest}</td><td style="text-align:center">${tt.news}</td><td style="text-align:center">${tt.rnd}</td><td style="text-align:center">${tt.questions}</td></tr>`;
      $("#repPreview").innerHTML=`<p class="ac-label" style="margin-bottom:10px">${t("rep_orgs")}: <b>${d.organizations}</b></p><div style="overflow:auto"><table class="admin-table" style="font-size:13px">${"<thead><tr>"+head+"</tr></thead>"}<tbody>${rows}${totalRow}</tbody></table></div>`;
    }).catch(()=>{});
  };
  $("#repMonth").addEventListener("change",e=>load(e.target.value));
  load(curYm);
}

function renderConference(){
  const view=$("#view-conference");
  const build=()=>{
    const opts=`<option value="">${t("conf_global")}</option>`+ORGS.associations.map(a=>`<option value="${a.id}">${escAttr(a.name)}</option>`).join("");
    view.innerHTML=`
      <div class="admin-panel">
        <h2>${t("nav_conf")}</h2>
        <p style="color:var(--muted);font-size:14px;margin-bottom:16px">${t("conf_intro")}</p>
        <div style="max-width:520px;margin-bottom:18px">
          <div class="ac-label">${t("conf_target")}</div>
          <select id="conf-target" class="adm-search" style="width:100%;margin-bottom:6px">${opts}</select>
          <span class="ac-sub" id="confScope">${t("conf_for_global")}</span>
        </div>
        <form class="admin-form" id="confForm" style="align-items:flex-end">
          <div><div class="ac-label">${t("conf_title")}</div>
            <input id="conf-title" placeholder="${t("conf_title_ph")}" required></div>
          <div><div class="ac-label">${t("conf_dt")}</div>
            <input id="conf-dt" type="datetime-local" required></div>
          <div><div class="ac-label">${t("conf_link")}</div>
            <input id="conf-link" type="url" placeholder="https://meet.google.com/…" required></div>
          <div><div class="ac-label">${t("conf_desc")}</div>
            <input id="conf-desc" placeholder="…"></div>
          <button class="btn btn-primary" type="submit">${t("conf_add")}</button>
          <span class="ac-sub" id="confMsg" style="opacity:0"></span>
        </form>
        <h3 style="font-size:15px;margin:24px 0 10px">${t("conf_listh")}</h3>
        <div id="confList"></div>
      </div>`;
    const msg=(text,ok=true)=>{const m=$("#confMsg");m.textContent=text;m.style.color=ok?"var(--green)":"var(--gold)";m.style.opacity=1;clearTimeout(window._cmt);window._cmt=setTimeout(()=>m.style.opacity=0,2200);};
    const targetId=()=>$("#conf-target").value;
    const paint=(meetings)=>{
      const box=$("#confList"); if(!box) return;
      box.innerHTML=(meetings&&meetings.length)
        ? meetings.map(m=>`<div class="conf-row"><div class="conf-row-main"><b>${escAttr(m.title)}</b><span>${escAttr(confDT(m.datetime))}${m.desc?" · "+escAttr(m.desc):""}</span>${m.link?`<a href="${escAttr(m.link)}" target="_blank" rel="noopener">${escAttr(m.link)}</a>`:""}</div><button class="tdel" data-id="${m.id}">${t("del")}</button></div>`).join("")
        : `<p class="ac-label">${t("conf_none_list")}</p>`;
      box.querySelectorAll(".tdel").forEach(b=>b.addEventListener("click",()=>{
        fetch("/api/conference",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({pass:"admin",assocId:targetId(),removeId:b.dataset.id})}).then(r=>r.json()).then(j=>paint(j.meetings));}));
    };
    const loadTarget=()=>{
      const id=targetId();
      $("#confScope").textContent = id ? t("conf_for_assoc") : t("conf_for_global");
      fetch("/api/conference?manage=1&assoc="+encodeURIComponent(id)).then(r=>r.json()).then(j=>paint(j.meetings)).catch(()=>{});
    };
    $("#conf-target").addEventListener("change",loadTarget);
    loadTarget();
    $("#confForm").addEventListener("submit",e=>{e.preventDefault();
      const link=$("#conf-link").value.trim();
      if(!/^https?:\/\/.+/i.test(link)){msg(t("conf_link_err"),false);return;}
      fetch("/api/conference",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({pass:"admin",assocId:targetId(),title:$("#conf-title").value.trim(),datetime:$("#conf-dt").value,link,desc:$("#conf-desc").value.trim()})})
        .then(r=>r.json()).then(j=>{ paint(j.meetings); $("#confForm").reset(); msg(t("conf_added")); }).catch(()=>msg("Error",false));
    });
  };
  if(ORGS.associations.length) build();
  orgsApi({op:"list"}).then(r=>{ ORGS=r; build(); });
}
function confDT(s){const d=new Date(s);if(isNaN(d))return s||"";return d.toLocaleString();}

function renderSettings(){
  const theme=document.documentElement.dataset.theme||"light";
  $("#view-settings").innerHTML=`
    <div class="admin-panel">
      <h2>${t("nav_set")}</h2>
      <div class="admin-form">
        <div><div class="ac-label">${t("set_theme")}</div>
          <div style="display:flex;gap:8px;margin-top:8px">
            <button class="btn ${theme==='light'?'btn-primary':'btn-ghost'}" id="thLight">${t("light")}</button>
            <button class="btn ${theme==='dark'?'btn-primary':'btn-ghost'}" id="thDark">${t("dark")}</button>
          </div></div>
        <div><div class="ac-label">${t("set_lang")}</div>
          <div style="display:flex;gap:8px;margin-top:8px">
            ${LANGS.map(l=>`<button class="btn ${LANG===l?'btn-primary':'btn-ghost'}" data-l="${l}">${l.toUpperCase()}</button>`).join("")}
          </div></div>
      </div>
      <p class="ac-label" style="margin-top:20px">${t("set_note")}</p>
    </div>`;
  $("#thLight").addEventListener("click",()=>{setTheme("light");renderSettings();});
  $("#thDark").addEventListener("click",()=>{setTheme("dark");renderSettings();});
  $("#view-settings").querySelectorAll("[data-l]").forEach(b=>b.addEventListener("click",()=>setLang(b.dataset.l)));
}

function renderView(){
  ["dashboard","associations","members","companies","leads","questions","projects","chat","report","conference","settings"].forEach(v=>$("#view-"+v)&&$("#view-"+v).classList.toggle("active",v===activeView));
  if(activeView==="dashboard")renderDashboard();
  if(activeView==="associations")renderAssociations();
  if(activeView==="members")renderMembers();
  if(activeView==="companies")renderCompanies();
  if(activeView==="leads")renderLeads();
  if(activeView==="questions")renderQuestions();
  if(activeView==="projects")renderProjects();
  if(activeView==="chat")renderProjectChat();
  if(activeView==="report")renderReport();
  if(activeView==="conference")renderConference();
  if(activeView==="settings")renderSettings();
  $("#viewTitle").textContent=t(VIEW_TITLE[activeView]);
}

/* ---- nav build ---- */
function buildNav(){
  const nav=$("#adminNav");nav.innerHTML="";
  NAV.forEach(n=>{
    const b=document.createElement("button");b.className=(n.v===activeView?"active":"");
    b.innerHTML=n.ic+`<span>${t(n.k)}</span>`;
    b.addEventListener("click",()=>{activeView=n.v;buildNav();renderView();});
    nav.appendChild(b);
  });
}

/* ---- language + theme ---- */
function applyChrome(){
  $("#langBtn").textContent=LANG.toUpperCase();
  $("#logoutBtn").textContent=t("logout");
  $("#backSite").textContent=t("back");
  $("#lgTitle").textContent=t("lg_title");$("#lgSub").textContent=t("lg_sub");
  $("#lgBtn").textContent=t("lg_btn");$("#lgHint").textContent=t("lg_hint");
  document.documentElement.lang=LANG;
}
function setLang(lang){LANG=lang;localStorage.setItem("kg_lang",lang);applyChrome();buildNav();renderView();}
$("#langBtn").addEventListener("click",()=>setLang(LANGS[(L()+1)%LANGS.length]));

const themeBtn=$("#themeBtn");
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("kg_theme",theme);themeBtn.innerHTML=theme==="dark"?ICON_SUN:ICON_MOON;}
themeBtn.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));

/* ---- auth ---- */
function openPanel(){$("#adminLogin").style.display="none";$("#adminShell").hidden=false;buildNav();renderView();}
$("#loginForm").addEventListener("submit",e=>{e.preventDefault();
  if($("#lgPass").value==="admin"){sessionStorage.setItem("kg_admin","1");openPanel();}
  else{$("#lgErr").textContent=t("lg_err");}});
$("#logoutBtn").addEventListener("click",()=>{sessionStorage.removeItem("kg_admin");location.reload();});

/* ---- official letter modal ---- */
$("#ltrClose").addEventListener("click",()=>$("#letterModal").hidden=true);
$("#letterModal").addEventListener("click",e=>{ if(e.target.id==="letterModal") $("#letterModal").hidden=true; });
$("#ltrCopy").addEventListener("click",()=>{ const x=$("#ltrBody").textContent; if(navigator.clipboard)navigator.clipboard.writeText(x); $("#ltrCopy").textContent=t("ltr_copied"); setTimeout(()=>$("#ltrCopy").textContent=t("ltr_copy"),1500); });
$("#ltrDl").addEventListener("click",downloadLetter);
$("#ltrPrint").addEventListener("click",()=>{ const w=window.open("","_blank"); if(w){ w.document.write("<pre style='font-family:Georgia,serif;white-space:pre-wrap;padding:40px;line-height:1.6'>"+$("#ltrBody").textContent.replace(/</g,"&lt;")+"</pre>"); w.document.close(); w.print(); } });

/* ---- init ---- */
seed();
setTheme(localStorage.getItem("kg_theme")||"light");
applyChrome();
if(sessionStorage.getItem("kg_admin")==="1") openPanel();
