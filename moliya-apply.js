/* ============================================================
   MOLIYA BOZORI — sahifa boshqaruvchisi (controller)

   Sahifa loyiha skoringi atrofida qurilgan: tashabbuskor loyihani
   sehrgar orqali kiritadi, 100 ballik metodika uni baholaydi va
   natija mos moliya institutlariga yo'naltiriladi.

   Ko'rinishlar bitta tab ichida almashadi (ro'yxat → sehrgar →
   natija → teaser → metodika), chunki bular bitta ishning
   bosqichlari, alohida sahifalar emas: foydalanuvchi "ballni
   oshirish" uchun natijadan sehrgarga va qaytib boradi, va bu yo'lda
   har safar sahifa qayta yuklanishi kerak emas.

   Vakolat: bu fayl HECH QACHON ball hisoblamaydi. Sehrgar ichidagi
   jonli KPI'lar moliya-scoring-core.js dan keladi va faqat ko'rsatuv
   uchun; saqlanadigan va ko'rsatiladigan RASMIY ball har doim
   serverdan qaytgan `scoring` obyektidir.

   Fayl bo'linishi (800 qatorlik shift):
     moliya-scoring-config.js  — metodika jadvali
     moliya-scoring-core.js    — dvigatel
     moliya-scoring-i18n.js    — uch tilli lug'at
     moliya-scoring-ui.js      — atomlar
     moliya-scoring-wizard.js  — forma
     moliya-scoring-views.js   — katta ko'rinishlar
     moliya-apply.js           — shu fayl (ikkala yo'l uchun)
   ============================================================ */
