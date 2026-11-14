import { CabinetLogin, cabinetPost, clearCabinetSession, useCabinetLogin } from "../../shell/cabinet";
import type { CabinetCredentials } from "../../shell/cabinet";
import { goTo } from "../../shell/navigate";
import { PageBackground } from "../../shell/PageBackground";
import { AssociationCabinet } from "./AssociationCabinet";
import { PublicAssociation } from "./PublicAssociation";
import { parseAssociation, parseCompanies, SESSION_KEY, useAssocText } from "./types";
import type { Account } from "./types";

async function loadAccount(credentials: CabinetCredentials): Promise<Account | null> {
  const answer = await cabinetPost("/api/assoc/login", credentials);
  if (!answer.isOk) return null;
  return { assoc: parseAssociation(answer.body.assoc), companies: parseCompanies(answer.body.companies) };
}

function CabinetGate() {
  const at = useAssocText();
  const { state, submit } = useCabinetLogin<Account>({
    storageKey: SESSION_KEY,
    ownPage: "association.html",
    signIn: loadAccount,
  });

  const handleLogout = (): void => {
    clearCabinetSession(SESSION_KEY);
    goTo("associations.html");
  };

  /* Nothing is shown while a stored session is checked against the server. */
  if (state.status === "checking") return null;
  if (state.status === "signedOut") {
    return (
      <CabinetLogin
        idPrefix="as"
        title={at("lg_title")}
        lead={at("lg_sub")}
        buttonLabel={at("lg_btn")}
        errorText={at("err")}
        onSubmit={submit}
      />
    );
  }
  return <AssociationCabinet account={state.account} credentials={state.credentials} onLogout={handleLogout} />;
}

export function AssociationPage() {
  /* ?id=… is an explicit request for one association's PUBLIC page, so it wins
     even when a chairman is signed in: otherwise they could never look at
     another association's profile. No id means this is the panel. */
  const publicId = new URLSearchParams(window.location.search).get("id");
  if (publicId) return <PublicAssociation id={publicId} />;
  return (
    <>
      <PageBackground />
      <CabinetGate />
    </>
  );
}
