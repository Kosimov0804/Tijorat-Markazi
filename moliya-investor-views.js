/* ============================================================
   MOLIYA BOZORI — INVESTOR TOMONI: KO'RINISHLAR

   Uchta ekran: qabulxona (navbat), dossier (bitta loyiha) va qabul
   mezonlari (mahsulot sozlamalari). Fayl faqat HTML satr qaytaradi —
   hodisa biriktirmaydi, tarmoqqa chiqmaydi: bu chegara skoring
   modulida o'zini oqladi va shu yerda ham saqlanadi, chunki bitta
   qator markupi ro'yxatda ham, dossier sarlavhasida ham qayta
   ishlatiladi.

   Atomlar QAYTA IXTIRO QILINMAYDI: gauge, KPI plitkalari, blok
   kartochkasi, holat va tur nishonlari — hammasi MS_UI dan keladi.
   Tashabbuskor va institut bitta ballni ikki xil chizsa, ikkisi
   bitta raqam haqida bahslashayotgandek ko'rinardi.

   Kit PARAMETR sifatida beriladi (MK, MSCORE, MS_UI), global sifatida
   o'qilmaydi — fayl tartibidagi xato "undefined" emas, aniq xato
   bersin.
   ============================================================ */
const MS_INV_VIEWS = ((kit, core, ui) => {
  const { t, esc, escA, num, money, pctTxt, day } = kit;
  const REF = core.CONFIG.references;

  /* Navbatda ko'rinadigan holatlar. Ekspert rad etilganini ham
     ko'radi — bu uning o'z qarori tarixi; institut esa ko'rmaydi,
     chunki rad etilgan loyiha unga taklif emas. */
  const QUEUE_STATUSES  = ["submitted", "review", "approved"];
  const EXPERT_STATUSES = QUEUE_STATUSES.concat("rejected");
  const INTEREST_STATES = ["interested", "shortlist", "passed"];

  const statusList = isInst => (isInst ? QUEUE_STATUSES : EXPERT_STATUSES)
    .map(id => core.refItem(REF.projectStatuses, id)).filter(Boolean);

  /* ---------- kichik atomlar ---------- */

  /** Qiziqish chipi. "new" — yozuv YO'QLIGINING nomi, holat emas. */
  function interestChip(interest) {
    const st = interest && interest.state;
    if (!st) return `<span class="msi-int is-new">${esc(t("msi_int_new"))}</span>`;
    return `<span class="msi-int is-${escA(st)}">${esc(t("msi_int_" + st))}</span>`;
  }

  const statTile = (labelText, value, sub, tone) =>
    `<div class="ms-stat${tone ? " is-" + tone : ""}">
      <span>${esc(labelText)}</span><b class="num">${value}</b>
      ${sub ? `<i>${esc(sub)}</i>` : ""}</div>`;

  const opts = (list, chosen) => list.map(o =>
    `<option value="${escA(o.id)}"${chosen === o.id ? " selected" : ""}>${esc(ui.L(o))}</option>`).join("");

  /**
   * Kim sifatida ko'rayotganingiz. Ekspert va institut bitta sahifani
   * ochadi, lekin ularning huquqi boshqacha — sahifa buni yashirmasdan,
   * birinchi qatorda aytadi.
   */
  function actorStrip(state) {
    /* Mehmon — uchinchi holat. Unga ekspert yorlig'ini ham, institut
       yorlig'ini ham ko'rsatish yolg'on bo'lardi. */
    if (state.actorKind === "guest") {
      return `<div class="mk-id msi-actor is-guest">
        <b>${esc(t("msi_actor_guest"))}</b>
        <span>${esc(t("msi_actor_guest_sub"))}</span>
        <a class="ms-link is-primary" href="kirish.html">${esc(t("msi_actor_guest_cta"))} →</a></div>`;
    }
    if (!state.isInstitution) {
      return `<div class="mk-id msi-actor is-expert">
        <b>${esc(t("msi_actor_expert"))}</b>
        <span>${esc(t("msi_actor_expert_sub"))}</span></div>`;
    }
    const n = state.institutions || 0;
    return `<div class="mk-id msi-actor">
      <b>${esc(t("msi_actor_inst"))}${state.companyName ? " · " + esc(state.companyName) : ""}</b>
      <span>${esc(n ? t("msi_actor_registry").replace("{n}", num(n, 0)) : t("msi_actor_none"))}</span>
      <button type="button" class="ms-link is-primary" id="msi-go-settings">${esc(t("msi_nav_settings"))} →</button>
    </div>`;
  }

  /* =========================================================
     1 · QABULXONA
     ========================================================= */

  /**
   * Bo'sh ekran uchtaga bo'linadi va uchalasi BOSHQA jumla aytadi:
   * mezon yoqilmagan (sozlash kerak), mezon yoqilgan lekin navbat
   * bo'sh (kutish kerak), filtr hech narsa topmadi (filtrni yumshatish
   * kerak). Bitta "hech narsa yo'q" jumlasi uchalasini ham noto'g'ri
   * tasvirlardi.
   */
  function emptyState(state) {
    if (state.actorKind === "guest") {
      return `<div class="ms-empty msi-empty is-setup">
        <p><b>${esc(t("msi_empty_guest_title"))}</b></p>
        <p>${esc(t("msi_empty_guest_sub"))}</p>
        <a class="btn btn-primary" href="kirish.html">${esc(t("msi_actor_guest_cta"))}</a>
      </div>`;
    }
    if (state.isInstitution && !state.institutions) {
      return `<div class="ms-empty msi-empty is-setup">
        <p><b>${esc(t("msi_empty_setup_title"))}</b></p>
        <p>${esc(t("msi_empty_setup_sub"))}</p>
        <button type="button" class="btn btn-primary" id="msi-empty-settings">${esc(t("msi_empty_setup_cta"))}</button>
      </div>`;
    }
    if (!hasFilter(state)) {
      /* Institutga "sizga yo'naltirilmagan", ekspertga "navbat bo'sh" —
         ikkalasi bir xil ekran, ammo butunlay boshqa fakt. */
      const k = state.actorKind === "expert" ? "_exp" : "";
      return `<div class="ms-empty msi-empty is-wait">
        <p><b>${esc(t("msi_empty_wait_title" + k))}</b></p>
        <p>${esc(t("msi_empty_wait_sub" + k))}</p></div>`;
    }
    return `<div class="ms-empty msi-empty">
      <p><b>${esc(t("msi_empty_filter_title"))}</b></p>
      <p>${esc(t("msi_empty_filter_sub"))}</p>
      <button type="button" class="ms-link" id="msi-clear">${esc(t("ms_clear_filters"))}</button>
    </div>`;
  }

  const hasFilter = state => {
    const f = state.filter || {};
    return Object.keys(f).some(k => f[k] !== "" && f[k] != null);
  };

  function filterBar(state) {
    const f = state.filter || {};
    const inst = state.isInstitution;
    return `<div class="mk-filter">
      <input type="search" id="msi-q" value="${escA(f.q || "")}" autocomplete="off"
        placeholder="${escA(t("msi_search"))}" aria-label="${escA(t("msi_search"))}">
      <select id="msi-status" aria-label="${escA(t("ms_all_statuses"))}">
        <option value="">${esc(t("ms_all_statuses"))}</option>${opts(statusList(inst), f.status)}</select>
      <select id="msi-sektor" aria-label="${escA(t("ms_all_sectors"))}">
        <option value="">${esc(t("ms_all_sectors"))}</option>${opts(REF.sectors, f.sektor)}</select>
      <select id="msi-hudud" aria-label="${escA(t("msi_all_regions"))}">
        <option value="">${esc(t("msi_all_regions"))}</option>${opts(REF.regions, f.hudud)}</select>
      <select id="msi-turi" aria-label="${escA(t("ms_all_types"))}">
        <option value="">${esc(t("ms_all_types"))}</option>${opts(REF.projectTypes, f.loyihaTuri)}</select>
      ${inst ? `<select id="msi-interest" aria-label="${escA(t("msi_all_interest"))}">
        <option value="">${esc(t("msi_all_interest"))}</option>
        ${INTEREST_STATES.map(s => `<option value="${escA(s)}"${f.interest === s ? " selected" : ""}>${
          esc(t("msi_int_" + s))}</option>`).join("")}</select>` : ""}
      <input type="number" id="msi-minball" min="0" max="100" step="1" class="msi-num"
        value="${escA(f.minBall || "")}" placeholder="${escA(t("ms_min_score"))}"
        aria-label="${escA(t("ms_min_score"))}">
      <span class="mk-count">${esc(t("msi_count").replace("{n}", num((state.items || []).length, 0)))}</span>
    </div>`;
  }

  /**
   * Navbat qatori. Pasport bu yerda qisqargan — dossier to'lig'ini beradi.
   * HOLAT ustun emas, nomning ostidagi qatorda: qabulxona jadvalida
   * to'qqizta ustun bor edi va ikkita nishon ustuni ("yuborildi" va
   * "shartli tayyor") birgalikda 400px egallab, jadvalni kengligi
   * 1440px da ham sig'maydigan qilib qo'yardi. Holat esa loyihaning
   * KIMLIGIGA tegishli ma'lumot — tur nishoni bilan yonma-yon o'z
   * joyini topadi.
   */
  function inboxRow(p, isInst) {
    const pp = p.passport || {};
    const fake = { passport: pp };                       // ui.sectorName pasportdan o'qiydi
    return `<tr>
      <td>
        <a href="#" class="ms-rowname" data-msi-open="${escA(p.id)}">${esc(pp.nomi || t("ms_unnamed"))}</a>
        <div class="ms-rowsub">${ui.typeBadge(pp.loyihaTuri)}${ui.statusBadge(p.status)}
          <span>${esc(ui.sectorName(fake))} · ${esc(ui.regionName(fake))}</span></div>
        <div class="ms-rowsub"><span>${esc(t("msi_owner"))}: ${esc(p.ownerName || "—")}</span></div>
      </td>
      <td class="num">${money(pp.soralayotganSumma, pp.valyuta)}</td>
      <td class="num">${p.score == null ? "—" : `<b>${num(p.score, 0)}</b>`}</td>
      <td>${p.routingStatus ? ui.routingBadge(p.routingStatus)
        : `<span class="mk-note">${esc(t("ms_not_scored"))}</span>`}</td>
      ${isInst ? `<td class="num">${esc(t("msi_matched_n").replace("{n}", num(p.matchedProducts || 0, 0)))}</td>
      <td>${interestChip(p.interest)}</td>` : ""}
      <td class="num">${esc(day(p.submitted))}</td>
      <td class="ms-rowact">
        <button type="button" class="ms-link is-primary" data-msi-open="${escA(p.id)}">${esc(t("msi_open"))}</button>
      </td></tr>`;
  }

  function inbox(state) {
    const st = state.stats || {};
    const inst = state.isInstitution;
    const tiles = [
      statTile(t("msi_stat_total"), num(st.total || 0, 0), t("msi_stat_total_sub")),
      statTile(t("msi_stat_fresh"), num(st.fresh || 0, 0), t("msi_stat_fresh_sub"), st.fresh ? "good" : null),
      statTile(t("msi_stat_shortlist"), num(st.shortlist || 0, 0), t("msi_stat_shortlist_sub")),
      statTile(t("msi_stat_avg"), st.avgScore == null ? "—" : num(st.avgScore, 1), t("msi_stat_avg_sub")),
    ].join("");

    const rows = (state.items || []).map(p => inboxRow(p, inst)).join("");

    return `
    ${actorStrip(state)}
    <div class="ms-head">
      <div><h2>${esc(t(inst ? "msi_title" : "msi_title_expert"))}</h2>
        <p class="mk-sub">${esc(t(inst ? "msi_sub" : "msi_sub_expert"))}</p></div>
      <div class="mk-actions">
        ${inst ? `<button type="button" class="btn btn-ghost" id="msi-settings">${esc(t("msi_nav_settings"))}</button>` : ""}
        ${state.actorKind === "expert"
          ? `<button type="button" class="btn btn-ghost" id="msi-csv">${esc(t("ms_csv"))}</button>` : ""}
      </div>
    </div>
    <div class="ms-stats">${tiles}</div>
    ${filterBar(state)}
    ${rows ? `<div class="mk-tablewrap"><table class="mk-table msi-queue"><thead><tr>
      <th>${esc(t("ms_col_project"))}</th>
      <th class="num">${esc(t("ms_col_amount"))}</th>
      <th class="num">${esc(t("ms_col_score"))}</th>
      <th>${esc(t("ms_col_routing"))}</th>
      ${inst ? `<th class="num">${esc(t("msi_col_matched"))}</th><th>${esc(t("msi_col_interest"))}</th>` : ""}
      <th class="num">${esc(t("msi_col_submitted"))}</th>
      <th></th>
    </tr></thead><tbody>${rows}</tbody></table></div>` : emptyState(state)}`;
  }

  /* =========================================================
     2 · DOSSIER
     ========================================================= */

  /**
   * Qiziqish paneli. Uchta qaror tugmasi va IZOH. Izohning yashirinligi
   * bu yerda bezak emas, shartnoma: server uni loyiha egasiga hech
   * qachon bermaydi, shuning uchun panel ham buni jimgina emas,
   * ochiq aytadi — aks holda institut izohni "xat" deb o'ylab yozardi.
   */
  /**
   * Ekspertning paneli. Institut QIZIQISH bildiradi, ekspert esa
   * platformaning RASMIY holatini suradi — ikkisi boshqa narsa va
   * shuning uchun bitta panelda emas. Ruxsat etilgan o'tishlar
   * serverdagi TRANSITIONS bilan bir xil: yuborildi -> ko'rib
   * chiqilmoqda -> tasdiqlandi yoki rad etildi. Boshqa holatda
   * tugma umuman chizilmaydi, chunki server ularni baribir
   * bad_transition bilan qaytaradi.
   */
  function expertPanel(state) {
    const p = (state.current || {}).project || {};
    const btn = (id, labelText, cls) =>
      '<button type="button" class="btn ' + cls + '" id="' + id + '">' + esc(labelText) + "</button>";
    let acts = "";
    if (p.status === "submitted") acts = btn("msi-st-review", t("ms_act_review"), "btn-primary");
    else if (p.status === "review")
      acts = btn("msi-st-approve", t("ms_act_approve"), "btn-primary")
           + btn("msi-st-reject", t("ms_act_reject"), "btn-ghost");

    return `<div class="mk-card msi-panel">
      <div class="ms-sec"><h3>${esc(t("msi_exp_title"))}</h3>
        <p>${esc(t("msi_exp_sub"))}</p></div>
      <p class="mk-note">${esc(t("msi_exp_current"))} ${ui.statusBadge(p.status)}</p>
      ${acts
        ? `<label class="mk-f"><span>${esc(t("msi_exp_note"))}</span>
             <textarea class="ms-in" id="msi-st-note" rows="3"></textarea></label>
           <div class="mk-actions">${acts}</div>`
        : `<p class="mk-note">${esc(t("msi_exp_final"))}</p>`}
      <p class="mk-msg is-ok" id="msi-st-msg" hidden></p>
    </div>`;
  }

  function interestPanel(state) {
    const cur = state.current || {};
    const draft = state.draftInterest || {};
    const saved = cur.interest || null;
    const picked = draft.state || (saved && saved.state) || "";
    const note = draft.note != null ? draft.note : (saved && saved.note) || "";

    const btn = s => `<button type="button" class="msi-choice is-${escA(s)}${picked === s ? " is-on" : ""}"
      data-msi-state="${escA(s)}" aria-pressed="${picked === s ? "true" : "false"}">${esc(t("msi_int_" + s))}</button>`;

    return `<div class="mk-card msi-panel">
      <div class="ms-sec"><h3>${esc(t("msi_int_title"))}</h3><p>${esc(t("msi_int_sub"))}</p></div>
      <div class="msi-current">
        <span>${esc(t("msi_int_current"))}</span>
        ${interestChip(saved)}
        ${saved ? `<i>${esc(t("msi_int_updated").replace("{d}", day(saved.updated)))}</i>`
          : `<i>${esc(t("msi_int_none"))}</i>`}
      </div>
      <div class="msi-choices" role="group" aria-label="${escA(t("msi_int_title"))}">
        ${INTEREST_STATES.map(btn).join("")}
      </div>
      <div class="msi-seal">
        <b>${esc(t("msi_int_private"))}</b>
        <p>${esc(t("msi_int_private_sub"))}</p>
      </div>
      <div class="mk-f msi-note">
        <label for="msi-note">${esc(t("msi_int_note"))}</label>
        <textarea id="msi-note" maxlength="1000" placeholder="${escA(t("msi_int_note_ph"))}">${esc(note)}</textarea>
      </div>
      <div class="mk-actions">
        <button type="button" class="btn btn-primary" id="msi-save-interest">${esc(t("msi_int_save"))}</button>
      </div>
      <p class="mk-msg is-ok" id="msi-int-msg" hidden></p>
    </div>`;
  }

  /* Dossier moliyaviy tarix va model uchun joy qoldiradi, lekin loyiha
     ularni to'ldirmagan bo'lishi mumkin (masalan startap yo'lida model
     ixtiyoriy). Bo'sh bo'lsa institut "yuklanmadimi?" deb o'ylamasligi
     kerak — yo'qligi ochiq aytiladi.

     Nomlar do'kondagidek: startupInfo / financialHistory /
     financialModel. Ilgari bu yerda qisqartirilgan nomlar ham
     tekshirilardi, chunki server o'shanday uzatardi deb o'ylangan edi;
     aslida u serverdagi nuqson edi va u tuzatildi. */
  const hasDetail = p => !!(p.financialModel
    || (p.financialHistory || []).length
    || p.startupInfo);

  /** Pasportning ko'rsatiladigan qismi — dossier faqat O'QISH uchun. */
  function passportCard(p) {
    const pp = p.passport || {};
    /* Sehrgar yorliqlari majburiylik yulduzchasini olib yuradi; dossier
       o'qish uchun, bu yerda to'ldiriladigan maydon yo'q. */
    const kv = (labelText, value) => `<dt>${esc(String(labelText).replace(" *", ""))}</dt><dd>${value}</dd>`;
    const docs = p.documents || [];
    return `<div class="mk-card">
      <div class="ms-sec"><h3>${esc(t("msi_passport"))}</h3></div>
      <dl class="mk-kv">
        ${kv(t("ms_f_sector"), esc(ui.sectorName(p)))}
        ${kv(t("ms_f_region"), esc(ui.regionName(p)))}
        ${kv(t("ms_f_total_value"), money(pp.umumiyQiymat, pp.valyuta))}
        ${kv(t("ms_f_amount"), money(pp.soralayotganSumma, pp.valyuta))}
        ${kv(t("ms_f_term"), num(pp.muddat, 0) + " " + esc(t("ms_unit_years")))}
        ${kv(t("ms_f_fin_type"), esc(ui.refName(REF.financingTypes, pp.moliyalashtirishTuri)))}
        ${kv(t("ms_f_owner_share"), pp.tashabbuskorUlushi == null ? "—" : pctTxt(pp.tashabbuskorUlushi))}
        ${kv(t("msi_owner"), esc(p.ownerName || "—"))}
      </dl>
      <div class="ms-sec msi-sub-sec"><h3>${esc(t("msi_docs"))}</h3></div>
      ${docs.length
        ? `<ul class="msi-docs">${docs.map(d =>
            `<li><span>${esc(d.name || "—")}</span><i class="num">${num((d.size || 0) / 1024, 0)} KB</i></li>`).join("")}</ul>`
        : `<p class="mk-note">${esc(t("msi_docs_none"))}</p>`}
      ${hasDetail(p) ? "" : `<p class="mk-note">${esc(t("msi_detail_missing"))}</p>`}
    </div>`;
  }

  function dossier(state) {
    const cur = state.current || {};
    const p = cur.project || {};
    const pp = p.passport || {};
    const s = p.scoring || null;
    const inst = state.isInstitution;

    const kpiPanel = s
      ? `<h3>${esc(pp.loyihaTuri === "startup" ? t("ms_res_forecast") : t("ms_res_kpi_title"))}</h3>
         ${ui.kpiTiles(p, s.kpis)}`
      : `<p class="mk-note">${esc(t("ms_not_scored"))}</p>`;

    return `
    <div class="ms-head">
      <div>
        <div class="ms-title-row"><h2>${esc(pp.nomi || t("ms_unnamed"))}</h2>
          ${ui.typeBadge(pp.loyihaTuri)}${ui.statusBadge(p.status)}</div>
        <p class="mk-sub">${esc(ui.sectorName(p))} · ${esc(ui.regionName(p))} ·
          <b class="num">${money(pp.soralayotganSumma, pp.valyuta)}</b> ·
          ${esc(t("msi_submitted_on").replace("{d}", day(p.submitted)))}</p>
      </div>
      <div class="mk-actions">
        <button type="button" class="btn btn-ghost" id="msi-back">${esc(t("msi_back"))}</button>
      </div>
    </div>

    ${inst && cur.matchedProducts != null
      ? `<p class="mk-note msi-why">${esc(t("msi_matched_title"))} — ${
          esc(t("msi_matched_sub").replace("{n}", num(cur.matchedProducts, 0)))}</p>` : ""}
    ${s ? ui.knockoutPanel(s) : ""}

    <div class="ms-split">
      <div class="mk-card ms-score">
        ${s ? ui.gauge(s.total, s.routingStatus) : `<p class="mk-note">${esc(t("ms_not_scored"))}</p>`}
      </div>
      <div class="mk-card">${kpiPanel}</div>
    </div>

    ${s ? `<div class="mk-card">
      <div class="ms-sec">
        <h3>${esc(s.projectType === "startup" ? t("ms_res_breakdown_st") : t("ms_res_breakdown"))}</h3>
        <p>${esc(t("ms_res_breakdown_sub"))}</p></div>
      <div class="ms-blocks">${core.orderedBlocks(s).map(e => ui.blockCard(e[1])).join("")}</div>
    </div>` : ""}

    <div class="ms-split msi-split">
      ${passportCard(p)}
      ${inst ? interestPanel(state) : expertPanel(state)}
    </div>`;
  }

  /* =========================================================
     3 · QABUL MEZONLARI
     ========================================================= */

  /**
   * Nega mahsulot reyestrga tushmaydi — taxmin qildirilmaydi. Ikkala
   * sabab bir vaqtda ham bo'lishi mumkin, shuning uchun ro'yxat, bitta
   * jumla emas.
   */
  function whyIneligible(row) {
    const why = [];
    if (row.status !== "live")
      why.push(t("msi_set_why_status").replace("{s}", t("msi_prod_" + row.status, row.status)));
    if (REF.currencies.indexOf(row.currency) === -1)
      why.push(t("msi_set_why_currency").replace("{c}", row.currency || "—"));
    return why;
  }

  function productRow(row) {
    const on = row.routable === true;
    const dead = !row.eligible;
    const why = dead ? whyIneligible(row) : [];
    /* Mahsulot katalogining sektor ro'yxati skoring metodikasinikidan
       KENGROQ bo'lishi mumkin. Tanilmagan id tashlab yuborilsa, qator
       "sektor cheklovi yo'q" bo'lib o'qilardi — aslida u bor, faqat
       nomi tarjima qilinmagan. Shuning uchun id o'zi ko'rsatiladi. */
    const sectors = (row.sectors || []).length
      ? (row.sectors || []).map(id => ui.refName(REF.sectors, id) || id).join(", ")
      : t("msi_set_sectors_all");

    return `<article class="msi-prod${on && !dead ? " is-on" : ""}${dead ? " is-dead" : ""}">
      <div class="msi-prod-top">
        <div>
          <h4>${esc(row.name || "—")}</h4>
          <span class="msi-prod-meta">${esc(t("ml_cat_" + row.category, row.category || ""))} ·
            ${esc(row.currency || "—")}</span>
        </div>
        <span class="ms-status is-${escA(row.status === "live" ? "approved" : "draft")}">${
          esc(t("msi_prod_" + row.status, row.status || ""))}</span>
      </div>

      <dl class="mk-kv">
        <dt>${esc(t("msi_set_limits"))}</dt>
        <dd>${money(row.minAmount, "")} – ${money(row.maxAmount, row.currency)}</dd>
        <dt>${esc(t("msi_set_tenor"))}</dt>
        <dd>${num(row.tenorMax, 0)} ${esc(t("ms_unit_years"))}</dd>
        <dt>${esc(t("msi_set_sectors"))}</dt>
        <dd>${esc(sectors)}</dd>
      </dl>

      <div class="msi-prod-ctl">
        <label class="msi-toggle${dead ? " is-off" : ""}">
          <input type="checkbox" data-msi-routable="${escA(row.id)}"${on ? " checked" : ""}${dead ? " disabled" : ""}>
          <i aria-hidden="true"></i>
          <span>${esc(t("msi_set_routable"))}</span>
        </label>
        <div class="mk-f msi-minscore">
          <label for="msi-min-${escA(row.id)}">${esc(t("msi_set_minscore"))}</label>
          <input type="number" id="msi-min-${escA(row.id)}" data-msi-minscore="${escA(row.id)}"
            min="0" max="100" step="1" value="${escA(row.minScore == null ? 0 : row.minScore)}"${dead ? " disabled" : ""}>
        </div>
        <button type="button" class="btn btn-primary" data-msi-save="${escA(row.id)}"${dead ? " disabled" : ""}>${
          esc(t("msi_set_save"))}</button>
      </div>

      ${dead
        ? `<p class="mk-note msi-why is-bad"><b>${esc(t("msi_set_not_eligible"))}</b>
             ${why.map(w => `<span>${esc(w)}</span>`).join("")}</p>`
        : `<p class="mk-note msi-why"><b>${esc(t("msi_set_eligible"))}</b>
             <span>${esc(t("msi_set_routable_hint"))}</span>
             <span>${esc(t("msi_set_minscore_hint"))}</span></p>`}
      <p class="mk-msg is-ok" data-msi-msg="${escA(row.id)}" hidden></p>
    </article>`;
  }

  function settings(state) {
    const rows = state.products || [];
    return `
    ${actorStrip(state)}
    <div class="ms-head">
      <div><h2>${esc(t("msi_set_title"))}</h2><p class="mk-sub">${esc(t("msi_set_sub"))}</p></div>
      <div class="mk-actions">
        <span class="mk-count">${esc(t("msi_set_registry")
          .replace("{n}", num(state.prodInstitutions || 0, 0)))}</span>
        <button type="button" class="btn btn-ghost" id="msi-back">${esc(t("msi_back"))}</button>
      </div>
    </div>
    ${rows.length
      ? `<div class="msi-prods">${rows.map(productRow).join("")}</div>`
      : `<div class="ms-empty msi-empty is-setup">
           <p><b>${esc(t("msi_set_empty_title"))}</b></p>
           <p>${esc(t("msi_set_empty_sub"))}</p>
           <a class="btn btn-primary" href="company.html">${esc(t("msi_set_empty_cta"))}</a>
         </div>`}`;
  }

  /** Ekspert uchun mezon sahifasi yopiq — bu institutning mulki. */
  const settingsLocked = () => `<div class="ms-empty msi-empty">
    <p><b>${esc(t("msi_set_expert_title"))}</b></p>
    <p>${esc(t("msi_actor_expert_sub"))}</p>
    <button type="button" class="ms-link is-primary" id="msi-back">${esc(t("msi_back"))}</button>
  </div>`;

  /** Shaxsi aniqlanmagan mehmon — xato emas, holat. */
  const needIdentity = () => `<div class="mk-card ms-empty msi-empty">
    <p><b>${esc(t("msi_login_title"))}</b></p>
    <p>${esc(t("msi_login_sub"))}</p>
    <a class="btn btn-primary" href="kirish.html">${esc(t("msi_login_cta"))}</a>
  </div>`;

  return { inbox, dossier, settings, settingsLocked, needIdentity,
    interestChip, actorStrip, statusList, INTEREST_STATES };
})(MK, MSCORE, MS_UI);
