import React, { useEffect, useState, Suspense, lazy } from "react";
import "./App.css";
import { AuthProvider } from "./components/AuthProvider";
import "bootstrap/dist/css/bootstrap.min.css";
import "../src/css/styles.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HeaderNav from "./components/HeaderNav";
import ErrorBoundary from "./components/ErrorBoundary";

// Route-level code splitting: each page ships as its own chunk so the
// initial load doesn't pull in the calendar, favorites, driver and auth
// screens (and their dependencies) up front.
const Dashboard = lazy(() => import("./components/Dashboard"));
const Auth = lazy(() =>
  import("./components/auth").then((m) => ({ default: m.Auth }))
);
const Favorites = lazy(() => import("./components/Favorites"));
const Calendar = lazy(() => import("./components/Calendar"));
const DriverPage = lazy(() => import("./components/DriverPage"));

const PageLoader = () => (
  <main className="page">
    <section className="glass panel state-panel">
      <div className="state">
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    </section>
  </main>
);

function App() {
  const [alert, setAlert] = useState({
    visible: false,
    message: "",
    color: "",
  });

  useEffect(() => {
    if (alert.visible) {
      const timer = setTimeout(() => {
        setAlert((prevAlert) => ({ ...prevAlert, visible: false }));
      }, 3000); // 3000ms = 3s
      return () => clearTimeout(timer);
    }
  }, [alert.visible]);

  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Dark aurora backdrop (fixed, behind everything) */}
        <div className="aurora" aria-hidden="true">
          <span className="aurora__blob aurora__blob--1" />
          <span className="aurora__blob aurora__blob--2" />
          <span className="aurora__blob aurora__blob--3" />
        </div>

        <div className="app-shell App">
          <HeaderNav />

          {alert.visible && (
            <div
              className={`toast glass toast--${alert.color}`}
              role="status"
              onClick={() => setAlert({ ...alert, visible: false })}
            >
              {alert.message}
            </div>
          )}

          <ErrorBoundary label="this page">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route
                  path="/"
                  index
                  element={<Dashboard setAlert={setAlert} />}
                />
                <Route path="/login" element={<Auth />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/driver/:driverId" element={<DriverPage />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
