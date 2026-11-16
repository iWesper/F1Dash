// Shared date/session helpers for race data from Jolpica.

// Session keys -> labels. Order doesn't matter: sessions are sorted by their
// own date/time so sprint weekends render correctly.
const SESSION_LABELS = {
  FirstPractice: "FP1",
  SecondPractice: "FP2",
  ThirdPractice: "FP3",
  SprintQualifying: "Sprint Quali",
  SprintShootout: "Sprint Shootout",
  Sprint: "Sprint",
  Qualifying: "Qualifying",
};

// Rough session lengths, used only to decide whether one is "live".
const DURATION_MIN = { Race: 120, Sprint: 45, default: 60 };

/** A session's date plus its separate UTC time (trailing Z). Missing times default to midnight UTC. */
export const toDate = (date, time) => new Date(`${date}T${time || "00:00:00Z"}`);

export const raceStart = (race) => toDate(race.date, race.time);

export const getSessions = (race) => {
  const list = Object.keys(SESSION_LABELS)
    .filter((key) => race[key]?.date)
    .map((key) => ({
      key,
      label: SESSION_LABELS[key],
      start: toDate(race[key].date, race[key].time),
      hasTime: Boolean(race[key].time),
    }));
  list.push({
    key: "Race",
    label: "Race",
    start: raceStart(race),
    hasTime: Boolean(race.time),
    isRace: true,
  });
  return list
    .sort((a, b) => a.start - b.start)
    .map((s) => ({
      ...s,
      end: new Date(s.start.getTime() + (DURATION_MIN[s.label] ?? DURATION_MIN.default) * 60000),
    }));
};

/** "upcoming" | "live" | "done" for a session at `now`. */
export const sessionStatus = (session, now) =>
  now < session.start ? "upcoming" : now < session.end ? "live" : "done";

// Every formatter takes an optional IANA timeZone; omitted = viewer's zone.
export const fmtDay = (dt, timeZone) =>
  dt.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone });

export const fmtDate = (dt, timeZone) =>
  dt.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  });

export const fmtTime = (dt, timeZone) =>
  dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", timeZone });

/** Hour of day (0–23) for a date in a given zone. */
export const hourIn = (dt, timeZone) =>
  Number(
    new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone }).format(dt)
  );

/** Calendar date (YYYY-MM-DD) for a date in a given zone. */
export const ymdIn = (dt, timeZone) =>
  new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).format(dt);

export const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** Split a positive millisecond span into countdown parts. */
export const countdownParts = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
};

/** Short human relative label: "in 3 days", "2 hours ago". */
export const relativeTime = (date, now = new Date()) => {
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const diff = (date - now) / 1000;
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return rtf.format(0, "minute");
};

/** Local YYYY-MM-DD for an API date string (weather lookups key on this). */
export const ymd = (date) => date.slice(0, 10);

export const shortName = (driver) =>
  driver ? `${driver.givenName.charAt(0)}. ${driver.familyName}` : "";

/** "Las Vegas Grand Prix" -> ["Las Vegas", " Grand Prix"] for accent styling. */
export const splitRaceName = (name) => {
  const m = name.match(/^(.*?)(\s+Grand Prix.*)$/);
  return m ? [m[1], m[2]] : [name, ""];
};

/**
 * Where the season is relative to the race week. Drives what the dashboard
 * leads with.
 *  "weekend"   from 36h before the first session until the race ends
 *  "result"    for three days after a race
 *  "buildup"   any other time with a race still to come
 *  "offseason" nothing left to run
 */
export const racePhase = ({ next, lastStart, now }) => {
  if (!next) return "offseason";
  const sessions = getSessions(next);
  const opens = new Date(sessions[0].start.getTime() - 36 * 3600000);
  const closes = sessions[sessions.length - 1].end;
  if (now >= opens && now <= closes) return "weekend";
  if (lastStart && now - lastStart < 3 * 86400000 + 2 * 3600000) return "result";
  return "buildup";
};
