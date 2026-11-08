/* ============================================================
   FOYDALANISH SHARTLARI — terms of use

   The offer governs the commercial relationship; this governs
   conduct on the platform. Kept separate on purpose: an offer
   is a contract proposal under FK 367 and every amendment to
   it is an amendment to a live contract, whereas house rules
   about spam, scraping and moderation change more often and
   should not force a re-acceptance of the commercial terms
   every time they do.

   The parts worth reading twice are moderation and appeal.
   Suspending an account cuts a business off from a market, so
   the grounds are enumerated rather than left to "at our
   discretion", and there is a route back. That is both fairer
   and considerably easier to defend if it is ever challenged.
   ============================================================ */
const LEGAL_SHARTLAR = {
  key: "shartlar",

  lead: {
    uz: "Uşbu şartlar {brand} platformasidan foydalaniş qoidalarini belgilaydi. Ular Ommaviy oferta va Maxfiylik siyosati bilan birga qöllaniladi. Tijorat munosabatlari Ommaviy oferta bilan tartibga solinadi.",
    ru: "Настоящие условия определяют правила пользования платформой {brand}. Они применяются совместно с Публичной офертой и Политикой конфиденциальности. Коммерческие отношения регулируются Публичной офертой.",
  },

  sections: [
    { h: { uz: "1. Qöllaniliş doirasi", ru: "1. Сфера применения" },
      p: [
        { uz: "Şartlar Platformaning barça foydalanuvçilariga — kompaniyalar, xaridorlar, uyuşmalar va tahlilçilarga nisbatan qöllaniladi.",
          ru: "Условия применяются ко всем пользователям Платформы — компаниям, покупателям, ассоциациям и аналитикам." },
        { uz: "Versiya: {version}. Amal qiliş sanasi: {effective}.",
          ru: "Версия: {version}. Дата вступления в силу: {effective}." },
      ],
      links: ["oferta", "maxfiylik"] },

    { h: { uz: "2. Hisob qaydnomasi", ru: "2. Учётная запись" },
      list: [
        { uz: "Bitta yuridik şaxsga bitta hisob qaydnomasi beriladi. Uni uçinçi şaxslarga beriş yoki sotiş taqiqlanadi.",
          ru: "Одному юридическому лицу предоставляется одна учётная запись. Её передача или продажа третьим лицам запрещается." },
        { uz: "Parol kamida 8 belgidan iborat bölişi şart. Parolni himoyalaş Foydalanuvçining javobgarligida.",
          ru: "Пароль должен состоять не менее чем из 8 символов. Защита пароля — ответственность Пользователя." },
        { uz: "Kiriş maʼlumotlari öğirlanganidan şubhalansangiz, darhol parolni almaştiring va {email} manziliga xabar bering.",
          ru: "При подозрении на компрометацию данных доступа немедленно смените пароль и сообщите на {email}." },
        { uz: "Operator heç qaçon sizdan parolingizni söramaydi — na telefon, na xat, na çat orqali.",
          ru: "Оператор никогда не запрашивает ваш пароль — ни по телефону, ни письмом, ни в чате." },
      ] },

    { h: { uz: "3. Joylaştiriladigan material", ru: "3. Размещаемые материалы" },
      p: [
        { uz: "Foydalanuvçi özi joylaştirgan matn, rasm va hujjatlarga bölgan huquqlarga ega ekanligini yoki ularni joylaştiriş uçun ruxsati borligini kafolatlaydi. Operator bunday materialni Platformada körsatiş uçun çeklangan huquq oladi.",
          ru: "Пользователь гарантирует, что обладает правами на размещаемые им текст, изображения и документы либо имеет разрешение на их размещение. Оператор получает ограниченное право на отображение таких материалов на Платформе." },
      ],
      after: [
        { uz: "Quyidagilarni joylaştiriş taqiqlanadi:",
          ru: "Запрещается размещать:" },
      ],
      list: [
        { uz: "yolğon yoki çalğituvçi maʼlumot, jumladan mavjud bölmagan tovar yoki imkoniyat haqidagi eʼlonlar;",
          ru: "недостоверные или вводящие в заблуждение сведения, в том числе объявления о несуществующем товаре или возможности;" },
        { uz: "muomalasi taqiqlangan yoki çeklangan tovarlar — tegişli ruxsat hujjatisiz;",
          ru: "товары, оборот которых запрещён или ограничен, — без соответствующего разрешительного документа;" },
        { uz: "uçinçi şaxslarning intellektual mulk huquqlarini buzuvçi materiallar;",
          ru: "материалы, нарушающие права интеллектуальной собственности третьих лиц;" },
        { uz: "boşqa şaxslarning şaxsga doir maʼlumotlari — ularning roziligisiz;",
          ru: "персональные данные других лиц — без их согласия;" },
        { uz: "haqorat, tahdid, kamsitiş yoki adovat uyğotuvçi mazmun;",
          ru: "оскорбления, угрозы, дискриминация или содержание, разжигающее вражду;" },
        { uz: "zararli dastur kodi va Platformaning himoya vositalarini çetlab ötişga qaratilgan materiallar.",
          ru: "вредоносный программный код и материалы, направленные на обход средств защиты Платформы." },
      ] },

    { h: { uz: "4. Taqiqlangan harakatlar", ru: "4. Запрещённые действия" },
      list: [
        { uz: "Platformadan ommaviy söralmagan tijorat xabarlarini (spam) tarqatiş uçun foydalaniş.",
          ru: "Использование Платформы для рассылки массовых незапрошенных коммерческих сообщений (спама)." },
        { uz: "Avtomatlaştirilgan vositalar bilan maʼlumotlarni ommaviy yiğiş (skreyping), agar Operator yozma ruxsat bermagan bölsa.",
          ru: "Массовый автоматизированный сбор данных (скрейпинг) без письменного разрешения Оператора." },
        { uz: "Boşqa Foydalanuvçi nomidan yoki uning hisob qaydnomasidan foydalanişga uriniş.",
          ru: "Попытка действовать от имени другого Пользователя или использовать его учётную запись." },
        { uz: "Platformaning işiga texnik aralaşiş, ortiqça yuklama yaratiş, zaifliklardan foydalanişga uriniş.",
          ru: "Техническое вмешательство в работу Платформы, создание избыточной нагрузки, попытки эксплуатации уязвимостей." },
        { uz: "Tizim tomonidan qöyilgan çeklovlarni (limitlar, filtrlar, moderatsiya) çetlab ötiş.",
          ru: "Обход установленных системой ограничений (лимитов, фильтров, модерации)." },
      ] },

    { h: { uz: "5. Moderatsiya, töxtatib turiş va şikoyat",
           ru: "5. Модерация, приостановление и обжалование" },
      p: [
        { uz: "Operator quyidagi asoslardan biri mavjud bölganda materialni olib taşlaşi yoki hisob qaydnomasini töxtatib turişi mumkin:",
          ru: "Оператор вправе удалить материал или приостановить учётную запись при наличии одного из следующих оснований:" },
      ],
      list: [
        { uz: "3 yoki 4-bandda sanab ötilgan qoidalarning buzilişi;",
          ru: "нарушение правил, перечисленных в пунктах 3 или 4;" },
        { uz: "vakolatli davlat organining qonuniy talabi;",
          ru: "законное требование уполномоченного государственного органа;" },
        { uz: "uçinçi şaxsning asoslantirilgan şikoyati — tekşiruv davrida;",
          ru: "обоснованная жалоба третьего лица — на период проверки;" },
        { uz: "Foydalanuvçi tomonidan rozilikning qaytarib olinişi;",
          ru: "отзыв согласия Пользователем;" },
        { uz: "hisob qaydnomasining öğirlanganligi töğrisidagi asosli şubha.",
          ru: "обоснованное подозрение о компрометации учётной записи." },
      ],
      after: [
        { uz: "Töxtatib turiş töğrisida Foydalanuvçiga sababi körsatilgan holda xabar beriladi. Foydalanuvçi qarorga {email} manziliga şikoyat qilişi mumkin; şikoyat 10 iş kuni içida körib çiqiladi va asoslantirilgan javob beriladi.",
          ru: "Об этом Пользователь уведомляется с указанием причины. Пользователь вправе обжаловать решение по адресу {email}; жалоба рассматривается в течение 10 рабочих дней с предоставлением мотивированного ответа." },
        { uz: "Rozilikni qaytarib oliş sababli töxtatilgan hisob qaydnomasi yangi rozilik berilgandan keyin tiklanadi.",
          ru: "Учётная запись, приостановленная по причине отзыва согласия, восстанавливается после дачи нового согласия." },
      ] },

    { h: { uz: "6. Xizmatning mavjudligi", ru: "6. Доступность сервиса" },
      p: [
        { uz: "Operator Platformaning barqaror işlaşiga harakat qiladi, biroq uzluksiz işlaşni kafolatlamaydi. Rejalaştirilgan texnik işlar haqida imkoniyat bölganda oldindan xabar beriladi.",
          ru: "Оператор стремится обеспечить стабильную работу Платформы, однако не гарантирует бесперебойность. О плановых технических работах уведомляется заранее при наличии возможности." },
        { uz: "Operator Platformaning funksiyalarini özgartiriş, qöşiş yoki olib taşlaş huquqini saqlab qoladi.",
          ru: "Оператор сохраняет за собой право изменять, добавлять или удалять функции Платформы." },
      ] },

    { h: { uz: "7. Sunʼiy intellekt vositalari", ru: "7. Инструменты искусственного интеллекта" },
      p: [
        { uz: "AI yordamçisi va tahliliy vositalar tayyorlagan natijalar taxminiy bölib, xatoliklarni öz içiga olişi mumkin. Ular yuridik, moliyaviy, soliq yoki investitsiya maslahati hisoblanmaydi.",
          ru: "Результаты, подготовленные ИИ-помощником и аналитическими инструментами, носят оценочный характер и могут содержать ошибки. Они не являются юридической, финансовой, налоговой или инвестиционной консультацией." },
        { uz: "Qaror qabul qilişdan oldin natijani mustaqil tekşiring. Operator AI natijasiga tayanib qabul qilingan qarorlar uçun javobgar emas.",
          ru: "Перед принятием решения самостоятельно проверьте результат. Оператор не отвечает за решения, принятые на основании результата ИИ." },
        { uz: "AI yordamçisiga yuborilgan matnning qayerda qayta işlanişi Maxfiylik siyosatining 5-bandida körsatilgan.",
          ru: "Где обрабатывается текст, направленный ИИ-помощнику, указано в пункте 5 Политики конфиденциальности." },
      ],
      links: ["maxfiylik"] },

    { h: { uz: "8. Javobgarlik va nizolar", ru: "8. Ответственность и споры" },
      p: [
        { uz: "Operatorning javobgarligi Ommaviy ofertaning 9-bandida belgilangan. Nizolar Ommaviy ofertaning 12-bandidagi tartibda hal etiladi.",
          ru: "Ответственность Оператора определена пунктом 9 Публичной оферты. Споры разрешаются в порядке, установленном пунктом 12 Публичной оферты." },
        { uz: "Uşbu şartlarga Özbekiston Respublikasi qonunçiligi qöllaniladi. Matnlar örtasida tafovut bölganda özbek tilidagi matn ustunlik qiladi.",
          ru: "К настоящим условиям применяется законодательство Республики Узбекистан. При расхождении текстов преимущественную силу имеет текст на узбекском языке." },
      ],
      links: ["oferta"] },
  ],
};
