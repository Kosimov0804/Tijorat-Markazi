import { useEffect, useState } from "react";
import { cabinetPost, NewsList, parseNews } from "../../shell/cabinet";
import type { NewsItem } from "../../shell/cabinet";
import { useI18n } from "../../shell/i18n";
import type { ViewProps } from "./types";

/* Real articles found on the web, read-only: platform-wide ones layered over
   this association's own sphere. Articles come in the reader's language. */
export function NewsView({ credentials, at }: ViewProps) {
  const { lang } = useI18n();
  const [items, setItems] = useState<NewsItem[] | null>(null);

  useEffect(() => {
    let isCurrent = true;
    setItems(null);
    void cabinetPost("/api/assoc/news", credentials, { lang }).then(answer => {
      if (isCurrent) setItems(parseNews(answer.body.items));
    });
    return () => {
      isCurrent = false;
    };
  }, [credentials, lang]);

  return (
    <div className="admin-panel">
      <h2>{at("nav_news")}</h2>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>{at("news_intro")}</p>
      <div className="mod-list" id="asNewsList">
        {items === null ? (
          <p className="ac-label">{at("news_loading")}</p>
        ) : (
          <NewsList
            items={items}
            platformLabel={at("news_tier_global")}
            sourceLabel={at("news_src")}
            emptyText={at("news_empty")}
          />
        )}
      </div>
    </div>
  );
}
