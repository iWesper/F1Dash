import { FaStar, FaRegStar } from "react-icons/fa6";
import { useAuth } from "./AuthProvider";
import { useFavorites } from "../hooks/useFavorites";
import { useDocumentTitle } from "../hooks/useNow";
import Driver, { DriverSkeleton } from "./Driver";
import { State } from "./State";

const Shell = ({ children, count }) => (
  <main className="page favorites" id="main">
    <div className="page__head">
      <div>
        <span className="eyebrow">
          <FaStar className="ico" aria-hidden="true" />
          Favorites
        </span>
        <h1 className="page__title">Your drivers</h1>
        {count > 0 && (
          <p className="page__sub">
            {count} {count === 1 ? "driver" : "drivers"} · season and career stats
          </p>
        )}
      </div>
    </div>
    {children}
  </main>
);

const Panel = ({ children }) => <section className="glass panel state-panel">{children}</section>;

function Favorites({ setAlert }) {
  useDocumentTitle("Favorites");
  const { user, enabled, authReady } = useAuth();
  const favorites = useFavorites({ setAlert });
  const { query } = favorites;

  if (!enabled) {
    return (
      <Shell>
        <Panel>
          <State kind="empty" title="Favorites aren't available">
            Accounts aren't configured on this deployment, so there's nowhere to save
            favorites.
          </State>
        </Panel>
      </Shell>
    );
  }

  // Wait for Firebase to restore the session before deciding "signed out".
  if (!authReady || (user && query.isPending)) {
    return (
      <Shell>
        <div className="driver-list">
          <DriverSkeleton />
        </div>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <Panel>
          <State
            kind="empty"
            icon={FaRegStar}
            title="Sign in to keep your favorites"
            action={{ label: "Sign in", to: "/login", state: { from: "/favorites" }, primary: true }}
          >
            Star drivers in the standings to follow their season and career stats here.
          </State>
        </Panel>
      </Shell>
    );
  }

  if (query.isError) {
    return (
      <Shell>
        <Panel>
          <State
            kind="error"
            title="Couldn't load your favorites"
            action={{ label: "Try again", onClick: () => query.refetch() }}
          >
            Your saved drivers are safe — we just couldn't reach them right now.
          </State>
        </Panel>
      </Shell>
    );
  }

  if (favorites.ids.length === 0) {
    return (
      <Shell>
        <Panel>
          <State
            kind="empty"
            icon={FaRegStar}
            title="No favorites yet"
            action={{ label: "Browse the standings", to: "/", primary: true }}
          >
            Tap the star next to a driver in the standings and they'll show up here.
          </State>
        </Panel>
      </Shell>
    );
  }

  return (
    <Shell count={favorites.ids.length}>
      <div className="driver-list">
        {favorites.ids.map((driverId) => (
          <Driver
            key={driverId}
            driverId={driverId}
            linkToProfile
            onRemove={(id, name) => favorites.toggle(id, name)}
          />
        ))}
      </div>
    </Shell>
  );
}

export default Favorites;
