import { useState } from "react";
import { Link, useNavigate, useViewTransitionState } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { FaStar, FaRegStar } from "react-icons/fa";
import {
  fetchConstructorStandings,
  fetchDriverStandings,
  fetchStandingsAfter,
} from "../api/f1";
import { teamColour } from "../data/teams";
import { DUR, EASE_OUT, SPRING, fadeIn } from "../motion";
import { useAuth } from "./AuthProvider";
import { useFavorites } from "../hooks/useFavorites";
import { QueryError, SkeletonRows, State } from "./State";
import TitleFight from "./TitleFight";

// Rows shown before "Show all". Ten is the points-paying positions, and
// keeps the panel about as tall as the rail beside it.
const TOP_ROWS = 10;

const TABS = [
  ["drivers", "Drivers"],
  ["teams", "Teams"],
  ["fight", "Title fight"],
];

/** Places gained (▲) or lost (▼) since the previous round. */
function Delta({ now, before }) {
  if (!before) return <span className="tower__delta" />;
  const d = before - now;
  if (d === 0)
    return (
      <span className="tower__delta eq">
        <span aria-hidden="true">–</span>
        <span className="visually-hidden">no change</span>
      </span>
    );
  return (
    <span className={`tower__delta mono ${d > 0 ? "up" : "dn"}`}>
      <span aria-hidden="true">{d > 0 ? "▲" : "▼"}</span>
      {Math.abs(d)}
      <span className="visually-hidden">{d > 0 ? " places gained" : " places lost"}</span>
    </span>
  );
}

function DriverRow({ row, leaderPts, before, favorites, onStar, showStar }) {
  const d = row.Driver;
  const to = `/driver/${d.driverId}`;
  // True while navigating to this driver's page: the name then carries a
  // view-transition-name, so the browser morphs it into the page title.
  const travelling = useViewTransitionState(to);
  const name = `${d.givenName} ${d.familyName}`;
  const pos = Number(row.position) || 0;
  const gap = leaderPts - Number(row.points);
  const isFav = favorites.isFavorite(d.driverId);
  const team = row.Constructors?.[row.Constructors.length - 1];

  return (
    <m.li layout transition={SPRING} className="tower__row" style={{ "--team": teamColour(team?.constructorId) }}>
      <span className="tower__pos mono">{pos || row.positionText}</span>
      <span className="tower__bar" aria-hidden="true" />
      <span className="tower__name">
        <Link
          to={to}
          viewTransition
          className="driver-link"
          style={travelling ? { viewTransitionName: "driver-name" } : undefined}
        >
          <span className="hide-sm">{d.givenName} </span>
          {d.familyName}
        </Link>
        <span className="tower__team hide-sm">{team?.name}</span>
      </span>
      <span className="tower__pts mono">{row.points}</span>
      <span className="tower__gap mono hide-sm">{gap > 0 ? `−${gap}` : "Leader"}</span>
      <Delta now={pos} before={before} />
      {showStar && (
        <m.button
          type="button"
          whileTap={{ scale: 0.85 }}
          className={`star-btn ${isFav ? "star-btn--on" : ""}`}
          aria-pressed={isFav}
          aria-label={`Favorite ${name}`}
          onClick={() => onStar(d, name)}
        >
          {isFav ? <FaStar aria-hidden="true" /> : <FaRegStar aria-hidden="true" />}
        </m.button>
      )}
    </m.li>
  );
}

function DriversTower({ data, setAlert }) {
  const { user, enabled } = useAuth();
  const favorites = useFavorites({ setAlert });
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const round = Number(data.round);

  // One extra request: positions after the previous round, for the ▲▼ column.
  const previous = useQuery({
    queryKey: ["standingsAfter", round - 1],
    queryFn: ({ signal }) => fetchStandingsAfter(round - 1, { signal }),
    enabled: round > 1,
    staleTime: Infinity,
  });

  const onStar = (driver, name) => {
    if (!user) {
      setAlert({ visible: true, message: "Sign in to save favorite drivers", color: "info" });
      navigate("/login", { state: { from: "/" }, viewTransition: true });
      return;
    }
    favorites.toggle(driver.driverId, name);
  };

  const towerClass = `tower ${enabled ? "tower--stars" : ""}`;
  const rest = data.rows.slice(TOP_ROWS);
  const renderRow = (row) => (
    <DriverRow
      key={row.Driver.driverId}
      row={row}
      leaderPts={Number(data.rows[0].points)}
      before={previous.data?.[row.Driver.driverId]}
      favorites={favorites}
      onStar={onStar}
      showStar={enabled}
    />
  );

  return (
    <>
      <div className="tower__head" aria-hidden="true">
        <span>Pos</span>
        <span />
        <span>Driver</span>
        <span>Pts</span>
        <span className="hide-sm">Gap</span>
        <span>+/−</span>
        {enabled && <span />}
      </div>
      <ol className={towerClass} aria-label="Driver standings">
        {data.rows.slice(0, TOP_ROWS).map(renderRow)}
      </ol>
      {rest.length > 0 && (
        <>
          {/* The rest opens by height so the page below is pushed, not jumped. */}
          <AnimatePresence initial={false}>
            {expanded && (
              <m.div
                className="tower__more"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0, transition: { duration: DUR.base, ease: EASE_OUT } }}
                transition={{ duration: DUR.slow, ease: EASE_OUT }}
              >
                <ol
                  id="standings-rest"
                  className={towerClass}
                  start={TOP_ROWS + 1}
                  aria-label="Driver standings, continued"
                >
                  {rest.map(renderRow)}
                </ol>
              </m.div>
            )}
          </AnimatePresence>
          <button
            type="button"
            className="tower__toggle"
            aria-expanded={expanded}
            aria-controls="standings-rest"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? `Show top ${TOP_ROWS} only` : `Show all ${data.rows.length} drivers`}
          </button>
        </>
      )}
    </>
  );
}

