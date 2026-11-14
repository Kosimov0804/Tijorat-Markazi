import { dialogs } from "../../shell/dialogs";
import type { Translate } from "../../shell/market";
import { downloadReport } from "./data";
import type { Query } from "./data";

/** The selected period as a file. */
export function ReportsView({ query, t }: { query: Query; t: Translate }) {
  const handleDownload = async (kind: string): Promise<void> => {
    if (!(await downloadReport(query, kind))) void dialogs.alert(t("an_fail"));
  };

  return (
    <div className="an-box an-wide">
      <h3>{t("an_rep_h")}</h3>
      <p className="an-note">{t("an_rep_p")}</p>
      <ul className="an-list">
        <li>{t("an_rep_i1")}</li>
        <li>{t("an_rep_i2")}</li>
        <li>{t("an_rep_i3")}</li>
      </ul>
      <div className="an-actions">
        <button className="btn btn-primary" type="button" onClick={() => void handleDownload("xlsx")}>
          {t("an_dl_xlsx")}
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => void handleDownload("doc")}>
          {t("an_dl_doc")}
        </button>
      </div>
      <p className="an-note">{t("an_rep_privacy")}</p>
    </div>
  );
}
