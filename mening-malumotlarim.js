/* ============================================================
   MENING MA'LUMOTLARIM — the standalone rights page

   The rights themselves now live in every cabinet's settings,
   which is where people will actually find them. This page still
   exists for the two cases a cabinet cannot cover:

   • the privacy policy links here, and a reader of the policy is
     not necessarily signed in;
   • someone whose access was suspended — including by their own
     withdrawal of consent — has no cabinet to open, and modda 22
     does not stop applying because an account was closed.

   So all this file does is establish who is asking, then hand
   over to LegalPanel. The four rights are implemented once, in
   legal-settings.js, and this page renders the same panel the
   cabinets do rather than a second copy that drifts from it.

   The credentials typed here are deliberately NOT persisted to
   sessionStorage: this is not a sign-in surface for the rest of
   the site, and a credential it stored would outlive the visit.
   ============================================================ */
(() => {
const { $, esc, api, chrome, applyStatic } = MK;

MK.setDict(typeof T_DSR !== "undefined" ? T_DSR : {});

/* Tried in the order /api/auth/login resolves the tiers, so a browser holding
   two stale sessions behaves the way the server would. */
const SLOTS = [["kg_co", "company"], ["kg_by", "buyer"], ["kg_as", "assoc"]];
function session(){
  for(const [key, tier] of SLOTS){
    try{
      const c = JSON.parse(sessionStorage.getItem(key) || "null");
      if(c && c.login) return { login: c.login, password: c.password, tier };
    }catch(e){ /* a corrupt slot is simply not a session */ }
  }
  return null;
}

let ME = session();
const host = () => $("#dsrBody");

function mountPanel(){
  LegalPanel.mount(host(), {
    creds: () => ME,
    panelClass: "lg-page-panel",
    profileHref: ME.tier === "buyer" ? "xaridor.html" : "company.html",
    onWithdrawn: () => {
      SLOTS.forEach(([k]) => sessionStorage.removeItem(k));
      location.href = "index.html";
    },
  });
}

function drawLogin(msg){
  host().innerHTML = `
    <div class="lg-note lg-note-info">${esc(MK.t("dsr_login_why"))}</div>
    <form class="rg-card" id="dsrLogin" style="max-width:420px">
      <h2>${esc(MK.t("dsr_login_h"))}</h2>
      <div class="mk-form">
        <div class="mk-f wide"><label>${esc(MK.t("dsr_lg"))}</label>
          <input id="dsrLg" autocomplete="username" spellcheck="false" required /></div>
        <div class="mk-f wide"><label>${esc(MK.t("dsr_pw"))}</label>
          <input id="dsrPw" type="password" autocomplete="current-password" required /></div>
      </div>
      <div class="mk-actions"><button class="btn btn-primary" type="submit">${esc(MK.t("dsr_login_btn"))}</button></div>
      ${msg ? `<p class="mk-msg err">${esc(msg)}</p>` : ""}
    </form>`;

  $("#dsrLogin").addEventListener("submit", async e => {
    e.preventDefault();
    const cand = { login: $("#dsrLg").value.trim(), password: $("#dsrPw").value, tier: "" };
    /* The export endpoint IS the identity check: it resolves the subject from
       the credentials server-side and refuses anything it cannot place. */
    const r = await api("/api/legal/export", cand);
    if(!r || !r.ok) return drawLogin(MK.t("dsr_login_bad"));
    ME = cand;
    mountPanel();
  });
}

function draw(){
  if(ME) mountPanel(); else drawLogin("");
}

chrome(() => { applyStatic(); draw(); });
draw();
})();
