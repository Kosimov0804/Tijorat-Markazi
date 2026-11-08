/* ============================================================
   MOLIYA BOZORI — loyiha skoringi: 4 BOSQICHLI SEHRGAR

   Uchta ish qiladi va boshqa hech narsa qilmaydi:
     markup(step, project)   — bosqich formasini HTML sifatida quradi
     collect(step, project)  — DOM'dagi qiymatlarni loyihaga yozadi
     validate(step, project) — to'ldirilmagan majburiy maydonlarni sanaydi

   Yo'l (company / startup) 1-bosqichda tanlanadi va keyingi uchta
   bosqichning MAZMUNINI butunlay almashtiradi — startup uchun
   moliyaviy tarix ham, audit ham so'ralmaydi, chunki yangi tashkil
   topgan loyiha ularni tabiiy ravishda taqdim eta olmaydi. Shu sababli
   bu yerda ikkita ayri bosqich to'plami bor, bitta "moslashuvchan"
   forma emas: aralashtirilgan forma ikkala yo'lni ham yomon
   ko'rsatardi.

   Yo'l tanlovi ochiladigan ro'yxat EMAS, ikkita karta-tugma
   (.ms-track-opt): tanlov keyingi uch bosqichni butunlay o'zgartiradi,
   ya'ni u oddiy maydon emas, sahifaning ikki xil rejimi. Bunday
   qarorni <select> ichiga yashirish uni tasodifiy qilib qo'yadi.

   Saqlash: collect() hech qachon tarmoqqa chiqmaydi. Saqlash va
   rasmiy ball — boshqaruvchining (moliya-apply.js) ishi; bu modul
   serverni bilmaydi.
   ============================================================ */
