import { useState } from "react";
import type { FormEvent } from "react";
import { goTo } from "../../shell/navigate";
import { resolveLogin } from "../../shell/resolveLogin";
import { useText } from "./useText";

const OWN_PAGE = "admin.html";

/* One login system: whatever tier these credentials belong to, the shared
   resolver finds it and says where to go. Typing a company or analyst login
   here sends you to that cabinet instead of refusing you. */
export function LoginForm({ onOpen }: { onOpen: () => void }) {
  const { tx } = useText();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [hasFailed, setHasFailed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsBusy(true);
    setHasFailed(false);
    const target = await resolveLogin(login, password);
    setIsBusy(false);
    if (target === OWN_PAGE) {
      onOpen();
      return;
    }
    if (target) {
      goTo(target);
      return;
    }
    setHasFailed(true);
    setPassword("");
  };

  return (
    <div className="admin-login" id="adminLogin">
      <form id="loginForm" onSubmit={event => void handleSubmit(event)}>
        <h2 id="lgTitle">{tx("lg_title")}</h2>
        <p id="lgSub">{tx("lg_sub")}</p>
        <div className="err" id="lgErr" role="alert">
          {hasFailed && tx("lg_err")}
        </div>
        <input
          id="lgLogin"
          placeholder="Login"
          aria-label="Login"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={login}
          onChange={event => setLogin(event.target.value)}
        />
        <input
          type="password"
          id="lgPass"
          placeholder="••••••••"
          aria-label={tx("as_pass")}
          autoComplete="current-password"
          value={password}
          onChange={event => setPassword(event.target.value)}
        />
        <button className="btn btn-primary btn-lg" type="submit" id="lgBtn" style={{ width: "100%" }} disabled={isBusy}>
          {tx("lg_btn")}
        </button>
      </form>
    </div>
  );
}
