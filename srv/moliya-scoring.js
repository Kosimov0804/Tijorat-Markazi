/* ============================================================
   MOLIYA BOZORI — LOYIHA SKORINGI: SERVER TOMONI
   (rasmiy ball, audit izi, institutlarga yo'naltirish)

   NEGA BU MODUL UMUMAN BOR

   Metodika (vaznlar, pog'onalar, knockout mezonlari) va hisob
   dvigateli loyiha ildizida turadi — moliya-scoring-config.js va
   moliya-scoring-core.js. Ular ataylab brauzerga ham ochiq: sehrgar
   har bir katakda ballni real vaqtda ko'rsatishi kerak, aks holda
   foydalanuvchi har bir tugmada serverni kutadi. Lekin dvigatel
   ochiq degani — mijoz hisoblagan ballga ishonish degani EMAS.

   SHUNING UCHUN YAGONA QOIDA: so'rov tanasida kelgan `scoring`
   (yoki `total`, `ball`) HAR DOIM TASHLAB YUBORILADI. Saqlanadigan
   ball — faqat shu modul MSCORE.scoreProject() ni chaqirib olgan
   natija. Mijozdagi hisob faqat UX tezligi uchun; rasmiy hisob shu
   yerda. Ikkalasi ham AYNAN bitta faylni chaqiradi, shuning uchun
   metodika ikki joyda ayrilib qolmaydi — lekin vakolat bitta joyda.

   NEGA O'Z JSON HUJJATI YO'Q

   Skoring loyihalari srv/moliya.js dagi "moliya.json" hujjatining
   "scored" massivida yashaydi. H.collection(...) shu hujjat uchun
   FAQAT BIR MARTA, egasi bo'lgan modulda (srv/moliya.js) e'lon
   qilinadi. Bu yerda ikkinchi marta e'lon qilinsa, ro'yxatda
   ko'rsatilmagan massivlar (products, requests, offers, ...) birinchi
   save() da JIMGINA O'CHIB KETADI. Shu sabab srv/moliya-capital.js
   qanday qilsa, biz ham shunday qilamiz: do'konni import qilamiz.

   NEGA YO'NALTIRISH QULFLANGAN

   Institutga yo'naltirish — platformaning nomidan berilgan signal.
   CONFIG.routing.unlockScore (75 ball) dan past yoki knockout bo'lgan
   loyihani yuborish moliya tashkilotining navbatini ham, loyiha
   egasining umidini ham behuda sarflaydi. submit() shuning uchun
   routingUnlocked() dan o'tmasa { error: "routing_locked" } qaytaradi.

   NEGA HOLAT ZANJIRI QATTIQ

   Egasi loyihani faqat navbatga qo'ya oladi (scored → submitted).
   Undan keyingi har bir qadam ekspert yoki admin qo'lida: o'z
   loyihasini o'zi tasdiqlab qo'yishi mumkin bo'lgan tizimning
   skoringi hech narsani anglatmaydi.

   MATNLAR HAQIDA: dvigatel tayyor jumla emas, i18n kaliti qaytaradi
   ({ key, params }). Biz ularga TEGMAYMIZ va shundayligicha mijozga
   uzatamiz — tarjima brauzerda, uz/ru/en lug'ati orqali bo'ladi.

   Tozalash va audit farqi alohida faylda: srv/moliya-scoring-clean.js
   (800 qatorlik shift + tabiiy chegara — u yerda do'kon ham, aktyor
   ham, xatolik ham yo'q).
   ============================================================ */
const H      = require("./store");
const M      = require("./moliya");
const C      = require("./moliya-scoring-clean");
const MSCORE = require("../moliya-scoring-core.js");

/* Do'kon srv/moliya.js niki — qarang yuqoridagi izoh. */
const load = M.load, save = M.save;

const CONFIG = MSCORE.CONFIG;
const REF    = CONFIG.references;

const roleOf = C.roleOf, isExpert = C.isExpert;

/* max_summa uchun "cheksiz" o'rniga real katta son: Infinity JSON'ga
   yozilganda null bo'lib qoladi va taqqoslash jimgina buziladi. */
