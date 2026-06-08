/**
 * notesService — API service for book notes.
 *
 * Communicates with the backend notes endpoints:
 *   GET    /notes                 — fetch all notes for the authenticated user
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
   * Fetch all notes for the authenticated user across all books.
   * @returns {Promise<Object[]>} Array of note objects.
   */
  async getAllNotes() {
    const res = await apiClient.get("/notes");
    return res.data ?? [];
  },

  /**
   * Fetch all notes for a specific book.
   * @param {string} googleBookId - Google Books volume ID.
   * @returns {Promise<Object[]>} Array of note objects.
   */
  async getByBook(googleBookId) {
    const res = await apiClient.get(
      `/notes/${encodeURIComponent(googleBookId)}`,
    );
    return res.data ?? [];
  },

  /**
   * Create a new note.
   * @param {Object} note - Note data: { googleBookId, pageNumber, title, content }.
   * @returns {Promise<Object>} The saved note object from the server.
   */
  async create(note) {
    const res = await apiClient.post("/notes", note);
    return res.data;
  },

  /**
   * Update an existing note by ID.
   * @param {string} noteId   - The note's _id.
   * @param {Object} changes  - Partial note data: { pageNumber?, title?, content? }.
   * @returns {Promise<Object>} The updated note object from the server.
   */
  async update(noteId, changes) {
    const res = await apiClient.patch(
      `/notes/${encodeURIComponent(noteId)}`,
      changes,
    );
    return res.data;
  },

  /**
   * Delete a note by ID.
   * @param {string} noteId - The note's _id.
   * @returns {Promise<void>}
   */
  async remove(noteId) {
    await apiClient.delete(`/notes/${encodeURIComponent(noteId)}`);
  },
};
