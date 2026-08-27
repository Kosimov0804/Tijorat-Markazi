/* ============================================================
   TIJORAT MARKAZI — AI Assistant page
   Uses backend (server.js) when available; falls back to
   localStorage + demo replies when it isn't.
   ============================================================ */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $ = (s,r=document)=>r.querySelector(s);
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};

let HAS_BACKEND=false, AI_ON=false, GUEST=false;
// when opened from a company panel (?co=Name) questions are tagged with that company
const COMPANY_TAG = (new URLSearchParams(location.search).get("co")||"").slice(0,160);
let email = localStorage.getItem("kg_email") || "";
// stable per-browser id so the Demo (guest) free-question limit survives reloads
let GUEST_ID = localStorage.getItem("kg_guest_id");
if(!GUEST_ID){ GUEST_ID = "guest_"+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem("kg_guest_id",GUEST_ID); }
let sessions = [];          // [{id,title,updated}]
let current = null;         // {id,title,messages:[{role,text}]}

const chatBody=$("#chatBody"), chatStatus=$("#chatStatus"), exList=$("#exList"), sessionList=$("#sessionList");
const SUGGESTS=["sug1","sug2","sug3","sug4","sug5","sug6"];

// Privileged roles (admin / super-admin / company / rais / analyst) get unlimited AI.
// Credentials come from the panel that opened the assistant (same-tab sessionStorage)
// and are VALIDATED server-side — a faked flag won't bypass the limit.
function panelAuth(){
  try{
    if(sessionStorage.getItem("kg_admin")==="1") return { role:"admin", pass:"admin" };
    const co=JSON.parse(sessionStorage.getItem("kg_co")||"null"); if(co&&co.login) return { role:"company", login:co.login, password:co.password };
    const as=JSON.parse(sessionStorage.getItem("kg_as")||"null"); if(as&&as.login) return { role:"assoc",   login:as.login, password:as.password };
    const an=JSON.parse(sessionStorage.getItem("kg_an")||"null"); if(an&&an.login) return { role:"analyst", login:an.login, password:an.password };
  }catch(e){}
  return null;
}
let LIMIT_META=null, LIMIT_REACHED=false;
let ACTIVE=null;                    // in-flight answer, so it can be stopped
let PANEL=false, PANEL_LABEL="", PANEL_HOME="index.html";
// When the assistant is opened from a logged-in panel, sign in automatically using
// that account's identity (no email gate) so the user lands straight in their AI chat.
function autoIdentity(){
  const a=panelAuth();
  if(a){
    if(a.role==="admin") return { email:"admin@konglomerat", label:"Admin", home:"admin.html" };
    const home = a.role==="assoc" ? "association.html" : "company.html";
    const label = COMPANY_TAG || a.login || "";
    return { email:(a.role||"u")+"-"+(a.login||"panel")+"@konglomerat", label, home };
  }
  // fallback: opened from a panel link (?panel=...) even if the session didn't carry —
  // still skip the email gate so company/uyushma users never bounce to the main page
  const panel=(new URLSearchParams(location.search).get("panel")||"");
  const slug=(COMPANY_TAG||"x").toLowerCase().replace(/[^a-z0-9]+/g,"")||"panel";
  if(panel==="admin")   return { email:"admin@konglomerat", label:"Admin", home:"admin.html" };
  if(panel==="assoc")   return { email:"assoc-"+slug+"@konglomerat",   label:COMPANY_TAG||"Uyushma",  home:"association.html" };
  if(panel==="company") return { email:"company-"+slug+"@konglomerat", label:COMPANY_TAG||"Kompaniya", home:"company.html" };
  return null;
}

/* ============================================================
   STORAGE — backend first, localStorage fallback
   ============================================================ */
const LSKEY = ()=>"kg_chats_"+email;
const LSPROB = ()=>"kg_problems_"+email;
function lsAll(){try{return JSON.parse(localStorage.getItem(LSKEY())||'{"sessions":{}}');}catch(e){return {sessions:{}};}}
function lsSave(o){localStorage.setItem(LSKEY(),JSON.stringify(o));}