const NO_MAX_USD = 1e12;

const lab = (list, id) => MSCORE.L(MSCORE.refItem(list, id), "uz");
const day = ms => { const t = H.N(ms); return t ? new Date(t).toISOString().slice(0, 10) : ""; };
const idOf = v => H.S(v, 40);

/* =========================================================================
   1-BO'LIM. INSTITUTLAR REYESTRI — urug' ro'yxat + jonli provayderlar
   ========================================================================= */
/* Katalog toifasi → institut turi. Sug'urta, fintech va islomiy mahsulotlar
   uchun aniq muvofiqlik yo'q — ular "bank" sifatida o'tadi, chunki
   moslashtirish filtri turga qarab emas, summa/valyuta/sektor/muddat/ball
   bo'yicha ishlaydi; tur faqat ko'rsatish uchun. */
const CATEGORY_TO_TURI = {
  banking: "bank", equity: "investitsiya_fondi", nobank: "investitsiya_fondi",
  development: "DFI",
};

/**
 * DIQQAT — ikkita jimgina buzuvchi nomuvofiqlik shu yerda tuzatiladi:
 *
 *  1) MUDDAT BIRLIGI. Katalogdagi mahsulot muddati OYLARDA (tenorMax),
 *     institut reyestrida esa YILLARDA (max_muddat). O'girilmasa 36 oylik
 *     mahsulot "36 yil" bo'lib, har qanday loyihaga mos kelib qoladi.
 *  2) VALYUTA. Reyestrdagi min_summa/max_summa HAR DOIM USD ekvivalenti
 *     (CONFIG.macro.fxToUsd). O'girilmasa 500 mln so'mlik mahsulot
 *     500 mln USD lik institut bo'lib ko'rinadi.
 */
function productToInstitution(p){
  const maxUsd = MSCORE.toUsdEquivalent(H.N(p.maxAmount), p.currency);
  return {
    id:     "product:" + idOf(p.id),
    seed:   false,
    nomi:   { uz: H.S(p.providerName, 160), ru: H.S(p.providerName, 160), en: H.S(p.providerName, 160) },
    turi:   CATEGORY_TO_TURI[p.category] || "bank",
    min_summa:  MSCORE.toUsdEquivalent(H.N(p.minAmount), p.currency),
    max_summa:  maxUsd || NO_MAX_USD,
    valyutalar: [H.ONE(p.currency, C.CURRENCIES, "UZS")],
    /* Mahsulot sektorlari — erkin matn (H.LIST). Metodika esa yopiq
       ma'lumotnoma id lari bilan ishlaydi, shuning uchun tanib bo'lmagan
       yozuvlar TASHLAB YUBORILADI: bo'sh ro'yxat "barcha sektorlar"
       degani, ya'ni tanilmagan matnni qoldirish filtrni ochib yuborardi. */
    sektorlar:  H.LIST(p.sectors, 15).map(s => s.toLowerCase()).filter(s => C.SECTORS.indexOf(s) !== -1),
    /* floor, round emas: moslashtirish filtrida yaxlitlash hech qachon
       kengaytiruvchi tomonga ketmasligi kerak (6 oy -> 0 yil, 1 yil emas). */
    max_muddat: Math.floor(H.N(p.tenorMax) / 12),
    min_ball:   C.PCT(p.minScore),
    aloqa_email: "",
    productId:  idOf(p.id),
    providerId: idOf(p.providerId),
  };
}

/** Urug' reyestr + "routable" belgisini qo'ygan jonli mahsulotlar. */
function institutionRegistry(){
  const st = load();
  const live = (st.products || [])
    /* Valyutasi metodikada yo'q mahsulot (masalan RUB) reyestrga KIRMAYDI:
       fxToUsd da kursi yo'q, toUsdEquivalent uni 1:1 deb o'qib, bandni
       ~90 barobar shishirib yuborardi. Jim xato o'rniga ochiq chetlatish. */
    .filter(p => p.status === "live" && p.routable === true
      && MSCORE.CONFIG.references.currencies.indexOf(p.currency) !== -1)
    .map(productToInstitution);
  return CONFIG.institutions.concat(live);
}

