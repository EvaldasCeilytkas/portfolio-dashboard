const responseCache = new Map();
const pendingRequests = new Map();

const DEFAULT_TTL = 60_000;

function createAbortError() {
  try {
    return new DOMException("Užklausa nutraukta.", "AbortError");
  } catch {
    const error = new Error("Užklausa nutraukta.");
    error.name = "AbortError";
    return error;
  }
}

function assertNotAborted(signal) {
  if (signal?.aborted) throw createAbortError();
}

function getCached(url, ttl) {
  const cached = responseCache.get(url);
  if (!cached) return null;

  if (Date.now() - cached.createdAt > ttl) {
    responseCache.delete(url);
    return null;
  }

  return cached.value;
}

/**
 * Loads JSON with a short-lived in-memory cache and request de-duplication.
 * The cache lives only until the browser tab is refreshed, therefore a normal
 * reload after Sync always gets the newly published files.
 */
export async function requestJson(
  url,
  { signal, ttl = DEFAULT_TTL, force = false, optional = false } = {},
) {
  assertNotAborted(signal);

  if (!force) {
    const cached = getCached(url, ttl);
    if (cached !== null) return cached;
  }

  let pending = pendingRequests.get(url);

  if (!pending || force) {
    pending = fetch(url, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          if (optional) return null;
          throw new Error(`${url.split("/").pop()} nepavyko įkelti (${response.status}).`);
        }
        try {
          return await response.json();
        } catch (error) {
          if (optional) return null;
          throw error;
        }
      })
      .then((value) => {
        if (value !== null) {
          responseCache.set(url, { value, createdAt: Date.now() });
        }
        return value;
      })
      .finally(() => {
        if (pendingRequests.get(url) === pending) pendingRequests.delete(url);
      });

    pendingRequests.set(url, pending);
  }

  const value = await pending;
  assertNotAborted(signal);
  return value;
}

export function invalidateJsonCache(match) {
  if (!match) {
    responseCache.clear();
    return;
  }

  for (const key of responseCache.keys()) {
    const shouldDelete =
      typeof match === "function" ? match(key) : String(key).includes(String(match));
    if (shouldDelete) responseCache.delete(key);
  }
}

export function getJsonCacheStats() {
  return {
    cachedResponses: responseCache.size,
    pendingRequests: pendingRequests.size,
  };
}
