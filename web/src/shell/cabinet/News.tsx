/**
 * CABINET NEWS — the read-only news feed the association and company cabinets
 * share: real articles found on the web, layered platform-wide over the
 * reader's own sphere.
 *
 *   parseNews(answer.items)   → NewsItem[]; image and link addresses that are
 *                               not http(s) (or a same-site image path) are dropped
 *   <NewsList items platformLabel sourceLabel emptyText className? />
 *     platformLabel  badge on platform-wide items ("Platforma")
 *     sourceLabel    link text when an article names no source ("Manba")
 *     emptyText      shown instead of an empty list
 *     className      class of the empty line (default "ac-label")
 *   <NewsCard item platformLabel sourceLabel />   one .news-item article
 */
import { useState } from "react";
import { safeLinkHref, safeMediaUrl } from "../chat/urls";
import { useI18n } from "../i18n";
import { list, record, text } from "../market/narrow";
import { formatDateTime } from "./format";

export type NewsItem = {
  title: string;
  body: string;
  /** "global" marks a platform-wide item. */
  tier: string;
  scope: string;
  source: string;
  time: string | number;
  /** Already validated; "" when the article has none. */
  image: string;
  url: string;
};

export function parseNews(value: unknown): NewsItem[] {
  return list(value).map(entry => {
    const item = record(entry);
    return {
      title: text(item.title),
      body: text(item.body),
      tier: text(item.tier),
      scope: text(item.scope),
      source: text(item.source),
      time: typeof item.time === "number" ? item.time : text(item.time),
      image: safeMediaUrl(item.image),
      url: safeLinkHref(text(item.url)) ?? "",
    };
  });
}

type NewsCardProps = { item: NewsItem; platformLabel: string; sourceLabel: string };

export function NewsCard({ item, platformLabel, sourceLabel }: NewsCardProps) {
  const { lang } = useI18n();
  /* A source image that no longer resolves should leave no gap in the card. */
  const [hasBrokenImage, setHasBrokenImage] = useState(false);
  const badge = item.tier === "global" ? platformLabel : item.scope;

  return (
    <article className="news-item">
      {item.image && !hasBrokenImage && (
        <img className="news-img" src={item.image} alt="" loading="lazy" onError={() => setHasBrokenImage(true)} />
      )}
      <div className="news-text">
        <div className="mi-head">
          <b>{item.title}</b>
          {badge && <span className="mi-badge">{badge}</span>}
        </div>
        {item.body && <p>{item.body}</p>}
        <div className="mi-foot">
          <span>🕓 {formatDateTime(item.time, lang)}</span>
          {item.url && (
            <a className="news-src" href={item.url} target="_blank" rel="noopener noreferrer">
              {item.source || sourceLabel} ↗
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

type NewsListProps = {
  items: readonly NewsItem[];
  platformLabel: string;
  sourceLabel: string;
  emptyText: string;
  className?: string;
};

export function NewsList({ items, platformLabel, sourceLabel, emptyText, className = "ac-label" }: NewsListProps) {
  if (!items.length) return <p className={className}>{emptyText}</p>;
  return (
    <>
      {items.map((item, index) => (
        <NewsCard key={index} item={item} platformLabel={platformLabel} sourceLabel={sourceLabel} />
      ))}
    </>
  );
}
