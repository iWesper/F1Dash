import { useParams, Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchDriver } from "../api/f1";
import { FaArrowLeftLong } from "react-icons/fa6";
import Driver from "./Driver";
import { useAuth } from "./AuthProvider";
import { useFavorites } from "../hooks/useFavorites";
import { useDocumentTitle } from "../hooks/useNow";

function DriverPage({ setAlert }) {
  const { driverId } = useParams();
  const { user, enabled } = useAuth();
  const favorites = useFavorites({ setAlert });
  const navigate = useNavigate();

  // Same query as the card (deduped by key), used here for the tab title.
  const { data } = useQuery({
    queryKey: ["driver", driverId],
    queryFn: ({ signal }) => fetchDriver(driverId, { signal }),
    staleTime: 60 * 60 * 1000,
  });
  const d = data?.driver;
  useDocumentTitle(d ? `${d.givenName} ${d.familyName}` : "Driver");

  const favorite = enabled
    ? {
        isFavorite: favorites.isFavorite(driverId),
        onToggle: (id, name) => {
          if (!user) {
            navigate("/login", { state: { from: `/driver/${driverId}` } });
            return;
          }
          favorites.toggle(id, name);
        },
      }
    : undefined;

  return (
    <main className="page" id="main">
      <nav className="page__crumbs" aria-label="Breadcrumb">
        <Link to="/" className="crumb" viewTransition>
          <FaArrowLeftLong aria-hidden="true" /> Standings
        </Link>
      </nav>
      <div className="driver-list">
        <Driver driverId={driverId} headingLevel={1} favorite={favorite} />
      </div>
    </main>
  );
}

export default DriverPage;
