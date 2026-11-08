/* ============================================================
   MOLIYA BOZORI — INVESTOR TOMONI: uch tilli lug'at (uz / ru / en)

   Shakl T_MS bilan bir xil: kalit -> [uz, ru, en], LANGS tartibida.
   {n} ko'rinishidagi o'rinbosarlar chaqiruv joyida .replace() bilan
   to'ldiriladi — avval esc(), keyin replace.

   T_MS_INV — YALANG'OCH fragment: u na T_MK, na T_MS ni meros
   qilmaydi. moliya-investor.js uni T_MOLIYA va T_MS ustiga qo'yib
   BITTA setDict() chaqiradi, chunki setDict lug'atni almashtiradi.

   Nega ms_* kalitlari qayta yozilmaydi: ustun sarlavhasi, sektor
   nomi va "barcha holatlar" kabi narsalar ikkala sahifada AYNAN bir
   xil jumla bo'lishi kerak — nusxa ko'chirilsa, bir kun ular
   ayriladi va foydalanuvchi bitta tushunchani ikki nom bilan
   ko'radi. Shu sababli bu yerda faqat qabulxonaning O'Z so'zlari.
   ============================================================ */
const T_MS_INV = {

  /* --- Hero va navigatsiya --- */
  msi_eyebrow:          ["INSTITUT QABULXONASI", "ПРИЁМНАЯ ИНСТИТУТА", "INSTITUTION INBOX"],
  msi_h1:               ["Sizga <span class=\"mk-hl\">yönaltirilgan</span> loyihalar", "Проекты, <span class=\"mk-hl\">направленные</span> вам", "Projects <span class=\"mk-hl\">routed</span> to you"],
  msi_lead:             ["Skoring navbatidan ötgan va sizning qabul mezonlaringizga mos kelgan loyihalar. Har biri böyiça dossier oçing, qiziqişingizni belgilang va özingiz uçun izoh yozing.", "Проекты, прошедшие скоринговую очередь и совпавшие с вашими критериями приёма. По каждому откройте досье, отметьте интерес и оставьте заметку для себя.", "Projects that cleared the scoring queue and matched your acceptance criteria. Open the dossier on each one, mark your interest and keep a note for yourself."],
  msi_pulse_queue:      ["Navbatda", "В очереди", "In queue"],
  msi_pulse_shortlist:  ["Qisqa röyxat", "Шорт-лист", "Shortlist"],
  msi_nav_inbox:        ["Qabulxona", "Приёмная", "Inbox"],
  msi_nav_settings:     ["Qabul mezonlari", "Критерии приёма", "Acceptance criteria"],

  /* --- Kim sifatida ko'ryapsiz --- */
  msi_actor_inst:       ["Institut sifatida", "Как институт", "As an institution"],
  msi_actor_expert:     ["Ekspert körinişi", "Режим эксперта", "Expert view"],
  msi_actor_expert_sub: ["Siz butun navbatni körasiz. Qiziqiş bildiriş va qabul mezonlari — institutning işi, şuning uçun bu sahifada ular yopiq.", "Вы видите всю очередь. Отметка интереса и критерии приёма — работа института, поэтому здесь они закрыты.", "You see the whole queue. Marking interest and acceptance criteria belong to an institution, so they are closed on this page."],
  msi_actor_registry:   ["{n} mahsulot reyestrda", "{n} продукт(ов) в реестре", "{n} product(s) in the registry"],
  msi_actor_none:       ["Reyestrda mahsulotingiz yöq", "В реестре нет ваших продуктов", "No products of yours in the registry"],

  /* --- Qabulxona sarlavhasi --- */
  msi_title:            ["Qabulxona", "Приёмная", "Inbox"],
  msi_sub:              ["Faqat sizning mahsulotlaringizga yönaltirilgan loyihalar. Boşqa institutlarning qiziqişi bu yerda körinmaydi.", "Только проекты, направленные на ваши продукты. Интерес других институтов здесь не виден.", "Only projects routed to your products. Other institutions' interest is not visible here."],
  msi_title_expert:     ["Skoring navbati", "Скоринговая очередь", "Scoring queue"],
  msi_sub_expert:       ["Yuborilgan, körib çiqilayotgan, tasdiqlangan va rad etilgan loyihalarning töliq navbati.", "Полная очередь отправленных, рассматриваемых, одобренных и отклонённых проектов.", "The full queue of submitted, in-review, approved and rejected projects."],

  /* --- Statistika plitkalari --- */
  msi_stat_total:       ["Navbatda", "В очереди", "In queue"],
  msi_stat_total_sub:   ["filtrdan keyingi loyihalar", "проектов после фильтра", "projects after the filter"],
  msi_stat_fresh:       ["Körilmagan", "Не просмотрено", "Untouched"],
  msi_stat_fresh_sub:   ["hali qaror yozilmagan", "решение ещё не записано", "no decision recorded yet"],
  msi_stat_shortlist:   ["Qisqa röyxat", "Шорт-лист", "Shortlist"],
  msi_stat_shortlist_sub: ["çuqur körikka olingan", "взяты на углублённый обзор", "taken for deeper review"],
  msi_stat_avg:         ["Örtaça ball", "Средний балл", "Average score"],
  msi_stat_avg_sub:     ["baholangan loyihalar böyiça", "по оценённым проектам", "across scored projects"],

  /* --- Filtr --- */
  msi_search:           ["Loyiha nomi yoki taşabbuskor böyiça qidiriş...", "Поиск по названию проекта или инициатору...", "Search by project name or initiator..."],
  msi_all_regions:      ["Barça hududlar", "Все регионы", "All regions"],
  msi_all_interest:     ["Qiziqişdan qatʼi nazar", "Независимо от интереса", "Any interest state"],
  msi_int_new:          ["Körilmagan", "Не просмотрен", "Untouched"],
  msi_int_interested:   ["Qiziqdim", "Интересен", "Interested"],
  msi_int_shortlist:    ["Qisqa röyxat", "Шорт-лист", "Shortlist"],
  msi_int_passed:       ["Ötkazib yubordim", "Пропущен", "Passed"],

  /* --- Jadval --- */
  msi_col_matched:      ["Mos mahsulot", "Совпало продуктов", "Matched"],
  msi_col_interest:     ["Qarorim", "Моё решение", "My decision"],
  msi_col_submitted:    ["Yuborilgan", "Отправлен", "Submitted"],
  msi_open:             ["Dossier →", "Досье →", "Dossier →"],
  msi_count:            ["{n} ta loyiha", "проектов: {n}", "{n} projects"],
  msi_matched_n:        ["{n} ta", "{n} шт.", "{n}"],

  /* --- Uch xil bo'sh ekran --- */
  msi_empty_setup_title: ["Siz hali heç qanday mahsulotni navbatga oçmadingiz", "Вы ещё не открыли ни один продукт для очереди", "You have not opened any product to the queue yet"],
  msi_empty_setup_sub:  ["Qabulxona böş emas — u hali yoqilmagan. Mahsulotga \"navbatdan qabul qilaman\" belgisini qöying, şundan keyin mos loyihalar şu yerga tuşa boşlaydi.", "Приёмная не пуста — она ещё не включена. Отметьте продукт как принимающий из очереди, и подходящие проекты начнут поступать сюда.", "The inbox is not empty — it is not switched on yet. Mark a product as accepting from the queue and matching projects will start arriving here."],
  msi_empty_setup_cta:  ["Qabul mezonlarini oçiş", "Открыть критерии приёма", "Open acceptance criteria"],
  msi_empty_wait_title_exp: ["Navbat böş", "Очередь пуста", "The queue is empty"],
  msi_empty_wait_sub_exp:   ["Hali heç bir loyiha navbatga qöyilmagan. Taşabbuskor loyihani 75 balldan yuqori baholagandan keyin uni yuboradi.",
                             "Ни один проект ещё не поставлен в очередь. Инициатор отправляет проект после оценки выше 75 баллов.",
                             "No project has entered the queue yet. An initiator submits a project once it scores above 75 points."],
  msi_empty_wait_title: ["Hozirça sizga loyiha yönaltirilmagan", "Пока вам не направлен ни один проект", "No project has been routed to you yet"],
  msi_empty_wait_sub:   ["Mezonlaringiz yoqilgan. Loyiha summasi, valyutasi, sektori, muddati va bali mezonlaringizga töliq mos kelgan onda u şu yerda paydo böladi.", "Ваши критерии включены. Проект появится здесь в тот момент, когда его сумма, валюта, сектор, срок и балл полностью совпадут с ними.", "Your criteria are on. A project appears here the moment its amount, currency, sector, tenor and score fully match them."],
  msi_empty_filter_title: ["Filtr böyiça heç narsa topilmadi", "По фильтру ничего не найдено", "Nothing matched the filter"],
  msi_empty_filter_sub: ["Navbatda loyihalar bor, lekin joriy filtr ularning heç biriga töğri kelmadi.", "В очереди есть проекты, но текущий фильтр не подошёл ни к одному из них.", "There are projects in the queue, but the current filter matched none of them."],

  /* --- Dossier --- */
  msi_back:             ["← Qabulxonaga qaytiş", "← Вернуться в приёмную", "← Back to the inbox"],
  msi_owner:            ["Taşabbuskor", "Инициатор", "Initiator"],
  msi_submitted_on:     ["Yuborilgan: {d}", "Отправлен: {d}", "Submitted: {d}"],
  msi_passport:         ["Loyiha pasporti", "Паспорт проекта", "Project passport"],
  msi_docs:             ["Ilova qilingan hujjatlar", "Приложенные документы", "Attached documents"],
  msi_docs_none:        ["Hujjat ilova qilinmagan.", "Документы не приложены.", "No documents attached."],
  msi_matched_title:    ["Nima uçun sizga keldi", "Почему проект пришёл к вам", "Why this reached you"],
  msi_matched_sub:      ["Yuborilgan onda bu loyiha sizning {n} ta mahsulotingizning mezonlariga mos tuşgan. Moslik öşa ondagi fakt — mezonni keyin özgartiriş röyxatni qayta yozmaydi.", "В момент отправки проект совпал с критериями {n} ваших продуктов. Совпадение — факт того момента: изменение критериев позже не переписывает список.", "At the moment of submission this project matched the criteria of {n} of your products. The match is a fact of that moment — changing criteria later does not rewrite the list."],
  msi_detail_missing:   ["Moliyaviy tarix va pul oqimi modeli bu dossierda oçilmagan.", "Финансовая история и модель денежных потоков в этом досье не раскрыты.", "The financial history and the cash-flow model are not exposed in this dossier."],

  /* --- Qiziqish paneli --- */
  msi_int_title:        ["Sizning qaroringiz", "Ваше решение", "Your decision"],
  msi_int_sub:          ["Qaror loyihaning rasmiy holatini özgartirmaydi — holat zanjiri ekspertning işi. Bu faqat sizning öz hisobingiz.", "Решение не меняет официальный статус проекта — цепочка статусов принадлежит эксперту. Это только ваш собственный учёт.", "A decision does not change the project's official status — the status chain belongs to the expert. This is your own record only."],
  msi_int_private:      ["IZOH SIZDA QOLADI", "ЗАМЕТКА ОСТАЁТСЯ У ВАС", "THE NOTE STAYS WITH YOU"],
  msi_int_private_sub:  ["Izohni na taşabbuskor, na boşqa institut köradi. \"Ötkazib yubordim\" qarori ham faqat sizning yozuvingiz — loyiha egasiga körsatilmaydi.", "Заметку не видят ни инициатор, ни другой институт. Решение \"Пропущен\" — тоже только ваша запись, владельцу проекта она не показывается.", "Neither the initiator nor another institution sees the note. A \"Passed\" decision is likewise only your record — it is never shown to the project owner."],
  msi_int_note:         ["Içki izoh", "Внутренняя заметка", "Internal note"],
  msi_int_note_ph:      ["Nega qiziqdingiz, nima yetişmayapti, kim bilan gaplaşiş kerak...", "Почему интересен, чего не хватает, с кем поговорить...", "Why it is interesting, what is missing, whom to talk to..."],
  msi_int_save:         ["Qarorni saqlaş", "Сохранить решение", "Save decision"],
  msi_int_saved:        ["Qaror saqlandi.", "Решение сохранено.", "Decision saved."],
  msi_int_current:      ["Joriy qaror", "Текущее решение", "Current decision"],
  msi_int_none:         ["Hali yozilmagan", "Ещё не записано", "Not recorded yet"],
  msi_int_updated:      ["{d} da yangilangan", "обновлено {d}", "updated {d}"],
  msi_int_pick:         ["Avval uçta qarordan birini tanlang.", "Сначала выберите одно из трёх решений.", "Pick one of the three decisions first."],
  msi_int_expert:       ["Qiziqiş bildiriş — institutning huquqi. Ekspert sifatida siz navbatni körasiz, lekin loyiha nomidan qaror yozmaysiz.", "Отметка интереса — право института. Как эксперт вы видите очередь, но не записываете решение от имени института.", "Marking interest is an institution's right. As an expert you see the queue but do not record a decision on an institution's behalf."],

  /* --- Qabul mezonlari --- */
  msi_set_title:        ["Qabul mezonlari", "Критерии приёма", "Acceptance criteria"],
  msi_set_sub:          ["Har bir moliya mahsulotingiz — bu sizning navbatdagi ovozingiz. Belgini yoqing va ostonani qöying: şundan keyin mos loyihalar qabulxonangizga tuşa boşlaydi.", "Каждый ваш финансовый продукт — это ваш голос в очереди. Включите отметку и задайте порог: после этого подходящие проекты начнут поступать в вашу приёмную.", "Each of your financial products is your voice in the queue. Switch the flag on and set the threshold: matching projects then start arriving in your inbox."],
  msi_set_routable:     ["Navbatdan qabul qilaman", "Принимаю из очереди", "Accept from the queue"],
  msi_set_routable_hint: ["Belgi öçirilsa mahsulot reyestrdan çiqadi, ammo allaqaçon yönaltirilgan loyihalar qabulxonada qoladi.", "Если отметка снята, продукт выходит из реестра, но уже направленные проекты остаются в приёмной.", "With the flag off the product leaves the registry, but already routed projects stay in the inbox."],
  msi_set_minscore:     ["Minimal ball", "Минимальный балл", "Minimum score"],
  msi_set_minscore_hint: ["0 dan 100 gaça. Loyiha bali şu ostonadan past bölsa, u sizga yönaltirilmaydi.", "От 0 до 100. Если балл проекта ниже порога, он вам не направляется.", "From 0 to 100. A project scoring below the threshold is not routed to you."],
  msi_set_save:         ["Saqlaş", "Сохранить", "Save"],
  msi_set_saved:        ["Mezon saqlandi.", "Критерий сохранён.", "Criterion saved."],
  msi_set_registry:     ["Reyestrda: {n}", "В реестре: {n}", "In the registry: {n}"],
  msi_set_eligible:     ["Reyestrga tuşadi", "Попадает в реестр", "Enters the registry"],
  msi_set_not_eligible: ["Reyestrga tuşmaydi", "Не попадает в реестр", "Does not enter the registry"],
  msi_set_why_status:   ["Mahsulot \"jonli\" holatida emas — hozirgi holati: {s}.", "Продукт не в статусе \"живой\" — текущий статус: {s}.", "The product is not \"live\" — current status: {s}."],
  msi_set_why_currency: ["{c} valyutasi skoring metodikasida yöq, şuning uçun moslik hisoblanmaydi.", "Валюта {c} отсутствует в методике скоринга, поэтому совпадение не считается.", "The currency {c} is absent from the scoring methodology, so matching cannot be computed."],
  msi_prod_live:        ["Jonli", "Живой", "Live"],
  msi_prod_archived:    ["Arxivlangan", "В архиве", "Archived"],
  msi_set_limits:       ["Summa", "Сумма", "Amount"],
  msi_set_tenor:        ["Maksimal muddat", "Максимальный срок", "Maximum tenor"],
  msi_set_sectors:      ["Sektorlar", "Секторы", "Sectors"],
  msi_set_sectors_all:  ["Barça sektorlar", "Все секторы", "All sectors"],
  msi_set_empty_title:  ["Sizda moliya mahsuloti yöq", "У вас нет финансовых продуктов", "You have no financial products"],
  msi_set_empty_sub:    ["Qabul mezonlari mahsulotga biriktiriladi. Avval kompaniya kabinetida kamida bitta moliya mahsulotini eʼlon qiling.", "Критерии приёма привязаны к продукту. Сначала опубликуйте хотя бы один финансовый продукт в кабинете компании.", "Acceptance criteria attach to a product. Publish at least one financial product in the company cabinet first."],
  msi_set_empty_cta:    ["Kompaniya kabineti", "Кабинет компании", "Company cabinet"],
  msi_set_expert_title: ["Qabul mezonlari institutga tegişli", "Критерии приёма принадлежат институту", "Acceptance criteria belong to an institution"],

  /* --- Kirish va xatolar --- */
  msi_login_title:      ["Qabulxonani oçiş uçun kiring", "Войдите, чтобы открыть приёмную", "Sign in to open the inbox"],
  msi_login_sub:        ["Institut — alohida hisob turi emas: bu moliya mahsuloti bor kompaniya hisobi. Ekspert esa admin paroli bilan kiradi.", "Институт — не отдельный тип аккаунта: это аккаунт компании с финансовым продуктом. Эксперт входит по паролю администратора.", "An institution is not a separate account type: it is a company account with a financial product. An expert signs in with the admin password."],
  msi_login_cta:        ["Kompaniya sifatida kiriş", "Войти как компания", "Sign in as a company"],
  msi_err_company:      ["Bu amal kompaniya hisobini talab qiladi — institut nomidan faqat u gapira oladi.", "Это действие требует аккаунта компании — только он говорит от имени института.", "This action requires a company account — only it speaks for an institution."],
  msi_actor_guest:      ["Mehmon sifatida", "\u041a\u0430\u043a \u0433\u043e\u0441\u0442\u044c", "As a guest"],
  msi_actor_guest_sub:  ["Siz faqat e-mail bilan tanildingiz. Qabulxona kompaniya hisobini talab qiladi.",
                         "\u0412\u044b \u0443\u0437\u043d\u0430\u043d\u044b \u0442\u043e\u043b\u044c\u043a\u043e \u043f\u043e e-mail. \u041f\u0440\u0438\u0451\u043c\u043d\u0430\u044f \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u043a\u043e\u0440\u043f\u043e\u0440\u0430\u0442\u0438\u0432\u043d\u043e\u0433\u043e \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430.",
                         "You are identified only by e-mail. The inbox requires a company account."],
  msi_actor_guest_cta:  ["Kompaniya sifatida kiriş", "\u0412\u043e\u0439\u0442\u0438 \u043a\u0430\u043a \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u044f", "Sign in as a company"],
  msi_empty_guest_title:["Qabulxona kompaniya hisobiga boğlangan", "\u041f\u0440\u0438\u0451\u043c\u043d\u0430\u044f \u043f\u0440\u0438\u0432\u044f\u0437\u0430\u043d\u0430 \u043a \u043a\u043e\u0440\u043f\u043e\u0440\u0430\u0442\u0438\u0432\u043d\u043e\u043c\u0443 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0443", "The inbox is tied to a company account"],
  msi_empty_guest_sub:  ["Institut — bu moliya mahsuloti bor kompaniya hisobi. Kirgandan söng mahsulotlaringizni navbatga oçasiz.",
                         "\u0418\u043d\u0441\u0442\u0438\u0442\u0443\u0442 \u2014 \u044d\u0442\u043e \u043a\u043e\u0440\u043f\u043e\u0440\u0430\u0442\u0438\u0432\u043d\u044b\u0439 \u0430\u043a\u043a\u0430\u0443\u043d\u0442 \u0441 \u0444\u0438\u043d\u0430\u043d\u0441\u043e\u0432\u044b\u043c \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u043e\u043c. \u041f\u043e\u0441\u043b\u0435 \u0432\u0445\u043e\u0434\u0430 \u0432\u044b \u043e\u0442\u043a\u0440\u043e\u0435\u0442\u0435 \u0441\u0432\u043e\u0438 \u043f\u0440\u043e\u0434\u0443\u043a\u0442\u044b \u043e\u0447\u0435\u0440\u0435\u0434\u0438.",
                         "An institution is a company account with a financial product. After signing in you open your products to the queue."],
  /* Ekspert paneli — rasmiy holat zanjiri. Institutning qiziqishidan
     ataylab boshqa so'z bilan ataladi: biri fikr, ikkinchisi qaror. */
  msi_exp_title:        ["Rasmiy qaror", "Официальное решение", "Official decision"],
  msi_exp_sub:          ["Bu qaror platforma nomidan yoziladi va audit iziga tuşadi.",
                         "Это решение фиксируется от имени платформы и попадает в аудит-след.",
                         "This decision is recorded on behalf of the platform and enters the audit trail."],
  msi_exp_current:      ["Joriy holat:", "Текущий статус:", "Current status:"],
  msi_exp_note:         ["Izoh (audit iziga tuşadi)", "Комментарий (в аудит-след)", "Comment (enters the audit trail)"],
  msi_exp_final:        ["Bu loyiha uçun qaror allaqaçon qabul qilingan — keyingi ötiş yöq.",
                         "По этому проекту решение уже принято — дальнейших переходов нет.",
                         "A decision has already been made on this project — there is no further transition."],
  msi_err_notfound:     ["Loyiha topilmadi yoki navbatdan çiqarilgan.", "Проект не найден или выведен из очереди.", "The project was not found or has left the queue."],
  msi_err_badstate:     ["Nomaʼlum qaror holati.", "Неизвестное состояние решения.", "Unknown decision state."],
  msi_err_forbidden:    ["Bu loyiha sizga yönaltirilmagan.", "Этот проект вам не направлен.", "This project was not routed to you."],
};
