# F1 Dash design system — "Timing screen"

The look borrows from what F1 fans already read every weekend: the broadcast
timing tower, sector colours and team colours. Flat, dense and typographic.
Hierarchy comes from type weight and mono numerals, not from boxes and glow.

Tokens live in [`src/css/tokens.css`](../src/css/tokens.css). Components use
tokens only; a literal colour, radius or easing in a component is a bug.

## Colour

| Token | Use |
| --- | --- |
| `--bg`, `--surface-1/2/3` | Page, panels, rows/inputs, hover/empty bars. Flat; separated by `--line` hairlines, never shadows. |
| `--text`, `--text-dim`, `--text-faint` | Primary, secondary, labels. All AA on `--surface-1`. |
| `--red` | The primary action and "now" (next race, live session). Nothing else is red. |
| `--purple` | Overall best, e.g. fastest lap. |
| `--green` | A gain: places made up, positions climbed. |
| `--yellow` | Caution: errors that can be retried, favourites. |
| `--rain` | Chance of rain in the weather strip. |

Team colours (`src/data/teams.js`) appear only as the 4px bar beside a driver
or team, and as chart lines. Purple/green/yellow carry meaning; never use them
as decoration.

## Type

- **Titillium Web** for all UI text.
- **IBM Plex Mono** (`.mono`) for every number: times, gaps, points, dates,
  round numbers. Always tabular so columns line up and digits don't jitter.
- **Heavy italic caps** (900 italic, uppercase) are reserved for names that
  deserve a headline: the race name, a page title, a driver's name, the
  podium winner. Don't use them for panel titles.
- Panel titles are plain 700 at `--fs-md`. Small uppercase `.label` is for
  column headers and field groups only.
- No eyebrow lines above headings. If a heading needs context, it goes in a
  `.panel__meta` line under it.

## Shape and space

- Radius: `--r` (6px) for panels and controls, `--r-sm` (3px) for anything
  inside them. No pills.
- Space: 4px steps, `--sp-1` … `--sp-6`. Panels pad `--sp-5`.
- The nav bar is the only frosted surface, because content scrolls under it.
  Its height is fixed (`--nav-h`).

## Motion

Rule: motion has to explain a change. Anything triggered constantly gets none.

| What | Motion | Why |
| --- | --- | --- |
| Page to page | 180ms cross-fade (View Transitions); nav stays put | Avoids a hard cut |
| Standings row → driver page | The name travels to the page title | Shows where you went |
| Tabs | The thumb slides (spring, no bounce); content swaps instantly | Tabs are clicked often |
| Standings rows | Slide to new positions (`layout`) | Makes position changes visible |
| Loaded content | Fades in over its skeleton | Loading and loaded read as one state |
| Toast, mobile menu | Slide + fade from the edge they belong to; exit faster than entry | Standard for things that appear |
| Calendar "show completed" | Height opens | Stops the page jumping |
| Map | Fly-in, line draws, marker laps | The one showpiece |
| Countdown, search, hover, keyboard nav | **None** | Repeated constantly; motion would read as lag |

- Curves: `--ease-out` for entering/leaving, `--ease-in-out` for moving on
  screen. Never `ease-in`. Durations: `--dur-fast` 150ms, `--dur` 220ms; stay
  under 300ms except the map flight.
- JS-driven motion uses [Motion](https://motion.dev) via `m.*` components and
  the constants in `src/motion.js`. Only animate `transform` and `opacity`.
- Reduced motion: movement is removed, opacity/colour feedback stays
  (`MotionConfig reducedMotion="user"`, plus the media query in `styles.css`).
  The map skips the flight and the lap.

## Icon

Three slanted stripes, each longer than the one above, with broken tails on
the top two. 64-unit grid, 12-unit margin, 8-unit bars, 6 between them, 3.5
tail gaps. Source: `src/components/Logo.jsx` and `public/icon.svg` (keep in
sync); PNGs in `public/` are exported from the SVG.
