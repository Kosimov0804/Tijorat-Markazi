/* ============================================================
   MOLIYA BOZORI — INVESTOR TOMONI: sahifa boshqaruvchisi

   Sahifa skoring navbatining QARAMA-QARSHI tomoni: tashabbuskor
   loyihani yuboradi, bu yerda esa institut uni qabul qiladi. Shuning
   uchun u moliya-korxona/moliya-startup bilan bitta sahifa emas —
   aktyori, huquqlari va bo'sh ekranlari boshqacha.

   Uchta ko'rinish bitta konteynerda almashadi (qabulxona → dossier →
   qabul mezonlari), chunki bular bitta ishning bosqichlari: mezonni
   o'zgartirgan odam darhol navbatga qaytib, natijani ko'rishi kerak.

   Vakolat: bu fayl HECH NARSANI hisoblamaydi va FILTRLAMAYDI. Navbat
   ham, statistika ham serverdan filtrlangan holda keladi — mijozda
   qayta kesilsa, plitkalar bir sonni, jadval boshqasini ko'rsatardi.

   Fayl bo'linishi (800 qatorlik shift):
     moliya-scoring-config/core/ui  — metodika, dvigatel, atomlar
     moliya-investor-i18n.js        — qabulxonaning lug'ati
     moliya-investor-views.js       — uchta ko'rinish
     moliya-investor.js             — shu fayl
   ============================================================ */
