import { useState } from "react";
import { readLeads, writeLeads } from "../demoStore";
import type { DemoLead } from "../demoStore";
import { useText } from "../useText";

/** The browser-only demo list of leads, newest first. */
export function Leads() {
  const { tx } = useText();
  const [list, setList] = useState<readonly DemoLead[]>(readLeads);

  const remove = (index: number) => {
    const next = list.filter((_, at) => at !== index);
    writeLeads(next);
    setList(next);
  };

  const newestFirst = list.map((lead, index) => ({ lead, index })).reverse();

  return (
    <div className="admin-panel">
      <h2>{tx("nav_leads")}</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>{tx("c_name")}</th>
            <th>{tx("c_company")}</th>
            <th>{tx("c_email")}</th>
            <th>{tx("c_date")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {newestFirst.map(({ lead, index }) => (
            <tr key={index}>
              <td>
                <b>{lead.name}</b>
              </td>
              <td>{lead.company}</td>
              <td>{lead.email}</td>
              <td>{lead.date}</td>
              <td>
                <button className="tdel" type="button" onClick={() => remove(index)}>
                  {tx("del")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="admin-form">
        <a className="btn btn-ghost" href="/api/problems.doc" target="_blank" rel="noopener">
          ⬇ {tx("export_word")}
        </a>
      </div>
    </div>
  );
}
