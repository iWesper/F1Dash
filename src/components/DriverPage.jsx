import { useParams, Link } from "react-router-dom";
import { FaArrowLeftLong } from "react-icons/fa6";
import Driver from "./Driver";

function DriverPage() {
  const { driverId } = useParams();

  return (
    <main className="page">
      <div className="page__head">
        <div>
          <span className="eyebrow">Driver</span>
          <h1 className="page__title">Driver profile</h1>
        </div>
        <Link to="/" className="btn btn--ghost">
          <FaArrowLeftLong /> Dashboard
        </Link>
      </div>

      <div className="driver-list">
        <Driver driverId={driverId} />
      </div>
    </main>
  );
}

export default DriverPage;
