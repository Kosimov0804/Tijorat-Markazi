import { useI18n } from "../../shell/i18n";
import { formatNumber, listOf, text, texts, useLoad } from "../../shell/market";
import type { Translate } from "../../shell/market";
import { analystPost, BUCKETS, formatShare, parsePoint } from "./data";
import type { Query } from "./data";
import { SegButtons, Spark, viewState } from "./parts";

/** The series being looked at; an empty metric lets the server choose. */
export type TrendChoice = { module: string; metric: string; bucket: string };

type TrendsViewProps = {
  query: Query;
  modules: readonly string[];
  choice: TrendChoice;
  onChoose: (choice: TrendChoice) => void;
  t: Translate;
};

function TrendBadge({ percent }: { percent: unknown }) {
  const { lang } = useI18n();
  if (percent == null || !Number.isFinite(Number(percent))) return null;
  const change = Number(percent);
  return (
    <span className={`an-trend ${change >= 0 ? "is-up" : "is-down"}`}>
      {change >= 0 ? "▲" : "▼"} {formatShare(Math.abs(change), lang)}
    </span>
  );
}

/** How a market has moved over time. */
export function TrendsView({ query, modules, choice, onChoose, t }: TrendsViewProps) {
  const { lang } = useI18n();
  const { module } = choice;
  const key = `series|${query.days}|${module}|${choice.metric}|${choice.bucket}`;
  const { data, isLoading } = useLoad(key, () => analystPost("series", query, choice));
  const waiting = viewState(isLoading, Boolean(data?.ok), t);
  if (waiting || !data) return waiting;

  const metric = text(data.metric);
  const bucket = text(data.bucket);
  const metricLabel = (name: string): string => t(`an_m_${name}`, name);
  const moduleLabel = (name: string): string => t(`an_mod_${name}`, name);
  const bucketLabel = (name: string): string => t(`an_b_${name}`, name);
  return (
    <>
      <div className="an-controls">
        <SegButtons
          id="trModule"
          options={modules}
          active={module}
          labelOf={moduleLabel}
          onPick={next => onChoose({ module: next, metric: "", bucket: choice.bucket })}
        />
        <SegButtons
          id="trMetric"
          options={texts(data.metrics)}
          active={metric}
          labelOf={metricLabel}
          onPick={next => onChoose({ ...choice, metric: next })}
        />
        <SegButtons
          id="trBucket"
          options={BUCKETS}
          active={bucket}
          labelOf={bucketLabel}
          onPick={next => onChoose({ ...choice, bucket: next })}
        />
      </div>
      <div className="an-box an-wide">
        <h3>
          {moduleLabel(module)} · {metricLabel(metric)} <TrendBadge percent={data.trendPct} />
        </h3>
        <p className="an-note">
          {t("an_total")}: <b>{formatNumber(data.total, lang, 0)}</b> · {t("an_bucket")}: {bucketLabel(bucket)}
        </p>
        <Spark points={listOf(data.points, parsePoint)} label={metricLabel(metric)} t={t} />
      </div>
    </>
  );
}
