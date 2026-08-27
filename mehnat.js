/* ============================================================
   HUMAN CAPITAL MARKAZI — client
   Jobs · Talent · Candidate passport · Recruitment OS · LMI
   ============================================================ */
(() => {
const { $, $$, t, esc, escA, num, money, pctTxt, day, api, qs, ident, chip, chips,
        match, meters, ranks, kpi, funnel, draft, empty, loading, say,
        tabs, segment, drawer, closeDrawer, applyStatic, chrome } = MK;

MK.setDict(typeof T_MEHNAT !== "undefined" ? T_MEHNAT : {});

const state = { meta: null, jobs: [], talent: [], vacancies: [], stages: [] };

async function meta(){
  if(!state.meta){
    state.meta = await api("/api/mehnat/meta");
    state.stages = state.meta.stages || [];
  }
  return state.meta;
}

const salaryTxt = (min, max, cur) => (min || max)
  ? `${money(min, "")}${max && max !== min ? " – " + money(max, cur) : " " + esc(cur || "")}`
  : t("hc_salary_hidden");

/* ---------- jobs ---------- */
async function loadJobs(){
  const grid = $("#hcGrid");
  grid.innerHTML = loading();
  const r = await api("/api/mehnat/jobs?" + qs({
    q: $("#hcQ").value.trim(), region: $("#hcRegion").value,
    seniority: $("#hcSeniority").value, format: $("#hcFormat").value, salaryMin: $("#hcSalary").value,
  }));
  state.jobs = r.items || [];
  if(r.facets) fillJobFacets(r.facets);
  $("#hcCount").textContent = t("hc_count").replace("{n}", num(r.total || 0, 0));
  grid.innerHTML = state.jobs.length ? state.jobs.map(jobCard).join("") : empty(t("hc_empty"));
}

let jobFacetsDone = false;
function fillJobFacets(f){
  if(jobFacetsDone) return;
  jobFacetsDone = true;
  const put = (sel, values, allKey, label) => {
    const el = $(sel); if(!el) return;
    el.innerHTML = `<option value="">${esc(t(allKey))}</option>` +
      (values || []).map(v => `<option value="${escA(v)}">${esc(label ? label(v) : v)}</option>`).join("");
  };
  put("#hcRegion", f.regions, "hc_all_regions");
  put("#hcSeniority", f.seniority, "hc_all_levels", v => t("hc_sen_" + v, v));
  put("#hcFormat", f.formats, "hc_all_formats", v => t("hc_fmt_" + v, v));
}

function jobCard(v){
  return `<article class="mk-card" data-job="${escA(v.id)}" tabindex="0" role="button">
    <div class="mk-chips">
      ${chip(t("hc_sen_" + v.seniority, v.seniority), "accent")}
      ${chip(t("hc_fmt_" + v.format, v.format), "ghost")}
      ${v.headcount > 1 ? chip(v.headcount + " " + t("hc_seats"), "ghost") : ""}
    </div>
    <h3>${esc(v.title)}</h3>
    ${v.summary ? `<p class="mk-desc">${esc(v.summary)}</p>` : ""}
    <div class="mk-meta">
      <span>${esc(v.companyName)}</span>
      ${v.region ? `<span>📍 <b>${esc(v.region)}</b></span>` : ""}
      ${v.applicants ? `<span>${esc(t("hc_applicants"))} <b>${num(v.applicants, 0)}</b></span>` : ""}
    </div>
    ${chips((v.skillsRequired || []).slice(0, 4), "ghost")}
    <div class="mk-card-foot">
      <span class="mk-price" style="font-size:16px">${salaryTxt(v.salaryMin, v.salaryMax, v.currency)}</span>
      <span style="font-size:12px;color:var(--muted)">${day(v.created)}</span>
    </div>
  </article>`;
}

async function openJob(id){
  const v = state.jobs.find(x => x.id === id);
  if(!v) return;
  let mine = null;
  if(ident.email()){
    const m = await api("/api/mehnat/matches", ident.me({ limit: 100 }));
    if(m.ok) mine = (m.matches || []).find(x => x.vacancy.id === id);
  }
  const rows = [
    [t("hc_occupation"), v.occupation], [t("hc_duties"), v.duties],
    [t("hc_req_skills"), (v.skillsRequired || []).join(", ")],
    [t("hc_pref_skills"), (v.skillsPreferred || []).join(", ")],
    [t("hc_languages"), (v.languages || []).join(", ")],
    [t("hc_certs"), (v.certificates || []).join(", ")],
    [t("hc_years"), v.yearsMin ? v.yearsMin + "+" : ""],
    [t("hc_employment"), t("hc_emp_" + v.employment, v.employment)],
    [t("hc_deadline"), v.deadline], [t("hc_contact"), v.contact],
  ].filter(r => r[1]).map(r => `<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join("");

  drawer(`
    <div class="mk-chips">${chip(t("hc_sen_" + v.seniority, v.seniority), "accent")}
      ${chip(t("hc_fmt_" + v.format, v.format), "ghost")}</div>
    <div class="mk-meta" style="font-size:14px"><span><b>${esc(v.companyName)}</b></span>
      ${v.region ? `<span>📍 ${esc(v.region)}</span>` : ""}</div>
    <div class="mk-price" style="font-size:22px">${salaryTxt(v.salaryMin, v.salaryMax, v.currency)}</div>
    ${v.summary ? `<p class="mk-desc" style="-webkit-line-clamp:99">${esc(v.summary)}</p>` : ""}
    <dl class="mk-kv">${rows}</dl>
    ${mine ? `<h3 class="mk-h">${esc(t("hc_your_fit"))}</h3>${match(mine, "",
        `<div class="mk-meta" style="margin-top:6px">
          <span>${esc(t("hc_employer_score"))} <b>${num(mine.employerScore, 0)}%</b></span>
          <span>${esc(t("hc_candidate_score"))} <b>${num(mine.candidateScore, 0)}%</b></span></div>`)}` : ""}
    <div class="mk-actions">
      ${mine && mine.applied
        ? `<span class="mk-chip is-good">${esc(t("hc_applied"))}</span>`
        : `<button class="btn btn-primary" type="button" id="hcApply">${esc(t("hc_apply"))}</button>`}
      <button class="btn btn-ghost" type="button" id="hcCoach">${esc(t("hc_interview_kit"))}</button>
    </div>
    <p class="mk-msg" id="hcApplyMsg" hidden></p>
    <div id="hcCoachOut"></div>`, v.title);

  const ap = $("#hcApply");
  if(ap) ap.addEventListener("click", async () => {
    if(!ident.email()) return say($("#hcApplyMsg"), t("hc_need_email"), "err");
    const r = await api("/api/mehnat/apply", ident.me({ vacancyId: id, source: "search" }));
    if(!r.ok) return say($("#hcApplyMsg"),
      r.error === "profile_required" ? t("hc_need_profile")
      : r.error === "already_applied" ? t("hc_already") : t("hc_apply_fail"), "err");
    say($("#hcApplyMsg"), t("hc_apply_ok"), "ok");
    ap.remove();
  });

  const ck = $("#hcCoach");
  if(ck) ck.addEventListener("click", async () => {
    const out = $("#hcCoachOut");
    out.innerHTML = loading();
    const r = await api("/api/copilot", ident.me({ agent: "mehnat.interview", lang: MK.lang(),
      vacancy: `${v.title}\n${v.summary}\n${v.duties}\n${(v.skillsRequired || []).join(", ")}` }));
    out.innerHTML = draft(r, [
      { label: t("hc_competencies"), html: true, get: d => (d.competencies || []).length
        ? "<ul style='margin-left:16px'>" + d.competencies.map(c =>
            `<li><b>${esc(c.name)}</b> — ${esc(c.whyItMatters)}</li>`).join("") + "</ul>" : "" },
      { label: t("hc_questions"), html: true, get: d => (d.questions || []).length
        ? "<ol style='margin-left:16px'>" + d.questions.map(q =>
            `<li>${esc(q.q)}<br><small style="color:var(--muted)">✓ ${esc(q.lookFor)}${q.redFlag ? " · ⚠ " + esc(q.redFlag) : ""}</small></li>`).join("") + "</ol>" : "" },
      { label: t("hc_prep"), get: d => (d.candidatePrep || []).join(" · ") },
    ]);
  });
}

/* ---------- talent ---------- */
async function loadTalent(){
  const grid = $("#hcTgrid");
  grid.innerHTML = loading();
  const r = await api("/api/mehnat/talent?" + qs({
    q: $("#hcTq").value.trim(), region: $("#hcTregion").value,
    seniority: $("#hcTsen").value, availability: $("#hcTavail").value,
  }));
  state.talent = r.items || [];
  if(r.facets) fillTalentFacets(r.facets);
  $("#hcTcount").textContent = t("hc_t_count").replace("{n}", num(r.total || 0, 0));
  grid.innerHTML = state.talent.length ? state.talent.map(talentCard).join("") : empty(t("hc_t_empty"));
}

let talentFacetsDone = false;
function fillTalentFacets(f){
  if(talentFacetsDone) return;
  talentFacetsDone = true;
  const put = (sel, values, allKey, label) => {
    const el = $(sel); if(!el) return;
    el.innerHTML = `<option value="">${esc(t(allKey))}</option>` +
      (values || []).map(v => `<option value="${escA(v)}">${esc(label ? label(v) : v)}</option>`).join("");
  };
  put("#hcTregion", f.regions, "hc_all_regions");
  put("#hcTsen", f.seniority, "hc_all_levels", v => t("hc_sen_" + v, v));
  put("#hcTavail", f.availability, "hc_all_avail", v => t("hc_av_" + v, v));
}

const talentCard = c => `<article class="mk-card">
    <div class="mk-chips">
      ${chip(t("hc_sen_" + c.seniority, c.seniority), "accent")}
      ${chip(t("hc_av_" + c.availability, c.availability), c.availability === "active" ? "good" : "ghost")}
      ${c.visibility === "anonymous" ? chip(t("hc_anon"), "warn") : ""}
      ${c.verified ? chip(t("hc_verified"), "good") : ""}
    </div>
    <h3>${esc(c.name)}</h3>
    ${c.headline ? `<p class="mk-desc">${esc(c.headline)}</p>` : ""}
    <div class="mk-meta">
      ${c.occupation ? `<span><b>${esc(c.occupation)}</b></span>` : ""}
      ${c.region ? `<span>📍 ${esc(c.region)}</span>` : ""}
      ${c.years ? `<span>${num(c.years, 0)} ${esc(t("hc_yrs"))}</span>` : ""}
    </div>
    ${chips((c.skills || []).slice(0, 5), "ghost")}
    <div class="mk-card-foot">
      <span class="mk-price" style="font-size:15px">${salaryTxt(c.expectedMin, c.expectedMax, c.currency)}</span>
      ${c.relocate ? `<span class="mk-chip is-ghost">${esc(t("hc_relocate"))}</span>` : ""}
    </div></article>`;

/* ---------- candidate cabinet ---------- */
function renderId(){
  $("#hcId").innerHTML = `
    <span>${esc(t("hc_id_email"))}</span>
    <input id="hcEmail" type="email" value="${escA(ident.email())}" placeholder="ism@email.uz" />
    <input id="hcName" value="${escA(ident.name())}" placeholder="${escA(t("hc_f_name"))}" />
    <span class="mk-id-r"><button class="btn btn-primary" type="button" id="hcIdSave">${esc(t("hc_save"))}</button></span>`;
  $("#hcIdSave").addEventListener("click", () => {
    const em = $("#hcEmail").value.trim();
    if(!em.includes("@")) return say($("#hcId"), t("hc_need_email"), "err");
    ident.setPerson(em, $("#hcName").value.trim());
    renderMe();
  });
}

async function renderMe(){
  const host = $("#hcMe");
  if(!ident.email()){ host.innerHTML = empty(t("hc_need_email")); return; }
  host.innerHTML = loading();
  const [p, m, apps] = await Promise.all([
    api("/api/mehnat/candidate", ident.me({ op: "get" })),
    api("/api/mehnat/matches", ident.me({ limit: 12 })),
    api("/api/mehnat/applications", ident.me({})),
  ]);
  const c = p.candidate;

  const matchHtml = (m.matches || []).map(x => match(x,
    `${esc(x.vacancy.title)} — <span style="color:var(--muted);font-weight:500">${esc(x.vacancy.companyName)}</span>`,
    `<div class="mk-meta" style="margin-top:6px">
      <span>${salaryTxt(x.vacancy.salaryMin, x.vacancy.salaryMax, x.vacancy.currency)}</span>
      <span>${esc(t("hc_candidate_score"))} <b>${num(x.candidateScore, 0)}%</b></span>
      ${x.applied ? `<span class="mk-chip is-good">${esc(t("hc_applied"))}</span>`
        : `<button class="btn btn-ghost" type="button" data-apply="${escA(x.vacancy.id)}" style="padding:4px 12px;font-size:13px">${esc(t("hc_apply"))}</button>`}
    </div>`)).join("");

  const appHtml = (apps.items || []).map(a => `
    <div class="mk-card" style="gap:8px">
      <div class="mk-chips">${chip(t("stage_" + a.stage), a.stage === "hired" ? "good" : a.stage === "rejected" ? "bad" : "accent")}</div>
      <h3>${esc(a.vacancyTitle)}</h3>
      <div class="mk-meta"><span>${a.vacancy ? esc(a.vacancy.companyName) : ""}</span>
        <span>${esc(t("hc_match"))} <b>${num(a.score, 0)}%</b></span></div>
      ${a.stage === "offer" ? `<div class="mk-actions">
        <button class="btn btn-primary" type="button" data-accept="${escA(a.id)}" style="padding:6px 14px">${esc(t("hc_accept"))}</button>
        <button class="btn btn-ghost" type="button" data-decline="${escA(a.id)}" style="padding:6px 14px">${esc(t("hc_decline"))}</button>
        ${a.salary ? `<span class="mk-chip is-accent">${money(a.salary, a.currency)}</span>` : ""}
      </div>` : ""}
    </div>`).join("");

  host.innerHTML = `<div class="mk-bento">
      <div class="mk-box w6 is-lead">${profileFormHtml(c)}</div>
      <div class="mk-box w6">${cvBlockHtml()}${careerBlockHtml()}</div>
      <div class="mk-box w7"><h3>${esc(t("hc_my_matches"))}</h3>
        <div class="mk-stack">${matchHtml || empty(t("hc_no_matches"))}</div></div>
      <div class="mk-box w5"><h3>${esc(t("hc_my_apps"))}</h3>
        <div class="mk-stack">${appHtml || empty(t("hc_no_apps"))}</div></div>
    </div>`;
  // w7/w5 are not in the CSS grid vocabulary — normalise to the supported spans
  $$(".mk-box.w7", host).forEach(b => { b.classList.remove("w7"); b.classList.add("w8"); });
  $$(".mk-box.w5", host).forEach(b => { b.classList.remove("w5"); });
  wireMe();
  applyStatic();
}

function profileFormHtml(c){
  const v = k => (c && c[k] != null && c[k] !== 0 ? c[k] : "");
  const list = k => (c && c[k] || []).join(", ");
  const sel = (id, label, opts, cur, pre) => `<div class="mk-f"><label>${esc(label)}</label>
    <select id="${id}">${opts.map(o =>
      `<option value="${o}"${cur === o ? " selected" : ""}>${esc(t(pre + o, o))}</option>`).join("")}</select></div>`;
  return `<h3>${esc(t("hc_passport"))}</h3>
  <form class="mk-form" id="hcProfileForm">
    <div class="mk-f"><label>${esc(t("hc_f_name"))}</label><input id="cdName" value="${escA(c ? c.name : ident.name())}" required /></div>
    <div class="mk-f"><label>${esc(t("hc_occupation"))}</label><input id="cdOcc" value="${escA(v("occupation"))}" /></div>
    <div class="mk-f wide"><label>${esc(t("hc_headline"))}</label><input id="cdHeadline" value="${escA(v("headline"))}" /></div>
    <div class="mk-f"><label>${esc(t("hc_region"))}</label><input id="cdRegion" value="${escA(v("region"))}" /></div>
    ${sel("cdSeniority", t("hc_level"), ["intern","junior","middle","senior","lead","head"], v("seniority") || "middle", "hc_sen_")}
    <div class="mk-f"><label>${esc(t("hc_years"))}</label><input id="cdYears" type="number" min="0" value="${escA(v("years"))}" /></div>
    ${sel("cdAvail", t("hc_availability"), ["active","open","passive","unavailable"], v("availability") || "open", "hc_av_")}
    <div class="mk-f"><label>${esc(t("hc_exp_min"))}</label><input id="cdMin" type="number" min="0" value="${escA(v("expectedMin"))}" /></div>
    <div class="mk-f"><label>${esc(t("hc_exp_max"))}</label><input id="cdMax" type="number" min="0" value="${escA(v("expectedMax"))}" /></div>
    <div class="mk-f"><label>${esc(t("hc_currency"))}</label><select id="cdCurrency">
      <option${v("currency") === "UZS" ? " selected" : ""}>UZS</option>
      <option${v("currency") === "USD" ? " selected" : ""}>USD</option></select></div>
    <div class="mk-f wide"><label>${esc(t("hc_skills"))}</label><input id="cdSkills" value="${escA(list("skills"))}" placeholder="IFRS, Excel, SQL" /></div>
    <div class="mk-f"><label>${esc(t("hc_languages"))}</label><input id="cdLangs" value="${escA(list("languages"))}" /></div>
    <div class="mk-f"><label>${esc(t("hc_certs"))}</label><input id="cdCerts" value="${escA(list("certificates"))}" /></div>
    <div class="mk-f wide"><label>${esc(t("hc_education"))}</label><input id="cdEdu" value="${escA(v("education"))}" /></div>
    <div class="mk-f wide"><label>${esc(t("hc_experience"))}</label><textarea id="cdExp">${esc(v("experience"))}</textarea></div>
    <div class="mk-f wide"><label>Portfolio URL</label><input id="cdPortfolio" value="${escA(v("portfolio"))}" /></div>
    <div class="mk-f wide"><label>${esc(t("hc_formats"))}</label><div class="mk-checks">
      ${["onsite","hybrid","remote"].map(f => `<label><input type="checkbox" class="cdFmt" value="${f}"${
        (c && (c.formats || []).includes(f)) ? " checked" : ""} /> ${esc(t("hc_fmt_" + f, f))}</label>`).join("")}
      <label><input type="checkbox" id="cdRelocate"${c && c.relocate ? " checked" : ""} /> ${esc(t("hc_relocate"))}</label>
    </div></div>
    ${sel("cdVisibility", t("hc_visibility"), ["public","applied-only","anonymous","hidden"], v("visibility") || "public", "hc_vis_")}
    <div class="mk-actions wide"><button class="btn btn-primary" type="submit">${esc(t("hc_save"))}</button>
      <p class="mk-msg" id="hcProfMsg" hidden></p></div>
    <p class="mk-note wide">${esc(t("hc_privacy_note"))}</p>
  </form>`;
}

const cvBlockHtml = () => `<div class="mk-ai" style="margin-bottom:var(--mk-gap)">
    <h3>${esc(t("hc_cv_title"))}</h3>
    <p style="font-size:13.5px;color:var(--text)">${esc(t("hc_cv_hint"))}</p>
    <textarea id="hcCvText" style="width:100%;min-height:110px;padding:10px 12px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--card);color:var(--ink);font:inherit"
      placeholder="${escA(t("hc_cv_ph"))}"></textarea>
    <div class="mk-actions">
      <button class="btn btn-primary" type="button" id="hcCvGo">${esc(t("hc_cv_go"))}</button>
      <button class="btn btn-ghost" type="button" id="hcCvApply" hidden>${esc(t("hc_cv_apply"))}</button>
    </div>
    <div id="hcCvOut"></div></div>`;

const careerBlockHtml = () => `<div class="mk-ai">
    <h3>${esc(t("hc_career_title"))}</h3>
    <p style="font-size:13.5px;color:var(--text)">${esc(t("hc_career_hint"))}</p>
    <div class="mk-row">
      <input id="hcTarget" placeholder="${escA(t("hc_target_role"))}" style="flex:1 1 220px;padding:10px 12px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--card);color:var(--ink);font:inherit" />
      <button class="btn btn-primary" type="button" id="hcCareerGo">${esc(t("hc_career_go"))}</button>
    </div>
    <div id="hcCareerOut"></div></div>`;

function wireMe(){
  const host = $("#hcMe");

  const f = $("#hcProfileForm");
  if(f) f.addEventListener("submit", async e => {
    e.preventDefault();
    const msg = $("#hcProfMsg");
    ident.setPerson(ident.email(), $("#cdName").value.trim());
    const r = await api("/api/mehnat/candidate", ident.me({
      headline: $("#cdHeadline").value, region: $("#cdRegion").value, occupation: $("#cdOcc").value,
      seniority: $("#cdSeniority").value, years: $("#cdYears").value, skills: $("#cdSkills").value,
      languages: $("#cdLangs").value, certificates: $("#cdCerts").value, education: $("#cdEdu").value,
      experience: $("#cdExp").value, portfolio: $("#cdPortfolio").value,
      expectedMin: $("#cdMin").value, expectedMax: $("#cdMax").value, currency: $("#cdCurrency").value,
      availability: $("#cdAvail").value, visibility: $("#cdVisibility").value,
      relocate: $("#cdRelocate").checked,
      formats: $$(".cdFmt").filter(x => x.checked).map(x => x.value) }));
    if(!r.ok) return say(msg, t("hc_save_fail"), "err");
    say(msg, t("hc_save_ok"), "ok");
    renderMe();
  });

  const cv = $("#hcCvGo");
  if(cv) cv.addEventListener("click", async () => {
    const out = $("#hcCvOut");
    const text = $("#hcCvText").value.trim();
    if(!text) return say(out, t("hc_cv_need"), "err");
    out.innerHTML = loading();
    const r = await api("/api/copilot", ident.me({ agent: "mehnat.cv", lang: MK.lang(), text }));
    out.innerHTML = draft(r, [
      { label: t("hc_f_name"), get: d => d.name }, { label: t("hc_headline"), get: d => d.headline },
      { label: t("hc_occupation"), get: d => d.occupation }, { label: t("hc_region"), get: d => d.region },
      { label: t("hc_level"), get: d => d.seniority }, { label: t("hc_years"), get: d => d.years },
      { label: t("hc_skills"), get: d => (d.skills || []).join(", ") },
      { label: t("hc_languages"), get: d => (d.languages || []).join(", ") },
      { label: t("hc_certs"), get: d => (d.certificates || []).join(", ") },
      { label: t("hc_education"), get: d => d.education },
    ]);
    const ap = $("#hcCvApply");
    if(r.ok && ap){
      ap.hidden = false;
      ap.onclick = () => {
        const d = r.data;
        const set = (sel, val) => { const el = $(sel); if(el && val) el.value = Array.isArray(val) ? val.join(", ") : val; };
        set("#cdName", d.name); set("#cdHeadline", d.headline); set("#cdOcc", d.occupation);
        set("#cdRegion", d.region); set("#cdYears", d.years); set("#cdSkills", d.skills);
        set("#cdLangs", d.languages); set("#cdCerts", d.certificates); set("#cdEdu", d.education);
        set("#cdExp", d.experience); set("#cdPortfolio", d.portfolio);
        const s = $("#cdSeniority"); if(s && d.seniority) s.value = d.seniority;
        $("#cdName").scrollIntoView({ behavior: "smooth", block: "center" });
      };
    }
  });

  const cg = $("#hcCareerGo");
  if(cg) cg.addEventListener("click", async () => {
    const out = $("#hcCareerOut");
    const target = $("#hcTarget").value.trim();
    if(!target) return say(out, t("hc_target_need"), "err");
    out.innerHTML = loading();
    const profile = [$("#cdHeadline") && $("#cdHeadline").value, $("#cdOcc") && $("#cdOcc").value,
      $("#cdSkills") && $("#cdSkills").value, $("#cdExp") && $("#cdExp").value].filter(Boolean).join("\n");
    const r = await api("/api/copilot", ident.me({ agent: "mehnat.career", lang: MK.lang(), profile, target }));
    out.innerHTML = draft(r, [
      { label: t("hc_gap_skills"), html: true, get: d => (d.gapSkills || []).length
        ? "<ul style='margin-left:16px'>" + d.gapSkills.map(g =>
            `<li><b>${esc(g.skill)}</b> — ${esc(g.why)} <span class="mk-chip is-ghost">${esc(g.effort)}</span></li>`).join("") + "</ul>" : "" },
      { label: t("hc_strengths"), get: d => (d.strengths || []).join(" · ") },
      { label: t("hc_plan"), html: true, get: d => (d.learningPlan || []).length
        ? "<ol style='margin-left:16px'>" + d.learningPlan.map(s =>
            `<li>${esc(s.step)} — <i>${esc(s.outcome)}</i>${s.weeks ? ` (${s.weeks} ${esc(t("hc_weeks"))})` : ""}</li>`).join("") + "</ol>" : "" },
      { label: t("hc_paths"), html: true, get: d => (d.careerPaths || []).length
        ? "<ul style='margin-left:16px'>" + d.careerPaths.map(p =>
            `<li><b>${esc(p.role)}</b> <span class="mk-chip is-ghost">${esc(p.likelihood)}</span> — ${esc(p.why)}</li>`).join("") + "</ul>" : "" },
      { label: t("hc_cv_tips"), get: d => (d.cvImprovements || []).join(" · ") },
    ]);
  });

  host.addEventListener("click", async e => {
    const ap = e.target.closest("[data-apply]");
    if(ap){
      const r = await api("/api/mehnat/apply", ident.me({ vacancyId: ap.dataset.apply, source: "match" }));
      if(r.ok) renderMe();
      return;
    }
    const acc = e.target.closest("[data-accept]"), dec = e.target.closest("[data-decline]");
    if(acc){
      await api("/api/mehnat/offer/respond", ident.me({ id: acc.dataset.accept, accept: true }));
      return renderMe();
    }
    if(dec){
      const reason = await UI.prompt(t("hc_decline_reason") + " (salary / skill / location / availability / culture / experience / other)");
      if(!reason) return;
      await api("/api/mehnat/offer/respond", ident.me({ id: dec.dataset.decline, accept: false, reason }));
      return renderMe();
    }
  });
}

/* ---------- employer / Recruitment OS ---------- */
function renderEmpId(){
  const c = ident.company();
  const bar = $("#hcEmpId");
  bar.innerHTML = c
    ? `<b>${esc(c.name)}</b> <span class="mk-chip is-accent">${esc(c.sector || "—")}</span>
       <span class="mk-id-r"><button class="btn btn-ghost" type="button" id="hcOut">${esc(t("hc_logout"))}</button></span>`
    : `<span>${esc(t("hc_login_hint"))}</span>
       <span class="mk-id-r">
         <input id="hcLogin" placeholder="${escA(t("hc_login"))}" autocomplete="username" />
         <input id="hcPass" type="password" placeholder="${escA(t("hc_pass"))}" autocomplete="current-password" />
         <button class="btn btn-primary" type="button" id="hcIn">${esc(t("hc_enter"))}</button>
       </span>`;
  if(c) $("#hcOut").addEventListener("click", () => { ident.setCompany(null); renderEmpId(); renderEmployer(); });
  else {
    const go = async () => {
      const r = await MK.companyLogin($("#hcLogin").value.trim(), $("#hcPass").value);
      if(r.error) return say($("#hcEmpId"), t("hc_login_fail"), "err");
      renderEmpId(); renderEmployer();
    };
    $("#hcIn").addEventListener("click", go);
    $("#hcPass").addEventListener("keydown", e => { if(e.key === "Enter") go(); });
  }
}

async function renderEmployer(){
  const host = $("#hcEmployer");
  if(!ident.company()){ host.innerHTML = empty(t("hc_login_needed")); return; }
  host.innerHTML = loading();
  await meta();
  const r = await api("/api/mehnat/employer", ident.co({}));
  if(!r.ok){ ident.setCompany(null); renderEmpId(); host.innerHTML = empty(t("hc_login_needed")); return; }
  state.vacancies = r.vacancies || [];
  const fn = r.pipeline.funnel;

  const board = (r.pipeline.stages || []).filter(s => s !== "withdrawn").map(s => {
    const rows = (r.pipeline.byStage[s] || []);
    return `<div class="mk-box w3" style="gap:9px">
      <h3>${esc(t("stage_" + s))} <span class="mk-chip">${rows.length}</span></h3>
      ${rows.slice(0, 8).map(a => `
        <div class="mk-card" style="padding:12px;gap:6px">
          <b style="font-size:14px;color:var(--ink)">${esc(a.candidate ? a.candidate.name : a.candidateName)}</b>
          <div class="mk-meta"><span>${esc(a.vacancyTitle)}</span><span>${num(a.score, 0)}%</span></div>
          <div class="mk-row">
            <select data-stage-for="${escA(a.id)}" style="font-size:12.5px;padding:5px 8px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink)">
              ${(state.stages || []).map(x => `<option value="${x}"${x === a.stage ? " selected" : ""}>${esc(t("stage_" + x))}</option>`).join("")}
            </select>
          </div>
        </div>`).join("") || `<p class="mk-loading">—</p>`}
    </div>`;
  }).join("");

  host.innerHTML = `<div class="mk-bento">
      <div class="mk-box w12 is-lead"><h3>${esc(t("hc_funnel"))}</h3>
        ${funnel([
          { n: fn.applied, label: t("hc_fn_applied") }, { n: fn.screened, label: t("hc_fn_screened") },
          { n: fn.interviewed, label: t("hc_fn_interview") }, { n: fn.offered, label: t("hc_fn_offer") },
          { n: fn.hired, label: t("hc_fn_hired") }])}
        ${(r.pipeline.reasons || []).length ? `<div style="margin-top:10px">
          <h3 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)">${esc(t("hc_reject_reasons"))}</h3>
          ${ranks((r.pipeline.reasons || []).map(x => ({ label: t("hc_reason_" + x.label, x.label), n: x.n })), { limit: 6 })}
        </div>` : ""}
      </div>
      <div class="mk-box w6">
        <h3>${esc(t("hc_my_vacancies"))}</h3>
        <div class="mk-stack">${state.vacancies.map(v => `
          <div class="mk-card" style="gap:7px">
            <div class="mk-chips">${chip(t("status_" + v.status), v.status === "open" ? "good" : "ghost")}
              ${chip(t("hc_sen_" + v.seniority, v.seniority), "accent")}</div>
            <h3>${esc(v.title)}</h3>
            <div class="mk-meta"><span>${salaryTxt(v.salaryMin, v.salaryMax, v.currency)}</span>
              ${v.region ? `<span>📍 ${esc(v.region)}</span>` : ""}</div>
            <div class="mk-actions">
              <button class="btn btn-ghost" type="button" data-shortlist="${escA(v.id)}" style="padding:5px 12px;font-size:13px">${esc(t("hc_shortlist"))}</button>
              ${v.status === "open" ? `<button class="btn btn-ghost" type="button" data-close="${escA(v.id)}" style="padding:5px 12px;font-size:13px">${esc(t("hc_close"))}</button>` : ""}
            </div>
          </div>`).join("") || empty(t("hc_no_vacancies"))}</div>
      </div>
      <div class="mk-box w6">${vacancyAiHtml()}</div>
      <div class="mk-box w12">${vacancyFormHtml()}</div>
      <div class="mk-box w12"><h3>${esc(t("hc_pipeline"))}</h3></div>
      ${board}
    </div>`;
  wireEmployer();
  applyStatic();
}

const vacancyAiHtml = () => `<div class="mk-ai">
    <h3>${esc(t("hc_vb_title"))}</h3>
    <p style="font-size:13.5px;color:var(--text)">${esc(t("hc_vb_hint"))}</p>
    <textarea id="hcVbText" style="width:100%;min-height:100px;padding:10px 12px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--card);color:var(--ink);font:inherit"
      placeholder="${escA(t("hc_vb_ph"))}"></textarea>
    <div class="mk-actions">
      <button class="btn btn-primary" type="button" id="hcVbGo">${esc(t("hc_vb_go"))}</button>
      <button class="btn btn-ghost" type="button" id="hcVbApply" hidden>${esc(t("hc_vb_apply"))}</button>
    </div>
    <div id="hcVbOut"></div></div>`;

const vacancyFormHtml = () => `
  <h3>${esc(t("hc_new_vacancy"))}</h3>
  <form class="mk-form" id="hcVacForm">
    <div class="mk-f"><label>${esc(t("hc_f_title"))}</label><input id="vcTitle" required /></div>
    <div class="mk-f"><label>${esc(t("hc_occupation"))}</label><input id="vcOcc" /></div>
    <div class="mk-f wide"><label>${esc(t("hc_summary"))}</label><textarea id="vcSummary"></textarea></div>
    <div class="mk-f wide"><label>${esc(t("hc_duties"))}</label><textarea id="vcDuties"></textarea></div>
    <div class="mk-f wide"><label>${esc(t("hc_req_skills"))}</label><input id="vcReq" placeholder="IFRS, Excel" /></div>
    <div class="mk-f wide"><label>${esc(t("hc_pref_skills"))}</label><input id="vcPref" /></div>
    <div class="mk-f"><label>${esc(t("hc_languages"))}</label><input id="vcLangs" /></div>
    <div class="mk-f"><label>${esc(t("hc_certs"))}</label><input id="vcCerts" /></div>
    <div class="mk-f"><label>${esc(t("hc_level"))}</label><select id="vcSeniority">
      ${["intern","junior","middle","senior","lead","head"].map(s => `<option value="${s}"${s === "middle" ? " selected" : ""}>${esc(t("hc_sen_" + s, s))}</option>`).join("")}</select></div>
    <div class="mk-f"><label>${esc(t("hc_years"))}</label><input id="vcYears" type="number" min="0" /></div>
    <div class="mk-f"><label>${esc(t("hc_salary_min"))}</label><input id="vcMin" type="number" min="0" /></div>
    <div class="mk-f"><label>${esc(t("hc_salary_max"))}</label><input id="vcMax" type="number" min="0" /></div>
    <div class="mk-f"><label>${esc(t("hc_currency"))}</label><select id="vcCurrency"><option>UZS</option><option>USD</option></select></div>
    <div class="mk-f"><label>${esc(t("hc_region"))}</label><input id="vcRegion" /></div>
    <div class="mk-f"><label>${esc(t("hc_format"))}</label><select id="vcFormat">
      ${["onsite","hybrid","remote"].map(f => `<option value="${f}">${esc(t("hc_fmt_" + f, f))}</option>`).join("")}</select></div>
    <div class="mk-f"><label>${esc(t("hc_employment"))}</label><select id="vcEmployment">
      ${["full","part","shift","project","seasonal","internship"].map(f => `<option value="${f}">${esc(t("hc_emp_" + f, f))}</option>`).join("")}</select></div>
    <div class="mk-f"><label>${esc(t("hc_headcount"))}</label><input id="vcHeadcount" type="number" min="1" value="1" /></div>
    <div class="mk-f"><label>${esc(t("hc_deadline"))}</label><input id="vcDeadline" type="date" /></div>
    <div class="mk-f wide"><label>${esc(t("hc_contact"))}</label><input id="vcContact" /></div>
    <div class="mk-actions wide"><button class="btn btn-primary" type="submit">${esc(t("hc_publish"))}</button>
      <p class="mk-msg" id="hcVacMsg" hidden></p></div>
    <div class="wide" id="hcVacWarn"></div>
  </form>`;

function wireEmployer(){
  const host = $("#hcEmployer");

  const f = $("#hcVacForm");
  if(f) f.addEventListener("submit", async e => {
    e.preventDefault();
    const msg = $("#hcVacMsg");
    const r = await api("/api/mehnat/vacancy", ident.co({
      title: $("#vcTitle").value, occupation: $("#vcOcc").value, summary: $("#vcSummary").value,
      duties: $("#vcDuties").value, skillsRequired: $("#vcReq").value, skillsPreferred: $("#vcPref").value,
      languages: $("#vcLangs").value, certificates: $("#vcCerts").value, seniority: $("#vcSeniority").value,
      yearsMin: $("#vcYears").value, salaryMin: $("#vcMin").value, salaryMax: $("#vcMax").value,
      currency: $("#vcCurrency").value, region: $("#vcRegion").value, format: $("#vcFormat").value,
      employment: $("#vcEmployment").value, headcount: $("#vcHeadcount").value,
      deadline: $("#vcDeadline").value, contact: $("#vcContact").value }));
    if(!r.ok) return say(msg, t("hc_save_fail"), "err");
    say(msg, t("hc_save_ok"), "ok");
    $("#hcVacWarn").innerHTML = (r.warnings || []).length
      ? `<div class="mk-assume" style="margin-top:10px"><b>${esc(t("hc_warnings"))}</b><ul>${
          r.warnings.map(w => `<li>${esc(w)}</li>`).join("")}</ul></div>` : "";
    f.reset();
    setTimeout(renderEmployer, (r.warnings || []).length ? 2500 : 500);
  });

  const vb = $("#hcVbGo");
  if(vb) vb.addEventListener("click", async () => {
    const out = $("#hcVbOut");
    const text = $("#hcVbText").value.trim();
    if(!text) return say(out, t("hc_vb_need"), "err");
    out.innerHTML = loading();
    const c = ident.company();
    const r = await api("/api/copilot", ident.co({ agent: "mehnat.vacancy", lang: MK.lang(), text,
      company: c && c.name, sector: c && c.sector }));
    out.innerHTML = draft(r, [
      { label: t("hc_f_title"), get: d => d.title }, { label: t("hc_occupation"), get: d => d.occupation },
      { label: t("hc_summary"), get: d => d.summary }, { label: t("hc_duties"), get: d => d.duties },
      { label: t("hc_req_skills"), get: d => (d.skillsRequired || []).join(", ") },
      { label: t("hc_pref_skills"), get: d => (d.skillsPreferred || []).join(", ") },
      { label: t("hc_level"), get: d => d.seniority },
      { label: t("hc_screening"), get: d => (d.screeningQuestions || []).join(" · ") },
      { label: t("hc_removed"), html: true, get: d => (d.removedRequirements || []).length
        ? "<ul style='margin-left:16px;color:var(--mk-warn)'>" + d.removedRequirements.map(x =>
            `<li>${esc(x)}</li>`).join("") + "</ul>" : "" },
    ]);
    const ap = $("#hcVbApply");
    if(r.ok && ap){
      ap.hidden = false;
      ap.onclick = () => {
        const d = r.data;
        const set = (sel, val) => { const el = $(sel); if(el && val) el.value = Array.isArray(val) ? val.join(", ") : val; };
        set("#vcTitle", d.title); set("#vcOcc", d.occupation); set("#vcSummary", d.summary);
        set("#vcDuties", d.duties); set("#vcReq", d.skillsRequired); set("#vcPref", d.skillsPreferred);
        set("#vcLangs", d.languages); set("#vcCerts", d.certificates); set("#vcYears", d.yearsMin);
        set("#vcMin", d.salaryMin); set("#vcMax", d.salaryMax);
        ["#vcSeniority:" + d.seniority, "#vcFormat:" + d.format, "#vcEmployment:" + d.employment]
          .forEach(pair => { const [s, v] = pair.split(":"); const el = $(s); if(el && v) el.value = v; });
        $("#vcTitle").scrollIntoView({ behavior: "smooth", block: "center" });
      };
    }
  });

  host.addEventListener("change", async e => {
    const sel = e.target.closest("[data-stage-for]");
    if(!sel) return;
    const stage = sel.value;
    let reason = "";
    if(stage === "rejected"){
      reason = await UI.prompt(t("hc_reason_prompt") + " (salary / skill / location / availability / culture / experience / no-show / other)");
      if(!reason) return renderEmployer();
    }
    let salary = "";
    if(stage === "offer") salary = (await UI.prompt(t("hc_offer_salary"))) || "";
    const r = await api("/api/mehnat/stage", ident.co({ id: sel.dataset.stageFor, stage, reason, salary }));
    if(!r.ok) UI.alert(t("hc_stage_fail"));
    renderEmployer();
  });

  host.addEventListener("click", async e => {
    const sl = e.target.closest("[data-shortlist]");
    if(sl) return openShortlist(sl.dataset.shortlist);
    const cl = e.target.closest("[data-close]");
    if(cl){
      if(!await UI.confirm(t("hc_confirm_close"), { tone:"danger" })) return;
      await api("/api/mehnat/vacancy", ident.co({ op: "close", id: cl.dataset.close }));
      renderEmployer();
    }
  });
}

async function openShortlist(id){
  drawer(loading(), t("hc_shortlist"));
  const r = await api("/api/mehnat/vacancy/matches", ident.co({ id, limit: 20 }));
  if(!r.ok) return drawer(empty(t("hc_no_matches")), t("hc_shortlist"));
  drawer(`
    <p class="mk-note">${esc(t("hc_shortlist_note"))}</p>
    <div class="mk-stack">${(r.matches || []).map(x => match(x,
      `${esc(x.candidate.name)} — <span style="color:var(--muted);font-weight:500">${esc(x.candidate.occupation || "")}</span>`,
      `<div class="mk-meta" style="margin-top:6px">
        <span>${salaryTxt(x.candidate.expectedMin, x.candidate.expectedMax, x.candidate.currency)}</span>
        <span>${esc(t("hc_av_" + x.candidate.availability, x.candidate.availability))}</span>
        ${x.candidate.region ? `<span>📍 ${esc(x.candidate.region)}</span>` : ""}
      </div>`)).join("") || empty(t("hc_no_matches"))}</div>`, r.vacancy.title);
}

/* ---------- intelligence ---------- */
async function loadIntel(){
  const host = $("#hcIntel");
  host.innerHTML = loading();
  const d = await api("/api/mehnat/intel?" + qs({
    region: $("#hcIregion").value, occupation: $("#hcIocc").value }));
  const h = d.headline || {};
  fillIntelFacets(d);
  const w = d.wages || {};
  const wageBox = w.offered && !w.offered.suppressed
    ? `<div class="mk-tablewrap"><table class="mk-table" style="min-width:0">
        <thead><tr><th></th><th class="num">P25</th><th class="num">${esc(t("hc_median"))}</th><th class="num">P75</th></tr></thead>
        <tbody>
          ${wageRow(t("hc_offered"), w.offered)}${wageRow(t("hc_expected"), w.expected)}${wageRow(t("hc_accepted"), w.accepted)}
        </tbody></table></div>
        ${w.pressurePct != null ? `<p class="mk-note">${esc(t("hc_wage_pressure"))}: <b>${pctTxt(w.pressurePct)}</b></p>` : ""}`
    : `<p class="mk-empty" style="padding:22px">${esc(t("hc_suppressed"))} (n&lt;${d.privacy ? MK.esc(String(w.offered && w.offered.min || 5)) : 5})</p>`;

  host.innerHTML = `
    <div class="mk-kpis" style="margin-bottom:var(--mk-gap)">
      ${kpi(h.shortageIndex != null ? num(h.shortageIndex, 2) : "—", t("hc_k_shortage"), { hero: true, note: t("hc_k_shortage_note") })}
      ${kpi(num(h.openVacancies, 0), t("hc_k_vacancies"), { note: h.seats ? h.seats + " " + t("hc_seats") : "" })}
      ${kpi(num(h.activeCandidates, 0), t("hc_k_active"))}
      ${kpi(num(h.applications, 0), t("hc_k_apps"))}
      ${kpi(h.timeToFillDays ? num(h.timeToFillDays.median, 0) + " " + t("hc_days") : "—", t("hc_k_ttf"))}
      ${kpi(pctTxt(h.offerAcceptanceRate), t("hc_k_acceptance"))}
    </div>
    <div class="mk-bento">
      <div class="mk-box w8 is-lead"><h3>${esc(t("hc_funnel"))}</h3>
        ${funnel([
          { n: d.funnel.applied, label: t("hc_fn_applied") }, { n: d.funnel.screened, label: t("hc_fn_screened") },
          { n: d.funnel.interviewed, label: t("hc_fn_interview") }, { n: d.funnel.offered, label: t("hc_fn_offer") },
          { n: d.funnel.hired, label: t("hc_fn_hired") }])}
      </div>
      <div class="mk-box w4"><h3>${esc(t("hc_wages"))}</h3>${wageBox}</div>
      <div class="mk-box w6"><h3>${esc(t("hc_skill_gap"))}</h3>
        ${ranks(d.skillGap, { label: "skill", value: "gap", digits: 1, gap: true, limit: 10,
          fmt: r => `${r.demand}↔${r.supply}` })}
        <p class="mk-note">${esc(t("hc_gap_note"))}</p></div>
      <div class="mk-box w6"><h3>${esc(t("hc_skill_demand"))}</h3>${ranks(d.skillDemand, { limit: 10 })}</div>
      <div class="mk-box w4"><h3>${esc(t("hc_occupations"))}</h3>${ranks(d.occupations, { limit: 8 })}</div>
      <div class="mk-box w4"><h3>${esc(t("hc_regions"))}</h3>${ranks(d.regions, { limit: 8 })}</div>
      <div class="mk-box w4"><h3>${esc(t("hc_seniority_bal"))}</h3>
        ${ranks((d.seniority || []).map(s => ({ label: t("hc_sen_" + s.label, s.label), n: s.demand, supply: s.supply })),
          { limit: 6, fmt: r => `${r.n} ↔ ${r.supply}` })}</div>
      ${(d.trainingSignals || []).length ? `<div class="mk-box w12">
        <h3>${esc(t("hc_training_signal"))}</h3>
        <div class="mk-chips">${d.trainingSignals.map(s =>
          chip(`${s.skill} — ${t("hc_demand")} ${s.demand} / ${t("hc_supply")} ${s.supply}`, "warn")).join("")}</div>
        <p class="mk-note">${esc(t("hc_training_note"))}</p></div>` : ""}
      ${(d.rejectionReasons || []).length ? `<div class="mk-box w6"><h3>${esc(t("hc_reject_reasons"))}</h3>
        ${ranks(d.rejectionReasons.map(x => ({ label: t("hc_reason_" + x.label, x.label), n: x.n })), { limit: 8 })}</div>` : ""}
      <div class="mk-box w12"><p class="mk-note">${esc(d.privacy || "")}</p></div>
    </div>`;
}

const wageRow = (label, c) => c && c.stats
  ? `<tr><td>${esc(label)}</td><td class="num">${money(c.stats.p25, "")}</td>
     <td class="num">${money(c.stats.median, "")}</td><td class="num">${money(c.stats.p75, "")}</td></tr>`
  : `<tr><td>${esc(label)}</td><td class="num" colspan="3" style="text-align:right;color:var(--muted)">${esc(t("hc_suppressed"))}</td></tr>`;

let intelFacetsDone = false;
function fillIntelFacets(d){
  if(intelFacetsDone) return;
  intelFacetsDone = true;
  const put = (sel, values, allKey) => {
    const el = $(sel); if(!el) return;
    el.innerHTML = `<option value="">${esc(t(allKey))}</option>` +
      (values || []).map(v => `<option value="${escA(v.label)}">${esc(v.label)}</option>`).join("");
  };
  put("#hcIregion", d.regions, "hc_all_regions");
  put("#hcIocc", d.occupations, "hc_all_occ");
}

async function loadPulse(){
  const p = await api("/api/market/pulse");
  if(!p.ok) return;
  $("#hcPulse").innerHTML = [
    [p.mehnat.vacancies, t("hc_k_vacancies")], [p.mehnat.candidates, t("hc_k_active")],
    [p.mehnat.applications, t("hc_k_apps")], [p.mehnat.hires, t("hc_fn_hired")],
  ].map(([v, l]) => `<div><b>${num(v, 0)}</b><span>${esc(l)}</span></div>`).join("");
}

/* ---------- wiring ---------- */
let debounce;
["#hcQ", "#hcRegion", "#hcSeniority", "#hcFormat", "#hcSalary"].forEach(sel => {
  const el = $(sel); if(!el) return;
  el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
    clearTimeout(debounce); debounce = setTimeout(loadJobs, el.tagName === "SELECT" ? 0 : 300);
  });
});
["#hcTq", "#hcTregion", "#hcTsen", "#hcTavail"].forEach(sel => {
  const el = $(sel); if(!el) return;
  el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
    clearTimeout(debounce); debounce = setTimeout(loadTalent, el.tagName === "SELECT" ? 0 : 300);
  });
});
["#hcIregion", "#hcIocc"].forEach(sel => {
  const el = $(sel); if(el) el.addEventListener("change", loadIntel);
});
$("#hcGrid").addEventListener("click", e => {
  const c = e.target.closest("[data-job]"); if(c) openJob(c.dataset.job);
});

const loaded = {};
tabs("#hcTabs", tab => {
  if(tab === "talent" && !loaded.talent){ loaded.talent = 1; loadTalent(); }
  if(tab === "me" && !loaded.me){ loaded.me = 1; renderId(); renderMe(); }
  if(tab === "employer" && !loaded.employer){ loaded.employer = 1; renderEmpId(); renderEmployer(); }
  if(tab === "intel" && !loaded.intel){ loaded.intel = 1; loadIntel(); }
});

chrome(() => {
  jobFacetsDone = talentFacetsDone = intelFacetsDone = false;
  loadJobs(); loadPulse();
  if(loaded.talent) loadTalent();
  if(loaded.me){ renderId(); renderMe(); }
  if(loaded.employer){ renderEmpId(); renderEmployer(); }
  if(loaded.intel) loadIntel();
});
meta();
loadJobs();
loadPulse();
})();
