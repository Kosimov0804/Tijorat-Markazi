import type { CSSProperties } from "react";
import { LANGS } from "@legacy/data.js";
import { useChooseLang, useText } from "../useText";
import { GoogleCard } from "./GoogleCard";
import { OperatorCard } from "./OperatorCard";

type SettingsProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

const CHOICES: CSSProperties = { display: "flex", gap: 8, marginTop: 8 };
const CARD: CSSProperties = { marginTop: 26, paddingTop: 22, borderTop: "1px solid var(--line)" };

const choiceClass = (isChosen: boolean): string => `btn ${isChosen ? "btn-primary" : "btn-ghost"}`;

/** Theme and language, the operator requisites and the Google session of the Meet bot. */
export function Settings({ theme, onToggleTheme }: SettingsProps) {
  const { tx, lang } = useText();
  const chooseLang = useChooseLang();

  const chooseTheme = (wanted: "light" | "dark") => {
    if (wanted !== theme) onToggleTheme();
  };

  return (
    <div className="admin-panel">
      <h2>{tx("nav_set")}</h2>
      <div className="admin-form">
        <div>
          <div className="ac-label">{tx("set_theme")}</div>
          <div style={CHOICES}>
            <button className={choiceClass(theme === "light")} id="thLight" type="button" onClick={() => chooseTheme("light")}>
              {tx("light")}
            </button>
            <button className={choiceClass(theme === "dark")} id="thDark" type="button" onClick={() => chooseTheme("dark")}>
              {tx("dark")}
            </button>
          </div>
        </div>
        <div>
          <div className="ac-label">{tx("set_lang")}</div>
          <div style={CHOICES}>
            {LANGS.map(item => (
              <button className={choiceClass(item === lang)} type="button" key={item} onClick={() => chooseLang(item)}>
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="ac-label" style={{ marginTop: 20 }}>
        {tx("set_note")}
      </p>
      <div id="opCard" style={CARD}>
        <OperatorCard />
      </div>
      <div id="gCard" style={CARD}>
        <h3 style={{ fontSize: 15, margin: "0 0 6px" }}>{tx("g_title")}</h3>
        <p className="ac-label">{tx("g_sub")}</p>
        <GoogleCard />
      </div>
    </div>
  );
}
