import { useEffect, useState } from "react";
import { isRecord } from "../../shell/chat";
import { navigate } from "../../shell/navigate";
import { PageBackground } from "../../shell/PageBackground";
import { readStored } from "../../shell/storage";
import { GroupChat } from "./GroupChat";
import type { BackPage } from "./RoomList";
import type { Credentials } from "./types";

type Session = { credentials: Credentials; backHref: BackPage } | { redirectTo: string };

function storedAccount(key: string): Credentials | null {
  try {
    const value: unknown = JSON.parse(readStored("sessionStorage", key) ?? "null");
    return isRecord(value) && value.login ? value : null;
  } catch {
    return null;
  }
}

/* The chat page carries no login of its own: it reads whichever cabinet
   session is already open and sends those same credentials on. */
function readSession(): Session {
  /* Most privileged first: rais and admin share the admin panel. */
  if (readStored("sessionStorage", "kg_admin") === "1") {
    return { credentials: { pass: "admin" }, backHref: "admin.html" };
  }
  const rais = storedAccount("kg_rais");
  if (rais) return { credentials: rais, backHref: "admin.html" };
  const association = storedAccount("kg_as");
  if (association) return { credentials: association, backHref: "association.html" };
  const company = storedAccount("kg_co");
  if (company) return { credentials: company, backHref: "company.html" };

  /* An analyst reads aggregates and is deliberately not a participant in the
     members' chat, where commercially sensitive trade talk happens. They go
     back to their own panel, not to the sign-in page. */
  if (storedAccount("kg_an")) return { redirectTo: "tahlil.html" };
  return { redirectTo: "assistant.html" };
}

export function ChatPage() {
  const [session] = useState(readSession);
  const redirectTo = "redirectTo" in session ? session.redirectTo : null;

  useEffect(() => {
    if (redirectTo) navigate.replace(redirectTo);
  }, [redirectTo]);

  /* styles.css stops the page itself from scrolling under the chat. */
  useEffect(() => {
    document.body.classList.add("chat-page");
    return () => document.body.classList.remove("chat-page");
  }, []);

  if ("redirectTo" in session) return null;
  return (
    <>
      <PageBackground />
      <div id="chatRoot">
        <GroupChat credentials={session.credentials} backHref={session.backHref} />
      </div>
    </>
  );
}
