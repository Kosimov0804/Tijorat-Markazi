/* ============================================================
   TIJORAT MARKAZI — web backend (serves the site + AI API)
   Run:  node server.js   (key from gemini.key or GEMINI_API_KEY)
   ============================================================ */
const http  = require("http");
const https = require("https");
const fs    = require("fs");
const path  = require("path");
const url   = require("url");
const { execSync } = require("child_process");
const C = require("./core");

const PORT = process.env.PORT || 4321;
const ROOT = __dirname;

/* ---------- helpers ---------- */
function readBody(req){ return new Promise(res=>{ let b=""; req.on("data",c=>b+=c); req.on("end",()=>{ try{res(JSON.parse(b||"{}"));}catch(e){res({});} }); }); }
function json(res, code, obj){ res.writeHead(code, { "Content-Type":"application/json" }); res.end(JSON.stringify(obj)); }

/* ---- unlimited-AI roles: admin, super-admin (association), company, rais ----
   Credentials are VALIDATED server-side, so a faked client flag can't bypass the limit. */
function isPrivileged(o, auth){
  if(!auth || typeof auth!=="object") return false;
  if(auth.pass==="admin") return true;                                   // admin panel (password "admin")
  const lg = String(auth.login||"").trim(), pw = String(auth.password||"");
  if(!lg) return false;
  if(C.findCompany(o, lg, pw)) return true;                              // company (uyushma a'zosi)
  if(o.rais && o.rais.login===lg && o.rais.password===pw) return true;   // rais
  if((o.associations||[]).some(a=>a.login===lg && a.password===pw)) return true; // super-admin (association)
  return false;
}
const LIMIT_MSG = [
  "Bepul 3 ta savol limiti tugadi.",
  "Лимит 3 бесплатных вопросов исчерпан.",
  "Free limit of 3 questions reached."
];
function limitMsg(lang){ const i={uz:0,ru:1,en:2}[lang]; return LIMIT_MSG[i==null?1:i]; }
function authAssoc(o, login, password){ return o.associations.find(x=>x.login===String(login||"").trim() && x.password===String(password||"")) || null; }

