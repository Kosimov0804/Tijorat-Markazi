/* ============================================================
   MOLIYA BOZORI — loyiha skoringi: KATTA KO'RINISHLAR

   Ro'yxat (dashboard), natija sahifasi, ballni oshirish simulyatori,
   metodika jadvali va chop etiladigan investitsiya taklifi (teaser).
   Atomlar moliya-scoring-ui.js da, forma moliya-scoring-wizard.js da.

   Bu fayl ham faqat HTML satr qaytaradi — hodisa biriktirmaydi va
   tarmoqqa chiqmaydi. Sabab oddiy: teaser chop etish uchun, natija
   sahifasi ekran uchun va metodika ikkalasi uchun ham bir xil
   CONFIG'dan o'qishi kerak. Agar markup hodisa bilan aralashsa,
   chop etish varianti darhol ikkinchi nusxaga aylanadi va ikkisi
   vaqt o'tib bir-biridan uzoqlashadi.

   Simulyator pog'onalari CONFIG'dan HOSILA qilinadi, qo'lda
   ko'chirilmaydi: vazn o'zgarsa simulyator ham, metodika jadvali ham
   o'zi yangilanadi. Havola modulida bu ro'yxat qo'lda takrorlangan
   edi va vazn o'zgartirilsa ikki joyda ayri bo'lib qolardi.
   ============================================================ */
