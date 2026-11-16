import { useEffect, useRef, useState } from "react";
import { FaLocationCrosshairs } from "react-icons/fa6";
import CircuitTrack from "./CircuitTrack";
import { Skeleton, State } from "./State";

// OpenFreeMap: OpenStreetMap vector tiles with no API key or quota.
const STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

// Map colours mirror src/css/tokens.css (MapLibre paints on canvas, so it
// can't read CSS variables).
const C = {
  land: "#0d0e11",
  landAlt: "#101215",
  water: "#161a20",
  building: "#15171b",
  roadMinor: "#1f2227",
  roadMajor: "#2c3037",
  roadMotorway: "#3a3f47",
  rail: "#1b1d21",
  boundary: "#2c3036",
  label: "#7c838d",
  labelStrong: "#a1a7b0",
  halo: "#0b0c0e",
  track: "#e8002d",
  trackCasing: "#0b0c0e",
  marker: "#eceef1",
};

/** Repaint OpenFreeMap's stock dark style in the F1 Dash palette. */
const restyle = (style) => {
  style.layers = style.layers
    // Shaded-relief raster, one-way arrows and aeroways are noise at circuit scale.
    .filter((l) => l.type !== "raster" && !l.id.startsWith("road_oneway"))
    .map((layer) => {
      const l = { ...layer, paint: { ...layer.paint }, layout: { ...layer.layout } };
      const id = l.id;
      if (l.type === "background") l.paint["background-color"] = C.land;
      if (l.type === "fill") {
        delete l.paint["fill-pattern"];
        l.paint["fill-color"] = id.includes("water")
          ? C.water
          : id.includes("building")
            ? C.building
            : C.landAlt;
        if (id.includes("building")) l.paint["fill-outline-color"] = C.roadMinor;
        l.paint["fill-opacity"] = id.startsWith("landcover") || id.startsWith("landuse") ? 0.6 : 1;
      }
      if (l.type === "line") {
        l.paint["line-color"] = id.includes("water")
          ? C.water
          : id.startsWith("boundary")
            ? C.boundary
            : id.startsWith("railway")
              ? C.rail
              : id.includes("motorway")
                ? C.roadMotorway
                : id.includes("major")
                  ? C.roadMajor
                  : C.roadMinor;
        if (id.endsWith("casing")) l.paint["line-color"] = C.land;
      }
      if (l.type === "symbol") {
        l.paint["text-color"] = id.startsWith("place_c") ? C.labelStrong : C.label;
        l.paint["text-halo-color"] = C.halo;
        l.paint["text-halo-width"] = 1.2;
        delete l.paint["text-halo-blur"];
      }
      return l;
    });
  return style;
};

// ---- geometry helpers --------------------------------------------------------

const segLen = ([x1, y1], [x2, y2]) => {
  const k = Math.cos(((y1 + y2) / 2) * (Math.PI / 180));
  return Math.hypot((x2 - x1) * k, y2 - y1);
};

/** Precompute cumulative lengths so we can find the point at any fraction. */
const measure = (coords) => {
  const cum = [0];
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + segLen(coords[i - 1], coords[i]));
  return { coords, cum, total: cum[cum.length - 1] };
};

/** Index of the last vertex at or before fraction t, plus the exact point. */
const locate = ({ coords, cum, total }, t) => {
  const d = t * total;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < d) i++;
  const span = cum[i] - cum[i - 1] || 1;
  const f = (d - cum[i - 1]) / span;
  const a = coords[i - 1];
  const b = coords[i];
  return { index: i - 1, point: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f] };
};

const easeOutExpo = (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t));
const lineData = (coordinates) => ({ type: "Feature", geometry: { type: "LineString", coordinates } });
const pointData = (coordinates) => ({ type: "Feature", geometry: { type: "Point", coordinates } });

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Interactive circuit map.
 *
 * Sequence: opens zoomed out on the region, flies in to the circuit, the
 * racing line draws itself from the start/finish line, then a marker laps
 * the track. With reduced motion the finished map simply appears.
 *
 * MapLibre (~230 KB gzipped) is only imported once the panel is on screen.
 * If WebGL or the tile server isn't available it falls back to the SVG
 * drawing, so the panel is never empty.
 */
