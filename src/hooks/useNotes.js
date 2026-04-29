/**
 * useNotes — Custom hook for managing notes for a single book.
 *
 * Owns all note state and operations:
 *   - notes:       array of note objects for the current book
 *   - isLoading:   true while the initial fetch is in flight
 *   - error:       error message from the last failed operation (null when none)
 *   - fetchNotes:  loads notes from the backend for a given googleBookId
 *   - addNote:     optimistic add → POST /notes
 *   - updateNote:  optimistic update → PATCH /notes/:noteId
 *   - removeNote:  optimistic remove → DELETE /notes/:noteId
 *   - clearNotes:  resets state (call when navigating away from a book)
 *
 * Optimistic updates give instant UI feedback:
 *   1. Update local state immediately.
 *   2. Send the API request in the background.
 *   3. Roll back on failure and surface an error message.
 *
 * For addNote a temporary ID is used until the server responds with the
 * canonical _id. The temp note is replaced — not appended — on success.
 */

import { useState, useCallback } from "react";
import { notesService } from "../services/notes.service";

/**
 * @returns {{
 *   notes: Object[],
 *   isLoading: boolean,
 *   error: string|null,
 *   fetchNotes: (googleBookId: string) => Promise<void>,
 *   addNote: (noteData: Object) => Promise<void>,
 *   updateNote: (noteId: string, changes: Object) => Promise<void>,
 *   removeNote: (noteId: string) => Promise<void>,
 *   clearNotes: () => void,
 * }}
 */
export const useNotes = () => {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all notes for a book from the backend.
   * Should be called when the user (re-)opens the reader while authenticated.
   *
   * @param {string} googleBookId - Google Books volume ID.
   */
  const fetchNotes = useCallback(async (googleBookId) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await notesService.getByBook(googleBookId);
      setNotes(data ?? []);
    } catch (err) {
      setError(err.message || "Failed to load notes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add a note with an optimistic update.
   *
   * A temporary note (with a client-generated _id) is shown immediately.
   * On success the temp entry is replaced by the server-confirmed note.
   * On failure the temp entry is removed and an error is set.
   *
   * @param {Object} noteData - { googleBookId, pageNumber, title, content }
   */
  const addNote = useCallback(async (noteData) => {
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const tempNote = {
      ...noteData,
      _id: tempId,
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic add — show note immediately
    setNotes((prev) => [tempNote, ...prev]);

    try {
      const saved = await notesService.create(noteData);
      // Replace the temp note with the server-confirmed version
      setNotes((prev) => prev.map((n) => (n._id === tempId ? saved : n)));
    } catch (err) {
      // Rollback — remove temp note
      setNotes((prev) => prev.filter((n) => n._id !== tempId));
      setError(err.message || "Failed to save note.");
      throw err;
    }
  }, []);

  /**
   * Update a note with an optimistic update.
   *
   * Local state is updated immediately. The snapshot captured before the
   * update is used to roll back if the API call fails.
   *
   * @param {string} noteId   - The note's _id.
   * @param {Object} changes  - Partial update: { pageNumber?, title?, content? }
   */
  const updateNote = useCallback(
    async (noteId, changes) => {
      // Capture snapshot for rollback before the optimistic update
      const snapshot = notes;
      const updatedAt = new Date().toISOString();

      setNotes((prev) =>
        prev.map((n) =>
          n._id === noteId ? { ...n, ...changes, updatedAt } : n,
        ),
      );

      try {
        const updated = await notesService.update(noteId, changes);
        // Replace with the server's canonical version
        setNotes((prev) => prev.map((n) => (n._id === noteId ? updated : n)));
      } catch (err) {
        // Rollback to the pre-update snapshot
        setNotes(snapshot);
        setError(err.message || "Failed to update note.");
        throw err;
      }
    },
    [notes],
  );

  /**
   * Remove a note with an optimistic update.
   *
   * The note is removed from local state immediately. If the API call fails
   * the full list is restored from the snapshot taken before removal.
   *
   * @param {string} noteId - The note's _id.
   */
  const removeNote = useCallback(
    async (noteId) => {
      // Snapshot for rollback
      const snapshot = notes;
      // Optimistic remove
      setNotes((prev) => prev.filter((n) => n._id !== noteId));

      try {
        await notesService.remove(noteId);
      } catch (err) {
        // Rollback
        setNotes(snapshot);
        setError(err.message || "Failed to delete note.");
      }
    },
    [notes],
  );

  /**
   * Clear all local note state.
   * Should be called when navigating away from the reader.
   */
  const clearNotes = useCallback(() => {
    setNotes([]);
    setError(null);
  }, []);

  return {
    notes,
    isLoading,
    error,
    fetchNotes,
    addNote,
    updateNote,
    removeNote,
    clearNotes,
  };
};
