/* ============================================================
   Strings for mening-malumotlarim.html — the rights page.

   Kept out of markets-i18n.js because that file is already
   102 KB shipped to every market page, and none of them need
   these. Same [uz, ru, en] shape as everything else.
   ============================================================ */
const T_DSR = Object.assign({}, typeof T_MK !== "undefined" ? T_MK : {}, {
  dsr_h1:  ["Mening ma'lumotlarim","Мои данные","My data"],
  dsr_sub: ["ZRU-547 · 21 va 22-moddalar bo'yicha huquqlaringiz",
            "ЗРУ-547 · ваши права по статьям 21 и 22",
            "ZRU-547 · your rights under articles 21 and 22"],

  /* ---- sign in ---- */
  dsr_login_h:   ["Kabinetga kiring","Войдите в кабинет","Sign in"],
  dsr_login_btn: ["Kirish","Войти","Sign in"],
  dsr_lg: ["Login","Логин","Login"],
  dsr_pw: ["Parol","Пароль","Password"],
  dsr_login_bad: ["Login yoki parol noto'g'ri.","Неверный логин или пароль.","Wrong login or password."],
  dsr_login_why: ["Faqat o'z ma'lumotlaringizni ko'rishingiz mumkin, shuning uchun avval kabinet login va parolingiz bilan kiring. Bu sahifa kirish ma'lumotlarini saqlamaydi.",
                  "Вы можете видеть только свои данные, поэтому сначала войдите с логином и паролем от кабинета. Эта страница не сохраняет данные входа.",
                  "You can only see your own data, so sign in first with your cabinet login and password. This page does not store your credentials."],

  /* ---- what is held ---- */
  dsr_held_h: ["Siz haqingizda saqlanayotgan ma'lumotlar","Данные, хранимые о вас","Data held about you"],
  dsr_held_p: ["Quyida hisob qaydnomangizdagi barcha maydonlar keltirilgan. To'liq faylni yuklab olsangiz, unga arizangiz, rozilik yozuvi va AI yozishmalaringiz ham kiradi.",
               "Ниже приведены все поля вашей учётной записи. Полный файл дополнительно включает вашу заявку, запись о согласии и переписку с ИИ.",
               "Below are all the fields on your account. The full file additionally includes your application, the consent record and your AI conversations."],
  dsr_field: ["Maydon","Поле","Field"],
  dsr_value: ["Qiymat","Значение","Value"],
  dsr_c_apps:  ["Ro'yxatdan o'tish arizalari","Заявки на регистрацию","Registration applications"],
  dsr_c_chats: ["AI yordamchi bilan suhbatlar","Диалоги с ИИ-помощником","AI assistant conversations"],
  dsr_c_reqs:  ["Yuborilgan murojaatlar","Поданные обращения","Requests filed"],
  dsr_consent_on:  ["Rozilik berilgan sana:","Согласие дано:","Consent given on:"],
  dsr_consent_ver: ["hujjat versiyasi","версия документа","document version"],
  dsr_download: ["To'liq faylni yuklab olish (JSON)","Скачать полный файл (JSON)","Download the full file (JSON)"],

  /* ---- request log ---- */
  dsr_reqs_h: ["Murojaatlaringiz","Ваши обращения","Your requests"],
  dsr_kind:   ["Turi","Тип","Kind"],
  dsr_status: ["Holati","Статус","Status"],
  dsr_due:    ["Javob muddati","Срок ответа","Answer due"],
  dsr_k_access:   ["Ma'lumot olish","Получение сведений","Access"],
  dsr_k_withdraw: ["Rozilikni qaytarib olish","Отзыв согласия","Withdrawal"],
  dsr_k_erase:    ["O'chirishni talab qilish","Требование об удалении","Erasure"],
  dsr_s_open:     ["Ko'rib chiqilmoqda","На рассмотрении","Open"],
  dsr_s_answered: ["Javob berilgan","Дан ответ","Answered"],
  dsr_s_refused:  ["Rad etilgan","Отказано","Refused"],

  /* ---- correction ---- */
  dsr_fix_h: ["Ma'lumotni tuzatish","Исправление данных","Correcting your data"],
  dsr_fix_p: ["Noto'g'ri yoki eskirgan ma'lumotni kabinetingizdagi profil bo'limida o'zingiz tuzatishingiz mumkin — murojaat yozish shart emas.",
              "Неточные или устаревшие сведения вы можете исправить самостоятельно в разделе профиля вашего кабинета — обращение не требуется.",
              "You can correct inaccurate or outdated details yourself in your cabinet's profile section — no request needed."],
  dsr_fix_go: ["Kabinetga o'tish","Перейти в кабинет","Go to the cabinet"],

  /* ---- erasure ---- */
  dsr_erase_h:   ["O'chirishni talab qilish","Требование об удалении","Request erasure"],
  dsr_erase_why: ["Murojaatingiz qayd etiladi va 10 ish kuni ichida asoslantirilgan javob beriladi. Javobda qaysi ma'lumot o'chirilgani, qaysi biri esa qonun talabi bo'yicha (masalan, buxgalteriya va bitim hujjatlari — 5 yil) saqlanib qolgani ko'rsatiladi. Shu sababli o'chirish darhol emas, murojaat tartibida amalga oshiriladi.",
                  "Ваше обращение регистрируется, и в течение 10 рабочих дней даётся мотивированный ответ. В ответе указывается, какие данные удалены, а какие сохранены в силу требования закона (например, бухгалтерские документы и документы сделок — 5 лет). Поэтому удаление производится в порядке обращения, а не мгновенно.",
                  "Your request is registered and answered with reasons within 10 working days. The answer states which data was erased and which was retained because the law requires it (for example accounting and transaction records — 5 years). That is why erasure is handled as a request rather than instantly."],
  dsr_erase_note: ["Izoh (ixtiyoriy)","Комментарий (необязательно)","Note (optional)"],
  dsr_erase_btn:  ["O'chirishni talab qilaman","Требую удаления","Request erasure"],
  dsr_erase_ok:   ["Murojaat qabul qilindi. Raqami: {ref}. Javob muddati: {due}.",
                   "Обращение принято. Номер: {ref}. Срок ответа: {due}.",
                   "Request received. Reference: {ref}. Answer due: {due}."],

  /* ---- withdrawal ---- */
  dsr_wd_h:    ["Rozilikni qaytarib olish","Отзыв согласия","Withdraw consent"],
  dsr_wd_warn: ["DIQQAT: rozilik qaytarib olingan zahoti kabinetingizga kirish to'xtatiladi — chunki ma'lumotlaringizni qayta ishlash uchun asos aynan shu rozilik edi. Bitim va buxgalteriya hujjatlari qonun talab qilgan muddat davomida saqlanadi. Kirishni faqat administrator tiklashi mumkin.",
                "ВНИМАНИЕ: сразу после отзыва согласия доступ в ваш кабинет прекращается — именно это согласие было основанием обработки ваших данных. Документы сделок и бухгалтерские документы хранятся в течение установленного законом срока. Доступ может восстановить только администратор.",
                "WARNING: access to your cabinet stops the moment consent is withdrawn — that consent was the ground for processing your data. Transaction and accounting records are kept for the period the law requires. Only an administrator can restore access."],
  dsr_wd_type: ["Tasdiqlash uchun quyidagi so'zni yozing","Для подтверждения введите слово","To confirm, type the word"],
  dsr_wd_word: ["QAYTARIB OLAMAN","ОТЗЫВАЮ","WITHDRAW"],
  dsr_wd_btn:  ["Rozilikni qaytarib olish","Отозвать согласие","Withdraw consent"],
  dsr_wd_need: ["Tasdiqlash so'zi to'g'ri yozilmagan.","Слово подтверждения введено неверно.","The confirmation word does not match."],
  dsr_wd_done: ["Murojaat raqami:","Номер обращения:","Reference:"],
  dsr_wd_already: ["Rozilik allaqachon qaytarib olingan.","Согласие уже отозвано.","Consent has already been withdrawn."],
  dsr_home: ["Bosh sahifaga","На главную","Home"],
});
