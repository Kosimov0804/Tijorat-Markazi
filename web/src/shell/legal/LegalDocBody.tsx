import { Fragment } from "react";
import type { ReactNode } from "react";
import { readStored } from "../storage";
import { pickDocText, readOperatorField } from "./types";
import type { DocLang, LegalConfig, LegalText, LocalizedText } from "./types";

/* Cross-links resolve against this fixed map rather than a path from the
   config: an href assembled from data is one refactor away from user data. */
const PAGES: Record<string, string | undefined> = {
  oferta: "oferta.html",
  maxfiylik: "maxfiylik.html",
  shartlar: "shartlar.html",
  rights: "mening-malumotlarim.html",
};

const EXTRA_TITLE: Record<string, LocalizedText | undefined> = {
  rights: { uz: "Mening maʼlumotlarim", ru: "Мои данные", en: "My data" },
};

const PLACEHOLDER = /^\[(TO'LDIRILSIN|ZAPOLNIT|TO BE COMPLETED)/;

const RETENTION_LABELS: Record<string, LocalizedText | undefined> = {
  account: { uz: "Hisob qaydnomasi", ru: "Учётная запись" },
  application: { uz: "Röyxatdan ötiş arizasi", ru: "Заявка на регистрацию" },
  consent: { uz: "Rozilik yozuvi", ru: "Запись о согласии" },
  transaction: { uz: "Bitim hujjatlari", ru: "Документы сделки" },
};

const NOTICE = {
  incompleteOversight: {
    uz: "DIQQAT: operator rekvizitlari töldirilmagan. Admin panel > Sozlamalar > Operator rekvizitlari bölimida real röyxatdan ötiş maʼlumotlarini kiriting — hujjat töliq huquqiy kuçga şundan keyin ega böladi.",
    ru: "ВНИМАНИЕ: реквизиты оператора не заполнены. Укажите реальные регистрационные данные в разделе Админ-панель > Настройки > Реквизиты оператора — только после этого документ обретёт полную юридическую силу.",
  },
  incompletePublic: {
    uz: "Eslatma: operator rekvizitlari hozirça töliq körsatilmagan. Savollar böyiça platforma maʼmuriyatiga murojaat qiling.",
    ru: "Примечание: реквизиты оператора указаны не полностью. По вопросам обращайтесь к администрации платформы.",
  },
} as const;

type KvRow = readonly [LocalizedText, string | undefined];

type BodyProps = {
  docKey: string;
  doc: LegalText;
  /** null when /api/legal could not be read. */
  config: LegalConfig | null;
  lang: string;
};

export function LegalDocBody({ docKey, doc, config, lang }: BodyProps) {
  const docLang: DocLang = lang === "ru" ? "ru" : "uz";
  const pick = (text: LocalizedText | undefined): string => pickDocText(text, docLang);
  const fill = createFiller(config, docKey, docLang);
  const isOversight = readStored("sessionStorage", "kg_admin") === "1";

  const paragraphs = (rows: LocalizedText[] | undefined): ReactNode =>
    rows?.map(row => <p key={row.uz}>{fill(pick(row))}</p>);

  return (
    <>
      {/* uz and ru are operative. English shows the Uzbek text behind a notice,
          because a translation that disagreed would create real ambiguity. */}
      {lang === "en" && (
        <div className="lg-note lg-note-info">
          This document is published in Uzbek and Russian. The Uzbek text below is the operative version; use the
          language switch for Russian.
        </div>
      )}
      {config && !config.ready && (
        <div className="lg-note lg-note-warn">
          {pick(isOversight ? NOTICE.incompleteOversight : NOTICE.incompletePublic)}
        </div>
      )}
      {doc.lead && <p className="lg-lead">{fill(pick(doc.lead))}</p>}
      {doc.sections.map(section => (
        <section className="lg-sec" key={section.h.uz}>
          <h2>{fill(pick(section.h))}</h2>
          {paragraphs(section.p)}
          {section.slot && <Slot name={section.slot} config={config} docLang={docLang} />}
          {section.list && (
            <ul className="lg-list">
              {section.list.map(item => (
                <li key={item.uz}>{fill(pick(item))}</li>
              ))}
            </ul>
          )}
          {paragraphs(section.after)}
          {section.links && <CrossLinks keys={section.links} config={config} docLang={docLang} />}
        </section>
      ))}
    </>
  );
}

/* An unknown token is left visible: a stray brace is a bug someone should see. */
function createFiller(config: LegalConfig | null, docKey: string, docLang: DocLang): (text: string) => string {
  if (!config) return text => text;
  const operator = config.operator ?? {};
  const field = (name: string): string => readOperatorField(operator[name], docLang);
  const meta = config.docs?.[docKey];
  const values: Record<string, string> = {
    brand: field("brand"),
    operator: field("legalName"),
    legalForm: field("legalForm"),
    stir: field("stir"),
    address: field("address"),
    email: field("email"),
    phone: field("phone"),
    dpoName: field("dpoName"),
    dpoEmail: field("dpoEmail"),
    days: config.responseDays == null ? "10" : String(config.responseDays),
    version: meta?.version ?? "",
    effective: meta?.effective ?? "",
  };
  return text => text.replace(/\{(\w+)\}/g, (match, key: string) => (Object.hasOwn(values, key) ? values[key] : match));
}

function CrossLinks({ keys, config, docLang }: { keys: string[]; config: LegalConfig | null; docLang: DocLang }) {
  const known = keys.filter(key => PAGES[key]);
  return (
    <p className="lg-links">
      {known.map((key, index) => {
        const title = config?.docs?.[key]?.title ?? EXTRA_TITLE[key];
        return (
          <Fragment key={key}>
            {index > 0 && " "}
            <a href={PAGES[key]}>{pickDocText(title, docLang) || key} →</a>
          </Fragment>
        );
      })}
    </p>
  );
}

/* Placeholders render as a warning, so nobody mistakes an unfilled field for a
   real registration number. */
function RequisiteValue({ value, docLang }: { value: string | undefined; docLang: DocLang }) {
  const text = value ?? "";
  if (!text) return <span className="lg-todo">{docLang === "ru" ? "не указано" : "körsatilmagan"}</span>;
  if (PLACEHOLDER.test(text)) return <span className="lg-todo">{text}</span>;
  return <>{text}</>;
}

function KeyValues({ rows, docLang }: { rows: readonly KvRow[]; docLang: DocLang }) {
  return (
    <dl className="lg-kv">
      {rows.map(([label, value]) => (
        <Fragment key={label.uz}>
          <dt>{pickDocText(label, docLang)}</dt>
          <dd>
            <RequisiteValue value={value} docLang={docLang} />
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

function DataTable({ head, rows }: { head: readonly string[]; rows: readonly (readonly string[])[] }) {
  return (
    <div className="lg-tablewrap">
      <table className="lg-table">
        <thead>
          <tr>
            {head.map(cell => (
              <th key={cell}>{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(cells => (
            <tr key={cells.join("|")}>
              {cells.map((cell, index) => (
                <td key={`${index}:${cell}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Slots are where a document stops describing and shows what the system holds,
   so a document can never describe a field the platform does not collect. */
function Slot({ name, config, docLang }: { name: string; config: LegalConfig | null; docLang: DocLang }) {
  const pick = (text: LocalizedText | undefined): string => pickDocText(text, docLang);
  const isRu = docLang === "ru";
  const operator = config?.operator ?? {};
  const field = (key: string): string => readOperatorField(operator[key], docLang);

  switch (name) {
    case "operator": {
      const registration = [field("regNumber"), field("regDate")].filter(Boolean).join(" · ");
      const rows: KvRow[] = [
        [{ uz: "Töliq nomi", ru: "Полное наименование" }, field("legalName")],
        [{ uz: "Taşkiliy-huquqiy şakli", ru: "Организационно-правовая форма" }, field("legalForm")],
        [{ uz: "STIR", ru: "ИНН" }, field("stir")],
        [{ uz: "Davlat röyxatidan ötkazilganligi", ru: "Государственная регистрация" }, registration],
        [{ uz: "Joylaşgan joyi (poçta manzili)", ru: "Местонахождение (почтовый адрес)" }, field("address")],
        [{ uz: "Elektron poçta", ru: "Электронная почта" }, field("email")],
        [{ uz: "Telefon", ru: "Телефон" }, field("phone")],
      ];
      const licence = field("licence");
      return (
        <KeyValues
          rows={licence ? [...rows, [{ uz: "Litsenziya", ru: "Лицензия" }, licence]] : rows}
          docLang={docLang}
        />
      );
    }
    case "collected":
      return (
        <DataTable
          head={isRu ? ["Категория данных", "Цель обработки"] : ["Maʼlumot toifasi", "Qayta işlaş maqsadi"]}
          rows={(config?.collected ?? []).map(row => [pick(row), pick(row.purpose)])}
        />
      );
    case "retention":
      return (
        <DataTable
          head={isRu ? ["Вид данных", "Срок хранения"] : ["Maʼlumot turi", "Saqlaş muddati"]}
          rows={Object.entries(config?.retention ?? {}).map(([key, period]) => [
            pick(RETENTION_LABELS[key]) || key,
            pick(period),
          ])}
        />
      );
    case "transfers": {
      const transfers = config?.transfers ?? [];
      if (!transfers.length) {
        return (
          <p>
            {isRu
              ? "В настоящее время персональные данные за пределы Республики Узбекистан не передаются."
              : "Hozirça şaxsga doir maʼlumotlar Özbekiston Respublikasidan taşqariga uzatilmaydi."}
          </p>
        );
      }
      return (
        <DataTable
          head={
            isRu
              ? ["Получатель", "Услуга", "Что передаётся и на каком основании"]
              : ["Qabul qiluvçi", "Xizmat", "Nima uzatiladi va qanday asosda"]
          }
          rows={transfers.map(row => [row.to ?? "", row.service ?? "", pick(row)])}
        />
      );
    }
    case "dpo":
      return (
        <KeyValues
          rows={[
            [{ uz: "Masʼul şaxs", ru: "Ответственное лицо" }, field("dpoName")],
            [{ uz: "Elektron poçta", ru: "Электронная почта" }, field("dpoEmail")],
            [{ uz: "Poçta manzili", ru: "Почтовый адрес" }, field("address")],
          ]}
          docLang={docLang}
        />
      );
    default:
      return null;
  }
}
