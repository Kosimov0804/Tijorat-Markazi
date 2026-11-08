/* ============================================================
   MOLIYA BOZORI — SKORING VA INVESTOR YO'LLARI

   NEGA ALOHIDA FAYL

   srv/api.js butun platformaning marshrutlagichi. Skoring (8 yo'l)
   va investor qabulxonasi (4 yo'l) qo'shilgach u 800 qatorlik
   shiftdan oshdi. Bu 12 yo'l bitta mavzu va birga o'zgaradi —
   ajratish tabiiy chegara bo'yicha ketdi.

   SHARTNOMA: true = so'rov shu yerda yakunlandi, javob yuborilgan.
   false = api.js qidiruvni davom ettiradi.

   NEGA need/out O'RAMLARI BOR

   api.js ichida tarmoq `return out(...)` yozadi va qaytgan qiymat
   ahamiyatsiz — muhimi handle() to'xtashi. Bu yerda esa to'xtash
   bayroq bilan beriladi. Har bir tarmoqni qo'lda "javobni yubor,
   keyin return true" ga aylantirish xavfli: qavssiz `if` da
   `if(shart) javob(); return true;` har qanday so'rovda true
   qaytarib, qolgan yo'llarni yutib yuboradi. Shuning uchun tana
   o'zgarmaydi — o'ramlar true qaytaradi.

   Shaxs bu yerda HAL QILINMAYDI: actor / company / scoringActor
   api.js dan keladi, chunki hisob turini bilish faqat o'sha yerda
   mumkin (srv/api.js dagi identity bo'limi).
   ============================================================ */
const H   = require("./store");
const MS  = require("./moliya-scoring");
const INV = require("./moliya-investor");

/**
 * @param k api.js beradigan kontekst: so'rov, javob va yordamchilar.
 * @returns {boolean} so'rov shu yerda yakunlandimi.
 */
function moliyaScoringRoutes(k){
  const req = k.req, res = k.res, ctx = k.ctx, body = k.body;
  const pathname = k.pathname, GET = k.GET, POST = k.POST;
  const actor = k.actor, company = k.company, scoringActor = k.scoringActor;
  /* O'ramlar — yuqoridagi izohga qarang. */
  const need = (r, c, what) => { k.need(r, c, what); return true; };
  const out  = (r, c, x) => { k.out(r, c, x); return true; };
  const json = (code, payload) => { ctx.json(res, code, payload); return true; };

  /* ---- loyiha skoringi (§ metodika: moliya-scoring-config.js) ----
     Ball HAR DOIM serverda qayta hisoblanadi; tanada kelgan ball
     tashlab yuboriladi. Egalik va rol shu yerda hal qilinadi. */
  if(pathname === "/api/moliya/scoring/meta" && GET)
    return json(200, MS.meta());
  if(pathname === "/api/moliya/scoring/home" && POST){
    const a = scoringActor(ctx, body);
    if(!a) return need(res, ctx, "identify_first");
    return out(res, ctx, MS.home(a, body.filter || body));
  }
  if(pathname === "/api/moliya/scoring/save" && POST){
    const a = actor(ctx, body);
    if(!a) return need(res, ctx, "identify_first");
    return out(res, ctx, MS.save(a, body));
  }
  if(pathname === "/api/moliya/scoring/open" && POST){
    const a = scoringActor(ctx, body);
    if(!a) return need(res, ctx, "identify_first");
    const r = MS.open(a, H.S(body.id, 40));
    /* Qiziqish yozuvlari investor modulida yashaydi. Ular shu yerda,
       marshrut qatlamida ulanadi: srv/moliya-scoring.js ichida
       require qilish aylanma bog'liqlik hosil qilardi (investor
       moduli skoringni talab qiladi). Ega faqat NOM va holatni
       ko'radi — interestOf() institutning izohini bermaydi. */
    if(r && r.ok && r.project) r.interest = INV.interestOf(r.project.id);
    return out(res, ctx, r);
  }
  if(pathname === "/api/moliya/scoring/delete" && POST){
    const a = actor(ctx, body);
    if(!a) return need(res, ctx, "identify_first");
    return out(res, ctx, MS.remove(a, H.S(body.id, 40)));
  }
  if(pathname === "/api/moliya/scoring/submit" && POST){
    const a = actor(ctx, body);
    if(!a) return need(res, ctx, "identify_first");
    return out(res, ctx, MS.submit(a, H.S(body.id, 40)));
  }
  if(pathname === "/api/moliya/scoring/status" && POST){
    const a = scoringActor(ctx, body);
    if(!a) return need(res, ctx, "identify_first");
    return out(res, ctx, MS.setStatus(a, H.S(body.id, 40), H.S(body.status, 20), body.comment));
  }
  /* ---- investor tomoni: institut qabulxonasi ----
     Institut — alohida shaxs turi emas, moliya mahsuloti bor kompaniya
     hisobi. Shuning uchun qiziqish va sozlama yo'llari company() talab
     qiladi: e-mail bilan tanilgan mehmon institut nomidan gapira olmaydi.
     Qabulxonaning o'zi scoringActor — admin paroli bilan kelgan ekspert
     ham butun navbatni ko'rishi kerak. */
  if(pathname === "/api/moliya/investor/inbox" && POST){
    const a = scoringActor(ctx, body);
    if(!a) return need(res, ctx, "identify_first");
    /* company() faqat shu yerda mavjud — domen qatlami hisob TURINI
       o'zi aniqlay olmaydi, shuning uchun uni marshrut aytadi. */
    return out(res, ctx, INV.inbox(a, body.filter || body, !!company(ctx, body)));
  }
  if(pathname === "/api/moliya/investor/open" && POST){
    const a = scoringActor(ctx, body);
    if(!a) return need(res, ctx, "identify_first");
    return out(res, ctx, INV.openDossier(a, H.S(body.id, 40)));
  }
  if(pathname === "/api/moliya/investor/interest" && POST){
    const c = company(ctx, body);
    if(!c) return need(res, ctx, "company_login_required");
    return out(res, ctx, INV.setInterest(c, body));
  }
  if(pathname === "/api/moliya/investor/routing" && POST){
    const c = company(ctx, body);
    if(!c) return need(res, ctx, "company_login_required");
    return out(res, ctx, body.op === "set" ? INV.setRouting(c, body) : INV.routingSettings(c));
  }

  /* Yuklab olish — haqiqiy fayl, shuning uchun JSON yordamchisidan chetlab o'tadi. */
  if(pathname === "/api/moliya/scoring/export" && POST){
    if(!ctx.isAdmin(body.pass)) return json(403, { error: "forbidden" });
    const csv = MS.exportCsv(body.filter || body);
    res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="loyiha-skoring.csv"' });
    res.end(csv); return true;
  }

  return false;
}

module.exports = moliyaScoringRoutes;