/* =========================================================================
   2-BO'LIM. PROYEKSIYALAR
   Har biri kalitma-kalit quriladi — "nusxa olib ortiqchasini o'chirish"
   usuli yangi maydon qo'shilganda uni jimgina oshkor qilib yuboradi.
   ========================================================================= */
function listRow(p){
  const pp = p.passport || {};
  return {
    id: p.id,
    status: p.status,
    ownerName: p.ownerName,
    updated: H.N(p.updated),
    created: H.N(p.created),
    passport: {
      loyihaTuri: pp.loyihaTuri,
      nomi: pp.nomi,
      stir: pp.stir,
      sektor: pp.sektor,
      hudud: pp.hudud,
      soralayotganSumma: H.N(pp.soralayotganSumma),
      valyuta: pp.valyuta,
      muddat: H.N(pp.muddat),
    },
    score: p.scoring ? {
      total: p.scoring.total,
      rawTotal: p.scoring.rawTotal,
      isKnockout: p.scoring.isKnockout,
      routingStatus: p.scoring.routingStatus,
    } : null,
  };
}

function statsOf(rows){
  const scored = rows.filter(p => p.scoring);
  const totals = scored.map(p => H.N(p.scoring.total));
  return {
    total: rows.length,
    scored: scored.length,
    /* "Moliyalashtirishga tayyor" — bu 90+ pog'onasi (routingStatus.status
       === "tayyor"), yo'naltirish ochilgani (75+) EMAS. Ikkisi boshqa narsa:
       75 ball institutlar ro'yxatini ochadi, 90 esa avtomatik yo'naltirishni.
       Plitka yozuvi ham "90+ ball" deydi. */
    ready: scored.filter(p => p.scoring.routingStatus && p.scoring.routingStatus.status === "tayyor").length,
    blocked: scored.filter(p => p.scoring.isKnockout).length,
    /* Yaxlitlanmaydi: mijoz uni bir kasr xonasi bilan ko'rsatadi, shuning
       uchun bu yerdagi yaxlitlash 88,5 ni 89,0 qilib ko'rsatardi. */
    avgScore: totals.length ? totals.reduce((s, x) => s + x, 0) / totals.length : null,
  };
}

/* =========================================================================
   3-BO'LIM. DOMEN FUNKSIYALARI
   ========================================================================= */

/** Brauzer hech qanday lug'atni o'zida qattiq yozib qo'ymasin. */
function meta(){
  return {
    ok: true,
    references: REF,
    /* Qisqa vazn jadvali — metodika sahifasidagi ustun uchun. */
    weights: { company: CONFIG.scoring.weights, startup: CONFIG.startupScoring.weights },
    /* To'liq jadval — har bir daraja qancha ball berishini ko'rsatish uchun. */
    scoring: { company: CONFIG.scoring, startup: CONFIG.startupScoring },
    knockout: CONFIG.knockout,
    routing: CONFIG.routing,
    institutionTypes: CONFIG.institutionTypes,
    institutions: institutionRegistry(),
    macro: CONFIG.macro,
    version: CONFIG.meta.version,
  };
}

/**
 * Bitta so'rovda butun ro'yxat sahifasi: rol, statistika va qatorlar.
 * Tashabbuskor faqat o'z loyihalarini ko'radi; ekspert va admin hammasini —
 * ularning ishi aynan navbatni ko'rish.
 */
function home(actor, filter){
  const f    = filter || {};
  const st   = load();
  const role = roleOf(actor);
  const mine = isExpert(actor)
    ? (st.scored || []).slice()
    : (st.scored || []).filter(p => p.ownerId === idOf(actor.id));

  let rows = mine;
  const status = H.S(f.status, 20);
  if(status && C.STATUSES.indexOf(status) !== -1) rows = rows.filter(p => p.status === status);
  const turi = H.S(f.loyihaTuri, 20);
  if(turi && C.PROJECT_TYPES.indexOf(turi) !== -1)
    rows = rows.filter(p => (p.passport || {}).loyihaTuri === turi);
  const q = H.S(f.q, 200).toLowerCase();
  if(q) rows = rows.filter(p => {
    const pp = p.passport || {};
    return String(pp.nomi || "").toLowerCase().includes(q) || String(pp.stir || "").includes(q);
  });

  return {
    ok: true,
    role,
    stats: statsOf(rows),
    items: rows.sort((a, b) => H.N(b.updated) - H.N(a.updated)).map(listRow),
  };
}

