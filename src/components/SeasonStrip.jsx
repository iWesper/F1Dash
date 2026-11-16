import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchSchedule, fetchSeasonWinners } from "../api/f1";
import { fmtDay, raceStart, shortName } from "../utils/race";
import { Skeleton } from "./State";

/**
 * The whole season as one row of rounds: done, next, to come. Hovering or
 * focusing a round shows its winner or date. Hover feedback is instant on
 * purpose — it's swept across constantly.
 */
export default function SeasonStrip() {
  const schedule = useQuery({ queryKey: ["schedule"], queryFn: fetchSchedule });
  const winners = useQuery({ queryKey: ["seasonWinners"], queryFn: fetchSeasonWinners });
  const [active, setActive] = useState(null);

  if (schedule.isPending) return <Skeleton height={64} radius={6} />;
  // The strip is a convenience; if the schedule fails the panels below say so.
  if (schedule.isError || schedule.data.length === 0) return null;

  const races = schedule.data;
  const now = new Date();
  const isDone = (r) => Boolean(winners.data?.[r.round]) || raceStart(r) < now - 3 * 3600000;
  const next = races.find((r) => !isDone(r));
  const shown = races.find((r) => r.round === active) ?? next ?? races[races.length - 1];
  const describe = (r) => {
    const w = winners.data?.[r.round];
    if (w) return `Won by ${shortName(w)}`;
    return isDone(r) ? "Result pending" : fmtDay(raceStart(r));
  };

  return (
    <nav className="strip" aria-label={`${races[0].season} season, ${races.length} rounds`}>
      <ol className="strip__rounds" onMouseLeave={() => setActive(null)}>
        {races.map((r) => {
          const state = r.round === next?.round ? "next" : isDone(r) ? "done" : "todo";
          return (
            <li key={r.round}>
              <Link
                to="/calendar"
                viewTransition
                className={`strip__round strip__round--${state} ${
                  r.round === shown.round ? "is-shown" : ""
                }`}
                aria-label={`Round ${r.round}, ${r.raceName}. ${describe(r)}.`}
                aria-current={state === "next" ? "step" : undefined}
                onMouseEnter={() => setActive(r.round)}
                onFocus={() => setActive(r.round)}
                onBlur={() => setActive(null)}
              >
                <span aria-hidden="true">{r.round}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="strip__detail" aria-hidden="true">
        <span className="mono">R{shown.round}</span>
        <strong>{shown.raceName}</strong>
        <span>{describe(shown)}</span>
        {shown.round === next?.round && <span className="tag tag--now">Next</span>}
      </p>
    </nav>
  );
}
