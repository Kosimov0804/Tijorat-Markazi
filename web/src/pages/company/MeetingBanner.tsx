import { useEffect, useState } from "react";
import { cabinetGet, formatDateTime } from "../../shell/cabinet";
import { useI18n } from "../../shell/i18n";
import { joinUrl, parseConference } from "./conference";
import type { Conference } from "./conference";
import type { CompanyText } from "./types";

/* The association's next meeting, announced above every view. */
export function MeetingBanner({ assocId, ot }: { assocId: string; ot: CompanyText }) {
  const { lang } = useI18n();
  const [conference, setConference] = useState<Conference | null>(null);

  useEffect(() => {
    let isCurrent = true;
    void cabinetGet(`/api/conference?assoc=${encodeURIComponent(assocId)}`).then(answer => {
      if (!isCurrent || !answer.isOk) return;
      const next = parseConference(answer.body);
      setConference(next.title ? next : null);
    });
    return () => {
      isCurrent = false;
    };
  }, [assocId]);

  if (!conference) return <div className="conf-banner" id="coBanner" hidden />;
  return (
    <div className="conf-banner" id="coBanner">
      <span className="cb-ic">📢</span>
      <span className="cb-text">
        <b>{ot("nav_meeting")}:</b> {conference.title}
        {conference.datetime && ` · ${formatDateTime(conference.datetime, lang)}`}
      </span>
      {conference.link && (
        <a className="btn btn-primary cb-join" href={joinUrl(conference)} target="_blank" rel="noopener">
          {ot("cf_join")}
        </a>
      )}
    </div>
  );
}