function TeamsTower({ data }) {
  const leaderPts = Number(data.rows[0].points);
  return (
    <>
      <div className="tower__head tower__head--teams" aria-hidden="true">
        <span>Pos</span>
        <span />
        <span>Team</span>
        <span>Pts</span>
        <span className="hide-sm">Gap</span>
        <span>Wins</span>
      </div>
      <ol className="tower tower--teams" aria-label="Constructor standings">
        {data.rows.map((team) => {
          const gap = leaderPts - Number(team.points);
          return (
            <li
              key={team.Constructor.constructorId}
              className="tower__row"
              style={{ "--team": teamColour(team.Constructor.constructorId) }}
            >
              <span className="tower__pos mono">{team.position ?? team.positionText}</span>
              <span className="tower__bar" aria-hidden="true" />
              <span className="tower__name">{team.Constructor.name}</span>
              <span className="tower__pts mono">{team.points}</span>
              <span className="tower__gap mono hide-sm">{gap > 0 ? `−${gap}` : "Leader"}</span>
              <span className="tower__delta mono">
                {team.wins}
                <span className="visually-hidden"> wins</span>
              </span>
            </li>
          );
        })}
      </ol>
    </>
  );
}

const StandingsBox = ({ setAlert }) => {
  const [tab, setTab] = useState("drivers");
  const drivers = useQuery({ queryKey: ["standings", "drivers"], queryFn: fetchDriverStandings });
  // Teams load only once that tab is opened — saves a request on every visit.
  const teams = useQuery({
    queryKey: ["standings", "teams"],
    queryFn: fetchConstructorStandings,
    enabled: tab === "teams",
  });
  const meta = drivers.data ?? teams.data;
  const active = tab === "teams" ? teams : drivers;

  const onKeyDown = (e) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    const i = TABS.findIndex(([id]) => id === tab);
    const next = TABS[(i + dir + TABS.length) % TABS.length][0];
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <section className="panel standings" aria-labelledby="standings-title">
      <header className="panel__head">
        <div>
          <h2 className="panel__title" id="standings-title">
            Championship
          </h2>
          {meta && (
            <p className="panel__meta">
              {meta.season} · after round {meta.round}
            </p>
          )}
        </div>
        <div className="seg" role="tablist" aria-label="Standings view">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={tab === id}
              aria-controls="standings-panel"
              tabIndex={tab === id ? 0 : -1}
              className={`seg__btn ${tab === id ? "is-active" : ""}`}
              onClick={() => setTab(id)}
              onKeyDown={onKeyDown}
            >
              {/* The pill slides between tabs; the content below swaps instantly. */}
              {tab === id && <m.span layoutId="standings-pill" className="seg__pill" transition={SPRING} />}
              <span className="seg__text">{label}</span>
            </button>
          ))}
        </div>
      </header>

      <div id="standings-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "fight" ? (
          <TitleFight />
        ) : active.isPending ? (
          <SkeletonRows rows={TOP_ROWS} label="Loading standings" />
        ) : active.isError ? (
          <QueryError what="Standings" error={active.error} onRetry={active.refetch} />
        ) : active.data.rows.length === 0 ? (
          <State kind="empty" title="No standings yet">
            The championship table appears after the first race of the season.
          </State>
        ) : (
          <m.div {...fadeIn}>
            {tab === "drivers" ? (
              <DriversTower data={active.data} setAlert={setAlert} />
            ) : (
              <TeamsTower data={active.data} />
            )}
          </m.div>
        )}
      </div>
    </section>
  );
};

export default StandingsBox;