const API = {
  async sessions(){
    if(HAS_BACKEND){try{const r=await fetch("/api/sessions?email="+encodeURIComponent(email));if(r.ok)return await r.json();}catch(e){}}
    const all=lsAll();return Object.values(all.sessions).filter(s=>s.messages.length)
      .map(s=>({id:s.id,title:s.title||"…",updated:s.updated})).sort((a,b)=>b.updated-a.updated);
  },
  async session(id){
    if(HAS_BACKEND){try{const r=await fetch("/api/session?email="+encodeURIComponent(email)+"&id="+encodeURIComponent(id));if(r.ok)return await r.json();}catch(e){}}
    const all=lsAll();const s=all.sessions[id];return {messages:s?s.messages:[]};
  },
  async ask(history,message,attachment,signal){
    if(HAS_BACKEND){try{const r=await fetch("/api/ask",{method:"POST",headers:{"Content-Type":"application/json"},signal,
      body:JSON.stringify({message,history,lang:LANG,attachment,guestId:GUEST_ID})});if(r.ok){return await r.json();}}catch(e){ if(e.name==="AbortError") throw e; }}
    return { reply: demoReply(message) };
  },
  async chat(id,message,attachment,signal){
    if(HAS_BACKEND){
      try{const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},signal,
        body:JSON.stringify({email,id,message,lang:LANG,attachment,company:COMPANY_TAG,auth:panelAuth()})});
        if(r.ok){return await r.json();}}catch(e){ if(e.name==="AbortError") throw e; }
    }
    // fallback: demo reply + persist to localStorage
    const note = attachment ? " 📎 "+(attachment.name||"file") : "";
    const reply = demoReply(message);
    const all=lsAll();
    const s=all.sessions[id]||(all.sessions[id]={id,title:"",created:Date.now(),updated:Date.now(),messages:[]});
    s.messages.push({role:"user",text:(message+note).trim(),time:Date.now()});
    if(!s.title)s.title=(message||attachment?.name||"…").slice(0,46);
    s.messages.push({role:"assistant",text:reply,time:Date.now()});
    s.updated=Date.now();lsSave(all);
    const probs=JSON.parse(localStorage.getItem(LSPROB())||"[]");probs.push({time:Date.now(),question:(message+note).trim()});
    localStorage.setItem(LSPROB(),JSON.stringify(probs));
    return { reply };
  },
};
function demoReply(message){const q=message.toLowerCase();const f=RESPONSES.find(r=>r.k.some(k=>q.includes(k)));return f?f.a[L()]:DEFAULT_REPLY[L()];}

/* ============================================================
   CHAT UI
   ============================================================ */
function addMsg(text,who){const m=el("div","msg "+who,linkify(esc(text)));chatBody.appendChild(m);chatBody.scrollTop=chatBody.scrollHeight;return m;}
/* A generated file arrives as a /uploads/... path in the reply. Turn it into a
   real download button — the whole point is that the user gets the file. */
const FILE_ICON={pdf:"📕",docx:"📘",xlsx:"📗",pptx:"📙"};
/* Same card the group chat uses for attachments: icon tile, name, size. */
function humanSize(n){
  n = Number(n)||0;
  if(n < 1024) return n + " B";
  if(n < 1024*1024) return (n/1024).toFixed(0) + " KB";
  return (n/1024/1024).toFixed(1) + " MB";
}
function fileBtn(url,label,size){
  const name = label || url.split("/").pop();
  const ext  = url.split(".").pop().toLowerCase();
  return '<a class="msg-file" href="'+url+'" download="'+name+'">'
       +   '<span class="msg-file-ic">'+(FILE_ICON[ext]||"📄")+'</span>'
       +   '<span class="msg-file-tx"><b>'+name+'</b><em>'+(size ? humanSize(size) : ext.toUpperCase())+'</em></span>'
       + '</a>';
}
/* Pull any file the reply links out of the sentence, so the message reads as
   prose and every file shows up as its own card underneath — the same shape a
   chat attachment has. Returns the cleaned text plus what was extracted. */
