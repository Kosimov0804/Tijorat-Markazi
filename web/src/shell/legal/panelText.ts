import type { Localized } from "@legacy/data.js";

/* Copied line for line from legal-settings.js, so the wording cannot drift. */
export const PANEL_TEXT = {
    h:        ["Maʼlumotlarim va huquqlarim", "Мои данные и права", "My data and rights"],
    intro:    ["«Şaxsga doir maʼlumotlar töğrisida»gi Qonunning (ZRU-547) 21 va 22-moddalari sizga quyidagi huquqlarni beradi. Murojaatlar 10 iş kuni içida körib çiqiladi.",
               "Статьи 21 и 22 Закона «О персональных данных» (ЗРУ-547) предоставляют вам следующие права. Обращения рассматриваются в течение 10 рабочих дней.",
               "Articles 21 and 22 of the Law on Personal Data (ZRU-547) give you the following rights. Requests are answered within 10 working days."],

    docs_h:   ["Huquqiy hujjatlar", "Правовые документы", "Legal documents"],
    reread:   ["Ommaviy ofertani öqiş", "Читать публичную оферту", "Read the public offer"],

    consent_h:["Rozilik", "Согласие", "Consent"],
    consent_on:["Rozilik berilgan:", "Согласие дано:", "Consent given:"],
    consent_ver:["hujjat versiyasi", "версия документа", "document version"],
    consent_no:["Rozilik yozuvi topilmadi — hisobingiz uşbu tizim joriy etilişidan oldin yaratilgan.",
                "Запись о согласии не найдена — учётная запись создана до внедрения этой системы.",
                "No consent record found — this account was created before this system existed."],

    export_h: ["Maʼlumot oliş huquqi", "Право на получение сведений", "Right of access"],
    export_p: ["Siz haqingizda saqlanayotgan hamma narsa: hisob yozuvi, ariza, rozilik dalili va AI yordamçisi bilan yozişmalar. Parol qaytarilmas şaklda saqlangani uçun faylga kirmaydi.",
               "Всё, что о вас хранится: учётная запись, заявка, доказательство согласия и переписка с ИИ-помощником. Пароль не входит в файл, так как хранится в необратимой форме.",
               "Everything held about you: the account record, the application, the consent evidence and your AI assistant conversations. The password is not in the file, because it is stored irreversibly."],
    export_btn:["Faylni yuklab oliş (JSON)", "Скачать файл (JSON)", "Download the file (JSON)"],

    fix_h:    ["Aniqlaştiriş huquqi", "Право на уточнение", "Right to correction"],
    fix_p:    ["Notöğri yoki eskirgan maʼlumotni profil bölimida özingiz tuzatasiz — murojaat yoziş şart emas.",
               "Неточные или устаревшие сведения вы исправляете сами в разделе профиля — обращение не требуется.",
               "You correct inaccurate or outdated details yourself in the profile section — no request needed."],

    erase_h:  ["Öçirişni talab qiliş", "Требование об удалении", "Request erasure"],
    erase_p:  ["Murojaat qayd etiladi va 10 iş kuni içida asoslantirilgan javob beriladi: qaysi maʼlumot öçirildi, qaysi biri qonun talabi böyiça saqlandi (bitim va buxgalteriya hujjatlari — 5 yil).",
               "Обращение регистрируется, и в течение 10 рабочих дней даётся мотивированный ответ: какие данные удалены, какие сохранены по требованию закона (документы сделок и бухгалтерии — 5 лет).",
               "The request is registered and answered with reasons within 10 working days: what was erased, and what was retained because the law requires it (transaction and accounting records — 5 years)."],
    erase_note:["Izoh (ixtiyoriy)", "Комментарий (необязательно)", "Note (optional)"],
    erase_btn:["Murojaat yuboriş", "Отправить обращение", "File the request"],
    erase_ok: ["Murojaat qabul qilindi. Raqami: {ref} · javob muddati: {due}",
               "Обращение принято. Номер: {ref} · срок ответа: {due}",
               "Request received. Reference: {ref} · answer due: {due}"],

    wd_h:     ["Rozilikni qaytarib oliş", "Отзыв согласия", "Withdraw consent"],
    wd_warn:  ["DIQQAT: rozilik qaytarib olingan zahoti kabinetga kiriş töxtatiladi — qayta işlaş asosi aynan şu rozilik edi. Bitim va buxgalteriya hujjatlari qonuniy muddat davomida saqlanadi. Kirişni faqat administrator tiklaydi.",
               "ВНИМАНИЕ: сразу после отзыва доступ в кабинет прекращается — основанием обработки было именно это согласие. Документы сделок и бухгалтерии хранятся установленный законом срок. Доступ восстанавливает только администратор.",
               "WARNING: access to the cabinet stops the moment consent is withdrawn — that consent was the ground for processing. Transaction and accounting records are kept for the statutory period. Only an administrator can restore access."],
    wd_type:  ["Tasdiqlaş uçun quyidagi sözni yozing:", "Для подтверждения введите слово:", "To confirm, type the word:"],
    wd_word:  ["QAYTARIB OLAMAN", "ОТЗЫВАЮ", "WITHDRAW"],
    wd_btn:   ["Rozilikni qaytarib oliş", "Отозвать согласие", "Withdraw consent"],
    wd_need:  ["Tasdiqlaş sözi mos kelmadi.", "Слово подтверждения не совпало.", "The confirmation word does not match."],
    wd_bye:   ["Rozilik qaytarib olindi. Çiqilmoqda…", "Согласие отозвано. Выполняется выход…", "Consent withdrawn. Signing out…"],
    wd_already:["Rozilik allaqaçon qaytarib olingan.", "Согласие уже отозвано.", "Consent has already been withdrawn."],

    reqs_h:   ["Murojaatlaringiz", "Ваши обращения", "Your requests"],
    c_ref:    ["№", "№", "Ref"],
    c_kind:   ["Turi", "Тип", "Kind"],
    c_status: ["Holati", "Статус", "Status"],
    c_due:    ["Javob muddati", "Срок ответа", "Answer due"],
    k_access: ["Maʼlumot oliş", "Получение сведений", "Access"],
    k_withdraw:["Rozilikni qaytarib oliş", "Отзыв согласия", "Withdrawal"],
    k_erase:  ["Öçiriş", "Удаление", "Erasure"],
    s_open:   ["Körib çiqilmoqda", "На рассмотрении", "Open"],
    s_answered:["Javob berilgan", "Дан ответ", "Answered"],
    s_refused:["Rad etilgan", "Отказано", "Refused"],
    loading:  ["Yuklanmoqda…", "Загрузка…", "Loading…"],
    failed:   ["Maʼlumotni oliş imkoni bölmadi.", "Не удалось получить данные.", "Could not load the data."]
} satisfies Record<string, Localized>;

export type PanelTextKey = keyof typeof PANEL_TEXT;

/* The documents exist in uz and ru only. */
export const PANEL_DOCS: readonly (readonly [string, { uz: string; ru: string }])[] = [
    ["oferta.html",    { uz: "Ommaviy oferta", ru: "Публичная оферта" }],
    ["maxfiylik.html", { uz: "Maxfiylik siyosati", ru: "Политика конфиденциальности" }],
    ["shartlar.html",  { uz: "Foydalaniş şartlari", ru: "Условия использования" }]
];
