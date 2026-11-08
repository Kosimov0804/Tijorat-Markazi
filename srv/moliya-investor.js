/* ============================================================
   MOLIYA BOZORI — INVESTOR TOMONI (institut qabulxonasi)

   NEGA BU MODUL ALOHIDA

   srv/moliya-scoring.js — tashabbuskorning moduli: loyiha yaratiladi,
   baholanadi, navbatga qo'yiladi. Bu modul esa QARAMA-QARSHI tomon:
   institut o'ziga yo'naltirilgan loyihalarni ko'radi, qiziqish
   bildiradi va o'z qabul mezonlarini sozlaydi. Ikkalasi bitta
   hujjatni bo'lishadi, lekin aktyori, ruxsatlari va proyeksiyalari
   butunlay boshqa — bitta faylda turishsa, "kim nimani ko'radi"
   savoli har bir funksiyada qaytadan hal qilinardi.

   INSTITUTNING SHAXSI QAYERDAN KELADI

   Alohida "institut hisobi" YO'Q va ataylab yo'q. Institut — bu
   kompaniya hisobi (srv/api.js dagi company()), uning platformadagi
   ovozi esa moliya mahsulotlari. Mahsulotga routable:true qo'yish —
   "men skoring navbatidan loyiha qabul qilaman" degani; minScore esa
   uning ostonasi. Ya'ni "jonli opt-in" allaqachon mavjud maydonlar
   orqali ishlaydi, yangi shaxs turi ixtiro qilinmaydi.

   NEGA QABULXONA routedTo NI O'QIYDI, QAYTA HISOBLAMAYDI

   Yo'naltirish — submit() paytida BIR MARTA yozilgan fakt: o'sha
   ondagi mezonlar bo'yicha loyiha qaysi institutlarga tushgani.
   Agar qabulxona har safar qaytadan moslashtirsa, institut minScore
   ni 70 dan 80 ga ko'tarishi bilan allaqachon ko'rgan loyihalari
   ro'yxatdan jimgina yo'qolardi — va aksincha, ostonani tushirish
   o'tmishdagi loyihalarni "yangi" qilib qaytarardi. Navbat tarixga
   ega bo'lishi kerak, shuning uchun u routedTo ga tayanadi.

   NIMA KO'RINADI, NIMA KO'RINMAYDI

   Institutga loyihaning DOSSIER darajasi ochiladi — pasport, ball,
   bloklar va izohlar: aynan shu narsa uchun yo'naltirish qilingan.
   Ochilmaydi: audit izi (ichki nazorat yozuvi), ownerId (ichki kalit)
   va boshqa institutlarning qiziqishi (ular raqobatchi). Qoralama va
   baholangan, ammo YUBORILMAGAN loyiha esa umuman ko'rinmaydi.
   ============================================================ */
const H      = require("./store");
const M      = require("./moliya");
const C      = require("./moliya-scoring-clean");
const MS     = require("./moliya-scoring");
const MSCORE = require("../moliya-scoring-core.js");

/* Do'kon srv/moliya.js niki — H.collection u yerda bir marta e'lon
   qilinadi, bu yerda ikkinchi marta e'lon qilish boshqa massivlarni
   birinchi save() da o'chirib yuborardi. */
const load = M.load, save = M.save;

const idOf = v => H.S(v, 40);

/* Institut ko'radigan navbat. Qoralama va "baholandi" bu yerda YO'Q:
   ular egasining ishi, hali hech kimga yuborilmagan. */
const QUEUE        = ["submitted", "review", "approved"];
/* Ekspert rad etilganini ham ko'radi — bu uning o'z qarori tarixi. */
const EXPERT_QUEUE = QUEUE.concat("rejected");

/* Qiziqish holatlari. "new" saqlanmaydi — u yozuv yo'qligining nomi. */
const INTEREST_STATES = ["interested", "shortlist", "passed"];

/* =========================================================================
   1-BO'LIM. INSTITUTNING O'ZI
   ========================================================================= */