(() => {
const { $, $$, t, esc, api, ident, loading, say, chrome, applyStatic } = MK;

/* Lug'at: T_MOLIYA (mahsulot katalogi uchun qolgan ml_ kalitlari) ustiga
   skoring kalitlari qo'yiladi. setDict ALMASHTIRADI, qo'shmaydi — shuning
   uchun birlashtirish shu yerda, bitta chaqiruvda bo'ladi. */
MK.setDict(Object.assign({},
  typeof T_MOLIYA !== "undefined" ? T_MOLIYA : {},
  typeof T_MS !== "undefined" ? T_MS : {}));

const CFG = MSCORE.CONFIG;

/* Sahifa qaysi yo'lni xizmat qiladi. Ikkala sahifa ayni shu faylni
   yuklaydi: ro'yxat, natija va dossier ikkovida bir xil, ayriladigani
   metodika va sehrgar — ular esa loyihaTuri ga qarab shoxlanadi.
   Yo'l sahifada qat'iy, shuning uchun sehrgarda tanlov ko'rsatilmaydi. */
const TRACK = document.body.dataset.msTrack === "startup" ? "startup" : "company";
MS_WIZ.lockTrack(TRACK);

const state = {
  view: "list",          // list | wizard | results | methodology | teaser
  role: "tashabbuskor",
  items: [], view_: [], stats: {},
  q: "", tur: "", status: "", sortKey: "updated", sortDir: "desc",
  draft: null, step: 1, errors: [],
  current: null, simPicks: null,
  busy: false,
};

const root = () => $("#msRoot");
const adminPass = () => {
  try { return (JSON.parse(localStorage.getItem("kg_admin") || "null") || {}).password || ""; }
  catch (e) { return ""; }
};

/* ---------- tarmoq ----------
   MK.api hech qachon otmaydi: xatoni { error } sifatida qaytaradi.
   Shuning uchun har bir chaqiruvdan keyin natija tekshiriladi va
   foydalanuvchiga tushunarli jumla ko'rsatiladi. */
function creds(extra) {
  const body = ident.co(ident.me(extra || {}));
  /* Admin paroli bo'lsa qo'shamiz: server rolni SHU orqali aniqlaydi.
     Bo'sh parol yuborilsa isAdmin("") baribir false, shuning uchun uni
     umuman qo'shmaymiz - tanada keraksiz maydon qolmasin. */
  const pass = adminPass();
  if (pass) body.pass = pass;
  return body;
}

const ERR_KEY = {
  routing_locked: "ms_err_routing_locked",
  bad_transition: "ms_err_bad_transition",
  forbidden: "ms_err_forbidden",
  identify_first: "ms_need_login",
};
function fail(r) {
  const key = ERR_KEY[r && r.error];
  say(root(), key ? t(key) : (r && r.error ? r.error : t("ms_err_forbidden")), "err");
}

/* ---------- ro'yxat ---------- */
async function loadHome() {
  state.busy = true;
  root().innerHTML = loading();
  /* Yo'l serverga FILTR sifatida uzatiladi, mijozda kesilmaydi:
     statistika plitkalari statsOf(rows) dan keladi va u filtrdan
     KEYIN hisoblanadi. Mijozda kesilsa, plitkalar ikkala yo'lning
     yig'indisini ko'rsatib, qatorlar esa bittasini ko'rsatardi. */
  const r = await api("/api/moliya/scoring/home", creds({ loyihaTuri: TRACK }));
  state.busy = false;
  /* Shaxsi aniqlanmagan mehmon — bu xato emas, holat. Qizil ogohlantirish
     o'rniga kirish taklifi ko'rsatiladi. */
  if (r && r.error === "identify_first") { root().innerHTML = needIdentity(); return; }
  if (!r || r.error) return fail(r);
  state.role = r.role || "tashabbuskor";
  state.items = r.items || [];
  state.stats = r.stats || {};
  render();
}

function needIdentity() {
  return `<div class="mk-card ms-empty">
    <p><b>${esc(t("ms_need_login"))}</b></p>
    <p class="mk-note">${esc(t("ms_sub"))}</p>
    <a class="btn btn-primary" href="kirish.html">${esc(t("ms_need_login"))}</a>
  </div>`;
}

/** Qidiruv, filtr va saralash — serverga qaytmasdan, ro'yxat kichik. */
function applyFilters() {
  const q = (state.q || "").trim().toLowerCase();
  let list = state.items.filter(p => {
    if (state.tur && (p.passport.loyihaTuri || "company") !== state.tur) return false;
    if (state.status && p.status !== state.status) return false;
    if (!q) return true;
    const hay = [p.passport.nomi, p.passport.stir, MS_UI.sectorName(p), MS_UI.regionName(p)]
      .join(" ").toLowerCase();
    return hay.indexOf(q) !== -1;
  });
  const val = p => {
    switch (state.sortKey) {
      case "nomi": return (p.passport.nomi || "").toLowerCase();
      case "summa": return MSCORE.toUsdEquivalent(p.passport.soralayotganSumma, p.passport.valyuta);
      case "ball": return p.score ? p.score.total : -1;
      case "status": return p.status;
      default: return p.updated || 0;
    }
  };
  list = list.slice().sort((a, z) => {
    const av = val(a), zv = val(z);
    const cmp = av > zv ? 1 : av < zv ? -1 : 0;
    return state.sortDir === "asc" ? cmp : -cmp;
  });
  state.view_ = list;
}

/* ---------- ko'rinish almashtirish ---------- */
function render() {
  applyFilters();
  const el = root();
  if (state.view === "wizard") el.innerHTML = wizardHtml();
  else if (state.view === "results") el.innerHTML = MS_VIEWS.results(state.current, state.role, state.simPicks);
  else if (state.view === "methodology") el.innerHTML = MS_VIEWS.methodology();
  else if (state.view === "teaser") el.innerHTML = MS_VIEWS.teaser(state.current);
  else el.innerHTML = MS_VIEWS.dashboard({
    stats: state.stats, items: state.items, view: state.view_, role: state.role, track: TRACK,
    q: state.q, tur: state.tur, status: state.status,
    sortKey: state.sortKey, sortDir: state.sortDir,
  });
  document.body.classList.toggle("ms-printing", state.view === "teaser");
  wire();
  applyStatic();
}

const go = v => { state.view = v; render(); };

/* ---------- sehrgar ---------- */
function wizardHtml() {
  const p = state.draft;
  const labels = MS_WIZ.stepLabels(p.passport.loyihaTuri);
  const errs = state.errors.length
    ? `<div class="mk-msg is-err"><b>${esc(t("ms_wiz_errors"))}</b><ul>${
        state.errors.map(e => `<li>${esc(e)}</li>`).join("")}</ul></div>`
    : "";
  return `
  <div class="ms-head">
    <div>
      <h2>${esc(p.passport.nomi || t("ms_wiz_new"))}</h2>
      <p class="mk-sub">${esc(t("ms_wiz_step_of")
        .replace("{n}", String(state.step)).replace("{total}", String(labels.length)))} · ${esc(labels[state.step - 1])}</p>
    </div>
    <div class="mk-actions">
      <button type="button" class="btn btn-ghost" id="ms-back">${esc(t("ms_back_list"))}</button>
    </div>
  </div>
  ${MS_UI.stepper(labels, state.step)}
  <div class="mk-card ms-wizard">
    ${errs}
    <div id="ms-wiz-body">${MS_WIZ.markup(state.step, p)}</div>
    <div class="ms-wiz-foot">
      <button type="button" class="btn btn-ghost" id="ms-prev"${state.step === 1 ? " disabled" : ""}>${esc(t("ms_wiz_back"))}</button>
      <div class="mk-actions">
        <button type="button" class="btn btn-ghost" id="ms-draft">${esc(t("ms_wiz_draft"))}</button>
        ${state.step < 4
          ? `<button type="button" class="btn btn-primary" id="ms-next">${esc(t("ms_wiz_next"))}</button>`
          : `<button type="button" class="btn btn-primary" id="ms-finish">${esc(t("ms_wiz_finish"))}</button>`}
      </div>
    </div>
  </div>`;
}

function startWizard(project) {
  state.draft = project || MSCORE.blankProject();
  /* Yangi loyiha sahifaning yo'lini oladi; mavjudi o'zinikini saqlaydi. */
  if (!project) state.draft.passport.loyihaTuri = TRACK;
  state.step = 1;
  state.errors = [];
  go("wizard");
}

/** Qoralama yoki yakuniy saqlash. Ball serverda hisoblanadi. */
async function persist(finish) {
  MS_WIZ.collect(state.step, state.draft);
  if (finish) {
    /* Yakunlashda BARCHA bosqichlar tekshiriladi — foydalanuvchi
       oxirgi bosqichga o'tib ketib, oldingisini bo'sh qoldirgan
       bo'lishi mumkin. */
    const errs = [1, 2, 3, 4].reduce((a, s) => a.concat(MS_WIZ.validate(s, state.draft)), []);
    if (errs.length) { state.errors = errs; render(); return; }
  }
  state.errors = [];
  /* Tana YASSI yuboriladi (loyiha maydonlari + hisob ma'lumotlari) — srv/ dagi
     cleanProduct/cleanPassport bilan bir xil naqsh: server tananing o'zini
     tozalaydi, ichki "project" tugunini emas. */
  const payload = Object.assign({}, state.draft);
  /* Holatni faqat YAKUNLASHDA uzatamiz: server ruxsat etadigan yagona
     egalik o'tishi draft -> scored. Qoralama saqlashda status yuborilmaydi,
     aks holda allaqachon baholangan loyiha qayta "qoralama" ga tushib qolardi. */
  if (finish) payload.status = "scored"; else delete payload.status;
  const r = await api("/api/moliya/scoring/save", creds(payload));
  if (!r || r.error) return fail(r);
  state.draft = r.project;
  await loadHome();
  if (finish) openProject(r.project.id);
  else say(root(), t("ms_draft_saved"), "ok");
}

/* ---------- natija ---------- */
async function openProject(id) {
  root().innerHTML = loading();
  const r = await api("/api/moliya/scoring/open", creds({ id }));
  if (!r || r.error) return fail(r);
  state.current = r;
  state.simPicks = MS_VIEWS.simPicksFrom(r.scoring);
  go("results");
}


async function submitProject() {
  const r = await api("/api/moliya/scoring/submit", creds({ id: state.current.project.id }));
  if (!r || r.error) return fail(r);
  say(root(), t("ms_submitted").replace("{n}", String((r.routedTo || []).length)), "ok");
  await loadHome();
  openProject(state.current.project.id);
}

/* ---------- hodisalarni biriktirish ----------
   Har bir render'dan keyin qayta chaqiriladi: innerHTML eski
   tugmalarni yo'q qiladi, shuning uchun listener'lar ham yangi
   elementlarga qayta osiladi. */
function wire() {
  const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); };

  on("#ms-back", "click", () => { state.current = null; go("list"); });
  on("#ms-methodology", "click", () => go("methodology"));
  on("#ms-new", "click", () => startWizard(null));
  on("#ms-new-2", "click", () => startWizard(null));
  on("#ms-print-btn", "click", () => window.print());
  on("#ms-teaser", "click", () => go("teaser"));
  on("#ms-edit", "click", () => startWizard(JSON.parse(JSON.stringify(state.current.project))));

  on("#ms-submit", "click", submitProject);
  /* Ekspertning o'tishlari investor sahifasiga ko'chdi —
     moliya-investor-views.js dagi expertPanel ga qarang. */

  if (state.view === "list") wireList();
  if (state.view === "wizard") wireWizard();
  if (state.view === "results") wireSim();
}

