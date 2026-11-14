import { useState } from "react";
import type { FormEvent } from "react";
import { cabinetPost } from "../../shell/cabinet";
import { CompanyDetail } from "./CompanyDetail";
import { PasswordReset } from "./PasswordReset";
import { parseCompanies } from "./types";
import type { MemberCompany, ViewProps } from "./types";

type CompaniesProps = ViewProps & {
  companies: readonly MemberCompany[];
  onCompanies: (companies: MemberCompany[]) => void;
};
type RowProps = ViewProps & { company: MemberCompany; onOpen: () => void; onDelete: () => void };

const EMPTY_FORM = { name: "", sector: "", login: "", password: "" };
const MUTED = { color: "var(--muted)" };

function CompanyRow({ company, onOpen, onDelete, credentials, at }: RowProps) {
  return (
    <tr>
      <td>
        <a
          href="#"
          className="cd-open"
          onClick={event => {
            event.preventDefault();
            onOpen();
          }}
        >
          <b>{company.name}</b>
        </a>
      </td>
      <td>{company.sector || "—"}</td>
      <td>
        <code>{company.login}</code>
      </td>
      <td>
        <PasswordReset companyId={company.id} credentials={credentials} at={at} />
      </td>
      <td style={{ textAlign: "center" }}>{company.showroom.length}</td>
      <td style={{ whiteSpace: "nowrap" }}>
        <button type="button" className="btn btn-ghost cd-stat" style={{ padding: "5px 10px", fontSize: 13 }} onClick={onOpen}>
          {at("view")}
        </button>{" "}
        <button type="button" className="tdel" onClick={onDelete}>
          {at("del")}
        </button>
      </td>
    </tr>
  );
}

/* Only the association's own companies: add them, remove them, open one. */
export function CompaniesView({ companies, onCompanies, credentials, at }: CompaniesProps) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errorKey, setErrorKey] = useState<"taken" | "need" | null>(null);

  const run = async (body: object): Promise<boolean> => {
    const answer = await cabinetPost("/api/assoc/companies", credentials, body);
    if (answer.status === 0 || answer.body.error) {
      setErrorKey(answer.body.error === "login exists" ? "taken" : "need");
      return false;
    }
    setErrorKey(null);
    onCompanies(parseCompanies(answer.body.companies));
    return true;
  };

  const handleAdd = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const clogin = form.login.trim();
    if (!clogin || !form.password) {
      setErrorKey("need");
      return;
    }
    const body = { op: "add", name: form.name.trim(), sector: form.sector.trim(), clogin, cpassword: form.password };
    if (await run(body)) setForm(EMPTY_FORM);
  };

  const detail = companies.find(company => company.id === detailId);
  if (detail) {
    return <CompanyDetail company={detail} credentials={credentials} at={at} onBack={() => setDetailId(null)} />;
  }

  const field = (key: keyof typeof EMPTY_FORM) => ({
    value: form[key],
    onChange: (event: { target: { value: string } }) => setForm(current => ({ ...current, [key]: event.target.value })),
  });

  return (
    <div className="admin-panel">
      <h2>
        {at("nav_comp")} ({companies.length})
      </h2>
      <p style={{ ...MUTED, fontSize: 14, marginBottom: 14 }}>{at("cmp_intro")}</p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>{at("c_name")}</th>
            <th>{at("c_sector")}</th>
            <th>{at("c_login")}</th>
            <th>{at("i_pass")}</th>
            <th style={{ textAlign: "center" }}>{at("c_prod")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {[...companies].reverse().map(company => (
            <CompanyRow
              key={company.id}
              company={company}
              credentials={credentials}
              at={at}
              onOpen={() => setDetailId(company.id)}
              onDelete={() => void run({ op: "del", id: company.id })}
            />
          ))}
          {!companies.length && (
            <tr>
              <td colSpan={6} className="ac-label">
                {at("cmp_empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="err" id="cmpErr" role="alert" style={{ marginTop: 10 }}>
        {errorKey ? at(errorKey) : ""}
      </div>
      <form className="admin-form mb-form" id="cmpForm" onSubmit={handleAdd}>
        <input id="cmp-name" placeholder={at("ph_name")} required {...field("name")} />
        <input id="cmp-sector" placeholder={at("c_sector")} {...field("sector")} />
        <input id="cmp-login" placeholder={at("c_login")} required {...field("login")} />
        <input id="cmp-pass" placeholder={at("c_pass")} required {...field("password")} />
        <button className="btn btn-primary" type="submit">
          {at("add")}
        </button>
      </form>
      <p style={{ ...MUTED, fontSize: 13, marginTop: 12 }}>
        {at("hint")}{" "}
        <a href="company.html" target="_blank" rel="noopener">
          company.html
        </a>
      </p>
    </div>
  );
}
