/* ============================================================
   OMMAVIY OFERTA — the text of the public offer

   Why an offer at all: the platform lets one company sell to
   another, so something has to say on what terms. FK 367-modda
   (Civil Code art. 367) lets that something be a public offer —
   a proposal addressed to anyone, binding on the offeror once
   accepted — and FK 370-modda makes performance of the stated
   conditions a valid acceptance. That is why registering is
   drafted here as the acceptance: it is the act the Code
   already treats as one.

   Two things this document must get right or it is worse than
   nothing:

   1. WHAT THE OPERATOR ACTUALLY IS. ZRU-792 separates the
      seller from the axborot vositachisi — the information
      intermediary who runs the platform. Their liabilities are
      not the same. An offer that blurs them either promises
      the operator is answerable for goods it never saw, or
      denies responsibility it genuinely carries. Section 4
      states the position plainly instead.

   2. WHAT THE SELLER MUST DISCLOSE. ZRU-792 9-modda and
      Qoidalar 24-band (KM 185-son) put the disclosure duty on
      the SELLER, and the platform is where that duty is
      discharged. Section 7 lists the fields so a seller cannot
      claim it was never told.

   Tokens in {braces} are filled from srv/legal.js at render
   time — see legal-page.js. Nothing here hard-codes a requisite.

   LANGUAGE: uz is the operative text, ru is provided because
   it is the working language of much of the market. English
   readers are shown the Uzbek with a notice; a courtesy
   translation that disagreed with the operative text would be
   a liability, not a service.
   ============================================================ */
