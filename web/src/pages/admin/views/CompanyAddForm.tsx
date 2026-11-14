import { useState } from "react";
import type { FormEvent } from "react";
import type { Lang } from "@legacy/data.js";
import type { Body } from "../api";
import { assocName, errorOf } from "../orgs";
import type { Association } from "../orgs";
import { useText } from "../useText";
import type { AdminTextKey } from "../text";

type CompanyAddFormProps = {
  formId: string;
  errorId: string;
  /** The association the company joins; omit it to show a picker over `associations`. */
  assocId?: string;
  associations?: readonly Association[];
  send: (body: Body) => Promise<unknown>;
  onAdded: () => void;
};

const fieldPrefix = (formId: string): string => (formId === "cForm" ? "c" : "mb");

/** Issues a company its login and password inside an association. */
export function CompanyAddForm({ formId, errorId, assocId, associations, send, onAdded }: CompanyAddFormProps) {
  const { tx, lang } = useText();
  const [errorKey, setErrorKey] = useState<AdminTextKey | null>(null);
  const prefix = fieldPrefix(formId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? "");
    const login = value("login").trim();
    const password = value("password");
    if (!login || !password) {
      setErrorKey("mb_need");
      return;
    }
    const answer = await send({
      op: "company.add",
      name: value("name").trim(),
      assocId: assocId ?? value("assoc"),
      sector: value("sector").trim(),
      login,
      password,
    });
    const error = errorOf(answer);
    if (error) {
      setErrorKey(error === "login exists" ? "mb_login_taken" : "mb_need");
      return;
    }
    setErrorKey(null);
    form.reset();
    onAdded();
  };

  return (
    <>
      <div className="err" id={errorId} role="alert" style={{ marginTop: 10 }}>
        {errorKey && tx(errorKey)}
      </div>
      <form className="admin-form mb-form" id={formId} onSubmit={event => void handleSubmit(event)}>
        <input id={`${prefix}-name`} name="name" placeholder={tx("mb_addname")} required />
        {associations && <AssociationPicker id={`${prefix}-assoc`} associations={associations} lang={lang} />}
        <input id={`${prefix}-sector`} name="sector" placeholder={tx("mb_sector")} />
        <input id={`${prefix}-login`} name="login" placeholder={tx("mb_login")} required />
        <input id={`${prefix}-pass`} name="password" placeholder={tx("mb_pass")} required />
        <button className="btn btn-primary" type="submit">
          {tx("add")}
        </button>
      </form>
    </>
  );
}

function AssociationPicker({ id, associations, lang }: { id: string; associations: readonly Association[]; lang: Lang }) {
  return (
    <select id={id} name="assoc" required>
      {associations.map(association => (
        <option key={association.id} value={association.id}>
          {assocName(association, lang)}
        </option>
      ))}
    </select>
  );
}
