import { useState } from "react";
import type { FormEvent } from "react";
import { readCompanies, writeCompanies } from "../demoStore";
import type { DemoCompany } from "../demoStore";
import { orDash } from "../parts";
import { useText } from "../useText";

/** The browser-only demo list of companies. */
export function Companies() {
  const { tx } = useText();
  const [list, setList] = useState<readonly DemoCompany[]>(readCompanies);

  const save = (next: readonly DemoCompany[]) => {
    writeCompanies(next);
    setList(next);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? "");
    save([...list, { name: value("name"), sector: value("sector"), status: "on", invest: value("invest") }]);
    form.reset();
  };

  return (
    <div className="admin-panel">
      <h2>{tx("nav_comp")}</h2>
      <table className="admin-table">
        <thead>
          <tr>
            <th>{tx("c_name")}</th>
            <th>{tx("c_sector")}</th>
            <th>{tx("c_status")}</th>
            <th>{tx("c_invest")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.map((company, index) => (
            <tr key={index}>
              <td>
                <b>{company.name}</b>
              </td>
              <td>{company.sector}</td>
              <td>
                <span className="badge-st on">{tx("on")}</span>
              </td>
              <td>{orDash(company.invest)}</td>
              <td>
                <button className="tdel" type="button" onClick={() => save(list.filter((_, at) => at !== index))}>
                  {tx("del")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form className="admin-form" id="compForm" onSubmit={handleSubmit}>
        <input id="cf-name" name="name" placeholder={tx("name_ph")} required />
        <input id="cf-sector" name="sector" placeholder={tx("sector_ph")} required />
        <input id="cf-invest" name="invest" placeholder={tx("invest_ph")} />
        <button className="btn btn-primary" type="submit">
          {tx("add")}
        </button>
      </form>
    </div>
  );
}
