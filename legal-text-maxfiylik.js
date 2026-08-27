/* ============================================================
   MAXFIYLIK SIYOSATI — the personal-data policy (ZRU-547)

   This is the document the law is most specific about, so it
   is the one most often written as vague reassurance and most
   easily shown to be false. Three drafting rules kept it honest:

   1. NOTHING IS DESCRIBED THAT THE CODE DOES NOT DO. The
      categories table, the retention periods and the list of
      cross-border transfers are not written out here — they are
      SLOTS, rendered from srv/legal.js at display time. Adding
      a field to a form without adding it to COLLECTED leaves a
      gap a reader can see; writing a category into the policy
      that nothing collects is impossible. Modda 22 wants the
      person told what is really held, and a policy that can
      drift from the code cannot deliver that.

   2. THE LOCALISATION SECTION SAYS WHY, NOT JUST WHAT. Between
      2021 and March 2026 every Uzbek citizen's personal data
      had to sit on servers inside the country. ZRU-1125
      (2026-yil 26-mart) narrowed that to biometric data,
      genetic data, and telecom users' data. Readers who
      remember the old rule will assume the platform is in
      breach unless the section explains the change — so it
      does, with the article cited.

   3. RIGHTS ARE STATED WITH THE ROUTE THAT SERVES THEM. Each
      right names the button that exercises it and the deadline
      it is answered in. A right with no mechanism is a claim,
      not a right.
   ============================================================ */
