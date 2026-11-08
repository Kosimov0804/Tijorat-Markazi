/* ============================================================
   MOLIYA BOZORI — loyiha skoringi: UI ATOMLARI

   Faqat MARKUP quradi, hech narsani yuklamaydi va hech qanday
   holatni saqlamaydi: har bir funksiya kirishga ma'lumot oladi,
   chiqishga satr (HTML) qaytaradi. Shu sababli uni sehrgar ham,
   natija sahifasi ham, chop etiladigan teaser ham bir xil chaqira
   oladi — gauge yoki blok kartochkasi uch joyda uch xil
   ko'rinmasligi kerak.

   DOM SHAKLI markets.css dagi ms-* bo'limi bilan SHARTNOMA:
   sinf nomlari ham, ichma-ich joylashuv ham o'sha yerda tasvirlangan
   tuzilishga aynan mos kelishi shart. Masalan gauge'ning raqami
   <text> emas, SVG ustidagi HTML qatlam (.ms-gauge-mid) — shunda u
   tanlanadigan matn bo'lib qoladi; stepper tugmalari esa <li> siz
   bevosita .ms-stepper farzandi bo'lishi kerak, chunki bog'lovchi
   chiziq qo'shni-element qoidasi bilan chiziladi.

   Nega alohida fayl: loyihada 800 qatorlik fayl shifti bor
   (qarang moliya-forms.js sarlavhasi). Skoring moduli to'rtga
   bo'lingan:
     moliya-scoring-ui.js      — shu fayl, atomlar
     moliya-scoring-wizard.js  — 4 bosqichli forma va validatsiya
     moliya-scoring-views.js   — ro'yxat, natija, metodika, teaser
     moliya-apply.js           — sahifa boshqaruvchisi (controller)

   Kit ML_FORMS naqshi bo'yicha PARAMETR sifatida beriladi, global
   sifatida o'qilmaydi — shunda fayl tartibidagi xato "undefined"
   emas, aniq xato beradi.
   ============================================================ */
