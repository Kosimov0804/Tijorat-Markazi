/* ============================================================
   MOLIYA BOZORI — form templates

   Split out of moliya.js purely for size: that file crossed the
   800-line ceiling this project keeps. These are the markup
   builders for the capital-market publish forms and the four
   cabinet panels. They are pure — given the kit helpers they
   return a string and touch nothing else — so they live behind
   one namespace object that moliya.js destructures.
   ============================================================ */
const ML_FORMS = (kit => {
const { $, $$, t, esc, escA, num, money, api, ident, meters, ranks, empty, loading, say } = kit;
let hooks = {};
/** moliya.js hands back the callbacks the forms need to call on submit. */
const bind = h => { hooks = h || {}; };

/* Publish forms for each capital segment. */
function capitalForm(seg){
  const F = (id, label, type) => `<div class="mk-f"><label>${esc(label)}</label>
    <input id="${id}" ${type ? `type="${type}"` : ""} /></div>`;
  const TA = (id, label) => `<div class="mk-f wide"><label>${esc(label)}</label><textarea id="${id}"></textarea></div>`;
  const head = `<h3>${esc(t("ml_publish_" + seg))}</h3>
    <p class="mk-note" style="margin-bottom:12px">${esc(t("ml_publish_hint"))}</p>`;

  if(seg === "projects") return head + `<form class="mk-form" id="mlCapF">
    ${F("cpName", t("ml_f_name"))}${F("cpSector", t("ml_f_sector"))}${F("cpRegion", t("ml_f_region"))}
    ${TA("cpSummary", t("ml_summary"))}
    ${F("cpCapex", "CAPEX", "number")}${F("cpOpex", "OPEX", "number")}${F("cpRevenue", t("ml_f_revenue"), "number")}
    <div class="mk-f"><label>${esc(t("ml_f_currency"))}</label><select id="cpCurrency"><option>USD</option><option>UZS</option><option>EUR</option></select></div>
    ${F("cpIrr", "IRR %", "number")}${F("cpNpv", "NPV", "number")}${F("cpDscr", "DSCR", "number")}
    ${F("cpAsk", t("ml_ask"), "number")}${F("cpJobs", t("ml_jobs"), "number")}
    ${TA("cpRisks", t("ml_risks"))}
    <div class="mk-actions wide"><button class="btn btn-primary" type="submit">${esc(t("ml_publish"))}</button>
      <p class="mk-msg" id="mlCapMsg" hidden></p></div></form>`;

  if(seg === "startups") return head + `<form class="mk-form" id="mlCapF">
    ${F("suName", t("ml_f_name"))}
    <div class="mk-f"><label>${esc(t("ml_stage"))}</label><select id="suStage">
      <option value="pre-seed">pre-seed</option><option value="seed">seed</option>
      <option value="growth">growth</option><option value="mature">mature</option></select></div>
    ${F("suSector", t("ml_f_sector"))}${F("suRegion", t("ml_f_region"))}
    ${TA("suPitch", "Pitch")}
    ${F("suMrr", "MRR", "number")}${F("suUsers", t("ml_users"), "number")}${F("suGrowth", t("ml_growth") + " %", "number")}
    ${F("suRunway", "Runway (" + t("ml_months") + ")", "number")}${F("suAsk", t("ml_ask"), "number")}
    <div class="mk-f"><label>${esc(t("ml_f_currency"))}</label><select id="suCurrency"><option>USD</option><option>UZS</option></select></div>
    ${F("suValuation", t("ml_valuation"), "number")}${F("suDeck", "Deck URL")}
    <div class="mk-actions wide"><button class="btn btn-primary" type="submit">${esc(t("ml_publish"))}</button>
      <p class="mk-msg" id="mlCapMsg" hidden></p></div></form>`;

  if(seg === "investors") return head + `<form class="mk-form" id="mlCapF">
    ${F("ivName", t("ml_f_name"))}
    <div class="mk-f"><label>${esc(t("ml_inv_type"))}</label><select id="ivType">
      ${["angel","vc","pe","strategic","family","institutional","dfi"].map(x =>
        `<option value="${x}">${esc(t("ml_inv_" + x, x))}</option>`).join("")}</select></div>
    ${F("ivMin", t("ml_ticket_min"), "number")}${F("ivMax", t("ml_ticket_max"), "number")}
    <div class="mk-f"><label>${esc(t("ml_f_currency"))}</label><select id="ivCurrency"><option>USD</option><option>UZS</option><option>EUR</option></select></div>
    ${F("ivSectors", t("ml_sectors"))}${F("ivGeos", t("ml_geos"))}
    <div class="mk-f wide"><label>${esc(t("ml_stage"))}</label><div class="mk-checks">
      ${["pre-seed","seed","growth","mature","project"].map(x =>
        `<label><input type="checkbox" class="ivStage" value="${x}" /> ${x}</label>`).join("")}</div></div>
    <div class="mk-f wide"><label>${esc(t("ml_instrument"))}</label><div class="mk-checks">
      ${["equity","convertible","mezzanine","debt","jv","project-equity"].map(x =>
        `<label><input type="checkbox" class="ivInstr" value="${x}" /> ${x}</label>`).join("")}</div></div>
    ${TA("ivThesis", t("ml_thesis"))}
    <div class="mk-actions wide"><button class="btn btn-primary" type="submit">${esc(t("ml_publish"))}</button>
      <p class="mk-msg" id="mlCapMsg" hidden></p></div></form>`;

  return head + `<form class="mk-form" id="mlCapF">
    ${F("idTitle", t("ml_f_title"))}${F("idSector", t("ml_f_sector"))}
    ${TA("idTeaser", t("ml_teaser"))}
    ${TA("idConfidential", t("ml_confidential") + " (NDA)")}
    <div class="mk-f"><label>${esc(t("ml_model"))}</label><select id="idModel">
      ${["sale","license","royalty","equity","codev","bounty"].map(x =>
        `<option value="${x}">${esc(t("ml_idea_" + x, x))}</option>`).join("")}</select></div>
    ${F("idPrice", t("ml_price"), "number")}
    <div class="mk-f"><label>${esc(t("ml_f_currency"))}</label><select id="idCurrency"><option>USD</option><option>UZS</option></select></div>
    ${F("idIp", "IP status")}
    ${TA("idTerms", t("ml_terms"))}
    <div class="mk-actions wide"><button class="btn btn-primary" type="submit">${esc(t("ml_publish"))}</button>
      <p class="mk-msg" id="mlCapMsg" hidden></p></div>
    <p class="mk-note wide">${esc(t("ml_idea_publish_note"))}</p></form>`;
}

function wireCapitalForm(seg){
  const f = $("#mlCapF");
  if(!f) return;
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const msg = $("#mlCapMsg");
    const v = id => { const el = $("#" + id); return el ? el.value : ""; };
    let path, body;
    if(seg === "projects"){
      path = "/api/moliya/project";
      body = { name: v("cpName"), sector: v("cpSector"), region: v("cpRegion"), summary: v("cpSummary"),
        capex: v("cpCapex"), opex: v("cpOpex"), revenue: v("cpRevenue"), currency: v("cpCurrency"),
        irr: v("cpIrr"), npv: v("cpNpv"), dscr: v("cpDscr"), ask: v("cpAsk"), jobs: v("cpJobs"), risks: v("cpRisks") };
    } else if(seg === "startups"){
      path = "/api/moliya/startup";
      body = { name: v("suName"), stage: v("suStage"), sector: v("suSector"), region: v("suRegion"),
        pitch: v("suPitch"), mrr: v("suMrr"), users: v("suUsers"), growth: v("suGrowth"),
        runway: v("suRunway"), ask: v("suAsk"), currency: v("suCurrency"),
        valuation: v("suValuation"), deck: v("suDeck") };
    } else if(seg === "investors"){
      path = "/api/moliya/investor";
      body = { name: v("ivName"), type: v("ivType"), ticketMin: v("ivMin"), ticketMax: v("ivMax"),
        currency: v("ivCurrency"), sectors: v("ivSectors"), geos: v("ivGeos"), thesis: v("ivThesis"),
        stages: $$(".ivStage").filter(x => x.checked).map(x => x.value),
        instruments: $$(".ivInstr").filter(x => x.checked).map(x => x.value) };
    } else {
      path = "/api/moliya/idea";
      body = { title: v("idTitle"), sector: v("idSector"), teaser: v("idTeaser"),
        confidential: v("idConfidential"), model: v("idModel"), price: v("idPrice"),
        currency: v("idCurrency"), ipStatus: v("idIp"), terms: v("idTerms") };
    }
    const r = await api(path, ident.co(ident.me(body)));
    if(!r.ok) return say(msg, r.error === "identify_first" ? t("ml_need_email") : t("ml_save_fail"), "err");
    say(msg, t("ml_save_ok"), "ok");
    f.reset();
    if(hooks.reloadCapital) hooks.reloadCapital();
  });
}

