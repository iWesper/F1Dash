import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaArrowLeftLong, FaRegCalendarPlus } from "react-icons/fa6";
import FlagModule from "react-world-flags";
import { countryToCode } from "../utils/countries";

const Flag = FlagModule.default || FlagModule;

// Ergast/Jolpica session keys → human labels. Order doesn't matter: each
// session is sorted by its own date/time so sprint weekends render correctly.
const SESSION_LABELS = {
  FirstPractice: "FP1",
  SecondPractice: "FP2",
  ThirdPractice: "FP3",
  SprintQualifying: "Sprint Quali",
  SprintShootout: "Sprint Shootout",
  Sprint: "Sprint",
  Qualifying: "Qualifying",
};

// A session's date comes with a separate UTC time (trailing Z). Missing
// times default to midnight UTC so the date still sorts/renders.
const toDate = (date, time) => new Date(`${date}T${time || "00:00:00Z"}`);

const fmtDay = (dt) =>
  dt.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
const fmtTime = (dt) =>
  dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const getSessions = (race) => {
  const list = [];
  for (const key of Object.keys(SESSION_LABELS)) {
    if (race[key]?.date) {
      list.push({
        label: SESSION_LABELS[key],
        dt: toDate(race[key].date, race[key].time),
      });
    }
  }
  list.push({ label: "Race", dt: toDate(race.date, race.time), isRace: true });
  list.sort((a, b) => a.dt - b.dt);
  return list;
};

const pad = (n) => String(n).padStart(2, "0");
const icsStamp = (d) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}00Z`;

const downloadIcs = (race) => {
  const start = toDate(race.date, race.time);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//F1 Dash//Race Calendar//EN",
    "BEGIN:VEVENT",
    `UID:f1dash-${race.season}-${race.round}@f1dash`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${race.raceName}`,
    `LOCATION:${race.Circuit.circuitName}, ${race.Circuit.Location.country}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const url = URL.createObjectURL(
    new Blob([ics], { type: "text/calendar;charset=utf-8" })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${race.raceName.replace(/\s+/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

function Calendar() {
  const [races, setRaces] = useState([]);
  const [winners, setWinners] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    axios
      .get("https://api.jolpi.ca/ergast/f1/current.json")
      .then((res) => {
        setRaces(res.data.MRData.RaceTable.Races);
        setLoaded(true);
      })
      .catch((err) => {
        console.error("Schedule unavailable", err);
        setError(true);
        setLoaded(true);
      });

    // One call returns every completed round's winner (Results[0]).
    axios
      .get("https://api.jolpi.ca/ergast/f1/current/results/1.json")
      .then((res) => {
        const map = {};
        res.data.MRData.RaceTable.Races.forEach((race) => {
          map[race.round] = race.Results?.[0]?.Driver;
        });
        setWinners(map);
      })
      .catch((err) => console.error("Results unavailable", err));
  }, []);

  const year = races[0]?.season ?? new Date().getFullYear();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const nextRound = races.find((r) => toDate(r.date, r.time) >= now)?.round;

  return (
    <main className="page calendar">
      <div className="page__head">
        <div>
          <span className="eyebrow">Season {year}</span>
          <h1 className="page__title">Race calendar</h1>
          <p className="calendar__tz">All times shown in your timezone · {timeZone}</p>
        </div>
        <Link to="/" className="btn btn--ghost">
          <FaArrowLeftLong /> Dashboard
        </Link>
      </div>

      {!loaded ? (
        <section className="glass panel state-panel">
          <div className="state">
            <div className="spinner" />
            <p>Loading the calendar…</p>
          </div>
        </section>
      ) : error || races.length === 0 ? (
        <section className="glass panel state-panel">
          <div className="state">
            <h3>Calendar unavailable</h3>
            <p>The F1 schedule API isn't responding right now. Please try again later.</p>
          </div>
        </section>
      ) : (
        <div className="cal-list">
          {races.map((race) => {
            const raceDt = toDate(race.date, race.time);
            const isNext = race.round === nextRound;
            const isCompleted = !!winners[race.round] || raceDt < now;
            const winner = winners[race.round];

            return (
              <article
                key={race.round}
                className={`glass race-card ${isNext ? "race-card--next" : ""} ${
                  isCompleted ? "race-card--past" : ""
                }`}
              >
                <div className="race-card__round">
                  <span className="race-card__round-num">{race.round}</span>
                  <span className="race-card__round-word">Round</span>
                </div>

                <div className="race-card__body">
                  <div className="race-card__heading">
                    <Flag
                      code={countryToCode[race.Circuit.Location.country]}
                      className="flag"
                      fallback={null}
                    />
                    <h3 className="race-card__name">{race.raceName}</h3>
                    {isNext && <span className="badge badge--next">Next</span>}
                    {isCompleted && !isNext && (
                      <span className="badge">Completed</span>
                    )}
                  </div>
                  <p className="race-card__circuit">
                    {race.Circuit.circuitName} · {race.Circuit.Location.locality},{" "}
                    {race.Circuit.Location.country}
                  </p>

                  <div className="race-card__sessions">
                    {getSessions(race).map((s) => (
                      <div
                        className={`sess ${s.isRace ? "sess--race" : ""}`}
                        key={s.label}
                      >
                        <span className="sess__label">{s.label}</span>
                        <span className="sess__time">
                          {fmtDay(s.dt)} · {fmtTime(s.dt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="race-card__aside">
                  {isCompleted ? (
                    winner ? (
                      <div className="race-card__winner">
                        <span className="eyebrow">Winner</span>
                        <strong>
                          {winner.givenName.charAt(0)}. {winner.familyName}
                        </strong>
                      </div>
                    ) : (
                      <span className="text-dim">Result pending</span>
                    )
                  ) : (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => downloadIcs(race)}
                    >
                      <FaRegCalendarPlus /> Add to calendar
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default Calendar;
