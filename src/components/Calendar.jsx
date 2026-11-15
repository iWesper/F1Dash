import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaRegCalendarPlus, FaArrowDown, FaChevronDown, FaTrophy } from "react-icons/fa6";
import { fetchSchedule, fetchSeasonWinners } from "../api/f1";
import { Flag, countryToCode } from "../utils/flags";
import {
  fmtDay,
  fmtTime,
  getSessions,
  localTimeZone,
  raceStart,
  relativeTime,
  shortName,
} from "../utils/race";
import { useDocumentTitle } from "../hooks/useNow";
import { QueryError, Skeleton, State } from "./State";

// ---- .ics export ------------------------------------------------------------

const pad = (n) => String(n).padStart(2, "0");
const icsStamp = (d) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}00Z`;
// RFC 5545 text escaping: commas/semicolons in LOCATION otherwise split fields.
const icsText = (s) => s.replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => `\\${m}`);

/** One event per session, so the whole weekend lands in the user's calendar. */
const downloadIcs = (race) => {
  const location = icsText(`${race.Circuit.circuitName}, ${race.Circuit.Location.country}`);
  const events = getSessions(race).flatMap((s) => [
    "BEGIN:VEVENT",
    `UID:f1dash-${race.season}-${race.round}-${s.key}@f1dash`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(s.start)}`,
    `DTEND:${icsStamp(s.end)}`,
    `SUMMARY:${icsText(`${race.raceName} · ${s.label}`)}`,
    `LOCATION:${location}`,
    "END:VEVENT",
  ]);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//F1 Dash//Race Calendar//EN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${race.raceName.replace(/\s+/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// ---- Race card --------------------------------------------------------------

function RaceCard({ race, winner, winnersLoading, isNext, isPast, cardRef, now }) {
  const start = raceStart(race);
  const { Location } = race.Circuit;

  return (
    <li
      ref={cardRef}
      tabIndex={isNext ? -1 : undefined}
      className={`glass race-card ${isNext ? "race-card--next" : ""} ${
        isPast ? "race-card--past" : ""
      }`}
      aria-current={isNext ? "date" : undefined}
    >
      <div className="race-card__round">
        <span className="race-card__round-num">{race.round}</span>
        <span className="race-card__round-word">Round</span>
      </div>

      <div className="race-card__body">
        <div className="race-card__heading">
          <Flag code={countryToCode[Location.country]} name={Location.country} />
          <h2 className="race-card__name">{race.raceName}</h2>
          {isNext && <span className="badge badge--next">Next · {relativeTime(start, now)}</span>}
        </div>
        <p className="race-card__circuit">
          {race.Circuit.circuitName} · {Location.locality}, {Location.country}
        </p>

        {/* Past rounds stay compact: just the race date. */}
        {isPast ? (
          <p className="race-card__date">
            {fmtDay(start)} {start.getFullYear()}
          </p>
        ) : (
          <ul className="race-card__sessions">
            {getSessions(race).map((s) => (
              <li className={`sess ${s.isRace ? "sess--race" : ""}`} key={s.key}>
                <span className="sess__label">{s.label}</span>
                <span className="sess__time">
                  {fmtDay(s.start)} · {s.hasTime ? fmtTime(s.start) : "TBC"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="race-card__aside">
        {isPast ? (
          winner ? (
            <div className="race-card__winner">
              <span className="race-card__winner-label">
                <FaTrophy aria-hidden="true" /> Winner
              </span>
              <strong>{shortName(winner)}</strong>
            </div>
          ) : winnersLoading ? (
            <Skeleton width={110} height={36} />
          ) : (
            <span className="text-faint">Result pending</span>
          )
        ) : (
          <button
            type="button"
            className="btn"
            onClick={() => downloadIcs(race)}
            aria-label={`Add ${race.raceName} weekend to your calendar`}
          >
            <FaRegCalendarPlus aria-hidden="true" /> Add to calendar
          </button>
        )}
      </div>
    </li>
  );
}

// ---- Page -------------------------------------------------------------------

function Calendar() {
  const schedule = useQuery({ queryKey: ["schedule"], queryFn: fetchSchedule });
  const winners = useQuery({ queryKey: ["seasonWinners"], queryFn: fetchSeasonWinners });
  const [showPast, setShowPast] = useState(false);
  const nextRef = useRef(null);
  const now = new Date();

  const races = schedule.data ?? [];
  const year = races[0]?.season ?? new Date().getFullYear();
  useDocumentTitle(`${year} calendar`);

  // A race is "past" once it has a winner or started over 3 hours ago.
  const isPast = (r) =>
    Boolean(winners.data?.[r.round]) || raceStart(r) < new Date(now.getTime() - 3 * 3600000);
  const past = races.filter(isPast);
  const upcoming = races.filter((r) => !isPast(r));
  const next = upcoming[0];

  // With past rounds collapsed the next race is already first; once they're
  // expanded this gets you back to it.
  const jumpToNext = () => {
    const el = nextRef.current;
    if (!el) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "center" });
    el.focus({ preventScroll: true });
  };

  const card = (race) => (
    <RaceCard
      key={race.round}
      race={race}
      now={now}
      winner={winners.data?.[race.round]}
      winnersLoading={winners.isPending}
      isNext={race.round === next?.round}
      isPast={isPast(race)}
      cardRef={race.round === next?.round ? nextRef : undefined}
    />
  );

  return (
    <main className="page calendar" id="main">
      <div className="page__head">
        <div>
          <span className="eyebrow">Season {year}</span>
          <h1 className="page__title">Race calendar</h1>
          <p className="page__sub">
            {races.length > 0 && (
              <>
                {races.length} rounds · {past.length} complete ·{" "}
              </>
            )}
            Times in your timezone ({localTimeZone()})
          </p>
        </div>
        {next && showPast && (
          <button type="button" className="btn" onClick={jumpToNext}>
            <FaArrowDown aria-hidden="true" /> Jump to next race
          </button>
        )}
      </div>

      {schedule.isPending ? (
        <ul className="cal-list" role="status" aria-label="Loading the calendar">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} aria-hidden="true">
              <Skeleton height={132} radius={24} />
            </li>
          ))}
        </ul>
      ) : schedule.isError ? (
        <section className="glass panel state-panel">
          <QueryError what="The calendar" error={schedule.error} onRetry={schedule.refetch} />
        </section>
      ) : races.length === 0 ? (
        <section className="glass panel state-panel">
          <State kind="empty" title="No calendar yet">
            The schedule for {year} hasn't been published.
          </State>
        </section>
      ) : (
        <>
          {past.length > 0 && (
            <button
              type="button"
              className="cal-toggle"
              aria-expanded={showPast}
              aria-controls="past-races"
              onClick={() => setShowPast((v) => !v)}
            >
              <FaChevronDown aria-hidden="true" className="cal-toggle__chev" />
              {showPast ? "Hide" : "Show"} {past.length} completed{" "}
              {past.length === 1 ? "round" : "rounds"}
            </button>
          )}

          {showPast && (
            <ul className="cal-list cal-list--past" id="past-races">
              {past.map(card)}
            </ul>
          )}

          {upcoming.length > 0 ? (
            <ul className="cal-list">{upcoming.map(card)}</ul>
          ) : (
            <section className="glass panel state-panel">
              <State kind="empty" icon={FaTrophy} title="That's a wrap">
                Every round of {year} has been run. See you next season.
              </State>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default Calendar;
