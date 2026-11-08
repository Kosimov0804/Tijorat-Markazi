import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Lang } from "@legacy/data.js";
import { useI18n } from "../../shell/i18n";
import { formatNumber, marketApi, queryString } from "../../shell/market/mk";
import type { Translate } from "../../shell/market/mk";
import { useApiJson } from "../../shell/useApiJson";
import { IdPlate, kindLabel } from "./BusinessCard";

type DirectoryRow = {
  bizId?: string;
  kind: string;
  name?: string;
  i18n?: Partial<Record<Lang, string>>;
  sector?: string;
};

type VerifyResult = { ok: boolean; bizId?: string; name?: string; kind?: string; reason?: string };
type VerdictState = "idle" | "checking" | VerifyResult;

const MAX_ROWS = 120;
const KINDS = [
  { value: "", labelKey: "bid_f_all" },
  { value: "assoc", labelKey: "bid_f_assocs" },
  { value: "company", labelKey: "bid_f_companies" },
] as const;

function Verdict({ verdict, t }: { verdict: VerifyResult; t: Translate }) {
  if (!verdict.ok) {
    return (
      <div className="bid-verdict is-bad">
        <b>{t(verdict.reason === "unknown" ? "bid_unknown" : "bid_malformed")}</b>
      </div>
    );
  }
  return (
    <div className="bid-verdict is-ok">
      <b>{t("bid_valid")}</b>
      <p>
        <IdPlate id={verdict.bizId ?? ""} /> — {verdict.name}{" "}
        <span className="bid-meta">({kindLabel(verdict.kind ?? "", t)})</span>
      </p>
      <a className="btn btn-primary" href={`biznes-id.html?id=${encodeURIComponent(verdict.bizId ?? "")}`}>
        {t("bid_open_card")}
      </a>
    </div>
  );
}

function DirectoryList({ rows, t }: { rows: DirectoryRow[]; t: Translate }) {
  const { lang } = useI18n();
  if (!rows.length) return <p className="bid-empty">{t("bid_nothing")}</p>;
  return (
    <div className="bid-cards">
      {rows.map((row, index) => {
        const name = row.i18n?.[lang] || row.name || "";
        /* A company's sector is the more useful label; colour already carries the kind. */
        const meta = row.kind === "assoc" ? t("bid_assoc") : row.sector || t("bid_company");
        return (
          <a
            className="bid-c"
            data-kind={row.kind}
            href={`biznes-id.html?id=${encodeURIComponent(row.bizId ?? "")}`}
            key={row.bizId ?? `row-${index}`}
          >
            <span className="bid-c-mark" aria-hidden="true">
              {(name.trim()[0] || "?").toUpperCase()}
            </span>
            <span className="bid-c-body">
              <b>{name}</b> <span className="bid-c-meta">{meta}</span>
            </span>
            <span className="bid-c-id">{row.bizId}</span>
          </a>
        );
      })}
    </div>
  );
}

export function BusinessLookup({ t }: { t: Translate }) {
  const { lang } = useI18n();
  const [verdict, setVerdict] = useState<VerdictState>("idle");
  const [kind, setKind] = useState("");
  const [search, setSearch] = useState("");
  const directory = useApiJson<{ items?: DirectoryRow[] }>("/api/business-id/directory");
  const latestVerify = useRef(0);

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = String(new FormData(event.currentTarget).get("id") ?? "").trim();
    /* Only the newest check may report: a slow answer must not replace a later one. */
    const run = ++latestVerify.current;
    if (!id) {
      setVerdict("idle");
      return;
    }
    setVerdict("checking");
    const result = await marketApi<VerifyResult>(`/api/business-id/verify?${queryString({ id })}`);
    if (run !== latestVerify.current) return;
    setVerdict(typeof result.ok === "boolean" ? (result as VerifyResult) : { ok: false, reason: "malformed" });
  };

  const isDirectoryPending = directory.status === "loading";
  const query = search.trim().toLowerCase();
  /* Kind and text narrow the same list, so a filter pair means both. */
  const rows = (directory.status === "ready" ? (directory.data.items ?? []) : []).filter(row => {
    if (kind && row.kind !== kind) return false;
    if (!query) return true;
    const name = (row.i18n?.[lang] || row.name || "").toLowerCase();
    return name.includes(query) || (row.bizId ?? "").toLowerCase().includes(query) || (row.sector ?? "").toLowerCase().includes(query);
  });

  return (
    <>
      <div className="bid-lead">
        <h1>{t("bid_title")}</h1>
        <p>{t("bid_lead")}</p>
      </div>

      <section className="bid-block bid-verify">
        <h2>{t("bid_lookup")}</h2>
        <p className="bid-meta">{t("bid_lookup_lead")}</p>
        <form className="bid-form" id="bidForm" autoComplete="off" onSubmit={event => void handleVerify(event)}>
          <input
            id="bidInput"
            name="id"
            type="text"
            inputMode="text"
            spellCheck={false}
            placeholder={t("bid_lookup_ph")}
            aria-label={t("bid_lookup")}
          />{" "}
          <button className="btn btn-primary" type="submit">
            {t("bid_check")}
          </button>
        </form>
        <div id="bidVerdict" aria-live="polite">
          {verdict === "checking" && <p className="mk-loading">{t("mk_loading", "Yuklanmoqda…")}</p>}
          {typeof verdict === "object" && <Verdict verdict={verdict} t={t} />}
        </div>
      </section>

      <section className="bid-block">
        <h2>{t("bid_directory")}</h2>
        <div className="bid-filters">
          <div className="mk-seg" id="bidKind" role="group" aria-label={t("bid_directory")}>
            {KINDS.map(option => (
              <button
                key={option.value}
                type="button"
                className={option.value === kind ? "is-on" : undefined}
                onClick={() => setKind(option.value)}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>
          <span className="bid-count" id="bidCount" aria-live="polite">
            {!isDirectoryPending && t("bid_count").replace("{n}", formatNumber(rows.length, lang, 0))}
          </span>
        </div>
        <input
          id="bidSearch"
          className="bid-search"
          type="search"
          spellCheck={false}
          placeholder={t("bid_search_ph")}
          aria-label={t("bid_search_ph")}
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
        <div id="bidDir">
          {isDirectoryPending ? (
            <p className="mk-loading">{t("mk_loading", "Yuklanmoqda…")}</p>
          ) : (
            <DirectoryList rows={rows.slice(0, MAX_ROWS)} t={t} />
          )}
        </div>
      </section>
    </>
  );
}
