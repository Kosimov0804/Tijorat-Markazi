import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { cabinetPost, formatDate, webHref } from "../../shell/cabinet";
import { useI18n } from "../../shell/i18n";
import { listOf, record, text } from "../../shell/market/narrow";
import type { CompanyTextKey } from "./text";
import type { CompanyText, ViewProps } from "./types";

type ModuleName = "invest" | "rnd" | "service";
type PayloadKey = "title" | "amount" | "status" | "body";
type ModuleField = { id: string; payload: PayloadKey; placeholder: CompanyTextKey };
type ModuleConfig = {
  icon: string;
  /** Prefix of the legacy element ids: invTitle, invSub, invList, invForm. */
  idPrefix: string;
  title: CompanyTextKey;
  lead: CompanyTextKey;
  empty: CompanyTextKey;
  add: CompanyTextKey;
  /** The first field is the required one. */
  fields: readonly ModuleField[];
};

const MODULES: Readonly<Record<ModuleName, ModuleConfig>> = {
  invest: {
    icon: "💰",
    idPrefix: "inv",
    title: "inv_title",
    lead: "inv_sub",
    empty: "inv_empty",
    add: "inv_add",
    fields: [
      { id: "inv-title", payload: "title", placeholder: "inv_p_title" },
      { id: "inv-amount", payload: "amount", placeholder: "inv_p_amount" },
      { id: "inv-status", payload: "status", placeholder: "inv_p_status" },
      { id: "inv-body", payload: "body", placeholder: "inv_p_body" },
    ],
  },
  rnd: {
    icon: "🔬",
    idPrefix: "rnd",
    title: "rnd_title",
    lead: "rnd_sub",
    empty: "rnd_empty",
    add: "rnd_add",
    fields: [
      { id: "rnd-title", payload: "title", placeholder: "rnd_p_title" },
      { id: "rnd-status", payload: "status", placeholder: "rnd_p_status" },
      { id: "rnd-body", payload: "body", placeholder: "rnd_p_body" },
    ],
  },
  /* Services this company offers, shown on the public Xizmatlar page. */
  service: {
    icon: "🛠",
    idPrefix: "svc",
    title: "svc_title",
    lead: "svc_sub",
    empty: "svc_empty2",
    add: "svc_add",
    fields: [
      { id: "svc-title", payload: "title", placeholder: "svc_p_title" },
      { id: "svc-price", payload: "amount", placeholder: "svc_p_price" },
      { id: "svc-status", payload: "status", placeholder: "svc_p_status" },
      { id: "svc-body", payload: "body", placeholder: "svc_p_body" },
    ],
  },
};

type ModuleItem = {
  id: string;
  title: string;
  amount: string;
  status: string;
  body: string;
  link: string;
  scope: string;
  ownerType: string;
  ownerId: string;
  ownerName: string;
  created: string | number;
};

function parseItem(value: unknown): ModuleItem {
  const item = record(value);
  const field = (key: string): string => text(item[key]);
  return {
    id: field("id"),
    title: field("title"),
    amount: field("amount"),
    status: field("status"),
    body: field("body"),
    link: field("link"),
    scope: field("scope"),
    ownerType: field("ownerType"),
    ownerId: field("ownerId"),
    ownerName: field("ownerName"),
    created: typeof item.created === "number" ? item.created : field("created"),
  };
}

type ItemCardProps = { item: ModuleItem; isMine: boolean; ot: CompanyText; onDelete: () => void };

function ItemCard({ item, isMine, ot, onDelete }: ItemCardProps) {
  const { lang } = useI18n();
  const badge = item.scope === "global" ? ot("by_konglomerat") : isMine ? "" : item.ownerName;
  const tags = [item.amount, item.status].filter(Boolean);
  const href = webHref(item.link);
  return (
    <div className="mod-item">
      <div className="mi-head">
        <b>{item.title}</b>
        {badge && <span className="mi-badge">{badge}</span>}
      </div>
      {tags.length > 0 && (
        <div className="mi-meta">
          {tags.map((tag, index) => (
            <span className="mi-tag" key={index}>
              {tag}
            </span>
          ))}
        </div>
      )}
      {item.body && <p>{item.body}</p>}
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" className="mi-link">
          {item.link}
        </a>
      )}
      <div className="mi-foot">
        <span>{formatDate(item.created, lang)}</span>
        {isMine && (
          <button type="button" className="mi-del" onClick={onDelete}>
            {ot("del")}
          </button>
        )}
      </div>
    </div>
  );
}

type ModuleProps = ViewProps & { module: ModuleName; companyId: string };

/* Invest projects, the R&D room and services are one list-plus-form module
   with different fields. */
export function ModuleView({ module, companyId, credentials, ot }: ModuleProps) {
  const config = MODULES[module];
  const [items, setItems] = useState<ModuleItem[] | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const call = useCallback(
    async (body: object): Promise<ModuleItem[]> => {
      const answer = await cabinetPost("/api/company/items", credentials, { module, ...body });
      return answer.isOk ? listOf(answer.body.items, parseItem) : [];
    },
    [credentials, module],
  );

  const reload = useCallback(async (): Promise<void> => setItems(await call({ op: "list" })), [call]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleAdd = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const payload = Object.fromEntries(config.fields.map(field => [field.payload, (form[field.id] ?? "").trim()]));
    if (!payload[config.fields[0].payload]) return;
    await call({ op: "add", ...payload });
    setForm({});
    await reload();
  };

  const handleDelete = async (id: string): Promise<void> => {
    await call({ op: "del", id });
    await reload();
  };

  return (
    <div className="panel co-panel">
      <div className="co-panel-head">
        <span className="co-ic">{config.icon}</span>
        <h2 id={`${config.idPrefix}Title`}>{ot(config.title)}</h2>
      </div>
      <p className="co-sub" id={`${config.idPrefix}Sub`}>
        {ot(config.lead)}
      </p>
      <div className="mod-list" id={`${config.idPrefix}List`}>
        {items?.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            ot={ot}
            isMine={item.ownerType === "company" && item.ownerId === companyId}
            onDelete={() => void handleDelete(item.id)}
          />
        ))}
        {items && !items.length && <p className="co-sub">{ot(config.empty)}</p>}
      </div>
      <form className="admin-form mb-form" id={`${config.idPrefix}Form`} onSubmit={handleAdd}>
        {config.fields.map((field, index) => (
          <input
            key={field.id}
            id={field.id}
            placeholder={ot(field.placeholder)}
            required={index === 0}
            value={form[field.id] ?? ""}
            onChange={event => setForm(current => ({ ...current, [field.id]: event.target.value }))}
          />
        ))}
        <button className="btn btn-primary" type="submit">
          {ot(config.add)}
        </button>
      </form>
    </div>
  );
}
