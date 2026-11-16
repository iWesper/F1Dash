import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CIRCUIT_TZ } from "../data/timezones";
import { fmtDate, fmtDay, fmtTime, localTimeZone } from "../utils/race";

const KEY = "f1dash:timeMode";
const PrefsContext = createContext(null);

const read = () => {
  try {
    return localStorage.getItem(KEY) === "track" ? "track" : "local";
  } catch {
    return "local";
  }
};

/** Viewer preferences. Currently just "your time" vs "track time". */
export function PrefsProvider({ children }) {
  const [timeMode, setMode] = useState(read);
  const setTimeMode = useCallback((mode) => {
    setMode(mode);
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      // Private mode etc. — the choice just won't persist.
    }
  }, []);
  const value = useMemo(() => ({ timeMode, setTimeMode }), [timeMode, setTimeMode]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

/**
 * Date/time formatters for one circuit that follow the viewer's time mode.
 * Falls back to local time when we don't know the circuit's timezone.
 */
export function useRaceTime(circuitId) {
  const { timeMode, setTimeMode } = useContext(PrefsContext);
  const trackZone = CIRCUIT_TZ[circuitId];
  const useTrack = timeMode === "track" && Boolean(trackZone);
  const zone = useTrack ? trackZone : undefined;
  return {
    mode: useTrack ? "track" : "local",
    setMode: setTimeMode,
    canTrack: Boolean(trackZone),
    trackZone,
    zoneLabel: useTrack ? trackZone.split("/")[1].replace(/_/g, " ") : localTimeZone(),
    day: (dt) => fmtDay(dt, zone),
    date: (dt) => fmtDate(dt, zone),
    time: (dt) => fmtTime(dt, zone),
  };
}

/** Segmented "Your time / Track time" switch. */
export function TimeToggle({ circuitId, className = "" }) {
  const t = useRaceTime(circuitId);
  if (!t.canTrack) return null;
  return (
    <div className={`seg seg--sm ${className}`} role="group" aria-label="Show times in">
      {[
        ["local", "Your time"],
        ["track", "Track time"],
      ].map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={`seg__btn ${t.mode === id ? "is-active" : ""}`}
          aria-pressed={t.mode === id}
          onClick={() => t.setMode(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
