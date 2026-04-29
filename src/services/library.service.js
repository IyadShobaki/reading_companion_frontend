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

/**
 * Converts a book object from the frontend (arrays) to the backend format
 * (comma-joined strings) for authors and categories.
 */
function normalizeForBackend(book) {
  return {
    ...book,
    authors: Array.isArray(book.authors)
      ? book.authors.join(", ")
      : (book.authors ?? ""),
    categories: Array.isArray(book.categories)
      ? book.categories.join(", ")
      : (book.categories ?? ""),
  };
}

/**
 * Converts a book object returned from the backend (string fields) back to
 * the frontend format (arrays) so the rest of the app works consistently.
 */
function normalizeFromBackend(book) {
  return {
    ...book,
    authors: book.authors
      ? book.authors
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    categories: book.categories
      ? book.categories
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  };
}

export const libraryService = {
  /**
   * Fetch all books saved in the current user's library.
   * Unwraps the `{ data: [...] }` envelope returned by the backend and
   * normalises string fields back to arrays for consistency with mapBookVolume.
   *
   * @returns {Promise<Object[]>} Array of saved book objects
   */
  async getAll() {
    const res = await apiClient.get("/library");
    return (res.data ?? []).map(normalizeFromBackend);
  },

  /**
   * Add a book to the current user's library.
   *
   * Sends the full normalised book payload so the backend can persist it
   * without making a second Google Books API call.
   * Converts array fields (authors, categories) to comma-joined strings as
   * required by the backend schema.
   *
   * @param {Object} book - Normalised book object (from mapBookVolume)
   * @returns {Promise<Object>} The newly saved book document
   */
  async add(book) {
    const payload = normalizeForBackend(book);
    const res = await apiClient.post("/library", payload);
    return res.data;
  },

  /**
   * Remove a book from the current user's library.
   *
   * @param {string} googleBookId - The Google Books volume ID
   * @returns {Promise<Object>} The deleted book document
   */
  async remove(googleBookId) {
    // DELETE /library/:id returns 204 No Content — no JSON body to parse.
    await apiClient.delete(`/library/${encodeURIComponent(googleBookId)}`);
  },
};
