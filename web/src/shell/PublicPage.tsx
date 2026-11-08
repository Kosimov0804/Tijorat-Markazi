import type { ReactNode } from "react";
import { PageBackground } from "./PageBackground";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import type { HeaderAction } from "./SiteHeader";

type PublicPageProps = {
  active?: string;
  action?: HeaderAction;
  hideServices?: boolean;
  /** The legal documents sit on a plain ground. */
  hasMonumentBackground?: boolean;
  /** False on pages that show no sign-out control, such as the legal documents. */
  hasSessionActions?: boolean;
  isGroupHighlighted?: boolean;
  /** Defaults to the standard footer; pass null for a page that has none. */
  footer?: ReactNode;
  children: ReactNode;
};

export function PublicPage({
  active,
  action,
  hideServices,
  hasMonumentBackground = true,
  hasSessionActions = true,
  isGroupHighlighted,
  footer,
  children,
}: PublicPageProps) {
  return (
    <>
      <PageBackground isPainted={hasMonumentBackground} />
      <SiteHeader
        active={active}
        action={action}
        hideServices={hideServices}
        hasSessionActions={hasSessionActions}
        isGroupHighlighted={isGroupHighlighted}
      />
      {children}
      {footer === undefined ? <SiteFooter /> : footer}
    </>
  );
}
