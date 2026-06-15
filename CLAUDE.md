# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

F1 Dash is a single-page React dashboard for Formula 1 fans (race countdown, circuit map, weather, standings, news, videos, driver pages, calendar, and favorites). It is a client-only SPA — there is no backend server in this repo; all data comes from third-party APIs and Firebase. It originated as a Create React App project, was migrated to Vite, and deploys to Vercel.

## Commands

```bash
npm install        # install dependencies
npm run dev        # start Vite dev server on http://localhost:3000 (auto-opens)
npm run build      # production build to dist/
npm run preview    # serve the production build locally
```

There is **no test runner, linter, or formatter configured** — `package.json` defines only `dev`, `build`, and `preview`. Don't suggest `npm test`/`npm run lint`; they don't exist. Verify changes via `npm run dev` / `npm run build`.

## Environment variables

API keys are read through `import.meta.env` and kept in an untracked `.env` at the repo root. They use the legacy `REACT_APP_` prefix; `vite.config.js` sets `envPrefix: ["VITE_", "REACT_APP_"]` so both work. Keys: `REACT_APP_WEATHER_API_KEY`, `REACT_APP_NEWS_API_KEY`, `REACT_APP_YOUTUBE_API_KEY`, `REACT_APP_FIREBASE_API_KEY`. Missing keys degrade gracefully — the relevant panel shows an "unavailable" state rather than crashing.

## Architecture

**Entry & routing.** `src/index.jsx` mounts `App` (in `StrictMode`). `src/App.jsx` owns the `BrowserRouter`, wraps everything in `AuthProvider`, renders `HeaderNav` plus a global toast, and defines all routes. Page components are **code-split with `React.lazy` + `Suspense`** (`Dashboard`, `Auth`, `Favorites`, `Calendar`, `DriverPage`) to keep the initial bundle small — keep new routes lazy. `vercel.json` rewrites all paths to `/index.html` for client-side routing.

**Data sources (no shared API layer).** Each component fetches directly with `axios` inside a `useEffect`; there is no central client or caching layer. The F1 data API is **Jolpica**, the drop-in successor to the shut-down Ergast API, at base URL `https://api.jolpi.ca/ergast/f1` (response shape is Ergast's `MRData.*`). Other panels call WorldWeatherOnline (weather), webz.io/News API (news), and the YouTube Data API (videos). Nation/country flags are rendered on demand as `flagcdn.com` SVGs via `src/utils/flags.jsx` (which exports `Flag`, `nationalityToCode`, `countryToCode`) — avoid pulling in heavyweight flag bundles.

**Auth & favorites (Firebase).** `src/config/firebase.js` initializes Firebase (Auth, Firestore, optional Analytics) — note its config is hardcoded except the API key. `src/components/AuthProvider.jsx` exposes a context via the `useAuth()` hook (`user`, `isLoggedIn`, `signIn`, `signUp`, `signInWithGoogle`, `signOutUser`) and persists sessions through `onAuthStateChanged`. Favorite drivers live in a Firestore `Favorites` collection; all reads/writes go through `src/components/FavoritesService.js`, which keys documents as `` `${userId}_${driverId}` ``.

**Resilience.** Each dashboard panel is individually wrapped in `ErrorBoundary` (`src/components/ErrorBoundary.jsx`, a class component) so one failing API/panel can't white-screen the whole app. Wrap new panels the same way.

**Heavy/lazy assets.** Leaflet (map) is `import()`-ed dynamically inside `NextRaceBox` rather than at module top level, to keep it out of the initial bundle. The circuit `.geojson` in `src/extra/` is treated as an asset URL (`assetsInclude` in `vite.config.js`) and fetched at runtime. SVGs imported with the `?react` suffix become React components (`vite-plugin-svgr`).

## Styling / design system

Bootstrap + Reactstrap are present but the UI is mostly custom CSS implementing a "liquid glass over dark aurora" bento layout. The design tokens (CSS custom properties: `--glass-*`, `--f1-red`, colors, radii, motion) and base reset live in **`src/index.css`**; component styles live in **`src/css/styles.css`**. Reuse existing tokens and the `.glass` / `.panel` / `.bento__*` class vocabulary instead of introducing ad-hoc colors. Icons come from `react-icons` (Font Awesome sets), not emojis.

## Conventions & gotchas

- Many inline comments are written in **Portuguese** — match the surrounding language when editing a file, but new top-level docs can be in English.
- File extensions are mixed `.jsx`/`.js` with no enforced rule; follow the neighboring files.
- `src/components/Standings.jsx` appears to be legacy/unused — the live dashboard renders `StandingsBox.jsx`. Confirm a component is actually routed/imported before editing it.
- The `<NextRaceBox>` effect that builds the Leaflet map intentionally depends only on `geojsonData`; the weather effect intentionally depends on `lastWinners`. These dependency choices are deliberate (see the inline comments) — don't "fix" them without understanding the re-render/teardown consequences.

## Git workflow

Active development happens on a feature branch (currently `claude/claude-md-docs-bddigb`); `master` is the mainline. Do not open pull requests unless explicitly asked.
