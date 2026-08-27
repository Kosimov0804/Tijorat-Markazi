/* ============================================================
   TIJORAT MARKAZI — shared cross-role login resolver

   One unified sign-in. The login + password go to /api/auth/login, which
   checks every account tier (admin / super-admin·rais / association /
   company / analyst) and answers with the cabinet to open and the session
   keys that cabinet expects. Returns null when nothing matches.

   Every sign-in screen on the platform routes through this, so a person is
   never told "wrong password" merely because they typed their credentials on
   a page belonging to a different role — they are sent to THEIR page instead.
   That is the whole point: one system, many doors.
   ============================================================ */
async function kgResolveLogin(login, password){
  login = String(login||"").trim();
  password = String(password||"");
  if(!login && !password) return null;

  /* One request. The server checks every tier and answers with the cabinet to
     open plus the session keys that cabinet expects, so the browser never
     learns which tier a login belongs to by watching which probe succeeded —
     and a failed sign-in no longer logs three 401s to the console on its way
     to the right answer. */
  let r;
  try {
    r = await fetch("/api/auth/login", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ login, password })
    });
  } catch(_){ return null; }          // offline is not a pass
  if(!r.ok) return null;

  let data;
  try { data = await r.json(); } catch(_){ return null; }
  if(!data || !data.ok || !data.target) return null;

  /* Only ever a same-site page, never something the response could point
     anywhere it likes. */
  if(!/^[a-z0-9._-]+\.html$/i.test(data.target)) return null;

  const keys = data.keys || {};
  for(const k of Object.keys(keys)){
    if(!/^kg_[a-z_]+$/.test(k)) continue;             // ignore anything unexpected
    try { sessionStorage.setItem(k, String(keys[k])); } catch(_){}
  }
  return data.target;
}

/* Send someone who is not signed in to the one login page, remembering where
   they were headed so they can be returned there afterwards. Cabinet pages
   that still carry their own form do not need this; it exists for any page
   that would rather delegate entirely. */
function kgRequireLogin(next){
  const to = next || (location.pathname.split("/").pop() || "index.html");
  location.replace("kirish.html?next=" + encodeURIComponent(to));
}
