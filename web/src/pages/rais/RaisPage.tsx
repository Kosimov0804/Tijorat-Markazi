import { useEffect } from "react";
import { replaceWith } from "../../shell/navigate";
import { PageBackground } from "../../shell/PageBackground";
import { LINK, NOTICE } from "./text";

const ADMIN_PAGE = "admin.html";

/* The rais panel was merged into the admin panel, and rais.html has since
   been only this notice and a redirect. rais.js is no longer loaded by any
   page, so there is nothing else here to carry over. */
export function RaisPage() {
  useEffect(() => {
    replaceWith(ADMIN_PAGE);
  }, []);

  return (
    <>
      <PageBackground />
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          fontFamily: "Inter,sans-serif",
          color: "var(--text)",
        }}
      >
        <div>
          <p style={{ fontSize: 18, marginBottom: 10 }}>{NOTICE}</p>
          <p>
            <a href={ADMIN_PAGE} style={{ color: "var(--navy)", fontWeight: 600 }}>
              {LINK}
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
