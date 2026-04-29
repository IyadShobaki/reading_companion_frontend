/**
 * notesService — API service for book notes.
 *
 * Communicates with the backend notes endpoints:
 *   GET    /notes/:googleBookId   — fetch all notes for a book
 *   POST   /notes                 — create a new note
 *   PATCH  /notes/:noteId         — update an existing note
 *   DELETE /notes/:noteId         — delete a note
 *
 * All requests are authenticated via the JWT injected by ApiClient.
 */

import ApiClient from "../utils/apiClient";

/** Shared ApiClient instance — reads base URL from Vite env at module load. */
const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL ?? "");

export const notesService = {
  /**
   * Fetch all notes for a specific book.
   * @param {string} googleBookId - Google Books volume ID.
   * @returns {Promise<Object[]>} Array of note objects.
   */
  async getByBook(googleBookId) {
    return apiClient.get(`/notes/${encodeURIComponent(googleBookId)}`);
  },

  /**
   * Create a new note.
   * @param {Object} note - Note data: { googleBookId, pageNumber, title, content }.
   * @returns {Promise<Object>} The saved note object from the server.
   */
  async create(note) {
    return apiClient.post("/notes", note);
  },

  /**
   * Update an existing note by ID.
   * @param {string} noteId   - The note's _id.
   * @param {Object} changes  - Partial note data: { pageNumber?, title?, content? }.
   * @returns {Promise<Object>} The updated note object from the server.
   */
  async update(noteId, changes) {
    return apiClient.patch(`/notes/${encodeURIComponent(noteId)}`, changes);
  },

  /**
   * Delete a note by ID.
   * @param {string} noteId - The note's _id.
   * @returns {Promise<Object>} Server confirmation.
   */
  async remove(noteId) {
    return apiClient.delete(`/notes/${encodeURIComponent(noteId)}`);
  },
};
