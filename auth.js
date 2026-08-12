/* ============================================================
   TIJORAT MARKAZI — shared cross-role login resolver
   One unified sign-in: the same login + password is tried against
   every account tier (admin / super-admin·rais / association /
   company). On the first match it stores that tier's session key(s)
   and returns the page to open. Returns null when nothing matches.
   Each panel page uses this so a user is never told "wrong password"
   just because they typed another role's credentials on this page —
   they are routed to THEIR page instead.
   ============================================================ */
async function kgResolveLogin(login, password){
  login = String(login||"").trim();
  password = String(password||"");

  // platform admin — fixed password
  if((login==="" || login.toLowerCase()==="admin") && password==="admin"){
    sessionStorage.setItem("kg_admin","1");
    return "admin.html";
  }
  if(!login) return null;

  const post = (url)=>fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({login,password})}).then(r=>r.ok).catch(()=>false);

  // super-admin (rais) — merged into the admin panel
  if(await post("/api/rais/login")){
    sessionStorage.setItem("kg_rais",JSON.stringify({login,password}));
    sessionStorage.setItem("kg_admin","1");
    return "admin.html";
  }
  // association (uyushma) — association.html is still the panel for these
  // accounts, and /api/assoc/login still serves them, so they have to be
  // resolved here too. Leaving them out made all 41 chairman accounts
  // unable to sign in from the shared login box.
  if(await post("/api/assoc/login")){
    sessionStorage.setItem("kg_as",JSON.stringify({login,password}));
    return "association.html";
  }
  // company (kompaniya)
  if(await post("/api/company/login")){
    sessionStorage.setItem("kg_co",JSON.stringify({login,password}));
    return "company.html";
  }
  return null;
}
