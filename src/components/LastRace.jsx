import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchLastRace } from "../api/f1";
import { teamColour } from "../data/teams";
import { QueryError, Skeleton } from "./State";

const Name = ({ result }) => (
  <Link className="driver-link" to={`/driver/${result.Driver.driverId}`} viewTransition>
    {result.Driver.givenName.charAt(0)}. {result.Driver.familyName}
  </Link>
);

/**
 * The most recent race in one card: podium, fastest lap, biggest climb.
 * `lead` renders the larger version used for the three days after a race.
 */
export default function LastRace({ lead = false }) {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["lastRace"],
    queryFn: fetchLastRace,
  });

  return (
    <section className={`panel ${lead ? "panel--lead" : ""}`} aria-labelledby="lastrace-title">
      <header className="panel__head">
        <div>
          <h2 className="panel__title" id="lastrace-title">
            {lead ? "Race result" : "Last race"}
          </h2>
          {data && (
            <p className="panel__meta">
              R{data.race.round} · {data.race.raceName}
            </p>
          )}
        </div>
      </header>

      {isPending ? (
        <div className="stack" role="status">
          <span className="visually-hidden">Loading the last race</span>
          <Skeleton height={lead ? 150 : 110} />
          <Skeleton height={18} width="70%" />
        </div>
      ) : isError ? (
        <QueryError what="The last race" error={error} onRetry={refetch} compact />
      ) : (
        <>
          <ol className={`podium ${lead ? "podium--lead" : ""}`}>
            {data.podium.map((r, i) => (
              <li
                key={r.Driver.driverId}
                className={`podium__step podium__step--${i + 1}`}
                style={{ "--team": teamColour(r.Constructor.constructorId) }}
              >
                <span className="podium__pos mono">P{r.position}</span>
                <span className="podium__name">
                  <Name result={r} />
                </span>
                <span className="podium__team">{r.Constructor.name}</span>
                <span className="podium__time mono">{r.Time?.time ?? r.status}</span>
              </li>
            ))}
          </ol>
          <dl className="facts">
            {data.fastest && (
              <div>
                <dt>
                  <span className="dot dot--purple" aria-hidden="true" />
                  Fastest lap
                </dt>
                <dd>
                  <Name result={data.fastest} />
                  <span className="mono"> {data.fastest.FastestLap.Time?.time}</span>
                </dd>
              </div>
            )}
            {data.climber && (
              <div>
                <dt>
                  <span className="dot dot--green" aria-hidden="true" />
                  Biggest climb
                </dt>
                <dd>
                  <Name result={data.climber.result} />
                  <span className="mono up">
                    {" "}
                    P{data.climber.result.grid} → P{data.climber.result.position}
                  </span>
                </dd>
              </div>
            )}
          </dl>
        </>
      )}
    </section>
  );
}
