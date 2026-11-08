import type { ReactNode } from "react";
import { useI18n } from "./i18n";
import { LegalFooter } from "./LegalFooter";

type SiteFooterProps = {
  hasRegisterLink?: boolean;
  /** The legal pages keep the bottom row inside the legal block's container. */
  isBottomInContainer?: boolean;
  /** Replaces the standard copyright and country lines. */
  children?: ReactNode;
};

export function SiteFooter({ hasRegisterLink = false, isBottomInContainer = false, children }: SiteFooterProps) {
  const { t } = useI18n();
  const bottomRow = (
    <div className={isBottomInContainer ? "footer-bottom" : "container footer-bottom"}>
      {hasRegisterLink && <a href="royxatdan-otish.html">{t("nav_register")}</a>}
      {children ?? (
        <>
          <span>{t("foot_copy")}</span>
          <span>{t("foot_country")}</span>
        </>
      )}
    </div>
  );
  return (
    <footer className="footer">
      <div className="container">
        <LegalFooter />
        {isBottomInContainer && bottomRow}
      </div>
      {!isBottomInContainer && bottomRow}
    </footer>
  );
}
