import { asArray, asNumber, asString, isRecord } from "../../../shell/chat";
import { adminPost } from "../api";

export interface QuestionRow {
  question: string;
  count: number;
  isRepeated: boolean;
  /** The companies that asked; for the overall report, the askers when no company is known. */
  who: readonly string[];
}

export interface AssocQuestions {
  id: string;
  name: string;
  i18n: Readonly<Record<string, string>>;
  count: number;
  companies: number;
  questions: readonly QuestionRow[];
}

export interface QuestionsReport {
  ym: string;
  months: readonly string[];
  assocs: readonly AssocQuestions[];
  report: readonly QuestionRow[];
}

const strings = (value: unknown): string[] => asArray(value).map(asString).filter(Boolean);

function parseAssocRow(value: unknown): QuestionRow {
  const item = isRecord(value) ? value : {};
  const count = asNumber(item.count);
  return { question: asString(item.question), count, isRepeated: count > 1, who: strings(item.companies) };
}

function parseReportRow(value: unknown): QuestionRow {
  const item = isRecord(value) ? value : {};
  const companies = strings(item.companies);
  return {
    question: asString(item.question),
    count: asNumber(item.count),
    isRepeated: Boolean(item.repeated),
    who: companies.length ? companies : strings(item.askers),
  };
}

function parseAssoc(value: unknown): AssocQuestions {
  const item = isRecord(value) ? value : {};
  const names = isRecord(item.i18n) ? item.i18n : {};
  return {
    id: asString(item.id),
    name: asString(item.name),
    i18n: Object.fromEntries(Object.entries(names).map(([lang, name]) => [lang, asString(name)])),
    count: asNumber(item.count),
    companies: asNumber(item.companies),
    questions: asArray(item.questions).map(parseAssocRow),
  };
}

/** One month of questions; the server picks the latest month when none is named. Null on an error answer. */
export async function loadQuestions(ym: string | undefined): Promise<QuestionsReport | null> {
  const answer = await adminPost("/api/rais/questions", { ym });
  if (!isRecord(answer) || answer.error) return null;
  return {
    ym: asString(answer.ym),
    months: strings(answer.months),
    assocs: asArray(answer.assocs).map(parseAssoc),
    report: asArray(answer.report).map(parseReportRow),
  };
}
