# CLAUDE.md

Guidance for AI agents working in this repository. The [README](./README.md)
covers features, full API list, and setup — this file captures the
non-obvious context and conventions that aren't easy to discover from the code.

## What this is

A single-page F1 dashboard (React 18 + Vite): next-race info with a Leaflet
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
  logos) and `src/` (`logo.svg`) — not all are wired up.
- `react-scripts` is gone. Entry is `index.html` -> `src/index.jsx` -> `App.jsx`.
- `.geojson` is treated as an asset (`assetsInclude`); importing one yields a URL.

## Conventions

- **Comments are written in Portuguese.** Match that when editing existing files
  so the codebase stays consistent (new top-level docs like this one are in
  English).
- **User-facing toasts** flow through a `setAlert({ visible, message, color })`
  callback created in `App.jsx` and passed down as a prop (e.g. to `Dashboard` →
  `StandingsBox`). Reuse this pattern instead of adding new notification systems.
- **Graceful degradation is expected.** Every data panel handles its upstream
  API being unavailable with a dedicated "unavailable" state (e.g. `apiIsDown`
  in `StandingsBox`, availability flags in `NextRaceBox`). Keep this when adding
  data-fetching UI — the external APIs go down and must not blank the page.

## Architecture

- `App.jsx` — router + providers. **All pages are lazy-loaded** with
  `React.lazy` + `<Suspense>` for code-splitting; add new routes the same way.
  Routes: `/`, `/login`, `/favorites`, `/calendar`, `/driver/:driverId`.
- `src/components/` — pages and panels. The dashboard (`Dashboard.jsx`) composes
  `NextRaceBox`, `StandingsBox`, `NewsBox`, `VideosBox`.
- `auth.jsx` exports `Auth` as a **named** export (login/signup tabs); it's
  lazy-imported in `App.jsx` via `.then(m => ({ default: m.Auth }))`.
- `src/config/firebase.js` — Firebase init. Config is hardcoded except the API
  key (from env). Analytics init is guarded so the app boots without a key.
- `src/utils/flags.jsx` — shared `Flag` component + nationality/country → ISO
  code maps (see performance note below).

## External data sources

- **Jolpica** (`https://api.jolpi.ca/ergast/f1`) — drop-in successor to the
  shut-down Ergast API; powers standings, calendar, and historical results.
  Supports CORS directly.
- **flagcdn.com** — country flag SVGs, loaded on demand by `Flag`.
- **CARTO dark tiles** — Leaflet basemap (matches the dark theme).
- Weather (WorldWeatherOnline), News API, YouTube Data API, Wikipedia (driver
  photos) — all keyed via the env vars above.

## Performance / bundle discipline

The initial bundle was once ~1.5 MB gzipped, dominated by a flags dependency
that bundled every flag in the world. Lessons now baked in — please preserve:

- **Don't add deps that bundle large static datasets.** Flags come from
  flagcdn.com via `src/utils/flags.jsx`, not a bundled flag library.
- **Leaflet is dynamically imported** inside `NextRaceBox`'s map effect
  (`await import("leaflet")`) to stay out of the initial chunk. Keep it lazy.
- **Keep route components lazy** in `App.jsx`.

## Firebase

Uses the **modular v12 SDK**. The app only touches stable modular APIs
(`initializeApp`, `getAuth`, `getFirestore`, `GoogleAuthProvider`,
`doc/setDoc/deleteDoc/collection/query/where/getDocs`). Do not downgrade
firebase — v10/v11 pulled in a vulnerable `undici`; v12 resolves it
(`npm audit` is clean). Favorites are stored in Firestore via
`FavoritesService.js`.
