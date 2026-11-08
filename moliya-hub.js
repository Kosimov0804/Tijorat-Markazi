/* ============================================================
   MOLIYA BOZORI — kirish sahifasi (hub)

   Bu sahifada ish mantiqi YO'Q va ataylab yo'q: u uchta eshikni
   ko'rsatadi, xolos. Shuning uchun boshqaruvchi ham shunchaki
   platforma chromeini (tema, til, burger) ulaydi va statik
   matnlarni tarjima qiladi.

   Lug'at shu yerda, alohida faylda emas: kalitlar faqat shu
   sahifada ishlatiladi va ular o'ninchi qismi ham emas —
   moliya-scoring-i18n.js ga qo'shish uni skoring modullariga
   bog'liq bo'lmagan sahifa uchun yuklashga majbur qilardi.
   ============================================================ */
(() => {
const { t, chrome, applyStatic, setDict } = MK;

const T_HUB = {
  msh_eyebrow:   ["MOLIYA BOZORI", "ФИНАНСОВЫЙ РЫНОК", "FINANCIAL MARKET"],
  msh_h1:        ["Loyihani <span class=\"mk-hl\">baholaş</span> va moliyaga ulaş",
                  "Оценить <span class=\"mk-hl\">проект</span> и связать с финансированием",
                  "<span class=\"mk-hl\">Score</span> a project and connect it to finance"],
  msh_lead:      ["100 ballik metodika loyihani baholaydi, kamçiliklarni körsatadi va 75 balldan yuqorida uni mos banklar, fondlar va taraqqiyot institutlariga yönaltiradi.",
                  "Методика на 100 баллов оценивает проект, показывает пробелы и при 75+ баллах направляет его в подходящие банки, фонды и институты развития.",
                  "A 100-point methodology scores the project, shows the gaps, and above 75 points routes it to matching banks, funds and development institutions."],

  msh_door_1:    ["1-yöl", "Путь 1", "Track 1"],
  msh_door_2:    ["2-yöl", "Путь 2", "Track 2"],
  msh_door_3:    ["Institut", "Институт", "Institution"],

  msh_company_t: ["Korxona loyihasi", "Проект предприятия", "Company project"],
  msh_company_d: ["Işlayotgan korxona uçun: uç yillik hisobot, audit xulosasi, IRR, DSCR va qarz yuki. Qatʼiy metodika, töxtatuvçi mezonlar bilan.",
                  "Для действующего предприятия: трёхлетняя отчётность, аудиторское заключение, IRR, DSCR и долговая нагрузка. Строгая методика со стоп-критериями.",
                  "For an operating company: three-year accounts, audit opinion, IRR, DSCR and debt burden. A strict methodology with knockout criteria."],
  msh_company_m: ["8 blok · 100 ball · TEO va due diligence",
                  "8 блоков · 100 баллов · ТЭО и due diligence",
                  "8 blocks · 100 points · feasibility study and due diligence"],

  msh_startup_t: ["Startap loyihasi", "Стартап-проект", "Startup project"],
  msh_startup_d: ["Erta bosqiç uçun: jamoa, mahsulot bosqiçi, bozor validatsiyasi va salohiyat. Moliyaviy tarix talab qilinmaydi.",
                  "Для ранней стадии: команда, стадия продукта, валидация рынка и потенциал. Финансовая история не требуется.",
                  "For early stage: team, product stage, market validation and potential. No financial history required."],
  msh_startup_m: ["8 blok · 100 ball · yumşoqroq metodika",
                  "8 блоков · 100 баллов · более мягкая методика",
                  "8 blocks · 100 points · a softer methodology"],

  msh_investor_t:["Investor kabineti", "Кабинет инвестора", "Investor cabinet"],
  msh_investor_d:["Bank, fond va taraqqiyot instituti uçun: sizga yönaltirilgan loyihalar navbati, dossier, qiziqiş belgisi va qabul mezonlari.",
                  "Для банков, фондов и институтов развития: очередь направленных вам проектов, досье, отметка интереса и критерии приёма.",
                  "For banks, funds and development institutions: the queue of projects routed to you, the dossier, an interest flag and your intake criteria."],
  msh_investor_m:["Qabulxona · dossier · qabul ostonasi",
                  "Приёмная · досье · порог приёма",
                  "Inbox · dossier · intake threshold"],

  /* Ikkala tashabbuskor sahifasining sarlavhasidagi qaytish havolasi. */
  msh_back:      ["Moliya bozori", "Финансовый рынок", "Financial market"],
};

/* setDict ALMASHTIRADI, qo'shmaydi — shuning uchun mavjud moliya
   lug'ati ustiga hub kalitlari bitta chaqiruvda qo'yiladi. */
setDict(Object.assign({},
  typeof T_MOLIYA !== "undefined" ? T_MOLIYA : {},
  T_HUB));

applyStatic();
chrome(() => applyStatic());
})();