const passportFormHtml = p => {
  const v = k => (p && p[k] != null && p[k] !== 0 ? p[k] : "");
  return `<h3>${esc(t("ml_passport_edit"))}</h3>
  <form class="mk-form" id="mlPassForm">
    <div class="mk-f"><label>${esc(t("ml_f_name"))}</label><input id="fpName" value="${escA(p ? p.ownerName : ident.name())}" /></div>
    <div class="mk-f"><label>${esc(t("ml_f_sector"))}</label><input id="fpSector" value="${escA(v("sector"))}" /></div>
    <div class="mk-f"><label>${esc(t("ml_f_region"))}</label><input id="fpRegion" value="${escA(v("region"))}" /></div>
    <div class="mk-f"><label>${esc(t("ml_legal"))}</label><input id="fpLegal" value="${escA(v("legalForm"))}" /></div>
    <div class="mk-f"><label>${esc(t("ml_founded"))}</label><input id="fpFounded" type="number" value="${escA(v("founded"))}" /></div>
    <div class="mk-f"><label>${esc(t("ml_employees"))}</label><input id="fpEmployees" type="number" value="${escA(v("employees"))}" /></div>
    <div class="mk-f"><label>${esc(t("ml_f_revenue"))}</label><input id="fpRevenue" type="number" value="${escA(v("revenue"))}" /></div>
    <div class="mk-f"><label>EBITDA</label><input id="fpEbitda" type="number" value="${escA(v("ebitda"))}" /></div>
    <div class="mk-f"><label>${esc(t("ml_f_currency"))}</label><select id="fpCurrency"><option>UZS</option><option>USD</option><option>EUR</option></select></div>
    <div class="mk-f"><label>${esc(t("ml_need"))}</label><input id="fpNeed" type="number" value="${escA(v("need"))}" /></div>
    <div class="mk-f"><label>${esc(t("ml_f_tenor"))}</label><input id="fpTenor" type="number" value="${escA(v("tenor"))}" /></div>
    <div class="mk-f"><label>${esc(t("ml_collateral_value"))}</label><input id="fpCollValue" type="number" value="${escA(v("collateralValue"))}" /></div>
    <div class="mk-f wide"><label>${esc(t("ml_f_purpose"))}</label><textarea id="fpPurpose">${esc(v("purpose"))}</textarea></div>
    <div class="mk-f wide"><label>${esc(t("ml_f_collateral"))}</label><input id="fpCollateral" value="${escA(v("collateral"))}" /></div>
    <div class="mk-f wide"><label>${esc(t("ml_docs"))}</label><input id="fpDocs" value="${escA((p && p.docs || []).join(", "))}" /></div>
    <div class="mk-f wide"><label>${esc(t("ml_risks"))}</label><textarea id="fpRisks">${esc(v("risks"))}</textarea></div>
    <div class="mk-actions wide"><button class="btn btn-primary" type="submit">${esc(t("ml_save"))}</button>
      <p class="mk-msg" id="mlPassMsg" hidden></p></div>
    <p class="mk-note wide">${esc(t("ml_passport_note"))}</p>
  </form>`;
};

