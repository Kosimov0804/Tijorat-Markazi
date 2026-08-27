/* ============================================================
   TIJORAT MARKAZI — global "log out" button
   Shown in the page header on any page that includes this file,
   but only when a user is actually signed in (admin / super-admin /
   association / company / analyst / buyer / demo). Clears every auth key and
   returns
   to the login page.
   ============================================================ */
(function(){
  // keys cleared on logout
  var KEYS = ["kg_admin","kg_co","kg_as","kg_rais","kg_an","kg_by","kg_email","kg_guest_id","kg_demo_email"];
  // only a REAL account session counts as "logged in" — kg_guest_id is a tracking id
  // that is always present, so it must NOT trigger the logout button.
  var LOGIN_KEYS = ["kg_admin","kg_co","kg_as","kg_rais","kg_an","kg_by"];
  var LABEL = { uz:"Chiqish", ru:"Выйти", en:"Log out" };
  // Which panel each session key belongs to, most privileged first —
  // rais and admin share the admin panel.
  var PANELS = [
    { key:"kg_admin", url:"admin.html" },
    { key:"kg_rais",  url:"admin.html" },
    { key:"kg_as",    url:"association.html" },
    { key:"kg_co",    url:"company.html" },
    { key:"kg_an",    url:"tahlil.html" },
    { key:"kg_by",    url:"xaridor.html" }
  ];
  var CTA_BACK = { uz:"Panelimga qaytish →", ru:"Вернуться в панель →", en:"Back to the profile →" };

  // current localized label — prefer the shared T dictionary, fall back to LABEL
  function label(){
    var lang = localStorage.getItem("kg_lang") || "uz";
    if(typeof T !== "undefined" && T.asst_logout){
      var i = {uz:0,ru:1,en:2}[lang]; return T.asst_logout[i==null?0:i];
    }
    return LABEL[lang] || LABEL.uz;
  }
  function loggedIn(){
    return LOGIN_KEYS.some(function(k){ return sessionStorage.getItem(k) || localStorage.getItem(k); });
  }
  /** The panel this session belongs to, or null when signed out. */
  function myPanel(){
    for(var i=0;i<PANELS.length;i++){
      if(sessionStorage.getItem(PANELS[i].key) || localStorage.getItem(PANELS[i].key)) return PANELS[i].url;
    }
    return null;
  }
  /* The hero's primary call to action is "explore the platform", which is
     the wrong ask for someone already signed in — they came back to get
     to their own panel. Point it there instead. The data-i18n key is
     swapped rather than the text alone, so a later language switch keeps
     the new wording instead of restoring the old one. */
  function retargetHeroCta(){
    var panel = myPanel();
    if(!panel) return;
    var cta = document.querySelector(".hero-cta .btn-primary");
    if(!cta) return;                       // not the home page
    var lang = localStorage.getItem("kg_lang") || "uz";
    cta.href = panel;
    cta.setAttribute("data-i18n","hero_cta_panel");
    if(typeof T !== "undefined" && T.hero_cta_panel){
      var i = {uz:0,ru:1,en:2}[lang];
      cta.textContent = T.hero_cta_panel[i == null ? 0 : i];
    } else {
      cta.textContent = CTA_BACK[lang] || CTA_BACK.uz;
    }
  }
  function logout(){
    KEYS.forEach(function(k){ sessionStorage.removeItem(k); localStorage.removeItem(k); });
    location.href = "assistant.html";
  }
  function inject(){
    // skip pages that already have their own logout control (admin / company / association)
    if(document.getElementById("logoutBtn") || document.getElementById("globalLogout")) return;
    if(!loggedIn()) return;
    retargetHeroCta();
    var bar = document.querySelector(".header-actions");
    if(!bar) return;
    // hide the "Sign in" link — the user is already signed in
    bar.querySelectorAll('a[href="assistant.html"]').forEach(function(a){ a.style.display = "none"; });
    var btn = document.createElement("button");
    btn.id = "globalLogout";
    btn.type = "button";
    btn.className = "btn btn-ghost";
    btn.setAttribute("data-i18n", "asst_logout");   // picked up by each page's applyStatic on language switch
    btn.textContent = label();
    btn.addEventListener("click", logout);
    bar.appendChild(btn);
    // robust fallback: re-label right after the language toggle is clicked
    var langBtn = document.getElementById("langBtn");
    if(langBtn) langBtn.addEventListener("click", function(){ setTimeout(function(){ btn.textContent = label(); }, 0); });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", inject);
  else inject();
})();
