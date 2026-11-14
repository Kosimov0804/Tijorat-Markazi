/*
 * The buyer cabinet's state and transport.
 *
 * ONE payload: /api/buyer/home returns the profile, requests, orders, threads
 * and shortlist together, so switching views never waits on the network.
 * Credentials, never ids: every call sends the login pair and the server
 * resolves who that is. B2B is pinned server side and is not a filter here.
 */
import { T_BREG, T_XARIDOR } from "@legacy/markets-i18n.js";
import { amount, listOf, marketJson, record, text, texts } from "../../shell/market";
import type { Dictionary, Json } from "../../shell/market";
import type { CabinetCredentials } from "../../shell/cabinet";

export const SESSION_KEY = "kg_by";
export const OWN_PAGE = "xaridor.html";

/* The profile form borrows its labels from the buyer registration form. */
export const XARIDOR_TEXT: Dictionary = { ...T_BREG, ...T_XARIDOR };

export type BuyerView = "catalog" | "rfq" | "orders" | "threads" | "profile" | "legal";

export const buyerPost = (path: string, credentials: CabinetCredentials, body?: object): Promise<Json> =>
  marketJson(path, { ...credentials, ...body });

export type Buyer = {
  name: string;
  phone: string;
  contactName: string;
  role: string;
  contactPhone: string;
  region: string;
  about: string;
  login: string;
};

export function parseBuyer(value: unknown): Buyer {
  const buyer = record(value);
  return {
    name: text(buyer.name),
    phone: text(buyer.phone),
    contactName: text(buyer.contactName),
    role: text(buyer.role),
    contactPhone: text(buyer.contactPhone),
    region: text(buyer.region),
    about: text(buyer.about),
    login: text(buyer.login),
  };
}

export type Supplier = { id: string; name: string; sector: string; email: string; phone: string };

export function parseSupplier(value: unknown): Supplier {
  const supplier = record(value);
  return {
    id: text(supplier.id),
    name: text(supplier.name),
    sector: text(supplier.sector),
    email: text(supplier.email),
    phone: text(supplier.phone),
  };
}

export type Rfq = {
  id: string;
  title: string;
  status: string;
  created: number;
  spec: string;
  qty: number;
  unit: string;
  budget: number;
  currency: string;
  maxLead: number;
  quoteCount: number;
};

export function parseRfq(value: unknown): Rfq {
  const rfq = record(value);
  return {
    id: text(rfq.id),
    title: text(rfq.title),
    status: text(rfq.status),
    created: amount(rfq.created),
    spec: text(rfq.spec),
    qty: amount(rfq.qty),
    unit: text(rfq.unit),
    budget: amount(rfq.budget),
    currency: text(rfq.currency),
    maxLead: amount(rfq.maxLead),
    quoteCount: amount(rfq.quoteCount),
  };
}

export type Note = { by: string; t: number; text: string; side: string };

function parseNote(value: unknown): Note {
  const note = record(value);
  return { by: text(note.by), t: amount(note.t), text: text(note.text), side: text(note.side) };
}

export type Deal = {
  id: string;
  title: string;
  stage: string;
  updated: number;
  sellerName: string;
  value: number;
  currency: string;
  nextAction: string;
  risks: string[];
  notes: Note[];
};

export function parseDeal(value: unknown): Deal {
  const deal = record(value);
  return {
    id: text(deal.id),
    title: text(deal.title),
    stage: text(deal.stage),
    updated: amount(deal.updated),
    sellerName: text(deal.sellerName),
    value: amount(deal.value),
    currency: text(deal.currency),
    nextAction: text(deal.nextAction),
    risks: texts(deal.risks),
    notes: listOf(deal.notes, parseNote),
  };
}

export type Thread = {
  id: string;
  status: string;
  companyName: string;
  productName: string;
  message: string;
  updated: number;
  replies: Note[];
};

export function parseThread(value: unknown): Thread {
  const thread = record(value);
  return {
    id: text(thread.id),
    status: text(thread.status),
    companyName: text(thread.companyName),
    productName: text(thread.productName),
    message: text(thread.message),
    updated: amount(thread.updated),
    replies: listOf(thread.replies, parseNote),
  };
}

export type Home = {
  buyer: Buyer;
  channel: string;
  currencies: string[];
  stages: string[];
  rfqs: Rfq[];
  deals: Deal[];
  inquiries: Thread[];
  saved: Supplier[];
};

export function parseHome(answer: Json): Home {
  const meta = record(answer.meta);
  const currencies = texts(meta.currencies);
  return {
    buyer: parseBuyer(answer.buyer),
    channel: text(meta.channel) || "b2b",
    currencies: currencies.length ? currencies : ["UZS"],
    stages: texts(meta.stages),
    rfqs: listOf(answer.rfqs, parseRfq),
    deals: listOf(answer.deals, parseDeal),
    inquiries: listOf(answer.inquiries, parseThread),
    saved: listOf(answer.saved, parseSupplier),
  };
}

/** Resolves to the cabinet state, or null when the credentials are refused. */
export async function loadHome(credentials: CabinetCredentials): Promise<Home | null> {
  const answer = await buyerPost("/api/buyer/home", credentials);
  return answer.ok ? parseHome(answer) : null;
}

export type Product = {
  id: string;
  title: string;
  /* The seller is published as `company`; `companyName` never leaves the server. */
  company: string;
  companyId: string;
  region: string;
  price: number;
  currency: string;
  unit: string;
  moq: number;
  leadTime: number;
};

export function parseProduct(value: unknown): Product {
  const product = record(value);
  return {
    id: text(product.id),
    title: text(product.title),
    company: text(product.company),
    companyId: text(product.companyId),
    region: text(product.region),
    price: amount(product.price),
    currency: text(product.currency),
    unit: text(product.unit),
    moq: amount(product.moq),
    leadTime: amount(product.leadTime),
  };
}

export type Quote = {
  id: string;
  sellerName: string;
  isBestPrice: boolean;
  isBestLead: boolean;
  price: number;
  currency: string;
  qty: number;
  leadTime: number;
  validity: string;
  incoterm: string;
  terms: string;
};

export function parseQuote(value: unknown): Quote {
  const quote = record(value);
  return {
    id: text(quote.id),
    sellerName: text(quote.sellerName),
    isBestPrice: Boolean(quote.bestPrice),
    isBestLead: Boolean(quote.bestLead),
    price: amount(quote.price),
    currency: text(quote.currency),
    qty: amount(quote.qty),
    leadTime: amount(quote.leadTime),
    validity: text(quote.validity),
    incoterm: text(quote.incoterm),
    terms: text(quote.terms),
  };
}

/** What every view needs to act: who is signed in and how to pull fresh state. */
export type Cabinet = {
  credentials: CabinetCredentials;
  home: Home;
  /** Reloads /api/buyer/home after anything that changes it. */
  refresh: () => Promise<void>;
};
