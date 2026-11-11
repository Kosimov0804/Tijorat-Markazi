import type { Localized } from "@legacy/data.js";

/* Copied line for line from kirish.js, so the wording cannot drift. */
export const TEXT = {
    ki_eyebrow: ["KIRIŞ","ВХОД","SIGN IN"],
    ki_title:   ["Kabinetga kiriş","Вход в кабинет","Sign in to your cabinet"],
    ki_sub:     ["Login va parolingizni kiriting — tizim sizni öz kabinetingizga yönaltiradi.",
                 "Введите логин и пароль — система направит вас в ваш кабинет.",
                 "Enter your login and password — you will be taken to your own cabinet."],
    ki_login:   ["Login","Логин","Login"],
    ki_pass:    ["Parol","Пароль","Password"],
    ki_btn:     ["Kiriş →","Войти →","Sign in →"],
    ki_roles:   ["Bitta oyna — kompaniya, xaridor, uyuşma, tahlilçi va administrator hisoblari uçun.",
                 "Одно окно — для компаний, покупателей, ассоциаций, аналитиков и администраторов.",
                 "One window — for companies, buyers, associations, analysts and administrators."],
    ki_reg:     ["Röyxatdan ötiş","Регистрация","Register"],
    ki_back:    ["← Saytga qaytiş","← Вернуться на сайт","← Back to the site"],
    /* One message for every failure. Saying "no such login" would tell an
       outsider which accounts exist. */
    ki_bad:     ["Login yoki parol notöğri.","Неверный логин или пароль.","Wrong login or password."],
    ki_empty:   ["Login va parolni kiriting.","Укажите логин и пароль.","Enter a login and a password."],
    ki_wait:    ["Tekşirilmoqda…","Проверяем…","Checking…"],
} satisfies Record<string, Localized>;
