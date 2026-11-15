import { useQueries, useQuery } from "@tanstack/react-query";
import { FaFlagCheckered, FaCheck, FaRoute } from "react-icons/fa6";
import { fetchCircuitWinners, fetchNextRace } from "../api/f1";
import { fetchWeather, weatherEnabled } from "../api/media";
import { findCircuit, circuitLengthKm, loadCircuits } from "../utils/circuits";
import {
  countdownParts,
  fmtDate,
  fmtDay,
  fmtTime,
  getSessions,
  localTimeZone,
  raceStart,
  relativeTime,
  sessionStatus,
  shortName,
  splitRaceName,
  ymd,
} from "../utils/race";
import { Flag, countryToCode } from "../utils/flags";
import { useNow } from "../hooks/useNow";
import CircuitTrack from "./CircuitTrack";
import { QueryError, Skeleton, State } from "./State";

const FORECAST_WINDOW_DAYS = 14;
const HISTORY_YEARS = 4;

// ---- Countdown + weekend schedule ------------------------------------------

function Countdown({ race, now }) {
  const start = raceStart(race);
  const sessions = getSessions(race);
  const raceSession = sessions.find((s) => s.isRace);
  const status = sessionStatus(raceSession, now);
  const parts = countdownParts(start - now);

  return (
    <div className="countdown-block">
      <span className="stat__label">
        {status === "upcoming" ? "Lights out in" : status === "live" ? "Right now" : "Race"}
      </span>

      {status === "upcoming" ? (
        <div
          className="countdown"
          role="timer"
          aria-label={`Race starts ${fmtDate(start)} at ${fmtTime(start)}`}
        >
          {[
            ["days", "Days"],
            ["hours", "Hrs"],
            ["minutes", "Min"],
            ["seconds", "Sec"],
          ].map(([k, label]) => (
            <div className="countdown__seg" key={k} aria-hidden="true">
              <div className="countdown__num">{String(parts[k]).padStart(2, "0")}</div>
              <span className="countdown__unit">{label}</span>
            </div>
          ))}
        </div>
      ) : status === "live" ? (
        <div className="countdown--live">
          <span className="live-dot" aria-hidden="true" />
          Race in progress
        </div>
      ) : (
        <div className="countdown--done">
          <FaFlagCheckered className="ico" aria-hidden="true" />
          Chequered flag — results land shortly
        </div>
      )}

      <p className="countdown__when">
        {fmtDate(start)} · {fmtTime(start)}
        <span className="text-faint"> ({localTimeZone()})</span>
      </p>
    </div>
  );
}

