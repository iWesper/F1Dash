// Thin fetch wrapper. Replaces axios: every call here is a plain JSON GET,
// so the browser's fetch covers it without the extra ~20 KB gzipped.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/** Thrown when a feature can't run because its API key isn't configured. */
export class MissingKeyError extends Error {
  constructor(service) {
    super(`${service} isn't configured`);
    this.name = "MissingKeyError";
  }
}

/** Thrown when the API answered but the thing asked for doesn't exist. */
export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export async function getJson(url, { signal, params } = {}) {
  const target = new URL(url);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) target.searchParams.set(k, v);
    }
  }
  const res = await fetch(target, { signal });
  if (!res.ok) throw new HttpError(res.status, `Request failed (${res.status})`);
  return res.json();
}

/**
 * Retry policy shared by every query: retry transient failures (network,
 * 429 rate limits, 5xx) a couple of times, never retry config/404 errors.
 */
export const shouldRetry = (failureCount, error) => {
  if (error instanceof MissingKeyError || error instanceof NotFoundError) return false;
  if (error instanceof HttpError && error.status < 500 && error.status !== 429) return false;
  return failureCount < 2;
};

// Exponential backoff; Jolpica's burst limit is ~4 req/s, so start at 1.2 s.
export const retryDelay = (attempt) => Math.min(1200 * 2 ** attempt, 8000);
