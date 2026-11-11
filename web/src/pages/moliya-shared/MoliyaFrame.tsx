import { useEffect } from "react";
import type { ReactNode } from "react";
import { PublicPage } from "../../shell/PublicPage";
import type { HeaderAction } from "../../shell/SiteHeader";
import { SiteFooter } from "../../shell/SiteFooter";
import { trustedHtml } from "../../shell/trustedHtml";

/* markets.css reads the market accent from <body class="mk" data-market>. */
function useMoliyaBody(): void {
  useEffect(() => {
    const { body } = document;
    const previous = body.dataset.market;
    body.classList.add("mk");
    body.dataset.market = "moliya";
    return () => {
      body.classList.remove("mk");
      if (previous === undefined) delete body.dataset.market;
      else body.dataset.market = previous;
    };
  }, []);
}

type MoliyaFrameProps = {
  action: HeaderAction;
  eyebrow: string;
  /** A heading from a bundled dictionary; it carries the highlight span. */
  headingHtml: string;
  lead: string;
  /** The box beside the hero. Left out on the hub, which has none. */
  pulse?: ReactNode;
  children: ReactNode;
};

/** The chrome every financial market page shares: header, hero, footer. */
export function MoliyaFrame({ action, eyebrow, headingHtml, lead, pulse, children }: MoliyaFrameProps) {
  useMoliyaBody();
  return (
    <PublicPage active="moliya.html" action={action} footer={<SiteFooter hasRegisterLink />}>
      <main>
        <section className="mk-hero no-print">
          <div className="container mk-hero-inner">
            <div>
              <div className="mk-index" aria-hidden="true">
                02
              </div>
              <span className="eyebrow">{eyebrow}</span>
              <h1 dangerouslySetInnerHTML={trustedHtml(headingHtml)} />
              <p className="lead">{lead}</p>
            </div>
            {pulse !== undefined && <div className="mk-hero-side">{pulse}</div>}
          </div>
        </section>
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">{children}</div>
        </section>
      </main>
    </PublicPage>
  );
}
