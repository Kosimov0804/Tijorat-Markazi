import { useRef } from "react";
import { InlineInput } from "../InlineInput";
import type { OrgsStore } from "../orgs";
import { Intro } from "../parts";
import { useText } from "../useText";

/** The rais (top oversight) sign-in and the Telegram chat the monthly report goes to. */
export function RaisCard({ store }: { store: OrgsStore }) {
  const { tx } = useText();
  const { orgs, send } = store;
  const cardRef = useRef<HTMLDivElement>(null);

  /* Any of the three fields saves all three, as saveRais did. A blank
     password changes nothing on the server. */
  const save = () => {
    const read = (id: string) => cardRef.current?.querySelector<HTMLInputElement>(`#${id}`)?.value ?? "";
    void send({
      op: "rais.set",
      login: read("rais-login").trim(),
      password: read("rais-pass"),
      tgChat: read("rais-tg").trim(),
    });
  };

  return (
    <div className="admin-panel" style={{ marginBottom: 18 }} ref={cardRef}>
      <h2>👑 {tx("rais_title")}</h2>
      <Intro gap={14}>{tx("rais_hint")}</Intro>
      <div className="admin-form" style={{ gridTemplateColumns: "repeat(2,minmax(0,1fr))", maxWidth: 480 }}>
        <div>
          <div className="ac-label">{tx("as_login")}</div>
          {/* The key refills the box once the registry has loaded. */}
          <InlineInput
            key={orgs.rais.login}
            className="adm-inline mono"
            id="rais-login"
            aria-label={`${tx("rais_title")}: ${tx("as_login")}`}
            defaultValue={orgs.rais.login}
            onCommit={save}
          />
        </div>
        <div>
          <div className="ac-label">{tx("pw_new")}</div>
          <InlineInput
            className="adm-inline mono"
            type="password"
            autoComplete="new-password"
            id="rais-pass"
            aria-label={`${tx("rais_title")}: ${tx("pw_new")}`}
            defaultValue=""
            placeholder={tx("pw_blank")}
            onCommit={save}
          />
        </div>
      </div>
      <div style={{ maxWidth: 480, marginTop: 10 }}>
        <div className="ac-label">{tx("rais_tg")}</div>
        <InlineInput
          key={orgs.rais.tgChat}
          className="adm-inline mono"
          id="rais-tg"
          aria-label={tx("rais_tg")}
          defaultValue={orgs.rais.tgChat}
          placeholder="masalan: 123456789"
          onCommit={save}
        />
      </div>
    </div>
  );
}
