/**
 * books.service.js — Google Books API service
 *
 * Provides functions for interacting with the Google Books REST API:
 *   - Full-text book search
 *   - Section/category fetches (Trending, New, Philosophy, Romance, Technology)
 *   - Single book detail lookup
 *
 * All responses are normalised through `mapBookVolume` into a consistent
 * internal Book shape with guaranteed fallback values.
 *
 * Uses the Fetch API directly (not ApiClient) because this service targets
 * an external third-party API, not the project's own backend.
 */

const BASE_URL = "https://www.googleapis.com/books/v1";

/**
 * API key loaded from Vite environment variables.
 * Optional — requests still work without a key but are rate-limited.
 */
const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

// ---------------------------------------------------------------------------
// Section query definitions
// Each entry maps a human-readable section name to a Google Books query.
// ---------------------------------------------------------------------------

const SECTION_QUERIES = {
  trending: { q: "subject:fiction", orderBy: "relevance" },
  new: { q: "subject:fiction", orderBy: "newest" },
  philosophy: { q: "subject:philosophy", orderBy: "relevance" },
  romance: { q: "subject:romance", orderBy: "relevance" },
  technology: { q: "subject:computers", orderBy: "relevance" },
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Appends the Google Books API key to the given URL when one is configured.
 * This is a side-effectful mutation — `url` is modified in place.
 *
 * @param {URL} url - The URL object to append the key to
 */
function appendApiKey(url) {
  if (API_KEY) {
    url.searchParams.set("key", API_KEY);
  }
}

/**
 * Fetches a Google Books API URL and returns an array of normalised Book objects.
 * Throws if the HTTP response is not OK.
 *
 * @param {URL} url - A fully constructed Google Books API URL
 * @returns {Promise<Object[]>} Array of normalised book objects
 * @throws {Error} On non-2xx HTTP status
 */
async function fetchVolumes(url) {
  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status}`);
  }

  const data = await response.json();

  // `items` is absent when the API returns zero results
  return (data.items ?? []).map(mapBookVolume);
}

// ---------------------------------------------------------------------------
// Public mapper (exported for unit testing)
// ---------------------------------------------------------------------------

/**
 * Maps a raw Google Books Volume object to the application's internal Book shape.
 *
 * All fields have explicit fallback values so callers never encounter `undefined`.
 * Thumbnails served over HTTP are upgraded to HTTPS to avoid mixed-content issues.
 *
 * @param {Object} volume - Raw volume item from the Google Books API response
 * @param {string} [volume.id] - Google Books volume ID
 * @param {Object} [volume.volumeInfo] - Bibliographic metadata
 * @param {Object} [volume.accessInfo] - Availability and access metadata
 * @returns {{
 *   googleBookId: string,
 *   title: string,
 *   authors: string[],
 *   description: string,
 *   thumbnail: string,
 *   categories: string[],
 *   language: string,
 *   publishedDate: string,
 *   embeddable: boolean,
 *   viewability: string,
 *   publicDomain: boolean,
 *   webReaderLink: string,
 * }} Normalised book object
 */
export function mapBookVolume(volume) {
  const info = volume.volumeInfo ?? {};
  const access = volume.accessInfo ?? {};

  // Upgrade HTTP thumbnail URLs to HTTPS to avoid mixed-content browser warnings
  const rawThumbnail = info.imageLinks?.thumbnail ?? "";
  const thumbnail = rawThumbnail.replace(/^http:\/\//i, "https://");

  return {
    googleBookId: volume.id ?? "",
    title: info.title ?? "Unknown Title",
    authors: info.authors ?? [],
    description: info.description ?? "",
    thumbnail,
    categories: info.categories ?? [],
    language: info.language ?? "",
    publishedDate: info.publishedDate ?? "",
    embeddable: access.embeddable ?? false,
    viewability: access.viewability ?? "NO_PAGES",
    publicDomain: access.publicDomain ?? false,
    webReaderLink: access.webReaderLink ?? "",
  };
}

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

export const booksService = {
  /**
   * Searches for books matching the given query string.
   *
   * @param {string} query - Search terms (title, author, ISBN, etc.)
   * @param {Object} [options]
   * @param {number} [options.maxResults=20] - Maximum results to return (1–40)
   * @param {number} [options.startIndex=0] - Zero-based pagination offset
   * @returns {Promise<Object[]>} Array of normalised book objects
   * @throws {Error} On API error
   */
  async search(query, { maxResults = 20, startIndex = 0 } = {}) {
    const url = new URL(`${BASE_URL}/volumes`);
    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("startIndex", String(startIndex));
    appendApiKey(url);
    return fetchVolumes(url);
  },

  /**
   * Fetches books for a named home-page section.
   *
   * Valid section names: 'trending', 'new', 'philosophy', 'romance', 'technology'.
   *
   * @param {string} section - Section name (key of SECTION_QUERIES)
   * @param {Object} [options]
   * @param {number} [options.maxResults=12] - Maximum results to return
   * @returns {Promise<Object[]>} Array of normalised book objects
   * @throws {Error} For unknown section names or API errors
   */
  async fetchSection(section, { maxResults = 12 } = {}) {
    const config = SECTION_QUERIES[section];

    if (!config) {
      throw new Error(`Unknown book section: "${section}"`);
    }

    const url = new URL(`${BASE_URL}/volumes`);
    url.searchParams.set("q", config.q);
    url.searchParams.set("orderBy", config.orderBy);
    url.searchParams.set("maxResults", String(maxResults));
    appendApiKey(url);
    return fetchVolumes(url);
  },

  /**
   * Fetches full details for a single book by its Google Books volume ID.
   *
   * @param {string} googleBookId - Google Books volume ID (e.g. "zyTCAlFPjgYC")
   * @returns {Promise<Object>} Normalised book object
   * @throws {Error} On API error or non-existent ID
   */
  async getById(googleBookId) {
    // encodeURIComponent prevents injection via crafted IDs
    const url = new URL(
      `${BASE_URL}/volumes/${encodeURIComponent(googleBookId)}`,
    );
    appendApiKey(url);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const volume = await response.json();
    return mapBookVolume(volume);
  },
};
