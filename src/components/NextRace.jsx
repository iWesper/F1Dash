import { useQuery } from "@tanstack/react-query";
import { FaCheck } from "react-icons/fa6";
import { fetchCircuitWinners } from "../api/f1";
import { fetchHourlyForecast } from "../api/media";
import { findCircuit, circuitLengthKm, loadCircuits } from "../utils/circuits";
import {
  countdownParts,
  getSessions,
  hourIn,
  raceStart,
  relativeTime,
  sessionStatus,
  splitRaceName,
  ymdIn,
} from "../utils/race";
import { Flag, countryToCode } from "../utils/flags";
import { CIRCUIT_TZ } from "../data/timezones";
import { useNow } from "../hooks/useNow";
import { TimeToggle, useRaceTime } from "./Prefs";
import RaceMap from "./RaceMap";
import { QueryError, Skeleton, State } from "./State";

const FORECAST_WINDOW_DAYS = 14;

// ---- Race hero: name, countdown, weekend schedule ---------------------------

/** Race name set in the display style: heavy italic caps, "GP" de-emphasised. */
export function RaceName({ race, as: Tag = "h1", id }) {
  const [place, rest] = splitRaceName(race.raceName);
  return (
    <Tag className="racename" id={id}>
      {place}
      {rest && <span className="racename__gp">{rest}</span>}
    </Tag>
  );
}

function Countdown({ target, label, now }) {
  const parts = countdownParts(target - now);
  // Digits swap instantly: this changes every second, so any roll or fade
  // would never come to rest.
  return (
    <div className="countdown" role="timer" aria-label={`${label} ${relativeTime(target, now)}`}>
      <span className="countdown__label">{label}</span>
      <span className="countdown__digits mono" aria-hidden="true">
        {[
          [parts.days, "d"],
          [parts.hours, "h"],
          [parts.minutes, "m"],
          [parts.seconds, "s"],
        ].map(([value, unit]) => (
          <span key={unit}>
            {String(value).padStart(2, "0")}
            <i>{unit}</i>
          </span>
        ))}
      </span>
    </div>
  );
}

/**
 * `phase` changes the emphasis: during a race weekend the countdown targets
 * the next session; otherwise it targets lights out.
 */