/* ---------- API ---------- */
async function handleApi(req, res, pathname, query){
  if(pathname==="/api/ping") return json(res,200,{ ok:true, ai:!!C.KEY, model:C.MODEL });

  if(pathname==="/api/sessions"){
    const store=C.getStore(); const u=store[query.email]; if(!u) return json(res,200,[]);
    const list=Object.values(u.sessions).filter(s=>s.messages.length)
      .map(s=>({ id:s.id, title:s.title||"…", updated:s.updated })).sort((a,b)=>b.updated-a.updated);
    return json(res,200,list);
  }
  if(pathname==="/api/session"){
    const store=C.getStore(); const s=store[query.email]?.sessions?.[query.id];
    return json(res,200,{ messages: s?s.messages:[] });
  }
  if(pathname==="/api/chat" && req.method==="POST"){
    const { email, id, message, lang, attachment, company, auth } = await readBody(req);
    if(!email||!id||(!message && !attachment)) return json(res,400,{ error:"bad request" });
    const privileged = isPrivileged(C.getOrgs(), auth);
    if(!privileged && C.aiUsageCount(email) >= C.AI_FREE_LIMIT){
      return json(res,200,{ reply: limitMsg(lang), ai:!!C.KEY, limit:true,
        used: C.aiUsageCount(email), max: C.AI_FREE_LIMIT, remaining: 0, privileged:false });
    }
    const reply = await C.answer({ email, sessionId:id, message, attachment, lang, company: String(company||"").slice(0,160) });
    const used = privileged ? null : C.aiUsageInc(email);
    return json(res,200,{ reply, ai:!!C.KEY, limit:false, privileged,
      max: privileged?null:C.AI_FREE_LIMIT, used,
      remaining: privileged?null:Math.max(0, C.AI_FREE_LIMIT-(used||0)) });
  }
  /* ---- AI usage / limit status for the assistant page ---- */
  if(pathname==="/api/ai-usage" && req.method==="POST"){
    const { email, auth } = await readBody(req);
    const privileged = isPrivileged(C.getOrgs(), auth);
    const used = C.aiUsageCount(email);
    return json(res,200,{ privileged, max: privileged?null:C.AI_FREE_LIMIT, used,
      remaining: privileged?null:Math.max(0, C.AI_FREE_LIMIT-used) });
  }
  if(pathname==="/api/ask" && req.method==="POST"){
    const { message, history, lang, attachment, guestId } = await readBody(req);
    if(!message && !attachment) return json(res,400,{ error:"bad request" });
    // Demo / guest users (no login) are limited to AI_FREE_LIMIT questions, counted
    // per browser via guestId — same counter store as logged-in email users.
    const key = String(guestId||"").slice(0,80) || null;
    if(key && C.aiUsageCount(key) >= C.AI_FREE_LIMIT){
      return json(res,200,{ reply: limitMsg(lang), ai:!!C.KEY, limit:true, privileged:false,
        used: C.aiUsageCount(key), max: C.AI_FREE_LIMIT, remaining: 0 });
    }
    const msgs = (history||[]).map(m=>({ role:m.role, text:m.text }));
    const turn = C.buildUserTurn(message, attachment);
    msgs.push({ role:"user", text: turn.text, image: turn.media });
    let reply = await C.callGemini(msgs, lang);
    if(!reply) reply = C.fallbackReply(message||"", lang);
    const used = key ? C.aiUsageInc(key) : null;
    return json(res,200,{ reply, ai:!!C.KEY, limit:false, privileged:false,
      max: key?C.AI_FREE_LIMIT:null, used,
      remaining: used!=null ? Math.max(0, C.AI_FREE_LIMIT-used) : null });
  }
  if(pathname==="/api/transcribe" && req.method==="POST"){
    const { audio, mime } = await readBody(req);
    if(!audio) return json(res,400,{ error:"no audio" });
    const text = await C.transcribe(audio, mime);
    return json(res,200,{ text: text||"" });
  }
  if(pathname==="/api/conference" && req.method==="GET"){
    // ?manage=1[&assoc=ID] → scope-only list (admin/uyushma manage)
    // ?list=1[&assoc=ID]   → company view (assoc meetings + global)
    if(query.manage!==undefined) return json(res,200,{ meetings: C.confList(query.assoc||"global") });
    if(query.list){
      if(query.assoc) return json(res,200,{ meetings: C.confVisible(query.assoc) });
      return json(res,200,{ meetings: C.confList("global") });
    }
    if(query.assoc) return json(res,200, C.getAssocConference(query.assoc) || {});   // next single (banner)
    return json(res,200, C.getConference() || {});
  }
  if(pathname==="/api/conference" && req.method==="POST"){
    const b = await readBody(req);
    if(b.pass!=="admin") return json(res,403,{ error:"forbidden" });
    const scope = String(b.assocId||"").trim();   // empty → global; otherwise a specific uyushma
    if(b.removeId){ C.confRemove(scope, b.removeId); return json(res,200,{ ok:true, meetings: C.confList(scope) }); }
    C.confAdd(scope, b);
    return json(res,200,{ ok:true, meetings: C.confList(scope) });
  }
  /* ---- super-admin: associations + member companies ---- */
  if(pathname==="/api/orgs" && req.method==="POST"){
    const b = await readBody(req);
    if(b.pass!=="admin") return json(res,403,{ error:"forbidden" });
    const o = C.getOrgs();
    const S = (v,n)=>String(v||"").slice(0,n);
    const op = b.op;
    if(op==="assoc.add"){
      o.associations.push({ id:C.uid("a"), name:S(b.name,200), chairman:S(b.chairman,120) });
    } else if(op==="assoc.update"){
      const a=o.associations.find(x=>x.id===b.id);
      if(a){
        if(b.name!=null)a.name=S(b.name,200);
        if(b.chairman!=null)a.chairman=S(b.chairman,120);
        if(b.login!=null){ const lg=S(b.login,60).trim(); if(lg && !o.associations.some(x=>x!==a&&x.login===lg)) a.login=lg; }
        if(b.password)a.password=S(b.password,120);
      }
    } else if(op==="assoc.del"){
      o.associations=o.associations.filter(x=>x.id!==b.id);
      o.companies=o.companies.filter(c=>c.assocId!==b.id);
    } else if(op==="company.add"){
      const login=S(b.login,60).trim();
      if(!login||!b.password) return json(res,400,{ error:"login & password required" });
      if(o.companies.some(c=>c.login===login)) return json(res,409,{ error:"login exists" });
      o.companies.push({ id:C.uid("c"), name:S(b.name,200), assocId:S(b.assocId,40),
        sector:S(b.sector,120), login, password:S(b.password,120), showroom:[], created:Date.now() });
    } else if(op==="company.update"){
      const c=o.companies.find(x=>x.id===b.id);
      if(c){ if(b.name!=null)c.name=S(b.name,200); if(b.assocId!=null)c.assocId=S(b.assocId,40);
        if(b.sector!=null)c.sector=S(b.sector,120); if(b.password)c.password=S(b.password,120); }
    } else if(op==="company.del"){
      o.companies=o.companies.filter(x=>x.id!==b.id);
    } else if(op==="rais.set"){
      const lg=S(b.login,60).trim(); if(lg) o.rais.login=lg; if(b.password) o.rais.password=S(b.password,120);
      if(b.tgChat!=null) o.rais.tgChat=S(b.tgChat,40).trim();
    } else if(op!=="list"){
      return json(res,400,{ error:"unknown op" });
    }
    if(op&&op!=="list") C.saveOrgs(o);
    return json(res,200,{ ok:true, associations:o.associations, companies:o.companies, rais:o.rais });
  }

  /* ---- rais schedules a meeting (Zoom) → all associations & companies see it ---- */
  if(pathname==="/api/rais/conference" && req.method==="POST"){
    const b = await readBody(req);
    const o = C.getOrgs();
    if(!(b.pass==="admin" || (o.rais && o.rais.login===String(b.login||"").trim() && o.rais.password===String(b.password||""))))
      return json(res,403,{ error:"forbidden" });
    if(b.removeId){ C.confRemove("global", b.removeId); return json(res,200,{ ok:true, meetings: C.confList("global") }); }
    C.confAdd("global", b);
    return json(res,200,{ ok:true, meetings: C.confList("global") });
  }

  /* ---- rais: monthly questions report ---- */
  if(pathname==="/api/rais/questions" && req.method==="POST"){
    const b = await readBody(req);
    const o = C.getOrgs();
    if(!(b.pass==="admin" || (o.rais && o.rais.login===String(b.login||"").trim() && o.rais.password===String(b.password||""))))
      return json(res,403,{ error:"forbidden" });
    const months = C.questionMonths();
    const ym = b.ym || months[0] || "";
    // associations whose member companies asked something this month (for the combined letter)
    const assocs = C.getOrgs().associations.map(a=>{
      const aq = C.assocQuestions(a.id, ym);
      const total = aq.report.reduce((s,q)=>s+q.count,0);
      return { id:a.id, name:a.name, count:total, companies:aq.users.length,
        questions: aq.report.map(q=>({ question:q.question, count:q.count, companies:q.companies })) };
    }).filter(a=>a.count>0).sort((x,y)=>y.count-x.count);
    return json(res,200,{ ok:true, months, ym, report: C.questionsReport(ym), users: C.usersReport(ym), assocs });
  }

  /* ---- rais: monthly report archive (auto-generated at month end) ---- */
  if(pathname==="/api/rais/reports" && req.method==="POST"){
    const b = await readBody(req);
    const o = C.getOrgs();
    if(!(b.pass==="admin" || (o.rais && o.rais.login===String(b.login||"").trim() && o.rais.password===String(b.password||""))))
      return json(res,403,{ error:"forbidden" });
    const dir = path.join(C.DATA,"reports");
    let archived = [];
    try{ archived = fs.readdirSync(dir).map(f=>(/konglomerat-(\d{4}-\d{2})\.doc/.exec(f)||[])[1]).filter(Boolean); }catch(e){}
    return json(res,200,{ ok:true, months: C.questionMonths(), archived, tgChat: !!(o.rais.tgChat) });
  }

  /* ---- rais: AI writes ONE official letter for ONE recipient (never mixed) ---- */
  if(pathname==="/api/rais/letter" && req.method==="POST"){
    const b = await readBody(req);
    const o = C.getOrgs();
    if(!(b.pass==="admin" || (o.rais && o.rais.login===String(b.login||"").trim() && o.rais.password===String(b.password||""))))
      return json(res,403,{ error:"forbidden" });
    const type = b.type==="company" ? "company" : "email";
    const key  = String(b.key||"").slice(0,160);
    if(!key) return json(res,400,{ error:"no recipient" });
    const questions = C.userQuestions(type, key, b.ym||"");
    if(!questions.length) return json(res,404,{ error:"no questions for this recipient" });
    const letter = await C.generateLetter({ recipient:key, questions, lang:b.lang||"ru" });
    const rec = { id:C.uid("ltr"), recipientType:type, recipientKey:key, recipientLabel:key,
      ym:b.ym||"", subject:"TIJORAT MARKAZI — rasmiy xat", body:letter, requests:questions.length,
      created:Date.now() };
    C.addLetter(rec);
    return json(res,200,{ ok:true, letter:rec });
  }

  /* ---- rais: ONE combined official letter for a WHOLE association
          (all member companies' questions merged into a single letter) ---- */
  if(pathname==="/api/rais/assoc-letter" && req.method==="POST"){
    const b = await readBody(req);
    const o = C.getOrgs();
    if(!(b.pass==="admin" || (o.rais && o.rais.login===String(b.login||"").trim() && o.rais.password===String(b.password||""))))
      return json(res,403,{ error:"forbidden" });
    const a = o.associations.find(x=>x.id===String(b.assocId||""));
    if(!a) return json(res,404,{ error:"association not found" });
    const aq = C.assocQuestions(a.id, b.ym||"");
    // each line carries the question and which member company raised it
    const questions = aq.report.map(q=>
      (q.companies && q.companies.length) ? `${q.question} — (${q.companies.join(", ")})` : q.question);
    if(!questions.length) return json(res,404,{ error:"no questions for this association" });
    const body = await C.generateLetter({ recipient:a.name, questions, lang:b.lang||"ru" });
    const rec = { id:C.uid("ltr"), recipientType:"assoc", recipientKey:a.id, recipientLabel:a.name,
      ym:aq.ym||b.ym||"", subject:"TIJORAT MARKAZI — rasmiy xat", body, requests:questions.length,
      created:Date.now() };
    C.addLetter(rec);
    return json(res,200,{ ok:true, letter:rec });
  }

  /* ---- rais (top oversight): sees ALL associations + their products ---- */
  if(pathname==="/api/rais/login" && req.method==="POST"){
    const { login, password } = await readBody(req);
    const o = C.getOrgs();
    if(!o.rais || o.rais.login!==String(login||"").trim() || o.rais.password!==String(password||""))
      return json(res,401,{ error:"invalid credentials" });
    const associations = o.associations.map(a=>({
      id:a.id, name:a.name, chairman:a.chairman,
      companies: o.companies.filter(c=>c.assocId===a.id)
        .map(c=>({ name:c.name, sector:c.sector, showroom:c.showroom||[] }))
    }));
    return json(res,200,{ ok:true, associations });
  }

  /* ---- public: associations directory + single association page ---- */
  if(pathname==="/api/assoc/list" && req.method==="GET"){
    const o = C.getOrgs();
    return json(res,200, o.associations.map(a=>({
      id:a.id, name:a.name, chairman:a.chairman,
      companies: o.companies.filter(c=>c.assocId===a.id).length })));
  }
  /* ---- public Showroom: all products across all companies (for the home page) ---- */
  if(pathname==="/api/showroom" && req.method==="GET"){
    const o = C.getOrgs();
    const aById = {}; o.associations.forEach(a=>{ aById[a.id]=a.name; });
    const items = [];
    o.companies.forEach(c=>{
      (c.showroom||[]).forEach(p=>{
        if(!p || !(p.name || p.img)) return;
        items.push({ name:p.name||"", price:p.price||"", desc:p.desc||"", img:p.img||"",
          company:c.name||"", sector:c.sector||"", assoc:aById[c.assocId]||"" });
      });
    });
    // filter option lists cover ALL registered orgs (not only those that already have products)
    const sectors   = [...new Set(o.companies.map(c=>c.sector).filter(Boolean))].sort();
    const assocs    = [...new Set(o.associations.map(a=>a.name).filter(Boolean))].sort();
    const companies = [...new Set(o.companies.map(c=>c.name).filter(Boolean))].sort();
    return json(res,200,{ items, sectors, assocs, companies, total:items.length });
  }
  if(pathname==="/api/assoc/public" && req.method==="GET"){
    const o = C.getOrgs();
    const a = o.associations.find(x=>x.id===query.id);
    if(!a) return json(res,404,{ error:"not found" });
    return json(res,200,{ assoc:{ id:a.id, name:a.name, chairman:a.chairman },
      companies: o.companies.filter(c=>c.assocId===a.id)
        .map(c=>({ name:c.name, sector:c.sector, products:(c.showroom||[]).length })) });
  }

  /* ---- association panel: login + manage own companies ---- */
  if(pathname==="/api/assoc/login" && req.method==="POST"){
    const { login, password } = await readBody(req);
    const o = C.getOrgs();
    const a = o.associations.find(x=>x.login===String(login||"").trim() && x.password===String(password||""));
    if(!a) return json(res,401,{ error:"invalid credentials" });
    const comps = o.companies.filter(c=>c.assocId===a.id)
      .map(c=>({ id:c.id, name:c.name, sector:c.sector, login:c.login, password:c.password, showroom:c.showroom||[], created:c.created||null }));
    return json(res,200,{ ok:true, assoc:{ id:a.id, name:a.name, chairman:a.chairman }, companies:comps });
  }
  if(pathname==="/api/assoc/companies" && req.method==="POST"){
    const b = await readBody(req);
    const o = C.getOrgs();
    const a = o.associations.find(x=>x.login===String(b.login||"").trim() && x.password===String(b.password||""));
    if(!a) return json(res,401,{ error:"invalid credentials" });
    const S=(v,n)=>String(v||"").slice(0,n);
    if(b.op==="add"){
      const clogin=S(b.clogin,60).trim();
      if(!clogin||!b.cpassword) return json(res,400,{ error:"login & password required" });
      if(o.companies.some(c=>c.login===clogin)) return json(res,409,{ error:"login exists" });
      o.companies.push({ id:C.uid("c"), name:S(b.name,200), assocId:a.id, sector:S(b.sector,120),
        login:clogin, password:S(b.cpassword,120), showroom:[], created:Date.now() });
    } else if(b.op==="del"){
      const c=o.companies.find(x=>x.id===b.id);
      if(c && c.assocId===a.id) o.companies=o.companies.filter(x=>x.id!==b.id);
    } else {
      return json(res,400,{ error:"unknown op" });
    }
    C.saveOrgs(o);
    const comps = o.companies.filter(c=>c.assocId===a.id)
      .map(c=>({ id:c.id, name:c.name, sector:c.sector, login:c.login, password:c.password, showroom:c.showroom||[], created:c.created||null }));
    return json(res,200,{ ok:true, companies:comps });
  }
  /* ---- Super Admin: questions ONLY from its own companies ---- */
  if(pathname==="/api/assoc/questions" && req.method==="POST"){
    const b = await readBody(req);
    const a = authAssoc(C.getOrgs(), b.login, b.password);
    if(!a) return json(res,401,{ error:"invalid credentials" });
    return json(res,200, C.assocQuestions(a.id, b.ym||""));
  }
  /* ---- Super Admin: official AI letter for one of ITS OWN companies ---- */
  if(pathname==="/api/assoc/letter" && req.method==="POST"){
    const b = await readBody(req);
    const a = authAssoc(C.getOrgs(), b.login, b.password);
    if(!a) return json(res,401,{ error:"invalid credentials" });
    const key = String(b.key||"");
    if(!C.assocOwnsCompany(a.id, key)) return json(res,403,{ error:"not your company" });
    const questions = C.userQuestions("company", key, b.ym||"");
    const body = await C.generateLetter({ recipient:key, questions, lang:b.lang||"uz" });
    return json(res,200,{ ok:true, letter:{ recipientLabel:key, recipientType:"company", body } });
  }
  /* ---- Super Admin: monthly report preview (own companies) ---- */
  if(pathname==="/api/assoc/report" && req.method==="POST"){
    const b = await readBody(req);
    const o = C.getOrgs();
    const a = authAssoc(o, b.login, b.password);
    if(!a) return json(res,401,{ error:"invalid credentials" });
    const months = C.assocQuestions(a.id, "").months;
    const ym = b.ym || months[0] || "";
    const data = C.assocReportData(ym).find(x=>x.id===a.id) || { companies:[], companyCount:0, questions:0 };
    return json(res,200,{ ym, months, assoc:a.name,
      companyCount:data.companyCount, questions:data.questions,
      companies:(data.companies||[]).map(c=>({ name:c.name, questions:c.questions, products:c.products })) });
  }
  /* ---- Super Admin: monthly report Word download (own companies) ---- */
  if(pathname==="/api/assoc/report.doc"){
    const o = C.getOrgs();
    const a = authAssoc(o, query.login, query.password);
    if(!a){ res.writeHead(401,{ "Content-Type":"text/plain" }); return res.end("invalid credentials"); }
    const doc = await C.assocReportOne(a.id, query.ym||"", { force: query.fresh==="1" });
    res.writeHead(200,{ "Content-Type":"application/msword",
      "Content-Disposition":`attachment; filename="${String(a.name||"uyushma").toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,40)}-${(query.ym||"all").replace(/[^0-9a-zA-Z-]/g,"")}.doc"` });
    return res.end(doc);
  }
  /* ---- Super Admin: AI news for its own sphere (association topic) ---- */
  if(pathname==="/api/assoc/news" && req.method==="POST"){
    const b = await readBody(req);
    const a = authAssoc(C.getOrgs(), b.login, b.password);
    if(!a) return json(res,401,{ error:"invalid credentials" });
    const items = await C.sectorNews(a.name, b.lang);
    return json(res,200,{ ok:true, sphere:a.name, items });
  }
  /* ---- Super Admin: manage its own online meetings (its companies see them) ---- */
  if(pathname==="/api/assoc/conference" && req.method==="POST"){
    const b = await readBody(req);
    const a = authAssoc(C.getOrgs(), b.login, b.password);
    if(!a) return json(res,401,{ error:"invalid credentials" });
    if(b.op==="list") return json(res,200,{ ok:true, meetings: C.confList(a.id) });
    if(b.removeId){ C.confRemove(a.id, b.removeId); return json(res,200,{ ok:true, meetings: C.confList(a.id) }); }
    C.confAdd(a.id, b);
    return json(res,200,{ ok:true, meetings: C.confList(a.id) });
  }

  /* ---- company panel auth + showroom ---- */
  if(pathname==="/api/company/login" && req.method==="POST"){
    const { login, password } = await readBody(req);
    const o = C.getOrgs();
    const c = C.findCompany(o, login, password);
    if(!c) return json(res,401,{ error:"invalid credentials" });
    const a = o.associations.find(x=>x.id===c.assocId);
    return json(res,200,{ ok:true, company:{ id:c.id, name:c.name, sector:c.sector, assocId:c.assocId||"",
      assocName:a?a.name:"", assocChairman:a?a.chairman:"", showroom:c.showroom||[], bizrows:c.bizrows||[] } });
  }
  /* ---- company: upload showroom photo (any format) ---- */
  if(pathname==="/api/upload" && req.method==="POST"){
    const b = await readBody(req);
    const o = C.getOrgs();
    const c = C.findCompany(o, b.login, b.password);
    if(!c) return json(res,401,{ error:"invalid credentials" });
    const data = String(b.data||"");
    if(!data || data.length > 9_000_000) return json(res,400,{ error:"bad image" });
    const mime = String(b.mime||"");
    const ext = mime.includes("png")?"png": mime.includes("webp")?"webp": mime.includes("gif")?"gif":"jpg";
    const dir = path.join(ROOT, "uploads"); fs.mkdirSync(dir, { recursive:true });
    const name = C.uid("img")+"."+ext;
    try{ fs.writeFileSync(path.join(dir,name), Buffer.from(data,"base64")); }
    catch(e){ return json(res,500,{ error:"write failed" }); }
    return json(res,200,{ ok:true, url:"/uploads/"+name });
  }

  /* ---- company modules: invest projects / news / R&D ---- */
  if(pathname==="/api/company/items" && req.method==="POST"){
    const b = await readBody(req);
    const o = C.getOrgs();
    const c = C.findCompany(o, b.login, b.password);
    if(!c) return json(res,401,{ error:"invalid credentials" });
    const mod = String(b.module||"");
    if(!["invest","news","rnd"].includes(mod)) return json(res,400,{ error:"bad module" });
    const M = C.getModules();
    const S=(v,n)=>String(v||"").slice(0,n);
    if(b.op==="add"){
      M.items.push({ id:C.uid("it"), module:mod, ownerType:"company", ownerId:c.id, ownerName:c.name,
        scope:"company", title:S(b.title,200), body:S(b.body,2000), amount:S(b.amount,60),
        link:S(b.link,500), status:S(b.status,40), created:Date.now() });
      C.saveModules(M);
    } else if(b.op==="del"){
      const it=M.items.find(x=>x.id===b.id);
      if(it && it.ownerType==="company" && it.ownerId===c.id){ M.items=M.items.filter(x=>x.id!==b.id); C.saveModules(M); }
    }
    let items = M.items.filter(x=>x.module===mod && x.ownerType==="company" && x.ownerId===c.id);
    if(mod==="news"){ // company also sees global news (from rais/admin) + its association's news
      const extra = M.items.filter(x=>x.module==="news" && (x.scope==="global" || (x.ownerType==="assoc" && x.ownerId===c.assocId)));
      items = extra.concat(items);
    }
    items = items.sort((a,b2)=>b2.created-a.created);
    return json(res,200,{ ok:true, items });
  }

  /* ---- company: official letters addressed to this company ---- */
  if(pathname==="/api/company/letters" && req.method==="POST"){
    const { login, password } = await readBody(req);
    const o = C.getOrgs();
    const c = C.findCompany(o, login, password);
    if(!c) return json(res,401,{ error:"invalid credentials" });
    return json(res,200,{ ok:true, letters: C.lettersFor("company", c.name) });
  }

  if(pathname==="/api/company/showroom" && req.method==="POST"){
    const { login, password, items } = await readBody(req);
    const o = C.getOrgs();
    const c = C.findCompany(o, login, password);
    if(!c) return json(res,401,{ error:"invalid credentials" });
    const S=(v,n)=>String(v||"").slice(0,n);
    c.showroom = Array.isArray(items) ? items.slice(0,200).map(it=>({
      name:S(it.name,120), price:S(it.price,40), desc:S(it.desc,600), img:S(it.img,1000) })) : [];
    C.saveOrgs(o);
    return json(res,200,{ ok:true, showroom:c.showroom });
  }
  /* ---- admin/rais: all companies' startup/invest projects ---- */
  if(pathname==="/api/admin/projects" && req.method==="POST"){
    const b = await readBody(req); const o = C.getOrgs();
    if(!(b.pass==="admin" || (o.rais && o.rais.login===String(b.login||"").trim() && o.rais.password===String(b.password||"")))) return json(res,403,{ error:"forbidden" });
    return json(res,200,{ ok:true, projects: C.investProjects() });
  }
  /* ---- group chats: one room per association, plus the chairmen's room ----
     A single endpoint serves all three roles. Who the caller is decides
     which rooms they see, so membership is never taken from the request. */
  if(pathname==="/api/group" && req.method==="POST"){
    const b = await readBody(req); const o = C.getOrgs();
    const lg = String(b.login||"").trim(), pw = String(b.password||"");
    let actor = null;
    if(b.pass==="admin") actor = { type:"admin", id:"admin", name:"Administrator" };
    else if(o.rais && o.rais.login===lg && o.rais.password===pw) actor = { type:"rais", id:"rais", name:"Rais" };
    else {
      const a = o.associations.find(x=>x.login===lg && x.password===pw);
      if(a) actor = { type:"assoc", id:a.id, name:a.chairman || a.name };
      else {
        const c = C.findCompany(o, lg, pw);
        if(c) actor = { type:"company", id:c.id, name:c.name, assocId:c.assocId };
      }
    }
    if(!actor) return json(res,401,{ error:"invalid credentials" });

    if(b.op==="list") return json(res,200,{ ok:true, me:{type:actor.type,id:actor.id,name:actor.name}, groups: C.groupsFor(actor) });

    const gid = C.canonicalGroupId(b.group);   // a DM pair sorts to one room
    if(!C.groupAllows(actor, gid)) return json(res,403,{ error:"not a member of this group" });
    if(b.op==="send" && String(b.text||"").trim()){
      return json(res,200,{ ok:true, me:{type:actor.type,id:actor.id,name:actor.name}, messages: C.groupSend(gid, actor, b.text) });
    }
    return json(res,200,{ ok:true, me:{type:actor.type,id:actor.id,name:actor.name}, messages: C.groupThread(gid) });
  }
  /* ---- project chat: company side ---- */
  if(pathname==="/api/company/chat" && req.method==="POST"){
    const b = await readBody(req); const o = C.getOrgs();
    const c = C.findCompany(o, b.login, b.password);
    if(!c) return json(res,401,{ error:"invalid credentials" });
    if(b.op==="send" && String(b.text||"").trim()) C.chatSend(c.id, "company", b.text);
    return json(res,200,{ ok:true, messages: C.chatThread(c.id) });
  }
  /* ---- project chat: admin/rais side ---- */
  if(pathname==="/api/admin/chats" && req.method==="POST"){
    const b = await readBody(req); const o = C.getOrgs();
    if(!(b.pass==="admin" || (o.rais && o.rais.login===String(b.login||"").trim() && o.rais.password===String(b.password||"")))) return json(res,403,{ error:"forbidden" });
    if(b.op==="thread") return json(res,200,{ ok:true, messages: C.chatThread(b.companyId) });
    if(b.op==="send" && String(b.text||"").trim()) return json(res,200,{ ok:true, messages: C.chatSend(b.companyId, "admin", b.text) });
    return json(res,200,{ ok:true, chats: C.chatList() });
  }
  /* ---- company: AI-generated news for the company's sector (read-only) ---- */
  if(pathname==="/api/company/news" && req.method==="POST"){
    const { login, password, lang } = await readBody(req);
    const o = C.getOrgs();
    const c = C.findCompany(o, login, password);
    if(!c) return json(res,401,{ error:"invalid credentials" });
    const items = await C.sectorNews(c.sector, lang);
    return json(res,200,{ ok:true, sector:c.sector||"", items });
  }
  /* ---- company: sales / product-composition data table (manual input) ---- */
  if(pathname==="/api/company/data" && req.method==="POST"){
    const { login, password, rows } = await readBody(req);
    const o = C.getOrgs();
    const c = C.findCompany(o, login, password);
    if(!c) return json(res,401,{ error:"invalid credentials" });
    const S=(v,n)=>String(v||"").slice(0,n);
    c.bizrows = Array.isArray(rows) ? rows.slice(0,200).map(r=>({
      product:S(r.product,160), sales:S(r.sales,60), price:S(r.price,60), composition:S(r.composition,400), note:S(r.note,400) })) : [];
    C.saveOrgs(o);
    return json(res,200,{ ok:true, rows:c.bizrows });
  }
  /* ---- company: AI analysis of the sales/product data table ---- */
  if(pathname==="/api/company/analyze" && req.method==="POST"){
    const { login, password, lang } = await readBody(req);
    const o = C.getOrgs();
    const c = C.findCompany(o, login, password);
    if(!c) return json(res,401,{ error:"invalid credentials" });
    const rows = c.bizrows||[];
    if(!rows.length) return json(res,200,{ ok:true, analysis:"" });
    const LN = { uz:"Uzbek", ru:"Russian", en:"English" }[lang] || "Uzbek";
    const table = rows.map((r,i)=>`${i+1}) Mahsulot: ${r.product||"—"} | Sotuv: ${r.sales||"—"} | Narx: ${r.price||"—"} | Tarkib: ${r.composition||"—"} | Izoh: ${r.note||"—"}`).join("\n");
    const sys = `You are "TIJORAT MARKAZI", a business analyst. Analyze the company's sales & product-composition table and produce a concise, structured analysis in ${LN}.
Cover, as short paragraphs or bullets: (1) overall sales picture and notable trends; (2) best- and worst-performing products; (3) an observation about product composition/quality; (4) 2-3 concrete, practical recommendations. Use ONLY the data given; do not invent numbers. Keep it under ~220 words.`;
    const userText = `Company: ${c.name}\nSector: ${c.sector||"—"}\nData table:\n${table}`;
    const analysis = C.geminiRaw ? await C.geminiRaw(sys, userText) : null;
    return json(res,200,{ ok:true, analysis: analysis || "" });
  }

  /* ---- admin: monthly organizations report (preview + Word) ---- */
  if(pathname==="/api/monthly" && req.method==="GET"){
    return json(res,200, C.monthlyReportData(query.ym||""));
  }
  if(pathname==="/api/monthly.doc"){
    const out = await C.monthlyReportDoc(query.ym||"", { force: query.fresh==="1" });
    res.writeHead(200,{ "Content-Type":"application/msword",
      "Content-Disposition":`attachment; filename="tijorat-markazi-oylik-hisobot-${(query.ym||"all").replace(/[^0-9a-zA-Z-]/g,"")}.doc"` });
    return res.end(out);
  }

  /* ---- admin: per-association reports (one Word file per uyushma) ---- */
  if(pathname==="/api/assoc-reports" && req.method==="GET"){
    const reports = await C.assocReports(query.ym||"", { force:false });
    return json(res,200, { ym: query.ym||"all",
      reports: reports.map(r=>({ id:r.id, assoc:r.assoc, companyCount:r.companyCount, questions:r.questions, filename:r.filename })) });
  }
  if(pathname==="/api/assoc.doc"){
    const reports = await C.assocReports(query.ym||"", { force: query.fresh==="1" });
    const rep = reports.find(r=>r.id===query.id || r.assoc===query.id);
    if(!rep){ res.writeHead(404,{ "Content-Type":"text/plain" }); return res.end("no report for this association"); }
    res.writeHead(200,{ "Content-Type":"application/msword",
      "Content-Disposition":`attachment; filename="${rep.filename}"` });
    return res.end(rep.doc);
  }

  if(pathname==="/api/problems.doc"){
    const out = C.problemsDocHtml(query.email);
    res.writeHead(200,{ "Content-Type":"application/msword", "Content-Disposition":'attachment; filename="konglomerat-murojaatlar.doc"' });
    return res.end(out);
  }
  return json(res,404,{ error:"not found" });
}

