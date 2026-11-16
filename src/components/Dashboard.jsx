import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchDriverStandings, fetchLastRace, fetchNextRace } from "../api/f1";
import { racePhase, raceStart } from "../utils/race";
import { useDocumentTitle, useNow } from "../hooks/useNow";
import ErrorBoundary from "./ErrorBoundary";
import LastRace from "./LastRace";
import { CircuitPanel, RaceHero, RaceName, WeatherStrip } from "./NextRace";
import Paddock from "./Paddock";
import SeasonStrip from "./SeasonStrip";
import StandingsBox from "./StandingsBox";
import { QueryError, Skeleton } from "./State";

const PHASES = ["buildup", "weekend", "result", "offseason"];

/** Off-season lead: who won, in place of a countdown to nothing. */
function SeasonReview({ race }) {
  const standings = useQuery({ queryKey: ["standings", "drivers"], queryFn: fetchDriverStandings });
  const champion = standings.data?.rows[0];
  return (
    <section className="panel panel--lead hero" aria-labelledby="hero-title">
      <p className="hero__kicker mono">{race.season} season complete</p>
      {champion ? (
        <>
          <h1 className="racename" id="hero-title">
            {champion.Driver.familyName}
            <span className="racename__gp"> is champion</span>
          </h1>
          <p className="hero__live hero__live--done">
            {champion.Driver.givenName} {champion.Driver.familyName} took the title with{" "}
            <strong className="mono">{champion.points}</strong> points and{" "}
            <strong className="mono">{champion.wins}</strong> wins for{" "}
            {champion.Constructors?.[champion.Constructors.length - 1]?.name}.
          </p>
        </>
      ) : (
        <RaceName race={race} id="hero-title" />
      )}
      <p className="hint">The new calendar appears here as soon as it's published.</p>
    </section>
  );
}

const Slot = ({ label, children, className = "" }) => (
  <div className={className}>
    <ErrorBoundary label={label}>{children}</ErrorBoundary>
  </div>
);

/**
 * The dashboard leads with whatever matters at this point in the race week:
 *
 *  buildup    next race countdown · map · weather     | standings · last race
 *  weekend    session countdown + schedule · map · weather | standings · last race
 *  result     race result · next race (compact) · map | standings · weather
 *  offseason  champion · last race · map              | standings
 *
 * Append ?phase=buildup|weekend|result|offseason to preview a phase.
 */
const Dashboard = ({ setAlert }) => {
  useDocumentTitle(null);
  // Minute precision is enough to pick the phase; the countdown ticks on its own.
  const now = useNow(60000);
  const [params] = useSearchParams();
  const next = useQuery({ queryKey: ["nextRace"], queryFn: fetchNextRace });
  const last = useQuery({ queryKey: ["lastRace"], queryFn: fetchLastRace });

  let top;
  let side = null;
  if (next.isPending) {
    top = (
      <>
        <span className="visually-hidden" role="status">
          Loading the next race
        </span>
        <Skeleton height={420} radius={6} />
        <Skeleton height={420} radius={6} />
        <Skeleton height={420} radius={6} />
      </>
    );
  } else if (next.isError) {
    top = (
      <section className="panel dash__full">
        <QueryError what="The next race" error={next.error} onRetry={next.refetch} />
      </section>
    );
  } else {
    const { race, isNext } = next.data;
    const forced = params.get("phase");
    const phase = PHASES.includes(forced)
      ? forced
      : racePhase({
          next: isNext ? race : null,
          lastStart: last.data ? raceStart(last.data.race) : null,
          now,
        });

    if (phase === "offseason") {
      top = (
        <>
          <Slot label="the season review"><SeasonReview race={race} /></Slot>
          <Slot label="the last race"><LastRace lead /></Slot>
          <Slot label="the map"><CircuitPanel race={race} /></Slot>
        </>
      );
    } else if (phase === "result") {
      top = (
        <>
          <Slot label="the race result"><LastRace lead /></Slot>
          <Slot label="the next race"><RaceHero race={race} phase={phase} compact /></Slot>
          <Slot label="the map"><CircuitPanel race={race} /></Slot>
        </>
      );
      side = <Slot label="the weather"><WeatherStrip race={race} now={now} /></Slot>;
    } else {
      top = (
        <>
          <Slot label="the next race"><RaceHero race={race} phase={phase} /></Slot>
          <Slot label="the map"><CircuitPanel race={race} /></Slot>
          <Slot label="the weather"><WeatherStrip race={race} now={now} /></Slot>
        </>
      );
      side = <Slot label="the last race"><LastRace /></Slot>;
    }
  }

  return (
    <main className="page dash" id="main">
      <ErrorBoundary label="the season strip">
        <SeasonStrip />
      </ErrorBoundary>
      <div className="dash__top">{top}</div>
      <div className={`dash__mid ${side ? "" : "dash__mid--solo"}`}>
        <Slot label="the standings"><StandingsBox setAlert={setAlert} /></Slot>
        {side}
      </div>
      <Slot label="the paddock feed"><Paddock /></Slot>
    </main>
  );
};

export default Dashboard;
