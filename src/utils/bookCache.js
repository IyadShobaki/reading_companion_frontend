/**
 * bookCache.js — localStorage cache utility for Google Books API responses.
 *
 * This is the ONLY module that reads or writes localStorage for book-section
 * caching. No component or hook may access localStorage directly for this
 * purpose.
 *
 * Cache entries are stored as JSON objects with the shape:
 *   { data: Book[], timestamp: number }
 *
 * An entry is considered valid when:
 *   - It exists in localStorage
 *   - Its JSON parses successfully
 *   - entry.data is an array
 *   - entry.timestamp is a finite number
 *   - Date.now() - entry.timestamp < CACHE_TTL_MS
 */

/** Cache time-to-live: 24 hours in milliseconds. */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Returns true when `entry` has a valid data array and a non-expired timestamp.
 * @param {unknown} entry
 * @returns {boolean}
 */
function isValidEntry(entry) {
  return (
    entry !== null &&
    typeof entry === "object" &&
    Array.isArray(entry.data) &&
    typeof entry.timestamp === "number" &&
    isFinite(entry.timestamp) &&
    Date.now() - entry.timestamp < CACHE_TTL_MS
  );
}

/**
 * Retrieve cached data for the given key.
 *
 * Returns the cached Book array if the entry exists and has not expired.
 * Returns `null` for any of the following:
 *   - Key absent from localStorage
 *   - Stored value is not valid JSON
 *   - `data` field is missing or not an array
 *   - `timestamp` field is missing or not a finite number
 *   - Entry has exceeded CACHE_TTL_MS
 *
 * @param {string} key
 * @returns {Array|null}
 */
export function getCached(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const entry = JSON.parse(raw);
    return isValidEntry(entry) ? entry.data : null;
  } catch {
    return null;
  }
}

/**
 * Write data to the cache under the given key with the current timestamp.
 * Silently swallows localStorage quota errors so the app never crashes on write.
 *
 * @param {string} key
 * @param {Array} data
 */
export function setCached(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // localStorage quota exceeded or unavailable — fail silently.
  }
}

/**
 * Remove a single cache entry.
 *
 * @param {string} key
 */
export function clearCached(key) {
  localStorage.removeItem(key);
}