const FILE_RE = /\/uploads\/[A-Za-z0-9._-]+\.(?:pdf|docx|xlsx|pptx)/;
function splitFiles(text){
  const found = [];
  let clean = String(text||"")
    .replace(new RegExp("\\[([^\\]\\n]+)\\]\\((" + FILE_RE.source + ")\\)", "g"),
             (_, label, url) => { found.push({ url, name:label }); return ""; })
    .replace(new RegExp("(^|\\s)(" + FILE_RE.source + ")", "g"),
             (_, pre, url) => { found.push({ url, name:url.split("/").pop() }); return pre; });
  clean = clean
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]*([:\-—–])[ \t]*$/gm, "")   // "…yuklab olish:" left dangling by the removal
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { text:clean, files:found };
}
/* Merge what the server reported with what the text mentioned, without
   showing the same document twice. */
function mergeFiles(fromApi, fromText){
  const out = [], seen = new Set();
  for(const f of [].concat(fromApi||[], fromText||[])){
    if(!f || !f.url || seen.has(f.url)) continue;
    seen.add(f.url);
    const better = (fromApi||[]).find(x => x && x.url === f.url) || f;   // API knows the size
    out.push({ url:f.url, name:better.name || f.name, size:better.size });
  }
  return out;
}
function attachFiles(bubble, files){
  if(!bubble || !files || !files.length) return;
  const row = el("div","msg-files");
  row.innerHTML = files.map(f => fileBtn(f.url, f.name, f.size)).join("");
  bubble.appendChild(row);
  chatBody.scrollTop = chatBody.scrollHeight;
}
function linkify(html){ return html; }   // file links are handled by splitFiles now
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>");}
function renderChat(){
  chatBody.innerHTML="";
  syncExamples();                 // new chat shows them again; an opened one does not
  addMsg(T.chat_greeting[L()],"bot");
  // reopening an old conversation must bring its files back with it
  (current?.messages||[]).forEach(m=>{
    if(m.role==="user"){ addMsg(m.text,"user"); return; }
    const split = splitFiles(m.text);
    const bubble = addMsg(split.text || m.text, "bot");
    attachFiles(bubble, mergeFiles(m.files, split.files));
  });
}
async function send(text){
  const att=pendingAttachment;
  if(!text && !att) return;
  if(LIMIT_REACHED){ updateLimitUI(LIMIT_META); return; }   // regular user out of free questions
  if(!current) newChat();
  const history=current.messages.slice();
  const disp=(text+(att?"  📎 "+att.name:"")).trim();
  addMsg(disp,"user");
  current.messages.push({role:"user",text:disp});
  syncExamples();                 // first message sent → the starter chips step aside
  clearAttach();
  const typing=el("div","msg bot typing","<span></span><span></span><span></span>");
  chatBody.appendChild(typing);chatBody.scrollTop=chatBody.scrollHeight;
  chatStatus.textContent=T.chat_typing[L()];
  ACTIVE = new AbortController();
  setBusy(true);
  let out=null, stopped=false;
  try{
    out = GUEST ? await API.ask(history,text,att,ACTIVE.signal)
                : await API.chat(current.id,text,att,ACTIVE.signal);
  }catch(e){ stopped = !!(e && e.name==="AbortError"); }
  finally{ setBusy(false); ACTIVE=null; }
  if(stopped){                    // stopped by the user — keep their message, drop the answer
    typing.remove(); chatStatus.textContent=T.chat_online[L()];
    return;
  }
  const reply = (out && out.reply) || demoReply(text||"");
  typing.remove();chatStatus.textContent=T.chat_online[L()];
  const split=splitFiles(reply);
  const files=mergeFiles(out && out.files, split.files);
  const bubble=addMsg(split.text || reply,"bot");
  attachFiles(bubble, files);
  current.messages.push({role:"assistant",text:reply,files:files.length?files:undefined});
  if(out && out.max!=null){ LIMIT_META=out; updateLimitUI(out); }
  if(!current.title||current.title===T.asst_new_title[L()]) current.title=(text||att?.name||"…").slice(0,46);
  if(!GUEST && !(out&&out.limit)) await refreshSessions();
}

