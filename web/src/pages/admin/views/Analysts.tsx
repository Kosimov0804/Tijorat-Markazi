import { useRef } from "react";
import { asArray, asString, isRecord } from "../../../shell/chat";
import { dialogs } from "../../../shell/dialogs";
import { adminPostSafe } from "../api";
import { errorOf } from "../orgs";
import { useLoader } from "../parts";
import { useText } from "../useText";

/* Analyst accounts are issued here, alongside associations and companies,
   because that is where every other credential on the platform comes from. */

const ACCOUNTS = "/api/analyst/accounts";
const MARKETS = ["bozor", "moliya", "mehnat"] as const;

interface Analyst {
  id: string;
  name: string;
  org: string;
  login: string;
  scopes: readonly string[];
}

function parseAnalyst(value: unknown): Analyst {
  const item = isRecord(value) ? value : {};
  return {
    id: asString(item.id),
    name: asString(item.name),
    org: asString(item.org),
    login: asString(item.login),
    scopes: asArray(item.scopes).map(asString),
  };
}

async function loadAnalysts(): Promise<Analyst[]> {
  const answer = await adminPostSafe(ACCOUNTS, { op: "list" });
  return asArray(isRecord(answer) ? answer.analysts : null).map(parseAnalyst);
}

export function Analysts() {
  const { tx } = useText();
  const { data: analysts, reload } = useLoader(loadAnalysts, []);

  const handleDelete = async (id: string) => {
    if (!(await dialogs.confirm(tx("an_confirm"), { tone: "danger" }))) return;
    await adminPostSafe(ACCOUNTS, { op: "del", id });
    reload();
  };

  /* The old view drew nothing until the list had arrived. */
  if (!analysts) return null;

  return (
    <div className="admin-panel" id="anCard">
      <h2>{tx("an_title")}</h2>
      <p className="an-acc-intro">{tx("an_sub")}</p>
      <div className="an-acc-list">
        {analysts.length === 0 && <p className="an-acc-empty">{tx("an_none")}</p>}
        {analysts.map(analyst => (
          <div className="an-acc" key={analyst.id}>
            <div className="an-acc-who">
              <b>{analyst.name || analyst.login}</b>
              {analyst.org && <span className="an-acc-org">{analyst.org}</span>}
            </div>
            <div className="an-acc-creds">
              <code>{analyst.login}</code>
              <span className="an-acc-sep">/</span>
              <span className="ac-label">{tx("pw_hidden")}</span>
            </div>
            <div className="an-acc-scopes">
              {analyst.scopes.map(scope => (
                <span key={scope}>{scope}</span>
              ))}
            </div>
            <button
              className="an-acc-del"
              type="button"
              title={tx("an_del")}
              onClick={() => void handleDelete(analyst.id)}
            >
              {tx("an_del")}
            </button>
          </div>
        ))}
      </div>
      <NewAnalyst onAdded={reload} />
    </div>
  );
}

function NewAnalyst({ onAdded }: { onAdded: () => void }) {
  const { tx } = useText();
  const boxRef = useRef<HTMLDivElement>(null);

  const handleAdd = async () => {
    const box = boxRef.current;
    if (!box) return;
    const read = (id: string) => box.querySelector<HTMLInputElement>(`#${id}`)?.value.trim() ?? "";
    const alogin = read("anLogin");
    const apassword = read("anPass");
    if (!alogin || !apassword) return dialogs.alert(tx("an_need"));
    const scopes = [...box.querySelectorAll<HTMLInputElement>(".anScope")]
      .filter(input => input.checked)
      .map(input => input.value);
    if (!scopes.length) return dialogs.alert(tx("an_need_scope"));

    const answer = await adminPostSafe(ACCOUNTS, { op: "add", name: read("anName"), org: read("anOrg"), alogin, apassword, scopes });
    const error = errorOf(answer);
    if (error === "login_exists") return dialogs.alert(tx("an_exists"));
    if (error === "no_scopes") return dialogs.alert(tx("an_need_scope"));
    /* The old view redrew itself here, which emptied the form. */
    box.querySelectorAll<HTMLInputElement>("input:not(.anScope)").forEach(input => {
      input.value = "";
    });
    box.querySelectorAll<HTMLInputElement>(".anScope").forEach(input => {
      input.checked = true;
    });
    onAdded();
  };

  return (
    <div className="an-acc-new" ref={boxRef}>
      <h3>{tx("an_add_h")}</h3>
      <div className="an-acc-grid">
        <label>
          <span>{tx("an_name")}</span>
          <input id="anName" autoComplete="off" />
        </label>
        <label>
          <span>{tx("an_org")}</span>
          <input id="anOrg" autoComplete="off" />
        </label>
        <label>
          <span>{tx("an_login")}</span>
          <input id="anLogin" autoComplete="off" />
        </label>
        <label>
          <span>{tx("an_pass")}</span>
          <input id="anPass" autoComplete="off" />
        </label>
      </div>
      <div className="an-acc-scope-pick">
        <span className="an-acc-scope-lb">{tx("an_scopes")}</span>
        {MARKETS.map(market => (
          <label className="an-chip" key={market}>
            <input type="checkbox" className="anScope" value={market} defaultChecked />
            <span>{market}</span>
          </label>
        ))}
      </div>
      <div className="an-acc-actions">
        <button className="btn btn-primary" type="button" id="anAdd" onClick={() => void handleAdd()}>
          {tx("an_add")}
        </button>
        <a className="an-acc-open" href="tahlil.html" target="_blank" rel="noopener">
          {tx("an_open")}
        </a>
      </div>
    </div>
  );
}
