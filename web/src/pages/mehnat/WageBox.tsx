import { useI18n } from "../../shell/i18n";
import { amount, Empty, flag, formatMoney, formatPercent, record } from "../../shell/market";
import type { Json, Translate } from "../../shell/market";

/* Below this many records a wage cut is hidden, so nobody's pay can be read off it. */
const DEFAULT_MIN_SAMPLE = 5;

function WageRow({ label, cut, t }: { label: string; cut: Json; t: Translate }) {
  const { lang } = useI18n();
  if (!cut.stats) {
    return (
      <tr>
        <td>{label}</td>
        <td className="num" colSpan={3} style={{ textAlign: "right", color: "var(--muted)" }}>
          {t("hc_suppressed")}
        </td>
      </tr>
    );
  }
  const stats = record(cut.stats);
  return (
    <tr>
      <td>{label}</td>
      <td className="num">{formatMoney(stats.p25, "", lang)}</td>
      <td className="num">{formatMoney(stats.median, "", lang)}</td>
      <td className="num">{formatMoney(stats.p75, "", lang)}</td>
    </tr>
  );
}

type WageBoxProps = { wages: Json; hasPrivacyNote: boolean; t: Translate };

/* Offered, expected and accepted pay side by side. */
export function WageBox({ wages, hasPrivacyNote, t }: WageBoxProps) {
  const { lang } = useI18n();
  const offered = record(wages.offered);
  if (!wages.offered || flag(offered.suppressed)) {
    const minSample = hasPrivacyNote ? amount(offered.min) || DEFAULT_MIN_SAMPLE : DEFAULT_MIN_SAMPLE;
    return (
      <Empty style={{ padding: 22 }}>
        {t("hc_suppressed")} (n&lt;{minSample})
      </Empty>
    );
  }
  return (
    <>
      <div className="mk-tablewrap">
        <table className="mk-table" style={{ minWidth: 0 }}>
          <thead>
            <tr>
              <th />
              <th className="num">P25</th>
              <th className="num">{t("hc_median")}</th>
              <th className="num">P75</th>
            </tr>
          </thead>
          <tbody>
            <WageRow label={t("hc_offered")} cut={offered} t={t} />
            <WageRow label={t("hc_expected")} cut={record(wages.expected)} t={t} />
            <WageRow label={t("hc_accepted")} cut={record(wages.accepted)} t={t} />
          </tbody>
        </table>
      </div>
      {wages.pressurePct != null && (
        <p className="mk-note">
          {t("hc_wage_pressure")}: <b>{formatPercent(wages.pressurePct, lang)}</b>
        </p>
      )}
    </>
  );
}
