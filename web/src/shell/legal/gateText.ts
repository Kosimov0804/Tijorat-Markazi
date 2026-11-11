import type { Localized } from "@legacy/data.js";

/* Copied line for line from legal-gate.js, so the wording cannot drift. */
export const GATE_TEXT = {
    title:    ["Röyxatdan ötişdan oldin", "Перед регистрацией", "Before you register"],
    title_ro: ["Huquqiy hujjatlar", "Правовые документы", "Legal documents"],
    lead:     ["Arizani yuboriş uşbu ommaviy offertani qabul qiliş hisoblanadi (Fuqarolik kodeksi, 370-modda). Iltimos, davom etişdan oldin öqing.",
               "Отправка заявки означает акцепт настоящей публичной оферты (ст. 370 Гражданского кодекса). Пожалуйста, ознакомьтесь перед продолжением.",
               "Submitting the application constitutes acceptance of this public offer (Civil Code art. 370). Please read it before continuing."],
    tab_of:   ["Ommaviy oferta", "Публичная оферта", "Public offer"],
    tab_mx:   ["Maxfiylik siyosati", "Политика конфиденциальности", "Privacy policy"],
    hint:     ["Davom etiş uçun offertani oxirigaça öqing", "Для продолжения прочитайте оферту до конца", "Read the offer to the end to continue"],
    ready:    ["Öqildi — davom etişingiz mumkin", "Прочитано — можно продолжить", "Read — you may continue"],
    accept:   ["Roziman va davom etaman", "Согласен и продолжаю", "I accept and continue"],
    cancel:   ["Bekor qiliş", "Отмена", "Cancel"],
    close:    ["Yopiş", "Закрыть", "Close"],
    loading:  ["Yuklanmoqda…", "Загрузка…", "Loading…"],
    failed:   ["Hujjat matnini yuklab bölmadi. Iltimos, sahifani yangilang — matnni körmasdan rozilik beriş mumkin emas.",
               "Не удалось загрузить текст документа. Обновите страницу — дать согласие, не видя текста, нельзя.",
               "The document text could not be loaded. Please refresh — consent cannot be given without seeing it."]
} satisfies Record<string, Localized>;
