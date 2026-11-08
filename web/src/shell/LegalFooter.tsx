import { useEffect, useState } from "react";
import { useI18n } from "./i18n";
import { readOperatorField } from "./legal/types";
import type { DocLang, LegalConfig, LocalizedText, OperatorField } from "./legal/types";
import { readStored } from "./storage";

/* Fixed on purpose: an href built from fetched data is one refactor away from
   an href built from user data. */
const PAGES = {
  oferta: "oferta.html",
  maxfiylik: "maxfiylik.html",
  shartlar: "shartlar.html",
  rights: "mening-malumotlarim.html",
} as const;

/* Not a versioned document, so it carries its own title. */
const EXTRA_TITLE: Record<string, LocalizedText | undefined> = {
  rights: { uz: "Mening ma'lumotlarim", ru: "Мои данные", en: "My data" },
};

const LABELS = {
  about: { uz: "Operator", ru: "Оператор" },
  docs: { uz: "Huquqiy hujjatlar", ru: "Правовые документы" },
  contact: { uz: "Aloqa", ru: "Контакты" },
  stir: { uz: "STIR", ru: "ИНН" },
  dpo: { uz: "Shaxsga doir ma'lumotlar bo'yicha", ru: "По персональным данным" },
  todo: {
    uz: "Operator rekvizitlari to'ldirilmagan — Admin panel > Sozlamalar",
    ru: "Реквизиты оператора не заполнены — Админ-панель > Настройки",
  },
} as const;

/* The server already redacts unfilled requisites before they leave /api/legal.
   This stays as a second line of defence for a surface every visitor reads. */
const PLACEHOLDER = /^\[(TO'LDIRILSIN|ZAPOLNIT|TO BE COMPLETED)/;

function filled(value: string): string {
  const text = value.trim();
  return text && !PLACEHOLDER.test(text) ? text : "";
}

function readField(field: OperatorField, docLang: DocLang): string {
  return filled(String(readOperatorField(field, docLang)));
}

export function LegalFooter() {
  const { lang } = useI18n();
  const [config, setConfig] = useState<LegalConfig | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/legal", { signal: controller.signal })
      .then(response => response.json() as Promise<LegalConfig>)
      .then(body => {
        if (body?.ok) setConfig(body);
      })
      /* A footer that cannot reach the API should not break the page it is on. */
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  if (!config) return <div className="footer-legal" id="footerLegal" />;

  /* The documents exist in uz and ru only, so an English reader gets the Uzbek
     labels, matching the page they are about to open. */
  const docLang: DocLang = lang === "ru" ? "ru" : "uz";
  const operator = config.operator ?? {};
  const field = (name: string): string => readField(operator[name], docLang);

  const legalName = field("legalName");
  const legalForm = field("legalForm");
  const stir = field("stir");
  const address = field("address");
  const email = field("email");
  const phone = field("phone");
  const dpoEmail = field("dpoEmail");

  /* When the data contact is the general mailbox, the column already shows it. */
  const showDpo = dpoEmail && dpoEmail.toLowerCase() !== email.toLowerCase();
  const hasAbout = Boolean(legalName || legalForm || stir || address);
  const hasContact = Boolean(email || phone || showDpo);

  /* Only oversight learns the requisites are unfilled, and where to fix it. */
  const showTodo = !config.ready && readStored("sessionStorage", "kg_admin") === "1";

  return (
    <div className="footer-legal" id="footerLegal">
      {(hasAbout || showTodo) && (
        <div>
          <h3>{LABELS.about[docLang]}</h3>
          {legalName && (
            <p>
              <strong>{legalName}</strong>
            </p>
          )}
          {legalForm && <p>{legalForm}</p>}
          {stir && (
            <p>
              {LABELS.stir[docLang]}: {stir}
            </p>
          )}
          {address && <p>{address}</p>}
          {showTodo && <p className="lg-todo">{LABELS.todo[docLang]}</p>}
        </div>
      )}
      <div>
        <h3>{LABELS.docs[docLang]}</h3>
        <ul>
          {Object.entries(PAGES).map(([key, href]) => {
            const title = config.docs?.[key]?.title ?? EXTRA_TITLE[key];
            return (
              <li key={key}>
                <a href={href}>{title?.[docLang] ?? title?.uz ?? key}</a>
              </li>
            );
          })}
        </ul>
      </div>
      {hasContact && (
        <div>
          <h3>{LABELS.contact[docLang]}</h3>
          {email && <p>{email}</p>}
          {phone && <p>{phone}</p>}
          {showDpo && (
            <p>
              <span style={{ opacity: 0.75 }}>{LABELS.dpo[docLang]}:</span> {dpoEmail}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
