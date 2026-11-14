import { CabinetLogin, cabinetPost, useCabinetLogin } from "../../shell/cabinet";
import type { CabinetCredentials } from "../../shell/cabinet";
import { PageBackground } from "../../shell/PageBackground";
import { CompanyCabinet } from "./CompanyCabinet";
import { parseCompany, SESSION_KEY, useCompanyText } from "./types";
import type { Company } from "./types";

async function loadCompany(credentials: CabinetCredentials): Promise<Company | null> {
  const answer = await cabinetPost("/api/company/login", credentials);
  return answer.isOk ? parseCompany(answer.body.company) : null;
}

function CabinetGate() {
  const ot = useCompanyText();
  const { state, submit, signOut } = useCabinetLogin<Company>({
    storageKey: SESSION_KEY,
    ownPage: "company.html",
    signIn: loadCompany,
  });

  /* Nothing is shown while a stored session is checked against the server. */
  if (state.status === "checking") return null;
  if (state.status === "signedOut") {
    return (
      <CabinetLogin
        idPrefix="co"
        title={ot("lg_title")}
        lead={ot("lg_sub")}
        buttonLabel={ot("lg_btn")}
        errorText={ot("err")}
        onSubmit={submit}
      />
    );
  }
  /* Signing out of the company cabinet stays on the page and shows the form. */
  return <CompanyCabinet company={state.account} credentials={state.credentials} onLogout={signOut} />;
}

export function CompanyPage() {
  return (
    <>
      <PageBackground />
      <CabinetGate />
    </>
  );
}
