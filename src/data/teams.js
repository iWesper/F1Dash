// Team colours keyed by Jolpica constructorId, used for the 4px bar beside
// each driver and for chart lines. Approximations of each team's 2026
// livery colour; unknown ids fall back to a neutral grey.
const TEAM_COLOURS = {
  mercedes: "#27f4d2",
  red_bull: "#3671c6",
  ferrari: "#e8002d",
  mclaren: "#ff8000",
  aston_martin: "#229971",
  alpine: "#ff87bc",
  williams: "#64c4ff",
  rb: "#6692ff",
  haas: "#b6babd",
  audi: "#d0d3d6",
  sauber: "#52e252",
  cadillac: "#c9b26b",
};

export const teamColour = (constructorId) => TEAM_COLOURS[constructorId] ?? "#6c727b";
