/*
 * The editorial hero every market page opens with.
 *
 *   <MarketHero index eyebrow headingHtml lead cta={{ href, label }}>pulse</MarketHero>
 *
 * `headingHtml` must be a string from the bundled dictionaries: it carries
 * the <span class="mk-hl"> highlight.
 */
import type { ReactNode } from "react";
import { trustedHtml } from "../trustedHtml";

type MarketHeroProps = {
  index: string;
  eyebrow: string;
  headingHtml: string;
  lead: string;
  cta: { href: string; label: string };
  /** The live figures, usually a <PulseStats>. */
  children: ReactNode;
};

export function MarketHero({ index, eyebrow, headingHtml, lead, cta, children }: MarketHeroProps) {
  return (
    <section className="mk-hero">
      <div className="container mk-hero-inner">
        <div>
          <div className="mk-index" aria-hidden="true">
            {index}
          </div>
          <span className="eyebrow">{eyebrow}</span>
          <h1 dangerouslySetInnerHTML={trustedHtml(headingHtml)} />
          <p className="lead">{lead}</p>
        </div>
        <div className="mk-hero-side">
          {children}
          <a className="btn btn-primary" href={cta.href}>
            {cta.label}
          </a>
        </div>
      </div>
    </section>
  );
}
