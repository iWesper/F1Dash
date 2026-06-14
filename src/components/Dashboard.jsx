import React from "react";
import StandingsBox from "./StandingsBox";
import NextRaceBox from "./NextRaceBox";
import NewsBox from "./NewsBox";
import VideosBox from "./VideosBox";
import ErrorBoundary from "./ErrorBoundary";
import { FaTriangleExclamation } from "react-icons/fa6";

const Dashboard = ({ setAlert }) => {
  return (
    <main className="page">
      <p className="banner glass">
        <FaTriangleExclamation size={15} />
        This app relies on external APIs I don't control — some panels may be
        unavailable if a provider is down.
      </p>

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
