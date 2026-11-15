import { useEffect, useMemo, useRef } from "react";
import { circuitPath } from "../utils/circuits";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * A circuit layout drawn as SVG from its GeoJSON LineString.
 *
 *  draw:     stroke draws itself in on mount (CSS; skipped for reduced motion)
 *  lap:      a dot laps the track continuously (rAF; skipped for reduced motion)
 *  label:    accessible name; omit when the track is decorative
 */
export default function CircuitTrack({ feature, draw = true, lap = false, label, className = "" }) {
  const { d, start } = useMemo(() => circuitPath(feature, 100, 8), [feature]);
  const pathRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    if (!lap || prefersReducedMotion()) return undefined;
    const path = pathRef.current;
    const dot = dotRef.current;
    if (!path || !dot) return undefined;

    const length = path.getTotalLength();
    const lapMs = 9000;
    // Start lapping once the draw-in animation has finished.
    const delay = draw ? 1600 : 0;
    let raf;
    let t0;
    const tick = (t) => {
      t0 ??= t;
      const elapsed = t - t0 - delay;
      if (elapsed >= 0) {
        const p = path.getPointAtLength(((elapsed % lapMs) / lapMs) * length);
        dot.setAttribute("cx", p.x);
        dot.setAttribute("cy", p.y);
        dot.style.opacity = 1;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [d, lap, draw]);

  return (
    <svg
      className={`track ${draw ? "track--draw" : ""} ${className}`}
      viewBox="0 0 100 100"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
      focusable="false"
    >
      {/* soft under-glow, then the asphalt, then the racing line */}
      <path className="track__glow" d={d} />
      <path className="track__base" d={d} />
      <path ref={pathRef} className="track__line" d={d} pathLength="1" />
      <g className="track__start" transform={`translate(${start[0]} ${start[1]})`}>
        <circle r="2.6" />
        <circle r="1.1" />
      </g>
      {lap && <circle ref={dotRef} className="track__car" r="1.8" cx={start[0]} cy={start[1]} />}
    </svg>
  );
}
