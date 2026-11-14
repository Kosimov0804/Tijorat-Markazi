import { asArray, asString, isRecord } from "../../shell/chat";
import { readStored, writeStored } from "../../shell/storage";

/* The two browser-only demo lists of the old panel (admin.js "store" and
   "seed"). Their rows come back out of localStorage, so they are read as
   untrusted text like everything else. */

export interface DemoCompany {
  name: string;
  sector: string;
  status: string;
  invest: string;
}

export interface DemoLead {
  name: string;
  company: string;
  email: string;
  date: string;
}

const COMPANIES_KEY = "kg_companies";
const LEADS_KEY = "kg_leads";

const SEED_COMPANIES: readonly DemoCompany[] = [
  { name: "UzAuto Motors", sector: "Automotive", status: "on", invest: "$890M" },
  { name: "Artel", sector: "Manufacturing", status: "on", invest: "$340M" },
  { name: "IT Park", sector: "Technology", status: "on", invest: "$210M" },
  { name: "Uzbekinvest", sector: "Finance", status: "on", invest: "$120M" },
];

const SEED_LEADS: readonly DemoLead[] = [
  { name: "Aziz Karimov", company: "GreenTech", email: "aziz@greentech.uz", date: "2026-06-24" },
  { name: "Dilnoza Saidova", company: "AgroExport", email: "d.saidova@agro.uz", date: "2026-06-25" },
  { name: "John Smith", company: "Sequoia Capital", email: "js@sequoia.com", date: "2026-06-26" },
];

function readList(key: string): readonly unknown[] {
  try {
    return asArray(JSON.parse(readStored("localStorage", key) ?? "null"));
  } catch {
    /* A corrupt slot reads as an empty list. */
    return [];
  }
}

const fields = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

export function readCompanies(): DemoCompany[] {
  return readList(COMPANIES_KEY).map(value => {
    const row = fields(value);
    return {
      name: asString(row.name),
      sector: asString(row.sector),
      status: asString(row.status),
      invest: asString(row.invest),
    };
  });
}

export function readLeads(): DemoLead[] {
  return readList(LEADS_KEY).map(value => {
    const row = fields(value);
    return {
      name: asString(row.name),
      company: asString(row.company),
      email: asString(row.email),
      date: asString(row.date),
    };
  });
}

export const writeCompanies = (list: readonly DemoCompany[]): void =>
  writeStored("localStorage", COMPANIES_KEY, JSON.stringify(list));

export const writeLeads = (list: readonly DemoLead[]): void =>
  writeStored("localStorage", LEADS_KEY, JSON.stringify(list));

/** Fills both lists the first time the panel is opened in a browser. */
export function seedDemoStore(): void {
  if (!readStored("localStorage", COMPANIES_KEY)) writeCompanies(SEED_COMPANIES);
  if (!readStored("localStorage", LEADS_KEY)) writeLeads(SEED_LEADS);
}