export default function RaceMap({ circuit, feature }) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const boundsRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | fallback
  const [visible, setVisible] = useState(false);

  const lat = Number(circuit.Location.lat);
  const lng = Number(circuit.Location.long);

  // Only start loading once the panel is near the viewport.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && (setVisible(true), io.disconnect()),
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    let raf;
    let map;
    setStatus("loading");

    (async () => {
      try {
        const [maplibre, style, worker] = await Promise.all([
          import("maplibre-gl"),
          fetch(STYLE_URL).then((r) => {
            if (!r.ok) throw new Error(`Map style failed (${r.status})`);
            return r.json();
          }),
          // MapLibre 6 ships its worker as a separate module; Vite bundles it
          // and hands back the URL, which MapLibre must be told about.
          import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"),
          import("maplibre-gl/dist/maplibre-gl.css"),
        ]);
        if (cancelled) return;
        maplibre.setWorkerUrl(worker.default);

        const still = reducedMotion();
        const coords = feature?.geometry.coordinates;
        const track = coords && measure(coords);

        let bounds = null;
        if (coords) {
          bounds = new maplibre.LngLatBounds(coords[0], coords[0]);
          coords.forEach((c) => bounds.extend(c));
        }
        boundsRef.current = bounds;

        map = new maplibre.Map({
          container: hostRef.current,
          style: restyle(style),
          center: [lng, lat],
          zoom: still ? 13 : 4.2,
          ...(still && bounds ? { bounds, fitBoundsOptions: { padding: 36 } } : {}),
          attributionControl: { compact: true },
          // Page scroll must keep working over the map: zoom needs ctrl/⌘ or two fingers.
          cooperativeGestures: true,
          dragRotate: false,
          pitchWithRotate: false,
        });
        mapRef.current = map;
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        map.on("error", (e) => {
          // A failed style/tile load before first render means no usable map.
          if (!map.loaded() && !cancelled) setStatus("fallback");
          console.warn("Map error", e?.error?.message ?? e);
        });

        map.on("load", () => {
          if (cancelled) return;
          setStatus("ready");

          if (!track) {
            // No layout in our data (new venue): just mark the location.
            map.addSource("venue", { type: "geojson", data: pointData([lng, lat]) });
            map.addLayer({
              id: "venue",
              type: "circle",
              source: "venue",
              paint: {
                "circle-radius": 7,
                "circle-color": C.track,
                "circle-stroke-color": C.marker,
                "circle-stroke-width": 2,
              },
            });
            if (!still) map.flyTo({ center: [lng, lat], zoom: 13, duration: 2400, essential: true });
            return;
          }

          map.addSource("track", { type: "geojson", data: lineData(still ? coords : [coords[0], coords[0]]) });
          map.addSource("start", { type: "geojson", data: pointData(coords[0]) });
          map.addSource("car", { type: "geojson", data: pointData(coords[0]) });
          const round = { "line-cap": "round", "line-join": "round" };
          map.addLayer({
            id: "track-casing",
            type: "line",
            source: "track",
            layout: round,
            paint: { "line-color": C.trackCasing, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 5, 15, 11] },
          });
          map.addLayer({
            id: "track",
            type: "line",
            source: "track",
            layout: round,
            paint: { "line-color": C.track, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2.5, 15, 5] },
          });
          map.addLayer({
            id: "start",
            type: "circle",
            source: "start",
            paint: {
              "circle-radius": 5,
              "circle-color": C.trackCasing,
              "circle-stroke-color": C.marker,
              "circle-stroke-width": 2,
            },
          });
          map.addLayer({
            id: "car",
            type: "circle",
            source: "car",
            paint: { "circle-radius": 4.5, "circle-color": C.marker, "circle-opacity": 0 },
          });
          if (still) return;

          const DRAW_MS = 1800;
          const LAP_MS = 14000;
          const startLap = () => {
            map.setPaintProperty("car", "circle-opacity", 1);
            let t0;
            const lap = (now) => {
              if (cancelled) return;
              t0 ??= now;
              // Constant speed: a lap is steady travel, so linear time is right.
              const { point } = locate(track, ((now - t0) % LAP_MS) / LAP_MS);
              map.getSource("car")?.setData(pointData(point));
              raf = requestAnimationFrame(lap);
            };
            raf = requestAnimationFrame(lap);
          };
          const startDraw = () => {
            let t0;
            const draw = (now) => {
              if (cancelled) return;
              t0 ??= now;
              const p = Math.min(1, (now - t0) / DRAW_MS);
              const { index, point } = locate(track, easeOutExpo(p));
              map.getSource("track")?.setData(lineData([...coords.slice(0, index + 1), point]));
              if (p < 1) raf = requestAnimationFrame(draw);
              else {
                map.getSource("track")?.setData(lineData(coords));
                startLap();
              }
            };
            raf = requestAnimationFrame(draw);
          };

          // Fly in first; the line starts drawing as the camera settles.
          map.once("moveend", startDraw);
          map.fitBounds(bounds, { padding: 36, duration: 2600, essential: true });
        });
      } catch (error) {
        console.warn("Map unavailable, using the drawn layout instead.", error);
        if (!cancelled) setStatus("fallback");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      map?.remove();
      mapRef.current = null;
    };
    // The map is rebuilt only when the circuit changes.
  }, [visible, circuit.circuitId, feature, lat, lng]);

  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    const opts = { padding: 36, duration: reducedMotion() ? 0 : 900 };
    if (boundsRef.current) map.fitBounds(boundsRef.current, opts);
    else map.flyTo({ center: [lng, lat], zoom: 13, duration: opts.duration });
  };

  if (status === "fallback") {
    return feature ? (
      <CircuitTrack feature={feature} label={`Track layout of ${circuit.circuitName}`} />
    ) : (
      <State kind="empty" title="Map unavailable" compact>
        The map couldn't load and there's no drawn layout for this circuit yet.
      </State>
    );
  }

  return (
    <div className="racemap">
      <div
        ref={hostRef}
        className="racemap__canvas"
        role="application"
        aria-label={`Map of ${circuit.circuitName}. Hold Control or Command and scroll to zoom.`}
      />
      {status !== "ready" && <Skeleton className="racemap__skeleton" height="100%" radius={0} />}
      {status === "ready" && (
        <button type="button" className="racemap__recenter" onClick={recenter}>
          <FaLocationCrosshairs aria-hidden="true" />
          <span className="visually-hidden">Recenter on the circuit</span>
        </button>
      )}
    </div>
  );
}
