# CLAUDE.md

Guidance for AI agents working in this repository. The [README](./README.md)
covers features, full API list, and setup — this file captures the
non-obvious context and conventions that aren't easy to discover from the code.

## What this is

A single-page F1 dashboard (React 18 + Vite): next-race info with an SVG
circuit map, driver/constructor standings, a season race calendar, news,
videos, and Firebase-backed user auth + favorite drivers. Originally a
university project; the live site is [f1dash.vercel.app](https://f1dash.vercel.app).

## Commands

```bash
npm run dev       # Vite dev server on http://localhost:3000 (opens browser)
npm run build     # production build -> dist/
npm run preview   # serve the production build (http://localhost:4173)
```

There is **no test runner and no linter configured** — `npm test`, `npm start`,
and `npm run lint` do not exist. Don't suggest or rely on them. Verify changes
by building and exercising the app in a browser.

## Critical: this was migrated from Create React App to Vite

This is the single most common source of mistakes here.

- Environment variables keep the **`REACT_APP_`** prefix (a CRA convention) but
  are read the **Vite** way, via `import.meta.env.REACT_APP_*` — **not**
  `process.env`, and **not** the usual `VITE_` prefix. `vite.config.js` enables
  this with `envPrefix: ["VITE_", "REACT_APP_"]`. When adding a new env var, use
  `REACT_APP_` and read it through `import.meta.env`.
- Required keys (in a root `.env`, see README): `REACT_APP_FIREBASE_API_KEY`,
  `REACT_APP_WEATHER_API_KEY`, `REACT_APP_NEWS_API_KEY`,
  `REACT_APP_YOUTUBE_API_KEY`.
- Leftover CRA artifacts still live in `public/` (`manifest.json`, `robots.txt`,
  logos) — not all are wired up.
- `react-scripts` is gone. Entry is `index.html` -> `src/index.jsx` -> `App.jsx`.
- `.geojson` is treated as an asset (`assetsInclude`); importing one yields a URL.

## Conventions

- **Write comments in English.** Much of the existing code has Portuguese
  comments (legacy), but new and edited comments should be in English. No need
  to mass-translate the old ones unless asked.
- **User-facing toasts** flow through a `setAlert({ visible, message, color })`
  callback created in `App.jsx` and passed down as a prop (e.g. to `Dashboard` →
  `StandingsBox`). Reuse this pattern instead of adding new notification systems.
- **Graceful degradation is expected.** Every data panel has explicit loading
  (skeleton), error (with retry), empty and success states, built from
  `State` / `QueryError` / `Skeleton` in `src/components/State.jsx`. A missing
  API key surfaces as `MissingKeyError` and renders "not configured" rather
  than an error. Keep this when adding data-fetching UI — the external APIs go
  down and must not blank the page.
- **Data fetching goes through TanStack Query.** Fetchers live in `src/api/`
  (`f1.js` for Jolpica, `media.js` for weather/news/YouTube/Wikipedia) on top
  of the `getJson` fetch wrapper in `api/http.js` (no axios). Shared retry
  policy: transient errors and 429s retry with backoff; 404/config errors
  don't. Reuse query keys (e.g. `["circuits"]`, `["driver", id]`) so data is
  shared across panels instead of refetched.
- **Routing is `react-router` v7** — import from `"react-router"`, not
  `react-router-dom` (v6 had an unpatched open-redirect advisory).
- **No Bootstrap.** A minimal reset lives in `src/index.css`; component styles
  in `src/css/styles.css`.

## Architecture

- `App.jsx` — router + providers. **All pages are lazy-loaded** with
  `React.lazy` + `<Suspense>` for code-splitting; add new routes the same way.
  Routes: `/`, `/login`, `/favorites`, `/calendar`, `/driver/:driverId`, and
  a `*` 404.
- `src/components/` — pages and panels. The dashboard (`Dashboard.jsx`) composes
  `NextRaceBox`, `StandingsBox`, `NewsBox`, `VideosBox`.
- `auth.jsx` exports `Auth` as a **named** export (sign in / sign up / reset
  modes); it's lazy-imported in `App.jsx` via `.then(m => ({ default: m.Auth }))`.
- `src/config/firebase.js` — Firebase init. Config is hardcoded except the API
  key (from env). Without a key, `firebaseEnabled` is false and `auth` is null
  (getAuth would otherwise throw and blank the app); `AuthProvider` exposes
  `enabled` and `authReady` — gate account UI on those.
- `src/utils/circuits.js` + `CircuitTrack.jsx` — circuit layouts are drawn as
  SVG from `src/extra/f1-circuits.geojson`. Circuits are matched by name, then
  by nearest coordinates (names differ between sources, e.g. Losail/Lusail).
- `src/utils/race.js` — session list, local-time formatting, countdown helpers.
- `src/utils/flags.jsx` — shared `Flag` component + nationality/country → ISO
  code maps (see performance note below).

## External data sources

- **Jolpica** (`https://api.jolpi.ca/ergast/f1`) — drop-in successor to the
  shut-down Ergast API; powers standings, calendar, and historical results.
  Supports CORS directly.
- **flagcdn.com** — country flag SVGs, loaded on demand by `Flag`.
- No map tiles: CARTO's free tiles now require an API key, so the map was
  replaced by an SVG drawing. Don't reintroduce a tile basemap without a key plan.
- Weather (WorldWeatherOnline — forecasts only exist ~14 days out), News
  (webz.io), YouTube Data API (reads the channel's uploads playlist: 1 quota
  unit vs 100 for search), Wikipedia (driver photos, unkeyed).

## Performance / bundle discipline

The initial bundle was once ~1.5 MB gzipped, dominated by a flags dependency
that bundled every flag in the world. Lessons now baked in — please preserve:

- **Don't add deps that bundle large static datasets.** Flags come from
  flagcdn.com via `src/utils/flags.jsx`, not a bundled flag library.
- **Firestore and Analytics are dynamically imported** (`FavoritesService.js`,
  `config/firebase.js`) — only Auth ships in the initial chunk. Keep them lazy.
- **Keep route components lazy** in `App.jsx`.

## Firebase

Uses the **modular v12 SDK**. The app only touches stable modular APIs
(`initializeApp`, `getAuth`, `getFirestore`, `GoogleAuthProvider`,
`sendPasswordResetEmail`, `doc/setDoc/deleteDoc/collection/query/where/getDocs`).
Do not downgrade firebase — v10/v11 pulled in a vulnerable `undici`. Every
firebase 12/13 release still pins `@grpc/grpc-js ~1.9` (vulnerable,
server-side only), so `package.json` `overrides` forces `^1.14.7`; keep it
until firebase bumps its own range. Favorites are stored in Firestore via
`FavoritesService.js` and read/written through the `useFavorites` hook.
