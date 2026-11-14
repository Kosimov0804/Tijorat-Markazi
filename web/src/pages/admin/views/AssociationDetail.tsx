import { useState } from "react";
import { InlineInput } from "../InlineInput";
import { assocName } from "../orgs";
import type { Association, Company, OrgsStore } from "../orgs";
import { Intro } from "../parts";
import { useText } from "../useText";
import { CompanyAddForm } from "./CompanyAddForm";

type AssociationDetailProps = {
  association: Association;
  store: OrgsStore;
  onBack: () => void;
};

/** One association: its own sign-in, then its member (subsidiary) companies. */
export function AssociationDetail({ association, store, onBack }: AssociationDetailProps) {
  const { tx, lang } = useText();
  const { orgs, send } = store;
  const [revision, setRevision] = useState(0);
  const { id } = association;
  const companies = orgs.companies.filter(company => company.assocId === id);

  const redraw = () => setRevision(current => current + 1);
  const saveAssociation = (field: string, value: string) => void send({ op: "assoc.update", id, [field]: value });

  const handleDelete = async (companyId: string) => {
    await send({ op: "company.del", id: companyId });
    redraw();
  };

  return (
    <>
      <button className="btn btn-ghost" id="asBack" type="button" style={{ marginBottom: 14 }} onClick={onBack}>
        {tx("as_back")}
      </button>
      <div className="admin-panel" style={{ marginBottom: 18 }}>
        <h2>🏛️ {assocName(association, lang)}</h2>
        <div className="admin-form" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))", maxWidth: 680 }}>
          <div>
            <div className="ac-label">{tx("as_chair")}</div>
            <InlineInput
              id="ad-chair"
              aria-label={tx("as_chair")}
              defaultValue={association.chairman}
              onCommit={value => saveAssociation("chairman", value)}
            />
          </div>
          <div>
            <div className="ac-label">{tx("as_login")}</div>
            <InlineInput
              className="adm-inline mono"
              id="ad-login"
              aria-label={tx("as_login")}
              defaultValue={association.login}
              onCommit={value => saveAssociation("login", value)}
            />
          </div>
          <div>
            <div className="ac-label">{tx("pw_new")}</div>
            <InlineInput
              className="adm-inline mono"
              type="password"
              autoComplete="new-password"
              id="ad-pass"
              aria-label={tx("pw_new")}
              defaultValue=""
              placeholder={tx("pw_blank")}
              onCommit={value => saveAssociation("password", value)}
            />
          </div>
        </div>
      </div>
      <div className="admin-panel">
        <h2>
          {tx("as_children")} ({companies.length})
        </h2>
        <Intro gap={14}>{tx("mb_intro")}</Intro>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{tx("mb_name")}</th>
              <th>{tx("mb_sector")}</th>
              <th>{tx("mb_login")}</th>
              <th>{tx("mb_pass")}</th>
              <th />
            </tr>
          </thead>
          <tbody key={revision}>
            {companies.length === 0 && (
              <tr>
                <td colSpan={5} className="ac-label">
                  {tx("as_empty_c")}
                </td>
              </tr>
            )}
            {[...companies].reverse().map(company => (
              <CompanyRow
                key={company.id}
                company={company}
                onDelete={() => void handleDelete(company.id)}
                onUpdate={(field, value) => void send({ op: "company.update", id: company.id, [field]: value })}
              />
            ))}
          </tbody>
        </table>
        <CompanyAddForm formId="cForm" errorId="cErr" assocId={id} send={send} onAdded={redraw} />
      </div>
    </>
  );
}

type CompanyRowProps = {
  company: Company;
  onDelete: () => void;
  onUpdate: (field: "name" | "sector" | "password", value: string) => void;
};

function CompanyRow({ company, onDelete, onUpdate }: CompanyRowProps) {
  const { tx } = useText();
  return (
    <tr data-id={company.id}>
      <td>
        <InlineInput
          defaultValue={company.name}
          aria-label={tx("mb_name")}
          onCommit={value => onUpdate("name", value)}
        />
      </td>
      <td>
        <InlineInput
          defaultValue={company.sector}
          placeholder={tx("mb_sector")}
          aria-label={tx("mb_sector")}
          onCommit={value => onUpdate("sector", value)}
        />
      </td>
      <td>
        <code>{company.login}</code>
      </td>
      <td>
        <InlineInput
          className="adm-inline mono"
          type="password"
          autoComplete="new-password"
          defaultValue=""
          placeholder={tx("pw_blank")}
          aria-label={tx("mb_pass")}
          onCommit={value => onUpdate("password", value)}
        />
      </td>
      <td>
        <button className="tdel" type="button" onClick={onDelete}>
          {tx("del")}
        </button>
      </td>
    </tr>
  );
}
