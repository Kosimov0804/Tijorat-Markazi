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
/** An association's name in the active language. */
const aName = a => (a && a.i18n && a.i18n[LANG]) || (a && a.name) || "";
const MN={uz:["yan","fev","mar","apr","may","iyn","iyl","avg","sen","okt","noy","dek"],ru:["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"],en:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]};
const MNF={uz:["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"],ru:["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],en:["January","February","March","April","May","June","July","August","September","October","November","December"]};
function fmtDateTime(s){const d=new Date(s);if(isNaN(d))return s||"";return `${d.getDate()} ${MNF[LANG][d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;}

/* ---- translations ---- */
const AT = {
  nav_bizid:["Business ID","Business ID","Business ID"],
  lg_title:["Super Admin paneli","Панель супер-админа","Super Admin panel"],
  lg_sub:["Login va parol bilan kiring (admin bergan).","Войдите по логину и паролю (выданы админом).","Sign in with the login/password issued by the admin."],
  lg_btn:["Kirish →","Войти →","Sign in →"],
  err:["Login yoki parol noto'g'ri","Неверный логин или пароль","Wrong login or password"],
  brand_fallback:["Uyushma","Ассоциация","Association"],
  nav_regs:["Arizalar","Заявки","Applications"],
  rq_title:["Ro‘yxatdan o‘tish arizalari","Заявки на регистрацию","Registration applications"],
  rq_sub:["Uyushmangizga qo‘shilmoqchi bo‘lgan korxonalar. Tasdiqlasangiz — kabinet ochiladi.","Компании, желающие вступить в вашу ассоциацию. После одобрения открывается кабинет.","Companies applying to join your association. Approving one opens its cabinet."],
  rq_pending:["Kutilmoqda","В ожидании","Pending"],
  rq_approved:["Tasdiqlangan","Одобрена","Approved"],
  rq_rejected:["Rad etilgan","Отклонена","Rejected"],
  rq_all:["Barchasi","Все","All"],
  rq_empty:["Bu bo‘limda ariza yo‘q.","В этом разделе заявок нет.","No applications here."],
  rq_approve:["Tasdiqlash","Одобрить","Approve"],
  rq_reject:["Rad etish","Отклонить","Reject"],
  rq_reason_q:["Rad etish sababi (ariza egasiga ko‘rinadi):","Причина отказа (её увидит заявитель):","Reason for rejection (the applicant will see it):"],
  rq_reason:["Sabab","Причина","Reason"],
  rq_confirm:["Tasdiqlansinmi? Korxona kabineti darhol ochiladi.","Одобрить? Кабинет компании откроется сразу.","Approve? The company cabinet opens immediately."],
  rq_fail:["Amalni bajarib bo‘lmadi.","Не удалось выполнить.","Could not complete that."],
  rq_login:["Login","Логин","Login"],
  rq_contact:["Mas‘ul","Контакт","Contact"],
  rq_sector:["Soha","Отрасль","Sector"],
  rq_region:["Hudud","Регион","Region"],
  rq_tin:["STIR","ИНН","Tax no."],
  rq_sent:["Yuborilgan","Отправлена","Sent"],
  logout:["Chiqish","Выход","Logout"],
  back:["← Saytga qaytish","← Вернуться на сайт","← Back to site"],
  nav_dash:["Dashboard","Дашборд","Dashboard"],
  nav_comp:["Kompaniyalar","Компании","Companies"],
  nav_quest:["Murojaatlar","Обращения","Appeals"],
  nav_news:["Yangiliklar","Новости","News"],
  nav_report:["Oylik hisobot","Месячный отчёт","Monthly report"],
  nav_groups:["Guruh chat","Групповой чат","Group chat"],
  nav_conf:["Onlayn uchrashuv","Онлайн-встреча","Online meeting"],
  nav_appeals:["Hukumatga murojaat","Обращения в правительство","Government appeals"],
  ap_intro:["A'zo kompaniyalaringizning hukumatga murojaatlari. Qo'llab-quvvatlasangiz, rais davlat organiga yuboradi.","Обращения ваших компаний в правительство. Если поддержите — раис направит в госорган.","Your member companies' appeals to the government. Support one and the rais forwards it to the agency."],
  ap_empty:["Hozircha murojaat yo'q.","Обращений пока нет.","No appeals yet."],
  ap_support:["Qo'llab-quvvatlash","Поддержать","Support"],
  ap_reject:["Rad etish","Отклонить","Reject"],
  ap_note:["Izoh (ixtiyoriy)","Комментарий (необязательно)","Note (optional)"],
  ap_doc:["📄 Word","📄 Word","📄 Word"],
  ap_company:["Kompaniya","Компания","Company"],
  ap_s_new:["Ko'rib chiqilmoqda","На рассмотрении","Under review"],
  ap_s_assoc:["Qo'llab-quvvatlandi","Поддержано","Supported"],
  ap_s_sent:["Davlat organiga yuborildi","Отправлено в госорган","Sent to the agency"],
  ap_s_answered:["Javob olindi","Получен ответ","Answer received"],
  ap_s_rejected:["Rad etildi","Отклонено","Rejected"],
  news_intro:["Platforma va uyushmangiz sohasi bo'yicha yangiliklar — manbalari bilan.","Новости платформы и сферы вашей ассоциации — со ссылками на источники.","News for the platform and your association's sphere — with sources."],
  news_loading:["⏳ Yangiliklar yuklanmoqda…","⏳ Загрузка новостей…","⏳ Loading news…"],
  news_empty:["Yangiliklar yo'q.","Новостей нет.","No news yet."],
  news_tier_global:["Platforma","Платформа","Platform"],
  news_src:["Manba","Источник","Source"],
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
  nav_legal:["Ma'lumotlarim va huquqlarim","Мои данные и права","My data and rights"],
  /* The panel used to print the member's password here. It cannot any more:
     nothing stores a readable one. These carry the replacement action. */
  pw_hidden:["Ko'rsatilmaydi","Не показывается","Not shown"],
  pw_reset:["Parolni tiklash","Сбросить пароль","Reset password"],
  pw_confirm:["Yangi parol yaratilsinmi? Eski parol ishlamay qoladi va yangisi faqat bir marta ko'rsatiladi.","Создать новый пароль? Старый перестанет работать, а новый будет показан только один раз.","Create a new password? The old one stops working and the new one is shown only once."],
  pw_once:["Yangi parol — nusxa oling, u boshqa ko'rsatilmaydi:","Новый пароль — скопируйте, он больше не покажется:","New password — copy it, it will not be shown again:"],
  pw_why:["Parollar qaytarilmas shaklda saqlanadi (ZRU-547, 27-modda), shuning uchun ularni ko'rib bo'lmaydi — faqat yangisini berish mumkin.","Пароли хранятся в необратимой форме (ст. 27 ЗРУ-547), поэтому их нельзя посмотреть — можно только выдать новый.","Passwords are stored irreversibly (Art. 27 ZRU-547), so they cannot be read — only replaced."],
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
  conf_intro:["O'z kompaniyalaringiz uchun onlayn uchrashuv vaqtini belgilang — Meet havolasi avtomatik yaratiladi.","Назначьте время онлайн-встречи для своих компаний — ссылка Meet создастся автоматически.","Set the time of an online meeting for your companies — the Meet link is created automatically."],
  conf_title:["Sarlavha","Заголовок","Title"],
  conf_title_ph:["Masalan: A'zolar bilan uchrashuv","Например: Встреча с участниками","E.g. Meeting with members"],
  conf_dt:["Sana va vaqt","Дата и время","Date & time"],
  conf_link:["Havola (ixtiyoriy)","Ссылка (необязательно)","Link (optional)"],
  conf_link_hint:["Bo'sh qoldiring — Google Meet xonasi avtomatik yaratiladi. Yoki o'z havolangizni kiriting.","Оставьте пустым — комната Google Meet создастся автоматически. Или укажите свою ссылку.","Leave it empty — a Google Meet room is created automatically. Or paste your own link."],
  conf_meet_auto:["Google Meet · avtomatik","Google Meet · автоматически","Google Meet · auto"],
  conf_meet_manual:["Qo'lda kiritilgan","Указана вручную","Manual link"],
  conf_meet_off:["Havolasiz — admin Google'ga kirishi kerak","Без ссылки — админ должен войти в Google","No link — the admin must sign in to Google"],
  conf_meet_err:["Meet yaratilmadi","Meet не создан","Meet not created"],
  conf_meet_retry:["Meet yaratish","Создать Meet","Create Meet"],
  conf_join:["Qo'shilish →","Присоединиться →","Join →"],
  conf_meet_making:["Yaratilmoqda…","Создаётся…","Creating…"],
  conf_meet_ready:["✓ Meet xonasi yaratildi","✓ Комната Meet создана","✓ Meet room created"],
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
  {v:"bizid",k:"nav_bizid",ic:svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M5.5 17c.6-1.8 2-2.6 3.5-2.6s2.9.8 3.5 2.6"/><path d="M15 9h4M15 13h4"/>')},
  {v:"dashboard", k:"nav_dash", ic:svg('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>')},
  {v:"registrations", k:"nav_regs", badge:"reg", ic:svg("<path d=\"M9 11l3 3L22 4\"/><path d=\"M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11\"/>")},
  {v:"companies", k:"nav_comp", ic:(typeof ICONS!=="undefined"&&ICONS.business)?ICONS.business:svg('<path d="M3 21h18"/><path d="M5 21V8l7-4 7 4v13"/>')},
  {v:"questions", k:"nav_quest", ic:svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>')},
  {v:"news", k:"nav_news", ic:svg('<path d="M4 4h13a1 1 0 0 1 1 1v13a2 2 0 0 0 2-2V7"/><path d="M4 4a1 1 0 0 0-1 1v13a2 2 0 0 0 2 2h13"/><path d="M7 8h7M7 12h7M7 16h4"/>')},
  {v:"report", k:"nav_report", ic:svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M8 9h2"/>')},
  {v:"groups", k:"nav_groups", href:"chat.html", ic:svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>')},
  {v:"appeals", k:"nav_appeals", ic:svg('<path d="M3 21h18"/><path d="M5 21V10M9 21V10M15 21V10M19 21V10"/><path d="M12 3l9 5H3z"/>')},
  {v:"conference", k:"nav_conf", ic:svg('<path d="M15 10l5-3v10l-5-3z"/><rect x="3" y="6" width="12" height="12" rx="2"/>')},
  /* Rights under modda 21-22 ZRU-547 — an association's chairman is a data
     subject too, and this is where their own account lives. */
  {v:"legal", k:"nav_legal", ic:svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 6 19.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.4 13H4a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 5.3 6L5.2 6a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 11 4.4V4a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V11a2 2 0 0 1 0 4h-.1z"/>')},
];
const VIEW_TITLE = {legal:"nav_legal",bizid:"nav_bizid",dashboard:"nav_dash",registrations:"nav_regs",companies:"nav_comp",questions:"nav_quest",news:"nav_news",report:"nav_report",conference:"nav_conf",appeals:"nav_appeals"};

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
    <td><button class="btn btn-ghost cd-pw" data-id="${c.id}" style="padding:4px 9px;font-size:12.5px">${t("pw_reset")}</button></td>
    <td style="text-align:center">${(c.showroom||[]).length}</td>
    <td style="white-space:nowrap">
      <button class="btn btn-ghost cd-stat" data-id="${c.id}" style="padding:5px 10px;font-size:13px">${t("view")}</button>
      <button class="tdel" data-id="${c.id}">${t("del")}</button></td></tr>`).join("")
    || `<tr><td colspan="6" class="ac-label">${t("cmp_empty")}</td></tr>`;
  view.innerHTML=`
    <div class="admin-panel">
      <h2>${t("nav_comp")} (${companies.length})</h2>
      <p style="color:var(--muted);font-size:14px;margin-bottom:14px">${t("cmp_intro")}</p>
      <table class="admin-table"><thead><tr><th>${t("c_name")}</th><th>${t("c_sector")}</th><th>${t("c_login")}</th><th>${t("i_pass")}</th><th style="text-align:center">${t("c_prod")}</th><th></th></tr></thead><tbody>${rows}</tbody></table>
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
  bindPwReset(view);
}

/* ---------- password reset ----------
   The panel can no longer show a member's password, because the platform no
   longer keeps one it could show — only a scrypt hash. Helping a member who
   has lost theirs therefore means issuing a new one, and the new one exists
   in readable form for exactly the length of this response. */
function bindPwReset(view){
  view.querySelectorAll(".cd-pw").forEach(b=>b.addEventListener("click",async e=>{
    e.preventDefault();
    if(!confirm(t("pw_confirm"))) return;
    b.disabled=true;
    const r=await op({op:"pw",id:b.dataset.id});
    b.disabled=false;
    if(!r||!r.password) return;
    /* Shown once, next to the button that produced it, and left on screen
       until the page is redrawn — long enough to copy, nowhere to go back to. */
    const box=document.createElement("div");
    box.className="pw-once";
    box.innerHTML=`<div>${esc(t("pw_once"))}</div>`
      +`<code class="pw-once-val">${esc(r.password)}</code>`
      +`<div class="pw-once-why">${esc(t("pw_why"))}</div>`;
    b.parentNode.insertBefore(box,b.nextSibling);
    const val=box.querySelector(".pw-once-val");
    val.addEventListener("click",()=>{ if(navigator.clipboard) navigator.clipboard.writeText(r.password); });
  }));
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
        ${row(t("i_pass"),`<span class="ac-label">${t("pw_hidden")}</span> <button class="btn btn-ghost cd-pw" data-id="${escA(c.id)}" style="padding:4px 9px;font-size:12.5px;margin-left:8px">${t("pw_reset")}</button>`)}
        ${row(t("i_created"),c.created?fmtDateTime(c.created):"—")}
        ${row(t("i_products"),prods.length)}
      </tbody></table>
    </div>
    <div class="admin-panel">
      <h2>${t("cd_products")}</h2>
      <div class="show-grid">${grid}</div>
    </div>`;
  $("#cdBack").addEventListener("click",()=>{detailId=null;renderCompanies();});
  bindPwReset(view);
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
   VIEW: NEWS — real articles found on the web, read-only.
   Layered: platform-wide + this association's own sphere.
   ============================================================ */
function newsCard(it){
  const badge = it.tier==="global" ? t("news_tier_global") : (it.scope||"");
  return `<article class="news-item">
    ${it.image?`<img class="news-img" src="${escA(it.image)}" alt="" loading="lazy">`:""}
    <div class="news-text">
      <div class="mi-head"><b>${esc(it.title)}</b>${badge?`<span class="mi-badge">${esc(badge)}</span>`:""}</div>
      ${it.body?`<p>${esc(it.body)}</p>`:""}
      <div class="mi-foot">
        <span>🕓 ${fmtDateTime(it.time)}</span>
        ${it.url?`<a class="news-src" href="${escA(it.url)}" target="_blank" rel="noopener noreferrer">${esc(it.source||t("news_src"))} ↗</a>`:""}
      </div>
    </div>
  </article>`;
}
async function renderNews(){
  $("#view-news").innerHTML=`<div class="admin-panel">
    <h2>${t("nav_news")}</h2>
    <p style="color:var(--muted);font-size:14px;margin-bottom:16px">${t("news_intro")}</p>
    <div class="mod-list" id="asNewsList"><p class="ac-label">${t("news_loading")}</p></div>
  </div>`;
  try{
    const j=await assocReq("/api/assoc/news",{lang:LANG});
    const items=(j&&j.items)||[];
    const box=$("#asNewsList");
    box.innerHTML=items.length?items.map(newsCard).join(""):`<p class="ac-label">${t("news_empty")}</p>`;
    // a source image that no longer resolves should leave no gap in the card
    box.querySelectorAll(".news-img").forEach(img=>img.addEventListener("error",()=>img.remove()));
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
   VIEW: HUKUMATGA MUROJAAT — member companies' appeals pass through here
   ============================================================ */
const AP_STAGE_KEY = { new:"ap_s_new", assoc:"ap_s_assoc", sent:"ap_s_sent",
  answered:"ap_s_answered", rejected:"ap_s_rejected" };

function renderAppeals(){
  $("#view-appeals").innerHTML=`
    <div class="admin-panel">
      <h2>${t("nav_appeals")}</h2>
      <p style="color:var(--muted);font-size:14px;margin-bottom:16px">${t("ap_intro")}</p>
      <div id="apList"></div>
    </div>`;
  assocReq("/api/assoc/appeals",{op:"list"}).then(j=>apPaint(j.items||[])).catch(()=>{});
}
function apPaint(items){
  const box=$("#apList"); if(!box) return;
  if(!items.length){ box.innerHTML=`<p class="ac-label">${t("ap_empty")}</p>`; return; }
  box.innerHTML=items.map(a=>{
    const doc=`/api/appeal/doc?id=${encodeURIComponent(a.id)}&login=${encodeURIComponent(creds.login)}&password=${encodeURIComponent(creds.password)}`;
    // once it has left the association there is nothing more for it to decide
    const open = a.stage==="new";
    return `<div class="gov-card">
      <div class="gov-card-top"><b>${esc(a.subject)}</b>
        <span class="gov-badge gov-${esc(a.stage)}">${t(AP_STAGE_KEY[a.stage]||"ap_s_new")}</span></div>
      <span class="ac-sub">${t("ap_company")}: ${esc(a.companyName)} · ${esc(a.agency)} · ${esc(confDT(a.created))}</span>
      <p class="gov-body-preview">${esc(String(a.body||"").slice(0,300))}${String(a.body||"").length>300?"…":""}</p>
      ${apTrail(a)}
      <div class="gov-act">
        <a class="btn btn-ghost" href="${escA(doc)}">${t("ap_doc")}</a>
        ${open?`<input class="gov-note" id="apn-${a.id}" placeholder="${t("ap_note")}">
          <button class="btn btn-primary ap-go" data-id="${a.id}" data-stage="assoc">${t("ap_support")}</button>
          <button class="btn btn-ghost ap-go" data-id="${a.id}" data-stage="rejected">${t("ap_reject")}</button>`:""}
      </div>
    </div>`;
  }).join("");
  box.querySelectorAll(".ap-go").forEach(b=>b.addEventListener("click",()=>{
    const note=($("#apn-"+b.dataset.id)||{}).value||"";
    b.disabled=true;
    assocReq("/api/assoc/appeals",{op:"stage",id:b.dataset.id,stage:b.dataset.stage,note})
      .then(j=>apPaint(j.items||[])).catch(()=>{ b.disabled=false; });
  }));
}
function apTrail(a){
  const h=(a.history||[]).slice(1);
  if(!h.length) return "";
  return `<div class="gov-trail">`+h.map(x=>
    `<div class="gov-trail-row"><span>${t(AP_STAGE_KEY[x.stage]||x.stage)}</span>
      <em>${esc(x.by)}${x.note?" · "+esc(x.note):""}</em></div>`).join("")+`</div>`;
}

/* ============================================================
   VIEW: ONLINE MEETING (own Zoom, per association)
   ============================================================ */
function confDT(s){const d=new Date(s);if(isNaN(d))return s||"";return d.toLocaleString();}
/* where a scheduled meeting's room stands: auto room, pasted link, or nothing yet */
/* whoever scheduled it needs a way in too — same server-resolved hop the
   companies use, so the creator lands in the identical room */
function confJoinHtml(m){
  if(!m.link) return "";
  return `<a class="btn btn-primary conf-join-btn" href="/api/conference/join?id=${encodeURIComponent(m.id)}" target="_blank" rel="noopener">${t("conf_join")}</a>`;
}
function confRoomHtml(m){
  if(m.link){
    const badge = m.provider==="meet-bot" ? t("conf_meet_auto") : t("conf_meet_manual");
    return `<a href="${escA(m.link)}" target="_blank" rel="noopener">${esc(m.link)}</a><span class="ac-sub">${badge}</span>`;
  }
  const why = m.meetError==="google_not_connected" ? t("conf_meet_off") : `${t("conf_meet_err")}${m.meetError?" · "+esc(m.meetError):""}`;
  return `<span class="ac-sub" style="color:var(--gold)">${why}</span> <button class="btn btn-ghost conf-relink" data-id="${m.id}" style="padding:4px 10px;font-size:12px">${t("conf_meet_retry")}</button>`;
}
function renderConference(){
  $("#view-conference").innerHTML=`
    <div class="admin-panel">
      <h2>${t("nav_conf")}</h2>
      <p style="color:var(--muted);font-size:14px;margin-bottom:16px">${t("conf_intro")}</p>
      <form class="admin-form" id="confForm" style="align-items:flex-end">
        <div><div class="ac-label">${t("conf_title")}</div><input id="conf-title" placeholder="${t("conf_title_ph")}" required></div>
        <div><div class="ac-label">${t("conf_dt")}</div><input id="conf-dt" type="datetime-local" required></div>
        <div><div class="ac-label">${t("conf_link")}</div><input id="conf-link" type="url" placeholder="${t("conf_meet_auto")}"></div>
        <div><div class="ac-label">${t("conf_desc")}</div><input id="conf-desc" placeholder="…"></div>
        <button class="btn btn-primary" type="submit">${t("conf_add")}</button>
        <span class="ac-sub" id="confMsg" style="opacity:0"></span>
      </form>
      <p class="ac-label" style="margin-top:10px">${t("conf_link_hint")}</p>
      <h3 style="font-size:15px;margin:24px 0 10px">${t("conf_listh")}</h3>
      <div id="confList"></div>
    </div>`;
  const msg=(text,ok=true)=>{const m=$("#confMsg");m.textContent=text;m.style.color=ok?"var(--green)":"var(--gold)";m.style.opacity=1;clearTimeout(window._cmt);window._cmt=setTimeout(()=>m.style.opacity=0,2200);};
  const paint=(meetings)=>{
    CONF_ACTIVE=!!(meetings&&meetings.length);
    const box=$("#confList"); if(!box) return;
    box.innerHTML=(meetings&&meetings.length)
      ? meetings.map(m=>`<div class="conf-row"><div class="conf-row-main"><b>${esc(m.title)}</b><span>${esc(confDT(m.datetime))}${m.desc?" · "+esc(m.desc):""}</span>${confRoomHtml(m)}</div><div class="conf-row-act">${confJoinHtml(m)}<button class="tdel" data-id="${m.id}">${t("del")}</button></div></div>`).join("")
      : `<p class="ac-label">${t("conf_none_list")}</p>`;
    box.querySelectorAll(".conf-relink").forEach(b=>b.addEventListener("click",()=>{
      b.disabled=true; b.textContent=t("conf_meet_making");
      assocReq("/api/assoc/conference",{relinkId:b.dataset.id})
        .then(j=>{ paint(j.meetings); msg(j.ok?t("conf_meet_ready"):t("conf_meet_err"), !!j.ok); })
        .catch(()=>{ b.disabled=false; b.textContent=t("conf_meet_retry"); msg("Error",false); });}));
    box.querySelectorAll(".tdel").forEach(b=>b.addEventListener("click",()=>{
      assocReq("/api/assoc/conference",{removeId:b.dataset.id}).then(j=>paint(j.meetings));}));
  };
  assocReq("/api/assoc/conference",{op:"list"}).then(j=>paint(j.meetings));
  $("#confForm").addEventListener("submit",e=>{e.preventDefault();
    const link=$("#conf-link").value.trim();     // empty → the bot opens a Meet room for it
    if(link && !/^https?:\/\/.+/i.test(link)){msg(t("conf_link_err"),false);return;}
    const btn=$("#confForm button[type=submit]"); btn.disabled=true; btn.textContent=t("conf_meet_making");
    assocReq("/api/assoc/conference",{title:$("#conf-title").value.trim(),datetime:$("#conf-dt").value,link,desc:$("#conf-desc").value.trim()})
      .then(j=>{ paint(j.meetings); $("#confForm").reset();
        const m=j.meeting||{};
        msg(m.provider==="meet-bot"?t("conf_meet_ready"):(m.link?t("conf_added"):t("conf_meet_off")), !!m.link); })
      .catch(()=>msg("Error",false))
      .finally(()=>{ btn.disabled=false; btn.textContent=t("conf_add"); });
  });
}

/* ============================================================
   SHELL: nav + view switching
   ============================================================ */
function renderView(){
  ["bizid","dashboard","registrations","companies","questions","news","report","conference","appeals","legal"].forEach(v=>$("#view-"+v)&&$("#view-"+v).classList.toggle("active",v===activeView));
  if(activeView==="dashboard")  renderDashboard();
  if(activeView==="registrations") renderRegistrations();
  if(activeView==="companies"){ detailId=null; renderCompanies(); }
  if(activeView==="questions")  renderQuestions();
  if(activeView==="news")       renderNews();
  if(activeView==="report")     renderReport();
  if(activeView==="conference") renderConference();
  if(activeView==="legal") LegalPanel.mount($("#view-legal"), {
    creds: () => creds, panelClass: "admin-panel", profileHref: "association.html",
    onWithdrawn: () => { sessionStorage.removeItem("kg_as"); location.href = "index.html"; } });
  if(activeView==="appeals") renderAppeals();
  if(activeView==="bizid") BizIdPanel.mount($("#bizidHost"), creds);
  $("#viewTitle").textContent=t(VIEW_TITLE[activeView]);
}
function buildNav(){
  const nav=$("#asNav"); nav.innerHTML="";
  NAV.forEach(n=>{
    const b=document.createElement("button"); b.className=(n.v===activeView?"active":"");
    b.innerHTML=n.ic+`<span>${t(n.k)}</span>`
      + (n.badge==="reg" && REG_PENDING ? `<em class="co-badge">${REG_PENDING}</em>` : "");
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
/* The public view and the site header belong to the same mode: the cabinet
   has its own sidebar, so the header must come and go with the page, not
   linger above a panel that already has navigation. */
function showPublicChrome(on){
  const pub = $("#asPublic"), hdr = $("#pubHeader");
  if(pub) pub.hidden = !on;
  if(hdr) hdr.hidden = !on;
}
function showLogin(){ $("#asLogin").hidden=false; $("#asShell").hidden=true; showPublicChrome(false); setTimeout(()=>$("#asLoginInp").focus(),50); }
async function tryLogin(login,password){
  const r=await fetch("/api/assoc/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({login,password})});
  if(!r.ok) return false;
  const j=await r.json();
  assoc=j.assoc; companies=j.companies||[]; creds={login,password};
  sessionStorage.setItem("kg_as",JSON.stringify(creds));
  return true;
}
/* The sidebar used to read "Super Admin", which says what the account is
   rather than which association it belongs to. Once signed in it carries the
   association's own name, in the reader's language. */
function paintBrand(){
  const name = aName(assoc);
  const el=$("#asBrandSub");
  if(el){ el.textContent = name || t("brand_fallback"); el.title = name || ""; }
  /* the browser tab says which association too, not just the account type */
  if(name) document.title = name + " — TIJORAT MARKAZI";
}

async function startApp(){
  $("#asLogin").hidden=true; showPublicChrome(false); $("#asShell").hidden=false;
  paintBrand();
  $("#aiNav").href="assistant.html?panel=assoc&co="+encodeURIComponent(aName(assoc));
  // detect an active meeting for the dashboard KPI
  try{ const r=await fetch("/api/conference?assoc="+encodeURIComponent(assoc.id)); const c=r.ok?await r.json():{}; CONF_ACTIVE=!!(c&&c.title); }catch(e){}
  buildNav(); renderView();
  /* so the sidebar badge shows waiting applications straight away */
  refreshRegCount();
}
async function loadPublic(id){
  try{
    const r=await fetch("/api/assoc/public?id="+encodeURIComponent(id));
    if(!r.ok){ location.href="associations.html"; return; }
    const j=await r.json();
    $("#asLogin").hidden=true; $("#asShell").hidden=true; showPublicChrome(true);
    $("#pubName").textContent=aName(j.assoc)||"—";
    $("#pubChair").textContent=j.assoc.chairman?("Rahbar: "+j.assoc.chairman):"";
    $("#pubCount").textContent=(j.companies||[]).length;
    const grid=$("#pubCompanies");
    if(!j.companies||!j.companies.length){ grid.innerHTML=`<p class="co-sub">${t("pub_empty")}</p>`; }
    /* Every member company now has a page of its own, so every row is
       clickable — a company with nothing in the showroom yet used to render
       as a dead card. The Business ID sits beside it as its own control,
       outside the card's <a>, because anchors cannot nest. */
    else grid.innerHTML=j.companies.map(c=>{
      const inner=`
        <span class="dir-mark">${esc((c.name||"?").charAt(0).toUpperCase())}</span>
        <span class="dir-body"><b>${esc(c.name)}</b><em>${esc(c.sector)||"&nbsp;"}</em>
          ${c.products?`<span class="dir-count">🛍️ ${c.products}</span>`:""}</span>`;
      const href = c.bizId ? "korxona.html?id="+encodeURIComponent(c.bizId) : "";
      return `<div class="dir-item">
        ${href
          ? `<a class="dir-card" href="${href}">${inner}<span class="dir-open">${esc(t("open"))}</span></a>`
          : `<div class="dir-card" style="cursor:default">${inner}</div>`}
        ${c.bizId?`<a class="dir-bizbtn" href="biznes-id.html?id=${encodeURIComponent(c.bizId)}"
          title="Business ID">${esc(c.bizId)}</a>`:""}
      </div>`;
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
   REGISTRATION APPLICATIONS
   Companies applying to join this association. Approving one is
   what creates its account, so the confirmation step is real.
   ============================================================ */
let REG_PENDING = 0;
let REG_TAB = "pending";

function regApi(path, data){
  return fetch("/api/register/" + path, { method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify(Object.assign({ login:creds.login, password:creds.password }, data||{})) })
    .then(r=>r.json()).catch(()=>({ error:"network" }));
}

/** Kept current even when the view is closed, so the sidebar badge is honest. */
async function refreshRegCount(){
  const r = await regApi("list", { status:"pending" });
  if(r && r.ok){ REG_PENDING = (r.counts && r.counts.pending) || 0; buildNav(); }
  return r;
}

async function renderRegistrations(){
  const host = $("#view-registrations");
  host.innerHTML = `<div class="panel co-panel">
    <div class="co-panel-head"><span class="co-ic">📝</span><h2>${esc(t("rq_title"))}</h2></div>
    <p class="co-sub">${esc(t("rq_sub"))}</p>
    <div class="rq-tabs" id="rqTabs"></div>
    <div class="rq-list" id="rqList"><p class="co-sub">…</p></div>
  </div>`;

  const r = await regApi("list", { status: REG_TAB === "all" ? "" : REG_TAB });
  if(!r || !r.ok){ $("#rqList").innerHTML = `<p class="empty-note">${esc(t("rq_fail"))}</p>`; return; }
  REG_PENDING = (r.counts && r.counts.pending) || 0;
  buildNav();

  $("#rqTabs").innerHTML = ["pending","approved","rejected","all"].map(k =>
    `<button type="button" class="rq-tab${k===REG_TAB?" is-on":""}" data-rq-tab="${k}">${
      esc(t(k==="all"?"rq_all":"rq_"+k))}${k==="pending"&&REG_PENDING?` <em>${REG_PENDING}</em>`:""}</button>`).join("");

  const items = r.items || [];
  $("#rqList").innerHTML = items.length ? items.map(a => {
    const row = (k,v) => v ? `<dt>${esc(t(k))}</dt><dd>${esc(v)}</dd>` : "";
    const tel = String(a.phone||"").replace(/[^+0-9]/g,"");
    return `<article class="rq-card is-${esc(a.status)}">
      <div class="rq-top">
        <span class="rq-badge">${esc(t("rq_"+a.status))}</span>
        <b>${esc(a.name)}</b>
        <span class="rq-ref">${esc(a.ref)}</span>
      </div>
      ${a.about?`<p class="rq-about">${esc(a.about)}</p>`:""}
      <dl class="rq-kv">
        ${row("rq_login", a.login)}
        ${row("rq_contact", [a.contactName, a.role].filter(Boolean).join(" · "))}
        ${row("rq_sector", a.sector)}${row("rq_region", a.region)}${row("rq_tin", a.tin)}
        <dt>${esc(t("rq_sent"))}</dt><dd>${esc(fmtDateTime(a.created))}</dd>
      </dl>
      <div class="rq-contact">
        ${a.email?`<a href="mailto:${escA(a.email)}">✉ ${esc(a.email)}</a>`:""}
        ${tel?`<a href="tel:${escA(tel)}">📞 ${esc(a.phone)}</a>`:""}
        ${a.website?`<a href="${escA(a.website)}" target="_blank" rel="noopener noreferrer">🔗 ${esc(a.website)}</a>`:""}
      </div>
      ${a.reason?`<p class="rq-reason">${esc(t("rq_reason"))}: ${esc(a.reason)}</p>`:""}
      ${a.status==="pending" ? `<div class="rq-actions">
        <button class="btn btn-primary" type="button" data-rq-ok="${escA(a.id)}">${esc(t("rq_approve"))}</button>
        <button class="btn btn-ghost" type="button" data-rq-no="${escA(a.id)}">${esc(t("rq_reject"))}</button>
      </div>` : ""}
    </article>`;
  }).join("") : `<p class="empty-note">${esc(t("rq_empty"))}</p>`;
}

document.addEventListener("click", async e => {
  const tab = e.target.closest && e.target.closest("[data-rq-tab]");
  if(tab){ REG_TAB = tab.dataset.rqTab; return renderRegistrations(); }

  const ok = e.target.closest && e.target.closest("[data-rq-ok]");
  const no = e.target.closest && e.target.closest("[data-rq-no]");
  if(!ok && !no) return;
  const btn = ok || no;
  if(btn.disabled) return;

  const data = { id: ok ? ok.dataset.rqOk : no.dataset.rqNo, action: ok ? "approve" : "reject" };
  if(ok){ if(!await UI.confirm(t("rq_confirm"))) return; }
  else {
    /* A rejection the applicant cannot understand is worse than none, so the
       reason is required — the server refuses without one either way. */
    const reason = await UI.prompt(t("rq_reason_q"));
    if(!reason || !reason.trim()) return;
    data.reason = reason.trim();
  }
  btn.disabled = true;
  const r = await regApi("decide", data);
  btn.disabled = false;
  if(!r || !r.ok) UI.alert(t("rq_fail"));
  renderRegistrations();
});


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
  if(!$("#asShell").hidden){ paintBrand(); buildNav(); renderView(); }
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
