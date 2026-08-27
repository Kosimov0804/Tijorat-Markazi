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
    uz: "Ushbu shartlar {brand} platformasidan foydalanish qoidalarini belgilaydi. Ular Ommaviy oferta va Maxfiylik siyosati bilan birga qo'llaniladi. Tijorat munosabatlari Ommaviy oferta bilan tartibga solinadi.",
    ru: "Настоящие условия определяют правила пользования платформой {brand}. Они применяются совместно с Публичной офертой и Политикой конфиденциальности. Коммерческие отношения регулируются Публичной офертой.",
  },

  sections: [
    { h: { uz: "1. Qo'llanilish doirasi", ru: "1. Сфера применения" },
      p: [
        { uz: "Shartlar Platformaning barcha foydalanuvchilariga — kompaniyalar, xaridorlar, uyushmalar va tahlilchilarga nisbatan qo'llaniladi.",
          ru: "Условия применяются ко всем пользователям Платформы — компаниям, покупателям, ассоциациям и аналитикам." },
        { uz: "Versiya: {version}. Amal qilish sanasi: {effective}.",
          ru: "Версия: {version}. Дата вступления в силу: {effective}." },
      ],
      links: ["oferta", "maxfiylik"] },

    { h: { uz: "2. Hisob qaydnomasi", ru: "2. Учётная запись" },
      list: [
        { uz: "Bitta yuridik shaxsga bitta hisob qaydnomasi beriladi. Uni uchinchi shaxslarga berish yoki sotish taqiqlanadi.",
          ru: "Одному юридическому лицу предоставляется одна учётная запись. Её передача или продажа третьим лицам запрещается." },
        { uz: "Parol kamida 8 belgidan iborat bo'lishi shart. Parolni himoyalash Foydalanuvchining javobgarligida.",
          ru: "Пароль должен состоять не менее чем из 8 символов. Защита пароля — ответственность Пользователя." },
        { uz: "Kirish ma'lumotlari o'g'irlanganidan shubhalansangiz, darhol parolni almashtiring va {email} manziliga xabar bering.",
          ru: "При подозрении на компрометацию данных доступа немедленно смените пароль и сообщите на {email}." },
        { uz: "Operator hech qachon sizdan parolingizni so'ramaydi — na telefon, na xat, na chat orqali.",
          ru: "Оператор никогда не запрашивает ваш пароль — ни по телефону, ни письмом, ни в чате." },
      ] },

    { h: { uz: "3. Joylashtiriladigan material", ru: "3. Размещаемые материалы" },
      p: [
        { uz: "Foydalanuvchi o'zi joylashtirgan matn, rasm va hujjatlarga bo'lgan huquqlarga ega ekanligini yoki ularni joylashtirish uchun ruxsati borligini kafolatlaydi. Operator bunday materialni Platformada ko'rsatish uchun cheklangan huquq oladi.",
          ru: "Пользователь гарантирует, что обладает правами на размещаемые им текст, изображения и документы либо имеет разрешение на их размещение. Оператор получает ограниченное право на отображение таких материалов на Платформе." },
      ],
      after: [
        { uz: "Quyidagilarni joylashtirish taqiqlanadi:",
          ru: "Запрещается размещать:" },
      ],
      list: [
        { uz: "yolg'on yoki chalg'ituvchi ma'lumot, jumladan mavjud bo'lmagan tovar yoki imkoniyat haqidagi e'lonlar;",
          ru: "недостоверные или вводящие в заблуждение сведения, в том числе объявления о несуществующем товаре или возможности;" },
        { uz: "muomalasi taqiqlangan yoki cheklangan tovarlar — tegishli ruxsat hujjatisiz;",
          ru: "товары, оборот которых запрещён или ограничен, — без соответствующего разрешительного документа;" },
        { uz: "uchinchi shaxslarning intellektual mulk huquqlarini buzuvchi materiallar;",
          ru: "материалы, нарушающие права интеллектуальной собственности третьих лиц;" },
        { uz: "boshqa shaxslarning shaxsga doir ma'lumotlari — ularning roziligisiz;",
          ru: "персональные данные других лиц — без их согласия;" },
        { uz: "haqorat, tahdid, kamsitish yoki adovat uyg'otuvchi mazmun;",
          ru: "оскорбления, угрозы, дискриминация или содержание, разжигающее вражду;" },
        { uz: "zararli dastur kodi va Platformaning himoya vositalarini chetlab o'tishga qaratilgan materiallar.",
          ru: "вредоносный программный код и материалы, направленные на обход средств защиты Платформы." },
      ] },

    { h: { uz: "4. Taqiqlangan harakatlar", ru: "4. Запрещённые действия" },
      list: [
        { uz: "Platformadan ommaviy so'ralmagan tijorat xabarlarini (spam) tarqatish uchun foydalanish.",
          ru: "Использование Платформы для рассылки массовых незапрошенных коммерческих сообщений (спама)." },
        { uz: "Avtomatlashtirilgan vositalar bilan ma'lumotlarni ommaviy yig'ish (skreyping), agar Operator yozma ruxsat bermagan bo'lsa.",
          ru: "Массовый автоматизированный сбор данных (скрейпинг) без письменного разрешения Оператора." },
        { uz: "Boshqa Foydalanuvchi nomidan yoki uning hisob qaydnomasidan foydalanishga urinish.",
          ru: "Попытка действовать от имени другого Пользователя или использовать его учётную запись." },
        { uz: "Platformaning ishiga texnik aralashish, ortiqcha yuklama yaratish, zaifliklardan foydalanishga urinish.",
          ru: "Техническое вмешательство в работу Платформы, создание избыточной нагрузки, попытки эксплуатации уязвимостей." },
        { uz: "Tizim tomonidan qo'yilgan cheklovlarni (limitlar, filtrlar, moderatsiya) chetlab o'tish.",
          ru: "Обход установленных системой ограничений (лимитов, фильтров, модерации)." },
      ] },

    { h: { uz: "5. Moderatsiya, to'xtatib turish va shikoyat",
           ru: "5. Модерация, приостановление и обжалование" },
      p: [
        { uz: "Operator quyidagi asoslardan biri mavjud bo'lganda materialni olib tashlashi yoki hisob qaydnomasini to'xtatib turishi mumkin:",
          ru: "Оператор вправе удалить материал или приостановить учётную запись при наличии одного из следующих оснований:" },
      ],
      list: [
        { uz: "3 yoki 4-bandda sanab o'tilgan qoidalarning buzilishi;",
          ru: "нарушение правил, перечисленных в пунктах 3 или 4;" },
        { uz: "vakolatli davlat organining qonuniy talabi;",
          ru: "законное требование уполномоченного государственного органа;" },
        { uz: "uchinchi shaxsning asoslantirilgan shikoyati — tekshiruv davrida;",
          ru: "обоснованная жалоба третьего лица — на период проверки;" },
        { uz: "Foydalanuvchi tomonidan rozilikning qaytarib olinishi;",
          ru: "отзыв согласия Пользователем;" },
        { uz: "hisob qaydnomasining o'g'irlanganligi to'g'risidagi asosli shubha.",
          ru: "обоснованное подозрение о компрометации учётной записи." },
      ],
      after: [
        { uz: "To'xtatib turish to'g'risida Foydalanuvchiga sababi ko'rsatilgan holda xabar beriladi. Foydalanuvchi qarorga {email} manziliga shikoyat qilishi mumkin; shikoyat 10 ish kuni ichida ko'rib chiqiladi va asoslantirilgan javob beriladi.",
          ru: "Об этом Пользователь уведомляется с указанием причины. Пользователь вправе обжаловать решение по адресу {email}; жалоба рассматривается в течение 10 рабочих дней с предоставлением мотивированного ответа." },
        { uz: "Rozilikni qaytarib olish sababli to'xtatilgan hisob qaydnomasi yangi rozilik berilgandan keyin tiklanadi.",
          ru: "Учётная запись, приостановленная по причине отзыва согласия, восстанавливается после дачи нового согласия." },
      ] },

    { h: { uz: "6. Xizmatning mavjudligi", ru: "6. Доступность сервиса" },
      p: [
        { uz: "Operator Platformaning barqaror ishlashiga harakat qiladi, biroq uzluksiz ishlashni kafolatlamaydi. Rejalashtirilgan texnik ishlar haqida imkoniyat bo'lganda oldindan xabar beriladi.",
          ru: "Оператор стремится обеспечить стабильную работу Платформы, однако не гарантирует бесперебойность. О плановых технических работах уведомляется заранее при наличии возможности." },
        { uz: "Operator Platformaning funksiyalarini o'zgartirish, qo'shish yoki olib tashlash huquqini saqlab qoladi.",
          ru: "Оператор сохраняет за собой право изменять, добавлять или удалять функции Платформы." },
      ] },

    { h: { uz: "7. Sun'iy intellekt vositalari", ru: "7. Инструменты искусственного интеллекта" },
      p: [
        { uz: "AI yordamchisi va tahliliy vositalar tayyorlagan natijalar taxminiy bo'lib, xatoliklarni o'z ichiga olishi mumkin. Ular yuridik, moliyaviy, soliq yoki investitsiya maslahati hisoblanmaydi.",
          ru: "Результаты, подготовленные ИИ-помощником и аналитическими инструментами, носят оценочный характер и могут содержать ошибки. Они не являются юридической, финансовой, налоговой или инвестиционной консультацией." },
        { uz: "Qaror qabul qilishdan oldin natijani mustaqil tekshiring. Operator AI natijasiga tayanib qabul qilingan qarorlar uchun javobgar emas.",
          ru: "Перед принятием решения самостоятельно проверьте результат. Оператор не отвечает за решения, принятые на основании результата ИИ." },
        { uz: "AI yordamchisiga yuborilgan matnning qayerda qayta ishlanishi Maxfiylik siyosatining 5-bandida ko'rsatilgan.",
          ru: "Где обрабатывается текст, направленный ИИ-помощнику, указано в пункте 5 Политики конфиденциальности." },
      ],
      links: ["maxfiylik"] },

    { h: { uz: "8. Javobgarlik va nizolar", ru: "8. Ответственность и споры" },
      p: [
        { uz: "Operatorning javobgarligi Ommaviy ofertaning 9-bandida belgilangan. Nizolar Ommaviy ofertaning 12-bandidagi tartibda hal etiladi.",
          ru: "Ответственность Оператора определена пунктом 9 Публичной оферты. Споры разрешаются в порядке, установленном пунктом 12 Публичной оферты." },
        { uz: "Ushbu shartlarga O'zbekiston Respublikasi qonunchiligi qo'llaniladi. Matnlar o'rtasida tafovut bo'lganda o'zbek tilidagi matn ustunlik qiladi.",
          ru: "К настоящим условиям применяется законодательство Республики Узбекистан. При расхождении текстов преимущественную силу имеет текст на узбекском языке." },
      ],
      links: ["oferta"] },
  ],
};