const providerFormHtml = () => `
  <h3 style="margin-top:14px">${esc(t("ml_add_product"))}</h3>
  <form class="mk-form" id="mlProdForm">
    <div class="mk-f"><label>${esc(t("ml_f_name"))}</label><input id="mpName" required /></div>
    <div class="mk-f"><label>${esc(t("ml_f_category"))}</label><select id="mpCategory">
      ${["banking","nobank","insurance","fintech","equity","islamic","development"].map(c =>
        `<option value="${c}">${esc(t("ml_cat_" + c, c))}</option>`).join("")}</select></div>
    <div class="mk-f"><label>${esc(t("ml_instrument"))}</label><input id="mpInstrument" /></div>
    <div class="mk-f wide"><label>${esc(t("ml_summary"))}</label><textarea id="mpSummary"></textarea></div>
    <div class="mk-f"><label>${esc(t("ml_min"))}</label><input id="mpMin" type="number" /></div>
    <div class="mk-f"><label>${esc(t("ml_max"))}</label><input id="mpMax" type="number" /></div>
    <div class="mk-f"><label>${esc(t("ml_f_currency"))}</label><select id="mpCurrency"><option>UZS</option><option>USD</option><option>EUR</option><option>RUB</option></select></div>
    <div class="mk-f"><label>${esc(t("ml_tenor_min"))}</label><input id="mpTenorMin" type="number" /></div>
    <div class="mk-f"><label>${esc(t("ml_tenor_max"))}</label><input id="mpTenorMax" type="number" /></div>
    <div class="mk-f"><label>${esc(t("ml_rate"))}</label><input id="mpRate" placeholder="22-26%" /></div>
    <div class="mk-f"><label>${esc(t("ml_fee"))}</label><input id="mpFee" /></div>
    <div class="mk-f"><label>SLA (${esc(t("ml_days"))})</label><input id="mpSla" type="number" /></div>
    <div class="mk-f wide"><label>${esc(t("ml_f_collateral"))}</label><input id="mpCollateral" /></div>
    <div class="mk-f wide"><label>${esc(t("ml_eligibility"))}</label><textarea id="mpEligibility"></textarea></div>
    <div class="mk-f wide"><label>${esc(t("ml_docs"))}</label><input id="mpDocs" /></div>
    <div class="mk-f wide"><label>${esc(t("ml_licence"))}</label><input id="mpLicence" /></div>
    <div class="mk-f wide"><div class="mk-checks"><label><input type="checkbox" id="mpSharia" /> ${esc(t("ml_only_sharia"))}</label></div></div>
    <div class="mk-actions wide"><button class="btn btn-primary" type="submit">${esc(t("ml_publish"))}</button>
      <p class="mk-msg" id="mlProdMsg" hidden></p></div>
  </form>`;

