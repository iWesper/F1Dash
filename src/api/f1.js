import { getJson, NotFoundError } from "./http";

// Jolpica is the Ergast-compatible successor (Ergast shut down early 2025)
// and supports CORS directly.
const BASE = "https://api.jolpi.ca/ergast/f1";

const races = (data) => data.MRData.RaceTable.Races;

export const fetchSchedule = async ({ signal }) =>
  races(await getJson(`${BASE}/current.json`, { signal }));

/** Next race, or the season's last race when there's nothing left to run. */
export const fetchNextRace = async ({ signal }) => {
  const next = races(await getJson(`${BASE}/current/next.json`, { signal }));
  if (next.length > 0) return { race: next[0], isNext: true };
  const last = races(await getJson(`${BASE}/current/last.json`, { signal }));
  if (last.length === 0) throw new NotFoundError("No races this season yet");
  return { race: last[0], isNext: false };
};

export const fetchDriverStandings = async ({ signal }) => {
  const data = await getJson(`${BASE}/current/driverStandings.json`, { signal });
  const list = data.MRData.StandingsTable.StandingsLists[0];
  return {
    season: data.MRData.StandingsTable.season,
    round: list?.round,
    rows: list?.DriverStandings ?? [],
  };
};

export const fetchConstructorStandings = async ({ signal }) => {
  const data = await getJson(`${BASE}/current/constructorStandings.json`, { signal });
  const list = data.MRData.StandingsTable.StandingsLists[0];
  return {
    season: data.MRData.StandingsTable.season,
    round: list?.round,
    rows: list?.ConstructorStandings ?? [],
  };
};

/** Map of round -> winning Driver for every completed round this season. */
export const fetchSeasonWinners = async ({ signal }) => {
  const data = await getJson(`${BASE}/current/results/1.json`, {
    signal,
    params: { limit: 100 },
  });
  const map = {};
  races(data).forEach((race) => {
    map[race.round] = race.Results?.[0]?.Driver;
  });
  return map;
};

/** The last `count` winners at a circuit, newest first. */
export const fetchCircuitWinners = async (circuitId, count, { signal }) => {
  const data = await getJson(`${BASE}/circuits/${circuitId}/results/1.json`, {
    signal,
    params: { limit: 100 },
  });
  return races(data)
    .slice(-count)
    .reverse()
    .map((r) => ({ season: r.season, date: r.date, driver: r.Results[0].Driver }));
};

/**
 * Everything the driver profile needs. The driver record and the first page
 * of results load in parallel; remaining pages (veterans have 300+ starts)
 * load in parallel after that, instead of one-by-one.
 */
export const fetchDriver = async (driverId, { signal }) => {
  const id = encodeURIComponent(driverId);
  const PAGE = 100;
  const resultsUrl = `${BASE}/drivers/${id}/results.json`;

  const [driverData, firstPage] = await Promise.all([
    getJson(`${BASE}/drivers/${id}.json`, { signal }),
    getJson(resultsUrl, { signal, params: { limit: PAGE, offset: 0 } }),
  ]);

  const driver = driverData.MRData.DriverTable.Drivers[0];
  if (!driver) throw new NotFoundError("Driver not found");

  const total = Number(firstPage.MRData.total);
  const offsets = [];
  for (let offset = PAGE; offset < total; offset += PAGE) offsets.push(offset);
  const rest = await Promise.all(
    offsets.map((offset) =>
      getJson(resultsUrl, { signal, params: { limit: PAGE, offset } })
    )
  );

  return {
    driver,
    races: [firstPage, ...rest].flatMap(races),
  };
};
