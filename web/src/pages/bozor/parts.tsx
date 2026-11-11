import type { Lang } from "@legacy/data.js";
import { formatNumber, Segment } from "../../shell/market";
import type { Translate } from "../../shell/market";

/** "Export" is translated; the other channels are shown as their codes. */
export const channelLabel = (channel: string, t: Translate): string =>
  channel === "export" ? t("bz_ch_export") : channel.toUpperCase();

export function ChannelChips({ channels, t }: { channels: readonly string[]; t: Translate }) {
  return (
    <div className="mk-chips">
      {channels.map(channel => (
        <span className={`mk-chip is-${channel}`} key={channel}>
          {channelLabel(channel, t)}
        </span>
      ))}
    </div>
  );
}

type ChannelSegmentProps = { id: string; value: string; t: Translate; onChange: (value: string) => void };

export function ChannelSegment({ id, value, t, onChange }: ChannelSegmentProps) {
  const options = [
    { value: "", label: t("bz_ch_all") },
    { value: "b2b", label: "B2B" },
    { value: "b2g", label: "B2G" },
    { value: "export", label: t("bz_ch_export") },
  ];
  return <Segment id={id} options={options} value={value} onChange={onChange} />;
}

type UnitPriceProps = { price: number; currency: string; unit: string; lang: Lang };

export function UnitPrice({ price, currency, unit, lang }: UnitPriceProps) {
  if (!price) return <>—</>;
  return (
    <>
      {formatNumber(price, lang, 2)}{" "}
      <small>
        {currency}/{unit}
      </small>
    </>
  );
}