function wireList() {
  const q = $("#ms-q");
  if (q) q.addEventListener("input", () => {
    const pos = q.selectionStart;
    state.q = q.value;
    render();
    const again = $("#ms-q");
    if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (e) {} }
  });
  const ty = $("#ms-f-type"); if (ty) ty.addEventListener("change", () => { state.tur = ty.value; render(); });
  const st = $("#ms-f-status"); if (st) st.addEventListener("change", () => { state.status = st.value; render(); });

  $$("[data-ms-sort]").forEach(th => th.addEventListener("click", () => {
    const k = th.getAttribute("data-ms-sort");
    if (state.sortKey === k) state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    else { state.sortKey = k; state.sortDir = k === "nomi" ? "asc" : "desc"; }
    render();
  }));

  $$("[data-ms-open]").forEach(el => el.addEventListener("click", e => {
    e.preventDefault();
    openProject(el.getAttribute("data-ms-open"));
  }));
  $$("[data-ms-edit]").forEach(el => el.addEventListener("click", async () => {
    const r = await api("/api/moliya/scoring/open", creds({ id: el.getAttribute("data-ms-edit") }));
    if (!r || r.error) return fail(r);
    startWizard(r.project);
  }));

}

function wireWizard() {
  const p = state.draft;
  const step = state.step;

  $("#ms-prev") && $("#ms-prev").addEventListener("click", () => {
    MS_WIZ.collect(step, p); state.step = Math.max(1, step - 1); state.errors = []; render();
  });
  $("#ms-next") && $("#ms-next").addEventListener("click", () => {
    MS_WIZ.collect(step, p);
    const errs = MS_WIZ.validate(step, p);
    if (errs.length) { state.errors = errs; render(); return; }
    state.errors = []; state.step = Math.min(4, step + 1); render();
  });
  $("#ms-draft") && $("#ms-draft").addEventListener("click", () => persist(false));
  $("#ms-finish") && $("#ms-finish").addEventListener("click", () => persist(true));

  $$("[data-ms-step]").forEach(b => b.addEventListener("click", () => {
    const n = Number(b.getAttribute("data-ms-step"));
    if (n === step) return;
    MS_WIZ.collect(step, p);
    /* Oldinga sakrashda oraliq bosqichlar tekshiriladi; orqaga
       qaytish har doim erkin. */
    if (n > step) {
      const errs = [];
      for (let s = step; s < n; s++) errs.push.apply(errs, MS_WIZ.validate(s, p));
      if (errs.length) { state.errors = errs; render(); return; }
    }
    state.errors = []; state.step = n; render();
  }));

  /* 1-bosqichda yo'l almashsa keyingi uch bosqich butunlay boshqa
     bo'ladi - shuning uchun darhol qayta chiziladi. Tanlov <select>
     emas, ikkita karta-tugma: avval joriy maydonlarni yig'ib olamiz,
     keyin yo'lni almashtiramiz, aks holda kiritilgan matn yo'qoladi. */
  $$("[data-ms-track]").forEach(b => b.addEventListener("click", () => {
    const next = b.getAttribute("data-ms-track");
    if (next === p.passport.loyihaTuri) return;
    MS_WIZ.collect(1, p);
    p.passport.loyihaTuri = next;
    render();
  }));

  if (step === 2 && p.passport.loyihaTuri !== "startup") {
    $$("[data-ms-hist]").forEach(el => el.addEventListener("input", () => {
      MS_WIZ.collect(2, p);
      const body = $("#ms-hist-metrics");
      if (body) body.innerHTML = MS_WIZ.historyMetricsRows(p);
      const cnt = $("#ms-hist-count");
      if (cnt) cnt.textContent = MSCORE.calcHistoryMetrics(p.financialHistory).profitableYears;
    }));
  }

  if (step === 3) {
    const refresh = () => {
      MS_WIZ.collect(3, p);
      const el = $("#ms-model-kpis");
      if (el) el.innerHTML = MS_UI.kpiTiles(p, MS_WIZ.liveKpis(p));
    };
    $$("[data-ms-model]").forEach(el => el.addEventListener("input", refresh));
    $("#ms-f-diskont") && $("#ms-f-diskont").addEventListener("input", refresh);
    $("#ms-f-mb") && $("#ms-f-mb").addEventListener("input", refresh);
    $("#ms-add-year") && $("#ms-add-year").addEventListener("click", () => {
      MS_WIZ.collect(3, p);
      p.financialModel.yillar.push({ yil: p.financialModel.yillar.length + 1, fcf: null, cfads: null, principal: null, interest: null });
      render();
    });
    $$("[data-ms-delyear]").forEach(b => b.addEventListener("click", () => {
      MS_WIZ.collect(3, p);
      p.financialModel.yillar.splice(Number(b.getAttribute("data-ms-delyear")), 1);
      p.financialModel.yillar.forEach((y, i) => { y.yil = i + 1; });
      render();
    }));
  }

  if (step === 4) {
    const up = $("#ms-doc-file");
    if (up) up.addEventListener("change", e => {
      MS_WIZ.collect(4, p);
      Array.prototype.forEach.call(e.target.files, f =>
        p.documents.push({ name: f.name, size: f.size, type: f.type, uploadedAt: Date.now() }));
      render();
    });
    $$("[data-ms-deldoc]").forEach(b => b.addEventListener("click", () => {
      MS_WIZ.collect(4, p);
      p.documents.splice(Number(b.getAttribute("data-ms-deldoc")), 1);
      render();
    }));
  }
}