const MS_VIEWS = ((kit, core, ui) => {
  const { t, esc, escA, num, money, pctTxt, day } = kit;
  const CFG = core.CONFIG;
  const REF = CFG.references;
  const S = CFG.scoring;
  const SS = CFG.startupScoring;

  /* =========================================================
     RO'YXAT (dashboard)
     ========================================================= */
  function statTile(labelText, value, sub, tone) {
    return `<div class="ms-stat${tone ? " is-" + tone : ""}">
      <span>${esc(labelText)}</span><b class="num">${value}</b>
      ${sub ? `<i>${esc(sub)}</i>` : ""}</div>`;
  }

  function dashboard(state) {
    const st = state.stats || {};
    const tiles = [
      statTile(t("ms_stat_total"), num(st.total || 0, 0), t("ms_stat_total_sub").replace("{n}", num(st.scored || 0, 0))),
      statTile(t("ms_stat_avg"), st.avgScore == null ? "—" : num(st.avgScore, 1), t("ms_stat_avg_sub")),
      statTile(t("ms_stat_ready"), num(st.ready || 0, 0), t("ms_stat_ready_sub"), "good"),
      statTile(t("ms_stat_blocked"), num(st.blocked || 0, 0), t("ms_stat_blocked_sub"), st.blocked ? "bad" : null),
    ].join("");

    const arrow = k => (state.sortKey === k ? `<i class="ms-sort">${state.sortDir === "asc" ? "↑" : "↓"}</i>` : "");
    const th = (k, labelText, cls) =>
      `<th class="${cls || ""}" data-ms-sort="${escA(k)}">${esc(labelText)}${arrow(k)}</th>`;

    const rows = (state.view || []).map(p => {
      const sc = p.score;
      return `<tr>
        <td>
          <a href="#" data-ms-open="${escA(p.id)}" class="ms-rowname">${esc(p.passport.nomi || t("ms_unnamed"))}</a>
          <div class="ms-rowsub">${ui.typeBadge(p.passport.loyihaTuri)}
            <span>${esc(ui.sectorName(p))} · ${esc(ui.regionName(p))}</span></div>
        </td>
        <td class="num">${money(p.passport.soralayotganSumma, p.passport.valyuta)}</td>
        <td class="num">${sc ? `<b class="${sc.isKnockout ? "is-bad" : ""}">${num(sc.total, 0)}</b>` : "—"}</td>
        <td>${ui.statusBadge(p.status)}</td>
        <td>${sc ? ui.routingBadge(sc.routingStatus) : `<span class="mk-note">${esc(t("ms_not_scored"))}</span>`}</td>
        <td class="num">${esc(day(p.updated))}</td>
        <td class="ms-rowact">
          <button type="button" class="ms-link" data-ms-edit="${escA(p.id)}">${esc(t("ms_edit"))}</button>
          <button type="button" class="ms-link is-primary" data-ms-open="${escA(p.id)}">${esc(t("ms_result"))}</button>
        </td></tr>`;
    }).join("");

    const empty = (state.items || []).length === 0
      ? `<div class="ms-empty"><p><b>${esc(t("ms_empty_title"))}</b></p>
           <p>${esc(t("ms_empty_sub"))}</p>
           <button type="button" class="btn btn-primary" id="ms-new-2">${esc(t("ms_empty_cta"))}</button></div>`
      : `<div class="ms-empty"><p>${esc(t("ms_no_results"))}</p></div>`;

    return `
    <div class="ms-head">
      <div><h2>${esc(state.track ? t("ms_title_" + state.track) : t("ms_title"))}</h2><p class="mk-sub">${esc(state.track ? t("ms_sub_" + state.track) : t("ms_sub"))}</p></div>
      <div class="mk-actions">
        <button type="button" class="btn btn-primary" id="ms-new">${esc(t("ms_new"))}</button>
        <button type="button" class="btn btn-ghost" id="ms-methodology">${esc(t("ms_nav_methodology"))}</button>
        ${/* CSV eksport — ekspert ishi, investor sahifasida. */ ""}
      </div>
    </div>
    <div class="ms-stats">${tiles}</div>
    <div class="mk-filter">
      <input type="search" id="ms-q" value="${escA(state.q || "")}" placeholder="${escA(t("ms_search"))}" autocomplete="off">
      ${state.track ? "" : `<select id="ms-f-type"><option value="">${esc(t("ms_all_types"))}</option>
        ${REF.projectTypes.map(o => `<option value="${escA(o.id)}"${state.tur === o.id ? " selected" : ""}>${esc(ui.L(o))}</option>`).join("")}
      </select>`}
      <select id="ms-f-status"><option value="">${esc(t("ms_all_statuses"))}</option>
        ${REF.projectStatuses.map(o => `<option value="${escA(o.id)}"${state.status === o.id ? " selected" : ""}>${esc(ui.L(o))}</option>`).join("")}
      </select>
      <span class="mk-count">${esc(t("ms_showing")
          .replace("{n}", num((state.view || []).length, 0))
          .replace("{total}", num((state.items || []).length, 0)))}</span>
    </div>
    <div class="mk-tablewrap"><table class="mk-table"><thead><tr>
      ${th("nomi", t("ms_col_project"))}
      ${th("summa", t("ms_col_amount"), "num")}
      ${th("ball", t("ms_col_score"), "num")}
      ${th("status", t("ms_col_status"))}
      <th>${esc(t("ms_col_routing"))}</th>
      ${th("updated", t("ms_col_updated"), "num")}
      <th></th>
    </tr></thead><tbody>${rows}</tbody></table></div>
    ${rows ? "" : empty}`;
  }

  /* =========================================================
     SIMULYATOR — pog'onalar CONFIG'dan hosila
     ========================================================= */
  const tier = (labelKey, score) => ({ labelKey, score });

  const SIM_COMPANY = {
    teo: { labelKey: "ms_sim_teo", options: [
      tier("ms_tier_teo_big5", S.teo.big5), tier("ms_tier_teo_recognized", S.teo.recognized),
      tier("ms_teo_internal", S.teo.internal), tier("ms_none", S.teo.none)] },
    audit: { labelKey: "ms_sim_audit", options: [
      tier("ms_tier_audit_b5", S.audit.threeYearCleanBig5), tier("ms_tier_audit_other", S.audit.threeYearCleanOther),
      tier("ms_tier_audit_12", S.audit.oneToTwoYear), tier("ms_tier_audit_signed", S.audit.contractSignedInProgress),
      tier("ms_none", S.audit.none)] },
    continuity: { labelKey: "ms_sim_continuity", options: [
      tier("ms_tier_cont_33", S.continuity.threeYearsThreeProfitable),
      tier("ms_tier_cont_32", S.continuity.threeYearsTwoProfitable),
      tier("ms_tier_cont_1", S.continuity.oneYearProfitable), tier("ms_tier_cont_none", S.continuity.greenfield)] },
    netProfit: { labelKey: "ms_sim_net_profit", options: [
      tier("ms_tier_np_3", S.netProfit.threeYears), tier("ms_tier_np_2", S.netProfit.twoYears),
      tier("ms_tier_np_1", S.netProfit.oneYear), tier("ms_none", S.netProfit.none)] },
    dueDiligence: { labelKey: "ms_sim_dd", options: [
      tier("ms_tier_dd_all", S.dueDiligence.allSixBig5), tier("ms_tier_dd_35", S.dueDiligence.threeToFive),
      tier("ms_tier_dd_legal", S.dueDiligence.onlyConsultingLegal),
      tier("ms_tier_dd_planned", S.dueDiligence.plannedApproved), tier("ms_none", S.dueDiligence.none)] },
    irr: { labelKey: "ms_sim_irr", options: [
      tier("ms_tier_irr_p8", S.irr.hurdlePlus8pp), tier("ms_tier_irr_p4", S.irr.hurdlePlus4pp),
      tier("ms_tier_irr_at", S.irr.atHurdle), tier("ms_tier_irr_below2", S.irr.belowUpTo2pp),
      tier("ms_tier_irr_below_more", S.irr.belowMore)] },
    debtEbitda: { labelKey: "ms_sim_debt_ebitda", raw: ["≤ 1,5", "≤ 2,5", "≤ 3,0", "> 3,0"], options: [
      tier(null, S.debtBurden.debtEbitda.le1_5), tier(null, S.debtBurden.debtEbitda.le2_5),
      tier(null, S.debtBurden.debtEbitda.le3_0), tier(null, S.debtBurden.debtEbitda.above3_0)] },
    dscr: { labelKey: "ms_sim_dscr", raw: ["≥ 1,8", "≥ 1,5", "≥ 1,2", "< 1,2"], options: [
      tier(null, S.debtBurden.dscr.ge1_8), tier(null, S.debtBurden.dscr.ge1_5),
      tier(null, S.debtBurden.dscr.ge1_2), tier(null, S.debtBurden.dscr.below1_2)] },
    exit: { labelKey: "ms_sim_exit", options: [
      tier("ms_tier_exit_full", S.exit.fullContractFormulaTerm),
      tier("ms_tier_exit_general", S.exit.generalDescriptionNoFormula),
      tier("ms_tier_exit_intent", S.exit.intentOnly), tier("ms_none", S.exit.none)] },
  };
  /* Qaysi pog'ona to'xtatuvchi mezonni yoqadi — indeks bo'yicha. */
  const SIM_KNOCKOUT = { irr: [3, 4], debtEbitda: [3], dscr: [3], netProfit: [3], exit: [3] };

  const fromRef = (list, table, labelKey) =>
    ({ labelKey, ref: list, options: list.map(o => ({ refId: o.id, score: table[o.id] })) });

  const SIM_STARTUP = {
    team: fromRef(REF.teamExperience, SS.team, "ms_sim_team"),
    product: fromRef(REF.productStage, SS.product, "ms_sim_product"),
    market: fromRef(REF.marketValidation, SS.market, "ms_sim_market"),
    funding: fromRef(REF.fundingHistory, SS.funding, "ms_sim_funding"),
    finModel: fromRef(REF.startupFinModelQuality, SS.finModel, "ms_sim_fin_model"),
    potential: fromRef(REF.potentialTiers, SS.potential, "ms_sim_potential"),
    legal: fromRef(REF.legalIpStatus, SS.legal, "ms_sim_legal"),
    exit: fromRef(REF.nextStageExit, SS.exit, "ms_sim_next_exit"),
  };

  const simDefs = type => (type === "startup" ? SIM_STARTUP : SIM_COMPANY);

  function optionLabel(def, i) {
    const o = def.options[i];
    if (def.raw) return def.raw[i];
    if (o.refId) return ui.L(core.refItem(def.ref, o.refId));
    return t(o.labelKey);
  }

  /** Simulyator holatidan ball — dvigatelni takrorlamaydi, pog'ona ballarini qo'shadi. */
  function simTotal(type, picks) {
    const defs = simDefs(type);
    let raw = 0, knockout = false;
    Object.keys(defs).forEach(k => {
      raw += defs[k].options[picks[k]].score;
      if (type !== "startup" && (SIM_KNOCKOUT[k] || []).indexOf(picks[k]) !== -1) knockout = true;
    });
    const total = knockout ? Math.min(raw, CFG.knockout.capScore) : raw;
    return { raw, total, knockout, tier: core.routingTierFor(total) };
  }

  function simulator(type, picks, baseTotal) {
    const defs = simDefs(type);
    const controls = Object.keys(defs).map(k => {
      const def = defs[k];
      const max = Math.max.apply(null, def.options.map(o => o.score));
      const cur = def.options[picks[k]].score;
      return `<div class="ms-sim-row${cur === max ? " is-max" : ""}">
        <label for="ms-sim-${escA(k)}">${esc(t(def.labelKey))}</label>
        <span class="ms-sim-fig">${num(cur, 0)} / ${num(max, 0)}</span>
        <select id="ms-sim-${escA(k)}" data-ms-sim="${escA(k)}">
          ${def.options.map((o, i) => `<option value="${i}"${i === picks[k] ? " selected" : ""}>${
            esc(optionLabel(def, i))} — ${num(o.score, 0)} ${esc(t("ms_sim_points"))}</option>`).join("")}
        </select></div>`;
    }).join("");
    return `<div class="ms-sim">
      <div class="ms-sim-list">${controls}</div>
      <div class="ms-sim-side" id="ms-sim-out">${simOut(type, picks, baseTotal)}</div>
    </div>`;
  }

  function simOut(type, picks, baseTotal) {
    const r = simTotal(type, picks);
    const delta = baseTotal == null ? null : r.total - baseTotal;
    const status = r.knockout ? { status: "knockout", uz: t("ms_res_ko_title"),
      ru: t("ms_res_ko_title"), en: t("ms_res_ko_title") } : r.tier;
    return ui.gauge(r.total, status)
      + (delta ? `<div class="ms-sim-delta ${delta > 0 ? "is-up" : "is-down"}">
           ${delta > 0 ? "+" : ""}${num(delta, 0)} <span>${esc(t("ms_res_sim_delta"))}</span></div>` : "")
      + `<button type="button" class="ms-link" id="ms-sim-reset">${esc(t("ms_res_sim_reset"))}</button>`;
  }

  /** Loyihaning joriy holatidan simulyator boshlang'ich tanlovlari. */
  function simPicksFrom(scoring) {
    const type = scoring.projectType;
    const defs = simDefs(type);
    const picks = {};
    Object.keys(defs).forEach(k => {
      const b = scoring.breakdown;
      const got = k === "debtEbitda" ? (b.debtBurden.sub.debtEbitda.score)
        : k === "dscr" ? (b.debtBurden.sub.dscr.score)
        : (b[k] ? b[k].score : 0);
      let idx = defs[k].options.findIndex(o => o.score === got);
      picks[k] = idx < 0 ? defs[k].options.length - 1 : idx;
    });
    return picks;
  }

  /* =========================================================
     NATIJA SAHIFASI
     ========================================================= */
  function results(data, role, picks) {
    const p = data.project, s = data.scoring;
    const isStartup = s.projectType === "startup";
    const gaps = data.suggestions || [];
    const gain = gaps.reduce((a, g) => a + g.gap, 0);

    const gapsHtml = gaps.length
      ? `<ul class="ms-gaps">${gaps.map(g => `<li><b class="num">+${num(g.gap, 0)}</b><span>${esc(t(g.key))}</span></li>`).join("")}</ul>`
      : `<p class="ms-allmax">${esc(t("ms_res_all_max"))}</p>`;

    const matched = (data.matches || []).filter(m => m.fullMatch);

    /* Institutlarning javobi. Yo'naltirish bir tomonlama signal bo'lib
       qolmasligi kerak: ega o'z loyihasini kim ko'rib, kim belgilab
       qo'yganini bilishi shart. IZOH ATAYLAB YO'Q — u institutning
       ichki bahosi va serverda ham berilmaydi (interestOf). */
    const interest = data.interest || [];
    const interestHtml = interest.length
      ? `<ul class="ms-gaps">${interest.map(i => `<li><b>${esc(t("ms_int_" + i.state, i.state))}</b><span>${esc(i.providerName)}</span></li>`).join("")}</ul>`
      : `<p class="mk-note">${esc(t("ms_int_none"))}</p>`;
    const routing = data.unlocked
      ? `<div class="mk-grid">${(data.matches || []).filter(m => m.matchPercent >= 60).slice(0, 9)
            .map(ui.institutionCard).join("") || `<p class="mk-note">${esc(t("ms_res_no_match"))}</p>`}</div>`
      : `<div class="ms-locked"><p>${esc(t("ms_res_routing_locked"))}</p>
           <p class="mk-note">${esc(t("ms_res_current_score"))}: <b class="num">${num(s.total, 0)}</b>${
             s.isKnockout ? esc(t("ms_res_has_knockout")) : ""}</p></div>`;

    const kpiPanel = isStartup
      ? `<h3>${esc(t("ms_res_forecast"))}</h3><p class="mk-sub">${esc(t("ms_res_forecast_sub"))}</p>
         ${ui.kpiTiles(p, s.kpis)}`
      : `<h3>${esc(t("ms_res_kpi_title"))}</h3>
         <p class="mk-sub">${esc(t("ms_res_kpi_sub").replace("{hurdle}", pctTxt(s.kpis.hurdle)))}</p>
         ${ui.kpiTiles(p, s.kpis)}
         ${dscrTable(s.kpis.dscrSeries)}`;

    return `
    <div class="ms-head">
      <div>
        <div class="ms-title-row"><h2>${esc(p.passport.nomi)}</h2>
          ${ui.typeBadge(p.passport.loyihaTuri)}${ui.statusBadge(p.status)}</div>
        <p class="mk-sub">${esc(ui.sectorName(p))} · ${esc(ui.regionName(p))} ·
          ${esc(t("ms_f_tin").replace(" *", ""))} ${esc(p.passport.stir)} ·
          <b class="num">${money(p.passport.soralayotganSumma, p.passport.valyuta)}</b></p>
      </div>
      <div class="mk-actions">
        <button type="button" class="btn btn-ghost" id="ms-back">${esc(t("ms_back_list"))}</button>
        <button type="button" class="btn btn-ghost" id="ms-teaser">${esc(t("ms_res_teaser"))}</button>
        <button type="button" class="btn btn-ghost" id="ms-edit">${esc(t("ms_edit"))}</button>
        ${actionButtons(p, role, data.unlocked)}
      </div>
    </div>
    ${isStartup ? `<p class="ms-banner is-startup">${t("ms_res_startup_banner")}</p>` : ""}
    ${ui.knockoutPanel(s)}

    <div class="ms-split">
      <div class="mk-card ms-score">
        ${ui.gauge(s.total, s.routingStatus)}
        ${s.isKnockout
          ? `<p class="mk-note">${t("ms_res_raw_capped")
              .split("{raw}").join(num(s.rawTotal, 0))
              .split("{cap}").join(num(CFG.knockout.capScore, 0))}</p>`
          : `<p class="mk-note">${esc(t("ms_res_scored_on").replace("{d}", day(p.updated)))}</p>`}
      </div>
      <div class="mk-card">${kpiPanel}</div>
    </div>

    <div class="mk-card">
      <div class="ms-sec"><h3>${esc(isStartup ? t("ms_res_breakdown_st") : t("ms_res_breakdown"))}</h3>
        <p>${esc(t("ms_res_breakdown_sub"))}</p></div>
      <div class="ms-blocks">${core.orderedBlocks(s).map(e => ui.blockCard(e[1])).join("")}</div>
    </div>

    <div class="ms-split">
      <div class="mk-card">
        <div class="ms-sec"><h3>${esc(t("ms_res_gaps"))}</h3>
          ${gain ? `<p>${esc(t("ms_res_gaps_sub").replace("{n}", num(gain, 0)))}</p>` : ""}</div>
        ${gapsHtml}
      </div>
      <div class="mk-card">
        <div class="ms-sec"><h3>${esc(t("ms_res_sim"))}</h3><p>${esc(t("ms_res_sim_sub"))}</p></div>
        <div id="ms-sim-root">${simulator(s.projectType, picks, s.total)}</div>
      </div>
    </div>

    <div class="mk-card">
      <div class="ms-sec"><h3>${esc(t("ms_res_routing"))}</h3>
        ${data.unlocked ? `<p>${esc(t("ms_res_routing_sub").replace("{n}", num(matched.length, 0)))}</p>` : ""}</div>
      ${routing}
    </div>

    ${data.unlocked ? `<div class="mk-card">
      <div class="ms-sec"><h3>${esc(t("ms_int_title"))}</h3><p>${esc(t("ms_int_sub"))}</p></div>
      ${interestHtml}
    </div>` : ""}

    <div class="mk-card">
      <div class="ms-sec"><h3>${esc(t("ms_res_audit"))}</h3><p>${esc(t("ms_res_audit_sub"))}</p></div>
      ${ui.auditTable(data.audit)}
    </div>`;
  }

  function dscrTable(series) {
    if (!series || !series.length) return `<p class="mk-note">${esc(t("ms_res_no_data"))}</p>`;
    return `<div class="mk-tablewrap"><table class="mk-table"><thead><tr>
      <th>${esc(t("ms_col_year"))}</th><th class="num">CFADS</th>
      <th class="num">${esc(t("ms_col_debt_service"))}</th><th class="num">DSCR</th>
    </tr></thead><tbody>${series.map(d => {
      const tone = d.dscr == null ? "" : d.dscr >= 1.5 ? "is-good" : d.dscr >= 1.2 ? "is-warn" : "is-bad";
      return `<tr><td>${esc(t("ms_col_year"))} ${num(d.yil, 0)}</td>
        <td class="num">${money(d.cfads, "")}</td>
        <td class="num">${money(d.debtService, "")}</td>
        <td class="num ${tone}"><b>${d.dscr == null ? "—" : num(d.dscr, 2)}</b></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  /**
   * Egasining yagona o'tishi: navbatga qo'yish. Ekspertning qarorlari
   * (ko'rib chiqishga olish, tasdiqlash, rad etish) ATAYLAB bu yerda
   * emas — ular navbat ustidagi ish va investor sahifasida turadi
   * (moliya-investor-views.js, expertPanel). Ikkala sahifada ham
   * ko'rsatilsa, ekspert o'z ishini qilish uchun ariza beruvchining
   * ekranini ochishi kerak bo'lardi.
   */
  function actionButtons(p, role, unlocked) {
    if (p.status !== "scored" || !unlocked) return "";
    return `<button type="button" class="btn btn-primary" id="ms-submit">${esc(t("ms_act_submit"))}</button>`;
  }

  /* =========================================================
     METODIKA
     ========================================================= */
  function weightRow(titleText, max, tiers) {
    const top = Math.max.apply(null, tiers.map(x => x[1]));
    return `<div class="ms-met-block">
      <div class="ms-met-head"><span>${esc(titleText)}</span>
        <b class="num">${num(max, 0)} ${esc(t("ms_met_tiers_label"))}</b></div>
      <ul>${tiers.map(x => `<li${x[1] === top ? ' class="is-top"' : ""}>
        <span>${esc(x[0])}</span><i class="num">${num(x[1], 0)}</i></li>`).join("")}</ul></div>`;
  }

  function methodology() {
    const refTiers = (list, table) => list.map(o => [ui.L(o), table[o.id]]);
    const company = [
      weightRow(t("ms_met_b1"), S.weights.teo, [
        [t("ms_tier_teo_big5"), S.teo.big5], [t("ms_tier_teo_recognized"), S.teo.recognized],
        [t("ms_teo_internal"), S.teo.internal], [t("ms_none"), S.teo.none]]),
      weightRow(t("ms_met_b2"), S.weights.audit, [
        [t("ms_tier_audit_b5"), S.audit.threeYearCleanBig5], [t("ms_tier_audit_other"), S.audit.threeYearCleanOther],
        [t("ms_tier_audit_12"), S.audit.oneToTwoYear], [t("ms_tier_audit_signed"), S.audit.contractSignedInProgress],
        [t("ms_none"), S.audit.none]]),
      weightRow(t("ms_met_b3"), S.weights.continuity, [
        [t("ms_tier_cont_33"), S.continuity.threeYearsThreeProfitable],
        [t("ms_tier_cont_32"), S.continuity.threeYearsTwoProfitable],
        [t("ms_tier_cont_1"), S.continuity.oneYearProfitable], [t("ms_tier_cont_none"), S.continuity.greenfield]]),
      weightRow(t("ms_met_b4"), S.weights.netProfit, [
        [t("ms_tier_np_3"), S.netProfit.threeYears], [t("ms_tier_np_2"), S.netProfit.twoYears],
        [t("ms_tier_np_1"), S.netProfit.oneYear], [t("ms_none"), S.netProfit.none]]),
      weightRow(t("ms_met_b5"), S.weights.dueDiligence, [
        [t("ms_tier_dd_all"), S.dueDiligence.allSixBig5], [t("ms_tier_dd_35"), S.dueDiligence.threeToFive],
        [t("ms_tier_dd_legal"), S.dueDiligence.onlyConsultingLegal],
        [t("ms_tier_dd_planned"), S.dueDiligence.plannedApproved], [t("ms_none"), S.dueDiligence.none]]),
      weightRow(t("ms_met_b6"), S.weights.irr, [
        [t("ms_tier_irr_p8"), S.irr.hurdlePlus8pp], [t("ms_tier_irr_p4"), S.irr.hurdlePlus4pp],
        [t("ms_tier_irr_at"), S.irr.atHurdle], [t("ms_tier_irr_below2"), S.irr.belowUpTo2pp],
        [t("ms_tier_irr_below_more"), S.irr.belowMore]]),
      weightRow(t("ms_met_b7a"), S.debtBurden.debtEbitda.le1_5, [
        ["≤ " + num(1.5, 1), S.debtBurden.debtEbitda.le1_5], ["≤ " + num(2.5, 1), S.debtBurden.debtEbitda.le2_5],
        ["≤ " + num(3, 1), S.debtBurden.debtEbitda.le3_0], ["> " + num(3, 1), S.debtBurden.debtEbitda.above3_0]]),
      weightRow(t("ms_met_b7b"), S.debtBurden.dscr.ge1_8, [
        ["≥ " + num(1.8, 1), S.debtBurden.dscr.ge1_8], ["≥ " + num(1.5, 1), S.debtBurden.dscr.ge1_5],
        ["≥ " + num(1.2, 1), S.debtBurden.dscr.ge1_2], ["< " + num(1.2, 1), S.debtBurden.dscr.below1_2]]),
      weightRow(t("ms_met_b8"), S.weights.exit, [
        [t("ms_tier_exit_full"), S.exit.fullContractFormulaTerm],
        [t("ms_tier_exit_general"), S.exit.generalDescriptionNoFormula],
        [t("ms_tier_exit_intent"), S.exit.intentOnly], [t("ms_none"), S.exit.none]]),
    ].join("");

    const startup = [
      weightRow(t("ms_block_team"), SS.weights.team, refTiers(REF.teamExperience, SS.team)),
      weightRow(t("ms_block_product"), SS.weights.product, refTiers(REF.productStage, SS.product)),
      weightRow(t("ms_block_market"), SS.weights.market, refTiers(REF.marketValidation, SS.market)),
      weightRow(t("ms_block_funding"), SS.weights.funding, refTiers(REF.fundingHistory, SS.funding)),
      weightRow(t("ms_block_fin_model"), SS.weights.finModel, refTiers(REF.startupFinModelQuality, SS.finModel)),
      weightRow(t("ms_block_potential"), SS.weights.potential, refTiers(REF.potentialTiers, SS.potential)),
      weightRow(t("ms_block_legal"), SS.weights.legal, refTiers(REF.legalIpStatus, SS.legal)),
      weightRow(t("ms_block_next_exit"), SS.weights.exit, refTiers(REF.nextStageExit, SS.exit)),
    ].join("");

    const code = txt => `<code>${esc(txt)}</code>`;

    return `
    <div class="ms-head">
      <div><h2>${esc(t("ms_met_title"))}</h2>
        <p class="mk-sub">${t("ms_met_sub")
          .replace("{a}", code("moliya-scoring-config.js → scoring"))
          .replace("{b}", code("startupScoring"))}</p></div>
      <div class="mk-actions">
        <button type="button" class="btn btn-ghost" id="ms-back">${esc(t("ms_back_list"))}</button>
      </div>
    </div>
    <h3 class="ms-met-title">${esc(t("ms_met_company_path"))}</h3>
    <div class="ms-met-grid">${company}</div>
    <div class="ms-knockout">
      <div class="ms-knockout-head">${esc(t("ms_met_ko_title"))}</div>
      <div class="ms-knockout-body">
        <p>${t("ms_met_ko_body").replace("{cap}", num(CFG.knockout.capScore, 0))}</p>
        <ul>${CFG.knockout.rules.map(r => `<li>${esc(ui.L(r))}</li>`).join("")}</ul>
      </div>
    </div>
    <h3 class="ms-met-title">${esc(t("ms_met_routing_title"))}</h3>
    <div class="ms-tiers">${CFG.routing.thresholds.map(tr => `
      <div class="ms-tier ${ui.tierClass(tr)}"><i></i>
        <span class="num">${tr.min}–${tr.max} ${esc(t("ms_met_tiers_label"))}</span>
        <b>${esc(ui.L(tr))}</b></div>`).join("")}</div>
    <div class="ms-met-startup">
      <h3 class="ms-met-title">${esc(t("ms_met_startup_title"))}</h3>
      <p class="ms-banner is-startup">${t("ms_met_startup_body")}</p>
      <div class="ms-met-grid">${startup}</div>
      <p class="mk-note">${t("ms_met_startup_footer")}</p>
    </div>`;
  }

  /* =========================================================
     TEASER — chop etiladigan investitsiya taklifi
     ========================================================= */
  function teaser(data) {
    const p = data.project, s = data.scoring;
    const isStartup = s.projectType === "startup";
    const matches = (data.matches || []).filter(m => m.fullMatch).slice(0, 5);
    const si = p.startupInfo || {};

    const kv = (a, b, c, d) => `<tr><td>${esc(a)}</td><td><b>${b}</b></td>
      <td>${esc(c)}</td><td><b>${d}</b></td></tr>`;

    const profile = isStartup
      ? [[t("ms_sc_label_team"), REF.teamExperience, si.jamoaTajribasi],
         [t("ms_sc_label_product"), REF.productStage, si.mahsulotBosqichi],
         [t("ms_sc_label_market"), REF.marketValidation, si.bozorValidatsiyasi],
         [t("ms_sc_label_funding"), REF.fundingHistory, si.moliyalashtirishTarixi],
         [t("ms_sc_label_legal"), REF.legalIpStatus, si.huquqiyIpHolati],
         [t("ms_sc_label_exit"), REF.nextStageExit, si.keyingiBosqichExit]]
        .map(r => `<tr><td>${esc(r[0])}</td><td colspan="2"><b>${esc(ui.refName(r[1], r[2]) || "—")}</b></td></tr>`).join("")
      : REF.ddAreas.map(a => {
          const cur = (p.dueDiligence.ddYonalishlari || {})[a.id] || { status: "none", performer: "" };
          return `<tr><td>${esc(ui.L(a))}</td>
            <td><b>${esc(ui.refName(REF.ddStatusOptions, cur.status) || t("ms_none"))}</b></td>
            <td>${esc(cur.performer || "—")}</td></tr>`;
        }).join("");

    const teoLabel = (() => {
      const teo = p.dueDiligence.teoTayyorlovchi || {};
      if (teo.category === "big5") return esc(teo.name) + " (Big-5)";
      if (teo.category === "recognized") return esc(teo.name);
      if (teo.category === "internal") return esc(t("ms_teo_internal"));
      return esc(t("ms_none"));
    })();

    return `
    <div class="ms-print-bar no-print">
      <button type="button" class="ms-link" id="ms-back">${esc(t("ms_tsr_back"))}</button>
      <button type="button" class="btn btn-primary" id="ms-print-btn">${esc(t("ms_tsr_print"))}</button>
    </div>
    <article id="ms-print" class="ms-print">
      <header class="ms-print-head">
        <div>
          <span class="ms-print-eyebrow">${esc(t("ms_tsr_label"))}</span>
          <h1>${esc(p.passport.nomi)}</h1>
          <p>${esc(ui.sectorName(p))} · ${esc(ui.regionName(p))} ·
             ${esc(t("ms_f_tin").replace(" *", ""))} ${esc(p.passport.stir)}</p>
        </div>
        <div class="ms-print-score">
          <b class="num">${num(s.total, 0)}<i>/100</i></b>
          <div>${ui.routingBadge(s.routingStatus)}</div>
          <div>${ui.typeBadge(p.passport.loyihaTuri)}</div>
        </div>
      </header>

      <h3>${esc(t("ms_tsr_passport"))}</h3>
      <table class="ms-print-t"><tbody>
        ${kv(t("ms_tsr_total_value"), money(p.passport.umumiyQiymat, p.passport.valyuta),
             t("ms_tsr_term"), num(p.passport.muddat, 0) + " " + esc(t("ms_unit_years")))}
        ${kv(t("ms_tsr_requested"), money(p.passport.soralayotganSumma, p.passport.valyuta),
             t("ms_tsr_owner_share"), p.passport.tashabbuskorUlushi == null ? "—" : pctTxt(p.passport.tashabbuskorUlushi))}
        ${kv(t("ms_tsr_fin_type"), esc(ui.refName(REF.financingTypes, p.passport.moliyalashtirishTuri)),
             t("ms_tsr_teo"), isStartup ? "—" : teoLabel)}
      </tbody></table>

      <h3>${esc(isStartup ? t("ms_tsr_forecast_opt") : t("ms_res_kpi_title"))}</h3>
      ${ui.kpiTiles(p, s.kpis)}

      <h3>${esc(isStartup ? t("ms_tsr_scoring_st") : t("ms_tsr_scoring"))}</h3>
      <table class="ms-print-t ms-print-score-t"><tbody>
        ${core.orderedBlocks(s).map(e => {
          const b = e[1];
          const pct = b.max ? Math.round((b.score / b.max) * 100) : 0;
          return `<tr><td>${esc(t(b.labelKey))}</td>
            <td><span class="ms-print-bar-track"><i style="width:${pct}%"></i></span></td>
            <td class="num"><b>${num(b.score, 0)} / ${num(b.max, 0)}</b></td></tr>`;
        }).join("")}
        <tr class="ms-print-total"><td colspan="2"><b>${esc(t("ms_tsr_total"))}</b></td>
          <td class="num"><b>${num(s.total, 0)} / 100</b></td></tr>
      </tbody></table>

      ${s.isKnockout ? `<div class="ms-knockout">
        <div class="ms-knockout-head">${esc(t("ms_tsr_ko_title"))}</div>
        <div class="ms-knockout-body"><ul>${s.knockouts.map(k => `<li>${esc(ui.L(k))}</li>`).join("")}</ul></div>
      </div>` : ""}

      <h3>${esc(isStartup ? t("ms_tsr_startup_profile") : t("ms_tsr_dd_status"))}</h3>
      <table class="ms-print-t"><tbody>${profile}</tbody></table>

      <h3>${esc(t("ms_tsr_institutions"))}</h3>
      ${matches.length
        ? `<table class="ms-print-t"><tbody>${matches.map(m => `<tr>
            <td><b>${esc(ui.L(m.inst.nomi))}</b></td>
            <td>${esc(ui.refName(CFG.institutionTypes, m.inst.turi) || m.inst.turi)}</td>
            <td>${esc(m.inst.aloqa_email || "—")}</td></tr>`).join("")}</tbody></table>`
        : `<p class="mk-note">${esc(t("ms_tsr_no_institutions"))}</p>`}

      <footer class="ms-print-foot">
        <span>${esc(t("ms_tsr_footer"))}</span>
        <span class="num">${esc(t("ms_tsr_generated").replace("{d}", day(Date.now())))}</span>
      </footer>
    </article>`;
  }

  return { dashboard, results, methodology, teaser, simulator, simOut, simTotal, simPicksFrom, simDefs };
})(MK, MSCORE, MS_UI);