/** Shu kompaniyaga tegishli, reyestrga tushgan institut yozuvlari. */
function myInstitutions(providerId){
  const me = idOf(providerId);
  if(!me) return [];
  /* Reyestrni MS quradi: "live + routable + metodikada bor valyuta"
     filtri bitta joyda tursin, aks holda qabulxona va yo'naltirish
     har xil mahsulot to'plamini ko'rib qolardi. */
  return MS.institutionRegistry().filter(i => !i.seed && i.providerId === me);
}

const myInstitutionIds = providerId => myInstitutions(providerId).map(i => i.id);

/**
 * Institutning qabul mezonlari sahifasi: har bir jonli mahsulot va
 * uning yo'naltirish sozlamasi. Bu — "seed config + jonli opt-in"
 * qarorining provayder tomonidagi yuzi.
 */
function routingSettings(actor){
  const st  = load();
  const me  = idOf(actor.id);
  const rows = (st.products || [])
    .filter(p => p.providerId === me)
    .map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      status: p.status,
      currency: p.currency,
      minAmount: H.N(p.minAmount),
      maxAmount: H.N(p.maxAmount),
      tenorMax: H.N(p.tenorMax),
      sectors: H.LIST(p.sectors, 15),
      routable: p.routable === true,
      minScore: C.PCT(p.minScore),
      /* Nega ba'zi mahsulot belgilangani bilan reyestrga tushmaydi —
         foydalanuvchi buni taxmin qilmasligi kerak. */
      eligible: p.status === "live"
        && MSCORE.CONFIG.references.currencies.indexOf(p.currency) !== -1,
    }));
  return { ok: true, items: rows, institutions: myInstitutions(me).length };
}

/** Bitta mahsulotning yo'naltirish belgisi. Faqat o'z mahsuloti. */
function setRouting(actor, body){
  const st = load();
  const b  = body || {};
  const me = idOf(actor.id);
  const id = idOf(b.productId);
  const p  = (st.products || []).find(x => x.id === id && x.providerId === me);
  if(!p) return { error: "not_found" };

  const routable = H.BOOL(b.routable);
  const minScore = C.PCT(b.minScore);
  const row = Object.assign({}, p, { routable: routable, minScore: minScore, updated: Date.now() });
  st.products = st.products.map(x => (x.id === p.id ? row : x));
  H.logEvent(st, "scoring_routing_set",
    { productId: p.id, providerId: me, routable: routable, minScore: minScore });
  save(st);
  return { ok: true, product: { id: row.id, routable: routable, minScore: minScore } };
}

/* =========================================================================
   2-BO'LIM. QABULXONA
   ========================================================================= */

/** Institut ro'yxatda ko'radigan qator — dossierning qisqa shakli. */
function inboxRow(p, myIds, mine){
  const pp = p.passport || {};
  const sc = p.scoring || null;
  const hit = (p.routedTo || []).filter(x => myIds.indexOf(x) !== -1);
  return {
    id: p.id,
    status: p.status,
    ownerName: p.ownerName,
    submitted: H.N(p.submitted),
    updated: H.N(p.updated),
    passport: {
      loyihaTuri: pp.loyihaTuri,
      nomi: pp.nomi,
      sektor: pp.sektor,
      hudud: pp.hudud,
      soralayotganSumma: H.N(pp.soralayotganSumma),
      valyuta: pp.valyuta,
      muddat: H.N(pp.muddat),
      moliyalashtirishTuri: pp.moliyalashtirishTuri,
    },
    score: sc ? H.N(sc.total) : null,
    routingStatus: sc ? sc.routingStatus : null,
    projectType: sc ? sc.projectType : pp.loyihaTuri,
    /* Nechta mahsulotim bu loyihaga mos tushgan — "mos %" emas, aniq son:
       moslik submit paytida hal bo'lgan, endi u fakt. */
    matchedProducts: hit.length,
    interest: mine ? { state: mine.state, note: mine.note, updated: mine.updated } : null,
  };
}

/**
 * Institutning yoki ekspertning navbati.
 * Institut — faqat O'ZIGA yo'naltirilganini; ekspert va admin — hammasini,
 * chunki ularning ishi aynan navbatni boshqarish.
 */