/* While an answer is on its way the Send button becomes Stop, so a long
   generation (a document can take a minute) can always be called off. */
function setBusy(on){
  const send=document.querySelector(".ci-send:not(.ci-stop)"), stop=$("#stopBtn");
  if(send) send.hidden=!!on;
  if(stop) stop.hidden=!on;
  chatStatus.textContent = on ? T.chat_typing[L()] : T.chat_online[L()];
}
document.addEventListener("click",e=>{
  if(e.target && e.target.closest && e.target.closest("#stopBtn") && ACTIVE) ACTIVE.abort();
});

/* ---- free-question limit UI (regular email users only) ---- */
function setChatEnabled(on){
  const inp=$("#chatText"); if(inp){ inp.disabled=!on; inp.placeholder = on ? T.chat_ph[L()] : T.limit_over[L()]; }
  const sendBtn=document.querySelector(".ci-send"); if(sendBtn) sendBtn.disabled=!on;
  const micB=$("#micBtn"); if(micB) micB.disabled=!on;
  const attB=$("#attachBtn"); if(attB) attB.disabled=!on;
}
function updateLimitUI(meta){
  const note=$("#limitNote");
  // privileged (admin/super-admin/company/rais) → no limit, hide everything
  if(!meta || meta.privileged || meta.max==null){ if(note) note.hidden=true; LIMIT_REACHED=false; setChatEnabled(true); return; }
  const rem = meta.remaining!=null ? meta.remaining : Math.max(0,(meta.max||3)-(meta.used||0));
  if(note) note.hidden=false;
  if(meta.limit || rem<=0){
    LIMIT_REACHED=true; setChatEnabled(false);
    if(note){ note.className="limit-note is-over"; note.textContent=T.limit_over[L()]; }
  }else{
    LIMIT_REACHED=false; setChatEnabled(true);
    if(note){ note.className="limit-note"; note.textContent=T.limit_left[L()].replace("{n}",rem).replace("{max}",meta.max); }
  }
  syncExamples();                 // the counter shares the chips' bar
}
async function refreshLimit(){
  if(!HAS_BACKEND){ updateLimitUI(null); return; }
  try{
    // guests are tracked by their per-browser id; logged-in users by email
    const r=await fetch("/api/ai-usage",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({email: GUEST ? GUEST_ID : email, auth: GUEST ? null : panelAuth()})});
    if(r.ok){ LIMIT_META=await r.json(); updateLimitUI(LIMIT_META); }
  }catch(e){}
}

/* ---- attachments (document / image) ---- */
let pendingAttachment=null;
const fileInput=$("#fileInput"), attachChip=$("#attachChip");
function clearAttach(){pendingAttachment=null;attachChip.hidden=true;attachChip.innerHTML="";}
function showChip(name,isImg){
  attachChip.hidden=false;
  attachChip.innerHTML=`<div class="attach-chip"><span>${isImg?"🖼":"📄"} ${escAttr(name)}</span><button type="button" id="attachRemove">✕</button></div>`;
  $("#attachRemove").addEventListener("click",clearAttach);
}
function onFile(file){
  if(!file) return;
  const isImg=file.type.startsWith("image/");
  const isText=file.type.startsWith("text/")||/\.(txt|md|csv|json|log)$/i.test(file.name);
  const isDoc=/\.(pdf|docx|xlsx|pptx|doc|xls|ppt)$/i.test(file.name);
  if(isImg){
    const r=new FileReader();r.onload=()=>{pendingAttachment={kind:"image",mime:file.type,data:String(r.result).split(",")[1],name:file.name};showChip(file.name,true);};r.readAsDataURL(file);
  }else if(isText){
    const r=new FileReader();r.onload=()=>{let c=String(r.result);if(c.length>20000)c=c.slice(0,20000);pendingAttachment={kind:"text",name:file.name,content:c};showChip(file.name,false);};r.readAsText(file);
  }else if(isDoc){
    const r=new FileReader();r.onload=()=>{pendingAttachment={kind:"binary",mime:file.type||"application/octet-stream",data:String(r.result).split(",")[1],name:file.name};showChip(file.name,false);};r.readAsDataURL(file);
  }else{ UI.alert(T.attach_bad[L()]); }
}
$("#attachBtn").addEventListener("click",()=>fileInput.click());
fileInput.addEventListener("change",e=>{onFile(e.target.files[0]);fileInput.value="";});

