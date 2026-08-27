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
  nav_appeals:["Hukumatga murojaat","Обращения в правительство","Government appeals"],
  ap_intro:["Uyushmalar qo'llab-quvvatlagan murojaatlar shu yerga keladi. Davlat organiga yuboring va javobni belgilang.","Поддержанные ассоциациями обращения приходят сюда. Отправьте в госорган и отметьте ответ.","Appeals supported by associations arrive here. Send them to the agency and record the answer."],
  ap_empty:["Hozircha murojaat yo'q.","Обращений пока нет.","No appeals yet."],
  ap_all:["Barchasi","Все","All"],
  ap_send:["Davlat organiga yuborildi","Отправлено в госорган","Sent to the agency"],
  ap_answer:["Javob olindi","Получен ответ","Answer received"],
  ap_reject:["Rad etish","Отклонить","Reject"],
  ap_note:["Izoh (ixtiyoriy)","Комментарий (необязательно)","Note (optional)"],
  ap_doc:["📄 Word","📄 Word","📄 Word"],
  ap_company:["Kompaniya","Компания","Company"],
  ap_s_new:["Uyushmada","В ассоциации","With the association"],
  ap_s_assoc:["Qo'llab-quvvatlandi — yuborish kerak","Поддержано — нужно отправить","Supported — needs sending"],
  ap_s_sent:["Davlat organiga yuborildi","Отправлено в госорган","Sent to the agency"],
  ap_s_answered:["Javob olindi","Получен ответ","Answer received"],
  ap_s_rejected:["Rad etildi","Отклонено","Rejected"],
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
  nav_dsr:["Ma'lumot murojaatlari","Обращения по данным","Data requests"],
  dsr_intro:["ZRU-547 22-moddasi har bir murojaatga asoslantirilgan javob berishni va uni belgilangan muddatda yuborishni talab qiladi. Muddati o'tgan murojaat qizil bilan belgilanadi.","Статья 22 ЗРУ-547 требует мотивированного ответа на каждое обращение в установленный срок. Просроченные выделены красным.","Article 22 ZRU-547 requires a reasoned answer to every request within the stated deadline. Overdue ones are marked in red."],
  dsr_none:["Murojaatlar yo'q.","Обращений нет.","No requests."],
  dsr_overdue:["MUDDATI O'TGAN","ПРОСРОЧЕНО","OVERDUE"],
  dsr_c_ref:["№","№","Ref"],
  dsr_c_who:["Kim","Кто","Subject"],
  dsr_c_kind:["Turi","Тип","Kind"],
  dsr_c_filed:["Yuborilgan","Подано","Filed"],
  dsr_c_due:["Muddat","Срок","Due"],
  dsr_c_status:["Holati","Статус","Status"],
  dsr_ans_ph:["Asoslantirilgan javob: qaysi ma'lumot o'chirildi, qaysi biri qanday qonun talabi bo'yicha saqlandi…","Мотивированный ответ: какие данные удалены, какие сохранены и на основании какой нормы…","Reasoned answer: which data was erased, which was retained and under which rule…"],
  dsr_send:["Javob yuborish","Отправить ответ","Send answer"],
  dsr_refuse:["Rad etish (sabab bilan)","Отказать (с обоснованием)","Refuse (with reason)"],
  dsr_need_ans:["Javob matnini kiriting — sababsiz rad etish qonunga zid.","Введите текст ответа — отказ без обоснования противоречит закону.","Enter the answer text — refusing without reasons is unlawful."],
  /* Passwords are stored as scrypt hashes (srv/passwords.js), so these fields
     can only ever WRITE. Left blank they change nothing. */
  pw_new:["Yangi parol","Новый пароль","New password"],
  pw_blank:["bo'sh = o'zgarmaydi","пусто = без изменений","blank = unchanged"],
  pw_hidden:["— ko'rsatilmaydi —","— не показывается —","— not shown —"],
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
  an_title:["Tahlilchi hisoblari","Учётные записи аналитиков","Analyst accounts"],
  an_sub:["Tahlil paneliga kirish uchun hisob yarating. Panel faqat agregat ma'lumotni ko'rsatadi.","Создайте учётную запись для панели аналитики. Панель показывает только агрегаты.","Create an account for the analytics panel. It only ever shows aggregates."],
  an_name:["Ism","Имя","Name"],
  an_org:["Tashkilot","Организация","Organisation"],
  an_login:["Login","Логин","Login"],
  an_pass:["Parol","Пароль","Password"],
  an_scopes:["Ruxsat berilgan bozorlar","Доступные рынки","Markets they may read"],
  an_add:["+ Qo'shish","+ Добавить","+ Add"],
  an_del:["O'chirish","Удалить","Delete"],
  an_none:["Hali tahlilchi hisobi yo'q.","Учётных записей аналитиков пока нет.","No analyst accounts yet."],
  an_open:["Panelni ochish →","Открыть панель →","Open the panel →"],
  an_exists:["Bu login band.","Этот логин занят.","That login is taken."],
  an_need:["Login va parolni kiriting.","Укажите логин и пароль.","Enter a login and a password."],
  an_confirm:["Hisob o'chirilsinmi?","Удалить учётную запись?","Delete this account?"],
  an_need_scope:["Kamida bitta bozorni tanlang.","Выберите хотя бы один рынок.","Choose at least one market."],
  an_add_h:["Yangi hisob","Новая учётная запись","New account"],
  nav_analysts:["Tahlilchilar","Аналитики","Analysts"],
  nav_buyers:["Xaridorlar","Покупатели","Buyers"],
  nav_set:["Sozlamalar","Настройки","Settings"],

  /* Buyer applications. Oversight is the ONLY approver for this tier — no
     association vouches for a buyer — so this queue exists nowhere else. */
  bq_title:["Xaridor arizalari","Заявки покупателей","Buyer applications"],
  bq_sub:["Xaridor kabineti faqat shu yerdan ochiladi — uyushmalar bu arizalarni ko‘rmaydi.","Кабинет покупателя открывается только отсюда — ассоциации эти заявки не видят.","A buyer cabinet is opened only from here — associations never see these applications."],
  bq_pending:["Kutilmoqda","В ожидании","Pending"],
  bq_approved:["Tasdiqlangan","Одобрена","Approved"],
  bq_rejected:["Rad etilgan","Отклонена","Rejected"],
  bq_all:["Barchasi","Все","All"],
  bq_empty:["Bu bo‘limda ariza yo‘q.","В этом разделе заявок нет.","No applications here."],
  bq_approve:["Tasdiqlash","Одобрить","Approve"],
  bq_reject:["Rad etish","Отклонить","Reject"],
  bq_confirm:["Tasdiqlansinmi? Xaridor kabineti darhol ochiladi.","Одобрить? Кабинет покупателя откроется сразу.","Approve? The buyer cabinet opens immediately."],
  bq_reason_q:["Rad etish sababi (ariza egasiga ko‘rinadi):","Причина отказа (её увидит заявитель):","Reason for rejection (the applicant will see it):"],
  bq_reason:["Sabab","Причина","Reason"],
  bq_fail:["Amalni bajarib bo‘lmadi.","Не удалось выполнить.","Could not complete that."],
  bq_login:["Login","Логин","Login"],
  bq_company:["Kompaniya","Компания","Company"],
  bq_phone:["Kompaniya raqami","Телефон компании","Company number"],
  bq_contact:["Mas‘ul shaxs","Ответственное лицо","Contact person"],
  bq_cphone:["Mas‘ul telefoni","Телефон контакта","Contact phone"],
  bq_region:["Hudud","Регион","Region"],
  bq_sent:["Yuborilgan","Отправлена","Sent"],
  bq_decided:["Qaror","Решение","Decided"],
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
  conf_link:["Havola (ixtiyoriy)","Ссылка (необязательно)","Link (optional)"],
  conf_link_hint:["Bo'sh qoldiring — Google Meet xonasi avtomatik yaratiladi. Yoki o'z havolangizni (Zoom / YouTube) kiriting.","Оставьте пустым — комната Google Meet создастся автоматически. Или укажите свою ссылку (Zoom / YouTube).","Leave it empty — a Google Meet room is created automatically. Or paste your own link (Zoom / YouTube)."],
  conf_meet_auto:["Google Meet · avtomatik yaratilgan","Google Meet · создано автоматически","Google Meet · auto-created"],
  conf_meet_manual:["Qo'lda kiritilgan","Указана вручную","Manual link"],
  conf_meet_off:["Havolasiz — Google'ga kirilmagan","Без ссылки — вход в Google не выполнен","No link — not signed in to Google"],
  conf_meet_err:["Meet yaratilmadi","Meet не создан","Meet not created"],
  conf_meet_retry:["Meet yaratish","Создать Meet","Create Meet"],
  conf_join:["Qo'shilish →","Присоединиться →","Join →"],
  conf_meet_making:["Yaratilmoqda…","Создаётся…","Creating…"],
  conf_meet_ready:["✓ Meet xonasi yaratildi","✓ Комната Meet создана","✓ Meet room created"],
  /* google integration */
  g_title:["Google Meet — avtomatik xona","Google Meet — автоматическая комната","Google Meet — automatic room"],
  g_sub:["Bir marta Google'ga kiring. Shundan keyin har bir konferensiya uchun Meet xonasi o'zi yaratiladi — API ham, Cloud loyiha ham kerak emas.","Войдите в Google один раз. После этого комната Meet создаётся сама для каждой конференции — без API и облачного проекта.","Sign in to Google once. After that a Meet room is created by itself for every conference — no API, no Cloud project."],
  g_login:["Google'ga kirish","Войти в Google","Sign in to Google"],
  g_relogin:["Qayta kirish","Войти заново","Sign in again"],
  g_check:["Tekshirish","Проверить","Check"],
  g_disconnect:["Chiqish","Выйти","Sign out"],
  g_on:["Kirilgan","Вход выполнен","Signed in"],
  g_off:["Kirilmagan","Вход не выполнен","Not signed in"],
  g_opening:["Brauzer oynasi ochildi — o'sha oynada Google'ga kiring, so'ng «Tekshirish» tugmasini bosing.","Открылось окно браузера — войдите в Google в нём, затем нажмите «Проверить».","A browser window opened — sign in to Google there, then press “Check”."],
  g_working:["Bajarilmoqda…","Выполняется…","Working…"],
  g_nochrome:["Chrome yoki playwright-core topilmadi. Loyiha papkasida bir marta «npm install» ni bajaring.","Chrome или playwright-core не найдены. Выполните «npm install» в папке проекта.","Chrome or playwright-core is missing. Run “npm install” once in the project folder."],
  g_note:["Bu server ishlayotgan kompyuterdagi brauzerni boshqaradi. Kirish saqlanadi; Google seansni bekor qilsa, qayta kirish kerak bo'ladi.","Управляет браузером на машине сервера. Вход сохраняется; если Google завершит сессию, нужно войти снова.","It drives a browser on the machine running the server. The login persists; if Google ends the session you sign in again."],
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
  {v:"appeals", k:"nav_appeals", ic:svg('<path d="M3 21h18"/><path d="M5 21V10M9 21V10M15 21V10M19 21V10"/><path d="M12 3l9 5H3z"/>')},
  {v:"conference", k:"nav_conf", ic:svg('<path d="M15 10l5-3v10l-5-3z"/><rect x="3" y="6" width="12" height="12" rx="2"/>')},
  {v:"dsr", k:"nav_dsr", ic:svg('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>')},
  {v:"analysts", k:"nav_analysts", ic:svg('<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6" rx=".6"/><rect x="12" y="7" width="3" height="10" rx=".6"/><rect x="17" y="13" width="3" height="4" rx=".6"/>')},
  {v:"buyers", k:"nav_buyers", ic:svg('<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L21 8H6"/>')},

  {v:"settings", k:"nav_set", ic:svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 6 19.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.4 13H4a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 5.3 6L5.2 6a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 11 4.4V4a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V11a2 2 0 0 1 0 4h-.1z"/>')},
];
const VIEW_TITLE = {dashboard:"nav_dash",associations:"nav_assoc",members:"nav_members",companies:"nav_comp",leads:"nav_leads",questions:"nav_quest",projects:"nav_projects",chat:"nav_chat",report:"nav_report",conference:"nav_conf",appeals:"nav_appeals",dsr:"nav_dsr",analysts:"nav_analysts",buyers:"nav_buyers",settings:"nav_set"};

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
/** An association's name in the active language. */
const aName = a => (a && a.i18n && a.i18n[LANG]) || (a && a.name) || "";

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
        <td><a href="#" class="as-open" data-id="${a.id}"><b>${escAttr(aName(a))}</b></a></td>
        <td><input class="adm-inline" data-f="chairman" value="${escAttr(a.chairman)}" placeholder="${t("as_chair")}"></td>
        <td><input class="adm-inline mono" data-f="login" value="${escAttr(a.login)}" placeholder="login"></td>
        <td><input class="adm-inline mono" type="password" autocomplete="new-password" data-f="password" value="" placeholder="${t("pw_blank")}"></td>
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
          <div><div class="ac-label">${t("pw_new")}</div><input class="adm-inline mono" type="password" autocomplete="new-password" id="rais-pass" value="" placeholder="${t("pw_blank")}"></div>
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
      <td><input class="adm-inline mono" type="password" autocomplete="new-password" data-cf="password" value="" placeholder="${t("pw_blank")}"></td>
      <td><button class="tdel" data-id="${c.id}">${t("del")}</button></td></tr>`).join("")
      || `<tr><td colspan="5" class="ac-label">${t("as_empty_c")}</td></tr>`;
    view.innerHTML=`
      <button class="btn btn-ghost" id="asBack" style="margin-bottom:14px">${t("as_back")}</button>
      <div class="admin-panel" style="margin-bottom:18px">
        <h2>🏛️ ${escAttr(aName(a))}</h2>
        <div class="admin-form" style="grid-template-columns:repeat(3,minmax(0,1fr));max-width:680px">
          <div><div class="ac-label">${t("as_chair")}</div><input class="adm-inline" id="ad-chair" value="${escAttr(a.chairman)}"></div>
          <div><div class="ac-label">${t("as_login")}</div><input class="adm-inline mono" id="ad-login" value="${escAttr(a.login)}"></div>
          <div><div class="ac-label">${t("pw_new")}</div><input class="adm-inline mono" type="password" autocomplete="new-password" id="ad-pass" value="" placeholder="${t("pw_blank")}"></div>
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
    const opts=`<option value="all">${t("mb_all")}</option>`+ORGS.associations.map(a=>`<option value="${a.id}" ${a.id===filter?"selected":""}>${escAttr(aName(a))}</option>`).join("");
    const list=ORGS.companies.filter(c=>filter==="all"||c.assocId===filter);
    const aname=id=>{const a=ORGS.associations.find(x=>x.id===id);return a?aName(a):"—";};
    const rows=list.slice().reverse().map(c=>`<tr>
      <td><b>${escAttr(c.name)}</b></td>
      <td>${escAttr(aname(c.assocId))}</td>
      <td>${escAttr(c.sector)||"—"}</td>
      <td><code>${escAttr(c.login)}</code></td>
      <td><span class="ac-label">${t("pw_hidden")}</span></td>
      <td><button class="tdel" data-id="${c.id}">${t("del")}</button></td></tr>`).join("");
    const addOpts=ORGS.associations.map(a=>`<option value="${a.id}">${escAttr(aName(a))}</option>`).join("");
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
          🏛 ${escAttr(aName(a))}
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
  if(j.ok) openLetter(j.letter); else UI.alert(t("q_empty"));
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
    const opts=`<option value="">${t("conf_global")}</option>`+ORGS.associations.map(a=>`<option value="${a.id}">${escAttr(aName(a))}</option>`).join("");
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
            <input id="conf-link" type="url" placeholder="${t("conf_meet_auto")}"></div>
          <div><div class="ac-label">${t("conf_desc")}</div>
            <input id="conf-desc" placeholder="…"></div>
          <button class="btn btn-primary" type="submit">${t("conf_add")}</button>
          <span class="ac-sub" id="confMsg" style="opacity:0"></span>
        </form>
        <p class="ac-label" style="margin-top:10px">${t("conf_link_hint")}</p>
        <h3 style="font-size:15px;margin:24px 0 10px">${t("conf_listh")}</h3>
        <div id="confList"></div>
      </div>`;
    const msg=(text,ok=true)=>{const m=$("#confMsg");m.textContent=text;m.style.color=ok?"var(--green)":"var(--gold)";m.style.opacity=1;clearTimeout(window._cmt);window._cmt=setTimeout(()=>m.style.opacity=0,2200);};
    const targetId=()=>$("#conf-target").value;
    const paint=(meetings)=>{
      const box=$("#confList"); if(!box) return;
      box.innerHTML=(meetings&&meetings.length)
        ? meetings.map(m=>`<div class="conf-row"><div class="conf-row-main"><b>${escAttr(m.title)}</b><span>${escAttr(confDT(m.datetime))}${m.desc?" · "+escAttr(m.desc):""}</span>${confRoomHtml(m)}</div><div class="conf-row-act">${confJoinHtml(m)}<button class="tdel" data-id="${m.id}">${t("del")}</button></div></div>`).join("")
        : `<p class="ac-label">${t("conf_none_list")}</p>`;
      box.querySelectorAll(".tdel").forEach(b=>b.addEventListener("click",()=>{
        fetch("/api/conference",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({pass:"admin",assocId:targetId(),removeId:b.dataset.id})}).then(r=>r.json()).then(j=>paint(j.meetings));}));
      // a meeting saved while Google was unreachable can get its room later
      box.querySelectorAll(".conf-relink").forEach(b=>b.addEventListener("click",()=>{
        b.disabled=true; b.textContent=t("conf_meet_making");
        fetch("/api/conference",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({pass:"admin",assocId:targetId(),relinkId:b.dataset.id})})
          .then(r=>r.json()).then(j=>{ paint(j.meetings); msg(j.ok?t("conf_meet_ready"):t("conf_meet_err"), !!j.ok); })
          .catch(()=>{ b.disabled=false; b.textContent=t("conf_meet_retry"); msg("Error",false); });}));
    };
    const loadTarget=()=>{
      const id=targetId();
      $("#confScope").textContent = id ? t("conf_for_assoc") : t("conf_for_global");
      fetch("/api/conference?manage=1&assoc="+encodeURIComponent(id)).then(r=>r.json()).then(j=>paint(j.meetings)).catch(()=>{});
    };
    $("#conf-target").addEventListener("change",loadTarget);
    loadTarget();
    $("#confForm").addEventListener("submit",e=>{e.preventDefault();
      const link=$("#conf-link").value.trim();     // empty → the bot opens a Meet room for it
      if(link && !/^https?:\/\/.+/i.test(link)){msg(t("conf_link_err"),false);return;}
      const btn=$("#confForm button[type=submit]"); btn.disabled=true; btn.textContent=t("conf_meet_making");
      fetch("/api/conference",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({pass:"admin",assocId:targetId(),title:$("#conf-title").value.trim(),datetime:$("#conf-dt").value,link,desc:$("#conf-desc").value.trim()})})
        .then(r=>r.json()).then(j=>{ paint(j.meetings); $("#confForm").reset();
          const m=j.meeting||{};
          msg(m.provider==="meet-bot"?t("conf_meet_ready"):(m.link?t("conf_added"):t("conf_meet_off")), !!m.link); })
        .catch(()=>msg("Error",false))
        .finally(()=>{ btn.disabled=false; btn.textContent=t("conf_add"); });
    });
  };
  if(ORGS.associations.length) build();
  orgsApi({op:"list"}).then(r=>{ ORGS=r; build(); });
}
function confDT(s){const d=new Date(s);if(isNaN(d))return s||"";return d.toLocaleString();}
/* where a scheduled meeting's room stands: auto room, pasted link, or nothing yet */
function confRoomHtml(m){
  if(m.link){
    const badge = m.provider==="meet-bot" ? t("conf_meet_auto") : t("conf_meet_manual");
    return `<a href="${escAttr(m.link)}" target="_blank" rel="noopener">${escAttr(m.link)}</a><span class="ac-sub">${badge}</span>`;
  }
  const why = m.meetError==="google_not_connected" ? t("conf_meet_off") : `${t("conf_meet_err")}${m.meetError?" · "+escAttr(m.meetError):""}`;
  return `<span class="ac-sub" style="color:var(--gold)">${why}</span> <button class="btn btn-ghost conf-relink" data-id="${m.id}" style="padding:4px 10px;font-size:12px">${t("conf_meet_retry")}</button>`;
}
/* whoever scheduled it needs a way in too — same server-resolved hop the
   companies use, so the creator lands in the identical room */
function confJoinHtml(m){
  if(!m.link) return "";
  return `<a class="btn btn-primary conf-join-btn" href="/api/conference/join?id=${encodeURIComponent(m.id)}" target="_blank" rel="noopener">${t("conf_join")}</a>`;
}

/* ============================================================
   VIEW: HUKUMATGA MUROJAAT — the last stop before the agency
   ============================================================ */
const AP_STAGE_KEY = { new:"ap_s_new", assoc:"ap_s_assoc", sent:"ap_s_sent",
  answered:"ap_s_answered", rejected:"ap_s_rejected" };
const apApi = body => fetch("/api/appeals",{method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify(Object.assign({pass:"admin"},body))}).then(r=>r.json());

function renderAppeals(){
  $("#view-appeals").innerHTML=`
    <div class="admin-panel">
      <h2>${t("nav_appeals")}</h2>
      <p style="color:var(--muted);font-size:14px;margin-bottom:16px">${t("ap_intro")}</p>
      <div id="apList"></div>
    </div>`;
  apApi({op:"list"}).then(j=>apPaint(j.items||[])).catch(()=>{});
}
function apPaint(items){
  const box=$("#apList"); if(!box) return;
  if(!items.length){ box.innerHTML=`<p class="ac-label">${t("ap_empty")}</p>`; return; }
  box.innerHTML=items.map(a=>{
    const doc=`/api/appeal/doc?id=${encodeURIComponent(a.id)}&pass=admin`;
    // what the rais can do next depends on where the appeal has got to
    const acts = a.stage==="assoc" ? [["sent","btn-primary","ap_send"],["rejected","btn-ghost","ap_reject"]]
              : a.stage==="sent"  ? [["answered","btn-primary","ap_answer"],["rejected","btn-ghost","ap_reject"]]
              : [];
    return `<div class="gov-card">
      <div class="gov-card-top"><b>${escAttr(a.subject)}</b>
        <span class="gov-badge gov-${escAttr(a.stage)}">${t(AP_STAGE_KEY[a.stage]||"ap_s_new")}</span></div>
      <span class="ac-sub">${t("ap_company")}: ${escAttr(a.companyName)} · ${escAttr(a.assocName||"—")} · ${escAttr(a.agency)} · ${escAttr(confDT(a.created))}</span>
      <p class="gov-body-preview">${escAttr(String(a.body||"").slice(0,300))}${String(a.body||"").length>300?"…":""}</p>
      ${apTrail(a)}
      <div class="gov-act">
        <a class="btn btn-ghost" href="${escAttr(doc)}">${t("ap_doc")}</a>
        ${acts.length?`<input class="gov-note" id="apn-${a.id}" placeholder="${t("ap_note")}">`:""}
        ${acts.map(([stage,cls,key])=>`<button class="btn ${cls} ap-go" data-id="${a.id}" data-stage="${stage}">${t(key)}</button>`).join("")}
      </div>
    </div>`;
  }).join("");
  box.querySelectorAll(".ap-go").forEach(b=>b.addEventListener("click",()=>{
    const note=($("#apn-"+b.dataset.id)||{}).value||"";
    b.disabled=true;
    apApi({op:"stage",id:b.dataset.id,stage:b.dataset.stage,note})
      .then(j=>apPaint(j.items||[])).catch(()=>{ b.disabled=false; });
  }));
}
function apTrail(a){
  const h=(a.history||[]).slice(1);
  if(!h.length) return "";
  return `<div class="gov-trail">`+h.map(x=>
    `<div class="gov-trail-row"><span>${t(AP_STAGE_KEY[x.stage]||x.stage)}</span>
      <em>${escAttr(x.by)}${x.note?" · "+escAttr(x.note):""}</em></div>`).join("")+`</div>`;
}


/* ============================================================
   ANALYST ACCOUNTS
   Issued here, alongside associations and companies, because that
   is where every other credential on the platform comes from.
   ============================================================ */
function analystApi(body){
  return fetch("/api/analyst/accounts",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(Object.assign({pass:"admin"},body))}).then(r=>r.json()).catch(()=>({error:"network"}));
}

/* ============================================================
   DATA-SUBJECT REQUESTS

   The queue behind mening-malumotlarim.html. It exists so that
   somebody is accountable for a deadline: modda 22 ZRU-547 wants
   a reasoned answer inside a stated period, and a request nobody
   can see is a period nobody meets.

   Two deliberate constraints:
   - `overdue` is computed by the server as of now, not stored, so
     a stale page cannot show a missed deadline as still fine;
   - the answer box will not submit empty, including for a
     refusal. A refusal without a ground is not an answer, and it
     is the version of this that gets a platform in trouble.
   ============================================================ */
const DSR_KIND = { access:["Ma'lumot olish","Получение сведений","Access"],
                   withdraw:["Rozilikni qaytarib olish","Отзыв согласия","Withdrawal"],
                   erase:["O'chirishni talab qilish","Требование об удалении","Erasure"] };
const DSR_ST = { open:["Ochiq","Открыто","Open"],
                 answered:["Javob berilgan","Дан ответ","Answered"],
                 refused:["Rad etilgan","Отказано","Refused"] };
const dsrLang = () => Math.max(0, ["uz","ru","en"].indexOf(localStorage.getItem("kg_lang") || "uz"));

async function renderDsr(){
  const view = $("#view-dsr");
  const r = await fetch("/api/legal/requests", { method:"POST",
    headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ pass:"admin" }) }).then(x=>x.json());
  const items = (r && r.items) || [];
  const li = dsrLang();

  const rows = items.map(q => `<tr data-id="${escAttr(q.id)}"${q.overdue ? ' class="dsr-late"' : ''}>
      <td><code>${escAttr(q.ref)}</code></td>
      <td>${escAttr(q.subjectName)}<div class="ac-label">${escAttr(q.subjectEmail)}</div></td>
      <td>${escAttr((DSR_KIND[q.kind] || [q.kind])[li] || q.kind)}</td>
      <td>${escAttr(fmtDT(q.created))}</td>
      <td>${escAttr(fmtDT(q.due))}${q.overdue ? ` <span class="badge-st off">${t("dsr_overdue")}</span>` : ""}</td>
      <td>${escAttr((DSR_ST[q.status] || [q.status])[li] || q.status)}
        ${q.note ? `<div class="ac-label">${escAttr(q.note)}</div>` : ""}
        ${q.answer ? `<div class="ac-label">&rarr; ${escAttr(q.answer)}</div>` : ""}</td>
      <td>${q.status === "open" ? `
        <textarea class="adm-inline dsr-ans" rows="2" placeholder="${escAttr(t("dsr_ans_ph"))}"></textarea>
        <div style="margin-top:6px;white-space:nowrap">
          <button class="btn btn-primary dsr-ok" style="padding:5px 11px;font-size:13px">${t("dsr_send")}</button>
          <button class="btn btn-ghost dsr-no" style="padding:5px 11px;font-size:13px">${t("dsr_refuse")}</button>
        </div>` : "—"}</td></tr>`).join("")
    || `<tr><td colspan="7" class="ac-label">${t("dsr_none")}</td></tr>`;

  view.innerHTML = `
    <div class="admin-panel">
      <h2>${t("nav_dsr")}${r && r.overdue ? ` <span class="badge-st off">${r.overdue}</span>` : ""}</h2>
      <p style="color:var(--muted);font-size:14px;margin-bottom:14px">${t("dsr_intro")}</p>
      <table class="admin-table"><thead><tr>
        <th>${t("dsr_c_ref")}</th><th>${t("dsr_c_who")}</th><th>${t("dsr_c_kind")}</th>
        <th>${t("dsr_c_filed")}</th><th>${t("dsr_c_due")}</th><th>${t("dsr_c_status")}</th><th></th>
      </tr></thead><tbody>${rows}</tbody></table>
      <div class="err" id="dsrErr" style="margin-top:10px"></div>
    </div>`;

  const answer = async (tr, refuse) => {
    const box = tr.querySelector(".dsr-ans");
    const text = (box.value || "").trim();
    if(!text){ $("#dsrErr").textContent = t("dsr_need_ans"); box.focus(); return; }
    $("#dsrErr").textContent = "";
    await fetch("/api/legal/answer", { method:"POST", headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ pass:"admin", id:tr.dataset.id, answer:text, refuse:!!refuse }) });
    renderDsr();
  };
  view.querySelectorAll(".dsr-ok").forEach(b => b.addEventListener("click", () => answer(b.closest("tr"), false)));
  view.querySelectorAll(".dsr-no").forEach(b => b.addEventListener("click", () => answer(b.closest("tr"), true)));
}

/** Short local date-time, used only by the queue above. */
function fmtDT(ms){
  if(!ms) return "—";
  const d = new Date(ms);
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function renderAnalysts(){
  const host=$("#view-analysts");
  if(!host) return;
  const r=await analystApi({op:"list"});
  const list=(r&&r.analysts)||[];
  /* The panel is the card itself so it picks up the dome ornament that every
     other admin section wears — nesting it one level deeper loses that. */
  host.innerHTML=`
    <div class="admin-panel" id="anCard">
      <h2>${t("an_title")}</h2>
      <p class="an-acc-intro">${t("an_sub")}</p>

      <div class="an-acc-list">${list.length?list.map(a=>`
        <div class="an-acc">
          <div class="an-acc-who">
            <b>${escAttr(a.name||a.login)}</b>
            ${a.org?`<span class="an-acc-org">${escAttr(a.org)}</span>`:""}
          </div>
          <div class="an-acc-creds">
            <code>${escAttr(a.login)}</code><span class="an-acc-sep">/</span><span class="ac-label">${t("pw_hidden")}</span>
          </div>
          <div class="an-acc-scopes">${(a.scopes||[]).map(m=>`<span>${escAttr(m)}</span>`).join("")}</div>
          <button class="an-acc-del" type="button" data-an-del="${escAttr(a.id)}" title="${escAttr(t("an_del"))}">${t("an_del")}</button>
        </div>`).join(""):`<p class="an-acc-empty">${t("an_none")}</p>`}</div>

      <div class="an-acc-new">
        <h3>${t("an_add_h")}</h3>
        <div class="an-acc-grid">
          <label><span>${t("an_name")}</span><input id="anName" autocomplete="off"></label>
          <label><span>${t("an_org")}</span><input id="anOrg" autocomplete="off"></label>
          <label><span>${t("an_login")}</span><input id="anLogin" autocomplete="off"></label>
          <label><span>${t("an_pass")}</span><input id="anPass" autocomplete="off"></label>
        </div>
        <div class="an-acc-scope-pick">
          <span class="an-acc-scope-lb">${t("an_scopes")}</span>
          ${["bozor","moliya","mehnat"].map(m=>`<label class="an-chip"><input type="checkbox" class="anScope" value="${m}" checked><span>${m}</span></label>`).join("")}
        </div>
        <div class="an-acc-actions">
          <button class="btn btn-primary" type="button" id="anAdd">${t("an_add")}</button>
          <a class="an-acc-open" href="tahlil.html" target="_blank" rel="noopener">${t("an_open")}</a>
        </div>
      </div>
    </div>`;

  const box=host.querySelector("#anCard");
  box.querySelector("#anAdd").addEventListener("click",async ()=>{
    const login=box.querySelector("#anLogin").value.trim();
    const pass=box.querySelector("#anPass").value.trim();
    if(!login||!pass) return UI.alert(t("an_need"));
    const scopes=[...box.querySelectorAll(".anScope")].filter(x=>x.checked).map(x=>x.value);
    if(!scopes.length) return UI.alert(t("an_need_scope"));
    const res=await analystApi({op:"add",name:box.querySelector("#anName").value.trim(),
      org:box.querySelector("#anOrg").value.trim(),alogin:login,apassword:pass,scopes});
    if(res && res.error==="login_exists") return UI.alert(t("an_exists"));
    if(res && res.error==="no_scopes") return UI.alert(t("an_need_scope"));
    renderAnalysts();
  });
  box.querySelectorAll("[data-an-del]").forEach(b=>b.addEventListener("click",async ()=>{
    if(!await UI.confirm(t("an_confirm"), { tone:"danger" })) return;
    await analystApi({op:"del",id:b.dataset.anDel});
    renderAnalysts();
  }));
}

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
      <div id="gCard" style="margin-top:26px;padding-top:22px;border-top:1px solid var(--line)">
        <h3 style="font-size:15px;margin:0 0 6px">${t("g_title")}</h3>
        <p class="ac-label">${t("g_sub")}</p>
      </div>
    </div>`;
  $("#thLight").addEventListener("click",()=>{setTheme("light");renderSettings();});
  $("#thDark").addEventListener("click",()=>{setTheme("dark");renderSettings();});
  $("#view-settings").querySelectorAll("[data-l]").forEach(b=>b.addEventListener("click",()=>setLang(b.dataset.l)));
  renderGoogleCard();
}

