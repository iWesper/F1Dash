import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import { FaArrowLeftLong } from "react-icons/fa6";
import { useAuth } from "./AuthProvider";
import { getFavoriteDrivers } from "./FavoritesService";
import Driver from "./Driver";

function Favorites() {
  const { user } = useAuth();
  const [favoriteDrivers, setFavoriteDrivers] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      getFavoriteDrivers(user.uid).then((drivers) => {
        setFavoriteDrivers(drivers);
        setLoaded(true);
      });
    }
  }, [user]);

  if (!user) {
    return (
      <main className="page">
        <section className="glass panel state-panel">
          <div className="state">
            <h3>Sign in to see your favorites</h3>
            <p>Save drivers to follow their season and career stats here.</p>
            <Link to="/login" className="btn btn--primary">
              Sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page favorites">
      <div className="page__head">
        <div>
          <span className="eyebrow">
            <FaStar className="ico" />
            Favorites
          </span>
          <h1 className="page__title">Your favorite drivers</h1>
        </div>
        <Link to="/" className="btn btn--ghost">
          <FaArrowLeftLong /> Dashboard
        </Link>
      </div>

      {!loaded ? (
        <section className="glass panel state-panel">
          <div className="state">
            <div className="spinner" />
            <p>Loading your drivers…</p>
          </div>
        </section>
      ) : favoriteDrivers.length === 0 ? (
        <section className="glass panel state-panel">
          <div className="state">
            <h3>No favorites yet</h3>
            <p>
              Tap the star next to a driver in the standings to add them here.
            </p>
            <Link to="/" className="btn btn--primary">
              Browse standings
            </Link>
          </div>
        </section>
      ) : (
        <div className="driver-list">
          {favoriteDrivers.map((driverId) => (
            <Driver key={driverId} driverId={driverId} />
          ))}
        </div>
      )}
    </main>
  );
}

export default Favorites;