function inbox(actor, filter, isCompany){
  const f      = filter || {};
  const st     = load();
  const role   = C.roleOf(actor);
  const expert = C.isExpert(actor);
  /* Uchta holat, ikkitasi emas. "Institut" — bu kompaniya hisobi;
     e-mail bilan tanilgan mehmon na ekspert, na institut, va unga
     "mahsulot belgilang" deyish noto'g'ri maslahat bo'lardi. */
  const kind   = expert ? "expert" : (isCompany ? "institution" : "guest");
  const myIds  = expert ? [] : myInstitutionIds(actor.id);

  const allowed = expert ? EXPERT_QUEUE : QUEUE;
  let rows = (st.scored || []).filter(p => allowed.indexOf(p.status) !== -1);
  if(!expert) rows = rows.filter(p => (p.routedTo || []).some(x => myIds.indexOf(x) !== -1));

  const byProject = interestIndex(st, idOf(actor.id));

  const status = H.S(f.status, 20);
  if(status && allowed.indexOf(status) !== -1) rows = rows.filter(p => p.status === status);
  const sektor = H.S(f.sektor, 40);
  if(sektor && C.SECTORS.indexOf(sektor) !== -1)
    rows = rows.filter(p => (p.passport || {}).sektor === sektor);
  const hudud = H.S(f.hudud, 60);
  if(hudud && C.REGIONS.indexOf(hudud) !== -1)
    rows = rows.filter(p => (p.passport || {}).hudud === hudud);
  const turi = H.S(f.loyihaTuri, 20);
  if(turi && C.PROJECT_TYPES.indexOf(turi) !== -1)
    rows = rows.filter(p => (p.passport || {}).loyihaTuri === turi);
  const want = H.S(f.interest, 20);
  if(want && INTEREST_STATES.indexOf(want) !== -1)
    rows = rows.filter(p => (byProject[p.id] || {}).state === want);
  const minBall = H.N(f.minBall);
  if(minBall > 0) rows = rows.filter(p => p.scoring && H.N(p.scoring.total) >= minBall);
  const q = H.S(f.q, 200).toLowerCase();
  if(q) rows = rows.filter(p => {
    const pp = p.passport || {};
    return String(pp.nomi || "").toLowerCase().includes(q)
        || String(p.ownerName || "").toLowerCase().includes(q);
  });

  return {
    ok: true,
    role,
    actorKind: kind,
    isInstitution: kind === "institution",
    /* Nol bo'lsa sahifa "hech narsa yo'naltirilmagan" emas, "hali
       mahsulot belgilamagansiz" deb ayta olishi kerak — ikki xil holat. */
    institutions: kind === "institution" ? myIds.length : null,
    stats: inboxStats(rows, byProject),
    items: rows
      .sort((a, b) => H.N(b.submitted) - H.N(a.submitted))
      .map(p => inboxRow(p, myIds, byProject[p.id])),
  };
}

function inboxStats(rows, byProject){
  const scored = rows.filter(p => p.scoring);
  const totals = scored.map(p => H.N(p.scoring.total));
  return {
    total: rows.length,
    fresh: rows.filter(p => !byProject[p.id]).length,
    shortlist: rows.filter(p => (byProject[p.id] || {}).state === "shortlist").length,
    avgScore: totals.length ? totals.reduce((s, x) => s + x, 0) / totals.length : null,
  };
}

/**
 * Bitta loyihaning to'liq dossieri. Institut faqat O'ZIGA yo'naltirilgan
 * loyihani ocha oladi — ro'yxatdan yashirilgan narsa havola orqali
 * ochilib ketmasligi kerak.
 */
