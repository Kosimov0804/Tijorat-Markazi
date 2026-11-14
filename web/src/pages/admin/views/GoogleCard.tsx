import { useState } from "react";
import { asString, isRecord } from "../../../shell/chat";
import { adminPost, getJson } from "../api";
import { useLoader } from "../parts";
import type { AdminTextKey } from "../text";
import { useText } from "../useText";

interface GoogleStatus {
  isAvailable: boolean;
  isSignedIn: boolean;
  email: string;
}

type Step = "login" | "verify" | "disconnect";

async function loadStatus(): Promise<GoogleStatus> {
  const answer = await getJson("/api/google/status");
  const status = isRecord(answer) ? answer : {};
  return { isAvailable: Boolean(status.available), isSignedIn: Boolean(status.signedIn), email: asString(status.email) };
}

/** The Google session the Meet bot drives, on the machine that runs the server. */
export function GoogleCard() {
  const { tx } = useText();
  const { data: status, reload } = useLoader(loadStatus, []);
  const [busyStep, setBusyStep] = useState<Step | null>(null);
  const [noteKey, setNoteKey] = useState<AdminTextKey | null>(null);

  const run = async (step: Step) => {
    setBusyStep(step);
    try {
      await adminPost(`/api/google/${step}`);
      /* Signing in opens a real Chrome window on the server machine; the person types there. */
      setNoteKey(step === "login" ? "g_opening" : null);
      reload();
    } catch {
      /* The status below still shows where the session stands. */
    } finally {
      setBusyStep(null);
    }
  };

  if (!status) return null;
  if (!status.isAvailable) {
    return (
      <div className="g-body" style={{ marginTop: 12 }}>
        <p className="ac-label" style={{ color: "var(--gold)" }}>
          {tx("g_nochrome")}
        </p>
      </div>
    );
  }

  const label = (step: Step, textKey: AdminTextKey) => tx(busyStep === step ? "g_working" : textKey);
  const dot = status.isSignedIn ? "var(--green)" : "var(--gold)";

  return (
    <div className="g-body" style={{ marginTop: 12 }}>
      <p style={{ fontSize: 14, margin: "0 0 10px" }}>
        <span
          style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: dot, marginRight: 8 }}
        />
        <b>{tx(status.isSignedIn ? "g_on" : "g_off")}</b>
        {status.isSignedIn && status.email ? ` · ${status.email}` : ""}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-primary" id="gIn" type="button" disabled={busyStep !== null} onClick={() => void run("login")}>
          {label("login", status.isSignedIn ? "g_relogin" : "g_login")}
        </button>
        <button className="btn btn-ghost" id="gChk" type="button" disabled={busyStep !== null} onClick={() => void run("verify")}>
          {label("verify", "g_check")}
        </button>
        {status.isSignedIn && (
          <button
            className="btn btn-ghost"
            id="gOff"
            type="button"
            disabled={busyStep !== null}
            onClick={() => void run("disconnect")}
          >
            {label("disconnect", "g_disconnect")}
          </button>
        )}
      </div>
      {noteKey && (
        <p className="ac-label" style={{ marginTop: 10, color: "var(--green)" }}>
          {tx(noteKey)}
        </p>
      )}
      <p className="ac-label" style={{ marginTop: 10 }}>
        {tx("g_note")}
      </p>
    </div>
  );
}
