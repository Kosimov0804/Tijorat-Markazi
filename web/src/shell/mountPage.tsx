import { StrictMode } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./shell.css";
import { I18nProvider } from "./i18n";

export function mountPage(page: ReactNode): void {
  const container = document.getElementById("root");
  if (!container) throw new Error("Page is missing its #root element");
  createRoot(container).render(
    <StrictMode>
      <I18nProvider>{page}</I18nProvider>
    </StrictMode>,
  );
}
