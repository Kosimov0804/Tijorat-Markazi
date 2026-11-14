import { useEffect, useState } from "react";
import { cabinetPost, NewsList, parseNews } from "../../shell/cabinet";
import type { NewsItem } from "../../shell/cabinet";
import { useI18n } from "../../shell/i18n";
import type { ViewProps } from "./types";

/* Real articles found on the web, read-only: platform-wide, the company's
   association and its own sector. Articles come in the reader's language. */
export function NewsView({ credentials, ot }: ViewProps) {
  const { lang } = useI18n();
  const [items, setItems] = useState<NewsItem[] | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setItems(null);
    void cabinetPost("/api/company/news", credentials, { lang }).then(answer => {
      if (isCurrent) setItems(answer.isOk ? parseNews(answer.body.items) : []);
    });
    return () => {
      isCurrent = false;
    };
  }, [credentials, lang]);

  return (
    <div className="panel co-panel">
      <div className="co-panel-head">
        <span className="co-ic">📰</span>
        <h2 id="newsTitle">{ot("news_title")}</h2>
      </div>
      <p className="co-sub" id="newsSub">
        {ot("news_sub")}
      </p>
      <div className="mod-list" id="newsList">
        {items === null ? (
          <p className="co-sub">{ot("news_loading")}</p>
        ) : (
          <NewsList
            items={items}
            platformLabel={ot("news_tier_global")}
            sourceLabel={ot("news_src")}
            emptyText={ot("news_empty")}
            className="co-sub"
          />
        )}
      </div>
    </div>
  );
}
