import type { ReactNode } from "react";
import type { Kpis, Passport } from "../engine/types";
import { useKit } from "../kit";

type Tone = "ok" | "warn" | "bad" | null;

function KpiTile({ label, tone, note, children }: { label: string; tone?: Tone; note?: string | null; children: ReactNode }) {
  return (
    <div className={tone ? `ms-kpi is-${tone}` : "ms-kpi"}>
      <span className="ms-kpi-l">{label}</span>
      <b>{children}</b>
      {note && <span className="ms-kpi-note">{note}</span>}
    </div>
  );
}

const band = (value: number | null, good: boolean, fair: boolean): Tone =>
  value == null ? null : good ? "ok" : fair ? "warn" : "bad";

/**
 * The wizard, the result page and the dossier show these same tiles. On the
 * startup track the figures do not touch the score, so they stay uncoloured:
 * a red tile would read as a penalty.
 */
export function KpiTiles({ passport, kpis }: { passport: Pick<Passport, "loyihaTuri" | "valyuta">; kpis: Partial<Kpis> }) {
  const { t, num, money, pct1 } = useKit();
  const isStartup = passport.loyihaTuri === "startup";
  const { irr = null, npv = null, payback = null, debtEbitda = null, dscrMin = null, hurdle = null } = kpis;
  const toned = (tone: Tone): Tone => (isStartup ? null : tone);
  /* Arithmetic on a missing hurdle reads it as zero, as the legacy tiles did. */
  const bar = hurdle as number;
  const irrTone = irr == null ? toned("bad") : toned(irr >= bar + 4 ? "ok" : irr >= bar ? "warn" : "bad");

  return (
    <div className="ms-kpis">
      <KpiTile label={t("ms_kpi_irr")} tone={irrTone} note={isStartup ? null : t("ms_kpi_threshold").replace("{v}", pct1(hurdle))}>
        {pct1(irr)}
      </KpiTile>
      <KpiTile label={t("ms_kpi_npv")}>
        {npv == null ? "—" : <>{money(npv, "")} <small>{passport.valyuta}</small></>}
      </KpiTile>
      <KpiTile label={t("ms_kpi_payback")}>
        {payback == null ? "—" : <>{num(payback, 1)} <small>{t("ms_unit_years")}</small></>}
      </KpiTile>
      {!isStartup && (
        <>
          <KpiTile
            label={t("ms_kpi_debt_ebitda")}
            tone={toned(band(debtEbitda, (debtEbitda ?? 0) <= 2.5, (debtEbitda ?? 0) <= 3))}
            note={t("ms_kpi_max").replace("{v}", num(3, 2))}
          >
            {debtEbitda == null ? "—" : num(debtEbitda, 2)}
          </KpiTile>
          <KpiTile
            label={t("ms_kpi_dscr_min")}
            tone={toned(band(dscrMin, (dscrMin ?? 0) >= 1.5, (dscrMin ?? 0) >= 1.2))}
            note={t("ms_kpi_min").replace("{v}", num(1.2, 2))}
          >
            {dscrMin == null ? "—" : num(dscrMin, 2)}
          </KpiTile>
          <KpiTile label={t("ms_kpi_hurdle")} note={passport.valyuta === "UZS" ? t("ms_kpi_hurdle_uzs") : t("ms_kpi_hurdle_fx")}>
            {pct1(hurdle)}
          </KpiTile>
        </>
      )}
    </div>
  );
}