/* ---------- static ---------- */
const MIME={ ".html":"text/html; charset=utf-8",".css":"text/css",".js":"text/javascript",".json":"application/json",".doc":"application/msword",".svg":"image/svg+xml",".png":"image/png",".ico":"image/x-icon",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".gif":"image/gif" };
function serveStatic(res, pathname){
  let f = pathname==="/" ? "/index.html" : pathname;
  const p = path.join(ROOT, decodeURIComponent(f));
  if(!p.startsWith(ROOT)){ res.writeHead(403); return res.end("403"); }
  fs.readFile(p,(e,d)=>{ if(e){ res.writeHead(404,{ "Content-Type":"text/html" }); return res.end("404 — not found"); }
    const ext = path.extname(p);
    // never cache the app shell (html/js/css) so every visitor always gets the latest version
    const noCache = ext===".html"||ext===".js"||ext===".css";
    const headers = { "Content-Type": MIME[ext]||"text/plain" };
    if(noCache) headers["Cache-Control"]="no-store, no-cache, must-revalidate, max-age=0";
    res.writeHead(200, headers); res.end(d); });
}

const handler = async (req,res)=>{
  const u = url.parse(req.url, true);
  if(u.pathname.startsWith("/api/")){ try{ await handleApi(req,res,u.pathname,u.query); }catch(e){ console.error(e); json(res,500,{ error:"server error" }); } return; }
  serveStatic(res, u.pathname);
};

