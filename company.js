/* ============================================================
   TIJORAT MARKAZI — Company panel
   Sections: Dashboard · Showroom · Invest · News · Meeting · R&D · AI
   ============================================================ */
let LANG = localStorage.getItem("kg_lang") || "uz";
if(!LANGS.includes(LANG)) LANG = "uz";
const L = () => LANGS.indexOf(LANG);
const $ = (s,r=document)=>r.querySelector(s);

let creds = null, company = null, activeSec = "dashboard";
try{ creds = JSON.parse(sessionStorage.getItem("kg_co")||"null"); }catch(e){ creds=null; }

/* ---- translations ---- */
const OT = {
  lg_title:["Kompaniya paneli","Панель компании","Company panel"],
  lg_sub:["Login va parol bilan kiring (admin bergan).","Войдите по логину и паролю (выданы админом).","Sign in with the login/password issued by the admin."],
  lg_btn:["Kirish →","Войти →","Sign in →"],
  err:["Login yoki parol noto'g'ri","Неверный логин или пароль","Wrong login or password"],
  logout:["Chiqish","Выход","Logout"],
  back_site:["← Saytga qaytish","← Вернуться на сайт","← Back to site"],
  nav_dash:["Dashboard","Дашборд","Dashboard"],
  nav_show:["Showroom","Витрина","Showroom"],
  nav_invest:["Invest loyihalar","Инвест-проекты","Invest projects"],
  nav_news:["Yangiliklar","Новости","News"],
  nav_letters:["Rasmiy xatlar","Офиц. письма","Official letters"],
  nav_meeting:["Uchrashuv xonasi","Комната встреч","Meeting room"],
  nav_rnd:["R&D xona","R&D комната","R&D room"],
  lt_title:["Rasmiy xatlar","Официальные письма","Official letters"],
  lt_sub:["TIJORAT MARKAZI dan kelgan rasmiy xatlar.","Официальные письма от TIJORAT MARKAZI.","Official letters from TIJORAT MARKAZI."],
  lt_empty:["Hozircha xat yo'q.","Писем пока нет.","No letters yet."],
  nav_ai:["AI Assistant","AI Ассистент","AI Assistant"],
  d_products:["Mahsulotlar","Товары","Products"],
  st_priced:["Narxli","С ценой","Priced"],
  st_photo:["Rasmli","С фото","With photo"],
  st_plain:["Oddiy","Без деталей","Plain"],
  dash_evo:["Faturamiya dinamikasi","Динамика выручки","Revenue evolution"],
  dash_qty:["Sotuvlar dinamikasi","Динамика продаж","Sales evolution"],
  dash_donut:["Mahsulotlar tarkibi","Состав товаров","Products composition"],
  sh_title:["Showroom","Витрина","Showroom"],
  sh_sub:["Mahsulot va xizmatlaringizni qo'shing.","Добавьте свои товары и услуги.","Add your products and services."],
  sh_empty:["Hali mahsulot qo'shilmagan.","Товары ещё не добавлены.","No items yet."],
  sh_name:["Nomi","Название","Name"], sh_price:["Narxi","Цена","Price"], sh_img:["yoki Rasm URL","или URL картинки","or image URL"], sh_desc:["Tavsif","Описание","Description"], sh_add:["+ Qo'shish","+ Добавить","+ Add"],
  sh_file:["Rasm yuklash","Загрузить фото","Upload photo"],
  sh_uploading:["⏳ Yuklanmoqda…","⏳ Загрузка…","⏳ Uploading…"],
  sh_saved:["✓ Saqlandi","✓ Сохранено","✓ Saved"], sh_del:["O'chirish","Удалить","Delete"],
  inv_title:["Invest loyihalar","Инвест-проекты","Invest projects"],
  inv_sub:["Investitsiya loyihalaringizni joylang.","Разместите свои инвест-проекты.","Post your investment projects."],
  inv_empty:["Hali loyiha yo'q.","Проектов пока нет.","No projects yet."],
  news_title:["Yangiliklar","Новости","News"],
  news_sub:["Sohangizga oid AI yangiliklar.","AI-новости по вашей сфере.","AI news for your sector."],
  news_empty:["Yangiliklar yo'q.","Новостей нет.","No news yet."],
  news_loading:["⏳ Yangiliklar yuklanmoqda…","⏳ Загрузка новостей…","⏳ Loading news…"],
  cf_title:["Uchrashuv xonasi","Комната встреч","Meeting room"],
  cf_none:["Hozircha uchrashuv yo'q.","Встреч пока нет.","No meetings yet."],
  cf_when:["Vaqt","Время","Time"], cf_join:["Zoom'ga kirish →","Войти в Zoom →","Join Zoom →"],
  cf_open:["🟢 Ochiq","🟢 Открыто","🟢 Open"], cf_soon:["⏳ Boshlanmagan","⏳ Не начато","⏳ Not started"],
  rnd_title:["R&D xona","R&D комната","R&D room"],
  rnd_sub:["Tadqiqot, ishlanma va g'oyalaringiz.","Исследования, разработки и идеи.","Research, development and ideas."],
  rnd_empty:["Hali yozuv yo'q.","Записей пока нет.","Nothing yet."],
  by_konglomerat:["TIJORAT MARKAZI","TIJORAT MARKAZI","TIJORAT MARKAZI"],
  del:["O'chirish","Удалить","Delete"],
  inv_p_title:["Loyiha nomi","Название проекта","Project name"],
  inv_p_amount:["Summa (masalan $500K)","Сумма (напр. $500K)","Amount (e.g. $500K)"],
  inv_p_status:["Holati (qidirilmoqda…)","Статус (в поиске…)","Status (seeking…)"],
  inv_p_body:["Tavsif","Описание","Description"],
  inv_add:["+ Qo'shish","+ Добавить","+ Add"],
  news_p_title:["Sarlavha","Заголовок","Title"],
  news_p_body:["Matn","Текст","Text"],
  news_p_link:["Havola (ixtiyoriy)","Ссылка (необязательно)","Link (optional)"],
  news_add:["+ E'lon qilish","+ Опубликовать","+ Publish"],
  rnd_p_title:["Mavzu","Тема","Topic"],
  rnd_p_status:["Holati (g'oya / ishlanmoqda…)","Статус (идея / в работе…)","Status (idea / in progress…)"],
  rnd_p_body:["Tavsif","Описание","Description"],
  rnd_add:["+ Qo'shish","+ Добавить","+ Add"],
  nav_data:["Savdo & mahsulot","Продажи & продукт","Sales & product"],
  nav_chat:["Admin bilan aloqa","Чат с админом","Chat with admin"],
  nav_groups:["Guruh chat","Групповой чат","Group chat"],
  ch_title:["Admin bilan aloqa","Чат с админом","Chat with admin"],
  ch_sub:["Loyihangiz bo'yicha savol yozing — admin javob beradi.","Напишите вопрос по проекту — админ ответит.","Ask about your project — the admin will reply."],
  ch_ph:["Savol yozing…","Напишите вопрос…","Write a question…"],
  ch_send:["Yuborish","Отправить","Send"],
  ch_empty:["Hali xabar yo'q. Birinchi savolni yozing.","Сообщений пока нет. Напишите первый вопрос.","No messages yet. Write your first question."],
  bd_title:["Savdo & mahsulot ma'lumotlari","Данные продаж и продукта","Sales & product data"],
  bd_sub:["Savdo, mahsulot tarkibi va boshqa ma'lumotlarni qo'lda kiriting, so'ng AI tahlil qiling.","Заполните вручную данные о продажах, составе продукта и т.д., затем AI-анализ.","Manually fill sales, product composition and other data, then run AI analysis."],
  bd_product:["Mahsulot","Продукт","Product"],
  bd_sales:["Sotuv","Продажи","Sales"],
  bd_price:["Narx","Цена","Price"],
  bd_comp:["Tarkib","Состав","Composition"],
  bd_note:["Izoh","Примечание","Note"],
  bd_row:["Qator","Строку","Row"],
  bd_save:["Saqlash","Сохранить","Save"],
  bd_saved:["✓ Saqlandi","✓ Сохранено","✓ Saved"],
  bd_analyze:["AI tahlil","AI-анализ","AI analysis"],
  bd_analyzing:["⏳ Tahlil qilinmoqda…","⏳ Анализирую…","⏳ Analyzing…"],
  bd_empty:["Avval jadvalga ma'lumot kiriting.","Сначала заполните таблицу.","Fill the table first."],
  bd_aoff:["AI hozircha mavjud emas.","AI сейчас недоступен.","AI is currently unavailable."],
  bd_ahead:["🤖 AI tahlili","🤖 AI-анализ","🤖 AI analysis"],
};
const ot = k => OT[k][L()];
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function escA(s){return esc(s).replace(/"/g,"&quot;");}

/* ---- date + charts ---- */
const MN={uz:["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"],ru:["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],en:["January","February","March","April","May","June","July","August","September","October","November","December"]};
function fmtDateTime(s){const d=new Date(s);if(isNaN(d))return s||"";return `${d.getDate()} ${MN[LANG][d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;}
function fmtDate(s){const d=new Date(s);if(isNaN(d))return"";return `${d.getDate()} ${MN[LANG][d.getMonth()]} ${d.getFullYear()}`;}
function shortMonths(){return MN[LANG].map(m=>m.charAt(0).toUpperCase()+m.slice(1,3));}
const PAL=['#7b7fe0','#5b6fd6','#9a8fe6','#4a5bc0','#b0a9ee'];
function seedRand(seed){let h=2166136261>>>0;const s=String(seed);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return()=>{h+=0x6D2B79F5;let t=h>>>0;t=Math.imul(t^(t>>>15),1|t);t^=t+Math.imul(t^(t>>>7),61|t);return((t^(t>>>14))>>>0)/4294967296;};}
function monthlySeries(seed,base){const r=seedRand(seed);return Array.from({length:12},()=>Math.round(base*(0.45+r()*0.95)));}
function donutSVG(data){
  const total=data.reduce((s,d)=>s+d.value,0)||1;const r=52,C=2*Math.PI*r;let acc=0;
  const rings=data.map(d=>{const dash=d.value/total*C;const c=`<circle cx="70" cy="70" r="${r}" fill="none" stroke="${d.color}" stroke-width="20" stroke-dasharray="${dash.toFixed(2)} ${(C-dash).toFixed(2)}" stroke-dashoffset="${(-acc*C).toFixed(2)}" transform="rotate(-90 70 70)"/>`;acc+=d.value/total;return c;}).join("");
  const legend=data.map(d=>`<div class="lg-row"><span class="lg-dot" style="background:${d.color}"></span><span class="lg-name">${esc(d.label)}</span><b>${Math.round(d.value/total*100)}%</b></div>`).join("");
  return `<div class="donut"><svg viewBox="0 0 140 140" class="donut-svg">${rings}</svg><div class="donut-legend">${legend}</div></div>`;
}
function vbarsSVG(values,labels){
  const w=720,h=210,padX=14,padB=28,padT=22,n=values.length,max=Math.max(1,...values);const slot=(w-padX*2)/n,bw=slot*0.5;
  const bars=values.map((v,i)=>{const bh=(v/max)*(h-padT-padB),x=padX+i*slot+(slot-bw)/2,y=h-padB-bh;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,bh).toFixed(1)}" rx="3" fill="url(#barGrad)"/><text x="${(x+bw/2).toFixed(1)}" y="${(y-6).toFixed(1)}" class="cx-val">${v}</text><text x="${(x+bw/2).toFixed(1)}" y="${h-9}" class="cx-lbl">${labels[i]}</text>`;}).join("");
  return `<svg viewBox="0 0 ${w} ${h}" class="cx"><defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a8fe8"/><stop offset="1" stop-color="#5b6fd6"/></linearGradient></defs>${bars}</svg>`;
}
function areaSVG(values,labels){
  const w=720,h=210,padX=24,padB=28,padT=28,n=values.length,max=Math.max(1,...values);
  const X=i=>padX+(i*(w-padX*2)/(n-1)),Y=v=>h-padB-(v/max)*(h-padT-padB);
  const line=`M${values.map((v,i)=>`${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" L")}`;
  const fill=`${line} L${X(n-1).toFixed(1)},${h-padB} L${X(0).toFixed(1)},${h-padB} Z`;
  const dots=values.map((v,i)=>`<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="3" fill="#b9b3f2"/><text x="${X(i).toFixed(1)}" y="${(Y(v)-9).toFixed(1)}" class="cx-val">${v}</text>`).join("");
  const lbls=labels.map((l,i)=>`<text x="${X(i).toFixed(1)}" y="${h-9}" class="cx-lbl">${l}</text>`).join("");
  return `<svg viewBox="0 0 ${w} ${h}" class="cx"><defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7b7fe0" stop-opacity=".5"/><stop offset="1" stop-color="#7b7fe0" stop-opacity="0"/></linearGradient></defs><path d="${fill}" fill="url(#areaGrad)"/><path d="${line}" fill="none" stroke="#b9b3f2" stroke-width="2.5" stroke-linejoin="round"/>${dots}${lbls}</svg>`;
}

/* ============================================================
   AUTH
   ============================================================ */
function showLogin(){ $("#coLogin").hidden=false; $("#coApp").hidden=true; $("#logoutBtn").hidden=true; $("#aiNav").hidden=true; setTimeout(()=>$("#coLoginInp").focus(),50); }
async function tryLogin(login,password){
  const r=await fetch("/api/company/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({login,password})});
  if(!r.ok) return false;
  const j=await r.json(); company=j.company; creds={login,password};
  sessionStorage.setItem("kg_co",JSON.stringify(creds)); return true;
}
function startApp(){
  $("#coLogin").hidden=true; $("#coApp").hidden=false; $("#logoutBtn").hidden=false; $("#aiNav").hidden=false;
  $("#coName").textContent=company.name||"—";
  $("#coAssoc").textContent=company.assocName||"";
  $("#coSector").textContent=company.sector||"";
  $("#aiNav").href="assistant.html?panel=company&co="+encodeURIComponent(company.name||"");
  buildNav();
  showSection(activeSec);
  renderBanner();
}
$("#coForm").addEventListener("submit",async e=>{e.preventDefault();
  const login=$("#coLoginInp").value.trim(), pass=$("#coPassInp").value;
  if(await tryLogin(login,pass)){ $("#coErr").textContent=""; startApp(); return; }
  // not a company account → maybe admin / super-admin / association: route them there
  const target=await kgResolveLogin(login,pass);
  if(target && target!=="company.html"){ location.href=target; return; }
  $("#coErr").textContent=ot("err");
});
$("#logoutBtn").addEventListener("click",()=>{ sessionStorage.removeItem("kg_co"); creds=null; company=null; showLogin(); });

/* ============================================================
   SIDEBAR NAV + SECTIONS
   ============================================================ */
const NAV=[
  {s:"dashboard",k:"nav_dash",ic:svg('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>')},
  {s:"showroom",k:"nav_show",ic:svg('<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>')},
  {s:"invest",k:"nav_invest",ic:svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5a2.5 2.5 0 0 1 2.5-2 2 2 0 0 1 0 4 2 2 0 0 0 0 4 2.5 2.5 0 0 1-2.5-2"/>')},
  {s:"bizdata",k:"nav_data",ic:svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v4h6V3"/><path d="M8 12h8M8 16h8"/>')},
  {s:"news",k:"nav_news",ic:svg('<path d="M4 4h13a1 1 0 0 1 1 1v13a2 2 0 0 0 2-2V7"/><path d="M4 4a1 1 0 0 0-1 1v13a2 2 0 0 0 2 2h13"/><path d="M7 8h7M7 12h7M7 16h4"/>')},
  {s:"groups",k:"nav_groups",href:"chat.html",ic:svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>')},
  {s:"chat",k:"nav_chat",ic:svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')},
  {s:"meeting",k:"nav_meeting",ic:svg('<path d="M15 10l5-3v10l-5-3z"/><rect x="3" y="6" width="12" height="12" rx="2"/>')},
  {s:"rnd",k:"nav_rnd",ic:svg('<path d="M9 2h6M10 2v6L5 19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1L14 8V2"/><path d="M7 15h10"/>')},
];
const VIEW_TITLE={dashboard:"nav_dash",showroom:"nav_show",invest:"nav_invest",bizdata:"nav_data",news:"nav_news",chat:"nav_chat",meeting:"nav_meeting",rnd:"nav_rnd"};
function buildNav(){
  const nav=$("#coNav"); nav.innerHTML="";
  NAV.forEach(n=>{
    const b=document.createElement("button");
    b.className=(n.s===activeSec?"active":"");
    b.innerHTML=n.ic+`<span>${ot(n.k)}</span>`;
    // The group chat is its own full-screen page, not a panel section.
    b.addEventListener("click",()=> n.href ? (location.href=n.href) : showSection(n.s));
    nav.appendChild(b);
  });
}
function showSection(sec){
  activeSec=sec;
  document.querySelectorAll(".admin-view").forEach(s=>s.classList.toggle("active", s.id==="view-"+sec));
  $("#viewTitle").textContent=ot(VIEW_TITLE[sec]||"nav_dash");
  buildNav();
  if(sec==="dashboard") renderDashboard();
  if(sec==="showroom") renderShowroom();
  if(sec==="invest") loadModule("invest");
  if(sec==="bizdata") renderBizData();
  if(sec==="news") renderSectorNews();
  if(sec==="chat") renderProjectChat();
  if(sec==="meeting") renderConference();
  if(sec==="rnd") loadModule("rnd");
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard(){
  const prods=company.showroom||[];
  const priced=prods.filter(p=>p.price&&String(p.price).trim()).length;
  const photo=prods.filter(p=>p.img&&String(p.img).trim()).length;
  const plain=prods.length-priced;
  $("#kpiLabel").textContent=ot("d_products");
  $("#kpiVal").textContent=prods.length;
  const mini=(v,l)=>`<div><b>${v}</b><span>${l}</span></div>`;
  $("#kpiMini").innerHTML=mini(priced,ot("st_priced"))+mini(photo,ot("st_photo"))+mini(plain,ot("st_plain"))+mini(prods.length,ot("d_products"));
  $("#donutTitle").textContent=ot("dash_donut");
  const dd=[{label:ot("st_priced"),value:Math.max(priced,0),color:PAL[0]},{label:ot("st_photo"),value:Math.max(photo,0),color:PAL[1]},{label:ot("st_plain"),value:Math.max(plain,0),color:PAL[2]}].filter(d=>d.value>0);
  $("#chartDonut").innerHTML=dd.length?donutSVG(dd):`<p class="co-sub">${ot("sh_empty")}</p>`;
  const seed=(company.id||company.name||"c");
  $("#evoTitle").textContent=ot("dash_evo");
  $("#chartMonth").innerHTML=vbarsSVG(monthlySeries(seed+"-rev",Math.max(prods.length*12,50)),shortMonths());
  $("#qtyTitle").textContent=ot("dash_qty");
  $("#chartArea").innerHTML=areaSVG(monthlySeries(seed+"-qty",Math.max(prods.length*8,30)),shortMonths());
}

/* ============================================================
   SHOWROOM
   ============================================================ */
function renderShowroom(){
  const grid=$("#showGrid"); const items=company.showroom||[];
  if(!items.length){ grid.innerHTML=`<p class="co-sub sh-empty">${ot("sh_empty")}</p>`; }
  else grid.innerHTML=items.map((it,i)=>`
    <div class="show-card">
      ${it.img?`<img class="show-img" src="${escA(it.img)}" alt="" loading="lazy">`:`<div class="show-img show-img-ph">🛍️</div>`}
      <div class="show-body"><b>${esc(it.name)}</b>${it.price?`<span class="show-price">${esc(it.price)}</span>`:""}${it.desc?`<p>${esc(it.desc)}</p>`:""}</div>
      <button class="show-del" data-i="${i}" title="${ot("sh_del")}">✕</button>
    </div>`).join("");
  grid.querySelectorAll(".show-del").forEach(b=>b.addEventListener("click",()=>{ company.showroom.splice(+b.dataset.i,1); saveShowroom(); renderShowroom(); }));
}
// downscale any image (keeping aspect ratio) → dataURL, for upload
function fileToScaledDataURL(file, maxDim){
  maxDim=maxDim||1600;
  return new Promise((resolve,reject)=>{
    const img=new Image(); const url=URL.createObjectURL(file);
    img.onload=()=>{
      const scale=Math.min(1, maxDim/Math.max(img.width,img.height));
      const w=Math.max(1,Math.round(img.width*scale)), h=Math.max(1,Math.round(img.height*scale));
      const cv=document.createElement("canvas"); cv.width=w; cv.height=h;
      cv.getContext("2d").drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url);
      try{ resolve(cv.toDataURL("image/jpeg",0.85)); }catch(e){ reject(e); }
    };
    img.onerror=()=>{ URL.revokeObjectURL(url); reject(new Error("img load")); };
    img.src=url;
  });
}
async function uploadFile(file){
  const dataUrl=await fileToScaledDataURL(file);
  const r=await fetch("/api/upload",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({login:creds.login,password:creds.password,data:dataUrl.split(",")[1],mime:"image/jpeg"})});
  if(!r.ok) throw new Error("upload");
  return (await r.json()).url;
}
async function saveShowroom(){
  const r=await fetch("/api/company/showroom",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({login:creds.login,password:creds.password,items:company.showroom})});
  if(r.ok){ const j=await r.json(); company.showroom=j.showroom;
    const sv=$("#shSaved"); sv.textContent=ot("sh_saved"); sv.style.color="var(--green)"; sv.style.opacity=1; clearTimeout(window._sht); window._sht=setTimeout(()=>sv.style.opacity=0,1600); }
}
$("#sh-file").addEventListener("change",e=>{
  const f=e.target.files[0];
  $("#shFileLabel").textContent = f ? (f.name.length>18?f.name.slice(0,16)+"…":f.name) : ot("sh_file");
});
$("#shForm").addEventListener("submit",async e=>{e.preventDefault();
  const name=$("#sh-name").value.trim(); if(!name) return;
  const btn=$("#shAdd"); const file=$("#sh-file").files[0];
  let img=$("#sh-img").value.trim();
  if(file){
    btn.disabled=true; const old=btn.textContent; btn.textContent=ot("sh_uploading");
    try{ img=await uploadFile(file); }catch(err){ alert("Upload error"); }
    btn.disabled=false; btn.textContent=old;
  }
  company.showroom=company.showroom||[];
  company.showroom.push({ name, price:$("#sh-price").value.trim(), img, desc:$("#sh-desc").value.trim() });
  $("#shForm").reset(); $("#shFileLabel").textContent=ot("sh_file");
  saveShowroom(); renderShowroom();
});

/* ============================================================
   MEETING ROOM (conference)
   ============================================================ */
async function renderConference(){
  const body=$("#cfBody");
  let meetings=[];
  try{ const r=await fetch("/api/conference?list=1&assoc="+encodeURIComponent((company&&company.assocId)||"")); const j=r.ok?await r.json():{}; meetings=j.meetings||[]; }catch(e){}
  if(!meetings.length){ body.innerHTML=`<p class="co-sub">${ot("cf_none")}</p>`; return; }
  body.innerHTML=meetings.map(conf=>{
    const startMs=new Date(conf.datetime).getTime();
    const open=isNaN(startMs)||(startMs-Date.now()<=10*60*1000);
    return `<div class="cf-card" style="margin-bottom:14px">
      <span class="co-eyebrow">${ot("cf_when")}: ${fmtDateTime(conf.datetime)}</span>
      <h3 class="cf-name">${esc(conf.title)}</h3>
      ${conf.desc?`<p class="co-sub">${esc(conf.desc)}</p>`:""}
      <p class="cf-status ${open?"open":""}">${open?ot("cf_open"):ot("cf_soon")}</p>
      <a class="btn btn-primary btn-lg ${open?"":"disabled"}" ${open&&conf.link?`href="${escA(conf.link)}" target="_blank" rel="noopener"`:""}>${ot("cf_join")}</a>
    </div>`;
  }).join("");
}

/* ============================================================
   MODULES: invest / news / rnd
   ============================================================ */
const MOD_CFG={
  invest:{list:"#invList",empty:"inv_empty",fields:["inv-title","inv-amount","inv-status","inv-body"],form:"#invForm",
    map:f=>({title:f["inv-title"],amount:f["inv-amount"],status:f["inv-status"],body:f["inv-body"]})},
  rnd:{list:"#rndList",empty:"rnd_empty",fields:["rnd-title","rnd-status","rnd-body"],form:"#rndForm",
    map:f=>({title:f["rnd-title"],status:f["rnd-status"],body:f["rnd-body"]})},
};
async function modApi(module,body){
  const r=await fetch("/api/company/items",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.assign({login:creds.login,password:creds.password,module},body))});
  return r.ok?r.json():{items:[]};
}
function itemCard(it){
  const mine=it.ownerType==="company"&&it.ownerId===company.id;
  const badge=it.scope==="global"?`<span class="mi-badge">${ot("by_konglomerat")}</span>`:(it.ownerName&&!mine?`<span class="mi-badge">${esc(it.ownerName)}</span>`:"");
  const meta=[it.amount,it.status].filter(Boolean).map(x=>`<span class="mi-tag">${esc(x)}</span>`).join("");
  return `<div class="mod-item">
    <div class="mi-head"><b>${esc(it.title)}</b>${badge}</div>
    ${meta?`<div class="mi-meta">${meta}</div>`:""}
    ${it.body?`<p>${esc(it.body)}</p>`:""}
    ${it.link?`<a href="${escA(it.link)}" target="_blank" rel="noopener" class="mi-link">${esc(it.link)}</a>`:""}
    <div class="mi-foot"><span>${fmtDate(it.created)}</span>${mine?`<button class="mi-del" data-id="${it.id}">${ot("del")}</button>`:""}</div>
  </div>`;
}
async function loadModule(module){
  const cfg=MOD_CFG[module];
  const j=await modApi(module,{op:"list"});
  const box=$(cfg.list);
  const items=j.items||[];
  box.innerHTML=items.length?items.map(itemCard).join(""):`<p class="co-sub">${ot(cfg.empty)}</p>`;
  box.querySelectorAll(".mi-del").forEach(b=>b.addEventListener("click",async()=>{ await modApi(module,{op:"del",id:b.dataset.id}); loadModule(module); }));
}
Object.keys(MOD_CFG).forEach(module=>{
  const cfg=MOD_CFG[module];
  if(!cfg.form) return;                 // read-only modules (news) have no add form
  const formEl=$(cfg.form); if(!formEl) return;
  formEl.addEventListener("submit",async e=>{e.preventDefault();
    const f={}; cfg.fields.forEach(id=>f[id]=($("#"+id).value||"").trim());
    if(!f[cfg.fields[0]]) return;
    await modApi(module,Object.assign({op:"add"},cfg.map(f)));
    formEl.reset(); loadModule(module);
  });
});

/* ============================================================
   SECTOR NEWS (AI-generated for the company's sector, read-only)
   ============================================================ */
async function renderSectorNews(){
  const box=$("#newsList");
  box.innerHTML=`<p class="co-sub">${ot("news_loading")}</p>`;
  try{
    const r=await fetch("/api/company/news",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({login:creds.login,password:creds.password,lang:LANG})});
    const j=r.ok?await r.json():{items:[]};
    const items=j.items||[];
    box.innerHTML=items.length?items.map(it=>`
      <div class="mod-item">
        <div class="mi-head"><b>${esc(it.title)}</b>${j.sector?`<span class="mi-badge">${esc(j.sector)}</span>`:""}</div>
        ${it.body?`<p>${esc(it.body)}</p>`:""}
        ${it.time?`<div class="mi-foot"><span>🕓 ${fmtDateTime(it.time)}</span></div>`:""}
      </div>`).join(""):`<p class="co-sub">${ot("news_empty")}</p>`;
  }catch(e){ box.innerHTML=`<p class="co-sub">${ot("news_empty")}</p>`; }
}

/* ============================================================
   PROJECT CHAT (company ↔ admin)
   ============================================================ */
function paintChat(msgs){
  const box=$("#coChatBox");
  box.innerHTML=(msgs&&msgs.length)?msgs.map(m=>`<div class="pchat-msg ${m.from}"><span>${esc(m.text)}</span></div>`).join(""):`<p class="co-sub">${ot("ch_empty")}</p>`;
  box.scrollTop=box.scrollHeight;
}
async function chatApi(body){
  const r=await fetch("/api/company/chat",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(Object.assign({login:creds.login,password:creds.password},body))});
  return r.ok?r.json():{messages:[]};
}
async function renderProjectChat(){
  $("#chTitle").textContent=ot("ch_title"); $("#chSub").textContent=ot("ch_sub");
  $("#coChatText").placeholder=ot("ch_ph"); $("#coChatSend").textContent=ot("ch_send");
  const j=await chatApi({op:"list"}); paintChat(j.messages);
}
$("#coChatForm").addEventListener("submit",async e=>{e.preventDefault();
  const inp=$("#coChatText"); const txt=inp.value.trim(); if(!txt) return;
  inp.value="";
  const j=await chatApi({op:"send",text:txt}); paintChat(j.messages);
});

