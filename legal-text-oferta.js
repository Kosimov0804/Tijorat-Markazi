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
    uz: "Uşbu hujjat Özbekiston Respublikasi Fuqarolik kodeksining 367-moddasiga muvofiq ommaviy oferta hisoblanadi va {brand} platformasidan foydalaniş şartlarini belgilaydi. Platformada röyxatdan ötiş, ariza yuboriş yoki uning xizmatlaridan foydalaniş Fuqarolik kodeksining 370-moddasiga binoan uşbu offertani töliq va sözsiz aksept qiliş deb hisoblanadi.",
    ru: "Настоящий документ является публичной офертой в соответствии со статьёй 367 Гражданского кодекса Республики Узбекистан и определяет условия использования платформы {brand}. Регистрация на платформе, направление заявки или использование её сервисов считается полным и безоговорочным акцептом настоящей оферты в соответствии со статьёй 370 Гражданского кодекса.",
  },

  sections: [
    { h: { uz: "1. Umumiy qoidalar", ru: "1. Общие положения" },
      p: [
        { uz: "Oferta {brand} platformasi (bundan buyon — Platforma) orqali körsatiladigan xizmatlardan foydalaniş tartibini belgilaydi.",
          ru: "Оферта определяет порядок пользования услугами, оказываемыми через платформу {brand} (далее — Платформа)." },
        { uz: "Oferta amal qiliş sanasi: {effective}. Hujjat versiyasi: {version}. Amaldagi tahrir doimo şu sahifada eʼlon qilinadi.",
          ru: "Дата вступления оферты в силу: {effective}. Версия документа: {version}. Действующая редакция всегда публикуется на этой странице." },
        { uz: "Offertani aksept qiliş şartlari bilan rozi bölmagan şaxs Platformadan foydalanmasligi kerak.",
          ru: "Лицо, не согласное с условиями оферты, не должно пользоваться Платформой." },
      ] },

    /* Rendered from srv/legal.js — see legal-page.js. Kept as a marked slot
       rather than prose so the requisites cannot drift out of step with the
       footer, which reads the same object. */
    { h: { uz: "2. Operator töğrisida maʼlumot", ru: "2. Сведения об операторе" },
      slot: "operator",
      p: [
        { uz: "Quyidagi maʼlumotlar «Elektron tijorat töğrisida»gi Özbekiston Respublikasi Qonuni (ZRU-792) va Vazirlar Mahkamasining 2016-yil 2-iyundagi 185-son qarori bilan tasdiqlangan Qoidalarning 24-bandi talablariga muvofiq eʼlon qilinadi.",
          ru: "Нижеследующие сведения публикуются в соответствии с Законом Республики Узбекистан «Об электронной коммерции» (ЗРУ-792) и пунктом 24 Правил, утверждённых постановлением Кабинета Министров от 2 июня 2016 года № 185." },
      ] },

    { h: { uz: "3. Asosiy tuşunçalar", ru: "3. Основные понятия" },
      list: [
        { uz: "Operator — Platformani boşqaruvçi va uning işlaşini taʼminlovçi 2-bandda körsatilgan yuridik şaxs; ZRU-792 maʼnosida axborot vositaçisi.",
          ru: "Оператор — юридическое лицо, указанное в пункте 2, управляющее Платформой и обеспечивающее её работу; информационный посредник в значении ЗРУ-792." },
        { uz: "Foydalanuvçi — Platformada röyxatdan ötgan yoki undan foydalanayotgan yuridik şaxs yoki yakka tartibdagi tadbirkor.",
          ru: "Пользователь — юридическое лицо или индивидуальный предприниматель, зарегистрированный на Платформе или пользующийся ею." },
        { uz: "Sotuvçi — Platformada tovar, iş yoki xizmat taklif etuvçi Foydalanuvçi.",
          ru: "Продавец — Пользователь, предлагающий на Платформе товар, работу или услугу." },
        { uz: "Xaridor — Platforma orqali tovar, iş yoki xizmat sotib olişga qiziqiş bildirgan Foydalanuvçi.",
          ru: "Покупатель — Пользователь, заявивший заинтересованность в приобретении товара, работы или услуги через Платформу." },
        { uz: "Uyuşma — aʼzo korxonalarning arizalarini körib çiquvçi va ularni tasdiqlovçi soha birlaşmasi.",
          ru: "Ассоциация — отраслевое объединение, рассматривающее и подтверждающее заявки предприятий-членов." },
        { uz: "Kabinet — Foydalanuvçining login va parol orqali kiriladigan şaxsiy bölimi.",
          ru: "Кабинет — персональный раздел Пользователя, доступ к которому осуществляется по логину и паролю." },
      ] },

    { h: { uz: "4. Offerta predmeti va Operatorning maqomi",
           ru: "4. Предмет оферты и статус Оператора" },
      p: [
        { uz: "Operator Foydalanuvçilarga elektron savdo maydonçasidan foydalaniş imkonini beradi: eʼlonlar joylaştiriş, sörovlar yuboriş, takliflar oliş, kontragentlarni qidiriş va ular bilan yozişmalar olib boriş.",
          ru: "Оператор предоставляет Пользователям возможность пользования электронной торговой площадкой: размещать объявления, направлять запросы, получать предложения, находить контрагентов и вести с ними переписку." },
        { uz: "MUHIM: Operator Sotuvçi va Xaridor örtasida tuziladigan oldi-sotdi (yoki iş bajariş, xizmat körsatiş) şartnomasining tarafi EMAS. Bunday şartnoma bevosita Foydalanuvçilar örtasida tuziladi va bajariladi. Operator faqat axborot vositaçisi sifatida iştirok etadi.",
          ru: "ВАЖНО: Оператор НЕ является стороной договора купли-продажи (выполнения работ, оказания услуг), заключаемого между Продавцом и Покупателем. Такой договор заключается и исполняется непосредственно между Пользователями. Оператор участвует исключительно как информационный посредник." },
        { uz: "Platformada joylaştirilgan tovar yoki xizmat töğrisidagi maʼlumot, agar Sotuvçi uni oferta sifatida aniq belgilamagan bölsa, oferta qilişga taklif hisoblanadi.",
          ru: "Размещённые на Платформе сведения о товаре или услуге считаются приглашением делать оферты, если Продавец прямо не обозначил их как оферту." },
      ] },

    { h: { uz: "5. Şartnoma tuziş tartibi", ru: "5. Порядок заключения договора" },
      p: [
        { uz: "Operator bilan Foydalanuvçi örtasidagi şartnoma Foydalanuvçi röyxatdan ötiş arizasini yuborgan va uşbu offerta hamda Maxfiylik siyosati şartlarini qabul qilganini tasdiqlagan paytdan tuzilgan hisoblanadi.",
          ru: "Договор между Оператором и Пользователем считается заключённым с момента направления Пользователем заявки на регистрацию и подтверждения им согласия с условиями настоящей оферты и Политики конфиденциальности." },
        { uz: "Kabinetga kiriş huquqi ariza tanlangan Uyuşma yoki Operator tomonidan tasdiqlangandan keyin beriladi. Arizani rad etiş şartnomani tuzişdan boş tortiş hisoblanadi va Operator uçun heç qanday majburiyat yuzaga keltirmaydi.",
          ru: "Право доступа в Кабинет предоставляется после подтверждения заявки выбранной Ассоциацией или Оператором. Отклонение заявки означает отказ от заключения договора и не порождает для Оператора никаких обязательств." },
        { uz: "Foydalanuvçilar örtasidagi şartnoma ZRU-792 19-moddasiga muvofiq, taraflar kelişgan şaklda tuziladi.",
          ru: "Договор между Пользователями заключается в согласованной сторонами форме в соответствии со статьёй 19 ЗРУ-792." },
      ] },

    { h: { uz: "6. Operatorning huquq va majburiyatlari",
           ru: "6. Права и обязанности Оператора" },
      list: [
        { uz: "Platformaning işlaşini taʼminlaş va texnik nosozliklarni imkon qadar tez bartaraf etiş.",
          ru: "Обеспечивать работу Платформы и в кратчайший срок устранять технические неисправности." },
        { uz: "Foydalanuvçilarning şaxsga doir maʼlumotlarini Maxfiylik siyosatiga va ZRU-547 talablariga muvofiq qayta işlaş va himoya qiliş.",
          ru: "Обрабатывать и защищать персональные данные Пользователей в соответствии с Политикой конфиденциальности и требованиями ЗРУ-547." },
        { uz: "Qonunçilikka zid, yolğon yoki uçinçi şaxslarning huquqlarini buzuvçi materiallarni olib taşlaş va bunday materialni joylaştirgan Foydalanuvçining kirişini çeklaş.",
          ru: "Удалять материалы, противоречащие законодательству, недостоверные или нарушающие права третьих лиц, и ограничивать доступ разместившего их Пользователя." },
        { uz: "Offerta şartlarini özgartiriş — özgarişlar şu sahifada eʼlon qilinadi va eʼlon qilingan kundan kuçga kiradi, agar hujjatda keçroq sana körsatilmagan bölsa.",
          ru: "Изменять условия оферты — изменения публикуются на этой странице и вступают в силу со дня публикации, если в документе не указана более поздняя дата." },
        { uz: "Profilaktika işlari uçun Platforma işini vaqtinça töxtatiş, bu haqda imkoniyat bölganda oldindan xabar beriş.",
          ru: "Временно приостанавливать работу Платформы для профилактических работ, уведомляя об этом заранее при наличии возможности." },
      ] },

    { h: { uz: "7. Foydalanuvçining majburiyatlari va oşkor qiliş talabi",
           ru: "7. Обязанности Пользователя и требование о раскрытии" },
      p: [
        { uz: "ZRU-792 9-moddasi va Qoidalarning 24-bandiga muvofiq, Sotuvçi özi haqida haqiqiy maʼlumotni elektron şaklda taqdim etişi ŞART. Bu maʼlumot bitim tuzilgunga qadar Xaridorga oçiq bölişi kerak:",
          ru: "В соответствии со статьёй 9 ЗРУ-792 и пунктом 24 Правил Продавец ОБЯЗАН предоставить достоверные сведения о себе в электронной форме. Эти сведения должны быть доступны Покупателю до заключения сделки:" },
      ],
      list: [
        { uz: "töliq nomi va taşkiliy-huquqiy şakli;",
          ru: "полное наименование и организационно-правовая форма;" },
        { uz: "davlat röyxatidan ötkazilganligi töğrisidagi maʼlumot va STIR;",
          ru: "сведения о государственной регистрации и ИНН;" },
        { uz: "joylaşgan joyi (poçta manzili);",
          ru: "местонахождение (почтовый адрес);" },
        { uz: "elektron poçta manzili va boğlaniş uçun telefon raqami;",
          ru: "адрес электронной почты и контактный телефон;" },
        { uz: "faoliyat litsenziyalanadigan yoki ruxsat beriş tartibida amalga oşiriladigan hollarda — litsenziya yoki ruxsat hujjati raqami, amal qiliş muddati va uni bergan organ nomi.",
          ru: "при лицензируемой или разрешительной деятельности — номер лицензии либо разрешительного документа, срок действия и наименование выдавшего органа." },
      ],
      after: [
        { uz: "Foydalanuvçi taqdim etgan maʼlumotning haqiqiyligi uçun özi javob beradi. Maʼlumot özgarganda Foydalanuvçi uni Kabinetda darhol yangilaşi şart.",
          ru: "Пользователь самостоятельно отвечает за достоверность предоставленных сведений. При изменении сведений Пользователь обязан незамедлительно обновить их в Кабинете." },
        { uz: "Foydalanuvçi login va parolning maxfiyligini taʼminlaydi. Kabinet orqali amalga oşirilgan barça harakatlar, agar Foydalanuvçi kiriş maʼlumotlari öğirlangani haqida Operatorga xabar bermagan bölsa, Foydalanuvçining harakatlari deb hisoblanadi.",
          ru: "Пользователь обеспечивает конфиденциальность логина и пароля. Все действия, совершённые через Кабинет, считаются действиями Пользователя, если он не уведомил Оператора о компрометации данных доступа." },
        { uz: "Foydalanuvçiga taqiqlanadi: qonun bilan muomalasi çeklangan tovarlarni tegişli ruxsatsiz taklif etiş; yolğon maʼlumot joylaştiriş; boşqa şaxsning nomidan uning roziligisiz iş köriş; Platformaning işiga texnik aralaşiş.",
          ru: "Пользователю запрещается: предлагать товары ограниченного оборота без соответствующего разрешения; размещать недостоверные сведения; действовать от имени другого лица без его согласия; осуществлять техническое вмешательство в работу Платформы." },
      ] },

    { h: { uz: "8. Narx va hisob-kitob", ru: "8. Цена и расчёты" },
      p: [
        { uz: "Tovar, iş yoki xizmat narxi Sotuvçi tomonidan belgilanadi va Platformada körsatiladi. Narx Özbekiston Respublikasi qonunçiligiga muvofiq soliqlarni hisobga olgan holda körsatiladi.",
          ru: "Цена товара, работы или услуги устанавливается Продавцом и указывается на Платформе. Цена указывается с учётом налогов в соответствии с законодательством Республики Узбекистан." },
        { uz: "Hisob-kitob bevosita Sotuvçi va Xaridor örtasida amalga oşiriladi. Operator tölovlarni qabul qilmaydi va ular uçun javobgar emas, agar tegişli xizmat alohida eʼlon qilinmagan bölsa.",
          ru: "Расчёты производятся непосредственно между Продавцом и Покупателем. Оператор не принимает платежи и не отвечает за них, если соответствующая услуга не объявлена отдельно." },
      ] },

    { h: { uz: "9. Javobgarlik", ru: "9. Ответственность" },
      p: [
        { uz: "Operator axborot vositaçisi sifatida Foydalanuvçi joylaştirgan maʼlumotning mazmuni, tovarning sifati, miqdori va yetkazib berilişi uçun javobgar emas.",
          ru: "Оператор как информационный посредник не отвечает за содержание размещённых Пользователем сведений, за качество, количество и поставку товара." },
        { uz: "Operator qonunbuzarlik haqida xabar olgan va qonunçilikda belgilangan tartibda çoralar körmagan hollarda javobgarlikdan ozod etilmaydi.",
          ru: "Оператор не освобождается от ответственности в случаях, когда он получил уведомление о нарушении и не принял меры в установленном законодательством порядке." },
        { uz: "Operator Platformaning uzluksiz işlaşini kafolatlamaydi va texnik uzilişlar natijasida yuzaga kelgan bilvosita zararlar uçun javob bermaydi.",
          ru: "Оператор не гарантирует бесперебойную работу Платформы и не отвечает за косвенные убытки, возникшие вследствие технических перебоев." },
        { uz: "Foydalanuvçi özi joylaştirgan maʼlumot va tuzgan bitimlar böyiça töliq javobgar böladi.",
          ru: "Пользователь несёт полную ответственность за размещённые им сведения и заключённые сделки." },
      ] },

    { h: { uz: "10. Sunʼiy intellekt xizmatlari", ru: "10. Сервисы искусственного интеллекта" },
      p: [
        { uz: "Platformada sunʼiy intellektga asoslangan yordamçi va tahlil vositalari mavjud. Ular tomonidan tayyorlangan matn, hisob-kitob yoki tavsiya axborot xarakteriga ega bölib, yuridik, moliyaviy yoki soliq maslahati hisoblanmaydi va mustaqil tekşiruvni almaştirmaydi.",
          ru: "На Платформе доступны помощник и аналитические инструменты на основе искусственного интеллекта. Подготовленные ими текст, расчёт или рекомендация носят информационный характер, не являются юридической, финансовой или налоговой консультацией и не заменяют самостоятельную проверку." },
        { uz: "Foydalanuvçi AI yordamçisiga yuborgan matn qayta işlaş uçun Maxfiylik siyosatining tegişli bölimida körsatilgan xizmat körsatuvçiga uzatiladi. Foydalanuvçi u yerga maxfiy yoki uçinçi şaxslarning şaxsga doir maʼlumotlarini kiritmasligi tavsiya etiladi.",
          ru: "Текст, направляемый Пользователем ИИ-помощнику, передаётся для обработки поставщику услуги, указанному в соответствующем разделе Политики конфиденциальности. Пользователю не рекомендуется вводить туда конфиденциальные сведения или персональные данные третьих лиц." },
      ] },

    { h: { uz: "11. Şaxsga doir maʼlumotlar", ru: "11. Персональные данные" },
      p: [
        { uz: "Şaxsga doir maʼlumotlarni qayta işlaş tartibi Maxfiylik siyosatida belgilangan bölib, u uşbu offertaning ajralmas qismi hisoblanadi. Offertani aksept qiliş orqali Foydalanuvçi uşbu siyosat bilan tanişganini tasdiqlaydi.",
          ru: "Порядок обработки персональных данных определён Политикой конфиденциальности, которая является неотъемлемой частью настоящей оферты. Акцептуя оферту, Пользователь подтверждает ознакомление с указанной политикой." },
      ],
      links: ["maxfiylik"] },

    { h: { uz: "12. Nizolarni hal qiliş", ru: "12. Разрешение споров" },
      p: [
        { uz: "Nizolar daʼvo (pretenziya) tartibida hal etiladi. Daʼvo {email} manziliga yuboriladi va 30 (öttiz) kalendar kun içida körib çiqiladi.",
          ru: "Споры разрешаются в претензионном порядке. Претензия направляется на адрес {email} и рассматривается в течение 30 (тридцати) календарных дней." },
        { uz: "Kelişuvga erişilmagan taqdirda nizo Özbekiston Respublikasi qonunçiligiga muvofiq sud tartibida hal qilinadi.",
          ru: "При недостижении соглашения спор разрешается в судебном порядке в соответствии с законодательством Республики Узбекистан." },
      ] },

    { h: { uz: "13. Yakuniy qoidalar", ru: "13. Заключительные положения" },
      p: [
        { uz: "Uşbu offertaga va uning asosida tuzilgan şartnomalarga Özbekiston Respublikasi qonunçiligi qöllaniladi.",
          ru: "К настоящей оферте и заключённым на её основе договорам применяется законодательство Республики Узбекистан." },
        { uz: "Offertaning ayrim qoidasi haqiqiy emas deb topilsa, qolgan qoidalari öz kuçini saqlaydi.",
          ru: "Признание отдельного положения оферты недействительным не влечёт недействительности остальных положений." },
        { uz: "Offerta özbek va rus tillarida eʼlon qilinadi. Matnlar örtasida tafovut bölganda özbek tilidagi matn ustunlik qiladi.",
          ru: "Оферта публикуется на узбекском и русском языках. При расхождении текстов преимущественную силу имеет текст на узбекском языке." },
      ] },
  ],
};