/* ---- the Google session the Meet bot drives ---- */
const gPost=(p)=>fetch("/api/google/"+p,{method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({pass:"admin"})}).then(r=>r.json());

function renderGoogleCard(note){
  const card=$("#gCard"); if(!card) return;
  fetch("/api/google/status").then(r=>r.json()).then(g=>{
    const body=document.createElement("div");
    body.className="g-body"; body.style.marginTop="12px";
    if(!g.available){
      body.innerHTML=`<p class="ac-label" style="color:var(--gold)">${t("g_nochrome")}</p>`;
    } else {
      const dot=g.signedIn?"var(--green)":"var(--gold)";
      body.innerHTML=`<p style="font-size:14px;margin:0 0 10px">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dot};margin-right:8px"></span>
          <b>${g.signedIn?t("g_on"):t("g_off")}</b>${g.signedIn&&g.email?` · ${escAttr(g.email)}`:""}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" id="gIn">${g.signedIn?t("g_relogin"):t("g_login")}</button>
          <button class="btn btn-ghost" id="gChk">${t("g_check")}</button>
          ${g.signedIn?`<button class="btn btn-ghost" id="gOff">${t("g_disconnect")}</button>`:""}
        </div>
        ${note?`<p class="ac-label" style="margin-top:10px;color:var(--green)">${note}</p>`:""}
        <p class="ac-label" style="margin-top:10px">${t("g_note")}</p>`;
    }
    card.querySelectorAll(".g-body").forEach(n=>n.remove());
    card.appendChild(body);

    const busy=(b)=>{ b.disabled=true; b.textContent=t("g_working"); };
    const gIn=$("#gIn"), gChk=$("#gChk"), gOff=$("#gOff");
    // opens a real Chrome window on the server machine — the human types there
    if(gIn) gIn.addEventListener("click",()=>{ busy(gIn); gPost("login").then(()=>renderGoogleCard(t("g_opening"))); });
    if(gChk) gChk.addEventListener("click",()=>{ busy(gChk); gPost("verify").then(()=>renderGoogleCard()); });
    if(gOff) gOff.addEventListener("click",()=>{ busy(gOff); gPost("disconnect").then(()=>renderGoogleCard()); });
  }).catch(()=>{});
}

