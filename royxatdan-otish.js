/* ============================================================
   Company registration — applicant side.

   The form creates an application, never an account: the chosen
   association approves it, and only then does a cabinet exist.
   That is why the page ends on a reference number rather than a
   "welcome" — the applicant has something to quote while waiting.
   ============================================================ */
(() => {
const { $, $$, t, esc, escA, day, api, ident, empty, loading, say, applyStatic, chrome } = MK;

MK.setDict(typeof T_REGISTER !== "undefined" ? T_REGISTER : {});

const LOGIN_RE = /^[a-z0-9][a-z0-9._-]{2,39}$/;

async function fillMeta(){
  const r = await api("/api/register/meta");
  const sel = $("#rgAssoc");
  if(!r.ok){ sel.innerHTML = `<option value="">—</option>`; return; }
  const lang = MK.lang();
  sel.innerHTML = `<option value="" data-i18n="rg_pick">— tanlang —</option>` +
    (r.associations || []).map(a =>
      `<option value="${escA(a.id)}">${esc((a.i18n && a.i18n[lang]) || a.name)}</option>`).join("");
  $("#rgSectors").innerHTML = (r.sectors || []).map(x => `<option value="${escA(x)}"></option>`).join("");
  applyStatic();
}

/* Server-side messages, said in the applicant's language. */
const ERR = {
  name_required:  "rg_e_name",   assoc_required: "rg_e_assoc",  assoc_unknown: "rg_e_assoc",
  email_invalid:  "rg_e_email",  login_invalid:  "rg_e_login",  password_short: "rg_e_pass",
  login_taken:    "rg_e_taken",  login_pending:  "rg_e_taken",  too_many_pending: "rg_e_many",

  /* Not validation — the request never reached a working endpoint, so "try
     again" would send the applicant round the form a second time for nothing.
     `unknown_endpoint` is what a server running older code answers. */
  network:          "rg_e_offline",
  bad_response:     "rg_e_unavailable",
  unknown_endpoint: "rg_e_unavailable",
};

async function submit(e){
  e.preventDefault();
  const msg = $("#rgMsg"), btn = $("#rgSubmit");

  const v = id => ($("#" + id) ? $("#" + id).value.trim() : "");
  const pass = $("#rgPass").value, pass2 = $("#rgPass2").value;

  /* Checked here so the applicant is told before a round trip; the server
     checks all of it again, because a client cannot be trusted to. */
  if(!v("rgName"))              return say(msg, t("rg_e_name"), "err");
  if(!v("rgAssoc"))             return say(msg, t("rg_e_assoc"), "err");
  if(!v("rgContact"))           return say(msg, t("rg_e_contact"), "err");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("rgEmail"))) return say(msg, t("rg_e_email"), "err");
  if(!LOGIN_RE.test(v("rgLogin").toLowerCase()))          return say(msg, t("rg_e_login"), "err");
  if(pass.length < 8)           return say(msg, t("rg_e_pass"), "err");
  if(pass !== pass2)            return say(msg, t("rg_e_pass2"), "err");
  if(!$("#rgConsent").checked)  return say(msg, t("rg_e_consent"), "err");

  btn.disabled = true;
  const r = await api("/api/register", {
    name: v("rgName"), assocId: v("rgAssoc"), sector: v("rgSector"), region: v("rgRegion"),
    tin: v("rgTin"), website: v("rgWebsite"), about: v("rgAbout"),
    contactName: v("rgContact"), role: v("rgRole"), email: v("rgEmail"), phone: v("rgPhone"),
    login: v("rgLogin").toLowerCase(), password: pass,
    /* The server records this as a dated, versioned consent event and refuses
       the application without it — see srv/legal.js. */
    consent: $("#rgConsent").checked,
  });
  btn.disabled = false;

  if(!r.ok) return say(msg, t(ERR[r.error] || "rg_e_generic"), "err");
  msg.hidden = true;
  showDone(r.application);
}

