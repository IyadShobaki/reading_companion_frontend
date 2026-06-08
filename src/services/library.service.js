/**
 * Library API service for authenticated saved-book operations.
 *
 * Backend routes:
 * - GET /library: list the current user's saved books.
 * - POST /library: save a book to the library.
 * - DELETE /library/:googleBookId: remove a book from the library.
 */

import ApiClient from "../utils/apiClient";

const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL ?? "");

/**
 * Convert frontend book arrays to the backend's comma-joined string fields.
 * @param {Object} book - Normalized frontend book.
 * @returns {Object} Backend-ready saved-book payload.
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
 * Convert backend string fields back to frontend arrays.
 * @param {Object} book - Saved-book document from the backend.
 * @returns {Object} Frontend-ready saved-book object.
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
   * @returns {Promise<Object[]>} Saved books normalized for frontend use.
   */
  async getAll() {
    const res = await apiClient.get("/library");
    return (res.data ?? []).map(normalizeFromBackend);
  },

  /**
   * Add a book to the current user's library.
   * @param {Object} book - Normalized frontend book.
   * @returns {Promise<Object>} Saved book document from the backend.
   */
  async add(book) {
    const payload = normalizeForBackend(book);
    const res = await apiClient.post("/library", payload);
    return res.data;
  },

  /**
   * Remove a book from the current user's library.
   * @param {string} googleBookId - Google Books volume id.
   * @returns {Promise<void>}
   */
  async remove(googleBookId) {
    await apiClient.delete(`/library/${encodeURIComponent(googleBookId)}`);
  },
};