const MS_UI = ((kit, core) => {
  const { t, esc, escA, num, money, pctTxt, day, lang } = kit;

  /* Ma'lumotnoma yozuvining joriy tildagi nomi. Diqqat: MK.L() —
     bu tilning INDEKSI, yorliq tanlovchi emas. Yorliq uchun har doim
     core.L(item, lang()) ishlatiladi. */
  const L = item => core.L(item, lang());
  const refName = (list, id) => L(core.refItem(list, id)) || "";

  const REF = core.CONFIG.references;
  const sectorName = p => refName(REF.sectors, p.passport.sektor) || (p.passport.sektor || "");
  const regionName = p => refName(REF.regions, p.passport.hudud) || (p.passport.hudud || "");

  /* ---------- asoslash matnlari ----------
     Dvigatel tayyor jumla emas, { key, params } qaytaradi. Raqamlar
     shu yerda — foydalanuvchining tilida — formatlanadi, chunki
     1 234,56 va 1,234.56 farqi serverning ishi emas. */
  /* IRR hurdle bilan o'ndan bir foiz punktigacha solishtiriladi, MK.pctTxt
     esa butun foizga yaxlitlaydi — 10,4% va 10,0% bir xil ko'rinib qolardi.
     Shu sababli skoring ko'rsatkichlari bitta kasr xonasini saqlaydi. */
  const pct1 = v => (v == null || !isFinite(v) ? "—" : num(v, 1) + "%");
  const PCT_PARAMS = ["irr", "hurdle", "diff"];
  const NUM2_PARAMS = ["v", "limit"];

  function reason(r) {
    if (!r || !r.key) return "";
    let out = esc(t(r.key));
    const p = r.params || {};
    Object.keys(p).forEach(k => {
      let v = p[k];
      /* "label" nomli parametr TARJIMA KALITI bo'ladi, tayyor matn emas —
         startup bloklari o'z sarlavhasini shu yo'l bilan oladi. */
      if (k === "label") v = t(String(v));
      else if (k === "value") v = L(v) || t("ms_sc_not_set");
      else if (k === "valueRef") return;                       // ichki, ko'rsatilmaydi
      else if (PCT_PARAMS.indexOf(k) !== -1) v = pct1(v);
      else if (NUM2_PARAMS.indexOf(k) !== -1) v = num(v, 2);
      else if (k === "n") v = num(v, 0);
      out = out.split("{" + k + "}").join(esc(v == null ? "" : v));
    });
    return out;
  }

  /* ---------- holat nishonlari ---------- */
  const TIER_CLS = {
    tayyor: "is-tayyor", shartli: "is-shartli", qayta_ishlash: "is-qayta",
    rad_etilgan: "is-rad", knockout: "is-knockout",
  };
  const tierClass = st => (st && TIER_CLS[st.status]) || "is-rad";

  function routingBadge(st) {
    if (!st) return "";
    return '<span class="ms-badge ' + tierClass(st) + '"><i></i>' + esc(L(st)) + "</span>";
  }
  function statusBadge(statusId) {
    return '<span class="ms-status is-' + escA(statusId || "draft") + '">'
      + esc(refName(REF.projectStatuses, statusId) || statusId || "") + "</span>";
  }
  function typeBadge(loyihaTuri) {
    const st = loyihaTuri === "startup";
    return '<span class="ms-type' + (st ? " is-startup" : "") + '">'
      + esc(refName(REF.projectTypes, st ? "startup" : "company")) + "</span>";
  }

  /* ---------- ball gauge'i ----------
     markets.css shartnomasi: 200x200 viewBox, r=86, stroke-width 14,
     aylana uzunligi 540.35. Butun <svg> CSS tomonidan -90deg buriladi,
     shuning uchun bu yerdagi burchak hisobida -PI/2 siljishi YO'Q.
     Raqam SVG ichida emas, ustidagi HTML qatlamda turadi — shunda uni
     nusxalash mumkin va shrift o'lchami clamp() bilan boshqariladi. */
  const GAUGE_R = 86;
  const GAUGE_C = 2 * Math.PI * GAUGE_R;     // 540.35
  const TICKS = [60, 75, 90];

  function gauge(total, routingStatus, verdictHtml) {
    const score = Math.max(0, Math.min(100, total || 0));
    const off = GAUGE_C * (1 - score / 100);
    const ticks = TICKS.map(v => {
      const a = (v / 100) * 2 * Math.PI;
      const r1 = GAUGE_R - 7, r2 = GAUGE_R + 7;
      return '<line class="ms-gauge-tick' + (score >= v ? " is-met" : "") + '"'
        + ' x1="' + (100 + r1 * Math.cos(a)).toFixed(2) + '" y1="' + (100 + r1 * Math.sin(a)).toFixed(2) + '"'
        + ' x2="' + (100 + r2 * Math.cos(a)).toFixed(2) + '" y2="' + (100 + r2 * Math.sin(a)).toFixed(2) + '"/>';
    }).join("");

    return '<div class="ms-gauge ' + tierClass(routingStatus) + '"'
      + ' style="--ms-circ:' + GAUGE_C.toFixed(2) + ';--ms-off:' + off.toFixed(2) + '">'
      + '<svg class="ms-gauge-svg" viewBox="0 0 200 200" role="img" aria-label="'
      + escA(num(score, 0) + " / 100") + '">'
      + '<circle class="ms-gauge-track" cx="100" cy="100" r="' + GAUGE_R + '"/>'
      + '<circle class="ms-gauge-arc" cx="100" cy="100" r="' + GAUGE_R + '"/>'
      + ticks + "</svg>"
      + '<div class="ms-gauge-mid"><span class="ms-gauge-num">' + num(score, 0) + "</span>"
      + '<span class="ms-gauge-cap">' + esc(t("ms_gauge_caption")) + "</span></div>"
      + (verdictHtml === undefined
          ? '<div class="ms-gauge-verdict">' + esc(L(routingStatus)) + "</div>"
          : (verdictHtml || ""))
      + "</div>";
  }

  /* ---------- KPI plitkalari ---------- */
  function kpiTile(labelText, value, tone, note) {
    return '<div class="ms-kpi' + (tone ? " is-" + tone : "") + '">'
      + '<span class="ms-kpi-l">' + esc(labelText) + "</span>"
      + "<b>" + value + "</b>"
      + (note ? '<span class="ms-kpi-note">' + esc(note) + "</span>" : "")
      + "</div>";
  }

  /**
   * Sehrgar 3-bosqichi ham, natija sahifasi ham AYNAN shu plitkalarni
   * ko'rsatadi. Startup yo'lida bu ko'rsatkichlar ballga ta'sir
   * qilmaydi — shuning uchun rangsiz (tone = null) chiqadi, aks holda
   * foydalanuvchi qizil rangni jazo deb o'qiydi.
   */
  function kpiTiles(project, kpis) {
    const isStartup = project.passport.loyihaTuri === "startup";
    const ccy = project.passport.valyuta;
    const k = kpis || {};
    const tone = v => (isStartup ? null : v);
    const irrTone = k.irr == null ? tone("bad")
      : tone(k.irr >= k.hurdle + 4 ? "ok" : k.irr >= k.hurdle ? "warn" : "bad");
    const deTone = k.debtEbitda == null ? null
      : tone(k.debtEbitda <= 2.5 ? "ok" : k.debtEbitda <= 3 ? "warn" : "bad");
    const dsTone = k.dscrMin == null ? null
      : tone(k.dscrMin >= 1.5 ? "ok" : k.dscrMin >= 1.2 ? "warn" : "bad");

    const out = [
      kpiTile(t("ms_kpi_irr"), pct1(k.irr), irrTone,
        isStartup ? null : t("ms_kpi_threshold").replace("{v}", pct1(k.hurdle))),
      kpiTile(t("ms_kpi_npv"), k.npv == null ? "—" : money(k.npv, "") + ' <small>' + esc(ccy) + "</small>", null),
      kpiTile(t("ms_kpi_payback"), k.payback == null ? "—"
        : num(k.payback, 1) + ' <small>' + esc(t("ms_unit_years")) + "</small>"),
    ];
    if (!isStartup) {
      out.push(
        kpiTile(t("ms_kpi_debt_ebitda"), k.debtEbitda == null ? "—" : num(k.debtEbitda, 2), deTone,
          t("ms_kpi_max").replace("{v}", num(3, 2))),
        kpiTile(t("ms_kpi_dscr_min"), k.dscrMin == null ? "—" : num(k.dscrMin, 2), dsTone,
          t("ms_kpi_min").replace("{v}", num(1.2, 2))),
        kpiTile(t("ms_kpi_hurdle"), pct1(k.hurdle), null,
          ccy === "UZS" ? t("ms_kpi_hurdle_uzs") : t("ms_kpi_hurdle_fx"))
      );
    }
    return '<div class="ms-kpis">' + out.join("") + "</div>";
  }

  /* ---------- blok kartochkasi (ikki yo'lakli progress) ---------- */
  function blockCard(b) {
    const pct = b.max ? Math.round((b.score / b.max) * 100) : 0;
    const full = b.score === b.max;
    /* Qarz yuki bitta blok, ikkita yarim mezon — izohi ham ikkita. */
    const why = [reason(b.reason), b.reason2 ? reason(b.reason2) : ""].filter(Boolean).join(" ");
    return '<div class="ms-block' + (full ? " is-full" : "") + '">'
      + '<div class="ms-block-top"><span class="ms-block-name">' + esc(t(b.labelKey)) + "</span>"
      + '<span class="ms-block-val">' + num(b.score, 0) + "<i>/</i>" + num(b.max, 0) + "</span></div>"
      + '<div class="ms-block-bar"><i style="width:' + pct + '%"></i></div>'
      + '<p class="ms-block-why">' + why + "</p>"
      + "</div>";
  }

  /* ---------- sehrgar qadamlari ----------
     Tugmalar .ms-stepper ning BEVOSITA farzandi: bog'lovchi chiziq
     qo'shni-element (+) qoidasi bilan chiziladi, o'rab qo'yilsa uziladi. */
  function stepper(labels, current) {
    return '<nav class="ms-stepper" aria-label="' + escA(labels.join(" · ")) + '">'
      + labels.map((s, i) => {
        const n = i + 1;
        const cls = n < current ? "is-done" : n === current ? "is-now" : "is-todo";
        return '<button type="button" class="ms-step ' + cls + '" data-ms-step="' + n + '"'
          + (n === current ? ' aria-current="step"' : "") + ">"
          + '<span class="ms-step-n">' + (n < current ? "✓" : n) + "</span>"
          + '<span class="ms-step-t">' + esc(s) + "</span></button>";
      }).join("") + "</nav>";
  }

  /* ---------- to'xtatuvchi (knockout) paneli ---------- */
  function knockoutPanel(scoring) {
    if (!scoring.isKnockout) return "";
    const cap = core.CONFIG.knockout.capScore;
    const capLine = t("ms_res_raw_capped")
      .split("{raw}").join("<b>" + num(scoring.rawTotal, 0) + "</b>")
      .split("{cap}").join("<b>" + num(cap, 0) + "</b>");
    return '<div class="ms-knockout">'
      + '<div class="ms-knockout-head">' + esc(t("ms_res_ko_title")) + "</div>"
      + '<div class="ms-knockout-body"><ul class="ms-knockout-list">'
      + scoring.knockouts.map(k => "<li><b>" + esc(L(k)) + "</b></li>").join("")
      + '</ul><p class="ms-knockout-cap">' + capLine + "</p></div></div>";
  }

  /* ---------- institut kartochkasi ---------- */
  const MATCH_LABEL = {
    summa: "ms_match_summa", valyuta: "ms_match_valyuta", sektor: "ms_match_sektor",
    muddat: "ms_match_muddat", ball: "ms_match_ball",
  };
  function institutionCard(m) {
    const inst = m.inst;
    const failed = Object.keys(m.checks).filter(k => !m.checks[k]).map(k => t(MATCH_LABEL[k]));
    const sectors = (inst.sektorlar || []).length
      ? (inst.sektorlar || []).map(id => refName(REF.sectors, id)).filter(Boolean).join(", ")
      : t("ms_inst_all_sectors");
    const kv = (labelText, value) => "<div><dt>" + esc(labelText) + "</dt><dd>" + value + "</dd></div>";
    return '<article class="ms-inst' + (m.fullMatch ? " is-full" : "") + '">'
      + '<div class="ms-inst-head"><div><h4>' + esc(L(inst.nomi)) + "</h4>"
      + '<span class="ms-inst-type">' + esc(refName(core.CONFIG.institutionTypes, inst.turi) || inst.turi)
      + (inst.seed ? "" : " · " + esc(t("ms_inst_live"))) + "</span></div>"
      + '<span class="ms-inst-pct' + (m.fullMatch ? " is-full" : "") + '">' + m.matchPercent + "%</span></div>"
      + '<dl class="ms-inst-kv">'
      + kv(t("ms_inst_amount"), money(inst.min_summa, "") + " – " + money(inst.max_summa, "USD"))
      + kv(t("ms_inst_currency"), esc((inst.valyutalar || []).join(" · ")))
      + kv(t("ms_inst_sectors"), esc(sectors))
      + kv(t("ms_inst_terms"), esc(t("ms_inst_terms_value")
          .replace("{y}", num(inst.max_muddat, 0)).replace("{b}", num(inst.min_ball, 0))))
      + (inst.aloqa_email ? kv(t("ms_inst_contact"),
          '<a href="mailto:' + escA(inst.aloqa_email) + '">' + esc(inst.aloqa_email) + "</a>") : "")
      + "</dl>"
      + (failed.length ? '<p class="ms-inst-miss">'
          + esc(t("ms_inst_not_matched").replace("{list}", failed.join(", "))) + "</p>" : "")
      + "</article>";
  }

  /* ---------- audit-trail jadvali ---------- */
  function auditTable(rows) {
    const list = (rows || []).slice().reverse().slice(0, 15);
    if (!list.length) return '<p class="mk-note">' + esc(t("ms_res_no_records")) + "</p>";
    const head = [t("ms_col_time"), t("ms_col_user"), t("ms_col_field"), t("ms_col_old"), t("ms_col_new")];
    const trim = v => String(v == null ? "—" : v).slice(0, 60);
    return '<div class="mk-tablewrap"><table class="mk-table"><thead><tr>'
      + head.map(h => "<th>" + esc(h) + "</th>").join("") + "</tr></thead><tbody>"
      + list.map(a => "<tr>"
        + '<td class="num">' + esc(day(a.t)) + "</td>"
        + "<td>" + esc(a.user || "") + "</td>"
        + "<td>" + esc(a.field || "") + "</td>"
        + '<td title="' + escA(a.oldValue) + '">' + esc(trim(a.oldValue)) + "</td>"
        + '<td title="' + escA(a.newValue) + '">' + esc(trim(a.newValue)) + "</td>"
        + "</tr>").join("")
      + "</tbody></table></div>";
  }

  return {
    L, refName, sectorName, regionName, reason, tierClass,
    routingBadge, statusBadge, typeBadge,
    gauge, kpiTile, kpiTiles, blockCard, stepper,
    knockoutPanel, institutionCard, auditTable,
  };
})(MK, MSCORE);
