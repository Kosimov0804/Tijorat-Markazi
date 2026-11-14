import { useState } from "react";
import type { CSSProperties } from "react";
import { cabinetPost } from "../../shell/cabinet";
import { dialogs } from "../../shell/dialogs";
import { text } from "../../shell/market/narrow";
import type { ViewProps } from "./types";

type PasswordResetProps = ViewProps & { companyId: string; style?: CSSProperties };

const BUTTON_STYLE: CSSProperties = { padding: "4px 9px", fontSize: 12.5 };

/* The panel cannot show a member's password, because the platform keeps only a
   hash. Helping a member who has lost theirs means issuing a new one, and the
   new one exists in readable form for exactly the length of this response: it
   is shown once, next to the button that produced it, and stays on screen until
   the view is redrawn. */
export function PasswordReset({ companyId, credentials, at, style }: PasswordResetProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [issued, setIssued] = useState("");

  const handleReset = async (): Promise<void> => {
    if (!(await dialogs.confirm(at("pw_confirm")))) return;
    setIsBusy(true);
    const answer = await cabinetPost("/api/assoc/companies", credentials, { op: "pw", id: companyId });
    setIsBusy(false);
    setIssued(text(answer.body.password));
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost cd-pw"
        style={{ ...BUTTON_STYLE, ...style }}
        disabled={isBusy}
        onClick={handleReset}
      >
        {at("pw_reset")}
      </button>
      {issued && (
        <div className="pw-once">
          <div>{at("pw_once")}</div>
          <code className="pw-once-val" onClick={() => void navigator.clipboard?.writeText(issued)}>
            {issued}
          </code>
          <div className="pw-once-why">{at("pw_why")}</div>
        </div>
      )}
    </>
  );
}
