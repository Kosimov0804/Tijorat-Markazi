/* ============================================================
   LEGAL — operator identity, document versions, consent proof

   Three separate obligations meet in this file, and they all
   need the same handful of facts, so they read them from here
   rather than from three hand-copied lists that drift apart:

   1. WHO OPERATES THE PLATFORM.  Qoidalar 24-band (KM qarori
      2016-yil 2-iyun 185-son) and the Law "Elektron tijorat
      to'g'risida" (ZRU-792) both require an e-commerce
      participant to publish truthful information about itself
      in electronic form before a deal is struck: full name and
      legal form, state registration and STIR, postal address,
      e-mail, telephone, and any licence it trades under. A
      platform with no requisites in its footer fails this on
      every page.

   2. WHAT THE USER AGREED TO.  Modda 21 of ZRU-547 puts the
      burden of proving consent on the OWNER of the personal
      data base, not on the person. A checkbox that gates a
      form and is then discarded proves nothing. So consent is
      recorded as an event: which document version, at what
      time, from which address, with which user agent.

   3. WHICH VERSION.  A policy that is silently edited cannot
      support a claim about what someone consented to two years
      ago. Every document carries a version and an effective
      date; consent records store the version, so an amended
      policy never rewrites the history of what was accepted.

   ---------------------------------------------------------
   NOTE ON LOCALISATION — deliberately not enforced here.
   Modda 27-1 as amended by ZRU-1125 (2026-yil 26-mart, in
   force 27-mart) narrowed mandatory storage inside Uzbekistan
   to three categories: biometric data, genetic data, and the
   data of users of telecom operators working in Uzbekistan.
   This platform collects none of them — names, e-mails,
   telephone numbers, job titles and company details only — so
   there is no hosting-location mandate and no obligation to
   register a base in the Davlat reyestri. If face photos,
   fingerprints or any biometric identifier are ever added,
   that changes on the day they are added: see COLLECTED below,
   which is the list the privacy policy is generated from.
   ============================================================ */

const H  = require("./store");
const DB = require("../db");

/* ---------- 1. the operator ----------
   The bracketed values below are a TEMPLATE, not data. They name what has to
   be supplied; they are never published. Oversight fills the real registration
   details in from the admin panel (Sozlamalar -> Operator rekvizitlari), they
   are persisted through db.js like every other collection, and operator()
   merges them over this template.

   Editing this object is no longer how the requisites get set. That used to
   require a code change and a redeploy to correct a typo in a phone number,
   which is why an unfilled template survived into production and rendered
   "[TO'LDIRILSIN: STIR]" to visitors as though it were a legal requisite. */
const DEFAULT_OPERATOR = {
  legalName:   { uz: "[TO'LDIRILSIN: to'liq yuridik nomi]",
                 ru: "[ZAPOLNIT: полное юридическое наименование]",
                 en: "[TO BE COMPLETED: full legal name]" },
  brand:       "TIJORAT MARKAZI",
  legalForm:   { uz: "[TO'LDIRILSIN: MChJ / AJ / DUK]",
                 ru: "[ZAPOLNIT: ООО / АО / ГУП]",
                 en: "[TO BE COMPLETED: LLC / JSC / SUE]" },
  stir:        "[TO'LDIRILSIN: STIR]",
  regNumber:   "[TO'LDIRILSIN: davlat ro'yxatidan o'tkazilganlik raqami]",
  regDate:     "[TO'LDIRILSIN: sana]",
  address:     { uz: "[TO'LDIRILSIN: pochta manzili, O'zbekiston]",
                 ru: "[ZAPOLNIT: почтовый адрес, Узбекистан]",
                 en: "[TO BE COMPLETED: postal address, Uzbekistan]" },
  /* Real values, supplied by the operator — not template. They publish as they
     stand until oversight saves something else over them from the admin panel. */
  email:       "tijoratmarkazi@gmail.com",
  phone:       "+998 90 096 33 77",
  /* Modda 22 ZRU-547: the person must be told where to send a request about
     their own data. One named channel, answered inside RESPONSE_DAYS. Until a
     separate contact is appointed, the operator's own mailbox is that channel. */
  dpoEmail:    "tijoratmarkazi@gmail.com",
  dpoName:     "[TO'LDIRILSIN: mas'ul shaxsning F.I.Sh.]",
  licence:     "",   // fill only if the platform itself trades under a licence
};

/* ---------- the operator, as actually configured ----------
   Persisted separately from the code so a requisite can be corrected without
   a deploy. db.js mirrors the row in memory and writes it straight through to
   Postgres, exactly as every other collection on the platform behaves. */
const OPERATOR_FILE = H.file("legal-operator.json");

