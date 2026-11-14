import { useEffect, useState } from "react";
import { assocName } from "../orgs";
import type { OrgsStore } from "../orgs";
import { Intro, orDash } from "../parts";
import { useText } from "../useText";
import { CompanyAddForm } from "./CompanyAddForm";

const ALL = "all";

/** Every member company across the associations, with a filter and an add form. */
export function Members({ store }: { store: OrgsStore }) {
  const { tx, lang } = useText();
  const { orgs, send } = store;
  const [filter, setFilter] = useState(ALL);

  useEffect(() => {
    void send({ op: "list" });
  }, [send]);

  const shown = orgs.companies.filter(company => filter === ALL || company.assocId === filter);
  const nameOf = (assocId: string) => {
    const association = orgs.associations.find(item => item.id === assocId);
    return association ? assocName(association, lang) : "—";
  };

  return (
    <div className="admin-panel">
      <h2>
        {tx("nav_members")} ({orgs.companies.length})
      </h2>
      <Intro gap={14}>{tx("mb_intro")}</Intro>
      <div style={{ marginBottom: 14 }}>
        <select
          className="adm-search"
          id="mbFilter"
          aria-label={tx("mb_assoc")}
          style={{ maxWidth: 340 }}
          value={filter}
          onChange={event => setFilter(event.target.value)}
        >
          <option value={ALL}>{tx("mb_all")}</option>
          {orgs.associations.map(association => (
            <option key={association.id} value={association.id}>
              {assocName(association, lang)}
            </option>
          ))}
        </select>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>{tx("mb_name")}</th>
            <th>{tx("mb_assoc")}</th>
            <th>{tx("mb_sector")}</th>
            <th>{tx("mb_login")}</th>
            <th>{tx("mb_pass")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {[...shown].reverse().map(company => (
            <tr key={company.id}>
              <td>
                <b>{company.name}</b>
              </td>
              <td>{nameOf(company.assocId)}</td>
              <td>{orDash(company.sector)}</td>
              <td>
                <code>{company.login}</code>
              </td>
              <td>
                <span className="ac-label">{tx("pw_hidden")}</span>
              </td>
              <td>
                <button className="tdel" type="button" onClick={() => void send({ op: "company.del", id: company.id })}>
                  {tx("del")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <CompanyAddForm
        formId="mbForm"
        errorId="mbErr"
        associations={orgs.associations}
        send={send}
        onAdded={() => undefined}
      />
    </div>
  );
}
