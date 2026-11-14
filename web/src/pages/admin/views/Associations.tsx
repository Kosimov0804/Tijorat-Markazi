import { useEffect, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { InlineInput } from "../InlineInput";
import { assocName } from "../orgs";
import type { Association, OrgsStore } from "../orgs";
import { CENTER, Intro, SMALL_BUTTON } from "../parts";
import { useText } from "../useText";
import { AssociationDetail } from "./AssociationDetail";
import { RaisCard } from "./RaisCard";

/** Every association and its chairman; opening one drills into its member companies. */
export function Associations({ store }: { store: OrgsStore }) {
  const { orgs, send } = store;
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    void send({ op: "list" });
  }, [send]);

  const opened = orgs.associations.find(association => association.id === openId);
  if (opened) return <AssociationDetail association={opened} store={store} onBack={() => setOpenId(null)} />;
  return <AssociationList store={store} onOpen={setOpenId} />;
}

function AssociationList({ store, onOpen }: { store: OrgsStore; onOpen: (id: string) => void }) {
  const { tx } = useText();
  const { orgs, send } = store;
  /* Adding or deleting redrew the old table, which emptied its password cells. */
  const [revision, setRevision] = useState(0);

  const redraw = () => setRevision(current => current + 1);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await send({
      op: "assoc.add",
      name: String(data.get("name") ?? "").trim(),
      chairman: String(data.get("chairman") ?? "").trim(),
    });
    form.reset();
    redraw();
  };

  const handleDelete = async (id: string) => {
    await send({ op: "assoc.del", id });
    redraw();
  };

  return (
    <>
      <RaisCard store={store} />
      <div className="admin-panel">
        <h2>
          {tx("nav_assoc")} ({orgs.associations.length}){" "}
          <a
            className="btn btn-ghost"
            style={{ float: "right", padding: "7px 14px" }}
            href="associations.html"
            target="_blank"
            rel="noopener"
          >
            {tx("as_catalog")}
          </a>
        </h2>
        <Intro>{tx("as_intro")}</Intro>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{tx("as_name")}</th>
              <th>{tx("as_chair")}</th>
              <th>{tx("as_login")}</th>
              <th>{tx("as_pass")}</th>
              <th style={CENTER}>{tx("as_count")}</th>
              <th />
            </tr>
          </thead>
          <tbody key={revision}>
            {orgs.associations.map(association => (
              <AssociationRow
                key={association.id}
                association={association}
                memberCount={orgs.companies.filter(company => company.assocId === association.id).length}
                onOpen={() => onOpen(association.id)}
                onDelete={() => void handleDelete(association.id)}
                onUpdate={(field, value) => void send({ op: "assoc.update", id: association.id, [field]: value })}
              />
            ))}
          </tbody>
        </table>
        <form className="admin-form" id="asForm" onSubmit={event => void handleAdd(event)}>
          <input id="as-name" name="name" placeholder={tx("as_addname")} required />
          <input id="as-chair" name="chairman" placeholder={tx("as_addchair")} />
          <button className="btn btn-primary" type="submit">
            {tx("add")}
          </button>
        </form>
      </div>
    </>
  );
}

type AssociationRowProps = {
  association: Association;
  memberCount: number;
  onOpen: () => void;
  onDelete: () => void;
  onUpdate: (field: "chairman" | "login" | "password", value: string) => void;
};

function AssociationRow({ association, memberCount, onOpen, onDelete, onUpdate }: AssociationRowProps) {
  const { tx, lang } = useText();

  const handleOpenLink = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onOpen();
  };

  return (
    <tr data-id={association.id}>
      <td>
        <a href="#" className="as-open" onClick={handleOpenLink}>
          <b>{assocName(association, lang)}</b>
        </a>
      </td>
      <td>
        <InlineInput
          defaultValue={association.chairman}
          placeholder={tx("as_chair")}
          aria-label={tx("as_chair")}
          onCommit={value => onUpdate("chairman", value)}
        />
      </td>
      <td>
        <InlineInput
          className="adm-inline mono"
          defaultValue={association.login}
          placeholder="login"
          aria-label={tx("as_login")}
          onCommit={value => onUpdate("login", value)}
        />
      </td>
      <td>
        <InlineInput
          className="adm-inline mono"
          type="password"
          autoComplete="new-password"
          defaultValue=""
          placeholder={tx("pw_blank")}
          aria-label={tx("as_pass")}
          onCommit={value => onUpdate("password", value)}
        />
      </td>
      <td style={CENTER}>
        <span className="badge-st on">{memberCount}</span>
      </td>
      <td style={{ whiteSpace: "nowrap" }}>
        <button className="btn btn-ghost as-open" type="button" style={SMALL_BUTTON} onClick={onOpen}>
          {tx("as_open")}
        </button>{" "}
        <button className="tdel" type="button" onClick={onDelete}>
          {tx("del")}
        </button>
      </td>
    </tr>
  );
}