/* ============================================================
   SALES / PRODUCT DATA TABLE (manual input + AI analysis)
   ============================================================ */
const BD_COLS=["product","sales","price","composition","note"];
let bdRows=[];
function renderBizData(){
  $("#bdTitle").textContent=ot("bd_title");
  $("#bdSub").textContent=ot("bd_sub");
  $("#bdAddRowT").textContent=ot("bd_row");
  $("#bdSave").textContent=ot("bd_save");
  $("#bdAnalyzeT").textContent=ot("bd_analyze");
  bdRows=(company.bizrows||[]).map(r=>Object.assign({product:"",sales:"",price:"",composition:"",note:""},r));
  drawBdTable();
}
function drawBdTable(){
  const head=`<thead><tr><th>${ot("bd_product")}</th><th>${ot("bd_sales")}</th><th>${ot("bd_price")}</th><th>${ot("bd_comp")}</th><th>${ot("bd_note")}</th><th></th></tr></thead>`;
  const body=bdRows.map((r,i)=>`<tr data-i="${i}">`+
    BD_COLS.map(col=>`<td><input class="bd-inp" data-i="${i}" data-c="${col}" value="${escA(r[col]||"")}"></td>`).join("")+
    `<td><button class="tdel bd-del" data-i="${i}">✕</button></td></tr>`).join("");
  $("#bdTable").innerHTML=head+`<tbody>${body}</tbody>`;
  $("#bdTable").querySelectorAll(".bd-inp").forEach(inp=>inp.addEventListener("input",()=>{
    bdRows[+inp.dataset.i][inp.dataset.c]=inp.value;
  }));
  $("#bdTable").querySelectorAll(".bd-del").forEach(b=>b.addEventListener("click",()=>{
    bdRows.splice(+b.dataset.i,1); drawBdTable();
  }));
}
$("#bdAddRow").addEventListener("click",()=>{ bdRows.push({product:"",sales:"",price:"",composition:"",note:""}); drawBdTable(); });
$("#bdSave").addEventListener("click",async()=>{
  const r=await fetch("/api/company/data",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({login:creds.login,password:creds.password,rows:bdRows})});
  if(r.ok){ const j=await r.json(); company.bizrows=j.rows; bdRows=(j.rows||[]).map(x=>Object.assign({product:"",sales:"",price:"",composition:"",note:""},x));
    const sv=$("#bdSaved"); sv.textContent=ot("bd_saved"); sv.style.color="var(--green)"; sv.style.opacity=1; clearTimeout(window._bdt); window._bdt=setTimeout(()=>sv.style.opacity=0,1600); }
});
$("#bdAnalyze").addEventListener("click",async()=>{
  if(!bdRows.some(r=>BD_COLS.some(c=>(r[c]||"").trim()))){ showBdAnalysis(ot("bd_empty")); return; }
  // save first so the server analyzes the latest data
  await fetch("/api/company/data",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({login:creds.login,password:creds.password,rows:bdRows})});
  const btn=$("#bdAnalyze"); const old=btn.innerHTML; btn.disabled=true; btn.textContent=ot("bd_analyzing");
  try{
    const r=await fetch("/api/company/analyze",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({login:creds.login,password:creds.password,lang:LANG})});
    const j=r.ok?await r.json():{};
    if(j.analysis) showBdAnalysis(j.analysis, ot("bd_ahead")); else showBdAnalysis(ot("bd_aoff"));
  }catch(e){ showBdAnalysis(ot("bd_aoff")); }
  btn.disabled=false; btn.innerHTML=old;
});
function showBdAnalysis(text, head){
  const box=$("#bdAnalysis"); box.hidden=false;
  // escape first, THEN turn markdown **bold** into real <b> and newlines into <br>
  const body=esc(text).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\n/g,"<br>");
  box.innerHTML=(head?`<b>${esc(head)}</b><br><br>`:"")+body;
}