/**
 * Yaratish yoki tahrirlash + RASMIY qayta baholash.
 * Tanadagi ball e'tiborga olinmaydi (modul sarlavhasiga qarang).
 */
function projectSave(actor, body){
  const st   = load();
  const b    = body || {};
  const id   = idOf(b.id);
  const prev = id ? (st.scored || []).find(p => p.id === id) : null;
  if(id && !prev) return { error: "not_found" };
  /* Egalik tanadan emas, hal qilingan aktyordan tekshiriladi. */
  if(prev && prev.ownerId !== idOf(actor.id)) return { error: "forbidden" };
  /* MAZMUN QULFI. nextStatus() holatni muzlatadi, lekin maydonlarni emas:
     usiz egasi allaqachon YUBORILGAN, KO'RIB CHIQILAYOTGAN yoki TASDIQLANGAN
     loyihaning pasporti, 3 yillik tarixi va moliyaviy modelini qayta yozib,
     ballni jimgina boshqa raqamga aylantira olardi — status va routedTo esa
     eski holicha qolardi. Institut ko'rgan hujjat o'zgarmasligi kerak. */
  if(prev && C.OWNER_STATUSES.indexOf(prev.status) === -1) return { error: "bad_transition" };

  const next = C.cleanProject(b, actor, prev);
  if(!next.passport.nomi) return { error: "name_required" };

  const scoring = MSCORE.scoreProject(next);

  /* Yangi loyihada maydonma-maydon farq 50 dan ortiq yozuv berardi va
     audit oynasini birinchi saqlashdayoq to'ldirib qo'yardi — shuning
     uchun yaratilish bitta yozuv bilan qayd etiladi. */
  const entries = prev
    ? C.diffFields(prev, next, "", []).map(d => C.auditEntry(actor, d.field, d.oldValue, d.newValue))
    : [C.auditEntry(actor, "loyiha", null, next.passport.nomi)];

  const row = Object.assign({}, next, { scoring: scoring, audit: C.appendAudit(prev, entries) });
  st.scored = prev ? st.scored.map(p => (p.id === prev.id ? row : p)) : (st.scored || []).concat([row]);

  H.logEvent(st, "scoring_saved", {
    projectId: row.id, ownerId: row.ownerId, loyihaTuri: row.passport.loyihaTuri,
    sektor: row.passport.sektor, hudud: row.passport.hudud,
    summa: row.passport.soralayotganSumma, valyuta: row.passport.valyuta,
    total: scoring.total, knockout: scoring.isKnockout, changes: entries.length,
  });
  save(st);
  return { ok: true, project: row, scoring: scoring };
}

/** Bitta loyiha sahifasi to'liq: ball, mos institutlar, tavsiyalar, audit. */
function open(actor, id){
  const st = load();
  const p  = (st.scored || []).find(x => x.id === idOf(id));
  if(!p) return { error: "not_found" };
  if(p.ownerId !== idOf(actor.id) && !isExpert(actor)) return { error: "forbidden" };

  /* Odatda saqlangan ball qaytadi. U yo'q bo'lsa (metodika joriy
     etilishidan oldin yaratilgan qator) joyida hisoblanadi, lekin
     YOZILMAYDI: o'qish so'rovi hujjatni o'zgartirmasligi kerak. */
  const scoring = p.scoring || MSCORE.scoreProject(p);

  return {
    ok: true,
    project: p,
    scoring: scoring,
    matches: MSCORE.matchInstitutions(p, scoring, institutionRegistry()),
    unlocked: MSCORE.routingUnlocked(scoring),
    suggestions: MSCORE.nextTierSuggestions(scoring),
    audit: Array.isArray(p.audit) ? p.audit : [],
  };
}

