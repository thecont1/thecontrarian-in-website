// data/loaders.js — fetch the 7 JSONs, cache them, expose typed accessors.
//
// Each function returns the parsed JSON. Cached after first call.
// Use `loadAll()` to warm the cache in parallel.

const FILES = {
  dailyByMode:        'daily-by-mode.json',
  modeShares:         'mode-shares.json',
  significantEvents:  'significant-events.json',
  anomalies:          'anomalies.json',
  stations:           'stations.geojson',
  hypothesisWindow:   'hypothesis-window.json',
  fareHikeWindow:     'fare-hike-window.json',
  dailyStats:         'daily-stats.json',
};

const cache = new Map();

function urlFor(filename) {
  // `import.meta.env.BASE_URL` is the Vite base (e.g. '/datastory/bangalore-metro-conspiracy-theory-scrolly/').
  // Resolves correctly in both dev and build.
  return `${import.meta.env.BASE_URL}data/${filename}`;
}

async function load(key) {
  if (cache.has(key)) return cache.get(key);
  const res = await fetch(urlFor(FILES[key]));
  if (!res.ok) throw new Error(`Failed to load ${FILES[key]}: ${res.status} ${res.statusText}`);
  const data = await res.json();
  cache.set(key, data);
  return data;
}

/**
 * Pre-fetch all 8 JSONs in parallel. Call this on init to warm the cache.
 * @returns {Promise<{dailyByMode, modeShares, significantEvents, anomalies, stations, hypothesisWindow, fareHikeWindow, dailyStats}>}
 */
export async function loadAll() {
  const entries = await Promise.all(
    Object.keys(FILES).map(async (key) => [key, await load(key)])
  );
  return Object.fromEntries(entries);
}

export const loadDailyByMode       = () => load('dailyByMode');
export const loadModeShares        = () => load('modeShares');
export const loadSignificantEvents = () => load('significantEvents');
export const loadAnomalies         = () => load('anomalies');
export const loadStations          = () => load('stations');
export const loadHypothesisWindow  = () => load('hypothesisWindow');
export const loadFareHikeWindow    = () => load('fareHikeWindow');
export const loadDailyStats        = () => load('dailyStats');
