import { getJson, NotFoundError } from "./http";

// Jolpica is the Ergast-compatible successor (Ergast shut down early 2025)
// and supports CORS directly.
const BASE = "https://api.jolpi.ca/ergast/f1";

const races = (data) => data.MRData.RaceTable.Races;

// Jolpica allows ~4 requests/second. The dashboard asks for more than that
// at once, so every call takes a start slot spaced SLOT_MS apart instead of
// firing in a burst and relying on 429 retries.
const SLOT_MS = 270;
let nextSlot = 0;
const takeSlot = () => {
  const now = Date.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + SLOT_MS;
  return new Promise((resolve) => setTimeout(resolve, at - now));
};
const jolpica = async (path, opts) => {
  await takeSlot();
  return getJson(`${BASE}${path}`, opts);
};

export const fetchSchedule = async ({ signal }) =>
  races(await jolpica(`/current.json`, { signal, params: { limit: 100 } }));

/** Next race, or the season's last race when there's nothing left to run. */
export const fetchNextRace = async ({ signal }) => {
  const next = races(await jolpica(`/current/next.json`, { signal }));
  if (next.length > 0) return { race: next[0], isNext: true };
  const last = races(await jolpica(`/current/last.json`, { signal }));
  if (last.length === 0) throw new NotFoundError("No races this season yet");
  return { race: last[0], isNext: false };
};

export const fetchDriverStandings = async ({ signal }) => {
  const data = await jolpica(`/current/driverStandings.json`, { signal });
  const list = data.MRData.StandingsTable.StandingsLists[0];
  return {
    season: data.MRData.StandingsTable.season,
    round: list?.round,
    rows: list?.DriverStandings ?? [],
  };
};

export const fetchConstructorStandings = async ({ signal }) => {
  const data = await jolpica(`/current/constructorStandings.json`, { signal });
  const list = data.MRData.StandingsTable.StandingsLists[0];
  return {
    season: data.MRData.StandingsTable.season,
    round: list?.round,
    rows: list?.ConstructorStandings ?? [],
  };
};

/** Map of round -> winning Driver for every completed round this season. */
export const fetchSeasonWinners = async ({ signal }) => {
  const data = await jolpica(`/current/results/1.json`, {
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
  const data = await jolpica(`/circuits/${circuitId}/results/1.json`, {
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
  const resultsUrl = `/drivers/${id}/results.json`;

  const [driverData, firstPage] = await Promise.all([
    jolpica(`/drivers/${id}.json`, { signal }),
    jolpica(resultsUrl, { signal, params: { limit: PAGE, offset: 0 } }),
  ]);

  const driver = driverData.MRData.DriverTable.Drivers[0];
  if (!driver) throw new NotFoundError("Driver not found");

  const total = Number(firstPage.MRData.total);
  const offsets = [];
  for (let offset = PAGE; offset < total; offset += PAGE) offsets.push(offset);
  const rest = await Promise.all(
    offsets.map((offset) =>
      jolpica(resultsUrl, { signal, params: { limit: PAGE, offset } })
    )
  );

  return {
    driver,
    races: [firstPage, ...rest].flatMap(races),
  };
};

/** Driver positions after a given round: { driverId: position }. */
export const fetchStandingsAfter = async (round, { signal }) => {
  const data = await jolpica(`/current/${round}/driverStandings.json`, { signal });
  const list = data.MRData.StandingsTable.StandingsLists[0];
  const map = {};
  (list?.DriverStandings ?? []).forEach((row) => {
    map[row.Driver.driverId] = Number(row.position);
  });
  return map;
};

/** Full classification of the most recent race, with derived highlights. */
export const fetchLastRace = async ({ signal }) => {
  const race = races(await jolpica(`/current/last/results.json`, { signal }))[0];
  if (!race) throw new NotFoundError("No race has been run yet this season");
  const results = race.Results ?? [];
  const fastest = results.find((r) => r.FastestLap?.rank === "1");
  // Biggest climb from the grid; pit-lane starts report grid "0" and are skipped.
  let climber = null;
  results.forEach((r) => {
    const grid = Number(r.grid);
    const pos = Number(r.position);
    if (!grid || !/^\d+$/.test(r.positionText)) return;
    const gain = grid - pos;
    if (gain > 0 && (!climber || gain > climber.gain)) climber = { result: r, gain };
  });
  return { race, podium: results.slice(0, 3), results, fastest, climber };
};

const fetchAllPages = async (path, { signal }) => {
  const PAGE = 100;
  const first = await jolpica(path, { signal, params: { limit: PAGE, offset: 0 } });
  const pages = [first];
  const total = Number(first.MRData.total);
  for (let offset = PAGE; offset < total; offset += PAGE) {
    pages.push(await jolpica(path, { signal, params: { limit: PAGE, offset } }));
  }
  return pages.flatMap(races);
};

/**
 * Cumulative points after every completed round, for every driver.
 * Built from race + sprint results (about seven requests for a full season)
 * rather than one standings request per round.
 * Returns { rounds: [1, 2, …], drivers: [{ id, code, name, constructorId, cumulative: [] }] }
 * sorted by current total, highest first.
 */
export const fetchPointsProgression = async ({ signal }) => {
  const raceRows = await fetchAllPages(`/current/results.json`, { signal });
  const sprintRows = await fetchAllPages(`/current/sprint.json`, { signal });

  const perRound = new Map(); // round -> Map(driverId -> points)
  const drivers = new Map();
  const add = (round, list) => {
    const bucket = perRound.get(round) ?? new Map();
    perRound.set(round, bucket);
    (list ?? []).forEach((r) => {
      const id = r.Driver.driverId;
      bucket.set(id, (bucket.get(id) ?? 0) + (Number(r.points) || 0));
      // Later rows win, so the constructor is the driver's most recent team.
      drivers.set(id, {
        id,
        code: r.Driver.code ?? r.Driver.familyName.slice(0, 3).toUpperCase(),
        name: `${r.Driver.givenName} ${r.Driver.familyName}`,
        constructorId: r.Constructor.constructorId,
      });
    });
  };
  // A page boundary can split one race across two entries; add() merges them.
  raceRows.forEach((r) => add(Number(r.round), r.Results));
  sprintRows.forEach((r) => add(Number(r.round), r.SprintResults));

  const rounds = [...perRound.keys()].sort((a, b) => a - b);
  const out = [...drivers.values()].map((d) => {
    let total = 0;
    const cumulative = rounds.map((round) => {
      total += perRound.get(round).get(d.id) ?? 0;
      return total;
    });
    return { ...d, cumulative, total };
  });
  out.sort((a, b) => b.total - a.total);
  return { rounds, drivers: out };
};
