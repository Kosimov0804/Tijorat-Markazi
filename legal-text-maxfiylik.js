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
    uz: "Uşbu siyosat {brand} platformasi şaxsga doir maʼlumotlarni qanday töplaşi, qayta işlaşi, saqlaşi va himoya qilişini tuşuntiradi. U «Şaxsga doir maʼlumotlar töğrisida»gi Özbekiston Respublikasi Qonuni (2019-yil 2-iyul, ZRU-547, keyingi özgartirişlar bilan) talablariga asoslanadi.",
    ru: "Настоящая политика объясняет, как платформа {brand} собирает, обрабатывает, хранит и защищает персональные данные. Она основана на требованиях Закона Республики Узбекистан «О персональных данных» (2 июля 2019 года, ЗРУ-547, с последующими изменениями).",
  },

  sections: [
    { h: { uz: "1. Maʼlumotlar bazasining egasi", ru: "1. Владелец базы персональных данных" },
      slot: "operator",
      p: [
        { uz: "Şaxsga doir maʼlumotlar bazasining egasi va operatori quyidagi yuridik şaxsdir. Maʼlumotlaringizga oid har qanday murojaatni şu manzillarga yuborişingiz mumkin.",
          ru: "Владельцем и оператором базы персональных данных является указанное ниже юридическое лицо. Любое обращение по поводу ваших данных вы можете направить по этим адресам." },
      ] },

    { h: { uz: "2. Qanday maʼlumotlar töplanadi va nima uçun",
           ru: "2. Какие данные собираются и для чего" },
      p: [
        { uz: "Quyidagi jadval Platforma haqiqatda töplaydigan maʼlumotlar toifalarini va har birining aniq maqsadini körsatadi. Jadval tizim sozlamalaridan bevosita şakllantiriladi — bu unda körsatilmagan maʼlumot töplanmasligini kafolatlaydi.",
          ru: "Приведённая ниже таблица показывает категории данных, которые Платформа действительно собирает, и конкретную цель по каждой из них. Таблица формируется непосредственно из настроек системы — это гарантирует, что не собираются данные, в ней не указанные." },
      ],
      slot: "collected",
      after: [
        { uz: "Platforma biometrik va genetik maʼlumotlarni (yuz tasviri, barmoq izi, DNK maʼlumotlari) töplamaydi va qayta işlamaydi.",
          ru: "Платформа не собирает и не обрабатывает биометрические и генетические данные (изображение лица, отпечатки пальцев, данные ДНК)." },
      ] },

    { h: { uz: "3. Qayta işlaş uçun huquqiy asos", ru: "3. Правовое основание обработки" },
      list: [
        { uz: "Subʼektning roziligi (ZRU-547 21-modda) — röyxatdan ötişda beriladi. Rozilik berilgan vaqt, hujjat versiyasi va texnik maʼlumotlar Operator tomonidan isbot sifatida qayd etiladi, çunki rozilik berilganini isbotlaş majburiyati Operator zimmasida.",
          ru: "Согласие субъекта (ст. 21 ЗРУ-547) — даётся при регистрации. Время дачи согласия, версия документа и технические сведения фиксируются Оператором в качестве доказательства, поскольку обязанность доказать факт согласия лежит на Операторе." },
        { uz: "Şartnomani bajariş — Foydalanuvçi bilan tuzilgan ommaviy oferta şartlarini bajariş uçun zarur bölgan maʼlumotlar.",
          ru: "Исполнение договора — данные, необходимые для исполнения условий публичной оферты, заключённой с Пользователем." },
        { uz: "Qonun bilan yuklangan majburiyat — buxgalteriya, soliq va arxiv talablari doirasida saqlanadigan maʼlumotlar.",
          ru: "Исполнение обязанности, возложенной законом, — данные, хранимые в рамках бухгалтерских, налоговых и архивных требований." },
      ] },

    { h: { uz: "4. Maʼlumotlar kimga uzatiladi", ru: "4. Кому передаются данные" },
      list: [
        { uz: "Foydalanuvçi röyxatdan ötişda tanlagan Uyuşmaga — arizani körib çiqiş va aʼzolikni tasdiqlaş uçun.",
          ru: "Ассоциации, выбранной Пользователем при регистрации, — для рассмотрения заявки и подтверждения членства." },
        { uz: "Kontragentga — Foydalanuvçining özi sörov, taklif yoki yozişma orqali boğlangan boşqa Foydalanuvçiga, faqat aloqa uçun zarur hajmda.",
          ru: "Контрагенту — другому Пользователю, с которым Пользователь сам вступил в контакт посредством запроса, предложения или переписки, только в объёме, необходимом для связи." },
        { uz: "Vakolatli davlat organlariga — faqat qonunçilikda belgilangan asos va tartibda, rasmiy sörov böyiça.",
          ru: "Уполномоченным государственным органам — исключительно по основаниям и в порядке, установленным законодательством, по официальному запросу." },
        { uz: "Operator nomidan xizmat körsatuvçi qayta işlovçilarga — 5-bandda körsatilgan hajmda.",
          ru: "Обработчикам, оказывающим услуги от имени Оператора, — в объёме, указанном в пункте 5." },
      ],
      after: [
        { uz: "Operator şaxsga doir maʼlumotlarni sotmaydi va reklama maqsadida uçinçi şaxslarga bermaydi.",
          ru: "Оператор не продаёт персональные данные и не передаёт их третьим лицам в рекламных целях." },
      ] },

    { h: { uz: "5. Transçegaraviy uzatiş", ru: "5. Трансграничная передача" },
      p: [
        { uz: "Ayrim xizmatlar Özbekiston Respublikasidan taşqarida joylaşgan qayta işlovçilar tomonidan körsatiladi. ZRU-547 27-1-moddasiga muvofiq bunday uzatiş faqat qonunda nazarda tutilgan asoslardan biri mavjud bölganda amalga oşiriladi.",
          ru: "Отдельные услуги оказываются обработчиками, находящимися за пределами Республики Узбекистан. В соответствии со статьёй 27-1 ЗРУ-547 такая передача осуществляется только при наличии одного из предусмотренных законом оснований." },
      ],
      slot: "transfers" },

    { h: { uz: "6. Saqlaş joyi va lokalizatsiya talabi",
           ru: "6. Место хранения и требование о локализации" },
      p: [
        { uz: "2021-yildan 2026-yil mart oyigaça Özbekiston Respublikasi fuqarolarining barça şaxsga doir maʼlumotlari mamlakat hududida joylaşgan texnik vositalarda saqlanişi talab qilinar edi.",
          ru: "С 2021 года по март 2026 года требовалось хранить все персональные данные граждан Республики Узбекистан на технических средствах, размещённых на территории страны." },
        { uz: "2026-yil 26-martdagi ZRU-1125-son Qonuni uşbu talabni toraytirdi. Endi majburiy lokalizatsiya faqat quyidagilarga nisbatan qöllaniladi: jismoniy şaxslarning biometrik maʼlumotlari; genetik maʼlumotlari; Özbekistonda faoliyat yurituvçi telekommunikatsiya operatorlari xizmatlaridan foydalanuvçilarning maʼlumotlari. Faqat şu toifadagi bazalar Şaxsga doir maʼlumotlar bazalarining davlat reyestrida röyxatdan ötkazilişi şart.",
          ru: "Закон № ЗРУ-1125 от 26 марта 2026 года сузил это требование. Обязательная локализация теперь применяется только к: биометрическим данным физических лиц; генетическим данным; данным пользователей услуг операторов телекоммуникаций, действующих в Узбекистане. Только базы этих категорий подлежат регистрации в Государственном реестре баз персональных данных." },
        { uz: "Platforma yuqoridagi uç toifadagi maʼlumotlarni töplamaydi. Şu sababli unga majburiy lokalizatsiya talabi va davlat reyestrida röyxatdan ötiş majburiyati taalluqli emas. Agar kelajakda bunday maʼlumotlar töplanadigan bölsa, uşbu siyosat yangilanadi va tegişli röyxatdan ötiş amalga oşiriladi.",
          ru: "Платформа не собирает данные указанных трёх категорий. Поэтому требование об обязательной локализации и обязанность регистрации в государственном реестре к ней не применяются. Если в будущем такие данные будут собираться, настоящая политика будет обновлена и соответствующая регистрация будет произведена." },
      ] },

    { h: { uz: "7. Saqlaş muddatlari", ru: "7. Сроки хранения" },
      p: [
        { uz: "Maʼlumotlar maqsadga erişilgunga qadar va quyida körsatilgan muddatlarda saqlanadi. Muddat tugagaç ular öçiriladi yoki şaxsni aniqlaş imkonini bermaydigan holatga keltiriladi.",
          ru: "Данные хранятся до достижения цели и в течение указанных ниже сроков. По истечении срока они удаляются либо приводятся в вид, не позволяющий определить лицо." },
      ],
      slot: "retention" },

    { h: { uz: "8. Himoya çoralari", ru: "8. Меры защиты" },
      p: [
        { uz: "ZRU-547 27-moddasi Operatorga maʼlumotlarni ruxsatsiz kirişdan himoya qiliş çoralarini körişni yuklaydi. Amalda qöllanilayotgan çoralar:",
          ru: "Статья 27 ЗРУ-547 обязывает Оператора принимать меры защиты данных от несанкционированного доступа. Применяемые на практике меры:" },
      ],
      list: [
        { uz: "Parollar oçiq körinişda saqlanmaydi — ular scrypt algoritmi yordamida qaytarilmas kriptografik şaklga keltiriladi. Operator ham, uyuşma ham, administrator ham foydalanuvçining parolini köra olmaydi.",
          ru: "Пароли не хранятся в открытом виде — они приводятся к необратимой криптографической форме с помощью алгоритма scrypt. Ни Оператор, ни ассоциация, ни администратор не могут увидеть пароль пользователя." },
        { uz: "Maʼlumotlar uzatilişi TLS protokoli bilan şifrlanadi.",
          ru: "Передача данных шифруется по протоколу TLS." },
        { uz: "Kiriş huquqi rollar böyiça çeklangan: uyuşma faqat öz aʼzolarining arizalarini, kompaniya faqat öz kabinetini köradi.",
          ru: "Права доступа разграничены по ролям: ассоциация видит только заявки своих членов, компания — только свой кабинет." },
        { uz: "Platformadagi muhim harakatlar jurnalga yozib boriladi.",
          ru: "Значимые действия на Платформе фиксируются в журнале." },
        { uz: "Maʼlumotlar bazasining zaxira nusxalari muntazam olinadi.",
          ru: "Регулярно создаются резервные копии базы данных." },
      ] },

    { h: { uz: "9. Sizning huquqlaringiz", ru: "9. Ваши права" },
      p: [
        { uz: "ZRU-547 21 va 22-moddalari sizga quyidagi huquqlarni beradi. Har biri Kabinetdagi «Mening maʼlumotlarim» bölimidan amalga oşiriladi va murojaatlar {days} iş kuni içida körib çiqiladi.",
          ru: "Статьи 21 и 22 ЗРУ-547 предоставляют вам следующие права. Каждое из них реализуется в разделе «Мои данные» Кабинета, обращения рассматриваются в течение {days} рабочих дней." },
      ],
      list: [
        { uz: "Maʼlumot oliş huquqi — özingiz haqingizda saqlanayotgan barça maʼlumotlarni fayl körinişida yuklab oliş. Parol qaytarilmas şaklda saqlanganligi sababli faylga kiritilmaydi.",
          ru: "Право на получение сведений — выгрузить файлом все данные, хранимые о вас. Пароль не включается в файл, поскольку хранится в необратимой форме." },
        { uz: "Aniqlaştiriş huquqi — notöğri yoki eskirgan maʼlumotni Kabinet orqali mustaqil tuzatiş.",
          ru: "Право на уточнение — самостоятельно исправить неточные или устаревшие сведения через Кабинет." },
        { uz: "Rozilikni qaytarib oliş huquqi — istalgan vaqtda. Rozilik qaytarib olingaç Kabinetga kiriş töxtatiladi, çunki qayta işlaşning asosi şu rozilik edi.",
          ru: "Право отозвать согласие — в любое время. После отзыва доступ в Кабинет приостанавливается, поскольку основанием обработки являлось это согласие." },
        { uz: "Öçirişni talab qiliş huquqi — murojaat qayd etiladi va {days} iş kuni içida asoslantirilgan javob beriladi. Javobda qaysi maʼlumot öçirilgani va qaysi biri qonun talabi böyiça (masalan, buxgalteriya hujjatlari) saqlanib qolgani körsatiladi.",
          ru: "Право требовать удаления — обращение регистрируется, и в течение {days} рабочих дней даётся мотивированный ответ. В ответе указывается, какие данные удалены, а какие сохранены в силу требования закона (например, бухгалтерские документы)." },
        { uz: "Şikoyat qiliş huquqi — vakolatli davlat organiga yoki sudga murojaat qiliş.",
          ru: "Право на обжалование — обращение в уполномоченный государственный орган или в суд." },
      ],
      links: ["rights"] },

    { h: { uz: "10. Brauzer xotirasi (cookie)", ru: "10. Память браузера (cookie)" },
      p: [
        { uz: "Platforma reklama yoki kuzatuv cookie-fayllaridan foydalanmaydi. Brauzeringizning localStorage xotirasida faqat xizmat işlaşi uçun zarur bölgan texnik qiymatlar saqlanadi: tanlangan til, tema (yoruğ/qoronği) va sessiyaga kiriş kaliti. Ular Operator serveriga yuborilmaydi va brauzer sozlamalari orqali istalgan vaqtda tozalanişi mumkin.",
          ru: "Платформа не использует рекламные или отслеживающие cookie-файлы. В памяти localStorage вашего браузера хранятся только технические значения, необходимые для работы сервиса: выбранный язык, тема (светлая/тёмная) и ключ сессии. Они не отправляются на сервер Оператора и могут быть очищены в любой момент через настройки браузера." },
      ] },

    { h: { uz: "11. Voyaga yetmaganlar", ru: "11. Несовершеннолетние" },
      p: [
        { uz: "Platforma yuridik şaxslar va yakka tartibdagi tadbirkorlar uçun möljallangan. U voyaga yetmaganlarga qaratilmagan va ulardan ongli ravişda maʼlumot töplanmaydi.",
          ru: "Платформа предназначена для юридических лиц и индивидуальных предпринимателей. Она не адресована несовершеннолетним, и сведения о них осознанно не собираются." },
      ] },

    { h: { uz: "12. Siyosatga özgartirişlar", ru: "12. Изменения политики" },
      p: [
        { uz: "Siyosat versiyasi: {version}, amal qiliş sanasi: {effective}. Har bir yangi tahrir öz versiyasini oladi. Sizning rozilikingiz qaysi versiyaga berilgan bölsa, öşa versiya qayd etilgan holda saqlanadi — keyingi tahrirlar ötmişdagi rozilikni qayta yozmaydi.",
          ru: "Версия политики: {version}, дата вступления в силу: {effective}. Каждая новая редакция получает свою версию. Версия, к которой было дано ваше согласие, сохраняется зафиксированной — последующие редакции не переписывают ранее данное согласие." },
        { uz: "Maʼlumotlar toifalari yoki maqsadlariga jiddiy özgartiriş kiritilganda yangi rozilik söraladi.",
          ru: "При существенном изменении категорий данных или целей обработки запрашивается новое согласие." },
      ] },

    { h: { uz: "13. Boğlaniş", ru: "13. Контакты" },
      slot: "dpo",
      p: [
        { uz: "Şaxsga doir maʼlumotlarni qayta işlaş va himoya qiliş böyiça masʼul şaxs murojaatlarni {days} iş kuni içida körib çiqadi.",
          ru: "Ответственное лицо по обработке и защите персональных данных рассматривает обращения в течение {days} рабочих дней." },
      ] },
  ],
};
