import { useEffect, useState } from "react";
import type { Lang, Localized } from "@legacy/data.js";
import { useI18n } from "../../shell/i18n";
import { safeHttpUrl } from "../../shell/market/mk";
import { useApiJson } from "../../shell/useApiJson";

export type Conference = {
  id?: string;
  title?: string;
  desc?: string;
  datetime?: string;
  link?: string;
};

const TICK_MS = 1000;
const OPEN_BEFORE_MS = 10 * 60 * 1000;

const TEXT = {
  noneTitle: ["Konferensiya rejalashtirilmagan", "Конференция не назначена", "No conference scheduled"],
  noneSub: [
    "Administrator konferensiya vaqtini belgilaganda, u shu yerda paydo bo'ladi.",
    "Когда администратор назначит время конференции, она появится здесь.",
    "When the admin schedules a conference, it will appear here.",
  ],
  startsIn: ["Boshlanishigacha", "До начала", "Starts in"],
  liveNow: ["Konferensiya jonli efirda", "Конференция идёт сейчас", "Conference is live"],
  join: ["Konferensiyaga qo'shilish →", "Присоединиться к конференции →", "Join the conference →"],
  joinSoon: [
    "Tugma boshlanishidan oldin faollashadi",
    "Кнопка станет активной перед началом",
    "The button activates before the start",
  ],
  days: ["kun", "дн", "d"],
  hours: ["soat", "ч", "h"],
  mins: ["daq", "мин", "m"],
  secs: ["son", "сек", "s"],
  when: ["Vaqt", "Время", "Time"],
} satisfies Record<string, Localized>;

const MONTHS: Record<Lang, readonly string[]> = {
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

export function formatConferenceTime(value: string | undefined, lang: Lang): string {
  const date = new Date(value ?? "");
  if (Number.isNaN(date.getTime())) return value || "—";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getDate()} ${MONTHS[lang][date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes}`;
}

function Countdown({ remainingMs }: { remainingMs: number }) {
  const { pick } = useI18n();
  let seconds = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(seconds / 86400);
  seconds -= days * 86400;
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  const units = [
    ...(days > 0 ? [{ value: days, label: TEXT.days }] : []),
    { value: hours, label: TEXT.hours },
    { value: minutes, label: TEXT.mins },
    { value: seconds, label: TEXT.secs },
  ];
  return (
    <div className="conf-clock">
      {units.map(unit => (
        <span className="cu" key={unit.label[2]}>
          <b>{String(unit.value).padStart(2, "0")}</b>
          <em>{pick(unit.label)}</em>
        </span>
      ))}
    </div>
  );
}

function ScheduledConference({ conference }: { conference: Conference }) {
  const { lang, pick } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  const startMs = new Date(conference.datetime ?? "").getTime();
  const hasTime = !Number.isNaN(startMs);

  useEffect(() => {
    if (!hasTime) return;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [hasTime]);

  const remainingMs = hasTime ? startMs - now : -1;
  const isOpen = !hasTime || remainingMs <= OPEN_BEFORE_MS;
  /* A room may still be missing if Google was unreachable when it was scheduled. */
  const joinHref =
    isOpen && conference.link
      ? conference.id
        ? `/api/conference/join?id=${encodeURIComponent(conference.id)}`
        : safeHttpUrl(conference.link)
      : "";

  return (
    <>
      <span className="conf-eyebrow">
        {pick(TEXT.when)}: {formatConferenceTime(conference.datetime, lang)}
      </span>
      <h1 className="conf-title">{conference.title}</h1>
      {conference.desc && <p className="conf-desc">{conference.desc}</p>}
      <div className="conf-count" id="confCount">
        {isOpen ? (
          <span className="conf-live">
            <span className="conf-live-dot" />
            {pick(TEXT.liveNow)}
          </span>
        ) : (
          <>
            <span className="conf-count-label">{pick(TEXT.startsIn)}</span>
            <Countdown remainingMs={remainingMs} />
          </>
        )}
      </div>
      <a
        className={joinHref ? "btn btn-primary btn-lg conf-join" : "btn btn-primary btn-lg conf-join disabled"}
        id="joinBtn"
        target="_blank"
        rel="noopener"
        href={joinHref || undefined}
      >
        {pick(TEXT.join)}
      </a>
      <p className="conf-hint" id="joinHint" hidden={Boolean(joinHref)}>
        {pick(TEXT.joinSoon)}
      </p>
    </>
  );
}

export function ConferenceCard() {
  const { pick } = useI18n();
  const state = useApiJson<Conference>("/api/conference");
  if (state.status === "loading") return null;
  const conference = state.status === "ready" && state.data?.title ? state.data : null;
  if (conference) return <ScheduledConference conference={conference} />;
  return (
    <div className="conf-empty">
      <div className="conf-empty-ic">📅</div>
      <h2>{pick(TEXT.noneTitle)}</h2>
      <p>{pick(TEXT.noneSub)}</p>
    </div>
  );
}