const LEGAL_OFERTA = {
  key: "oferta",

  lead: {
    uz: "Ushbu hujjat O'zbekiston Respublikasi Fuqarolik kodeksining 367-moddasiga muvofiq ommaviy oferta hisoblanadi va {brand} platformasidan foydalanish shartlarini belgilaydi. Platformada ro'yxatdan o'tish, ariza yuborish yoki uning xizmatlaridan foydalanish Fuqarolik kodeksining 370-moddasiga binoan ushbu offertani to'liq va so'zsiz aksept qilish deb hisoblanadi.",
    ru: "Настоящий документ является публичной офертой в соответствии со статьёй 367 Гражданского кодекса Республики Узбекистан и определяет условия использования платформы {brand}. Регистрация на платформе, направление заявки или использование её сервисов считается полным и безоговорочным акцептом настоящей оферты в соответствии со статьёй 370 Гражданского кодекса.",
  },

  sections: [
    { h: { uz: "1. Umumiy qoidalar", ru: "1. Общие положения" },
      p: [
        { uz: "Oferta {brand} platformasi (bundan buyon — Platforma) orqali ko'rsatiladigan xizmatlardan foydalanish tartibini belgilaydi.",
          ru: "Оферта определяет порядок пользования услугами, оказываемыми через платформу {brand} (далее — Платформа)." },
        { uz: "Oferta amal qilish sanasi: {effective}. Hujjat versiyasi: {version}. Amaldagi tahrir doimo shu sahifada e'lon qilinadi.",
          ru: "Дата вступления оферты в силу: {effective}. Версия документа: {version}. Действующая редакция всегда публикуется на этой странице." },
        { uz: "Offertani aksept qilish shartlari bilan rozi bo'lmagan shaxs Platformadan foydalanmasligi kerak.",
          ru: "Лицо, не согласное с условиями оферты, не должно пользоваться Платформой." },
      ] },

    /* Rendered from srv/legal.js — see legal-page.js. Kept as a marked slot
       rather than prose so the requisites cannot drift out of step with the
       footer, which reads the same object. */
    { h: { uz: "2. Operator to'g'risida ma'lumot", ru: "2. Сведения об операторе" },
      slot: "operator",
      p: [
        { uz: "Quyidagi ma'lumotlar «Elektron tijorat to'g'risida»gi O'zbekiston Respublikasi Qonuni (ZRU-792) va Vazirlar Mahkamasining 2016-yil 2-iyundagi 185-son qarori bilan tasdiqlangan Qoidalarning 24-bandi talablariga muvofiq e'lon qilinadi.",
          ru: "Нижеследующие сведения публикуются в соответствии с Законом Республики Узбекистан «Об электронной коммерции» (ЗРУ-792) и пунктом 24 Правил, утверждённых постановлением Кабинета Министров от 2 июня 2016 года № 185." },
      ] },

    { h: { uz: "3. Asosiy tushunchalar", ru: "3. Основные понятия" },
      list: [
        { uz: "Operator — Platformani boshqaruvchi va uning ishlashini ta'minlovchi 2-bandda ko'rsatilgan yuridik shaxs; ZRU-792 ma'nosida axborot vositachisi.",
          ru: "Оператор — юридическое лицо, указанное в пункте 2, управляющее Платформой и обеспечивающее её работу; информационный посредник в значении ЗРУ-792." },
        { uz: "Foydalanuvchi — Platformada ro'yxatdan o'tgan yoki undan foydalanayotgan yuridik shaxs yoki yakka tartibdagi tadbirkor.",
          ru: "Пользователь — юридическое лицо или индивидуальный предприниматель, зарегистрированный на Платформе или пользующийся ею." },
        { uz: "Sotuvchi — Platformada tovar, ish yoki xizmat taklif etuvchi Foydalanuvchi.",
          ru: "Продавец — Пользователь, предлагающий на Платформе товар, работу или услугу." },
        { uz: "Xaridor — Platforma orqali tovar, ish yoki xizmat sotib olishga qiziqish bildirgan Foydalanuvchi.",
          ru: "Покупатель — Пользователь, заявивший заинтересованность в приобретении товара, работы или услуги через Платформу." },
        { uz: "Uyushma — a'zo korxonalarning arizalarini ko'rib chiquvchi va ularni tasdiqlovchi soha birlashmasi.",
          ru: "Ассоциация — отраслевое объединение, рассматривающее и подтверждающее заявки предприятий-членов." },
        { uz: "Kabinet — Foydalanuvchining login va parol orqali kiriladigan shaxsiy bo'limi.",
          ru: "Кабинет — персональный раздел Пользователя, доступ к которому осуществляется по логину и паролю." },
      ] },

    { h: { uz: "4. Offerta predmeti va Operatorning maqomi",
           ru: "4. Предмет оферты и статус Оператора" },
      p: [
        { uz: "Operator Foydalanuvchilarga elektron savdo maydonchasidan foydalanish imkonini beradi: e'lonlar joylashtirish, so'rovlar yuborish, takliflar olish, kontragentlarni qidirish va ular bilan yozishmalar olib borish.",
          ru: "Оператор предоставляет Пользователям возможность пользования электронной торговой площадкой: размещать объявления, направлять запросы, получать предложения, находить контрагентов и вести с ними переписку." },
        { uz: "MUHIM: Operator Sotuvchi va Xaridor o'rtasida tuziladigan oldi-sotdi (yoki ish bajarish, xizmat ko'rsatish) shartnomasining tarafi EMAS. Bunday shartnoma bevosita Foydalanuvchilar o'rtasida tuziladi va bajariladi. Operator faqat axborot vositachisi sifatida ishtirok etadi.",
          ru: "ВАЖНО: Оператор НЕ является стороной договора купли-продажи (выполнения работ, оказания услуг), заключаемого между Продавцом и Покупателем. Такой договор заключается и исполняется непосредственно между Пользователями. Оператор участвует исключительно как информационный посредник." },
        { uz: "Platformada joylashtirilgan tovar yoki xizmat to'g'risidagi ma'lumot, agar Sotuvchi uni oferta sifatida aniq belgilamagan bo'lsa, oferta qilishga taklif hisoblanadi.",
          ru: "Размещённые на Платформе сведения о товаре или услуге считаются приглашением делать оферты, если Продавец прямо не обозначил их как оферту." },
      ] },

    { h: { uz: "5. Shartnoma tuzish tartibi", ru: "5. Порядок заключения договора" },
      p: [
        { uz: "Operator bilan Foydalanuvchi o'rtasidagi shartnoma Foydalanuvchi ro'yxatdan o'tish arizasini yuborgan va ushbu offerta hamda Maxfiylik siyosati shartlarini qabul qilganini tasdiqlagan paytdan tuzilgan hisoblanadi.",
          ru: "Договор между Оператором и Пользователем считается заключённым с момента направления Пользователем заявки на регистрацию и подтверждения им согласия с условиями настоящей оферты и Политики конфиденциальности." },
        { uz: "Kabinetga kirish huquqi ariza tanlangan Uyushma yoki Operator tomonidan tasdiqlangandan keyin beriladi. Arizani rad etish shartnomani tuzishdan bosh tortish hisoblanadi va Operator uchun hech qanday majburiyat yuzaga keltirmaydi.",
          ru: "Право доступа в Кабинет предоставляется после подтверждения заявки выбранной Ассоциацией или Оператором. Отклонение заявки означает отказ от заключения договора и не порождает для Оператора никаких обязательств." },
        { uz: "Foydalanuvchilar o'rtasidagi shartnoma ZRU-792 19-moddasiga muvofiq, taraflar kelishgan shaklda tuziladi.",
          ru: "Договор между Пользователями заключается в согласованной сторонами форме в соответствии со статьёй 19 ЗРУ-792." },
      ] },

    { h: { uz: "6. Operatorning huquq va majburiyatlari",
           ru: "6. Права и обязанности Оператора" },
      list: [
        { uz: "Platformaning ishlashini ta'minlash va texnik nosozliklarni imkon qadar tez bartaraf etish.",
          ru: "Обеспечивать работу Платформы и в кратчайший срок устранять технические неисправности." },
        { uz: "Foydalanuvchilarning shaxsga doir ma'lumotlarini Maxfiylik siyosatiga va ZRU-547 talablariga muvofiq qayta ishlash va himoya qilish.",
          ru: "Обрабатывать и защищать персональные данные Пользователей в соответствии с Политикой конфиденциальности и требованиями ЗРУ-547." },
        { uz: "Qonunchilikka zid, yolg'on yoki uchinchi shaxslarning huquqlarini buzuvchi materiallarni olib tashlash va bunday materialni joylashtirgan Foydalanuvchining kirishini cheklash.",
          ru: "Удалять материалы, противоречащие законодательству, недостоверные или нарушающие права третьих лиц, и ограничивать доступ разместившего их Пользователя." },
        { uz: "Offerta shartlarini o'zgartirish — o'zgarishlar shu sahifada e'lon qilinadi va e'lon qilingan kundan kuchga kiradi, agar hujjatda kechroq sana ko'rsatilmagan bo'lsa.",
          ru: "Изменять условия оферты — изменения публикуются на этой странице и вступают в силу со дня публикации, если в документе не указана более поздняя дата." },
        { uz: "Profilaktika ishlari uchun Platforma ishini vaqtincha to'xtatish, bu haqda imkoniyat bo'lganda oldindan xabar berish.",
          ru: "Временно приостанавливать работу Платформы для профилактических работ, уведомляя об этом заранее при наличии возможности." },
      ] },

    { h: { uz: "7. Foydalanuvchining majburiyatlari va oshkor qilish talabi",
           ru: "7. Обязанности Пользователя и требование о раскрытии" },
      p: [
        { uz: "ZRU-792 9-moddasi va Qoidalarning 24-bandiga muvofiq, Sotuvchi o'zi haqida haqiqiy ma'lumotni elektron shaklda taqdim etishi SHART. Bu ma'lumot bitim tuzilgunga qadar Xaridorga ochiq bo'lishi kerak:",
          ru: "В соответствии со статьёй 9 ЗРУ-792 и пунктом 24 Правил Продавец ОБЯЗАН предоставить достоверные сведения о себе в электронной форме. Эти сведения должны быть доступны Покупателю до заключения сделки:" },
      ],
      list: [
        { uz: "to'liq nomi va tashkiliy-huquqiy shakli;",
          ru: "полное наименование и организационно-правовая форма;" },
        { uz: "davlat ro'yxatidan o'tkazilganligi to'g'risidagi ma'lumot va STIR;",
          ru: "сведения о государственной регистрации и ИНН;" },
        { uz: "joylashgan joyi (pochta manzili);",
          ru: "местонахождение (почтовый адрес);" },
        { uz: "elektron pochta manzili va bog'lanish uchun telefon raqami;",
          ru: "адрес электронной почты и контактный телефон;" },
        { uz: "faoliyat litsenziyalanadigan yoki ruxsat berish tartibida amalga oshiriladigan hollarda — litsenziya yoki ruxsat hujjati raqami, amal qilish muddati va uni bergan organ nomi.",
          ru: "при лицензируемой или разрешительной деятельности — номер лицензии либо разрешительного документа, срок действия и наименование выдавшего органа." },
      ],
      after: [
        { uz: "Foydalanuvchi taqdim etgan ma'lumotning haqiqiyligi uchun o'zi javob beradi. Ma'lumot o'zgarganda Foydalanuvchi uni Kabinetda darhol yangilashi shart.",
          ru: "Пользователь самостоятельно отвечает за достоверность предоставленных сведений. При изменении сведений Пользователь обязан незамедлительно обновить их в Кабинете." },
        { uz: "Foydalanuvchi login va parolning maxfiyligini ta'minlaydi. Kabinet orqali amalga oshirilgan barcha harakatlar, agar Foydalanuvchi kirish ma'lumotlari o'g'irlangani haqida Operatorga xabar bermagan bo'lsa, Foydalanuvchining harakatlari deb hisoblanadi.",
          ru: "Пользователь обеспечивает конфиденциальность логина и пароля. Все действия, совершённые через Кабинет, считаются действиями Пользователя, если он не уведомил Оператора о компрометации данных доступа." },
        { uz: "Foydalanuvchiga taqiqlanadi: qonun bilan muomalasi cheklangan tovarlarni tegishli ruxsatsiz taklif etish; yolg'on ma'lumot joylashtirish; boshqa shaxsning nomidan uning roziligisiz ish ko'rish; Platformaning ishiga texnik aralashish.",
          ru: "Пользователю запрещается: предлагать товары ограниченного оборота без соответствующего разрешения; размещать недостоверные сведения; действовать от имени другого лица без его согласия; осуществлять техническое вмешательство в работу Платформы." },
      ] },

    { h: { uz: "8. Narx va hisob-kitob", ru: "8. Цена и расчёты" },
      p: [
        { uz: "Tovar, ish yoki xizmat narxi Sotuvchi tomonidan belgilanadi va Platformada ko'rsatiladi. Narx O'zbekiston Respublikasi qonunchiligiga muvofiq soliqlarni hisobga olgan holda ko'rsatiladi.",
          ru: "Цена товара, работы или услуги устанавливается Продавцом и указывается на Платформе. Цена указывается с учётом налогов в соответствии с законодательством Республики Узбекистан." },
        { uz: "Hisob-kitob bevosita Sotuvchi va Xaridor o'rtasida amalga oshiriladi. Operator to'lovlarni qabul qilmaydi va ular uchun javobgar emas, agar tegishli xizmat alohida e'lon qilinmagan bo'lsa.",
          ru: "Расчёты производятся непосредственно между Продавцом и Покупателем. Оператор не принимает платежи и не отвечает за них, если соответствующая услуга не объявлена отдельно." },
      ] },

    { h: { uz: "9. Javobgarlik", ru: "9. Ответственность" },
      p: [
        { uz: "Operator axborot vositachisi sifatida Foydalanuvchi joylashtirgan ma'lumotning mazmuni, tovarning sifati, miqdori va yetkazib berilishi uchun javobgar emas.",
          ru: "Оператор как информационный посредник не отвечает за содержание размещённых Пользователем сведений, за качество, количество и поставку товара." },
        { uz: "Operator qonunbuzarlik haqida xabar olgan va qonunchilikda belgilangan tartibda choralar ko'rmagan hollarda javobgarlikdan ozod etilmaydi.",
          ru: "Оператор не освобождается от ответственности в случаях, когда он получил уведомление о нарушении и не принял меры в установленном законодательством порядке." },
        { uz: "Operator Platformaning uzluksiz ishlashini kafolatlamaydi va texnik uzilishlar natijasida yuzaga kelgan bilvosita zararlar uchun javob bermaydi.",
          ru: "Оператор не гарантирует бесперебойную работу Платформы и не отвечает за косвенные убытки, возникшие вследствие технических перебоев." },
        { uz: "Foydalanuvchi o'zi joylashtirgan ma'lumot va tuzgan bitimlar bo'yicha to'liq javobgar bo'ladi.",
          ru: "Пользователь несёт полную ответственность за размещённые им сведения и заключённые сделки." },
      ] },

    { h: { uz: "10. Sun'iy intellekt xizmatlari", ru: "10. Сервисы искусственного интеллекта" },
      p: [
        { uz: "Platformada sun'iy intellektga asoslangan yordamchi va tahlil vositalari mavjud. Ular tomonidan tayyorlangan matn, hisob-kitob yoki tavsiya axborot xarakteriga ega bo'lib, yuridik, moliyaviy yoki soliq maslahati hisoblanmaydi va mustaqil tekshiruvni almashtirmaydi.",
          ru: "На Платформе доступны помощник и аналитические инструменты на основе искусственного интеллекта. Подготовленные ими текст, расчёт или рекомендация носят информационный характер, не являются юридической, финансовой или налоговой консультацией и не заменяют самостоятельную проверку." },
        { uz: "Foydalanuvchi AI yordamchisiga yuborgan matn qayta ishlash uchun Maxfiylik siyosatining tegishli bo'limida ko'rsatilgan xizmat ko'rsatuvchiga uzatiladi. Foydalanuvchi u yerga maxfiy yoki uchinchi shaxslarning shaxsga doir ma'lumotlarini kiritmasligi tavsiya etiladi.",
          ru: "Текст, направляемый Пользователем ИИ-помощнику, передаётся для обработки поставщику услуги, указанному в соответствующем разделе Политики конфиденциальности. Пользователю не рекомендуется вводить туда конфиденциальные сведения или персональные данные третьих лиц." },
      ] },

    { h: { uz: "11. Shaxsga doir ma'lumotlar", ru: "11. Персональные данные" },
      p: [
        { uz: "Shaxsga doir ma'lumotlarni qayta ishlash tartibi Maxfiylik siyosatida belgilangan bo'lib, u ushbu offertaning ajralmas qismi hisoblanadi. Offertani aksept qilish orqali Foydalanuvchi ushbu siyosat bilan tanishganini tasdiqlaydi.",
          ru: "Порядок обработки персональных данных определён Политикой конфиденциальности, которая является неотъемлемой частью настоящей оферты. Акцептуя оферту, Пользователь подтверждает ознакомление с указанной политикой." },
      ],
      links: ["maxfiylik"] },

    { h: { uz: "12. Nizolarni hal qilish", ru: "12. Разрешение споров" },
      p: [
        { uz: "Nizolar da'vo (pretenziya) tartibida hal etiladi. Da'vo {email} manziliga yuboriladi va 30 (o'ttiz) kalendar kun ichida ko'rib chiqiladi.",
          ru: "Споры разрешаются в претензионном порядке. Претензия направляется на адрес {email} и рассматривается в течение 30 (тридцати) календарных дней." },
        { uz: "Kelishuvga erishilmagan taqdirda nizo O'zbekiston Respublikasi qonunchiligiga muvofiq sud tartibida hal qilinadi.",
          ru: "При недостижении соглашения спор разрешается в судебном порядке в соответствии с законодательством Республики Узбекистан." },
      ] },

    { h: { uz: "13. Yakuniy qoidalar", ru: "13. Заключительные положения" },
      p: [
        { uz: "Ushbu offertaga va uning asosida tuzilgan shartnomalarga O'zbekiston Respublikasi qonunchiligi qo'llaniladi.",
          ru: "К настоящей оферте и заключённым на её основе договорам применяется законодательство Республики Узбекистан." },
        { uz: "Offertaning ayrim qoidasi haqiqiy emas deb topilsa, qolgan qoidalari o'z kuchini saqlaydi.",
          ru: "Признание отдельного положения оферты недействительным не влечёт недействительности остальных положений." },
        { uz: "Offerta o'zbek va rus tillarida e'lon qilinadi. Matnlar o'rtasida tafovut bo'lganda o'zbek tilidagi matn ustunlik qiladi.",
          ru: "Оферта публикуется на узбекском и русском языках. При расхождении текстов преимущественную силу имеет текст на узбекском языке." },
      ] },
  ],
};