const stackHtml = () => `
  <h3>${esc(t("ml_stack"))}</h3>
  <p class="mk-note" style="margin-bottom:12px">${esc(t("ml_stack_hint"))}</p>
  <form class="mk-form" id="mlStackForm">
    <div class="mk-f"><label>${esc(t("ml_f_amount"))}</label><input id="csAmount" type="number" required /></div>
    <div class="mk-f"><label>${esc(t("ml_f_currency"))}</label><select id="csCurrency"><option>USD</option><option>UZS</option><option>EUR</option></select></div>
    <div class="mk-f"><label>EBITDA</label><input id="csEbitda" type="number" /></div>
    <div class="mk-f"><label>${esc(t("ml_receivables"))}</label><input id="csReceivables" type="number" /></div>
    <div class="mk-f wide"><div class="mk-checks">
      <label><input type="checkbox" id="csCollateral" /> ${esc(t("ml_has_collateral"))}</label>
      <label><input type="checkbox" id="csExporter" /> ${esc(t("ml_is_exporter"))}</label>
      <label><input type="checkbox" id="csEquipment" /> ${esc(t("ml_buys_equipment"))}</label>
      <label><input type="checkbox" id="csSharia" /> ${esc(t("ml_only_sharia"))}</label>
    </div></div>
    <div class="mk-actions wide"><button class="btn btn-primary" type="submit">${esc(t("ml_stack_go"))}</button></div>
  </form>
  <div id="mlStackOut"></div>`;

const investorReadyHtml = () => `
  <div class="mk-ai">
    <h3>${esc(t("ml_ir_title"))}</h3>
    <p style="font-size:13.5px;color:var(--text)">${esc(t("ml_ir_hint"))}</p>
    <textarea id="mlIrText" style="width:100%;min-height:110px;padding:10px 12px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--card);color:var(--ink);font:inherit"
      placeholder="${escA(t("ml_ir_ph"))}"></textarea>
    <div class="mk-row">
      <input id="mlIrAsk" type="number" placeholder="${escA(t("ml_ask"))}" style="padding:9px 12px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--card);color:var(--ink);font:inherit;max-width:170px" />
      <input id="mlIrSector" placeholder="${escA(t("ml_f_sector"))}" style="padding:9px 12px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--card);color:var(--ink);font:inherit;max-width:190px" />
      <button class="btn btn-primary" type="button" id="mlIrGo">${esc(t("ml_ir_go"))}</button>
    </div>
    <div id="mlIrOut"></div>
  </div>`;

return { bind, capitalForm, wireCapitalForm, passportFormHtml, providerFormHtml, stackHtml, investorReadyHtml };
})(MK);
