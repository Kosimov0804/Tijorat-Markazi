/* ============================================================
   TIJORAT MARKAZI — the one login page

   Collects a login and a password, hands them to the shared resolver in
   auth.js, and goes wherever it says. This page knows nothing about roles:
   which cabinet you belong to is the resolver's business, not the form's.
   ============================================================ */
(function(){
  "use strict";

  const $ = s => document.querySelector(s);
  const LANGS = ["uz","ru","en"];
  let LANG = localStorage.getItem("kg_lang") || "uz";
  if(!LANGS.includes(LANG)) LANG = "uz";
  const L = () => LANGS.indexOf(LANG);

  const T = {
    ki_eyebrow: ["KIRISH","ВХОД","SIGN IN"],
    ki_title:   ["Kabinetga kirish","Вход в кабинет","Sign in to your cabinet"],
    ki_sub:     ["Login va parolingizni kiriting — tizim sizni o‘z kabinetingizga yo‘naltiradi.",
                 "Введите логин и пароль — система направит вас в ваш кабинет.",
                 "Enter your login and password — you will be taken to your own cabinet."],
    ki_login:   ["Login","Логин","Login"],
    ki_pass:    ["Parol","Пароль","Password"],
    ki_btn:     ["Kirish →","Войти →","Sign in →"],
    ki_roles:   ["Bitta oyna — kompaniya, xaridor, uyushma, tahlilchi va administrator hisoblari uchun.",
                 "Одно окно — для компаний, покупателей, ассоциаций, аналитиков и администраторов.",
                 "One window — for companies, buyers, associations, analysts and administrators."],
    ki_reg:     ["Ro‘yxatdan o‘tish","Регистрация","Register"],
    ki_back:    ["← Saytga qaytish","← Вернуться на сайт","← Back to the site"],
    /* One message for every failure. Saying "no such login" would tell an
       outsider which accounts exist. */
    ki_bad:     ["Login yoki parol noto‘g‘ri.","Неверный логин или пароль.","Wrong login or password."],
    ki_empty:   ["Login va parolni kiriting.","Укажите логин и пароль.","Enter a login and a password."],
    ki_wait:    ["Tekshirilmoqda…","Проверяем…","Checking…"],
  };
  const t = k => (T[k] || ["","",""])[L()];

  function paint(){
    document.documentElement.lang = LANG;
    $("#kiEyebrow").textContent = t("ki_eyebrow");
    $("#kiTitle").textContent   = t("ki_title");
    $("#kiSub").textContent     = t("ki_sub");
    $("#kiLoginLb").textContent = t("ki_login");
    $("#kiPassLb").textContent  = t("ki_pass");
    $("#kiBtn").textContent     = t("ki_btn");
    $("#kiRoles").textContent   = t("ki_roles");
    $("#kiReg").textContent     = t("ki_reg");
    $("#kiBack").textContent    = t("ki_back");
    document.title = t("ki_title") + " — TIJORAT MARKAZI";
  }

  /* Only ever return to a page on this site: an attacker-supplied ?next=
     pointing at another origin would turn the login into an open redirect. */
  function safeNext(){
    const raw = new URLSearchParams(location.search).get("next") || "";
    if(!raw) return null;
    if(!/^[a-z0-9._-]+\.html$/i.test(raw)) return null;
    if(/^kirish\.html$/i.test(raw)) return null;   // never bounce back to here
    return raw;
  }

  /* Someone already signed in has no business on the login page. */
  const stored = k => { try { return JSON.parse(sessionStorage.getItem(k) || "null"); } catch(e){ return null; } };
  function alreadyIn(){
    if(sessionStorage.getItem("kg_admin") === "1") return "admin.html";
    if((stored("kg_as")||{}).login) return "association.html";
    if((stored("kg_co")||{}).login) return "company.html";
    if((stored("kg_an")||{}).login) return "tahlil.html";
    if((stored("kg_by")||{}).login) return "xaridor.html";
    return null;
  }

  const theme = localStorage.getItem("kg_theme") || "light";
  document.documentElement.dataset.theme = theme;
  paint();

  const here = alreadyIn();
  if(here) location.replace(safeNext() || here);

  const form = $("#kiForm"), err = $("#kiErr"), btn = $("#kiBtn");
  let busy = false;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if(busy) return;
    const login = $("#kiLogin").value.trim();
    const pass  = $("#kiPass").value;
    if(!login || !pass){ err.textContent = t("ki_empty"); return; }

    busy = true;
    btn.disabled = true;
    btn.textContent = t("ki_wait");
    err.textContent = "";
    try {
      const target = await kgResolveLogin(login, pass);
      if(target){
        /* Honour ?next= only when it was a real destination; otherwise go to
           whichever cabinet the credentials actually belong to. */
        location.replace(safeNext() || target);
        return;
      }
      err.textContent = t("ki_bad");
      $("#kiPass").value = "";
      $("#kiPass").focus();
    } catch(_){
      err.textContent = t("ki_bad");
    } finally {
      busy = false;
      btn.disabled = false;
      btn.textContent = t("ki_btn");
    }
  });

  $("#kiLogin").focus();
})();