function renderView(){
  ["dashboard","associations","members","companies","leads","questions","projects","chat","report","conference","appeals","dsr","analysts","buyers","settings"].forEach(v=>$("#view-"+v)&&$("#view-"+v).classList.toggle("active",v===activeView));
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
  if(activeView==="appeals")renderAppeals();
  if(activeView==="dsr")renderDsr();
  if(activeView==="analysts")renderAnalysts();
  if(activeView==="buyers")renderBuyers();
  if(activeView==="settings")renderSettings();
  $("#viewTitle").textContent=t(VIEW_TITLE[activeView]);
}

/* ============================================================
   BUYER APPLICATIONS

   The company queue lives in the association cabinet, because an
   association is who vouches for a company. Nobody vouches for a
   buyer, so this queue has exactly one home: here.

   Approving one is what creates the account, which is why the
   confirmation says so plainly and a rejection demands a reason —
   the applicant reads it on the status page.
   ============================================================ */
let BQ_TAB = "pending";

const bqApi = (path, body) =>
  fetch("/api/register/" + path, { method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify(Object.assign({ pass:"admin", kind:"buyer" }, body||{})) })
    .then(r=>r.json()).catch(()=>({ error:"network" }));

async function renderBuyers(){
  const host=$("#view-buyers");
  host.innerHTML=`<div class="admin-panel">
    <h2>${t("bq_title")}</h2>
    <p style="color:var(--muted);font-size:14px;margin-bottom:8px">${t("bq_sub")}</p>
    <div class="rq-tabs" id="bqTabs"></div>
    <div class="rq-list" id="bqList"><p style="color:var(--muted)">…</p></div>
  </div>`;

  const r = await bqApi("list", { status: BQ_TAB==="all" ? "" : BQ_TAB });
  if(!r || !r.ok){ $("#bqList").innerHTML=`<p class="empty-note">${t("bq_fail")}</p>`; return; }

  const pending=(r.counts&&r.counts.pending)||0;
  $("#bqTabs").innerHTML=["pending","approved","rejected","all"].map(k=>
    `<button type="button" class="rq-tab${k===BQ_TAB?" is-on":""}" data-bq-tab="${k}">${
      t("bq_"+k)}${k==="pending"&&pending?` <em>${pending}</em>`:""}</button>`).join("");

  const items=r.items||[];
  $("#bqList").innerHTML = items.length
    ? items.map(bqCard).join("")
    : `<p class="empty-note">${t("bq_empty")}</p>`;
}