/* ---- voice input (recording works; transcription is currently unavailable —
   Claude has no audio input, see claude.js) ---- */
const micBtn=$("#micBtn");
let mediaRec=null, recording=false, chunks=[];
function micNote(msg){chatStatus.textContent=msg;chatStatus.style.color="#e25a4a";
  setTimeout(()=>{chatStatus.style.color="";chatStatus.textContent=T.chat_online[L()];},4500);}
function blobToB64(blob){return new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(String(fr.result).split(",")[1]);fr.readAsDataURL(blob);});}
async function startRec(){
  if(!navigator.mediaDevices||!window.MediaRecorder){micNote(T.mic_err[L()]);return;}
  if(!window.isSecureContext){micNote(T.mic_https[L()]);return;}   // mic needs HTTPS (or localhost)
  let stream;
  try{stream=await navigator.mediaDevices.getUserMedia({audio:true});}
  catch(e){micNote(T.mic_denied[L()]);return;}
  chunks=[];
  let opts;
  try{ if(window.MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported("audio/webm")) opts={mimeType:"audio/webm"};
       else if(window.MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported("audio/mp4")) opts={mimeType:"audio/mp4"}; }catch(e){}
  try{mediaRec=new MediaRecorder(stream,opts);}catch(e){mediaRec=new MediaRecorder(stream);}
  mediaRec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
  mediaRec.onstop=async()=>{
    stream.getTracks().forEach(t=>t.stop());
    recording=false;micBtn.classList.remove("rec");
    const blob=new Blob(chunks,{type:mediaRec.mimeType||"audio/webm"});
    chatStatus.style.color="";chatStatus.textContent=T.mic_transcribing[L()];
    let text="";
    if(HAS_BACKEND){try{const b64=await blobToB64(blob);
      const r=await fetch("/api/transcribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({audio:b64,mime:blob.type})});
      if(r.ok) text=(await r.json()).text||"";}catch(e){}}
    chatStatus.textContent=T.chat_online[L()];
    if(text){const inp=$("#chatText");inp.value=(inp.value?inp.value+" ":"")+text;inp.focus();}
    else micNote(T.mic_err[L()]);
  };
  mediaRec.start();recording=true;micBtn.classList.add("rec");
  chatStatus.style.color="";chatStatus.textContent=T.mic_listening[L()];
}
micBtn.addEventListener("click",()=>{ if(recording){try{mediaRec.stop();}catch(e){}} else startRec(); });

/* ============================================================
   SESSIONS
   ============================================================ */
function newChat(){
  current={id:"sess_"+Date.now(),title:T.asst_new_title[L()],messages:[]};
  renderChat();renderSessionList();$("#chatText").focus();
}
async function openSession(id){
  const data=await API.session(id);
  const meta=sessions.find(s=>s.id===id)||{id,title:"…"};
  current={id,title:meta.title,messages:(data.messages||[]).map(m=>({role:m.role,text:m.text}))};
  renderChat();renderSessionList();
}
async function refreshSessions(){sessions=await API.sessions();renderSessionList();}
function renderSessionList(){
  sessionList.innerHTML="";
  if(!sessions.length){sessionList.appendChild(el("p","session-empty",T.asst_hist_empty[L()]));return;}
  sessions.forEach(s=>{
    const it=el("button","session-item"+(current&&current.id===s.id?" active":""),
      `<b>${escAttr(s.title)}</b><span>${new Date(s.updated).toLocaleDateString()} ${new Date(s.updated).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>`);
    it.addEventListener("click",()=>openSession(s.id));
    sessionList.appendChild(it);
  });
}
function escAttr(s){return String(s||"").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

/* ============================================================
   EXAMPLES
   ============================================================ */
function renderExamples(){
  exList.innerHTML="";
  SUGGESTS.forEach(k=>{
    const b=el("button",null,T[k][L()]);
    b.addEventListener("click",()=>send(b.textContent));
    exList.appendChild(b);
  });
  syncExamples();
}
/* The example prompts are a starting point, not a permanent fixture — once the
   conversation is under way they only eat room the messages could use. The free
   question counter shares the same bar, so the bar itself stays whenever that
   counter is showing. */
function syncExamples(){
  const bar=document.querySelector(".ex-bar"); if(!bar) return;
  const started=!!(current && current.messages && current.messages.length);
  bar.classList.toggle("is-chatting", started);
  const note=$("#limitNote");
  bar.hidden = started && !(note && !note.hidden);
}

/* ============================================================
   AUTH (email)
   ============================================================ */
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);}
function showLogin(){
  $("#asstLogin").hidden=false;$("#asstApp").hidden=true;
  const de=$("#demoErr"); if(de) de.textContent="";
  setTimeout(()=>$("#loginInput").focus(),50);
}
function updateAccountUI(){
  if(GUEST){
    const demoEmail=localStorage.getItem("kg_demo_email")||"";
    $("#uEmail").textContent=demoEmail || T.asst_guest_label[L()];
    $("#switchEmail").textContent=T.asst_signin_email[L()];
    $("#switchEmail").hidden=false;
    $("#histPanel").hidden=true;
  }else if(PANEL){
    // panel user: show their account label, hide "change email", add a back-to-panel link
    $("#uEmail").textContent=PANEL_LABEL||email;
    $("#switchEmail").hidden=true;
    $("#histPanel").hidden=false;
    const home=$("#homeBtn");
    if(home){ home.href=PANEL_HOME; home.textContent="← "+T.asst_back_panel[L()]; }
    // hide the public site navigation — this is their cabinet AI page, not the main site
    const navEl=$("#nav");    if(navEl) navEl.style.display="none";
    const burgerEl=$("#burger"); if(burgerEl) burgerEl.style.display="none";
    // keep the theme/lang/back buttons pinned to the top-right (nav used to be the spacer)
    const acts=$(".header-actions"); if(acts) acts.style.marginLeft="auto";
  }else{
    $("#uEmail").textContent=email;
    $("#switchEmail").hidden=false;
    $("#switchEmail").textContent=T.asst_logout[L()];
    $("#histPanel").hidden=false;
  }
}
async function startApp(){
  GUEST=false;
  $("#asstLogin").hidden=true;$("#asstApp").hidden=false;
  updateAccountUI();
  await refreshLimit();
  await refreshSessions();
  if(sessions.length) openSession(sessions[0].id); else newChat();
}
function startGuest(demoEmail){
  GUEST=true;localStorage.removeItem("kg_email");email="";sessions=[];current=null;
  if(demoEmail){ GUEST_ID=demoEmail; localStorage.setItem("kg_guest_id",demoEmail); localStorage.setItem("kg_demo_email",demoEmail); }
  $("#asstLogin").hidden=true;$("#asstApp").hidden=false;
  updateAccountUI();newChat();refreshLimit();   // show remaining free-question count
}
// Unified login: kgResolveLogin (auth.js) tries the credentials against every
// account tier and, on a match, returns the page to open with the right session
// key already stored. Each panel auto-signs-in from that key on load.
$("#emailForm").addEventListener("submit",async e=>{e.preventDefault();
  const login=$("#loginInput").value.trim();
  const pass=$("#passInput").value;
  if(!login && !pass){$("#emailErr").textContent=T.asst_login_err[L()];return;}
  const btn=e.target.querySelector('button[type="submit"]');
  if(btn) btn.disabled=true;
  $("#emailErr").textContent="";
  const target=await kgResolveLogin(login, pass);
  if(target){ location.href=target; }
  else{ $("#emailErr").textContent=T.asst_login_err[L()]; if(btn) btn.disabled=false; }
});
// Demo access requires a @gmail.com address before entering the guest AI chat.
function gmailOk(v){ return /^[^\s@]+@gmail\.com$/.test(v); }
function demoGo(){
  const v=$("#demoEmailInput").value.trim().toLowerCase();
  if(!gmailOk(v)){ $("#demoErr").textContent=T.asst_demo_email_err[L()]; $("#demoEmailInput").focus(); return; }
  $("#demoErr").textContent=""; startGuest(v);
}
$("#loginClose").addEventListener("click",()=>{ location.href="index.html"; });
$("#demoBtn").addEventListener("click",demoGo);
$("#demoEmailInput").addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); demoGo(); } });
$("#switchEmail").addEventListener("click",()=>{localStorage.removeItem("kg_email");email="";current=null;sessions=[];showLogin();});
$("#newChatBtn").addEventListener("click",newChat);
$("#chatClear").addEventListener("click",newChat);
$("#chatForm").addEventListener("submit",e=>{e.preventDefault();const inp=$("#chatText");const v=inp.value.trim();if(!v)return;inp.value="";send(v);});

