import { amount, flag, listOf, parseMatchScore, parseMeter, record, text, texts } from "../../shell/market";
import type { Json, MatchScore, Meter } from "../../shell/market";

export type PriceTier = { from: number; price: number };

export type Product = {
  id: string;
  title: string;
  desc: string;
  company: string;
  sector: string;
  region: string;
  category: string;
  sku: string;
  brand: string;
  specs: string;
  hs: string;
  unit: string;
  currency: string;
  status: string;
  price: number;
  moq: number;
  leadTime: number;
  stock: number;
  isLocalMade: boolean;
  isVerified: boolean;
  channels: string[];
  certificates: string[];
  incoterms: string[];
  markets: string[];
  tiers: PriceTier[];
};

export function parseProduct(value: unknown): Product {
  const item = record(value);
  return {
    id: text(item.id),
    title: text(item.title),
    desc: text(item.desc),
    company: text(item.company),
    sector: text(item.sector),
    region: text(item.region),
    category: text(item.category),
    sku: text(item.sku),
    brand: text(item.brand),
    specs: text(item.specs),
    hs: text(item.hs),
    unit: text(item.unit),
    currency: text(item.currency),
    status: text(item.status),
    price: amount(item.price),
    moq: amount(item.moq),
    leadTime: amount(item.leadTime),
    stock: amount(item.stock),
    isLocalMade: flag(item.localMade),
    isVerified: flag(item.verified),
    channels: texts(item.channels),
    certificates: texts(item.certificates),
    incoterms: texts(item.incoterms),
    markets: texts(item.markets),
    tiers: listOf(item.tiers, tier => ({ from: amount(record(tier).from), price: amount(record(tier).price) })),
  };
}

export type Facets = { sectors: string[]; categories: string[]; regions: string[] };
export type Catalog = { items: Product[]; total: number; facets: Facets | null };

export function parseCatalog(answer: Json): Catalog {
  const facets = record(answer.facets);
  return {
    items: listOf(answer.items, parseProduct),
    total: amount(answer.total),
    facets: answer.facets
      ? { sectors: texts(facets.sectors), categories: texts(facets.categories), regions: texts(facets.regions) }
      : null,
  };
}

export type Rfq = {
  id: string;
  channel: string;
  status: string;
  title: string;
  spec: string;
  buyerName: string;
  unit: string;
  country: string;
  region: string;
  deadline: string;
  currency: string;
  qty: number;
  budget: number;
  maxLead: number;
  quoteCount: number;
  created: number;
  certificates: string[];
};

export function parseRfq(value: unknown): Rfq {
  const item = record(value);
  return {
    id: text(item.id),
    channel: text(item.channel),
    status: text(item.status),
    title: text(item.title),
    spec: text(item.spec),
    buyerName: text(item.buyerName),
    unit: text(item.unit),
    country: text(item.country),
    region: text(item.region),
    deadline: text(item.deadline),
    currency: text(item.currency),
    qty: amount(item.qty),
    budget: amount(item.budget),
    maxLead: amount(item.maxLead),
    quoteCount: amount(item.quoteCount),
    created: amount(item.created),
    certificates: texts(item.certificates),
  };
}

export type ProductMatch = MatchScore & { productTitle: string; productCompany: string };

export function parseProductMatch(value: unknown): ProductMatch {
  const product = record(record(value).product);
  return { ...parseMatchScore(value), productTitle: text(product.title), productCompany: text(product.company) };
}

export type Quote = {
  sellerName: string;
  currency: string;
  incoterm: string;
  validity: string;
  price: number;
  leadTime: number;
  isBestPrice: boolean;
};

export function parseQuote(value: unknown): Quote {
  const item = record(value);
  return {
    sellerName: text(item.sellerName),
    currency: text(item.currency),
    incoterm: text(item.incoterm),
    validity: text(item.validity),
    price: amount(item.price),
    leadTime: amount(item.leadTime),
    isBestPrice: flag(item.bestPrice),
  };
}

export type InboxItem = MatchScore & {
  id: string;
  productId: string;
  title: string;
  buyerName: string;
  unit: string;
  currency: string;
  qty: number;
  budget: number;
};

function parseInboxItem(value: unknown): InboxItem {
  const item = record(value);
  return {
    ...parseMatchScore(value),
    id: text(item.id),
    productId: text(item.productId),
    title: text(item.title),
    buyerName: text(item.buyerName),
    unit: text(item.unit),
    currency: text(item.currency),
    qty: amount(item.qty),
    budget: amount(item.budget),
  };
}

export type Deal = {
  channel: string;
  stage: string;
  title: string;
  buyerName: string;
  sellerName: string;
  currency: string;
  value: number;
  risks: string[];
};

function parseDeal(value: unknown): Deal {
  const item = record(value);
  return {
    channel: text(item.channel),
    stage: text(item.stage),
    title: text(item.title),
    buyerName: text(item.buyerName),
    sellerName: text(item.sellerName),
    currency: text(item.currency),
    value: amount(item.value),
    risks: texts(item.risks),
  };
}

export type InquiryReply = { by: string; text: string };

export type Inquiry = {
  id: string;
  status: string;
  source: string;
  productName: string;
  message: string;
  buyerName: string;
  buyerEmail: string;
  company: string;
  country: string;
  contact: string;
  unit: string;
  qty: number;
  created: number;
  replies: InquiryReply[];
};

function parseInquiry(value: unknown): Inquiry {
  const item = record(value);
  return {
    id: text(item.id),
    status: text(item.status),
    source: text(item.source),
    productName: text(item.productName),
    message: text(item.message),
    buyerName: text(item.buyerName),
    buyerEmail: text(item.buyerEmail),
    company: text(item.company),
    country: text(item.country),
    contact: text(item.contact),
    unit: text(item.unit),
    qty: amount(item.qty),
    created: amount(item.created),
    replies: listOf(item.replies, reply => ({ by: text(record(reply).by), text: text(record(reply).text) })),
  };
}

export type SellerCabinet = {
  ok: boolean;
  trust: { level: string; badge: string; products: number; deals: number };
  exportScore: number;
  exportBlocks: Meter[];
  inbox: InboxItem[];
  deals: Deal[];
  products: Product[];
  inquiries: Inquiry[];
};

export function parseSeller(answer: Json): SellerCabinet {
  const trust = record(answer.trust);
  const readiness = record(answer.exportReadiness);
  return {
    ok: flag(answer.ok),
    trust: {
      level: text(trust.level),
      badge: text(trust.badge),
      products: amount(trust.products),
      deals: amount(trust.deals),
    },
    exportScore: amount(readiness.score),
    exportBlocks: listOf(readiness.blocks, parseMeter),
    inbox: listOf(answer.inbox, parseInboxItem),
    deals: listOf(answer.deals, parseDeal),
    products: listOf(answer.products, parseProduct),
    inquiries: listOf(answer.inquiries, parseInquiry),
  };
}

/** What a product hands to the RFQ form when a buyer asks for a quote. */
export type RfqPrefill = { title: string; category: string; unit: string; channel: string; certificates: string };

export const CHANNELS = ["b2b", "b2g", "export"] as const;
