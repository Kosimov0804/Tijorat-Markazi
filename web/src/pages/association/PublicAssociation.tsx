import { useEffect, useState } from "react";
import { cabinetGet } from "../../shell/cabinet";
import { useI18n } from "../../shell/i18n";
import { amount, listOf, record, text } from "../../shell/market/narrow";
import { goTo } from "../../shell/navigate";
import { PublicPage } from "../../shell/PublicPage";
import { assocName, parseAssociation, useAssocText } from "./types";
import type { AssocText, Association } from "./types";

type PublicCompany = { name: string; sector: string; products: number; bizId: string };
type PublicData = { assoc: Association; companies: PublicCompany[] };

function parsePublicCompany(value: unknown): PublicCompany {
  const item = record(value);
  return { name: text(item.name), sector: text(item.sector), products: amount(item.products), bizId: text(item.bizId) };
}

/* Every member company has a page of its own, so every row with a Business ID
   is clickable. The ID sits beside the card as its own control, outside the
   card's <a>, because anchors cannot nest. */
function CompanyRow({ company, at }: { company: PublicCompany; at: AssocText }) {
  const inner = (
    <>
      <span className="dir-mark">{(company.name || "?").charAt(0).toUpperCase()}</span>
      <span className="dir-body">
        <b>{company.name}</b>
        <em>{company.sector || " "}</em>
        {company.products > 0 && <span className="dir-count">🛍️ {company.products}</span>}
      </span>
    </>
  );
  const bizId = encodeURIComponent(company.bizId);
  return (
    <div className="dir-item">
      {company.bizId ? (
        <a className="dir-card" href={`korxona.html?id=${bizId}`}>
          {inner}
          <span className="dir-open">{at("open")}</span>
        </a>
      ) : (
        <div className="dir-card" style={{ cursor: "default" }}>
          {inner}
        </div>
      )}
      {company.bizId && (
        <a className="dir-bizbtn" href={`biznes-id.html?id=${bizId}`} title="Business ID">
          {company.bizId}
        </a>
      )}
    </div>
  );
}

export function PublicAssociation({ id }: { id: string }) {
  const { lang } = useI18n();
  const at = useAssocText();
  const [data, setData] = useState<PublicData | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void cabinetGet(`/api/assoc/public?id=${encodeURIComponent(id)}`).then(answer => {
      if (!isCurrent) return;
      /* An association that does not exist has no page: back to the directory. */
      if (!answer.isOk) goTo("associations.html");
      else setData({ assoc: parseAssociation(answer.body.assoc), companies: listOf(answer.body.companies, parsePublicCompany) });
    });
    return () => {
      isCurrent = false;
    };
  }, [id]);

  const companies = data?.companies ?? [];
  return (
    <PublicPage action={{ href: "index.html", labelKey: "d_home" }} hasSessionActions={false} footer={null}>
      <main className="co-page" id="asPublic" hidden={!data}>
        <div className="container">
          <a className="co-back" href="associations.html" id="backDir">
            {at("back_dir")}
          </a>
          <div className="co-head">
            <span className="co-eyebrow" id="pubKicker">
              {at("kicker")}
            </span>
            <h1 className="co-name" id="pubName">
              {(data && assocName(data.assoc, lang)) || "—"}
            </h1>
            <span className="co-sector" id="pubChair">
              {data?.assoc.chairman ? `Rahbar: ${data.assoc.chairman}` : ""}
            </span>
          </div>
          <div className="panel co-panel">
            <div className="co-panel-head">
              <span className="co-ic">🏢</span>
              <h2 id="pubCmpTitle">{at("cmp_title")}</h2>
              <span className="ac-sub" id="pubCount" style={{ marginLeft: "auto", color: "var(--muted)" }}>
                {data ? companies.length : ""}
              </span>
            </div>
            <div className="dir-grid" id="pubCompanies">
              {data && !companies.length && <p className="co-sub">{at("pub_empty")}</p>}
              {companies.map((company, index) => (
                <CompanyRow key={index} company={company} at={at} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </PublicPage>
  );
}