function bqCard(a){
  const e=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const row=(k,v)=>v?`<dt>${t(k)}</dt><dd>${e(v)}</dd>`:"";
  const tel=String(a.phone||"").replace(/[^+0-9]/g,"");
  const ctel=String(a.contactPhone||"").replace(/[^+0-9]/g,"");
  return `<article class="rq-card is-${e(a.status)}">
    <div class="rq-top">
      <span class="rq-badge">${t("bq_"+a.status)}</span>
      <b>${e(a.name)}</b>
      <span class="rq-ref">${e(a.ref)}</span>
    </div>
    ${a.about?`<p class="rq-about">${e(a.about)}</p>`:""}
    <dl class="rq-kv">
      ${row("bq_login", a.login)}
      ${row("bq_contact", [a.contactName, a.role].filter(Boolean).join(" · "))}
      ${row("bq_region", a.region)}
      <dt>${t("bq_sent")}</dt><dd>${new Date(a.created).toLocaleString()}</dd>
      ${a.decided?`<dt>${t("bq_decided")}</dt><dd>${new Date(a.decided).toLocaleString()} · ${e(a.decidedBy||"")}</dd>`:""}
    </dl>
    <div class="rq-contact">
      ${tel?`<a href="tel:${e(tel)}">🏢 ${e(a.phone)}</a>`:""}
      ${a.email?`<a href="mailto:${e(a.email)}">✉ ${e(a.email)}</a>`:""}
      ${ctel?`<a href="tel:${e(ctel)}">📞 ${e(a.contactPhone)}</a>`:""}
    </div>
    ${a.reason?`<p class="rq-reason">${t("bq_reason")}: ${e(a.reason)}</p>`:""}
    ${a.status==="pending"?`<div class="rq-actions">
      <button class="btn btn-primary" type="button" data-bq-ok="${e(a.id)}">${t("bq_approve")}</button>
      <button class="btn btn-ghost" type="button" data-bq-no="${e(a.id)}">${t("bq_reject")}</button>
    </div>`:""}
  </article>`;
}

