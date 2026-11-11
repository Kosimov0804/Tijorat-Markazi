import { useState } from "react";
import { useI18n } from "../../shell/i18n";
import {
  activateOnKey,
  Chip,
  Empty,
  formatMoney,
  formatNumber,
  listOf,
  Loading,
  marketJson,
  marketQuery,
  MatchCard,
  MatchTitle,
  useLoad,
} from "../../shell/market";
import type { Translate } from "../../shell/market";
import { ChannelSegment, channelLabel } from "./parts";
import { RfqDrawer } from "./RfqDrawer";
import { RfqForm } from "./RfqForm";
import { parseRfq } from "./types";
import type { ProductMatch, Rfq, RfqPrefill } from "./types";

const STATUS_KIND: Readonly<Record<string, string>> = {
  open: "good",
  shortlisted: "warn",
  awarded: "accent",
  closed: "ghost",
};
const MAX_INSTANT_MATCHES = 5;

function RfqCard({ rfq, t, onOpen }: { rfq: Rfq; t: Translate; onOpen: () => void }) {
  const { lang } = useI18n();
  return (
    <article
      className="mk-card"
      data-rfq={rfq.id}
      tabIndex={0}
      role="button"
      onClick={onOpen}
      onKeyDown={activateOnKey(onOpen)}
    >
      <div className="mk-chips">
        <span className={`mk-chip is-${rfq.channel}`}>{channelLabel(rfq.channel, t)}</span>
        <Chip kind={STATUS_KIND[rfq.status] ?? "ghost"}>{t(`status_${rfq.status}`)}</Chip>
      </div>
      <h3>{rfq.title}</h3>
      {rfq.spec && <p className="mk-desc">{rfq.spec}</p>}
      <div className="mk-meta">
        <span>{rfq.buyerName}</span>
        {rfq.qty > 0 && (
          <span>
            {t("bz_f_qty")}{" "}
            <b>
              {formatNumber(rfq.qty, lang, 0)} {rfq.unit}
            </b>
          </span>
        )}
        {rfq.country ? (
          <span>
            🌍 <b>{rfq.country}</b>
          </span>
        ) : (
          rfq.region && (
            <span>
              📍 <b>{rfq.region}</b>
            </span>
          )
        )}
        {rfq.deadline && (
          <span>
            ⏳ <b>{rfq.deadline}</b>
          </span>
        )}
      </div>
      <div className="mk-card-foot">
        <span className="mk-price">{rfq.budget ? formatMoney(rfq.budget, rfq.currency, lang) : "—"}</span>
        <span className="mk-chip">
          {t("bz_quotes")}: {formatNumber(rfq.quoteCount, lang, 0)}
        </span>
      </div>
    </article>
  );
}

type RfqPanelProps = { t: Translate; prefill: RfqPrefill | null };

export function RfqPanel({ t, prefill }: RfqPanelProps) {
  const { lang } = useI18n();
  const [channel, setChannel] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [instantMatches, setInstantMatches] = useState<readonly ProductMatch[]>([]);
  const url = `/api/bozor/rfqs?${marketQuery({ channel })}`;
  const rfqs = useLoad(url, async () => listOf((await marketJson(url)).items, parseRfq));
  const items = rfqs.data ?? [];

  return (
    <>
      <p className="mk-sub">{t("bz_rfq_sub")}</p>
      <div className="mk-split">
        <div className="mk-stack">
          <div className="mk-row">
            <ChannelSegment id="bzRfqChannel" value={channel} t={t} onChange={setChannel} />
            <span className="mk-count" id="bzRfqCount">
              {rfqs.data && t("bz_rfq_count").replace("{n}", formatNumber(items.length, lang, 0))}
            </span>
          </div>
          <div className="mk-grid" id="bzRfqGrid">
            {rfqs.isLoading && <Loading />}
            {!rfqs.isLoading && !items.length && <Empty>{t("bz_rfq_empty")}</Empty>}
            {!rfqs.isLoading &&
              items.map(rfq => <RfqCard key={rfq.id} rfq={rfq} t={t} onOpen={() => setOpenId(rfq.id)} />)}
          </div>
        </div>
        <aside className="mk-stack">
          <RfqForm
            t={t}
            prefill={prefill}
            onPublished={matches => {
              setInstantMatches(matches);
              rfqs.reload();
            }}
          />
          <div id="bzRfqMatches">
            {instantMatches.length > 0 && (
              <div className="mk-box w12">
                <h3>{t("bz_instant_match")}</h3>
                <div className="mk-stack">
                  {instantMatches.slice(0, MAX_INSTANT_MATCHES).map((match, index) => (
                    <MatchCard
                      key={index}
                      match={match}
                      title={<MatchTitle name={match.productTitle} by={match.productCompany} />}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
      {openId !== null && <RfqDrawer id={openId} t={t} onClose={() => setOpenId(null)} />}
    </>
  );
}