/* ============================================================
   BANNER
   ============================================================ */
async function renderBanner(){
  try{ const r=await fetch("/api/conference?assoc="+encodeURIComponent((company&&company.assocId)||"")); const c=r.ok?await r.json():{}; const b=$("#coBanner"); if(!b)return;
    if(c&&c.title){ b.hidden=false;
      b.innerHTML=`<span class="cb-ic">📢</span><span class="cb-text"><b>${ot("nav_meeting")}:</b> ${esc(c.title)}${c.datetime?` · ${fmtDateTime(c.datetime)}`:""}</span>`+(c.link?`<a class="btn btn-primary cb-join" href="${escA(c.link)}" target="_blank" rel="noopener">${ot("cf_join")}</a>`:"");
    } else b.hidden=true;
  }catch(e){}
}

/* ============================================================
   LANG + THEME + STATIC
   ============================================================ */
function applyStatic(){
  $("#lgTitle").textContent=ot("lg_title"); $("#lgSub").textContent=ot("lg_sub"); $("#lgBtn").textContent=ot("lg_btn");
  $("#logoutBtn").textContent=ot("logout"); $("#aiNav").textContent="🤖 "+ot("nav_ai");
  const bs=$("#backSite"); if(bs) bs.textContent=ot("back_site");
  if(company && !$("#coApp").hidden) $("#viewTitle").textContent=ot(VIEW_TITLE[activeSec]||"nav_dash");
  $("#shTitle").textContent=ot("sh_title"); $("#shSub").textContent=ot("sh_sub");
  $("#sh-name").placeholder=ot("sh_name"); $("#sh-price").placeholder=ot("sh_price"); $("#sh-img").placeholder=ot("sh_img"); $("#sh-desc").placeholder=ot("sh_desc"); $("#shAdd").textContent=ot("sh_add");
  if($("#sh-file") && !$("#sh-file").files.length) $("#shFileLabel").textContent=ot("sh_file");
  $("#invTitle").textContent=ot("inv_title"); $("#invSub").textContent=ot("inv_sub");
  $("#inv-title").placeholder=ot("inv_p_title"); $("#inv-amount").placeholder=ot("inv_p_amount");
  $("#inv-status").placeholder=ot("inv_p_status"); $("#inv-body").placeholder=ot("inv_p_body");
  $("#invForm button[type=submit]").textContent=ot("inv_add");
  $("#newsTitle").textContent=ot("news_title"); $("#newsSub").textContent=ot("news_sub");
  $("#cfTitle").textContent=ot("cf_title");
  $("#rndTitle").textContent=ot("rnd_title"); $("#rndSub").textContent=ot("rnd_sub");
  $("#rnd-title").placeholder=ot("rnd_p_title"); $("#rnd-status").placeholder=ot("rnd_p_status"); $("#rnd-body").placeholder=ot("rnd_p_body");
  $("#rndForm button[type=submit]").textContent=ot("rnd_add");
}
function setLang(lang){
  LANG=lang; localStorage.setItem("kg_lang",lang); document.documentElement.lang=lang;
  $("#langBtn").textContent=lang.toUpperCase(); applyStatic();
  if(company && !$("#coApp").hidden){ buildNav(); renderBanner(); showSection(activeSec); }
}
$("#langBtn").addEventListener("click",()=>setLang(LANGS[(L()+1)%LANGS.length]));
const themeBtn=$("#themeBtn");
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("kg_theme",theme);themeBtn.innerHTML=theme==="dark"?ICON_SUN:ICON_MOON;}
themeBtn.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));

/* ---- init ---- */
(async function init(){
  setTheme(localStorage.getItem("kg_theme")||"light");
  document.documentElement.lang=LANG; $("#langBtn").textContent=LANG.toUpperCase();
  applyStatic();
  if(creds && await tryLogin(creds.login,creds.password)) startApp();
  else showLogin();
})();
