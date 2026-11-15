import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { FaLock } from "react-icons/fa6";
import { useAuth } from "./AuthProvider";
import { Login, ResetPassword } from "./Login";
import { SignUp } from "./SignUp";
import CircuitTrack from "./CircuitTrack";
import { State } from "./State";
import { loadCircuits, circuitLengthKm } from "../utils/circuits";
import { useDocumentTitle } from "../hooks/useNow";

// Iconic, instantly recognisable layouts for the sign-in illustration.
const SHOWCASE = ["be-1925", "it-1922", "jp-1962", "gb-1948", "br-1940", "mc-1929", "us-2012"];

/** A famous circuit, drawn in and lapped by a dot. Decorative. */
function CircuitShowcase() {
  const [pick] = useState(() => SHOWCASE[Math.floor(Math.random() * SHOWCASE.length)]);
  const { data } = useQuery({
    queryKey: ["circuits"],
    queryFn: loadCircuits,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const feature = data?.features.find((f) => f.properties.id === pick);

  return (
    <figure className="showcase" aria-hidden={!feature || undefined}>
      <div className="showcase__stage">
        {feature && <CircuitTrack feature={feature} lap className="track--hero" />}
      </div>
      {feature && (
        <figcaption className="showcase__caption">
          <span className="showcase__name">{feature.properties.Name}</span>
          <span className="showcase__facts">
            {feature.properties.Location} · {circuitLengthKm(feature)} km
          </span>
        </figcaption>
      )}
    </figure>
  );
}

const COPY = {
  signin: { eyebrow: "Welcome back", title: "Sign in to F1 Dash", doc: "Sign in" },
  signup: { eyebrow: "Create account", title: "Join F1 Dash", doc: "Create account" },
  reset: { eyebrow: "Reset password", title: "Forgot your password?", doc: "Reset password" },
};

export const Auth = () => {
  const { user, enabled, authReady } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState(""); // shared so switching modes keeps it
  const from = location.state?.from ?? "/";
  useDocumentTitle(COPY[mode].doc);

  // Move focus to the new heading when switching modes (not on first load),
  // so screen readers announce the new form.
  const prevMode = useRef(mode);
  useEffect(() => {
    if (prevMode.current !== mode) {
      document.getElementById("auth-title")?.focus({ preventScroll: true });
    }
    prevMode.current = mode;
  }, [mode]);

  if (authReady && user) return <Navigate to={from} replace />;

  return (
    <main className="page auth-page" id="main">
      <section className="glass auth-card">
        <aside className="auth-card__aside">
          <div className="auth-card__brand">
            <span className="brand__mark" aria-hidden="true">
              F1
            </span>
            <p className="auth-card__tagline">
              Countdown, circuit, weather and live standings for every race weekend.
            </p>
          </div>
          <CircuitShowcase />
        </aside>

        <div className="auth-card__body">
          {!enabled ? (
            <State
              kind="empty"
              icon={FaLock}
              title="Accounts are unavailable"
              action={{ label: "Back to the dashboard", to: "/" }}
            >
              Sign-in isn't configured on this deployment. Everything else on the
              dashboard still works.
            </State>
          ) : (
            <>
              <span className="eyebrow">{COPY[mode].eyebrow}</span>
              <h1 className="auth-card__title" id="auth-title" tabIndex={-1}>
                {COPY[mode].title}
              </h1>

              {mode === "signup" ? (
                <SignUp email={email} setEmail={setEmail} onSwitch={setMode} from={from} />
              ) : mode === "reset" ? (
                <ResetPassword email={email} setEmail={setEmail} onSwitch={setMode} />
              ) : (
                <Login email={email} setEmail={setEmail} onSwitch={setMode} from={from} />
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
};