export function RaceHero({ race, phase, compact = false }) {
  const now = useNow(1000);
  const t = useRaceTime(race.Circuit.circuitId);
  const sessions = getSessions(race);
  const raceSession = sessions[sessions.length - 1];
  const upcoming = sessions.find((s) => sessionStatus(s, now) === "upcoming");
  const live = sessions.find((s) => sessionStatus(s, now) === "live");
  const { Location } = race.Circuit;

  const target = phase === "weekend" && upcoming ? upcoming : raceSession;
  const raceOver = sessionStatus(raceSession, now) === "done";

  return (
    <section className={`panel panel--lead hero ${compact ? "hero--compact" : ""}`} aria-labelledby="hero-title">
      <p className="hero__kicker mono">
        Round {race.round}
        <span aria-hidden="true"> · </span>
        <Flag code={countryToCode[Location.country]} name="" />
        {Location.locality}, {Location.country}
      </p>
      <RaceName race={race} id="hero-title" as={compact ? "h2" : "h1"} />

      {live ? (
        <p className="hero__live">
          <span className="live-dot" aria-hidden="true" />
          {live.label} is on track now
        </p>
      ) : raceOver ? (
        <p className="hero__live hero__live--done">Chequered flag. Results land shortly.</p>
      ) : (
        <Countdown
          target={target.start}
          label={target.isRace ? "Lights out in" : `${target.label} starts in`}
          now={now}
        />
      )}

      {!compact && (
        <div className="hero__schedule">
          <div className="hero__schedule-head">
            <h2 className="label">Weekend schedule</h2>
            <TimeToggle circuitId={race.Circuit.circuitId} />
          </div>
          <ol className="sessions">
            {sessions.map((s) => {
              const status = sessionStatus(s, now);
              const isNext = s.key === upcoming?.key;
              return (
                <li key={s.key} className={`sessions__item sessions__item--${status} ${isNext ? "is-next" : ""}`}>
                  <span className="sessions__mark" aria-hidden="true">
                    {status === "done" && <FaCheck />}
                  </span>
                  <span className="sessions__label">
                    {s.label}
                    {status === "live" && <span className="tag tag--now">Live</span>}
                    {status === "done" && <span className="visually-hidden"> (finished)</span>}
                    {isNext && <span className="visually-hidden"> (next)</span>}
                  </span>
                  <span className="sessions__time mono">
                    {t.day(s.start)} <b>{s.hasTime ? t.time(s.start) : "TBC"}</b>
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="hint">
            {t.mode === "track" ? "Times at the track." : `Times in your timezone (${t.zoneLabel}).`}
          </p>
        </div>
      )}
      {compact && (
        <p className="hint">
          {t.date(raceSession.start)} at {t.time(raceSession.start)}{" "}
          {t.mode === "track" ? "at the track" : "your time"}
        </p>
      )}
    </section>
  );
}

// ---- Circuit: live map, facts, past winners ---------------------------------

export function CircuitPanel({ race }) {
  const circuits = useQuery({
    queryKey: ["circuits"],
    queryFn: loadCircuits,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const winners = useQuery({
    queryKey: ["circuitWinners", race.Circuit.circuitId],
    queryFn: ({ signal }) => fetchCircuitWinners(race.Circuit.circuitId, 5, { signal }),
    staleTime: 60 * 60 * 1000,
  });
  const feature = findCircuit(circuits.data, race.Circuit);
  const length = circuitLengthKm(feature);
  const history = (winners.data ?? []).filter((w) => w.season !== race.season).slice(0, 4);

  return (
    <section className="panel panel--flush circuit" aria-labelledby="circuit-title">
      <div className="circuit__map">
        {circuits.isPending ? (
          <Skeleton height="100%" radius={0} />
        ) : (
          // Without the layout file the map still loads and marks the venue.
          <RaceMap circuit={race.Circuit} feature={feature} />
        )}
      </div>
      <div className="circuit__body">
        <h2 className="panel__title" id="circuit-title">
          {race.Circuit.circuitName}
        </h2>
        <dl className="circuit__facts mono">
          {length && (
            <div>
              <dt>Length</dt>
              <dd>{length} km</dd>
            </div>
          )}
          {feature?.properties.firstgp && (
            <div>
              <dt>First GP</dt>
              <dd>{feature.properties.firstgp}</dd>
            </div>
          )}
          {!feature && !circuits.isPending && (
            <div>
              <dt>Layout</dt>
              <dd>Not in our data yet</dd>
            </div>
          )}
        </dl>
        {winners.isPending ? (
          <Skeleton height={16} width="80%" />
        ) : history.length > 0 ? (
          <p className="circuit__winners">
            <span className="label">Past winners</span>
            {history.map((h) => (
              <span key={h.season}>
                <span className="mono">{h.season}</span> {h.driver.familyName}
              </span>
            ))}
          </p>
        ) : winners.isError ? null : (
          <p className="hint">First race at this circuit.</p>
        )}
      </div>
    </section>
  );
}

// ---- Race-day weather, hour by hour -----------------------------------------

/** Blue that deepens with the chance of rain; flat grey when dry. */
const rainFill = (chance) =>
  chance < 15 ? "var(--surface-3)" : `color-mix(in oklab, var(--rain) ${Math.min(100, 25 + chance)}%, var(--surface-3))`;

export function WeatherStrip({ race, now }) {
  const { lat, long: lng } = race.Circuit.Location;
  const zone = CIRCUIT_TZ[race.Circuit.circuitId];
  const start = raceStart(race);
  const daysOut = (start - now) / 86400000;
  const open = daysOut <= FORECAST_WINDOW_DAYS && daysOut > -0.5;
  // The API wants the date at the circuit, which can differ from the UTC date.
  const date = zone ? ymdIn(start, zone) : race.date;

  const forecast = useQuery({
    queryKey: ["forecast", lat, lng, date],
    queryFn: ({ signal }) => fetchHourlyForecast({ lat, lng, date }, { signal }),
    enabled: open,
    staleTime: 60 * 60 * 1000,
  });

  let body;
  if (!open) {
    body = (
      <State kind="empty" title="Forecast not open yet" compact>
        Race-day weather appears about {FORECAST_WINDOW_DAYS} days out,{" "}
        {relativeTime(new Date(start.getTime() - FORECAST_WINDOW_DAYS * 86400000), now)}.
      </State>
    );
  } else if (forecast.isPending) {
    body = (
      <div role="status">
        <span className="visually-hidden">Loading the forecast</span>
        <Skeleton height={112} />
      </div>
    );
  } else if (forecast.isError) {
    body = <QueryError what="Forecast" error={forecast.error} onRetry={forecast.refetch} compact />;
  } else {
    // Six hours around lights out, in the circuit's own time. Without a
    // known timezone we can't place the race, so show the afternoon.
    const raceHour = zone ? hourIn(start, zone) : null;
    const first = Math.max(0, Math.min(18, (raceHour ?? 14) - 2));
    const hours = forecast.data.filter((h) => h.hour >= first && h.hour < first + 6);
    const inRace = (h) => raceHour !== null && (h.hour === raceHour || h.hour === raceHour + 1);
    const raceHours = hours.filter(inRace);
    const peak = Math.max(...(raceHours.length ? raceHours : hours).map((h) => h.rainChance));

    body = (
      <>
        <p className="weather__summary">
          {peak >= 50 ? "Rain likely" : peak >= 20 ? "Some risk of rain" : "Looks dry"} for the
          race: up to <strong className="mono">{peak}%</strong> chance.
        </p>
        <ol className="weather__hours">
          {hours.map((h) => (
            <li key={h.hour} className={inRace(h) ? "is-race" : ""}>
              <span className="mono weather__time">{String(h.hour).padStart(2, "0")}:00</span>
              <span className="weather__bar" style={{ background: rainFill(h.rainChance) }}>
                <span className="mono">{h.rainChance}%</span>
              </span>
              <span className="mono weather__temp">{Math.round(h.tempC)}°</span>
              <span className="mono weather__wind">{Math.round(h.windKmph)}</span>
              {inRace(h) && <span className="visually-hidden">(during the race)</span>}
            </li>
          ))}
        </ol>
        <p className="hint">
          Track time{raceHour !== null ? ", race window outlined" : ""}. Bars: chance of rain.
          Below: °C and wind in km/h.
        </p>
      </>
    );
  }

  return (
    <section className="panel weather" aria-labelledby="weather-title">
      <header className="panel__head">
        <h2 className="panel__title" id="weather-title">
          Race-day weather
        </h2>
      </header>
      {body}
    </section>
  );
}