function wireSim() {
  $$("[data-ms-sim]").forEach(sel => sel.addEventListener("change", () => {
    state.simPicks[sel.getAttribute("data-ms-sim")] = Number(sel.value);
    const out = $("#ms-sim-out");
    if (out) out.innerHTML = MS_VIEWS.simOut(state.current.scoring.projectType, state.simPicks, state.current.scoring.total);
    wireSimReset();
    /* Yon tarafdagi "joriy / maksimal" ko'rsatkichini ham yangilaymiz. */
    const defs = MS_VIEWS.simDefs(state.current.scoring.projectType);
    const def = defs[sel.getAttribute("data-ms-sim")];
    const row = sel.closest(".ms-sim-row");
    const fig = row && row.querySelector(".ms-sim-fig");
    if (fig) {
      const cur = def.options[Number(sel.value)].score;
      const max = Math.max.apply(null, def.options.map(o => o.score));
      fig.textContent = MK.num(cur, 0) + " / " + MK.num(max, 0);
      row.classList.toggle("is-max", cur === max);
    }
  }));
  wireSimReset();
}
function wireSimReset() {
  const b = $("#ms-sim-reset");
  if (b) b.addEventListener("click", () => {
    state.simPicks = MS_VIEWS.simPicksFrom(state.current.scoring);
    render();
  });
}

/* ---------- ishga tushirish ---------- */
/* Til almashganda butun ko'rinish qayta chiziladi: ball emas, faqat
   matn o'zgaradi — dvigatel i18n kaliti qaytargani uchun qayta
   baholash kerak emas. */
chrome(() => render());

loadHome();
})();