/** O'chirish — faqat egasi va faqat qoralama holatida. */
function remove(actor, id){
  const st = load();
  const p  = (st.scored || []).find(x => x.id === idOf(id));
  if(!p) return { error: "not_found" };
  if(p.ownerId !== idOf(actor.id)) return { error: "forbidden" };
  /* Baholangan yoki yuborilgan loyiha o'chirilmaydi: uning ballini
     ekspert ham, institut ham ko'rgan bo'lishi mumkin. Xato kodi holat
     zanjiri bilan bir xil — bu ham ruxsat etilmagan o'tish. */
  if(p.status !== "draft") return { error: "bad_transition" };

  st.scored = st.scored.filter(x => x.id !== p.id);
  H.logEvent(st, "scoring_removed", { projectId: p.id, ownerId: p.ownerId });
  save(st);
  return { ok: true };
}

/**
 * Institutlarga yuborish. Ikki shart: loyiha "baholandi" holatida bo'lsin
 * va yo'naltirish ochiq bo'lsin (75+ ball, knockout yo'q).
 * routedTo — beshala mezondan ham o'tgan institutlar.
 */
function submit(actor, id){
  const st = load();
  const p  = (st.scored || []).find(x => x.id === idOf(id));
  if(!p) return { error: "not_found" };
  if(p.ownerId !== idOf(actor.id)) return { error: "forbidden" };
  if(p.status !== "scored") return { error: "bad_transition" };
  const scoring = p.scoring;
  if(!scoring) return { error: "not_scored" };
  if(!MSCORE.routingUnlocked(scoring)) return { error: "routing_locked" };

  const matches  = MSCORE.matchInstitutions(p, scoring, institutionRegistry());
  const routedTo = matches.filter(m => m.fullMatch).map(m => m.inst.id);
  const now = Date.now();
  const row = Object.assign({}, p, {
    status: "submitted", routedTo: routedTo, submitted: now, updated: now,
    audit: C.appendAudit(p, [C.auditEntry(actor, "status", p.status, "submitted")]),
  });
  st.scored = st.scored.map(x => (x.id === p.id ? row : x));

  H.logEvent(st, "scoring_submitted", { projectId: p.id, ownerId: p.ownerId,
    total: scoring.total, routedTo: routedTo, institutions: routedTo.length });
  save(st);
  return { ok: true, status: row.status, routedTo: routedTo };
}

/* Ruxsat etilgan o'tishlar. Boshqa har qanday yo'l — bad_transition. */
const TRANSITIONS = {
  /* Egada HECH QANDAY o'tish yo'q. "scored -> submitted" faqat submit()
     orqali boradi, chunki yo'naltirish qulfi (75+ ball, knockoutsiz),
     routedTo ro'yxati va `submitted` vaqt tamg'asi o'sha yerda qo'yiladi.
     Bu yerda ikkinchi yo'l qoldirilsa, 0 ballik loyiha ham ekspert
     navbatiga bo'sh routedTo bilan tushib qolardi. */
  owner:  {},
  expert: { submitted: ["review"], review: ["approved", "rejected"] },
};

function setStatus(actor, id, status, comment){
  const st = load();
  const p  = (st.scored || []).find(x => x.id === idOf(id));
  if(!p) return { error: "not_found" };

  const owner  = p.ownerId === idOf(actor.id);
  const expert = isExpert(actor);
  if(!owner && !expert) return { error: "forbidden" };

  const target  = H.ONE(status, C.STATUSES, "");
  const allowed = (expert && (TRANSITIONS.expert[p.status] || []).indexOf(target) !== -1)
               || (owner  && (TRANSITIONS.owner[p.status]  || []).indexOf(target) !== -1);
  if(!target || !allowed) return { error: "bad_transition" };

  const note = H.S(comment, 1000);
  const entries = [C.auditEntry(actor, "status", p.status, target)];
  /* Izoh ballning o'zi kabi muhim: rad etish sababi keyin o'qiladi. */
  if(note) entries.push(C.auditEntry(actor, "status.izoh", "", note));

  const row = Object.assign({}, p, {
    status: target, updated: Date.now(), audit: C.appendAudit(p, entries),
  });
  st.scored = st.scored.map(x => (x.id === p.id ? row : x));

  H.logEvent(st, "scoring_status", { projectId: p.id, from: p.status, to: target,
    role: roleOf(actor), hasComment: !!note });
  save(st);
  return { ok: true, project: row };
}

