import geojsonUrl from "../extra/f1-circuits.geojson";

// The GeoJSON (~120 KB) is a static asset; fetch it once per session.
let circuitsPromise;
export const loadCircuits = () => {
  circuitsPromise ??= fetch(geojsonUrl)
    .then((res) => {
      if (!res.ok) throw new Error(`Circuit data failed (${res.status})`);
      return res.json();
    })
    .catch((error) => {
      circuitsPromise = undefined; // allow a retry
      throw error;
    });
  return circuitsPromise;
};

const toRad = (deg) => (deg * Math.PI) / 180;

/** Great-circle distance in km. */
const distanceKm = (lat1, lng1, lat2, lng2) => {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

const centre = (coords) => {
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
};

/**
 * Find the track layout for a Jolpica Circuit. Exact name first, then the
 * nearest layout within a few km of the API's coordinates. Names drift
 * between sources ("Losail" vs "Lusail"), coordinates don't. Returns null
 * for circuits the dataset doesn't have yet (e.g. new venues).
 */
export const findCircuit = (geojson, circuit) => {
  if (!geojson || !circuit) return null;
  const byName = geojson.features.find((f) => f.properties.Name === circuit.circuitName);
  if (byName) return byName;

  const lat = Number(circuit.Location.lat);
  const lng = Number(circuit.Location.long);
  let best = null;
  let bestKm = Infinity;
  for (const feature of geojson.features) {
    const [cLat, cLng] = centre(feature.geometry.coordinates);
    const km = distanceKm(lat, lng, cLat, cLng);
    if (km < bestKm) {
      best = feature;
      bestKm = km;
    }
  }
  return bestKm <= 5 ? best : null;
};

/**
 * Project a LineString to an SVG path that fits a `size`-unit square.
 * Equirectangular with cos(lat) scaling is accurate at circuit scale.
 */
export const circuitPath = (feature, size = 100, pad = 6) => {
  const coords = feature.geometry.coordinates;
  const [midLat] = centre(coords);
  const k = Math.cos(toRad(midLat));
  const pts = coords.map(([lng, lat]) => [lng * k, -lat]);

  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;
  const scale = (size - pad * 2) / Math.max(w, h);
  const offX = (size - w * scale) / 2;
  const offY = (size - h * scale) / 2;

  const proj = pts.map(([x, y]) => [
    +((x - minX) * scale + offX).toFixed(2),
    +((y - minY) * scale + offY).toFixed(2),
  ]);
  const d = `M${proj.map((p) => p.join(",")).join("L")}`;
  return { d, start: proj[0] };
};

export const circuitLengthKm = (feature) =>
  feature?.properties?.length ? (feature.properties.length / 1000).toFixed(3) : null;