const LEGAL_MAXFIYLIK = {
  key: "maxfiylik",

  lead: {
    uz: "Ushbu siyosat {brand} platformasi shaxsga doir ma'lumotlarni qanday to'plashi, qayta ishlashi, saqlashi va himoya qilishini tushuntiradi. U «Shaxsga doir ma'lumotlar to'g'risida»gi O'zbekiston Respublikasi Qonuni (2019-yil 2-iyul, ZRU-547, keyingi o'zgartirishlar bilan) talablariga asoslanadi.",
    ru: "Настоящая политика объясняет, как платформа {brand} собирает, обрабатывает, хранит и защищает персональные данные. Она основана на требованиях Закона Республики Узбекистан «О персональных данных» (2 июля 2019 года, ЗРУ-547, с последующими изменениями).",
  },

  sections: [
    { h: { uz: "1. Ma'lumotlar bazasining egasi", ru: "1. Владелец базы персональных данных" },
      slot: "operator",
      p: [
        { uz: "Shaxsga doir ma'lumotlar bazasining egasi va operatori quyidagi yuridik shaxsdir. Ma'lumotlaringizga oid har qanday murojaatni shu manzillarga yuborishingiz mumkin.",
          ru: "Владельцем и оператором базы персональных данных является указанное ниже юридическое лицо. Любое обращение по поводу ваших данных вы можете направить по этим адресам." },
      ] },

    { h: { uz: "2. Qanday ma'lumotlar to'planadi va nima uchun",
           ru: "2. Какие данные собираются и для чего" },
      p: [
        { uz: "Quyidagi jadval Platforma haqiqatda to'playdigan ma'lumotlar toifalarini va har birining aniq maqsadini ko'rsatadi. Jadval tizim sozlamalaridan bevosita shakllantiriladi — bu unda ko'rsatilmagan ma'lumot to'planmasligini kafolatlaydi.",
          ru: "Приведённая ниже таблица показывает категории данных, которые Платформа действительно собирает, и конкретную цель по каждой из них. Таблица формируется непосредственно из настроек системы — это гарантирует, что не собираются данные, в ней не указанные." },
      ],
      slot: "collected",
      after: [
        { uz: "Platforma biometrik va genetik ma'lumotlarni (yuz tasviri, barmoq izi, DNK ma'lumotlari) to'plamaydi va qayta ishlamaydi.",
          ru: "Платформа не собирает и не обрабатывает биометрические и генетические данные (изображение лица, отпечатки пальцев, данные ДНК)." },
      ] },

    { h: { uz: "3. Qayta ishlash uchun huquqiy asos", ru: "3. Правовое основание обработки" },
      list: [
        { uz: "Sub'ektning roziligi (ZRU-547 21-modda) — ro'yxatdan o'tishda beriladi. Rozilik berilgan vaqt, hujjat versiyasi va texnik ma'lumotlar Operator tomonidan isbot sifatida qayd etiladi, chunki rozilik berilganini isbotlash majburiyati Operator zimmasida.",
          ru: "Согласие субъекта (ст. 21 ЗРУ-547) — даётся при регистрации. Время дачи согласия, версия документа и технические сведения фиксируются Оператором в качестве доказательства, поскольку обязанность доказать факт согласия лежит на Операторе." },
        { uz: "Shartnomani bajarish — Foydalanuvchi bilan tuzilgan ommaviy oferta shartlarini bajarish uchun zarur bo'lgan ma'lumotlar.",
          ru: "Исполнение договора — данные, необходимые для исполнения условий публичной оферты, заключённой с Пользователем." },
        { uz: "Qonun bilan yuklangan majburiyat — buxgalteriya, soliq va arxiv talablari doirasida saqlanadigan ma'lumotlar.",
          ru: "Исполнение обязанности, возложенной законом, — данные, хранимые в рамках бухгалтерских, налоговых и архивных требований." },
      ] },

    { h: { uz: "4. Ma'lumotlar kimga uzatiladi", ru: "4. Кому передаются данные" },
      list: [
        { uz: "Foydalanuvchi ro'yxatdan o'tishda tanlagan Uyushmaga — arizani ko'rib chiqish va a'zolikni tasdiqlash uchun.",
          ru: "Ассоциации, выбранной Пользователем при регистрации, — для рассмотрения заявки и подтверждения членства." },
        { uz: "Kontragentga — Foydalanuvchining o'zi so'rov, taklif yoki yozishma orqali bog'langan boshqa Foydalanuvchiga, faqat aloqa uchun zarur hajmda.",
          ru: "Контрагенту — другому Пользователю, с которым Пользователь сам вступил в контакт посредством запроса, предложения или переписки, только в объёме, необходимом для связи." },
        { uz: "Vakolatli davlat organlariga — faqat qonunchilikda belgilangan asos va tartibda, rasmiy so'rov bo'yicha.",
          ru: "Уполномоченным государственным органам — исключительно по основаниям и в порядке, установленным законодательством, по официальному запросу." },
        { uz: "Operator nomidan xizmat ko'rsatuvchi qayta ishlovchilarga — 5-bandda ko'rsatilgan hajmda.",
          ru: "Обработчикам, оказывающим услуги от имени Оператора, — в объёме, указанном в пункте 5." },
      ],
      after: [
        { uz: "Operator shaxsga doir ma'lumotlarni sotmaydi va reklama maqsadida uchinchi shaxslarga bermaydi.",
          ru: "Оператор не продаёт персональные данные и не передаёт их третьим лицам в рекламных целях." },
      ] },

    { h: { uz: "5. Transchegaraviy uzatish", ru: "5. Трансграничная передача" },
      p: [
        { uz: "Ayrim xizmatlar O'zbekiston Respublikasidan tashqarida joylashgan qayta ishlovchilar tomonidan ko'rsatiladi. ZRU-547 27-1-moddasiga muvofiq bunday uzatish faqat qonunda nazarda tutilgan asoslardan biri mavjud bo'lganda amalga oshiriladi.",
          ru: "Отдельные услуги оказываются обработчиками, находящимися за пределами Республики Узбекистан. В соответствии со статьёй 27-1 ЗРУ-547 такая передача осуществляется только при наличии одного из предусмотренных законом оснований." },
      ],
      slot: "transfers" },

    { h: { uz: "6. Saqlash joyi va lokalizatsiya talabi",
           ru: "6. Место хранения и требование о локализации" },
      p: [
        { uz: "2021-yildan 2026-yil mart oyigacha O'zbekiston Respublikasi fuqarolarining barcha shaxsga doir ma'lumotlari mamlakat hududida joylashgan texnik vositalarda saqlanishi talab qilinar edi.",
          ru: "С 2021 года по март 2026 года требовалось хранить все персональные данные граждан Республики Узбекистан на технических средствах, размещённых на территории страны." },
        { uz: "2026-yil 26-martdagi ZRU-1125-son Qonuni ushbu talabni toraytirdi. Endi majburiy lokalizatsiya faqat quyidagilarga nisbatan qo'llaniladi: jismoniy shaxslarning biometrik ma'lumotlari; genetik ma'lumotlari; O'zbekistonda faoliyat yurituvchi telekommunikatsiya operatorlari xizmatlaridan foydalanuvchilarning ma'lumotlari. Faqat shu toifadagi bazalar Shaxsga doir ma'lumotlar bazalarining davlat reyestrida ro'yxatdan o'tkazilishi shart.",
          ru: "Закон № ЗРУ-1125 от 26 марта 2026 года сузил это требование. Обязательная локализация теперь применяется только к: биометрическим данным физических лиц; генетическим данным; данным пользователей услуг операторов телекоммуникаций, действующих в Узбекистане. Только базы этих категорий подлежат регистрации в Государственном реестре баз персональных данных." },
        { uz: "Platforma yuqoridagi uch toifadagi ma'lumotlarni to'plamaydi. Shu sababli unga majburiy lokalizatsiya talabi va davlat reyestrida ro'yxatdan o'tish majburiyati taalluqli emas. Agar kelajakda bunday ma'lumotlar to'planadigan bo'lsa, ushbu siyosat yangilanadi va tegishli ro'yxatdan o'tish amalga oshiriladi.",
          ru: "Платформа не собирает данные указанных трёх категорий. Поэтому требование об обязательной локализации и обязанность регистрации в государственном реестре к ней не применяются. Если в будущем такие данные будут собираться, настоящая политика будет обновлена и соответствующая регистрация будет произведена." },
      ] },

    { h: { uz: "7. Saqlash muddatlari", ru: "7. Сроки хранения" },
      p: [
        { uz: "Ma'lumotlar maqsadga erishilgunga qadar va quyida ko'rsatilgan muddatlarda saqlanadi. Muddat tugagach ular o'chiriladi yoki shaxsni aniqlash imkonini bermaydigan holatga keltiriladi.",
          ru: "Данные хранятся до достижения цели и в течение указанных ниже сроков. По истечении срока они удаляются либо приводятся в вид, не позволяющий определить лицо." },
      ],
      slot: "retention" },

    { h: { uz: "8. Himoya choralari", ru: "8. Меры защиты" },
      p: [
        { uz: "ZRU-547 27-moddasi Operatorga ma'lumotlarni ruxsatsiz kirishdan himoya qilish choralarini ko'rishni yuklaydi. Amalda qo'llanilayotgan choralar:",
          ru: "Статья 27 ЗРУ-547 обязывает Оператора принимать меры защиты данных от несанкционированного доступа. Применяемые на практике меры:" },
      ],
      list: [
        { uz: "Parollar ochiq ko'rinishda saqlanmaydi — ular scrypt algoritmi yordamida qaytarilmas kriptografik shaklga keltiriladi. Operator ham, uyushma ham, administrator ham foydalanuvchining parolini ko'ra olmaydi.",
          ru: "Пароли не хранятся в открытом виде — они приводятся к необратимой криптографической форме с помощью алгоритма scrypt. Ни Оператор, ни ассоциация, ни администратор не могут увидеть пароль пользователя." },
        { uz: "Ma'lumotlar uzatilishi TLS protokoli bilan shifrlanadi.",
          ru: "Передача данных шифруется по протоколу TLS." },
        { uz: "Kirish huquqi rollar bo'yicha cheklangan: uyushma faqat o'z a'zolarining arizalarini, kompaniya faqat o'z kabinetini ko'radi.",
          ru: "Права доступа разграничены по ролям: ассоциация видит только заявки своих членов, компания — только свой кабинет." },
        { uz: "Platformadagi muhim harakatlar jurnalga yozib boriladi.",
          ru: "Значимые действия на Платформе фиксируются в журнале." },
        { uz: "Ma'lumotlar bazasining zaxira nusxalari muntazam olinadi.",
          ru: "Регулярно создаются резервные копии базы данных." },
      ] },

    { h: { uz: "9. Sizning huquqlaringiz", ru: "9. Ваши права" },
      p: [
        { uz: "ZRU-547 21 va 22-moddalari sizga quyidagi huquqlarni beradi. Har biri Kabinetdagi «Mening ma'lumotlarim» bo'limidan amalga oshiriladi va murojaatlar {days} ish kuni ichida ko'rib chiqiladi.",
          ru: "Статьи 21 и 22 ЗРУ-547 предоставляют вам следующие права. Каждое из них реализуется в разделе «Мои данные» Кабинета, обращения рассматриваются в течение {days} рабочих дней." },
      ],
      list: [
        { uz: "Ma'lumot olish huquqi — o'zingiz haqingizda saqlanayotgan barcha ma'lumotlarni fayl ko'rinishida yuklab olish. Parol qaytarilmas shaklda saqlanganligi sababli faylga kiritilmaydi.",
          ru: "Право на получение сведений — выгрузить файлом все данные, хранимые о вас. Пароль не включается в файл, поскольку хранится в необратимой форме." },
        { uz: "Aniqlashtirish huquqi — noto'g'ri yoki eskirgan ma'lumotni Kabinet orqali mustaqil tuzatish.",
          ru: "Право на уточнение — самостоятельно исправить неточные или устаревшие сведения через Кабинет." },
        { uz: "Rozilikni qaytarib olish huquqi — istalgan vaqtda. Rozilik qaytarib olingach Kabinetga kirish to'xtatiladi, chunki qayta ishlashning asosi shu rozilik edi.",
          ru: "Право отозвать согласие — в любое время. После отзыва доступ в Кабинет приостанавливается, поскольку основанием обработки являлось это согласие." },
        { uz: "O'chirishni talab qilish huquqi — murojaat qayd etiladi va {days} ish kuni ichida asoslantirilgan javob beriladi. Javobda qaysi ma'lumot o'chirilgani va qaysi biri qonun talabi bo'yicha (masalan, buxgalteriya hujjatlari) saqlanib qolgani ko'rsatiladi.",
          ru: "Право требовать удаления — обращение регистрируется, и в течение {days} рабочих дней даётся мотивированный ответ. В ответе указывается, какие данные удалены, а какие сохранены в силу требования закона (например, бухгалтерские документы)." },
        { uz: "Shikoyat qilish huquqi — vakolatli davlat organiga yoki sudga murojaat qilish.",
          ru: "Право на обжалование — обращение в уполномоченный государственный орган или в суд." },
      ],
      links: ["rights"] },

    { h: { uz: "10. Brauzer xotirasi (cookie)", ru: "10. Память браузера (cookie)" },
      p: [
        { uz: "Platforma reklama yoki kuzatuv cookie-fayllaridan foydalanmaydi. Brauzeringizning localStorage xotirasida faqat xizmat ishlashi uchun zarur bo'lgan texnik qiymatlar saqlanadi: tanlangan til, tema (yorug'/qorong'i) va sessiyaga kirish kaliti. Ular Operator serveriga yuborilmaydi va brauzer sozlamalari orqali istalgan vaqtda tozalanishi mumkin.",
          ru: "Платформа не использует рекламные или отслеживающие cookie-файлы. В памяти localStorage вашего браузера хранятся только технические значения, необходимые для работы сервиса: выбранный язык, тема (светлая/тёмная) и ключ сессии. Они не отправляются на сервер Оператора и могут быть очищены в любой момент через настройки браузера." },
      ] },

    { h: { uz: "11. Voyaga yetmaganlar", ru: "11. Несовершеннолетние" },
      p: [
        { uz: "Platforma yuridik shaxslar va yakka tartibdagi tadbirkorlar uchun mo'ljallangan. U voyaga yetmaganlarga qaratilmagan va ulardan ongli ravishda ma'lumot to'planmaydi.",
          ru: "Платформа предназначена для юридических лиц и индивидуальных предпринимателей. Она не адресована несовершеннолетним, и сведения о них осознанно не собираются." },
      ] },

    { h: { uz: "12. Siyosatga o'zgartirishlar", ru: "12. Изменения политики" },
      p: [
        { uz: "Siyosat versiyasi: {version}, amal qilish sanasi: {effective}. Har bir yangi tahrir o'z versiyasini oladi. Sizning rozilikingiz qaysi versiyaga berilgan bo'lsa, o'sha versiya qayd etilgan holda saqlanadi — keyingi tahrirlar o'tmishdagi rozilikni qayta yozmaydi.",
          ru: "Версия политики: {version}, дата вступления в силу: {effective}. Каждая новая редакция получает свою версию. Версия, к которой было дано ваше согласие, сохраняется зафиксированной — последующие редакции не переписывают ранее данное согласие." },
        { uz: "Ma'lumotlar toifalari yoki maqsadlariga jiddiy o'zgartirish kiritilganda yangi rozilik so'raladi.",
          ru: "При существенном изменении категорий данных или целей обработки запрашивается новое согласие." },
      ] },

    { h: { uz: "13. Bog'lanish", ru: "13. Контакты" },
      slot: "dpo",
      p: [
        { uz: "Shaxsga doir ma'lumotlarni qayta ishlash va himoya qilish bo'yicha mas'ul shaxs murojaatlarni {days} ish kuni ichida ko'rib chiqadi.",
          ru: "Ответственное лицо по обработке и защите персональных данных рассматривает обращения в течение {days} рабочих дней." },
      ] },
  ],
};
