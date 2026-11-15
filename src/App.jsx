import { useCallback, useEffect, useState, Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FaXmark } from "react-icons/fa6";
import { AuthProvider } from "./components/AuthProvider";
import HeaderNav from "./components/HeaderNav";
import ErrorBoundary from "./components/ErrorBoundary";
import { State } from "./components/State";
import { retryDelay, shouldRetry } from "./api/http";
import "./css/styles.css";

// Route-level code splitting: each page ships as its own chunk so the
// initial load doesn't pull in every screen (and its dependencies) up front.
const Dashboard = lazy(() => import("./components/Dashboard"));
const Auth = lazy(() => import("./components/auth").then((m) => ({ default: m.Auth })));
const Favorites = lazy(() => import("./components/Favorites"));
const Calendar = lazy(() => import("./components/Calendar"));
const DriverPage = lazy(() => import("./components/DriverPage"));
const NotFound = lazy(() => import("./components/NotFound"));

// One cache for the whole app: panels that share data (schedule, standings)
// fetch once, and navigating back to the dashboard doesn't refetch
// everything — which matters because Jolpica rate-limits bursts.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: shouldRetry,
      retryDelay,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <main className="page" id="main">
    <section className="glass panel state-panel">
      <State kind="loading">Loading…</State>
    </section>
  </main>
);

/**
 * Toast fed by the app-wide setAlert({ visible, message, color }) callback.
 * The live region stays mounted so screen readers announce each message.
 */
function Toast({ alert, onDismiss }) {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {alert.visible && (
        <div className={`toast glass toast--${alert.color}`} key={alert.id}>
          <span>{alert.message}</span>
          <button type="button" className="toast__close" onClick={onDismiss} aria-label="Dismiss">
            <FaXmark aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

function AppRoutes({ setAlert }) {
  const { pathname } = useLocation();

  // New page: start at the top, like a normal navigation.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <ErrorBoundary label="this page" resetKey={pathname}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard setAlert={setAlert} />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/favorites" element={<Favorites setAlert={setAlert} />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/driver/:driverId" element={<DriverPage setAlert={setAlert} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  const [alert, setAlertState] = useState({ visible: false, message: "", color: "", id: 0 });

  // Each call gets a new id so back-to-back toasts restart the timer.
  const setAlert = useCallback(
    (next) =>
      setAlertState((prev) => ({
        ...(typeof next === "function" ? next(prev) : next),
        id: prev.id + 1,
      })),
    []
  );

  useEffect(() => {
    if (!alert.visible) return undefined;
    const timer = setTimeout(
      () => setAlertState((prev) => ({ ...prev, visible: false })),
      3500
    );
    return () => clearTimeout(timer);
  }, [alert.visible, alert.id]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <a href="#main" className="skip-link">
            Skip to content
          </a>

          {/* Dark aurora backdrop (fixed, behind everything) */}
          <div className="aurora" aria-hidden="true">
            <span className="aurora__blob aurora__blob--1" />
            <span className="aurora__blob aurora__blob--2" />
            <span className="aurora__blob aurora__blob--3" />
          </div>

          <div className="app-shell">
            <HeaderNav />
            <Toast
              alert={alert}
              onDismiss={() => setAlertState((prev) => ({ ...prev, visible: false }))}
            />
            <AppRoutes setAlert={setAlert} />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
