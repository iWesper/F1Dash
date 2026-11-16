import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { FaStar, FaRegStar, FaXmark } from "react-icons/fa6";
import { fetchDriver } from "../api/f1";
import { fetchWikiImage } from "../api/media";
import { Flag, nationalityToCode } from "../utils/flags";
import { QueryError, Skeleton, State } from "./State";
import { NotFoundError } from "../api/http";
import { teamColour } from "../data/teams";

// Jolpica positionText codes that mean the car didn't finish.
const NOT_CLASSIFIED = new Set(["R", "D", "E", "W", "F", "N"]);

const calculateStats = (races) => {
  const stats = { races: races.length, points: 0, poles: 0, wins: 0, podiums: 0, dnfs: 0 };
  races.forEach((race) => {
    const r = race.Results[0];
    stats.points += Number(r.points) || 0;
    const pos = Number(r.position);
    if (pos === 1) stats.wins++;
    if (pos <= 3) stats.podiums++;
    if (NOT_CLASSIFIED.has(r.positionText)) stats.dnfs++;
    // Grid P1 stands in for pole (true pole needs qualifying data).
    if (r.grid === "1") stats.poles++;
  });
  // Half-points races make float sums like 1234.5000001 possible.
  stats.points = Math.round(stats.points * 10) / 10;
  return stats;
};

const age = (dob) => {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
};

function Portrait({ driver }) {
  const photo = useQuery({
    queryKey: ["wikiImage", driver.url],
    queryFn: ({ signal }) => fetchWikiImage(driver.url, { signal }),
    enabled: Boolean(driver.url),
    staleTime: Infinity,
    retry: false,
  });
  const [broken, setBroken] = useState(false);
  const initials = `${driver.givenName[0]}${driver.familyName[0]}`;

  if (photo.isPending && photo.fetchStatus !== "idle") {
    return <Skeleton className="driver-card__photo" height="auto" radius={18} />;
  }
  if (photo.data && !broken) {
    return (
      <>
        <img
          className="driver-card__photo"
          src={photo.data}
          alt={`${driver.givenName} ${driver.familyName}`}
          onError={() => setBroken(true)}
        />
        <span className="driver-card__credit">Photo: Wikipedia</span>
      </>
    );
  }
  // No photo: a number/initials tile reads as intentional, not broken.
  return (
    <div className="driver-card__photo driver-card__photo--empty" aria-hidden="true">
      <span>{driver.permanentNumber ?? initials}</span>
      {driver.permanentNumber && <small>{initials}</small>}
    </div>
  );
}

export function DriverSkeleton() {
  return (
    <section className="panel driver-card" aria-busy="true">
      <span className="visually-hidden" role="status">
        Loading driver
      </span>
      <div className="driver-card__media">
        <Skeleton className="driver-card__photo" height="auto" radius={18} />
      </div>
      <div className="driver-card__main">
        <Skeleton width="50%" height={32} />
        <Skeleton width="30%" />
        <Skeleton height={220} radius={14} />
      </div>
    </section>
  );
}

/**
 * Driver profile card.
 *  headingLevel: 1 on the driver page (the name is the page title), 2 in lists
 *  favorite:     { isFavorite, onToggle } — shows a star toggle when given
 *  onRemove:     shows a remove button (favorites page)
 */
function Driver({ driverId, headingLevel = 2, favorite, onRemove, linkToProfile }) {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["driver", driverId],
    queryFn: ({ signal }) => fetchDriver(driverId, { signal }),
    staleTime: 60 * 60 * 1000,
  });

  const stats = useMemo(() => {
    if (!data || data.races.length === 0) return null;
    const latest = data.races.reduce(
      (max, r) => (Number(r.season) > Number(max) ? r.season : max),
      data.races[0].season
    );
    return {
      latest,
      season: calculateStats(data.races.filter((r) => r.season === latest)),
      career: calculateStats(data.races),
      team: data.races.at(-1)?.Results[0]?.Constructor?.name,
      seasons: new Set(data.races.map((r) => r.season)).size,
    };
  }, [data]);

  if (isPending) return <DriverSkeleton />;
  if (error instanceof NotFoundError) {
    return (
      <section className="panel state-panel">
        <State
          kind="empty"
          title="Driver not found"
          action={{ label: "Browse the standings", to: "/", primary: true }}
        >
          There's no driver with the id “{driverId}”. The link may be old or mistyped.
        </State>
      </section>
    );
  }
  if (isError) {
    return (
      <section className="panel state-panel">
        <QueryError what="Driver" error={error} onRetry={refetch} />
      </section>
    );
  }

  const { driver } = data;
  const name = `${driver.givenName} ${driver.familyName}`;
  const Heading = `h${headingLevel}`;
  const years = age(driver.dateOfBirth);

  const rows = stats && [
    ["Races", "races"],
    ["Points", "points"],
    ["Wins", "wins"],
    ["Podiums", "podiums"],
    ["Started on pole", "poles"],
    ["Did not finish", "dnfs"],
  ];

  return (
    <section
      className="panel driver-card"
      aria-label={name}
      style={{ "--team": teamColour(data.races.at(-1)?.Results[0]?.Constructor?.constructorId) }}
    >
      <div className="driver-card__media">
        <Portrait driver={driver} />
      </div>

      <div className="driver-card__main">
        <div className="driver-card__top">
          <div>
            {/* On the driver page the name is the landing spot for the name
                that travels from the standings row (view transition). */}
            <Heading
              className="driver-card__name"
              style={headingLevel === 1 ? { viewTransitionName: "driver-name" } : undefined}
            >
              {linkToProfile ? (
                <Link to={`/driver/${driver.driverId}`} className="driver-link" viewTransition>
                  {name}
                </Link>
              ) : (
                name
              )}
            </Heading>
            <div className="driver-card__meta">
              {driver.permanentNumber && <span className="pill">#{driver.permanentNumber}</span>}
              <span className="cell-inline">
                <Flag code={nationalityToCode[driver.nationality]} name="" />
                {driver.nationality}
              </span>
              {years !== null && <span>{years} years old</span>}
              {stats?.team && <span>{stats.team}</span>}
            </div>
          </div>

          <div className="driver-card__actions">
            {favorite && (
              <button
                type="button"
                className={`btn ${favorite.isFavorite ? "btn--fav" : ""}`}
                aria-pressed={favorite.isFavorite}
                onClick={() => favorite.onToggle(driver.driverId, name)}
              >
                {favorite.isFavorite ? <FaStar aria-hidden="true" /> : <FaRegStar aria-hidden="true" />}
                {favorite.isFavorite ? "Favorite" : "Add to favorites"}
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                className="btn btn--ghost btn--icon"
                aria-label={`Remove ${name} from favorites`}
                onClick={() => onRemove(driver.driverId, name)}
              >
                <FaXmark aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {stats ? (
          <div className="dtable-wrap">
            <table className="dtable dtable--stats">
              <caption className="visually-hidden">
                {name}: {stats.latest} season and career statistics
              </caption>
              <thead>
                <tr>
                  <th scope="col">Stat</th>
                  <th scope="col" className="num">{stats.latest}</th>
                  <th scope="col" className="num">
                    Career <span className="text-faint">({stats.seasons} seasons)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, k]) => (
                  <tr key={k}>
                    <th scope="row" className="strong">{label}</th>
                    <td className="num">{stats.season[k]}</td>
                    <td className="num">{stats.career[k]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="panel__note">No race starts on record yet.</p>
        )}
      </div>
    </section>
  );
}

export default Driver;
