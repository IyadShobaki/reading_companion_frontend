/**
 * progressService — API service for reading progress.
 *
 * Communicates with the backend progress endpoints:
 *   GET  /progress/:googleBookId  — retrieve saved page number for a book
 *   PUT  /progress/:googleBookId  — create or update saved page number
 *
 * Both requests are authenticated via the JWT injected by ApiClient.
 * The GET endpoint returns 404 (not an error) when no progress has been
 * saved yet — getProgress maps this to null so callers don't need to
 * catch 404 specifically.
 */

import ApiClient from "../utils/apiClient";

/** Shared ApiClient instance — reads base URL from Vite env at module load. */
const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL ?? "");

export const progressService = {
  /**
   * Retrieve the saved page number for a book.
   * Returns null when no progress has been saved yet (backend 404).
   *
   * @param {string} googleBookId - Google Books volume ID.
   * @returns {Promise<number|null>} Saved page number (≥ 1), or null if none.
   */
  async getProgress(googleBookId) {
    try {
      const res = await apiClient.get(
        `/progress/${encodeURIComponent(googleBookId)}`,
      );
      return res.data?.pageNumber ?? null;
    } catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  },

  /**
   * Persist the current page number for a book (upsert — creates or updates).
   *
   * @param {string} googleBookId - Google Books volume ID.
   * @param {number} pageNumber   - Current page number (≥ 1).
   * @returns {Promise<Object>} The saved progress record from the server.
   */
  async saveProgress(googleBookId, pageNumber) {
    const res = await apiClient.put(
      `/progress/${encodeURIComponent(googleBookId)}`,
      { pageNumber },
    );
    return res.data;
  },
};
