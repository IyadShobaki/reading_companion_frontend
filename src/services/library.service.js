/**
 * library.service.js — Library API service
 *
 * Communicates with the backend library endpoints on behalf of authenticated
 * users. All methods require a valid JWT — ApiClient injects it automatically
 * from tokenManager.
 *
 * Backend routes (Step 13, not yet implemented):
 *   GET    /library              → list the current user's saved books
 *   POST   /library              → save a book to the library
 *   DELETE /library/:googleBookId → remove a book from the library
 */

import ApiClient from "../utils/apiClient";

const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL ?? "");

export const libraryService = {
  /**
   * Fetch all books saved in the current user's library.
   *
   * @returns {Promise<Object[]>} Array of saved book objects
   */
  async getAll() {
    return apiClient.get("/library");
  },

  /**
   * Add a book to the current user's library.
   *
   * Sends the full normalised book payload so the backend can persist it
   * without making a second Google Books API call.
   *
   * @param {Object} book - Normalised book object (from mapBookVolume)
   * @returns {Promise<Object>} The newly saved book document
   */
  async add(book) {
    return apiClient.post("/library", book);
  },

  /**
   * Remove a book from the current user's library.
   *
   * @param {string} googleBookId - The Google Books volume ID
   * @returns {Promise<Object>} The deleted book document
   */
  async remove(googleBookId) {
    return apiClient.delete(`/library/${encodeURIComponent(googleBookId)}`);
  },
};
