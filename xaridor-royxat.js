/* ============================================================
   Buyer registration — applicant side.

   The same shape as the company form next door, and deliberately
   so: an applicant who has seen one should not have to learn the
   other. Three things differ, and each of them is the point.

   1  No association. A buyer joins no sector body, so there is
      nothing to pick and nobody to be vouched for by — which is
      why the reviewer here is the platform administrator.

   2  The company NUMBER is required. A buyer publishes nothing,
      so the only handle an approver has on "is this a real
      organisation" is a name and a line that answers. Asking for
      it as a mandatory field is what makes the approval a
      decision rather than a formality.

   3  It ends on a reference number, not a welcome. The account
      does not exist until someone approves it.
   ============================================================ */
(() => {
const { $, t, esc, escA, day, api, loading, say, applyStatic, chrome } = MK;

MK.setDict(typeof T_BREG !== "undefined" ? T_BREG : {});

const LOGIN_RE = /^[a-z0-9][a-z0-9._-]{2,39}$/;

/* Server-side messages, said in the applicant's language. Everything the
   company form can hit is here too — the endpoints share their validation,
   so they share their failures. */
const ERR = {
  name_required:  "rg_e_name",   phone_required: "br_e_phone",
  contact_required:"rg_e_contact",
  email_invalid:  "rg_e_email",  login_invalid:  "rg_e_login",  password_short: "rg_e_pass",
  login_taken:    "rg_e_taken",  login_pending:  "rg_e_taken",  too_many_pending: "rg_e_many",

  /* Not validation — the request never reached a working endpoint. Telling
     someone to "try again" here sends them round the form a second time for
     nothing, and hides a server that needs attention. `unknown_endpoint` is
     what a server running older code answers when a route it has never heard
     of is called. */
  network:          "rg_e_offline",
  bad_response:     "rg_e_unavailable",
  unknown_endpoint: "rg_e_unavailable",
  forbidden:        "rg_e_unavailable",
};

/** Whoever is looking at the console deserves the real code, not the prose. */
function failed(msg, code){
  if(code && !ERR[code]) console.warn("[register] unmapped server error:", code);
  return say(msg, t(ERR[code] || "rg_e_generic"), "err");
}

async function submit(e){
  e.preventDefault();
  const msg = $("#brMsg"), btn = $("#brSubmit");

  const v = id => ($("#" + id) ? $("#" + id).value.trim() : "");
  const pass = $("#brPass").value, pass2 = $("#brPass2").value;

  /* Checked here so the applicant is told before a round trip; the server
     checks all of it again, because a client cannot be trusted to. */
  if(!v("brName"))              return say(msg, t("rg_e_name"), "err");
  if(!v("brPhone"))             return say(msg, t("br_e_phone"), "err");
  if(!v("brContact"))           return say(msg, t("rg_e_contact"), "err");
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("brEmail"))) return say(msg, t("rg_e_email"), "err");
  if(!LOGIN_RE.test(v("brLogin").toLowerCase()))          return say(msg, t("rg_e_login"), "err");
  if(pass.length < 8)           return say(msg, t("rg_e_pass"), "err");
  if(pass !== pass2)            return say(msg, t("rg_e_pass2"), "err");
  if(!$("#brConsent").checked)  return say(msg, t("rg_e_consent"), "err");

  btn.disabled = true;
  const r = await api("/api/register/buyer", {
    name: v("brName"), phone: v("brPhone"), region: v("brRegion"), about: v("brAbout"),
    contactName: v("brContact"), role: v("brRole"),
    email: v("brEmail"), contactPhone: v("brCPhone"),
    login: v("brLogin").toLowerCase(), password: pass,
    consent: $("#brConsent").checked,
  });
  btn.disabled = false;

  if(!r.ok) return failed(msg, r.error);
  msg.hidden = true;
  showDone(r.application, v("brEmail"));
}

/** The reference is the only thing the applicant needs to keep. */
function showDone(a, email){
  const box = $("#brDone");
  box.hidden = false;
  box.innerHTML = `
    <h2>${esc(t("rg_done_h"))}</h2>
    <p class="rg-done-p">${esc(t("br_done_p"))}</p>
    <div class="rg-ref">
      <span>${esc(t("rg_ref"))}</span>
      <b>${esc(a.ref)}</b>
      <button class="btn btn-ghost" type="button" id="brCopy">${esc(t("rg_copy"))}</button>
    </div>
    <dl class="mk-kv">
      <dt>${esc(t("br_l_company"))}</dt><dd>${esc(a.name)}</dd>
      <dt>${esc(t("rg_f_login"))}</dt><dd>${esc(a.login)}</dd>
      <dt>${esc(t("rg_status"))}</dt><dd>${esc(t("rg_st_" + a.status))}</dd>
    </dl>
    <p class="mk-note">${esc(t("rg_done_note"))}</p>`;

  $("#brForm").reset();
  $("#brCopy").addEventListener("click", () => {
    const done = () => { $("#brCopy").textContent = t("rg_copied");
      setTimeout(() => { $("#brCopy").textContent = t("rg_copy"); }, 1600); };
    if(navigator.clipboard) navigator.clipboard.writeText(a.ref).then(done, done);
    else done();
  });
  /* pre-fill the status checker so it is one click away */
  $("#brRef").value = a.ref;
  $("#brStEmail").value = a.email || email || "";
  box.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function checkStatus(e){
  e.preventDefault();
  const out = $("#brStatusOut");
  const ref = $("#brRef").value.trim(), email = $("#brStEmail").value.trim();
  if(!ref || !email) return say(out, t("rg_e_status"), "err");
  out.innerHTML = loading();
  const r = await api("/api/register/status", { ref, email });
  if(!r.ok){ out.innerHTML = `<p class="mk-msg is-err">${esc(t("rg_e_notfound"))}</p>`; return; }
  const a = r.application;
  const tone = a.status === "approved" ? "good" : a.status === "rejected" ? "bad" : "warn";
  /* One checker, two kinds of application: send an approved applicant to the
     cabinet they actually earned, not to whichever one this page is about. */
  const cabinet = a.kind === "buyer" ? "xaridor.html" : "company.html";
  const cabinetLabel = a.kind === "buyer" ? t("br_go_cabinet") : t("rg_go_cabinet");
  out.innerHTML = `<div class="rg-status is-${escA(tone)}">
      <b>${esc(t("rg_st_" + a.status))}</b>
      <dl class="mk-kv">
        <dt>${esc(t("br_l_company"))}</dt><dd>${esc(a.name)}</dd>
        <dt>${esc(t("rg_sent"))}</dt><dd>${day(a.created)}</dd>
        ${a.decided ? `<dt>${esc(t("rg_decided"))}</dt><dd>${day(a.decided)}</dd>` : ""}
      </dl>
      ${a.reason ? `<p class="rg-reason">${esc(t("rg_reason"))}: ${esc(a.reason)}</p>` : ""}
      ${a.status === "approved"
        ? `<a class="btn btn-primary" href="${escA(cabinet)}">${esc(cabinetLabel)}</a>`
        : ""}
    </div>`;
}

$("#brForm").addEventListener("submit", submit);
$("#brStatusForm").addEventListener("submit", checkStatus);
$("#brLogin").addEventListener("input", e => {
  const val = e.target.value.toLowerCase();
  if(e.target.value !== val) e.target.value = val;      // logins are lower-case everywhere
  const hint = $("#brLoginHint");
  if(hint) hint.classList.toggle("is-bad", !!val && !LOGIN_RE.test(val));
});

chrome();
applyStatic();
})();
