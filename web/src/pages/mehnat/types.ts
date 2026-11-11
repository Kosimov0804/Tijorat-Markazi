import { amount, flag, listOf, parseMatchScore, record, text, texts } from "../../shell/market";
import type { Json, MatchScore } from "../../shell/market";

export const SENIORITIES = ["intern", "junior", "middle", "senior", "lead", "head"] as const;
export const AVAILABILITIES = ["active", "open", "passive", "unavailable"] as const;
export const WORK_FORMATS = ["onsite", "hybrid", "remote"] as const;
export const EMPLOYMENTS = ["full", "part", "shift", "project", "seasonal", "internship"] as const;
export const VISIBILITIES = ["public", "applied-only", "anonymous", "hidden"] as const;
export const SALARY_CURRENCIES = ["UZS", "USD"] as const;

export type Vacancy = {
  id: string;
  status: string;
  title: string;
  summary: string;
  companyName: string;
  region: string;
  occupation: string;
  duties: string;
  seniority: string;
  format: string;
  employment: string;
  deadline: string;
  contact: string;
  currency: string;
  headcount: number;
  applicants: number;
  salaryMin: number;
  salaryMax: number;
  yearsMin: number;
  created: number;
  skillsRequired: string[];
  skillsPreferred: string[];
  languages: string[];
  certificates: string[];
};

export function parseVacancy(value: unknown): Vacancy {
  const item = record(value);
  return {
    id: text(item.id),
    status: text(item.status),
    title: text(item.title),
    summary: text(item.summary),
    companyName: text(item.companyName),
    region: text(item.region),
    occupation: text(item.occupation),
    duties: text(item.duties),
    seniority: text(item.seniority),
    format: text(item.format),
    employment: text(item.employment),
    deadline: text(item.deadline),
    contact: text(item.contact),
    currency: text(item.currency),
    headcount: amount(item.headcount),
    applicants: amount(item.applicants),
    salaryMin: amount(item.salaryMin),
    salaryMax: amount(item.salaryMax),
    yearsMin: amount(item.yearsMin),
    created: amount(item.created),
    skillsRequired: texts(item.skillsRequired),
    skillsPreferred: texts(item.skillsPreferred),
    languages: texts(item.languages),
    certificates: texts(item.certificates),
  };
}

export type Candidate = {
  name: string;
  headline: string;
  occupation: string;
  region: string;
  seniority: string;
  availability: string;
  visibility: string;
  currency: string;
  years: number;
  expectedMin: number;
  expectedMax: number;
  isVerified: boolean;
  canRelocate: boolean;
  skills: string[];
};

export function parseCandidate(value: unknown): Candidate {
  const item = record(value);
  return {
    name: text(item.name),
    headline: text(item.headline),
    occupation: text(item.occupation),
    region: text(item.region),
    seniority: text(item.seniority),
    availability: text(item.availability),
    visibility: text(item.visibility),
    currency: text(item.currency),
    years: amount(item.years),
    expectedMin: amount(item.expectedMin),
    expectedMax: amount(item.expectedMax),
    isVerified: flag(item.verified),
    canRelocate: flag(item.relocate),
    skills: texts(item.skills),
  };
}

export type Listing<T> = { items: T[]; total: number; facets: Json | null };

export function parseListing<T>(answer: Json, parse: (item: unknown) => T): Listing<T> {
  return {
    items: listOf(answer.items, parse),
    total: amount(answer.total),
    facets: answer.facets ? record(answer.facets) : null,
  };
}

export type VacancyMatch = MatchScore & {
  vacancy: Vacancy;
  employerScore: number;
  candidateScore: number;
  hasApplied: boolean;
};

export function parseVacancyMatch(value: unknown): VacancyMatch {
  const item = record(value);
  return {
    ...parseMatchScore(value),
    vacancy: parseVacancy(item.vacancy),
    employerScore: amount(item.employerScore),
    candidateScore: amount(item.candidateScore),
    hasApplied: flag(item.applied),
  };
}

export type CandidateMatch = MatchScore & { candidate: Candidate };

export function parseCandidateMatch(value: unknown): CandidateMatch {
  return { ...parseMatchScore(value), candidate: parseCandidate(record(value).candidate) };
}

export type Application = {
  id: string;
  stage: string;
  vacancyTitle: string;
  vacancyCompany: string;
  candidateName: string;
  currency: string;
  score: number;
  salary: number;
};

export function parseApplication(value: unknown): Application {
  const item = record(value);
  const candidate = record(item.candidate);
  return {
    id: text(item.id),
    stage: text(item.stage),
    vacancyTitle: text(item.vacancyTitle),
    vacancyCompany: text(record(item.vacancy).companyName),
    candidateName: item.candidate ? text(candidate.name) : text(item.candidateName),
    currency: text(item.currency),
    score: amount(item.score),
    salary: amount(item.salary),
  };
}

export type Pipeline = {
  funnel: Json;
  stages: string[];
  byStage: Readonly<Record<string, Application[]>>;
  reasons: { label: string; n: number }[];
};

export type EmployerCabinet = { ok: boolean; vacancies: Vacancy[]; pipeline: Pipeline };

export function parseEmployer(answer: Json): EmployerCabinet {
  const pipeline = record(answer.pipeline);
  const stages = texts(pipeline.stages);
  const byStage = record(pipeline.byStage);
  return {
    ok: flag(answer.ok),
    vacancies: listOf(answer.vacancies, parseVacancy),
    pipeline: {
      funnel: record(pipeline.funnel),
      stages,
      byStage: Object.fromEntries(stages.map(stage => [stage, listOf(byStage[stage], parseApplication)])),
      reasons: listOf(pipeline.reasons, reason => ({
        label: text(record(reason).label),
        n: amount(record(reason).n),
      })),
    },
  };
}
