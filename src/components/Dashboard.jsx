import StandingsBox from "./StandingsBox";
import NextRaceBox from "./NextRaceBox";
import NewsBox from "./NewsBox";
import VideosBox from "./VideosBox";
import ErrorBoundary from "./ErrorBoundary";
import { useDocumentTitle } from "../hooks/useNow";

// Each panel owns its loading / error / empty states, so one provider being
// down never blanks the page (and no global "APIs may fail" banner needed).
const Dashboard = ({ setAlert }) => {
  useDocumentTitle(null);
  return (
    <main className="page" id="main">
      <div className="bento">
        <div className="bento__nextrace">
          <ErrorBoundary label="the next race">
            <NextRaceBox />
          </ErrorBoundary>
        </div>

        <div className="bento__standings">
          <ErrorBoundary label="the standings">
            <StandingsBox setAlert={setAlert} />
          </ErrorBoundary>
        </div>

        <div className="bento__news">
          <ErrorBoundary label="the news">
            <NewsBox />
          </ErrorBoundary>
        </div>

        <div className="bento__videos">
          <ErrorBoundary label="the videos">
            <VideosBox />
          </ErrorBoundary>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
