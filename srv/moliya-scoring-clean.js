/* ============================================================
   MOLIYA BOZORI — LOYIHA SKORINGI: TOZALASH VA AUDIT QATLAMI

   Bu fayl srv/moliya-scoring.js ning bir bo'lagi: u yerda domen
   qarorlari (kim nima qila oladi, qaysi holatdan qaysisiga o'tadi,
   qaysi institutga yo'naltiriladi), bu yerda esa faqat ikki ish —
   KIRUVCHI DARAXTNI TOZALASH va IKKI DARAXT FARQINI OLISH.

   Nega ajratilgan: loyihada 800 qatorlik fayl shifti bor va
   ikkalasi bitta faylda 700 qatordan oshgan edi. Ajratish
   sun'iy emas — chegara tabiiy: bu yerdagi hech bir funksiya
   do'konga tegmaydi, aktyorni bilmaydi va xatolik qaytarmaydi.
   U faqat "xom body" ni "ishonchli obyekt" ga aylantiradi.

   NEGA TOZALASH SHUNCHA QATTIQ

   Skoring daraxti chuqur: pasport, uch yillik moliyaviy tarix,
   15 yilgacha prognoz, olti yo'nalishli due diligence, startup
   anketasi, hujjatlar reyestri. Har bir yaproq ballga ta'sir
   qiladi, ya'ni har bir yaproq — hujum yuzasi. Agar birorta
   maydon xom holda o'tsa, mijoz "sektor" o'rniga o'zi o'ylab
   topgan qiymat yuborib, hisoblanmagan mezon bo'yicha ball olib
   ketishi mumkin. Shuning uchun har bir maydon H yordamchisidan
   o'tadi: yopiq ro'yxatlar H.ONE, sonlar H.N, matnlar H.S.

   BO'SH KATAK HAQIDA ALOHIDA

   H.N("") → 0. Moliyaviy jadvalda bu halokatli: to'ldirilmagan
   "sof foyda" katagi nol foyda bo'lib o'qiladi va continuity
   bloki bo'yicha loyiha zararli deb belgilanadi. Shuning uchun
   pul kataklari NUM() dan o'tadi — bo'shligi saqlanadi (null),
   stavkalar esa RATE() dan — bo'sh kelsa metodikadagi default
   qiymat qo'yiladi (getHurdle() 0% MB stavkasiga ishonmasligi
   uchun).
   ============================================================ */
const H      = require("./store");
const MSCORE = require("../moliya-scoring-core.js");

const CONFIG = MSCORE.CONFIG;
const REF    = CONFIG.references;

/* ---------- yopiq ro'yxatlar (hammasi metodika faylidan) ---------- */
const idsOf = list => (list || []).map(x => x.id);
const PROJECT_TYPES  = idsOf(REF.projectTypes);
const SECTORS        = idsOf(REF.sectors);
const REGIONS        = idsOf(REF.regions);
const CURRENCIES     = REF.currencies.slice();
const FIN_TYPES      = idsOf(REF.financingTypes);
const LEGAL_FIRMS    = idsOf(REF.legalFirms);
const AUDIT_OPINIONS = idsOf(REF.auditOpinionTypes);
const DD_AREAS       = idsOf(REF.ddAreas);
const DD_STATUS      = idsOf(REF.ddStatusOptions);
const EXIT_TYPES     = idsOf(REF.exitTypes);
const STATUSES       = idsOf(REF.projectStatuses);
const ROLES          = idsOf(REF.userRoles);
const TEO_CATEGORIES = ["big5", "recognized", "internal", "none"];

/* Tashabbuskor o'z qo'li bilan faqat shu ikki holat orasida yuradi.
   Undan keyingi zanjir (yuborildi → ko'rib chiqilmoqda → tasdiqlandi /
   rad etildi) faqat submit() va setStatus() orqali, o'tish jadvali
   bo'yicha o'zgaradi — oddiy shakl POST'i uni orqaga qaytara olmaydi. */
const OWNER_STATUSES = ["draft", "scored"];

const HISTORY_YEARS = 3;     // metodika aynan 3 yillik tarixni baholaydi
const MODEL_YEARS   = 15;    // prognoz gorizonti shifti
const DOC_CAP       = 30;
const AUDIT_CAP     = 120;   // bitta loyihada saqlanadigan audit yozuvlari
const DIFF_CAP      = 60;    // bitta saqlashda yoziladigan farqlar soni