document.addEventListener("click", async e=>{
  const tab=e.target.closest&&e.target.closest("[data-bq-tab]");
  if(tab){ BQ_TAB=tab.dataset.bqTab; return renderBuyers(); }

  const ok=e.target.closest&&e.target.closest("[data-bq-ok]");
  const no=e.target.closest&&e.target.closest("[data-bq-no]");
  if(!ok&&!no) return;
  const btn=ok||no;
  if(btn.disabled) return;

  const data={ id: ok?ok.dataset.bqOk:no.dataset.bqNo, action: ok?"approve":"reject" };
  if(ok){ if(!await UI.confirm(t("bq_confirm"))) return; }
  else {
    /* A rejection the applicant cannot understand is worse than none, so the
       reason is required — the server refuses without one either way. */
    const reason=await UI.prompt(t("bq_reason_q"));
    if(!reason||!reason.trim()) return;
    data.reason=reason.trim();
  }

  btn.disabled=true;
  const r=await bqApi("decide", data);
  btn.disabled=false;
  if(!r||!r.ok) return UI.alert(t("bq_fail"));
  renderBuyers();
});

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
/* One login system: whatever tier these credentials belong to, the shared
   resolver in auth.js finds it and says where to go. Typing a company or
   analyst login here sends you to that cabinet instead of refusing you. */
$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();
  const btn=$("#lgBtn"), login=($("#lgLogin")?$("#lgLogin").value.trim():""), pass=$("#lgPass").value;
  btn.disabled=true; $("#lgErr").textContent="";
  try{
    const target=await kgResolveLogin(login,pass);
    if(target==="admin.html"){ openPanel(); return; }
    if(target){ location.href=target; return; }
    $("#lgErr").textContent=t("lg_err");
    $("#lgPass").value="";
  }catch(_){ $("#lgErr").textContent=t("lg_err"); }
  finally{ btn.disabled=false; }
});
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