function WeekendSchedule({ race, now }) {
  const sessions = getSessions(race);
  const nextKey = sessions.find((s) => sessionStatus(s, now) !== "done")?.key;

  return (
    <div>
      <span className="stat__label">Weekend schedule</span>
      <ol className="sessions">
        {sessions.map((s) => {
          const status = sessionStatus(s, now);
          return (
            <li
              key={s.key}
              className={`sessions__item sessions__item--${status} ${
                s.key === nextKey ? "is-next" : ""
              }`}
            >
              <span className="sessions__dot" aria-hidden="true">
                {status === "done" && <FaCheck />}
              </span>
              <span className="sessions__label">
                {s.label}
                {status === "live" && <span className="badge badge--live">Live</span>}
                {s.key === nextKey && status === "upcoming" && (
                  <span className="visually-hidden"> (next session)</span>
                )}
              </span>
              <span className="sessions__time">
                {fmtDay(s.start)} · {s.hasTime ? fmtTime(s.start) : "TBC"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---- Track map --------------------------------------------------------------

function TrackMap({ race }) {
  const circuits = useQuery({
    queryKey: ["circuits"],
    queryFn: loadCircuits,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const feature = findCircuit(circuits.data, race.Circuit);
  const length = circuitLengthKm(feature);

  return (
    <figure className="trackmap">
      {circuits.isPending ? (
        <Skeleton className="trackmap__skeleton" height="100%" radius={16} />
      ) : circuits.isError ? (
        <QueryError what="Track map" error={circuits.error} onRetry={circuits.refetch} compact />
      ) : feature ? (
        <CircuitTrack feature={feature} label={`Track layout of ${race.Circuit.circuitName}`} />
      ) : (
        <State kind="empty" icon={FaRoute} title="Layout coming soon" compact>
          We don't have a track map for {race.Circuit.circuitName} yet.
        </State>
      )}
      <figcaption className="trackmap__caption">
        <span>{race.Circuit.circuitName}</span>
        {feature && (
          <span className="trackmap__facts">
            {length && <span>{length} km</span>}
            {feature.properties.firstgp && <span>First GP {feature.properties.firstgp}</span>}
          </span>
        )}
      </figcaption>
    </figure>
  );
}

// ---- Weather + past winners -------------------------------------------------

const RainCell = ({ w }) => {
  if (!w) return <span className="text-faint">—</span>;
  if (w.rainChance !== null) {
    const wet = w.rainChance >= 40;
    return <span className={`pill ${wet ? "pill--wet" : ""}`}>{w.rainChance}%</span>;
  }
  return w.rainMm < 0.2 ? (
    <span className="pill pill--none">Dry</span>
  ) : (
    <span className="pill pill--wet">{w.rainMm.toFixed(1)} mm</span>
  );
};

function WeatherHistory({ race, isNext, now }) {
  const lat = race.Circuit.Location.lat;
  const lng = race.Circuit.Location.long;
  const start = raceStart(race);
  const daysOut = (start - now) / 86400000;
  const forecastOpen = isNext && daysOut <= FORECAST_WINDOW_DAYS && daysOut > -1;

  const winners = useQuery({
    queryKey: ["circuitWinners", race.Circuit.circuitId],
    queryFn: ({ signal }) => fetchCircuitWinners(race.Circuit.circuitId, HISTORY_YEARS + 1, { signal }),
    staleTime: 60 * 60 * 1000,
  });

  // Previous editions only — drop this season's race if it's already run.
  const history = (winners.data ?? [])
    .filter((w) => w.season !== race.season)
    .slice(0, HISTORY_YEARS);

  const forecast = useQuery({
    queryKey: ["weather", lat, lng, race.date, "forecast"],
    queryFn: ({ signal }) => fetchWeather({ lat, lng, date: race.date }, { signal }),
    enabled: weatherEnabled && forecastOpen,
    staleTime: 60 * 60 * 1000,
  });

  const past = useQueries({
    queries: history.map((h) => ({
      queryKey: ["weather", lat, lng, h.date, "past"],
      queryFn: ({ signal }) => fetchWeather({ lat, lng, date: ymd(h.date), past: true }, { signal }),
      enabled: weatherEnabled,
      staleTime: Infinity,
    })),
  });

  if (winners.isPending) {
    return (
      <div className="skeleton-rows" role="status">
        <span className="visually-hidden">Loading past results</span>
        {Array.from({ length: HISTORY_YEARS + 1 }, (_, i) => (
          <Skeleton key={i} height={34} />
        ))}
      </div>
    );
  }
  if (winners.isError) {
    return <QueryError what="Past results" error={winners.error} onRetry={winners.refetch} compact />;
  }

  const cell = (q, render) =>
    !weatherEnabled ? null : q?.isPending && q.fetchStatus !== "idle" ? (
      <Skeleton width={42} />
    ) : q?.data ? (
      render(q.data)
    ) : (
      <span className="text-faint">—</span>
    );

  const forecastNote = !weatherEnabled
    ? "Weather isn't configured on this deployment, so only past winners are shown."
    : !isNext
      ? null
      : !forecastOpen
        ? `The race-day forecast opens about ${FORECAST_WINDOW_DAYS} days out (${relativeTime(
            new Date(start.getTime() - FORECAST_WINDOW_DAYS * 86400000),
            now
          )}).`
        : forecast.isError
          ? "The forecast didn't load. Past conditions are shown below."
          : null;

  return (
    <>
      <div className="dtable-wrap">
        <table className="dtable dtable--compact">
          <caption className="visually-hidden">
            Race-day weather and past winners at {race.Circuit.circuitName}
          </caption>
          <thead>
            <tr>
              <th scope="col">Year</th>
              <th scope="col">Winner</th>
              {weatherEnabled && (
                <>
                  <th scope="col" className="num">Temp</th>
                  <th scope="col" className="num hide-sm">Wind</th>
                  <th scope="col">Rain</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {isNext && forecastOpen && weatherEnabled && (
              <tr className="is-highlight">
                <th scope="row">{race.season}</th>
                <td className="text-faint">Forecast</td>
                <td className="num">{cell(forecast, (w) => `${w.tempC.toFixed(0)}°C`)}</td>
                <td className="num hide-sm">{cell(forecast, (w) => `${w.windKmph.toFixed(0)} km/h`)}</td>
                <td>{cell(forecast, (w) => <RainCell w={w} />)}</td>
              </tr>
            )}
            {history.map((h, i) => (
              <tr key={h.season}>
                <th scope="row">{h.season}</th>
                <td>{shortName(h.driver)}</td>
                {weatherEnabled && (
                  <>
                    <td className="num">{cell(past[i], (w) => `${w.tempC.toFixed(0)}°C`)}</td>
                    <td className="num hide-sm">{cell(past[i], (w) => `${w.windKmph.toFixed(0)} km/h`)}</td>
                    <td>{cell(past[i], (w) => <RainCell w={w} />)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {history.length === 0 && (
        <p className="panel__note">First time racing here — no past results yet.</p>
      )}
      {forecastNote && <p className="panel__note">{forecastNote}</p>}
    </>
  );
}

// ---- Panel ------------------------------------------------------------------

function NextRaceSkeleton() {
  return (
    <section className="glass panel" aria-busy="true">
      <span className="visually-hidden" role="status">
        Loading the next race
      </span>
      <div className="panel__head">
        <div style={{ width: "100%" }}>
          <Skeleton width={120} height={12} />
          <Skeleton width="min(520px, 80%)" height={38} style={{ marginTop: 10 }} />
          <Skeleton width={260} height={14} style={{ marginTop: 10 }} />
        </div>
      </div>
      <div className="nextrace__grid">
        <Skeleton height={260} radius={18} />
        <Skeleton height={260} radius={18} />
        <Skeleton height={260} radius={18} />
      </div>
    </section>
  );
}

const NextRaceBox = () => {
  const now = useNow(1000);
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["nextRace"],
    queryFn: fetchNextRace,
  });

  if (isPending) return <NextRaceSkeleton />;
  if (isError) {
    return (
      <section className="glass panel">
        <QueryError what="The next race" error={error} onRetry={refetch} />
      </section>
    );
  }

  const { race, isNext } = data;
  const [accent, rest] = splitRaceName(race.raceName);
  const { Location } = race.Circuit;

  return (
    <section className="glass panel" aria-labelledby="nextrace-title">
      <div className="panel__head">
        <div>
          <span className="eyebrow">
            {isNext ? `Round ${race.round} · Next race` : `Season complete · Final round`}
          </span>
          <h1 className="nextrace__title" id="nextrace-title">
            <em>{accent}</em>
            {rest}
          </h1>
          <p className="nextrace__sub">
            <Flag code={countryToCode[Location.country]} name={Location.country} />
            {Location.locality}, {Location.country}
          </p>
        </div>
      </div>

      <div className="nextrace__grid">
        <div className="stat-stack">
          <Countdown race={race} now={now} />
          <WeekendSchedule race={race} now={now} />
        </div>

        <div className="nextrace__map-col">
          <TrackMap race={race} />
        </div>

        <div className="nextrace__weather-col">
          <span className="stat__label">
            {weatherEnabled ? "Weather & past winners" : "Past winners"}
          </span>
          <WeatherHistory race={race} isNext={isNext} now={now} />
        </div>
      </div>
    </section>
  );
};

export default NextRaceBox;