/* ---------- kichik sanitayzerlar (hammasi H ustiga qurilgan) ---------- */
/** Moliyaviy katak: bo'sh katak 0 EMAS, u "to'ldirilmagan". */
const NUM  = v => (v === null || v === undefined || v === "" ? null : H.N(v));
/** Stavka: bo'sh kelsa metodikadagi default (0 emas). */
const RATE = (v, def) => (v === null || v === undefined || v === "" ? def : H.N(v, def));
const PCT  = v => Math.max(0, Math.min(100, H.N(v)));
const POS  = v => Math.max(0, H.N(v));
const URL_ = v => (/^https?:\/\//i.test(H.S(v, 400)) ? H.S(v, 400) : "");

/* Rol aktyorda keladi va uni FAQAT srv/api.js qo'yadi (u yerda admin
   paroli yoki hisob tekshiriladi). Tanadan kelgan "role" bu yergacha
   yetib kelmaydi — cleanProject uni umuman o'qimaydi. */
const roleOf   = a => H.ONE(a && a.role, ROLES, "tashabbuskor");
const isExpert = a => { const r = roleOf(a); return r === "ekspert" || r === "admin"; };

/* =========================================================================
   1-BO'LIM. KIRUVCHI DARAXTNI TOZALASH
   cleanProduct (srv/moliya.js:30) va cleanPassport (:137) bilan bir xil
   shaklda, faqat daraxt chuqur bo'lgani uchun har bo'lim alohida
   funksiyada.
   ========================================================================= */
function cleanPassport(b){
  const p = b || {};
  return {
    loyihaTuri:            H.ONE(p.loyihaTuri, PROJECT_TYPES, "company"),
    nomi:                  H.S(p.nomi, 200),
    stir:                  H.S(p.stir, 20),
    sektor:                H.ONE(p.sektor, SECTORS, SECTORS[0]),
    hudud:                 H.ONE(p.hudud, REGIONS, REGIONS[0]),
    umumiyQiymat:          POS(p.umumiyQiymat),
    soralayotganSumma:     POS(p.soralayotganSumma),
    valyuta:               H.ONE(p.valyuta, CURRENCIES, "UZS"),
    muddat:                POS(p.muddat),              // yil
    moliyalashtirishTuri:  H.ONE(p.moliyalashtirishTuri, FIN_TYPES, "kredit"),
    tashabbuskorUlushi:    PCT(p.tashabbuskorUlushi),  // %
    faoliyatYillari:       POS(p.faoliyatYillari),
  };
}

function cleanStartupInfo(b){
  const s = b || {};
  return {
    jamoaTajribasi:         H.ONE(s.jamoaTajribasi, idsOf(REF.teamExperience), "none"),
    jamoaTavsifi:           H.S(s.jamoaTavsifi, 2000),
    mahsulotBosqichi:       H.ONE(s.mahsulotBosqichi, idsOf(REF.productStage), "idea"),
    mahsulotTavsifi:        H.S(s.mahsulotTavsifi, 2000),
    bozorValidatsiyasi:     H.ONE(s.bozorValidatsiyasi, idsOf(REF.marketValidation), "none"),
    moliyalashtirishTarixi: H.ONE(s.moliyalashtirishTarixi, idsOf(REF.fundingHistory), "none"),
    moliyaviyModelSifati:   H.ONE(s.moliyaviyModelSifati, idsOf(REF.startupFinModelQuality), "none"),
    daromadlilikSalohiyati: H.ONE(s.daromadlilikSalohiyati, idsOf(REF.potentialTiers), "unclear"),
    huquqiyIpHolati:        H.ONE(s.huquqiyIpHolati, idsOf(REF.legalIpStatus), "none"),
    keyingiBosqichExit:     H.ONE(s.keyingiBosqichExit, idsOf(REF.nextStageExit), "none"),
  };
}

/** Tarix ATAYLAB aynan 3 qator: metodika "oxirgi 3 yil" ni baholaydi va
    qator soni o'zgarsa continuity hamda netProfit bloklari ma'nosini
    yo'qotadi. Qisqa massiv bo'sh yillar bilan to'ldiriladi, uzuni
    kesiladi. Tartib: [3 yil oldin, 2 yil oldin, o'tgan yil] —
    calcHistoryMetrics o'sishni aynan shu tartibda hisoblaydi. */
function cleanHistory(b){
  const src = Array.isArray(b) ? b : [];
  const out = [];
  for(let i = 0; i < HISTORY_YEARS; i++){
    const y = src[i] || {};
    out.push({
      yil:          H.N(y.yil, HISTORY_YEARS - i),
      tushum:       NUM(y.tushum),
      ebitda:       NUM(y.ebitda),
      sofFoyda:     NUM(y.sofFoyda),
      jamiQarz:     NUM(y.jamiQarz),
      jamiAktivlar: NUM(y.jamiAktivlar),
      ozKapital:    NUM(y.ozKapital),
    });
  }
  return out;
}

function cleanModel(b){
  const m = b || {};
  const src = Array.isArray(m.yillar) ? m.yillar.slice(0, MODEL_YEARS) : [];
  return {
    diskontStavkasi: RATE(m.diskontStavkasi, CONFIG.macro.defaultDiscountRate),
    mbStavkasi:      RATE(m.mbStavkasi, CONFIG.macro.cbRateUZS),
    yillar: src.map((y, i) => ({
      yil:       H.N(y.yil, i + 1),
      fcf:       NUM(y.fcf),
      cfads:     NUM(y.cfads),
      principal: NUM(y.principal),
      interest:  NUM(y.interest),
    })),
  };
}

function cleanDueDiligence(b){
  const d   = b || {};
  const teo = d.teoTayyorlovchi || {};
  const a   = d.audit || {};
  const e   = d.exit || {};
  const src = d.ddYonalishlari || {};
  /* Olti yo'nalish — ro'yxat metodikadan keladi, mijoz o'z yo'nalishini
     qo'sha olmaydi: qo'shsa, dueDiligence bloki hisoblanmagan mezon
     bo'yicha ball berib yuborardi. */
  const areas = {};
  for(const id of DD_AREAS){
    const row = src[id] || {};
    areas[id] = {
      status:    H.ONE(row.status, DD_STATUS, "none"),
      performer: H.S(row.performer, 160),
    };
  }
  return {
    teoTayyorlovchi: {
      category: H.ONE(teo.category, TEO_CATEGORIES, "none"),
      name:     H.S(teo.name, 160),
    },
    audit: {
      yillarSoni:     Math.max(0, Math.min(10, H.N(a.yillarSoni))),
      auditor:        H.S(a.auditor, 160),
      xulosaTuri:     H.ONE(a.xulosaTuri, AUDIT_OPINIONS, ""),
      contractSigned: H.BOOL(a.contractSigned),
    },
    ddYonalishlari:   areas,
    torTasdiqlangan:  H.BOOL(d.torTasdiqlangan),
    yuridikKompaniya: H.ONE(d.yuridikKompaniya, LEGAL_FIRMS, ""),
    exit: {
      turi:              H.ONE(e.turi, EXIT_TYPES, ""),
      narxFormulasi:     H.S(e.narxFormulasi, 600),
      muddat:            NUM(e.muddat),
      shartnomaLoyihasi: H.BOOL(e.shartnomaLoyihasi),
      tavsif:            H.S(e.tavsif, 2000),
    },
  };
}

/** Hujjat reyestri. Oddiy satr ham qabul qilinadi (faqat nomi), lekin
    saqlanadigan shakl har doim bir xil — mijoz ikki xil turni ajratib
    o'tirmasin. */
function cleanDocuments(b){
  const src = Array.isArray(b) ? b.slice(0, DOC_CAP) : [];
  return src.map(d => (typeof d === "string" || typeof d === "number")
    ? { nomi: H.S(d, 200), havola: "", izoh: "" }
    : { nomi: H.S(d && d.nomi, 200), havola: URL_(d && d.havola), izoh: H.S(d && d.izoh, 300) }
  ).filter(d => d.nomi);
}

/** Holat: yangi loyiha va qoralama egasining qo'lida; undan nariga o'tgan
    loyiha esa faqat o'tish jadvali orqali harakatlanadi.

    `finish` — sehrgarning "yakunlash" tugmasi: bosqichlar tekshiruvidan
    o'tgan loyiha qoralamadan "baholandi" ga ko'chadi. Aynan shu holatdan
    submit() institutlarga yuborishga ruxsat beradi, shuning uchun bu bayroq
    zanjirning boshlanish nuqtasi. Allaqachon oldinga ketgan loyihani (masalan
    "ko'rib chiqilmoqda") u orqaga tortmaydi. */
function nextStatus(b, prev){
  const finished = H.BOOL(b.finish);
  if(!prev) return finished ? "scored" : H.ONE(b.status, OWNER_STATUSES, "draft");
  if(OWNER_STATUSES.indexOf(prev.status) === -1) return prev.status;
  if(finished) return "scored";
  return H.ONE(b.status, OWNER_STATUSES, prev.status);
}

/**
 * Butun daraxt. `scoring` va `audit` ATAYLAB bo'sh qaytadi: ikkalasi ham
 * serverning o'z mahsuloti va projectSave() da qo'yiladi. Ya'ni so'rov
 * tanasidagi "scoring" bu yerda hech qachon ko'chirilmaydi — modul
 * sarlavhasidagi asosiy qoida shu.
 */
function cleanProject(b, actor, prev){
  const now  = Date.now();
  const body = b || {};
  return {
    id:        prev ? prev.id : H.uid("lsk"),
    ownerId:   prev ? prev.ownerId : H.S(actor.id, 40),
    ownerName: H.S((prev ? prev.ownerName : "") || (actor && actor.name), 160),
    status:    nextStatus(body, prev),
    passport:         cleanPassport(body.passport),
    startupInfo:      cleanStartupInfo(body.startupInfo),
    financialHistory: cleanHistory(body.financialHistory),
    financialModel:   cleanModel(body.financialModel),
    dueDiligence:     cleanDueDiligence(body.dueDiligence),
    documents:        cleanDocuments(body.documents),
    /* Yo'naltirish natijasi submit() ning mahsuloti — tahrirda saqlanadi. */
    routedTo:  Array.isArray(prev && prev.routedTo) ? prev.routedTo : [],
    submitted: prev ? H.N(prev.submitted) : 0,
    scoring:   null,
    audit:     [],
    created:   prev ? prev.created : now,
    updated:   now,
  };
}

/* =========================================================================
   2-BO'LIM. AUDIT IZI — maydon darajasidagi farq

   Loyiha ballini o'zgartirish pul qaroriga ta'sir qiladi. "Loyiha
   tahrirlandi" degan yozuv hech narsa isbotlamaydi: ekspert keyin
   "IRR o'zgarmagan edi" desa, uni tekshirib bo'lmaydi. Shuning uchun
   eski va yangi daraxt yaproqma-yaproq solishtiriladi.
   ========================================================================= */
const AUDIT_SKIP = ["audit", "scoring", "updated"];

/** Audit qiymati ham do'konga tushadi — demak u ham sanitayzerdan o'tadi. */
const auditValue = v => {
  if(v === null || v === undefined) return null;
  if(typeof v === "number" || typeof v === "boolean") return v;
  if(typeof v === "object") return H.S(JSON.stringify(v), 300);
  return H.S(v, 300);
};

/**
 * Obyekt va massiv ichiga kiradi (yo'l "financialHistory.0.tushum"
 * ko'rinishida), yaproqlarni JSON.stringify orqali taqqoslaydi.
 * 'audit' va 'scoring' kalitlari o'tkazib yuboriladi: birinchisi
 * o'z-o'zini yozib cheksiz o'sardi, ikkinchisi esa har saqlashda qayta
 * hisoblanib, har bir blokni "o'zgardi" deb ko'rsatardi va haqiqiy
 * tahrirlarni ko'mib tashlardi.
 */
function diffFields(oldObj, newObj, prefix, out){
  const a = oldObj || {}, b = newObj || {};
  if(out.length >= DIFF_CAP) return out;
  const keys = Object.keys(b).concat(Object.keys(a).filter(k => !(k in b)));
  for(const k of keys){
    if(out.length >= DIFF_CAP) return out;
    if(!prefix && AUDIT_SKIP.indexOf(k) !== -1) continue;
    const path = prefix ? prefix + "." + k : k;
    const av = a[k], bv = b[k];
    const bothObj = av && bv && typeof av === "object" && typeof bv === "object"
                 && Array.isArray(av) === Array.isArray(bv);
    if(bothObj){ diffFields(av, bv, path, out); continue; }
    if(JSON.stringify(av === undefined ? null : av) === JSON.stringify(bv === undefined ? null : bv)) continue;
    out.push({ field: path, oldValue: auditValue(av), newValue: auditValue(bv) });
  }
  return out;
}

const auditEntry = (actor, field, oldValue, newValue) => ({
  t: Date.now(),
  user: H.S(actor && actor.name, 160),
  role: roleOf(actor),
  field: H.S(field, 120),
  oldValue: auditValue(oldValue),
  newValue: auditValue(newValue),
});

/** Oxirgi AUDIT_CAP ta yozuv — hujjat cheksiz o'smasligi uchun. */
const appendAudit = (prev, entries) =>
  (Array.isArray(prev && prev.audit) ? prev.audit : []).concat(entries).slice(-AUDIT_CAP);

module.exports = {
  PROJECT_TYPES, SECTORS, REGIONS, CURRENCIES, STATUSES, OWNER_STATUSES, ROLES,
  NUM, RATE, PCT, POS, roleOf, isExpert,
  cleanProject, cleanPassport, cleanHistory, cleanModel, cleanDueDiligence, cleanDocuments,
  diffFields, auditEntry, appendAudit, auditValue,
  AUDIT_CAP, DIFF_CAP, HISTORY_YEARS, MODEL_YEARS,
};
