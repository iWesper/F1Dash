import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { FaStar, FaRegStar } from "react-icons/fa";
import { fetchConstructorStandings, fetchDriverStandings } from "../api/f1";
import { Flag, nationalityToCode } from "../utils/flags";
import { useAuth } from "./AuthProvider";
import { useFavorites } from "../hooks/useFavorites";
import { QueryError, SkeletonRows, State } from "./State";

const Pos = ({ pos }) => <span className={`pos ${pos <= 3 ? `pos--${pos}` : ""}`}>{pos}</span>;

function DriversTable({ rows, setAlert }) {
  const { user, enabled } = useAuth();
  const favorites = useFavorites({ setAlert });
  const navigate = useNavigate();
  const leaderPts = Number(rows[0]?.points ?? 0);

  const onStar = (driver) => {
    const name = `${driver.givenName} ${driver.familyName}`;
    if (!user) {
      setAlert({ visible: true, message: "Sign in to save favorite drivers", color: "info" });
      navigate("/login", { state: { from: "/" } });
      return;
    }
    favorites.toggle(driver.driverId, name);
  };

  return (
    <table className="dtable">
      <caption className="visually-hidden">Driver championship standings</caption>
      <thead>
        <tr>
          {enabled && (
            <th scope="col">
              <span className="visually-hidden">Favorite</span>
            </th>
          )}
          <th scope="col">Pos</th>
          <th scope="col">Driver</th>
          <th scope="col" className="hide-sm">Team</th>
          <th scope="col" className="num">Pts</th>
          <th scope="col" className="num hide-sm">Gap</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const d = row.Driver;
          const name = `${d.givenName} ${d.familyName}`;
          const isFav = favorites.isFavorite(d.driverId);
          const pos = Number(row.position ?? row.positionText) || 0;
          const gap = leaderPts - Number(row.points);
          return (
            <tr key={d.driverId} className={pos === 1 ? "is-leader" : ""}>
              {enabled && (
                <td className="cell-star">
                  <button
                    type="button"
                    className={`star-btn ${isFav ? "star-btn--on" : ""}`}
                    aria-pressed={isFav}
                    aria-label={`Favorite ${name}`}
                    onClick={() => onStar(d)}
                  >
                    {isFav ? <FaStar aria-hidden="true" /> : <FaRegStar aria-hidden="true" />}
                  </button>
                </td>
              )}
              <td>
                <Pos pos={pos || row.positionText} />
              </td>
              <th scope="row" className="strong">
                <span className="cell-inline">
                  <Flag code={nationalityToCode[d.nationality]} name={d.nationality} />
                  <Link className="driver-link" to={`/driver/${d.driverId}`}>
                    <span className="hide-sm">{d.givenName} </span>
                    <span className="show-sm">{d.givenName.charAt(0)}. </span>
                    {d.familyName}
                  </Link>
                </span>
              </th>
              <td className="hide-sm">{row.Constructors?.[0]?.name}</td>
              <td className="num">{row.points}</td>
              <td className="num num--dim hide-sm">{gap > 0 ? `−${gap}` : "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function TeamsTable({ rows }) {
  return (
    <table className="dtable">
      <caption className="visually-hidden">Constructor championship standings</caption>
      <thead>
        <tr>
          <th scope="col">Pos</th>
          <th scope="col">Team</th>
          <th scope="col" className="num">Wins</th>
          <th scope="col" className="num">Pts</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((team) => {
          const pos = Number(team.position) || 0;
          return (
            <tr key={team.Constructor.constructorId} className={pos === 1 ? "is-leader" : ""}>
              <td>
                <Pos pos={pos || team.positionText} />
              </td>
              <th scope="row" className="strong">
                <span className="cell-inline">
                  <Flag
                    code={nationalityToCode[team.Constructor.nationality]}
                    name={team.Constructor.nationality}
                  />
                  {team.Constructor.name}
                </span>
              </th>
              <td className="num">{team.wins}</td>
              <td className="num">{team.points}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const StandingsBox = ({ setAlert }) => {
  const [tab, setTab] = useState("drivers");
  const drivers = useQuery({ queryKey: ["standings", "drivers"], queryFn: fetchDriverStandings });
  // Only fetch teams once that tab is opened — saves a request on every visit.
  const teams = useQuery({
    queryKey: ["standings", "teams"],
    queryFn: fetchConstructorStandings,
    enabled: tab === "teams",
  });

  const active = tab === "drivers" ? drivers : teams;
  const meta = drivers.data ?? teams.data;

  const tabs = [
    ["drivers", "Drivers"],
    ["teams", "Teams"],
  ];

  return (
    <section className="glass panel" aria-labelledby="standings-title">
      <div className="panel__head">
        <div>
          <span className="eyebrow">
            Championship {meta?.season ?? ""}
            {meta?.round ? ` · after round ${meta.round}` : ""}
          </span>
          <h2 className="panel__title" id="standings-title">
            Standings
          </h2>
        </div>
        <div className="seg" role="tablist" aria-label="Standings type">
          {tabs.map(([id, label]) => (
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
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                  const next = tab === "drivers" ? "teams" : "drivers";
                  setTab(next);
                  document.getElementById(`tab-${next}`)?.focus();
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="panel__scroll"
        id="standings-panel"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        tabIndex={0}
      >
        {active.isPending ? (
          <SkeletonRows rows={10} label="Loading standings" />
        ) : active.isError ? (
          <QueryError what="Standings" error={active.error} onRetry={active.refetch} />
        ) : active.data.rows.length === 0 ? (
          <State kind="empty" title="No standings yet">
            The championship table appears after the first race of the season.
          </State>
        ) : tab === "drivers" ? (
          <DriversTable rows={active.data.rows} setAlert={setAlert} />
        ) : (
          <TeamsTable rows={active.data.rows} />
        )}
      </div>
    </section>
  );
};

export default StandingsBox;
