import { getJson, MissingKeyError, NotFoundError } from "./http";

const WEATHER_KEY = import.meta.env.REACT_APP_WEATHER_API_KEY;
const NEWS_KEY = import.meta.env.REACT_APP_NEWS_API_KEY;
const YOUTUBE_KEY = import.meta.env.REACT_APP_YOUTUBE_API_KEY;

export const weatherEnabled = Boolean(WEATHER_KEY);

// ---- Weather (WorldWeatherOnline) ------------------------------------------

/**
 * Hour-by-hour forecast for a location and date. Hours are in the
 * location's own local time (0–23). Forecasts only exist ~14 days ahead;
 * outside that window the API answers 200 with an error body, which we
 * surface as NotFoundError.
 */
export const fetchHourlyForecast = async ({ lat, lng, date }, { signal }) => {
  if (!WEATHER_KEY) throw new MissingKeyError("Weather");
  const data = await getJson("https://api.worldweatheronline.com/premium/v1/weather.ashx", {
    signal,
    params: { q: `${lat},${lng}`, date, tp: 1, format: "json", key: WEATHER_KEY },
  });
  const day = data?.data?.weather?.[0];
  if (!day?.hourly?.length) throw new NotFoundError("No forecast for that date yet");
  return day.hourly.map((h) => ({
    hour: Math.round(Number(h.time) / 100),
    tempC: Number(h.tempC),
    windKmph: Number(h.windspeedKmph),
    rainChance: Number(h.chanceofrain ?? 0),
    rainMm: Number(h.precipMM ?? 0),
  }));
};

// ---- News (webz.io News API Lite) ------------------------------------------

export const fetchNews = async ({ signal }) => {
  if (!NEWS_KEY) throw new MissingKeyError("News");
  const data = await getJson("https://api.webz.io/newsApiLite", {
    signal,
    params: { token: NEWS_KEY, q: "site:formula1.com" },
  });
  // The feed often repeats an article (one post per syndicated copy).
  const seen = new Set();
  return (data.posts ?? []).filter((post) => {
    const key = post.title?.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ---- Videos (YouTube Data API) ---------------------------------------------

const F1_CHANNEL_ID = "UCB_qr75-ydFVKSF9Dmo6izg";
// Every channel has an "uploads" playlist whose id is the channel id with
// UC -> UU. Reading it costs 1 quota unit, versus 100 for a search call.
const F1_UPLOADS = `UU${F1_CHANNEL_ID.slice(2)}`;

export const fetchVideos = async ({ signal }) => {
  if (!YOUTUBE_KEY) throw new MissingKeyError("Videos");
  const data = await getJson("https://www.googleapis.com/youtube/v3/playlistItems", {
    signal,
    params: { part: "snippet", playlistId: F1_UPLOADS, maxResults: 50, key: YOUTUBE_KEY },
  });

  return (data.items ?? [])
    .map(({ snippet }) => ({
      id: snippet.resourceId?.videoId,
      title: snippet.title,
      publishedAt: snippet.publishedAt,
      thumb:
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        snippet.thumbnails?.default?.url,
    }))
    .filter((v) => {
      if (!v.id || !v.thumb) return false; // private/deleted uploads
      // Heuristic Shorts filter: the uploads feed mixes them in, and they
      // usually carry emoji or #shorts in the title.
      const hasEmoji = /\p{Extended_Pictographic}/u.test(v.title);
      return !hasEmoji && !v.title.toLowerCase().includes("#shorts");
    })
    .slice(0, 6);
};

// ---- Driver photos (Wikipedia) ---------------------------------------------

/**
 * Lead image for a Wikipedia article. Jolpica gives each driver their
 * Wikipedia URL, which disambiguates names ("George_Russell_(racing_driver)")
 * far better than guessing from given/family name. Wikipedia supports
 * anonymous CORS via origin=*.
 */
export const fetchWikiImage = async (wikiUrl, { signal }) => {
  const title = decodeURIComponent(wikiUrl.split("/wiki/")[1] ?? "");
  if (!title) return null;
  const data = await getJson("https://en.wikipedia.org/w/api.php", {
    signal,
    params: {
      action: "query",
      prop: "pageimages",
      format: "json",
      piprop: "thumbnail",
      pithumbsize: 480,
      redirects: 1,
      origin: "*",
      titles: title,
    },
  });
  const pages = data?.query?.pages ?? {};
  return Object.values(pages)[0]?.thumbnail?.source ?? null;
};