(() => {
const { $, $$, t, esc, api, ident, loading, say, chrome, applyStatic, num } = MK;

/* Lug'at: T_MOLIYA (mk_* va ml_* kalitlari) ustiga skoringniki, uning
   ustiga qabulxonaniki. setDict ALMASHTIRADI, qo'shmaydi — shuning
   uchun birlashtirish shu yerda, bitta chaqiruvda bo'ladi. */
MK.setDict(Object.assign({},
  typeof T_MOLIYA !== "undefined" ? T_MOLIYA : {},
  typeof T_MS     !== "undefined" ? T_MS     : {},
  typeof T_MS_INV !== "undefined" ? T_MS_INV : {}));

const state = {
  view: "inbox",              // inbox | dossier | settings
  role: "tashabbuskor",
  actorKind: "guest",
  isInstitution: false,
  institutions: null,
  companyName: (ident.company() || {}).name || "",
  stats: {}, items: [],
  filter: { q: "", status: "", sektor: "", hudud: "", loyihaTuri: "", interest: "", minBall: "" },
  current: null,              // { project, interest, matchedProducts }
  draftInterest: {},          // saqlanmagan tanlov va izoh
  products: [], prodInstitutions: 0,
  identified: true,
};

const root = () => $("#msiRoot");
const adminPass = () => {
  try { return (JSON.parse(localStorage.getItem("kg_admin") || "null") || {}).password || ""; }
  catch (e) { return ""; }
};

/* ---------- tarmoq ----------
   Shaxs TANADA yuboriladi (uy uslubi): kompaniya login/password,
   admin pass, odam email/name. MK.api hech qachon otmaydi — xatoni
   { error } sifatida qaytaradi, shuning uchun har chaqiruvdan keyin
   natija tekshiriladi. */
function creds(extra) {
  const body = ident.co(ident.me(extra || {}));
  const pass = adminPass();
  if (pass) body.pass = pass;
  return body;
}

const ERR_KEY = {
  company_login_required: "msi_err_company",
  identify_first: "msi_login_title",
  forbidden: "msi_err_forbidden",
  not_found: "msi_err_notfound",
  bad_state: "msi_err_badstate",
};
const errText = r => {
  const key = ERR_KEY[r && r.error];
  return key ? t(key) : (r && r.error ? String(r.error) : t("ms_err_forbidden"));
};

/** Yuklashdagi xato — butun ko'rinish o'rniga kartochka. */
function failView(r) {
  root().innerHTML = `<div class="mk-card ms-empty msi-empty">
    <p><b>${esc(errText(r))}</b></p>
    <button type="button" class="btn btn-ghost" id="msi-back">${esc(t("msi_back"))}</button>
  </div>`;
  wire();
}
/** Ko'rinish ichidagi xato — joyida, sahifani buzmasdan. */
const failInline = (el, r) => say(el, errText(r), "err");

/* ---------- qabulxona ---------- */
async function loadInbox() {
  root().innerHTML = loading();
  const r = await api("/api/moliya/investor/inbox", creds({ filter: state.filter }));
  if (r && r.error === "identify_first") {
    state.identified = false;
    root().innerHTML = MS_INV_VIEWS.needIdentity();
    pulse();
    return;
  }
  if (!r || r.error) return failView(r);
  state.identified = true;
  state.role = r.role || "tashabbuskor";
  state.actorKind = r.actorKind || (r.isInstitution === true ? "institution" : "expert");
  state.isInstitution = r.isInstitution === true;
  state.institutions = r.institutions;
  state.stats = r.stats || {};
  state.items = r.items || [];
  state.view = "inbox";
  render();
}

/**
 * CSV eksport. Server uni admin paroli bilan himoyalaydi va HAQIQIY
 * fayl qaytaradi, JSON emas — shuning uchun MK.api emas, oddiy
 * POST-form: brauzer javobni yuklab olish sifatida qabul qilsin.
 */
function exportCsv() {
  const f = document.createElement("form");
  f.method = "POST"; f.action = "/api/moliya/scoring/export"; f.target = "_blank";
  const i = document.createElement("input");
  i.type = "hidden"; i.name = "pass"; i.value = adminPass();
  f.appendChild(i); document.body.appendChild(f); f.submit(); f.remove();
}

/**
 * Rasmiy holatni surish. Ball bu yerda ham qayta hisoblanmaydi va
 * o'tish qoidasi ham mijozda tekshirilmaydi — ikkalasi serverda.
 * Bu yerdagi yagona ish: qaysi tugma bosilganini aytish.
 */
async function setStatus(target) {
  const cur = state.current || {};
  const p = cur.project || {};
  if (!p.id || state.busy) return;
  const noteEl = $("#msi-st-note");
  state.busy = true;
  const r = await api("/api/moliya/scoring/status", creds({
    id: p.id, status: target, comment: noteEl ? noteEl.value : "",
  }));
  state.busy = false;
  if (!r || r.error) return failInline($("#msi-st-msg"), r);
  /* Dossierni qaytadan o'qiymiz: holat o'zgardi, ya'ni qaysi
     tugmalar qolishi ham o'zgardi. */
  openDossier(p.id);
}

/* Hero yonidagi puls navbatning ikki sonini ushlaydi: nechta loyiha
   turibdi va nechtasi qisqa ro'yxatda. Statistika sarlavhada ham bor,
   ammo dossier ochilganda u ekrandan chiqib ketadi — puls qoladi. */
function pulse() {
  const el = $("#msiPulse");
  if (!el) return;
  const st = state.stats || {};
  el.innerHTML = `<div><b>${num(st.total || 0, 0)}</b><span>${esc(t("msi_pulse_queue"))}</span></div>
    <div><b>${num(st.shortlist || 0, 0)}</b><span>${esc(t("msi_pulse_shortlist"))}</span></div>`;
}

/* ---------- dossier ---------- */
async function openDossier(id) {
  root().innerHTML = loading();
  const r = await api("/api/moliya/investor/open", creds({ id }));
  if (!r || r.error) return failView(r);
  state.current = r;
  state.draftInterest = {};
  state.view = "dossier";
  render();
}

async function saveInterest() {
  const box = $("#msi-int-msg");
  const picked = state.draftInterest.state
    || (state.current.interest && state.current.interest.state) || "";
  if (!picked) return say(box, t("msi_int_pick"), "err");

  const note = $("#msi-note") ? $("#msi-note").value : "";
  const r = await api("/api/moliya/investor/interest", creds({
    projectId: state.current.project.id, state: picked, note: note }));
  if (!r || r.error) return failInline(box, r);

  /* Javobdagi yozuv — haqiqat manbai; mahalliy qoralama tashlanadi,
     aks holda ekranda saqlanmagan matn "saqlandi" deb turardi. */
  state.current = Object.assign({}, state.current, { interest: r.interest });
  state.draftInterest = {};
  render();
  say($("#msi-int-msg"), t("msi_int_saved"), "ok");
}

/* ---------- qabul mezonlari ---------- */
async function loadSettings() {
  if (!state.isInstitution) {
    state.view = "settings";
    render();
    return;
  }
  root().innerHTML = loading();
  const r = await api("/api/moliya/investor/routing", creds({ op: "get" }));
  if (!r || r.error) return failView(r);
  state.products = r.items || [];
  state.prodInstitutions = r.institutions || 0;
  state.view = "settings";
  render();
}

async function saveRouting(productId) {
  const box = $('[data-msi-msg="' + cssq(productId) + '"]');
  const chk = $('[data-msi-routable="' + cssq(productId) + '"]');
  const min = $('[data-msi-minscore="' + cssq(productId) + '"]');
  const r = await api("/api/moliya/investor/routing", creds({
    op: "set", productId: productId,
    routable: !!(chk && chk.checked),
    minScore: min ? Number(min.value) : 0 }));
  if (!r || r.error) return failInline(box, r);

  /* Reyestr sanog'i shu yerda qayta o'qilmaydi: u "routable + live +
     metodikadagi valyuta" kesishmasi va uni server hisoblaydi. Shuning
     uchun saqlashdan keyin ro'yxat butunlay qayta yuklanadi. */
  state.products = state.products.map(p =>
    p.id === productId ? Object.assign({}, p, r.product) : p);
  await loadSettings();
  say($('[data-msi-msg="' + cssq(productId) + '"]'), t("msi_set_saved"), "ok");
}

/* Mahsulot identifikatori tanlovchi ichiga tushadi — u H.uid() dan
   kelgan bo'lsa ham, ishonch mijozda tugamasligi kerak. */
const cssq = v => String(v == null ? "" : v).replace(/["\\]/g, "\\$&");

/* ---------- ko'rinish almashtirish ---------- */
function render() {
  const el = root();
  if (!state.identified) el.innerHTML = MS_INV_VIEWS.needIdentity();
  else if (state.view === "dossier") el.innerHTML = MS_INV_VIEWS.dossier(state);
  else if (state.view === "settings")
    el.innerHTML = state.isInstitution ? MS_INV_VIEWS.settings(state) : MS_INV_VIEWS.settingsLocked();
  else el.innerHTML = MS_INV_VIEWS.inbox(state);
  wire();
  pulse();
  applyStatic();
  goTop();
}

/* Ko'rinish ALMASHGANDA (qabulxona -> dossier -> mezonlar) sahifa o'z
   holicha o'sha balandlikda qolardi: jadvalning beshinchi qatoridan
   dossier ochgan odam yangi ekranning o'rtasiga tushib, sarlavhasini
   umuman ko'rmasdi. Filtr yoki saqlashdan keyingi qayta chizishda esa
   aksincha — joyida qolish to'g'ri, shuning uchun surish faqat
   ko'rinish NOMI o'zgarganda tekshiriladi.

   O'lchov keyingi kadrda olinadi: innerHTML almashgach brauzerning
   o'z "scroll anchoring" tuzatishi hali ishlab ulgurmagan bo'ladi va
   shu ondagi koordinata eskirgan chiqadi. */
let shownView = "inbox";
function goTop() {
  if (shownView === state.view) return;
  shownView = state.view;
  requestAnimationFrame(() => {
    const el = root();
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    /* Yopishqoq sarlavha 110px ni yopadi; ko'rinish boshi shundan
       yuqorida qolgan bo'lsa — va faqat shunda — pastga suriladi. */
    if (top < 110) window.scrollTo(0, Math.max(0, top + window.scrollY - 110));
  });
}

/* ---------- hodisalarni biriktirish ----------
   innerHTML eski tugmalarni yo'q qiladi, shuning uchun tinglovchilar
   har render'dan keyin yangi elementlarga qayta osiladi. */
function wire() {
  const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); };

  on("#msi-back", "click", () => loadInbox());
  on("#msi-csv", "click", exportCsv);
  on("#msi-st-review", "click", () => setStatus("review"));
  on("#msi-st-approve", "click", () => setStatus("approved"));
  on("#msi-st-reject", "click", () => setStatus("rejected"));
  on("#msi-settings", "click", () => loadSettings());
  on("#msi-go-settings", "click", () => loadSettings());
  on("#msi-empty-settings", "click", () => loadSettings());
  on("#msi-clear", "click", () => {
    Object.keys(state.filter).forEach(k => { state.filter[k] = ""; });
    loadInbox();
  });

  $$("[data-msi-open]").forEach(el => el.addEventListener("click", e => {
    e.preventDefault();
    openDossier(el.getAttribute("data-msi-open"));
  }));

  if (state.view === "inbox") wireFilter();
  if (state.view === "dossier") wireInterest();
  if (state.view === "settings") wireSettings();
}

/* Qidiruv har bosishda serverga chiqmasin: kechiktirilgan yagona
   so'rov. Selektlar esa darhol — ular bir marta bosiladi. */
let searchTimer = null;
function wireFilter() {
  const q = $("#msi-q");
  if (q) q.addEventListener("input", () => {
    state.filter.q = q.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadInbox().then(restoreSearch), 350);
  });
  const bind = (sel, key) => {
    const el = $(sel);
    if (el) el.addEventListener("change", () => { state.filter[key] = el.value; loadInbox(); });
  };
  bind("#msi-status", "status");
  bind("#msi-sektor", "sektor");
  bind("#msi-hudud", "hudud");
  bind("#msi-turi", "loyihaTuri");
  bind("#msi-interest", "interest");
  const mb = $("#msi-minball");
  if (mb) mb.addEventListener("change", () => { state.filter.minBall = mb.value; loadInbox(); });
}

/** Qayta chizishdan keyin kursor qidiruv maydonida qoladi. */
function restoreSearch() {
  const again = $("#msi-q");
  if (!again) return;
  again.focus();
  const n = again.value.length;
  try { again.setSelectionRange(n, n); } catch (e) {}
}

function wireInterest() {
  $$("[data-msi-state]").forEach(b => b.addEventListener("click", () => {
    /* Tanlov DARHOL saqlanmaydi: izoh bilan birga bitta so'rovda
       ketadi, aks holda "o'tkazib yubordim" bosilgan zahoti yozilib,
       izoh keyin alohida so'rov bo'lardi. */
    state.draftInterest.state = b.getAttribute("data-msi-state");
    const note = $("#msi-note");
    if (note) state.draftInterest.note = note.value;
    render();
  }));
  const note = $("#msi-note");
  if (note) note.addEventListener("input", () => { state.draftInterest.note = note.value; });
  const save = $("#msi-save-interest");
  if (save) save.addEventListener("click", saveInterest);
}

function wireSettings() {
  $$("[data-msi-save]").forEach(b => b.addEventListener("click", () =>
    saveRouting(b.getAttribute("data-msi-save"))));
}

/* ---------- ishga tushirish ----------
   Til almashganda butun ko'rinish qayta chiziladi: ball ham, navbat
   ham o'zgarmaydi — faqat matn, shuning uchun serverga qaytilmaydi. */
chrome(() => render());

loadInbox();
})();
