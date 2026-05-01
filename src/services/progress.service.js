/**
 * API service for authenticated reading progress.
 *
 * Backend routes:
 * - GET /progress/:googleBookId: retrieve saved page number for a book.
 * - PUT /progress/:googleBookId: create or update saved page number.
 *
 * The GET endpoint returns 404 when no progress has been saved. This service
 * maps that case to null so hook callers can handle "no progress" directly.
 */

import ApiClient from "../utils/apiClient";

/** Shared ApiClient instance; reads base URL from Vite env at module load. */
const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL ?? "");

export const progressService = {
  /**
   * Retrieve the saved page number for a book.
   * @param {string} googleBookId - Google Books volume id.
   * @returns {Promise<number|null>} Saved page number, or null if none exists.
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
   * Persist the current page number for a book.
   * @param {string} googleBookId - Google Books volume id.
   * @param {number} pageNumber - Current page number.
   * @returns {Promise<Object>} Saved progress record from the backend.
   */
  async saveProgress(googleBookId, pageNumber) {
    const res = await apiClient.put(
      `/progress/${encodeURIComponent(googleBookId)}`,
      { pageNumber },
    );
    return res.data;
  },
};