/* =========================================================================
   4-BO'LIM. CSV EKSPORT
   Excel UTF-8 ni faqat BOM bilan taniydi, satr oxiri CRLF bo'lmasa
   Windows'dagi Excel qatorlarni birlashtirib yuboradi — ikkalasi ham
   "keyin tuzatamiz" deb qoldirib bo'lmaydigan narsa.
   ========================================================================= */
const CSV_COLS = ["Nomi", "Turi", "STIR", "Sektor", "Hudud", "Summa", "Valyuta",
  "Ball", "Xom ball", "Knockout", "Yo'naltirish", "Holat", "Yangilangan"];

const csvCell = v => {
  let s = v === null || v === undefined ? "" : String(v);
  /* Formula in'ektsiyasidan himoya: hujayra =, +, - yoki @ bilan
     boshlansa, Excel uni FORMULA deb bajaradi. Loyiha nomi erkin matn,
     eksportni esa admin ochadi — ya'ni eng vakolatli hisob. Apostrof
     qo'shilsa qiymat o'qiladigan bo'lib qoladi, lekin bajarilmaydi. */
  if(/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",;\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

function exportCsv(filter){
  const f  = filter || {};
  const st = load();
  let rows = (st.scored || []).slice();
  const status = H.S(f.status, 20);
  if(status && C.STATUSES.indexOf(status) !== -1) rows = rows.filter(p => p.status === status);
  const turi = H.S(f.loyihaTuri, 20);
  if(turi && C.PROJECT_TYPES.indexOf(turi) !== -1)
    rows = rows.filter(p => (p.passport || {}).loyihaTuri === turi);
  rows.sort((a, b) => H.N(b.updated) - H.N(a.updated));

  const lines = [CSV_COLS.map(csvCell).join(",")];
  for(const p of rows){
    const pp = p.passport || {};
    const sc = p.scoring;
    lines.push([
      pp.nomi,
      lab(REF.projectTypes, pp.loyihaTuri),
      pp.stir,
      lab(REF.sectors, pp.sektor),
      lab(REF.regions, pp.hudud),
      H.N(pp.soralayotganSumma),
      pp.valyuta,
      sc ? sc.total : "",
      sc ? sc.rawTotal : "",
      sc ? (sc.isKnockout ? "ha" : "yo'q") : "",
      sc ? MSCORE.L(sc.routingStatus, "uz") : "",
      lab(REF.projectStatuses, p.status),
      day(p.updated),
    ].map(csvCell).join(","));
  }

  /* Eksport — shaxsiy ma'lumotning tashqariga chiqishi, shuning uchun u
     ham hodisa oqimida qoladi (qachon, qaysi filtr, nechta qator). */
  H.logEvent(st, "scoring_exported", { rows: rows.length, status: status, loyihaTuri: turi });
  save(st);

  return "﻿" + lines.join("\r\n") + "\r\n";
}

/** Subyekt so'rovi (srv/rights.js) uchun: shu shaxsga tegishli loyihalar. */
const projectsOf = ownerId =>
  (load().scored || []).filter(p => p.ownerId === idOf(ownerId))
    .sort((a, b) => H.N(b.updated) - H.N(a.updated));

module.exports = {
  meta, home, open, remove, submit, setStatus,
  save: projectSave,
  institutionRegistry, exportCsv, projectsOf,
  cleanProject: C.cleanProject, diffFields: C.diffFields, listRow,
  /* Do'kon juftligi. `save` nomi domen funksiyasi tomonidan band, shuning
     uchun yozuvchi tomoni `storeSave` deb chiqadi — bitta modulda ikkita
     `save` bo'lishi mumkin emas. */
  load, storeSave: save,
};