/* ---------- self-signed HTTPS (mic on mobile needs HTTPS) ---------- */
function ensureCert(){
  const keyF=path.join(C.DATA,"key.pem"), crtF=path.join(C.DATA,"cert.pem");
  try{
    if(!fs.existsSync(keyF)||!fs.existsSync(crtF)){
      execSync(`openssl req -x509 -newkey rsa:2048 -nodes -keyout "${keyF}" -out "${crtF}" -days 825 -subj "/CN=TIJORAT MARKAZI"`,{stdio:"ignore"});
    }
    return { key:fs.readFileSync(keyF), cert:fs.readFileSync(crtF) };
  }catch(e){ return null; }
}

/* ---------- monthly auto-report: archive Word at month end + optional Telegram to rais ---------- */
function ymNow(){ const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"); }
function readTgToken(){
  if(process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN.trim();
  try{ return fs.readFileSync(path.join(ROOT,"telegram bot","telegram.key"),"utf8").trim(); }catch(e){ return ""; }
}
async function sendDocToRais(token, chat, caption, filename, doc){
  try{
    const form = new FormData();
    form.append("chat_id", String(chat));
    form.append("caption", caption);
    form.append("document", new Blob([doc], { type:"application/msword" }), filename);
    const r = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method:"POST", body:form });
    const j = await r.json(); return !!j.ok;
  }catch(e){ console.error("rais TG send:", e.message); return false; }
}
async function autoArchiveReports(){
  try{
    const reportsRoot = path.join(C.DATA, "reports"); fs.mkdirSync(reportsRoot, { recursive:true });
    const cur = ymNow();
    const token = readTgToken();
    const o = C.getOrgs();
    const chat = process.env.RAIS_TG_CHAT || (o.rais && o.rais.tgChat);
    for(const ym of C.questionMonths()){
      if(ym===cur) continue;                                  // never archive the still-running month
      const dir = path.join(reportsRoot, ym);
      if(fs.existsSync(path.join(dir, ".sent"))) continue;     // already archived + sent
      fs.mkdirSync(dir, { recursive:true });
      // one SEPARATE Word file per association (uyushma), each with letters from its child companies
      const reports = await C.assocReports(ym);
      let sent = 0;
      for(const rep of reports){
        fs.writeFileSync(path.join(dir, rep.filename), rep.doc);
        if(token && chat){
          const ok = await sendDocToRais(token, chat, `📩 ${rep.assoc} — ${ym} (a'zo kompaniyalar murojaatlari: ${rep.companyCount})`, rep.filename, rep.doc);
          if(ok) sent++;
        }
      }
      if(token && chat) fs.writeFileSync(path.join(dir, ".sent"), String(Date.now())); // mark month done only if delivery attempted
      console.log(`  📋 Auto-archived ${ym}: ${reports.length} association file(s)${(token&&chat)?` · ${sent} sent to rais (Telegram)`:" · TG skipped (no token/chat)"}`);
    }
  }catch(e){ console.error("autoArchiveReports:", e.message); }
}

/* ---------- start ---------- */
const HTTPS_PORT = process.env.HTTPS_PORT || 4443;
http.createServer(handler).listen(PORT, ()=>{
  console.log(`\n  TIJORAT MARKAZI server → http://localhost:${PORT}`);
  console.log(`  AI: ${C.KEY ? "ON (Gemini "+C.MODEL+")" : "OFF — demo mode"}`);
  autoArchiveReports();                          // on start: archive any ended month not yet done
  setInterval(autoArchiveReports, 6*60*60*1000); // and re-check every 6h (catches month rollover)
});
const creds = ensureCert();
if(creds){
  https.createServer(creds, handler).listen(HTTPS_PORT, ()=>console.log(`  HTTPS  → https://localhost:${HTTPS_PORT}\n`));
}else{
  console.log(`  HTTPS  → skipped (openssl not found)\n`);
}
