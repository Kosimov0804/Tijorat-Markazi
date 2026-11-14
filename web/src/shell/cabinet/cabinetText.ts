import type { Localized } from "@legacy/data.js";

/* Copied by script from bizid-panel.js, chart.js and association.js, so the wording cannot drift. Do not edit by hand. */

/** The Business ID panel's own strings (bizid-panel.js). */
export const BIZID_TEXT = {
  title: ["Business ID","Business ID","Business ID"],
  lead: ["Bu maʼlumotlar sizning oçiq kartangizda körinadi — uni QR kod orqali istalgan kişi oça oladi.","Эти данные видны на вашей публичной карточке — её может открыть любой по QR-коду.","These details appear on your public card, which anyone can open from its QR code."],
  number: ["ID raqamingiz","Ваш ID номер","Your ID number"],
  phone: ["Telefon","Телефон","Phone"],
  email: ["E-pochta","E-mail","Email"],
  location: ["Manzil","Адрес","Location"],
  website: ["Veb-sayt","Веб-сайт","Website"],
  ph_phone: ["+998 90 123 45 67","+998 90 123 45 67","+998 90 123 45 67"],
  ph_mail: ["info@korxona.uz","info@company.uz","info@company.uz"],
  ph_loc: ["Toşkent, Amir Temur köçasi 1","Ташкент, улица Амира Темура 1","Tashkent, Amir Temur street 1"],
  ph_web: ["korxona.uz","company.uz","company.uz"],
  save: ["Saqlaş","Сохранить","Save"],
  saving: ["Saqlanmoqda…","Сохранение…","Saving…"],
  saved: ["Saqlandi","Сохранено","Saved"],
  view: ["Kartani köriş","Посмотреть карточку","View card"],
  copy: ["Havolani nusxalaş","Копировать ссылку","Copy link"],
  copied: ["Havola nusxalandi","Ссылка скопирована","Link copied"],
  fail: ["Saqlab bölmadi. Qaytadan urinib köring.","Не удалось сохранить. Попробуйте ещё раз.","Could not save. Please try again."],
  email_invalid: ["E-poçta manzili notöğri.","Неверный адрес e-mail.","That email address is not valid."],
  phone_invalid: ["Telefon raqami notöğri.","Неверный номер телефона.","That phone number is not valid."],
  website_invalid: ["Veb-sayt manzili notöğri.","Неверный адрес сайта.","That website address is not valid."],
} as const satisfies Record<string, Localized>;

export type BizIdTextKey = keyof typeof BIZID_TEXT;

/** Three-letter month names for chart axes (chart.js KG_MONTHS). */
export const MONTHS_SHORT = {
  uz: ["yan","fev","mar","apr","may","iyn","iyl","avg","sen","okt","noy","dek"],
  ru: ["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"],
  en: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
} as const;

/** Month names as they read inside a date (the cabinets' MN tables). */
export const MONTHS_IN_DATE = {
  uz: ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"],
  ru: ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
} as const;