const MS_WIZ = ((kit, core, ui) => {
  const { $, $$, t, esc, escA, num, pctTxt } = kit;
  const REF = core.CONFIG.references;
  const SS = core.CONFIG.startupScoring;

  /* ---------- forma atomlari ---------- */
  const INPUT = "ms-in";

  /* Majburiy maydon yulduzchasi matndan ajratiladi, shunda yulduzcha
     tarjimaga emas, uslubga bo'ysunadi. */
  function label(text) {
    const req = /\*\s*$/.test(text);
    return "<label>" + esc(text.replace(/\s*\*\s*$/, ""))
      + (req ? '<i class="ms-req">*</i>' : "") + "</label>";
  }
  function field(text, inputHtml, hint, wide) {
    return '<div class="mk-f' + (wide ? " wide" : "") + '">' + label(text) + inputHtml
      + (hint ? '<span class="ms-hint">' + hint + "</span>" : "") + "</div>";
  }
  const txt = (id, v) => '<input id="' + id + '" type="text" class="' + INPUT + '" value="' + escA(v == null ? "" : v) + '">';
  const area = (id, v) => '<textarea id="' + id + '" rows="2" class="' + INPUT + '">' + esc(v == null ? "" : v) + "</textarea>";
  const nmb = (id, v, step) => '<input id="' + id + '" type="number" step="' + (step || "any")
    + '" class="' + INPUT + ' num" value="' + (v == null ? "" : escA(v)) + '">';
  function sel(id, options, selected) {
    return '<select id="' + id + '" class="' + INPUT + '">'
      + options.map(o => '<option value="' + escA(o.value) + '"'
        + (String(o.value) === String(selected) ? " selected" : "") + ">" + esc(o.label) + "</option>").join("")
      + "</select>";
  }
  const refOpts = list => list.map(o => ({ value: o.id, label: ui.L(o) }));
  const withBlank = list => [{ value: "", label: t("ms_select") }].concat(refOpts(list));

  function check(id, text, on) {
    return '<label class="ms-check"><input id="' + id + '" type="checkbox"' + (on ? " checked" : "")
      + "><span>" + esc(text) + "</span></label>";
  }
  function head(title, sub) {
    return '<div class="ms-sec"><h3>' + esc(title) + "</h3>"
      + (sub ? "<p>" + esc(sub) + "</p>" : "") + "</div>";
  }
  const cell = (attr, v) => "<input " + attr + ' type="number" class="num" value="'
    + (v == null ? "" : escA(v)) + '">';

  /* Raqamli matritsa: aylanma qobiq + jadval. Qobiq chegara va radiusni
     oladi, sirpanish ham unda — aks holda dumaloq burchak o'z ichidagi
     jadvalni qirqib tashlaydi. Birinchi ustun yopishqoq. */
  function matrix(headCells, bodyRows) {
    return '<div class="ms-matrixwrap"><table class="ms-matrix"><thead><tr>'
      + headCells.map(h => "<th>" + esc(h) + "</th>").join("")
      + "</tr></thead><tbody>" + bodyRows + "</tbody></table></div>";
  }

  /* ---------- bosqich sarlavhalari ---------- */
  function stepLabels(loyihaTuri) {
    const s = loyihaTuri === "startup" ? "startup" : "company";
    return [t("ms_wiz_step1"), t("ms_wiz_step2_" + s), t("ms_wiz_step3_" + s), t("ms_wiz_step4_" + s)];
  }

  /* Sahifa bitta yo'lga bag'ishlanganda tanlov kartalari ma'nosini
     yo'qotadi: foydalanuvchi allaqachon tanlab bu yerga kelgan, va
     kartalarni qoldirish uni sahifadan chiqmasdan boshqa metodikaga
     o'tkazib yuborardi. Qulf o'rnatilganda o'rniga qaysi metodika
     ishlayotgani va ikkinchisiga qayerdan borish aytiladi. */
  let lockedTrack = null;
  function lockTrack(id){ lockedTrack = (id === "startup" || id === "company") ? id : null; }

  /* ---------- 1-bosqich: pasport ---------- */
  function trackFork(loyihaTuri) {
    const opt = id => {
      const on = (loyihaTuri === "startup") === (id === "startup");
      return '<button type="button" class="ms-track-opt' + (id === "startup" ? " is-startup" : "")
        + (on ? " is-on" : "") + '" data-ms-track="' + id + '"'
        + ' aria-pressed="' + (on ? "true" : "false") + '">'
        + "<em>" + esc(t("ms_f_type").replace(" *", "")) + "</em>"
        + "<b>" + esc(ui.refName(REF.projectTypes, id)) + "</b>"
        + "<span>" + esc(t(id === "startup" ? "ms_wiz_hint_startup" : "ms_wiz_hint_company")) + "</span>"
        + "</button>";
    };
    return '<div class="ms-track">' + opt("company") + opt("startup") + "</div>";
  }

  /* Qulflangan yo'lning yozuvi. Yangi klass kiritilmaydi — mavjud
     .mk-note va .ms-link yetarli, chunki bu boshqaruv emas, bayon. */
  function trackNote(id) {
    const other = id === "startup" ? "company" : "startup";
    const href = other === "startup" ? "moliya-startup.html" : "moliya-korxona.html";
    return '<p class="mk-note"><b>'
      + esc(t("ms_track_fixed").replace("{name}", ui.refName(REF.projectTypes, id)))
      + '</b> <a class="ms-link" href="' + href + '">'
      + esc(t("ms_track_switch_" + other)) + "</a></p>";
  }

  function stepPassport(p) {
    const pp = p.passport;
    return (lockedTrack ? trackNote(lockedTrack) : trackFork(pp.loyihaTuri))
      + '<div class="mk-form">'
      + field(t("ms_f_name"), txt("ms-f-nomi", pp.nomi))
      + field(t("ms_f_tin"), txt("ms-f-stir", pp.stir))
      + field(t("ms_f_sector"), sel("ms-f-sektor", refOpts(REF.sectors), pp.sektor))
      + field(t("ms_f_region"), sel("ms-f-hudud", refOpts(REF.regions), pp.hudud))
      + field(t("ms_f_total_value"), nmb("ms-f-umumiy", pp.umumiyQiymat))
      + field(t("ms_f_amount"), nmb("ms-f-summa", pp.soralayotganSumma))
      + field(t("ms_f_currency"), sel("ms-f-valyuta", REF.currencies.map(c => ({ value: c, label: c })), pp.valyuta))
      + field(t("ms_f_term"), nmb("ms-f-muddat", pp.muddat, "1"))
      + field(t("ms_f_fin_type"), sel("ms-f-montur", refOpts(REF.financingTypes), pp.moliyalashtirishTuri))
      + field(t("ms_f_owner_share"), nmb("ms-f-ulush", pp.tashabbuskorUlushi))
      + field(t("ms_f_op_years"), nmb("ms-f-yillar", pp.faoliyatYillari, "1"))
      + "</div>";
  }

  /* ---------- 2-bosqich (korxona): moliyaviy tarix ---------- */
  const HIST_COLS = [
    ["tushum", "ms_col_revenue"], ["ebitda", null], ["sofFoyda", "ms_col_net_profit"],
    ["jamiQarz", "ms_col_total_debt"], ["jamiAktivlar", "ms_col_total_assets"], ["ozKapital", "ms_col_equity"],
  ];
  const yearLabel = i => t("ms_b_year_label").replace("{n}", String(3 - i));

  function historyMetricsRows(p) {
    return core.calcHistoryMetrics(p.financialHistory).rows.map((r, i) => "<tr>"
      + "<td>" + esc(yearLabel(i)) + "</td>"
      + '<td class="num">' + (r.ros == null ? "—" : pctTxt(r.ros)) + "</td>"
      + '<td class="num">' + (r.roe == null ? "—" : pctTxt(r.roe)) + "</td>"
      + '<td class="num">' + (r.growth == null ? "—" : pctTxt(r.growth)) + "</td>"
      + '<td><span class="ms-flag ' + (r.rentabelmi ? "is-good" : "is-bad") + '">'
      + esc(t(r.rentabelmi ? "ms_b_profitable" : "ms_b_unprofitable")) + "</span></td></tr>").join("");
  }

  function stepHistory(p) {
    const rows = p.financialHistory.map((y, i) => "<tr>"
      + '<td class="ms-matrix-row">' + esc(yearLabel(i)) + "</td>"
      + HIST_COLS.map(c => "<td>" + cell('data-ms-hist="' + i + ":" + c[0] + '"', y[c[0]]) + "</td>").join("")
      + "</tr>").join("");
    const hist = core.calcHistoryMetrics(p.financialHistory);

    return head(t("ms_b_title"), t("ms_b_sub").replace("{ccy}", p.passport.valyuta))
      + matrix([t("ms_col_year")].concat(HIST_COLS.map(c => (c[1] ? t(c[1]) : "EBITDA"))), rows)
      + head(t("ms_b_metrics"), t("ms_b_metrics_sub"))
      + '<div class="mk-tablewrap"><table class="mk-table"><thead><tr>'
      + "<th>" + esc(t("ms_col_year")) + "</th><th>ROS</th><th>ROE</th>"
      + "<th>" + esc(t("ms_col_growth")) + "</th><th>" + esc(t("ms_col_status")) + "</th>"
      + '</tr></thead><tbody id="ms-hist-metrics">' + historyMetricsRows(p) + "</tbody></table></div>"
      + '<p class="mk-note">' + esc(t("ms_b_profitable_years"))
      + ' <b id="ms-hist-count" class="num">' + hist.profitableYears + "</b> / 3 "
      + esc(t("ms_b_profitable_hint")) + "</p>";
  }

  /* ---------- 2-bosqich (startup): sifat mezonlari ---------- */
  function stepStartupProfile(p) {
    const si = p.startupInfo;
    const maxHint = n => esc(t("ms_hint_max_points").replace("{n}", String(n)));
    return '<p class="ms-banner is-startup">' + t("ms_sb_banner") + "</p>"
      + '<div class="mk-form">'
      + field(t("ms_f_team"), sel("ms-si-jamoa", refOpts(REF.teamExperience), si.jamoaTajribasi), maxHint(SS.weights.team))
      + field(t("ms_f_product_stage"), sel("ms-si-mahsulot", refOpts(REF.productStage), si.mahsulotBosqichi), maxHint(SS.weights.product))
      + field(t("ms_f_market_valid"), sel("ms-si-bozor", refOpts(REF.marketValidation), si.bozorValidatsiyasi), maxHint(SS.weights.market))
      + field(t("ms_f_funding_history"), sel("ms-si-moliya", refOpts(REF.fundingHistory), si.moliyalashtirishTarixi), maxHint(SS.weights.funding))
      + field(t("ms_f_team_desc"), area("ms-si-jamoa-t", si.jamoaTavsifi), null, true)
      + field(t("ms_f_product_desc"), area("ms-si-mahsulot-t", si.mahsulotTavsifi), null, true)
      + "</div>";
  }

  /* ---------- 3-bosqich: moliyaviy model ---------- */
  const MODEL_COLS = [["fcf", "Free Cash Flow"], ["cfads", "CFADS"],
    ["principal", "ms_col_principal"], ["interest", "ms_col_interest"]];

  function stepModel(p) {
    const m = p.financialModel;
    const isStartup = p.passport.loyihaTuri === "startup";
    /* Qarz xizmati qoplanmagan yil — jadval umuman shu fakt uchun bor. */
    const rows = m.yillar.map((y, i) => {
      const service = (y.principal || 0) + (y.interest || 0);
      const short = service > 0 && (y.cfads || 0) < service;
      return "<tr" + (short ? ' class="is-short"' : "") + ">"
        + '<td class="ms-matrix-row">' + esc(t("ms_col_year")) + " " + num(y.yil, 0) + "</td>"
        + MODEL_COLS.map(c => "<td>" + cell('data-ms-model="' + i + ":" + c[0] + '"', y[c[0]]) + "</td>").join("")
        + '<td class="is-calc">' + (service > 0 ? num((y.cfads || 0) / service, 2) : "—") + "</td>"
        + '<td><button type="button" class="ms-x" data-ms-delyear="' + i + '" title="'
        + escA(t("ms_c_remove_year")) + '">✕</button></td></tr>';
    }).join("");

    const cols = [t("ms_col_year")]
      .concat(MODEL_COLS.map(c => (c[0] === "principal" || c[0] === "interest") ? t(c[1]) : c[1]))
      .concat(["DSCR", ""]);

    return (isStartup ? '<p class="ms-banner is-startup">' + t("ms_c_startup_optional") + "</p>" : "")
      + '<div class="mk-form">'
      + field(t("ms_c_discount"), nmb("ms-f-diskont", m.diskontStavkasi))
      + field(t("ms_c_cb_rate"), nmb("ms-f-mb", m.mbStavkasi), esc(t("ms_c_cb_hint")))
      + '<div class="mk-f"><label>&#160;</label><button type="button" class="btn btn-ghost" id="ms-add-year">'
      + esc(t("ms_c_add_year")) + "</button></div>"
      + "</div>"
      + head(t("ms_c_cashflow"), t("ms_c_cashflow_sub"))
      + matrix(cols, rows)
      + '<div id="ms-model-kpis">' + ui.kpiTiles(p, liveKpis(p)) + "</div>";
  }

  /** Sehrgar ichida jonli ko'rsatiladigan KPI — rasmiy ball emas, faqat UX. */
  function liveKpis(p) {
    const cf = core.buildFcfCashflows(p);
    const dscr = core.calcDSCRSeries(p.financialModel).map(d => d.dscr).filter(v => v != null && isFinite(v));
    return {
      irr: core.calcIRR(cf),
      npv: core.calcNPV(cf, p.financialModel.diskontStavkasi),
      payback: core.calcPayback(cf),
      debtEbitda: core.calcDebtEbitda(p.financialHistory),
      dscrMin: dscr.length ? Math.min.apply(null, dscr) : null,
      hurdle: core.getHurdle(p),
    };
  }

  /* ---------- 4-bosqich (korxona): hujjatlar, DD, exit ---------- */
  function teoOptions(teo) {
    const cur = (teo.category || "none") + "::" + (teo.name || "");
    const opt = (v, labelText) => '<option value="' + escA(v) + '"' + (v === cur ? " selected" : "") + ">" + esc(labelText) + "</option>";
    const group = (labelText, names, cat) => '<optgroup label="' + escA(labelText) + '">'
      + names.map(n => opt(cat + "::" + n, n)).join("") + "</optgroup>";
    return '<select id="ms-f-teo" class="' + INPUT + '">'
      + opt("none::", t("ms_none")) + opt("internal::", t("ms_teo_internal"))
      + group(t("ms_teo_big5_group"), REF.consultants.big5, "big5")
      + group(t("ms_teo_recognized_group"), REF.consultants.recognized, "recognized")
      + "</select>";
  }

  function docsSection(p, hint) {
    const rows = (p.documents || []).map((d, i) => '<li class="ms-doc">'
      + "<span>" + esc(d.name) + "</span>"
      + '<i class="num">' + Math.round((d.size || 0) / 1024) + " KB</i>"
      + '<button type="button" class="ms-x" data-ms-deldoc="' + i + '">✕</button></li>').join("");
    return head(t("ms_doc_title"), hint)
      + (rows ? '<ul class="ms-docs">' + rows + "</ul>"
              : '<p class="mk-note">' + esc(t("ms_doc_empty")) + "</p>")
      + '<label class="btn btn-ghost ms-upload">' + esc(t("ms_doc_upload"))
      + '<input id="ms-doc-file" type="file" multiple hidden></label>';
  }

  function stepDueDiligence(p) {
    const dd = p.dueDiligence;
    const ddRows = REF.ddAreas.map(a => {
      const cur = dd.ddYonalishlari[a.id] || { status: "none", performer: "" };
      return "<tr><td>" + esc(ui.L(a)) + "</td>"
        + '<td><select data-ms-dd="' + escA(a.id) + '" class="' + INPUT + '">'
        + REF.ddStatusOptions.map(o => '<option value="' + escA(o.id) + '"'
          + (o.id === cur.status ? " selected" : "") + ">" + esc(ui.L(o)) + "</option>").join("")
        + "</select></td>"
        + '<td><input data-ms-ddp="' + escA(a.id) + '" type="text" class="' + INPUT
        + '" placeholder="' + escA(t("ms_ph_performer")) + '" value="' + escA(cur.performer) + '"></td></tr>';
    }).join("");

    return head(t("ms_d_teo_title"), t("ms_d_teo_sub"))
      + '<div class="mk-form">'
      + field(t("ms_f_teo_preparer"), teoOptions(dd.teoTayyorlovchi || {}))
      + field(t("ms_f_audit_years"), nmb("ms-f-audit-y", dd.audit.yillarSoni, "1"))
      + field(t("ms_f_auditor"), txt("ms-f-auditor", dd.audit.auditor))
      + field(t("ms_f_audit_opinion"), sel("ms-f-audit-x", withBlank(REF.auditOpinionTypes), dd.audit.xulosaTuri))
      + "</div>"
      + check("ms-f-audit-c", t("ms_chk_audit_contract"), dd.audit.contractSigned)
      + head(t("ms_d_dd_title"), t("ms_d_dd_sub"))
      + '<div class="mk-tablewrap"><table class="mk-table"><thead><tr><th>'
      + esc(t("ms_col_area")) + "</th><th>" + esc(t("ms_col_status")) + "</th><th>"
      + esc(t("ms_col_performer")) + "</th></tr></thead><tbody>" + ddRows + "</tbody></table></div>"
      + check("ms-f-tor", t("ms_chk_tor"), dd.torTasdiqlangan)
      + head(t("ms_d_legal_title"))
      + '<div class="mk-form">'
      + field(t("ms_f_legal_firm"), sel("ms-f-yuridik", withBlank(REF.legalFirms), dd.yuridikKompaniya))
      + field(t("ms_f_exit_type"), sel("ms-f-exit-t", withBlank(REF.exitTypes), dd.exit.turi), esc(t("ms_f_exit_type_hint")))
      + field(t("ms_f_price_formula"), txt("ms-f-exit-f", dd.exit.narxFormulasi), esc(t("ms_f_price_hint")))
      + field(t("ms_f_exit_term"), nmb("ms-f-exit-m", dd.exit.muddat, "1"))
      + "</div>"
      + check("ms-f-exit-c", t("ms_chk_exit_contract"), dd.exit.shartnomaLoyihasi)
      + docsSection(p, t("ms_doc_hint_company"));
  }

  /* ---------- 4-bosqich (startup): huquqiy holat va exit ---------- */
  function stepStartupLegal(p) {
    const si = p.startupInfo;
    const maxHint = n => esc(t("ms_hint_max_points").replace("{n}", String(n)));
    return head(t("ms_sd_model_title"), t("ms_hint_total_points").replace("{n}", String(SS.weights.finModel + SS.weights.potential)))
      + '<div class="mk-form">'
      + field(t("ms_f_fin_model_q"), sel("ms-si-finmodel", refOpts(REF.startupFinModelQuality), si.moliyaviyModelSifati), maxHint(SS.weights.finModel))
      + field(t("ms_f_growth_potential"), sel("ms-si-potential", refOpts(REF.potentialTiers), si.daromadlilikSalohiyati), maxHint(SS.weights.potential))
      + "</div>"
      + head(t("ms_sd_legal_title"), t("ms_hint_total_points").replace("{n}", String(SS.weights.legal + SS.weights.exit)))
      + '<div class="mk-form">'
      + field(t("ms_f_legal_ip"), sel("ms-si-legal", refOpts(REF.legalIpStatus), si.huquqiyIpHolati), maxHint(SS.weights.legal))
      + field(t("ms_f_next_exit"), sel("ms-si-exit", refOpts(REF.nextStageExit), si.keyingiBosqichExit), maxHint(SS.weights.exit))
      + "</div>"
      + docsSection(p, t("ms_doc_hint_startup"));
  }

  /* ---------- markup dispatcher ---------- */
  function markup(step, p) {
    const isStartup = p.passport.loyihaTuri === "startup";
    if (step === 1) return stepPassport(p);
    if (step === 2) return isStartup ? stepStartupProfile(p) : stepHistory(p);
    if (step === 3) return stepModel(p);
    return isStartup ? stepStartupLegal(p) : stepDueDiligence(p);
  }

  /* ---------- DOM -> loyiha ----------
     Immutabillik bu yerda ataylab qo'llanilmaydi: sehrgar bitta
     "ishchi nusxa" ustida ishlaydi va u boshqaruvchining closure'ida
     yashaydi. Serverga ketadigan yagona nusxa — save() paytidagisi. */
  const numOrNull = el => (!el || el.value === "" ? null : Number(el.value));
  const numOr0 = el => (el ? Number(el.value) || 0 : 0);
  const str = el => (el ? el.value.trim() : "");

  function collect(step, p) {
    const isStartup = p.passport.loyihaTuri === "startup";
    if (step === 1) {
      const pp = p.passport;
      /* Yo'l tanlovi tugmada, maydonda emas — bosilgan kartani o'qiymiz. */
      const on = $(".ms-track-opt.is-on");
      if (on) pp.loyihaTuri = on.getAttribute("data-ms-track");
      pp.nomi = str($("#ms-f-nomi"));
      pp.stir = str($("#ms-f-stir"));
      pp.sektor = $("#ms-f-sektor").value;
      pp.hudud = $("#ms-f-hudud").value;
      pp.umumiyQiymat = numOrNull($("#ms-f-umumiy"));
      pp.soralayotganSumma = numOrNull($("#ms-f-summa"));
      pp.valyuta = $("#ms-f-valyuta").value;
      pp.muddat = numOr0($("#ms-f-muddat"));
      pp.moliyalashtirishTuri = $("#ms-f-montur").value;
      pp.tashabbuskorUlushi = numOrNull($("#ms-f-ulush"));
      pp.faoliyatYillari = numOr0($("#ms-f-yillar"));
      return;
    }
    if (step === 2 && isStartup) {
      const si = p.startupInfo;
      si.jamoaTajribasi = $("#ms-si-jamoa").value;
      si.mahsulotBosqichi = $("#ms-si-mahsulot").value;
      si.bozorValidatsiyasi = $("#ms-si-bozor").value;
      si.moliyalashtirishTarixi = $("#ms-si-moliya").value;
      si.jamoaTavsifi = str($("#ms-si-jamoa-t"));
      si.mahsulotTavsifi = str($("#ms-si-mahsulot-t"));
      return;
    }
    if (step === 2) {
      $$("[data-ms-hist]").forEach(el => {
        const parts = el.getAttribute("data-ms-hist").split(":");
        p.financialHistory[Number(parts[0])][parts[1]] = el.value === "" ? null : Number(el.value);
      });
      return;
    }
    if (step === 3) {
      p.financialModel.diskontStavkasi = numOr0($("#ms-f-diskont"));
      p.financialModel.mbStavkasi = numOr0($("#ms-f-mb"));
      $$("[data-ms-model]").forEach(el => {
        const parts = el.getAttribute("data-ms-model").split(":");
        p.financialModel.yillar[Number(parts[0])][parts[1]] = el.value === "" ? null : Number(el.value);
      });
      return;
    }
    if (step === 4 && isStartup) {
      const si = p.startupInfo;
      si.moliyaviyModelSifati = $("#ms-si-finmodel").value;
      si.daromadlilikSalohiyati = $("#ms-si-potential").value;
      si.huquqiyIpHolati = $("#ms-si-legal").value;
      si.keyingiBosqichExit = $("#ms-si-exit").value;
      return;
    }
    const dd = p.dueDiligence;
    const teo = $("#ms-f-teo").value.split("::");
    dd.teoTayyorlovchi = { category: teo[0], name: teo[1] || "" };
    dd.audit.yillarSoni = numOr0($("#ms-f-audit-y"));
    dd.audit.auditor = str($("#ms-f-auditor"));
    dd.audit.xulosaTuri = $("#ms-f-audit-x").value;
    dd.audit.contractSigned = $("#ms-f-audit-c").checked;
    REF.ddAreas.forEach(a => {
      dd.ddYonalishlari[a.id] = {
        status: $('[data-ms-dd="' + a.id + '"]').value,
        performer: str($('[data-ms-ddp="' + a.id + '"]')),
      };
    });
    dd.torTasdiqlangan = $("#ms-f-tor").checked;
    dd.yuridikKompaniya = $("#ms-f-yuridik").value;
    dd.exit.turi = $("#ms-f-exit-t").value;
    dd.exit.narxFormulasi = str($("#ms-f-exit-f"));
    dd.exit.muddat = numOrNull($("#ms-f-exit-m"));
    dd.exit.shartnomaLoyihasi = $("#ms-f-exit-c").checked;
  }

  /* ---------- validatsiya ----------
     Startup yo'lida hech bir bosqich BLOKLAMAYDI: tanlanmagan mezon
     shunchaki 0 ball beradi, va bu to'g'ri xatti-harakat — startup
     "to'ldirilmagan" bo'lgani uchun emas, "hali erishmagani" uchun
     past ball oladi. */
  function validate(step, p) {
    const e = [];
    const isStartup = p.passport.loyihaTuri === "startup";
    if (step === 1) {
      if (!p.passport.nomi) e.push(t("ms_v_name"));
      if (!p.passport.stir) e.push(t("ms_v_tin"));
      if (!p.passport.soralayotganSumma || p.passport.soralayotganSumma <= 0) e.push(t("ms_v_amount"));
      if (!p.passport.muddat || p.passport.muddat <= 0) e.push(t("ms_v_term"));
      const sh = p.passport.tashabbuskorUlushi;
      if (sh != null && (sh < 0 || sh > 100)) e.push(t("ms_v_owner_share"));
      return e;
    }
    if (isStartup) return e;                       // 2, 3, 4 — yumshoq
    if (step === 2) {
      const last = p.financialHistory[p.financialHistory.length - 1];
      if (last.tushum == null) e.push(t("ms_v_revenue"));
      return e;
    }
    if (step === 3) {
      if (!p.financialModel.yillar.some(y => y.fcf != null)) e.push(t("ms_v_fcf"));
      return e;
    }
    const teo = p.dueDiligence.teoTayyorlovchi || {};
    if ((teo.category === "big5" || teo.category === "recognized") && !teo.name) e.push(t("ms_v_teo_org"));
    return e;
  }

  return { stepLabels, markup, collect, validate, liveKpis, historyMetricsRows, lockTrack };
})(MK, MSCORE, MS_UI);