/** The reference is the only thing the applicant needs to keep. */
function showDone(a){
  const box = $("#rgDone");
  box.hidden = false;
  box.innerHTML = `
    <h2>${esc(t("rg_done_h"))}</h2>
    <p class="rg-done-p">${esc(t("rg_done_p")).replace("{assoc}", esc(a.assocName))}</p>
    <div class="rg-ref">
      <span>${esc(t("rg_ref"))}</span>
      <b id="rgRefVal">${esc(a.ref)}</b>
      <button class="btn btn-ghost" type="button" id="rgCopy">${esc(t("rg_copy"))}</button>
    </div>
    <dl class="mk-kv">
      <dt>${esc(t("rg_f_name"))}</dt><dd>${esc(a.name)}</dd>
      <dt>${esc(t("rg_f_assoc"))}</dt><dd>${esc(a.assocName)}</dd>
      <dt>${esc(t("rg_f_login"))}</dt><dd>${esc(a.login)}</dd>
      <dt>${esc(t("rg_status"))}</dt><dd>${esc(t("rg_st_" + a.status))}</dd>
    </dl>
    <p class="mk-note">${esc(t("rg_done_note"))}</p>`;

  $("#rgForm").reset();
  $("#rgCopy").addEventListener("click", () => {
    const text = a.ref;
    const done = () => { $("#rgCopy").textContent = t("rg_copied");
      setTimeout(() => { $("#rgCopy").textContent = t("rg_copy"); }, 1600); };
    if(navigator.clipboard) navigator.clipboard.writeText(text).then(done, done);
    else done();
  });
  /* pre-fill the status checker so it is one click away */
  $("#rgRef").value = a.ref;
  $("#rgStEmail").value = a.email || $("#rgEmail").value || "";
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function checkStatus(e){
  e.preventDefault();
  const out = $("#rgStatusOut");
  const ref = $("#rgRef").value.trim(), email = $("#rgStEmail").value.trim();
  if(!ref || !email) return say(out, t("rg_e_status"), "err");
  out.innerHTML = loading();
  const r = await api("/api/register/status", { ref, email });
  if(!r.ok){ out.innerHTML = `<p class="mk-msg is-err">${esc(t("rg_e_notfound"))}</p>`; return; }
  const a = r.application;
  const tone = a.status === "approved" ? "good" : a.status === "rejected" ? "bad" : "warn";
  out.innerHTML = `<div class="rg-status is-${tone}">
      <b>${esc(t("rg_st_" + a.status))}</b>
      <dl class="mk-kv">
        <dt>${esc(t("rg_f_name"))}</dt><dd>${esc(a.name)}</dd>
        <dt>${esc(t("rg_f_assoc"))}</dt><dd>${esc(a.assocName)}</dd>
        <dt>${esc(t("rg_sent"))}</dt><dd>${day(a.created)}</dd>
        ${a.decided ? `<dt>${esc(t("rg_decided"))}</dt><dd>${day(a.decided)}</dd>` : ""}
      </dl>
      ${a.reason ? `<p class="rg-reason">${esc(t("rg_reason"))}: ${esc(a.reason)}</p>` : ""}
      ${a.status === "approved"
        ? `<a class="btn btn-primary" href="company.html">${esc(t("rg_go_cabinet"))}</a>`
        : ""}
    </div>`;
}

$("#rgForm").addEventListener("submit", submit);
$("#rgStatusForm").addEventListener("submit", checkStatus);
$("#rgLogin").addEventListener("input", e => {
  const val = e.target.value.toLowerCase();
  if(e.target.value !== val) e.target.value = val;      // logins are lower-case everywhere
  const hint = $("#rgLoginHint");
  if(hint) hint.classList.toggle("is-bad", !!val && !LOGIN_RE.test(val));
});

chrome(() => { fillMeta(); });
fillMeta();
})();
