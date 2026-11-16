import { useCallback, useEffect, useState, Suspense, lazy } from "react";
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  ScrollRestoration,
  useLocation,
  useOutletContext,
} from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, LazyMotion, MotionConfig } from "motion/react";
import * as m from "motion/react-m";
import { FaXmark } from "react-icons/fa6";
import { AuthProvider } from "./components/AuthProvider";
import HeaderNav from "./components/HeaderNav";
import ErrorBoundary from "./components/ErrorBoundary";
import { PrefsProvider } from "./components/Prefs";
import Search from "./components/Search";
import { State } from "./components/State";
import { retryDelay, shouldRetry } from "./api/http";
import { DUR, EASE_OUT, loadMotionFeatures } from "./motion";
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
    <section className="panel state-panel">
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
      <AnimatePresence>
        {alert.visible && (
          // Enters from the top edge it lives on and leaves the same way,
          // a little faster. Keyed by id so a new message replaces the old.
          <m.div
            key={alert.id}
            className={`toast toast--${alert.color}`}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: DUR.fast } }}
            transition={{ duration: DUR.base, ease: EASE_OUT }}
          >
            <span>{alert.message}</span>
            <button type="button" className="toast__close" onClick={onDismiss} aria-label="Dismiss">
              <FaXmark aria-hidden="true" />
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Layout route: everything that persists across pages. */
function Shell() {
  const { pathname } = useLocation();
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
    const timer = setTimeout(() => setAlertState((prev) => ({ ...prev, visible: false })), 3500);
    return () => clearTimeout(timer);
  }, [alert.visible, alert.id]);

  // "/" or Ctrl/⌘+K opens search from anywhere outside a text field.
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.key === "/" && !typing) || (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AuthProvider>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="app-shell">
        <HeaderNav onSearch={() => setSearchOpen(true)} />
        <Search open={searchOpen} onClose={() => setSearchOpen(false)} />
        <Toast alert={alert} onDismiss={() => setAlertState((prev) => ({ ...prev, visible: false }))} />
        <ErrorBoundary label="this page" resetKey={pathname}>
          <Suspense fallback={<PageLoader />}>
            {/* Pages get setAlert as a prop via withAlert() below. */}
            <Outlet context={{ setAlert }} />
          </Suspense>
        </ErrorBoundary>
      </div>
      {/* New page starts at the top; back/forward restores the old position. */}
      <ScrollRestoration />
    </AuthProvider>
  );
}

/** Passes the app-wide setAlert callback to a page as a plain prop. */
const withAlert = (Page) =>
  function PageWithAlert() {
    const { setAlert } = useOutletContext();
    return <Page setAlert={setAlert} />;
  };
const DashboardRoute = withAlert(Dashboard);
const FavoritesRoute = withAlert(Favorites);
const DriverRoute = withAlert(DriverPage);

// A data router (rather than <BrowserRouter>) is what enables route view
// transitions: <Link viewTransition> and useViewTransitionState.
const router = createBrowserRouter([
  {
    element: <Shell />,
    children: [
      { path: "/", element: <DashboardRoute /> },
      { path: "/login", element: <Auth /> },
      { path: "/favorites", element: <FavoritesRoute /> },
      { path: "/calendar", element: <Calendar /> },
      { path: "/driver/:driverId", element: <DriverRoute /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* reducedMotion="user": movement is dropped, opacity changes stay. */}
      <MotionConfig reducedMotion="user">
        <LazyMotion features={loadMotionFeatures} strict>
          <PrefsProvider>
            <RouterProvider router={router} />
          </PrefsProvider>
        </LazyMotion>
      </MotionConfig>
    </QueryClientProvider>
  );
}

export default App;
