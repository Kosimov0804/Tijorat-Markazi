/* ============================================================
   MOLIYA BOZORI — loyiha skoringi: METODIKA KONFIGURATSIYASI

   Bu fayl butun skoring metodikasining yagona manbai: vaznlar,
   pog'onalar, to'xtatuvchi (knockout) mezonlar, yo'naltirish
   bosqichlari, ma'lumotnomalar va institutlar urug' reyestri.
   Metodikani o'zgartirish uchun FAQAT shu faylni tahrirlash kerak —
   sehrgar, natija sahifasi, "Metodika" jadvali, simulyator, CSV
   eksport va serverdagi rasmiy hisob hammasi shundan o'qiydi.

   Nega alohida fayl: loyihada 800 qatorlik fayl shifti bor
   (qarang moliya-forms.js sarlavhasi), va metodika jadvali
   hisob-kitob mantig'idan ko'ra tez-tez o'zgaradi — ikkisini
   ajratib qo'ysak, vazn o'zgartirish dvigatelga tegmaydi.

   Yuklash tartibi MUHIM: brauzerda bu fayl
   moliya-scoring-core.js DAN OLDIN ulanadi.
   ============================================================ */
(function (factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.MS_CONFIG = api;
})(function () {
"use strict";

/* =========================================================================
   1-BO'LIM. CONFIG — barcha vaznlar, chegaralar, ro'yxatlar shu yerda.
   Metodikani sozlash uchun FAQAT shu obyektni tahrirlash kifoya; sahifa,
   metodika jadvali, simulyator va CSV eksport hammasi shundan o'qiydi.
   ========================================================================= */
const CONFIG = {
  meta: { version: "1.0.0" },

  /* Ma'lumotnomalar — har bir yozuv uch tilda: { id, uz, ru, en }.
     Saqlanadigan qiymat HAR DOIM `id`; til almashsa ma'lumot buzilmaydi. */
  references: {
    sectors: [
      { id: "agriculture", uz: "Qishloq xo'jaligi", ru: "Сельское хозяйство", en: "Agriculture" },
      { id: "food", uz: "Oziq-ovqat sanoati", ru: "Пищевая промышленность", en: "Food industry" },
      { id: "construction", uz: "Qurilish", ru: "Строительство", en: "Construction" },
      { id: "logistics", uz: "Transport va logistika", ru: "Транспорт и логистика", en: "Transport & logistics" },
      { id: "it", uz: "Axborot texnologiyalari", ru: "Информационные технологии", en: "Information technology" },
      { id: "energy", uz: "Energetika", ru: "Энергетика", en: "Energy" },
      { id: "textile", uz: "To'qimachilik", ru: "Текстильная промышленность", en: "Textiles" },
      { id: "chemical", uz: "Kimyo sanoati", ru: "Химическая промышленность", en: "Chemicals" },
      { id: "healthcare", uz: "Sog'liqni saqlash", ru: "Здравоохранение", en: "Healthcare" },
      { id: "tourism", uz: "Turizm va mehmonxona xo'jaligi", ru: "Туризм и гостиничное хозяйство", en: "Tourism & hospitality" },
      { id: "trade", uz: "Savdo", ru: "Торговля", en: "Trade" },
      { id: "other_manufacturing", uz: "Boshqa ishlab chiqarish", ru: "Прочее производство", en: "Other manufacturing" },
    ],
    regions: [
      { id: "tashkent_city", uz: "Toshkent shahri", ru: "город Ташкент", en: "Tashkent city" },
      { id: "tashkent_region", uz: "Toshkent viloyati", ru: "Ташкентская область", en: "Tashkent region" },
      { id: "andijan", uz: "Andijon viloyati", ru: "Андижанская область", en: "Andijan region" },
      { id: "fergana", uz: "Farg'ona viloyati", ru: "Ферганская область", en: "Fergana region" },
      { id: "namangan", uz: "Namangan viloyati", ru: "Наманганская область", en: "Namangan region" },
      { id: "samarkand", uz: "Samarqand viloyati", ru: "Самаркандская область", en: "Samarkand region" },
      { id: "bukhara", uz: "Buxoro viloyati", ru: "Бухарская область", en: "Bukhara region" },
      { id: "khorezm", uz: "Xorazm viloyati", ru: "Хорезмская область", en: "Khorezm region" },
      { id: "navoi", uz: "Navoiy viloyati", ru: "Навоийская область", en: "Navoi region" },
      { id: "kashkadarya", uz: "Qashqadaryo viloyati", ru: "Кашкадарьинская область", en: "Kashkadarya region" },
      { id: "surkhandarya", uz: "Surxondaryo viloyati", ru: "Сурхандарьинская область", en: "Surkhandarya region" },
      { id: "jizzakh", uz: "Jizzax viloyati", ru: "Джизакская область", en: "Jizzakh region" },
      { id: "sirdarya", uz: "Sirdaryo viloyati", ru: "Сырдарьинская область", en: "Sirdarya region" },
      { id: "karakalpakstan", uz: "Qoraqalpog'iston Respublikasi", ru: "Республика Каракалпакстан", en: "Republic of Karakalpakstan" },
    ],
    currencies: ["UZS", "USD", "EUR"],
    financingTypes: [
      { id: "kredit", uz: "Kredit", ru: "Кредит", en: "Loan" },
      { id: "ulush", uz: "Ulush (equity)", ru: "Доля (equity)", en: "Equity" },
      { id: "mezzanin", uz: "Mezzanin", ru: "Мезонин", en: "Mezzanine" },
    ],
    consultants: {
      big5: ["EY", "KPMG", "Deloitte", "PwC", "Grant Thornton"],
      recognized: [
        "Gaffurov, Kardash & Partners", "HLB/Veritas", "Kreston",
        "TAS Capital Partners", "Wisdom Advisors", "Crowe TAC",
      ],
    },
    legalFirms: [
      { id: "grata", uz: "GRATA International", ru: "GRATA International", en: "GRATA International" },
      { id: "costa", uz: "Costa Legal", ru: "Costa Legal", en: "Costa Legal" },
      { id: "dentons", uz: "Dentons", ru: "Dentons", en: "Dentons" },
      { id: "other_local", uz: "Boshqa / mahalliy", ru: "Другая / местная", en: "Other / local" },
    ],
    auditOpinionTypes: [
      { id: "toza", uz: "Toza (unqualified)", ru: "Безоговорочно положительное", en: "Unqualified (clean)" },
      { id: "shartli", uz: "Shartli (qualified)", ru: "С оговоркой", en: "Qualified" },
      { id: "salbiy", uz: "Salbiy (adverse)", ru: "Отрицательное", en: "Adverse" },
    ],
    ddAreas: [
      { id: "financial", uz: "Moliyaviy DD", ru: "Финансовый DD", en: "Financial DD" },
      { id: "tax", uz: "Soliq DD", ru: "Налоговый DD", en: "Tax DD" },
      { id: "technical", uz: "Texnik DD", ru: "Технический DD", en: "Technical DD" },
      { id: "legal", uz: "Yuridik DD", ru: "Юридический DD", en: "Legal DD" },
      { id: "commercial", uz: "Tijorat DD", ru: "Коммерческий DD", en: "Commercial DD" },
      { id: "business_valuation", uz: "Mustaqil biznes baholash", ru: "Независимая оценка бизнеса", en: "Independent business valuation" },
    ],
    ddStatusOptions: [
      { id: "done", uz: "Yakunlangan", ru: "Завершён", en: "Completed" },
      { id: "in_progress", uz: "Jarayonda", ru: "В процессе", en: "In progress" },
      { id: "planned", uz: "Rejalashtirilgan", ru: "Запланирован", en: "Planned" },
      { id: "none", uz: "Yo'q", ru: "Нет", en: "None" },
    ],
    exitTypes: [
      { id: "buyback", uz: "Ulushni sotib olish", ru: "Выкуп доли", en: "Share buyback" },
      { id: "trade_sale", uz: "Strategik investorga sotish", ru: "Продажа стратегическому инвестору", en: "Trade sale to a strategic investor" },
      { id: "ipo", uz: "IPO", ru: "IPO", en: "IPO" },
      { id: "refinance", uz: "Qayta moliyalashtirish", ru: "Рефинансирование", en: "Refinancing" },
    ],
    projectStatuses: [
      { id: "draft", uz: "Qoralama", ru: "Черновик", en: "Draft" },
      { id: "scored", uz: "Baholandi", ru: "Оценён", en: "Scored" },
      { id: "submitted", uz: "Yuborildi", ru: "Отправлен", en: "Submitted" },
      { id: "review", uz: "Ko'rib chiqilmoqda", ru: "На рассмотрении", en: "Under review" },
      { id: "approved", uz: "Tasdiqlandi", ru: "Одобрен", en: "Approved" },
      { id: "rejected", uz: "Rad etildi", ru: "Отклонён", en: "Rejected" },
    ],
    userRoles: [
      { id: "tashabbuskor", uz: "Tashabbuskor", ru: "Инициатор", en: "Initiator" },
      { id: "ekspert", uz: "Jamg'arma eksperti", ru: "Эксперт Фонда", en: "Fund expert" },
      { id: "admin", uz: "Admin", ru: "Администратор", en: "Admin" },
    ],

    /* Loyiha turi — qaysi baholash yo'li (metodika) qo'llanilishini belgilaydi */
    projectTypes: [
      { id: "company", uz: "Korxona (company-level)", ru: "Предприятие (company-level)", en: "Company (established)" },
      { id: "startup", uz: "Startup", ru: "Стартап", en: "Startup" },
    ],

    /* --- Startup yo'li uchun ma'lumotnomalar --- */
    teamExperience: [
      { id: "full", uz: "To'liq tajribali, komplementar jamoa", ru: "Полная команда с взаимодополняющим опытом", en: "Full team with complementary experience" },
      { id: "partial", uz: "Qisman tajribali jamoa", ru: "Частично опытная команда", en: "Partially experienced team" },
      { id: "solo", uz: "Yagona asoschi", ru: "Единственный основатель", en: "Solo founder" },
      { id: "none", uz: "Jamoa shakllanmagan", ru: "Команда не сформирована", en: "No team formed" },
    ],
    productStage: [
      { id: "launched", uz: "Bozorga chiqqan, daromad keltirmoqda", ru: "Вышел на рынок, генерирует выручку", en: "Launched, generating revenue" },
      { id: "mvp", uz: "MVP/pilot mijozlar bilan sinovdan o'tgan", ru: "MVP протестирован с пилотными клиентами", en: "MVP tested with pilot customers" },
      { id: "prototype", uz: "Prototip tayyor", ru: "Готов прототип", en: "Prototype ready" },
      { id: "idea", uz: "Faqat g'oya/kontseptsiya", ru: "Только идея/концепция", en: "Idea/concept only" },
    ],
    marketValidation: [
      { id: "validated", uz: "Tasdiqlangan talab (LOI, pilot shartnomalar, dastlabki sotuvlar)", ru: "Подтверждённый спрос (LOI, пилотные договоры, первые продажи)", en: "Validated demand (LOIs, pilot contracts, first sales)" },
      { id: "partial", uz: "Bozor tahlili bor, talab qisman tasdiqlangan", ru: "Есть анализ рынка, спрос подтверждён частично", en: "Market analysis done, demand partially validated" },
      { id: "analysis_only", uz: "Faqat bozor tahlili", ru: "Только анализ рынка", en: "Market analysis only" },
      { id: "none", uz: "Yo'q", ru: "Нет", en: "None" },
    ],
    fundingHistory: [
      { id: "successful_round", uz: "Oldingi bosqich (pre-seed/seed) muvaffaqiyatli yakunlangan, aniq metrikalar bor", ru: "Предыдущий раунд (pre-seed/seed) закрыт успешно, есть чёткие метрики", en: "Previous round (pre-seed/seed) closed successfully, clear metrics" },
      { id: "early_funding", uz: "Dastlabki moliyalashtirish bor, metrikalar boshlang'ich", ru: "Есть начальное финансирование, метрики ранние", en: "Early funding raised, metrics at an early stage" },
      { id: "own_funds", uz: "Faqat o'z mablag'i bilan rivojlantirilmoqda", ru: "Развивается только на собственные средства", en: "Bootstrapped with own funds only" },
      { id: "none", uz: "Moliyalashtirish tarixi yo'q", ru: "Истории финансирования нет", en: "No funding history" },
    ],
    startupFinModelQuality: [
      { id: "reviewed", uz: "Batafsil model (unit-economics), tashqi/ichki maslahatchi ko'rib chiqqan", ru: "Детальная модель (unit-economics), проверена консультантом", en: "Detailed model (unit economics), reviewed by an advisor" },
      { id: "internal", uz: "Asosli model, ichki resurslar bilan tayyorlangan", ru: "Обоснованная модель, подготовлена внутренними силами", en: "Sound model, prepared in-house" },
      { id: "basic", uz: "Soddalashtirilgan/umumiy prognoz", ru: "Упрощённый/общий прогноз", en: "Simplified/high-level forecast" },
      { id: "none", uz: "Moliyaviy prognoz yo'q", ru: "Финансового прогноза нет", en: "No financial forecast" },
    ],
    potentialTiers: [
      { id: "high", uz: "Yuqori o'sish salohiyati (3x+ potensial qaytim)", ru: "Высокий потенциал роста (3x+ потенциальная доходность)", en: "High growth potential (3x+ potential return)" },
      { id: "mid", uz: "O'rtacha o'sish salohiyati (2-3x)", ru: "Средний потенциал роста (2–3x)", en: "Moderate growth potential (2–3x)" },
      { id: "low", uz: "Past/mo'tadil salohiyat (1,5-2x)", ru: "Низкий/умеренный потенциал (1,5–2x)", en: "Low/modest potential (1.5–2x)" },
      { id: "unclear", uz: "Hali aniq emas", ru: "Пока не определён", en: "Not yet clear" },
    ],
    legalIpStatus: [
      { id: "registered_ip_protected", uz: "Yuridik shaxs ro'yxatdan o'tgan + IP (patent/tovar belgisi) himoyalangan", ru: "Юрлицо зарегистрировано + ИС (патент/товарный знак) защищена", en: "Legal entity registered + IP (patent/trademark) protected" },
      { id: "registered_ip_pending", uz: "Yuridik shaxs ro'yxatdan o'tgan, IP himoyasi jarayonda", ru: "Юрлицо зарегистрировано, защита ИС в процессе", en: "Legal entity registered, IP protection in progress" },
      { id: "registration_in_progress", uz: "Ro'yxatdan o'tish jarayonida", ru: "В процессе регистрации", en: "Registration in progress" },
      { id: "none", uz: "Yuridik shaxs ro'yxatdan o'tmagan", ru: "Юрлицо не зарегистрировано", en: "Legal entity not registered" },
    ],
    nextStageExit: [
      { id: "clear_plan", uz: "Aniq keyingi raund/exit rejasi (investor yoki xaridor yo'nalishi aniqlangan)", ru: "Чёткий план следующего раунда/выхода (определён инвестор или покупатель)", en: "Clear next-round/exit plan (investor or buyer identified)" },
      { id: "general_direction", uz: "Umumiy exit/keyingi bosqich yo'nalishi bor", ru: "Есть общее направление выхода/следующего этапа", en: "General exit/next-stage direction defined" },
      { id: "intent_only", uz: "Faqat niyat bayoni", ru: "Только декларация о намерениях", en: "Statement of intent only" },
      { id: "none", uz: "Yo'q", ru: "Нет", en: "None" },
    ],
  },

  macro: {
    cbRateUZS: 14,          // MB asosiy stavkasi, % — loyiha shakliga default sifatida beriladi
    hurdleForeignCcy: 10,   // USD/EUR loyihalar uchun chegara (hurdle), %
    hurdleLocalSpreadPp: 8, // UZS uchun: mbStavkasi + 8 foiz punkti
    defaultDiscountRate: 16,
    /* Institutlar reyestridagi min_summa/max_summa har doim USD ekvivalentida
       saqlanadi (turli valyutadagi loyihalarni bitta shkalada solishtirish
       uchun). Moslashtirish filtrida loyiha summasi shu kurs bo'yicha USD'ga
       o'tkaziladi. */
    fxToUsd: { UZS: 1 / 12800, USD: 1, EUR: 1.08 },
  },

  scoring: {
    weights: { teo: 15, audit: 12, continuity: 13, netProfit: 10, dueDiligence: 15, irr: 15, debtBurden: 12, exit: 8 },
    teo: { big5: 15, recognized: 10, internal: 5, none: 0 },
    audit: { threeYearCleanBig5: 12, threeYearCleanOther: 9, oneToTwoYear: 5, contractSignedInProgress: 3, none: 0 },
    continuity: { threeYearsThreeProfitable: 13, threeYearsTwoProfitable: 9, oneYearProfitable: 5, greenfield: 0 },
    netProfit: { threeYears: 10, twoYears: 6, oneYear: 3, none: 0 },
    dueDiligence: { allSixBig5: 15, threeToFive: 10, onlyConsultingLegal: 7, plannedApproved: 4, none: 0 },
    irr: { hurdlePlus8pp: 15, hurdlePlus4pp: 13, atHurdle: 10, belowUpTo2pp: 5, belowMore: 0 },
    debtBurden: {
      debtEbitda: { le1_5: 6, le2_5: 5, le3_0: 4, above3_0: 0 },
      dscr: { ge1_8: 6, ge1_5: 5, ge1_2: 4, below1_2: 0 },
    },
    exit: { fullContractFormulaTerm: 8, generalDescriptionNoFormula: 5, intentOnly: 2, none: 0 },
  },

  /* Startup yo'li — company-level metodikadan BUTUNLAY ALOHIDA, yumshoqroq
     100 ballik baholash. Qattiq knockout mezonlari qo'llanilmaydi. */
  startupScoring: {
    weights: { team: 20, product: 15, market: 15, funding: 10, finModel: 15, potential: 10, legal: 8, exit: 7 },
    team: { full: 20, partial: 14, solo: 8, none: 0 },
    product: { launched: 15, mvp: 11, prototype: 6, idea: 0 },
    market: { validated: 15, partial: 10, analysis_only: 5, none: 0 },
    funding: { successful_round: 10, early_funding: 6, own_funds: 3, none: 0 },
    finModel: { reviewed: 15, internal: 10, basic: 5, none: 0 },
    potential: { high: 10, mid: 7, low: 4, unclear: 0 },
    legal: { registered_ip_protected: 8, registered_ip_pending: 5, registration_in_progress: 2, none: 0 },
    exit: { clear_plan: 7, general_direction: 4, intent_only: 2, none: 0 },
  },

  knockout: {
    capScore: 59,
    rules: [
      { id: "irr_below_hurdle", uz: "IRR belgilangan chegaradan (hurdle) past", ru: "IRR ниже установленного порога (hurdle)", en: "IRR below the required hurdle rate" },
      { id: "debt_ebitda_high", uz: "Debt/EBITDA > 3,0", ru: "Debt/EBITDA > 3,0", en: "Debt/EBITDA > 3.0" },
      { id: "dscr_low", uz: "DSCR < 1,2", ru: "DSCR < 1,2", en: "DSCR < 1.2" },
      { id: "no_net_profit_3y", uz: "Oxirgi 3 yilda sof foyda ko'rilmagan", ru: "За последние 3 года чистая прибыль не получена", en: "No net profit in the last 3 years" },
      { id: "no_exit_strategy", uz: "Exit strategiya umuman mavjud emas", ru: "Стратегия выхода полностью отсутствует", en: "No exit strategy at all" },
    ],
  },

  routing: {
    thresholds: [
      { min: 90, max: 100, status: "tayyor", color: "emerald", action: "auto_route",
        uz: "Moliyalashtirishga tayyor", ru: "Готов к финансированию", en: "Ready for financing" },
      { min: 75, max: 89, status: "shartli", color: "sky", action: "expert_queue",
        uz: "Shartli tayyor", ru: "Условно готов", en: "Conditionally ready" },
      { min: 60, max: 74, status: "qayta_ishlash", color: "amber", action: "gap_report",
        uz: "Qayta ishlash talab etiladi", ru: "Требуется доработка", en: "Requires rework" },
      { min: 0, max: 59, status: "rad_etilgan", color: "rose", action: "reject",
        uz: "Rad etilgan", ru: "Отклонён", en: "Rejected" },
    ],
    /* Institutlarga yo'naltirish shu balldan boshlab ochiladi (va knockout bo'lmasa). */
    unlockScore: 75,
  },

  institutionTypes: [
    { id: "bank", uz: "Bank", ru: "Банк", en: "Bank" },
    { id: "investitsiya_fondi", uz: "Investitsiya fondi", ru: "Инвестиционный фонд", en: "Investment fund" },
    { id: "DFI", uz: "DFI (taraqqiyot instituti)", ru: "DFI (институт развития)", en: "DFI (development institution)" },
    { id: "lizing", uz: "Lizing", ru: "Лизинг", en: "Leasing" },
  ],

  /* Urug' (seed) reyestr — min_summa / max_summa USD ekvivalentida,
     sektorlar CONFIG.references.sectors dagi `id` qiymatlari ([] = barchasi).
     Jonli provayderlar srv/moliya.js dagi mahsulot katalogidan qo'shiladi
     (routable + minScore maydonlari orqali) — qarang srv/moliya-scoring.js
     → institutionRegistry(). Shuning uchun bu ro'yxat "yagona haqiqat" emas,
     u boshlang'ich to'plam. */
  institutions: [
    { id: "ipak-yuli-bank", seed: true, nomi: { uz: "Ipak Yo'li Bank", ru: "Ipak Yo'li Bank", en: "Ipak Yo'li Bank" }, turi: "bank", min_summa: 50000, max_summa: 4000000, valyutalar: ["UZS", "USD"], sektorlar: ["agriculture", "food", "logistics"], max_muddat: 7, min_ball: 75, aloqa_email: "invest@ipakyulibank.uz" },
    { id: "hamkorbank", seed: true, nomi: { uz: "Hamkorbank", ru: "Hamkorbank", en: "Hamkorbank" }, turi: "bank", min_summa: 25000, max_summa: 2500000, valyutalar: ["UZS"], sektorlar: ["agriculture", "trade", "other_manufacturing"], max_muddat: 5, min_ball: 70, aloqa_email: "sme@hamkorbank.uz" },
    { id: "aloqabank", seed: true, nomi: { uz: "Aloqabank", ru: "Aloqabank", en: "Aloqabank" }, turi: "bank", min_summa: 15000, max_summa: 1600000, valyutalar: ["UZS"], sektorlar: ["it", "logistics"], max_muddat: 5, min_ball: 65, aloqa_email: "corp@aloqabank.uz" },
    { id: "silkroad-fund", seed: true, nomi: { uz: "Silk Road Growth Fund", ru: "Silk Road Growth Fund", en: "Silk Road Growth Fund" }, turi: "investitsiya_fondi", min_summa: 100000, max_summa: 8000000, valyutalar: ["USD", "EUR"], sektorlar: ["agriculture", "energy", "healthcare"], max_muddat: 8, min_ball: 85, aloqa_email: "deals@silkroadgrowth.com" },
    { id: "uzbek-invest-fund", seed: true, nomi: { uz: "O'zbekiston Investitsiya Fondi", ru: "Инвестиционный фонд Узбекистана", en: "Uzbekistan Investment Fund" }, turi: "investitsiya_fondi", min_summa: 150000, max_summa: 15000000, valyutalar: ["UZS", "USD"], sektorlar: [], max_muddat: 10, min_ball: 90, aloqa_email: "office@uzinvestfund.uz" },
    { id: "eco-agro-capital", seed: true, nomi: { uz: "EcoAgro Capital Partners", ru: "EcoAgro Capital Partners", en: "EcoAgro Capital Partners" }, turi: "investitsiya_fondi", min_summa: 40000, max_summa: 1200000, valyutalar: ["USD"], sektorlar: ["agriculture", "food"], max_muddat: 6, min_ball: 88, aloqa_email: "invest@ecoagrocapital.com" },
    { id: "efse-dfi", seed: true, nomi: { uz: "European Fund for Southeast Europe (EFSE)", ru: "European Fund for Southeast Europe (EFSE)", en: "European Fund for Southeast Europe (EFSE)" }, turi: "DFI", min_summa: 80000, max_summa: 6000000, valyutalar: ["USD", "EUR"], sektorlar: ["agriculture", "other_manufacturing"], max_muddat: 10, min_ball: 80, aloqa_email: "info@efse.lu" },
    { id: "adb-dfi", seed: true, nomi: { uz: "Osiyo Taraqqiyot Banki (ADB)", ru: "Азиатский банк развития (ADB)", en: "Asian Development Bank (ADB)" }, turi: "DFI", min_summa: 400000, max_summa: 40000000, valyutalar: ["USD"], sektorlar: ["energy", "logistics", "construction"], max_muddat: 15, min_ball: 90, aloqa_email: "uzrm@adb.org" },
    { id: "ifc-dfi", seed: true, nomi: { uz: "Xalqaro Moliya Korporatsiyasi (IFC)", ru: "Международная финансовая корпорация (IFC)", en: "International Finance Corporation (IFC)" }, turi: "DFI", min_summa: 240000, max_summa: 24000000, valyutalar: ["USD"], sektorlar: [], max_muddat: 12, min_ball: 92, aloqa_email: "uzbekistan@ifc.org" },
    { id: "tas-leasing", seed: true, nomi: { uz: "TAS Moliya Leasing", ru: "TAS Moliya Leasing", en: "TAS Moliya Leasing" }, turi: "lizing", min_summa: 8000, max_summa: 800000, valyutalar: ["UZS", "USD"], sektorlar: ["logistics", "construction", "other_manufacturing"], max_muddat: 5, min_ball: 60, aloqa_email: "leasing@tasfinance.uz" },
    { id: "orient-leasing", seed: true, nomi: { uz: "Orient Leasing", ru: "Orient Leasing", en: "Orient Leasing" }, turi: "lizing", min_summa: 12000, max_summa: 640000, valyutalar: ["UZS"], sektorlar: ["agriculture", "food"], max_muddat: 4, min_ball: 55, aloqa_email: "sales@orientleasing.uz" },
    { id: "trust-invest-bank", seed: true, nomi: { uz: "TrustInvest Bank", ru: "TrustInvest Bank", en: "TrustInvest Bank" }, turi: "bank", min_summa: 60000, max_summa: 4800000, valyutalar: ["UZS", "USD", "EUR"], sektorlar: ["it", "healthcare", "tourism"], max_muddat: 6, min_ball: 78, aloqa_email: "projects@trustinvestbank.uz" },
  ],
};

return CONFIG;
});
