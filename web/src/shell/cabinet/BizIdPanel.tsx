/**
 * BUSINESS ID PANEL — the cabinet side of the card (port of bizid-panel.js).
 *
 * The public card at biznes-id.html is read-only; this is the one place its
 * contact block can be written. Every cabinet mounts the same panel.
 *
 *   <BizIdPanel credentials={{ login, password }} />
 *
 * The panel never receives an org id: the server reads identity from the
 * credentials, so the only card these fields can reach is the caller's own.
 * The server also says which fields this kind of account carries (a company
 * has phone, e-mail, address and site; an association only phone and site).
 * Carries its own strings. Needs the I18nProvider.
 */
import { useEffect, useState } from "react";
import type { HTMLInputTypeAttribute } from "react";
import "./bizidPanel.css";
import { dialogs } from "../dialogs";
import { useI18n } from "../i18n";
import { record, text, texts } from "../market/narrow";
import type { Json } from "../market/narrow";
import { BIZID_TEXT } from "./cabinetText";
import type { BizIdTextKey } from "./cabinetText";
import { cabinetPost } from "./session";
import type { CabinetCredentials } from "./session";

const API = "/api/business-id/contact";

type FieldKey = "phone" | "email" | "location" | "website";
type Field = { key: FieldKey; label: BizIdTextKey; placeholder: BizIdTextKey; type: HTMLInputTypeAttribute };
type Contact = Record<FieldKey, string>;

const FIELDS: readonly Field[] = [
  { key: "phone", label: "phone", placeholder: "ph_phone", type: "tel" },
  { key: "email", label: "email", placeholder: "ph_mail", type: "email" },
  { key: "location", label: "location", placeholder: "ph_loc", type: "text" },
  { key: "website", label: "website", placeholder: "ph_web", type: "text" },
];

type Card = { bizId: string; url: string; fields: readonly string[]; contact: Contact };
type PanelState = { status: "loading" | "failed" } | { status: "ready"; card: Card };
/* The key, not the text, so the line follows a language switch. */
type Notice = { key: BizIdTextKey; kind: "ok" | "bad" } | null;

function readContact(value: unknown): Contact {
  const contact = record(value);
  return {
    phone: text(contact.phone),
    email: text(contact.email),
    location: text(contact.location),
    website: text(contact.website),
  };
}

const readCard = (body: Json): Card => ({
  bizId: text(body.bizId),
  url: text(body.url),
  fields: texts(body.fields),
  contact: readContact(body.contact),
});

/* The server is the authority on which fields this kind carries. */
const fieldsOf = (card: Card): readonly Field[] =>
  card.fields.length ? FIELDS.filter(field => card.fields.includes(field.key)) : FIELDS;

const isTextKey = (key: string): key is BizIdTextKey => key in BIZID_TEXT;

export function BizIdPanel({ credentials }: { credentials: CabinetCredentials }) {
  const { pick } = useI18n();
  const say = (key: BizIdTextKey): string => pick(BIZID_TEXT[key]);
  const [state, setState] = useState<PanelState>({ status: "loading" });
  const [values, setValues] = useState<Contact>(readContact(null));
  const [notice, setNotice] = useState<Notice>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { login, password } = credentials;

  useEffect(() => {
    let isCurrent = true;
    setState({ status: "loading" });
    void cabinetPost(API, { login, password }, { op: "get" }).then(answer => {
      if (!isCurrent) return;
      if (!answer.body.ok) {
        setState({ status: "failed" });
        return;
      }
      const card = readCard(answer.body);
      setValues(card.contact);
      setState({ status: "ready", card });
    });
    return () => {
      isCurrent = false;
    };
  }, [login, password]);

  if (state.status !== "ready") return <p className="co-sub">{state.status === "failed" ? say("fail") : "…"}</p>;

  const { card } = state;
  const fields = fieldsOf(card);
  const cardHref = card.bizId ? `biznes-id.html?id=${encodeURIComponent(card.bizId)}` : "";

  const handleSave = async (): Promise<void> => {
    const body = Object.fromEntries(fields.map(field => [field.key, values[field.key].trim()]));
    setIsSaving(true);
    const answer = await cabinetPost(API, credentials, body);
    setIsSaving(false);
    if (!answer.body.ok) {
      /* Field-level server errors map onto a readable line, not a code. */
      const error = text(answer.body.error);
      setNotice({ key: isTextKey(error) ? error : "fail", kind: "bad" });
      return;
    }
    /* Show the normalised values back: the server may have lowercased an
       address or added the scheme to a bare domain. */
    const saved = readCard({ ...answer.body, bizId: card.bizId, url: card.url });
    setValues(saved.contact);
    setState({ status: "ready", card: { ...saved, fields: saved.fields.length ? saved.fields : card.fields } });
    setNotice({ key: "saved", kind: "ok" });
    dialogs.toast(say("saved"), { tone: "success" });
  };

  const handleCopy = async (): Promise<void> => {
    const link = card.url || `${window.location.origin}/biznes-id.html?id=${encodeURIComponent(card.bizId)}`;
    try {
      await navigator.clipboard.writeText(link);
      dialogs.toast(say("copied"), { tone: "success" });
    } catch {
      /* No clipboard access: hand the link over to be copied by hand. */
      await dialogs.prompt(say("copy"), link);
    }
  };

  return (
    <div className="bidp">
      <div className="bidp-head">
        <div>
          <h3>{say("title")}</h3>
          <p>{say("lead")}</p>
        </div>
        {card.bizId && (
          <div className="bidp-id">
            <span>{say("number")}</span>
            <b>{card.bizId}</b>
          </div>
        )}
      </div>
      <div className="bidp-grid" data-cols={fields.length}>
        {fields.map(field => (
          <label className="bidp-field" key={field.key}>
            <span>{say(field.label)}</span>
            <input
              type={field.type}
              data-bidp={field.key}
              value={values[field.key]}
              placeholder={say(field.placeholder)}
              onChange={event => setValues(current => ({ ...current, [field.key]: event.target.value }))}
            />
          </label>
        ))}
      </div>
      <div className="bidp-foot">
        <button className="btn btn-primary" type="button" data-bidp-save disabled={isSaving} onClick={handleSave}>
          {say(isSaving ? "saving" : "save")}
        </button>
        {cardHref && (
          <a className="btn btn-ghost" href={cardHref} target="_blank" rel="noopener">
            {say("view")}
          </a>
        )}
        {cardHref && (
          <button className="btn btn-ghost" type="button" data-bidp-copy onClick={handleCopy}>
            {say("copy")}
          </button>
        )}
        <span className={notice ? `bidp-say is-${notice.kind}` : "bidp-say"} data-bidp-say aria-live="polite">
          {notice ? say(notice.key) : ""}
        </span>
      </div>
    </div>
  );
}