function openDossier(actor, id){
  const st     = load();
  const expert = C.isExpert(actor);
  const p      = (st.scored || []).find(x => x.id === idOf(id));
  if(!p) return { error: "not_found" };

  const allowed = expert ? EXPERT_QUEUE : QUEUE;
  if(allowed.indexOf(p.status) === -1) return { error: "forbidden" };

  const myIds = expert ? [] : myInstitutionIds(actor.id);
  if(!expert && !(p.routedTo || []).some(x => myIds.indexOf(x) !== -1))
    return { error: "forbidden" };

  const mine = interestIndex(st, idOf(actor.id))[p.id] || null;
  /* Audit izi va ownerId ataylab tushirib qoldirilgan — yuqoridagi
     sarlavha izohiga qarang. */
  return {
    ok: true,
    role: C.roleOf(actor),
    project: {
      id: p.id,
      status: p.status,
      ownerName: p.ownerName,
      created: H.N(p.created),
      submitted: H.N(p.submitted),
      updated: H.N(p.updated),
      passport: p.passport,
      /* Maydon nomlari cleanProject() dagidek YOZILGANICHA bo'lishi
         shart: u startupInfo / financialHistory / financialModel deb
         saqlaydi. Qisqartirilgan nomlar (startup, history, model) jim
         turib har bir dossierga bo'sh moliyaviy model berardi — ya'ni
         institut aynan qaror uchun kerak bo'lgan qismni ko'rmasdi. */
      startupInfo: p.startupInfo || null,
      financialHistory: Array.isArray(p.financialHistory) ? p.financialHistory : [],
      financialModel: p.financialModel || null,
      dueDiligence: p.dueDiligence || null,
      documents: p.documents || null,
      scoring: p.scoring || null,
    },
    interest: mine ? { state: mine.state, note: mine.note, updated: mine.updated } : null,
    matchedProducts: expert ? null : (p.routedTo || []).filter(x => myIds.indexOf(x) !== -1).length,
  };
}

/* =========================================================================
   3-BO'LIM. QIZIQISH
   ========================================================================= */

/** Shu provayderning qiziqishlari, projectId bo'yicha indeks. */
function interestIndex(st, providerId){
  const out = {};
  (st.interest || [])
    .filter(r => r.providerId === providerId)
    .forEach(r => { out[r.projectId] = r; });
  return out;
}

/**
 * Qiziqish bildirish yoki o'zgartirish. Bu HOLAT ZANJIRIGA TEGMAYDI:
 * loyihani "ko'rib chiqilmoqda" ga o'tkazish ekspertning ishi, institut
 * esa faqat o'z munosabatini yozadi. Ikkisini aralashtirish har qanday
 * institutga platformaning rasmiy holatini surish huquqini berardi.
 */
function setInterest(actor, body){
  const st = load();
  const b  = body || {};
  const me = idOf(actor.id);
  const pid = idOf(b.projectId);

  const p = (st.scored || []).find(x => x.id === pid);
  if(!p) return { error: "not_found" };
  if(QUEUE.indexOf(p.status) === -1) return { error: "forbidden" };

  const myIds = myInstitutionIds(me);
  if(!(p.routedTo || []).some(x => myIds.indexOf(x) !== -1)) return { error: "forbidden" };

  const state = H.ONE(b.state, INTEREST_STATES, "");
  if(!state) return { error: "bad_state" };

  const now  = Date.now();
  const prev = (st.interest || []).find(r => r.projectId === pid && r.providerId === me);
  const row  = {
    id: prev ? prev.id : H.uid("fi"),
    projectId: pid,
    providerId: me,
    providerName: H.S(actor.name, 160),
    state: state,
    note: H.S(b.note, 1000),
    created: prev ? H.N(prev.created) : now,
    updated: now,
  };
  st.interest = prev
    ? (st.interest || []).map(r => (r.id === prev.id ? row : r))
    : (st.interest || []).concat([row]);

  H.logEvent(st, "scoring_interest", { projectId: pid, providerId: me, state: state });
  save(st);
  return { ok: true, interest: { state: row.state, note: row.note, updated: row.updated } };
}

/**
 * Loyiha egasi ko'radigan yig'ma qiziqish. Ism ko'rinadi, IZOH EMAS:
 * izoh institutning ichki bahosi va u egaga aytilishi uchun yozilmagan.
 */
function interestOf(projectId){
  const pid = idOf(projectId);
  return (load().interest || [])
    .filter(r => r.projectId === pid && r.state !== "passed")
    .map(r => ({ providerName: r.providerName, state: r.state, updated: H.N(r.updated) }))
    .sort((a, b) => b.updated - a.updated);
}

module.exports = {
  QUEUE, EXPERT_QUEUE, INTEREST_STATES,
  myInstitutions, myInstitutionIds,
  routingSettings, setRouting,
  inbox, inboxRow, inboxStats, openDossier,
  setInterest, interestOf,
};