/* ============================================================
   LANG + THEME + STATIC
   ============================================================ */
function applyStatic(){
  document.querySelectorAll("[data-i18n]").forEach(n=>{const k=n.dataset.i18n;if(T[k])n.textContent=T[k][L()];});
  document.querySelectorAll("[data-i18n-html]").forEach(n=>{const k=n.dataset.i18nHtml;if(T[k])n.innerHTML=T[k][L()];});
  document.querySelectorAll("[data-i18n-ph]").forEach(n=>{const k=n.dataset.i18nPh;if(T[k])n.placeholder=T[k][L()];});
  document.querySelectorAll("[data-i18n-title]").forEach(n=>{const k=n.dataset.i18nTitle;if(T[k])n.title=T[k][L()];});
  const pill=$("#aiStatus");if(pill){pill.textContent=AI_ON?T.asst_ai_on[L()]:T.asst_ai_off[L()];pill.style.color=AI_ON?"var(--green)":"var(--gold)";}
}
function setLang(lang){
  LANG=lang;localStorage.setItem("kg_lang",lang);document.documentElement.lang=lang;
  $("#langBtn").textContent=lang.toUpperCase();
  applyStatic();renderExamples();renderSessionList();
  if(LIMIT_META) updateLimitUI(LIMIT_META);
  if(!$("#asstApp").hidden) updateAccountUI();
}
$("#langBtn").addEventListener("click",()=>setLang(LANGS[(L()+1)%LANGS.length]));

const themeBtn=$("#themeBtn");
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("kg_theme",theme);themeBtn.innerHTML=theme==="dark"?ICON_SUN:ICON_MOON;}
themeBtn.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));

const burger=$("#burger"),nav=$("#nav");
burger.addEventListener("click",()=>nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));

/* ============================================================
   INIT
   ============================================================ */
async function init(){
  setTheme(localStorage.getItem("kg_theme")||"light");
  document.documentElement.lang=LANG;$("#langBtn").textContent=LANG.toUpperCase();
  try{const r=await fetch("/api/ping");if(r.ok){const j=await r.json();HAS_BACKEND=true;AI_ON=!!j.ai;}}catch(e){HAS_BACKEND=false;}
  applyStatic();renderExamples();
  const ident=autoIdentity();
  if(ident){ PANEL=true; email=ident.email; PANEL_LABEL=ident.label; PANEL_HOME=ident.home; startApp(); }
  else showLogin();   // always gate on login/password (or Demo) — no silent email resume
}
init();