/** Only the keys the template declares, so a stored row cannot introduce a
    field the documents do not know how to render. */
const OPERATOR_KEYS = Object.keys(DEFAULT_OPERATOR);
/** The three requisites that exist in all three languages. */
const I18N_KEYS = ["legalName", "legalForm", "address"];

const isPlaceholder = v => typeof v === "string" && /^\[(TO'LDIRILSIN|ZAPOLNIT|TO BE COMPLETED)/.test(v);

/** A stored value counts only when it is a real, non-placeholder string. */
const realValue = v => typeof v === "string" && v.trim() !== "" && !isPlaceholder(v);

/**
 * The live requisites: whatever oversight has saved, over the template.
 * Merged per FIELD rather than per object, so filling in the Uzbek address
 * without the Russian one leaves the Russian slot honestly empty instead of
 * silently reinstating the template underneath it.
 */
function operator(){
  const saved = DB.get(OPERATOR_FILE, null) || {};
  const out = {};
  for(const k of OPERATOR_KEYS){
    const def = DEFAULT_OPERATOR[k];
    if(I18N_KEYS.includes(k)){
      const s = (saved[k] && typeof saved[k] === "object") ? saved[k] : {};
      out[k] = { uz: realValue(s.uz) ? s.uz : def.uz,
                 ru: realValue(s.ru) ? s.ru : def.ru,
                 en: realValue(s.en) ? s.en : def.en };
    } else {
      out[k] = realValue(saved[k]) ? saved[k] : def;
    }
  }
  return out;
}

/**
 * What the browser is allowed to see. Every unfilled slot becomes an empty
 * string HERE, on the server, rather than being trusted to each of the three
 * client renderers to suppress. A placeholder is scaffolding addressed to the
 * operator; publishing it to a visitor states a false requisite, and the one
 * place that can guarantee it never happens is the boundary it would have to
 * cross to reach them.
 */
function publicOperator(){
  const o = operator(), out = {};
  for(const k of OPERATOR_KEYS){
    if(I18N_KEYS.includes(k))
      out[k] = { uz: realValue(o[k].uz) ? o[k].uz : "",
                 ru: realValue(o[k].ru) ? o[k].ru : "",
                 en: realValue(o[k].en) ? o[k].en : "" };
    else out[k] = realValue(o[k]) ? o[k] : "";
  }
  return out;
}

/* The requisites Qoidalar 24-band and ZRU-792 actually require in the footer.
   `licence` is not here: it is filled only by a platform that trades under
   one, so demanding it would make every compliant operator look incomplete. */
const REQUIRED_REQUISITES = ["legalName", "stir", "address", "email", "phone", "dpoEmail"];

/** Which required requisites are still unfilled — the admin panel lists them. */
function operatorMissing(){
  const o = operator();
  return REQUIRED_REQUISITES.filter(k =>
    I18N_KEYS.includes(k) ? !realValue(o[k].uz) : !realValue(o[k]));
}

/** True once every required requisite carries a real value. */
const operatorReady = () => operatorMissing().length === 0;

/**
 * Save what oversight typed. Only declared keys are read, everything is
 * trimmed and length-capped, and a blank field clears back to the template
 * rather than storing an empty string that would read as "deliberately none".
 */
function operatorSave(body){
  const patch = (body && typeof body === "object") ? body : {};
  const saved = DB.get(OPERATOR_FILE, null) || {};
  const next = {};
  for(const k of OPERATOR_KEYS){
    if(I18N_KEYS.includes(k)){
      const inc = (patch[k] && typeof patch[k] === "object") ? patch[k] : {};
      const cur = (saved[k] && typeof saved[k] === "object") ? saved[k] : {};
      const row = {};
      for(const l of ["uz", "ru", "en"]){
        const v = H.S(Object.prototype.hasOwnProperty.call(inc, l) ? inc[l] : cur[l], 300);
        if(realValue(v)) row[l] = v;
      }
      if(Object.keys(row).length) next[k] = row;
    } else {
      const v = H.S(Object.prototype.hasOwnProperty.call(patch, k) ? patch[k] : saved[k], 300);
      if(realValue(v)) next[k] = v;
    }
  }
  DB.set(OPERATOR_FILE, next);
  return { ok: true, operator: operator(), ready: operatorReady(), missing: operatorMissing() };
}

/** The editing view: real values, the template as the placeholder to type
    over, and the list of what is still outstanding. Oversight only. */
function adminConfig(){
  return { ok: true, operator: operator(), template: DEFAULT_OPERATOR,
           required: REQUIRED_REQUISITES, i18nKeys: I18N_KEYS,
           ready: operatorReady(), missing: operatorMissing() };
}



/* ---------- 2. the documents ----------
   Bump `version` whenever the substance changes, never for a typo. The date
   is the day that version takes effect; consent records point at the pair. */
const DOCS = {
  oferta:    { version: "1.0", effective: "2026-08-27", page: "oferta.html",
               title: { uz: "Ommaviy oferta", ru: "Публичная оферта", en: "Public offer" } },
  maxfiylik: { version: "1.0", effective: "2026-08-27", page: "maxfiylik.html",
               title: { uz: "Maxfiylik siyosati", ru: "Политика конфиденциальности", en: "Privacy policy" } },
  shartlar:  { version: "1.0", effective: "2026-08-27", page: "shartlar.html",
               title: { uz: "Foydalanish shartlari", ru: "Условия использования", en: "Terms of use" } },
};

/** The version string a consent record pins itself to. */
const consentVersion = () => DOCS.oferta.version + "/" + DOCS.maxfiylik.version + "/" + DOCS.shartlar.version;

/* ---------- 3. what is actually collected ----------
   Modda 22 ZRU-547 requires the person to be told the categories of data,
   the purposes, the recipients and the retention period — in terms they can
   check against reality. This array IS the privacy policy's table, so the
   policy cannot describe a field the code does not collect, or miss one it
   does. Add a row here the same commit you add a field to a form.

   `biometric` marks the categories that would trigger Modda 27-1 mandatory
   storage inside Uzbekistan. Every row is false today; if one ever turns
   true, /api/legal reports it and the compliance note stops saying that
   localisation does not apply. */
const COLLECTED = [
  { key: "identity", biometric: false,
    uz: "Mas'ul shaxsning familiyasi, ismi, otasining ismi va lavozimi",
    ru: "Фамилия, имя, отчество и должность ответственного лица",
    en: "Full name and job title of the responsible person",
    purpose: { uz: "Arizani ko'rib chiqish, kabinetga kirish, kontragent bilan aloqa",
               ru: "Рассмотрение заявки, доступ в кабинет, связь с контрагентом",
               en: "Reviewing the application, cabinet access, contact between counterparties" } },
  { key: "contact", biometric: false,
    uz: "Elektron pochta va telefon raqami",
    ru: "Электронная почта и номер телефона",
    en: "E-mail address and telephone number",
    purpose: { uz: "Ariza holati to'g'risida xabar berish va savdo yuzasidan bog'lanish",
               ru: "Уведомление о статусе заявки и связь по вопросам сделки",
               en: "Notifying application status and contact about a transaction" } },
  { key: "company", biometric: false,
    uz: "Korxona nomi, STIR, hudud, soha, veb-sayt",
    ru: "Наименование предприятия, ИНН, регион, отрасль, веб-сайт",
    en: "Company name, taxpayer number, region, sector, website",
    purpose: { uz: "Kontragentni tekshirish va bozor bo'limlarida ko'rsatish",
               ru: "Проверка контрагента и отображение в разделах рынка",
               en: "Counterparty verification and display in the market sections" } },
  { key: "account", biometric: false,
    uz: "Login va parol (parol faqat qaytarilmas kriptografik shaklda saqlanadi)",
    ru: "Логин и пароль (пароль хранится только в необратимой криптографической форме)",
    en: "Login and password (the password is stored only as an irreversible hash)",
    purpose: { uz: "Kabinetga kirishni ta'minlash va ruxsatsiz kirishdan himoya",
               ru: "Обеспечение доступа в кабинет и защита от несанкционированного доступа",
               en: "Providing cabinet access and protection against unauthorised access" } },
  { key: "consentproof", biometric: false,
    uz: "Rozilik berilgan vaqt, IP-manzil, brauzer ma'lumoti va hujjat versiyasi",
    ru: "Время дачи согласия, IP-адрес, сведения о браузере и версия документа",
    en: "Time of consent, IP address, browser details and document version",
    purpose: { uz: "ZRU-547 21-moddasi bo'yicha rozilik berilganini isbotlash majburiyati",
               ru: "Исполнение обязанности доказать факт согласия (ст. 21 ЗРУ-547)",
               en: "Meeting the operator's burden of proving consent (Art. 21 ZRU-547)" } },
  { key: "usage", biometric: false,
    uz: "Platformadagi harakatlar jurnali (e'lon, so'rov, taklif, kirish vaqti)",
    ru: "Журнал действий на платформе (объявление, запрос, предложение, время входа)",
    en: "Log of actions on the platform (listing, request, offer, sign-in time)",
    purpose: { uz: "Xizmatni ishlatish, nizolarni hal qilish va statistik tahlil",
               ru: "Работа сервиса, разрешение споров и статистический анализ",
               en: "Operating the service, dispute resolution and statistical analysis" } },
];

/** Does anything collected fall under the mandatory-localisation categories? */
const localisationRequired = () => COLLECTED.some(c => c.biometric);

/* ---------- retention ----------
   Modda 22 ZRU-547 wants a stated period, not "as long as necessary". */
const RETENTION = {
  account:      { years: 3, uz: "Hisob yopilganidan keyin 3 yil",
                  ru: "3 года после закрытия учётной записи",
                  en: "3 years after the account is closed" },
  application:  { years: 3, uz: "Ariza rad etilgan yoki tasdiqlangan kundan 3 yil",
                  ru: "3 года со дня отклонения или одобрения заявки",
                  en: "3 years from the day the application is rejected or approved" },
  consent:      { years: 5, uz: "Rozilik qaytarib olinganidan keyin 5 yil (isbot uchun)",
                  ru: "5 лет после отзыва согласия (для доказывания)",
                  en: "5 years after consent is withdrawn (as evidence)" },
  transaction:  { years: 5, uz: "Bitim hujjatlari — 5 yil (buxgalteriya talablari)",
                  ru: "Документы сделки — 5 лет (требования бухгалтерского учёта)",
                  en: "Transaction records — 5 years (accounting requirements)" },
};

/** Working days to answer a data-subject request. */
const RESPONSE_DAYS = 10;

/* ---------- cross-border ----------
   The AI assistant sends what a user types to Anthropic, outside Uzbekistan.
   Under Modda 27-1 as amended, ordinary personal data may be processed abroad
   on one of three grounds; the one relied on is named here so the privacy
   policy states a ground rather than staying silent about the transfer. */
const TRANSFERS = [
  { to: "Anthropic PBC (AQSh)", service: "Claude API — AI yordamchi",
    ground: "standard_terms",
    uz: "Foydalanuvchi AI yordamchiga o'zi yozgan matn. Modda 27-1 asosida — qayta ishlovchi bilan tasdiqlangan standart shartlar asosida.",
    ru: "Текст, который пользователь сам отправляет ИИ-помощнику. На основании ст. 27-1 — по утверждённым стандартным условиям с обработчиком.",
    en: "Text the user themselves sends to the AI assistant. Under Art. 27-1, on approved standard contractual terms with the processor." },
];

/* ---------- consent proof ----------
   Behind a reverse proxy req.socket.remoteAddress is the proxy, so the
   forwarded header is preferred when present. Only the first hop is kept:
   the rest of an X-Forwarded-For chain is client-supplied and worthless as
   evidence. Truncated because a full address is more personal data than the
   obligation needs — the last octet adds nothing to proving consent. */
function clientIp(req){
  const fwd = String((req && req.headers && req.headers["x-forwarded-for"]) || "");
  const raw = fwd.split(",")[0].trim()
    || String((req && req.socket && req.socket.remoteAddress) || "");
  const ip = raw.replace(/^::ffff:/, "");
  if(/^\d+\.\d+\.\d+\.\d+$/.test(ip)) return ip.replace(/\.\d+$/, ".0");
  const parts = ip.split(":").filter(Boolean);
  return parts.length > 3 ? parts.slice(0, 3).join(":") + "::" : ip;
}

/**
 * The evidentiary record. Built server-side from the request, never from a
 * field the client can set — a consent the browser could forge would prove
 * the opposite of what it is for.
 */
function consentRecord(req, given){
  return {
    given: given === true,
    version: consentVersion(),
    docs: { oferta: DOCS.oferta.version, maxfiylik: DOCS.maxfiylik.version, shartlar: DOCS.shartlar.version },
    at: Date.now(),
    ip: clientIp(req),
    ua: String((req && req.headers && req.headers["user-agent"]) || "").slice(0, 200),
  };
}

/** What /api/legal hands the browser — requisites, versions, and honest flags. */
function publicConfig(){
  return {
    operator: publicOperator(),
    ready: operatorReady(),
    docs: DOCS,
    collected: COLLECTED,
    retention: RETENTION,
    transfers: TRANSFERS,
    responseDays: RESPONSE_DAYS,
    consentVersion: consentVersion(),
    localisationRequired: localisationRequired(),
  };
}

module.exports = { DEFAULT_OPERATOR, DOCS, COLLECTED, RETENTION, TRANSFERS, RESPONSE_DAYS,
  consentVersion, consentRecord, clientIp, operatorReady, isPlaceholder,
  operator, publicOperator, operatorSave, operatorMissing, adminConfig,
  REQUIRED_REQUISITES, localisationRequired, publicConfig };
