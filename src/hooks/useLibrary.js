/**
 * useLibrary — Custom hook for managing the user's saved-books library.
 *
 * Owns all library state and operations:
 *   - savedBooks:    array of full normalised book objects
 *   - savedBookIds:  derived Set of googleBookIds for O(1) lookup
 *   - isLoading:     true while the initial fetch is in flight
 *   - error:         error message from the last failed operation
 *   - fetchLibrary:  (re-)loads the library from the backend
 *   - addBook:       optimistic add → POST /library
 *   - removeBook:    optimistic remove → DELETE /library/:id
 *
 * Optimistic updates give the UI instant feedback:
 *   1. Update local state immediately.
 *   2. Send the API request in the background.
 *   3. Roll back on failure and surface an error message.
 *
 * This hook does NOT fetch automatically. Callers (App.jsx) are
 * responsible for calling fetchLibrary() when the user logs in.
 */

import { useState, useCallback, useMemo } from "react";
import { libraryService } from "../services/library.service";

/**
 * @returns {{
 *   savedBooks: Object[],
 *   savedBookIds: string[],
 *   isLoading: boolean,
 *   error: string|null,
 *   fetchLibrary: () => Promise<void>,
 *   addBook: (book: Object) => Promise<void>,
 *   removeBook: (googleBookId: string) => Promise<void>,
 *   clearLibrary: () => void,
 * }}
 */
export const useLibrary = () => {
  const [savedBooks, setSavedBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Derived list of googleBookIds — recomputed only when savedBooks changes.
   * Passed to BookGrid/BookCard so `isSaved` derivation is a cheap array lookup.
   */
  const savedBookIds = useMemo(
    () => savedBooks.map((b) => b.googleBookId),
    [savedBooks],
  );

  /**
   * Load (or reload) the library from the backend.
   * Should be called after login and on library page mount.
   */
  const fetchLibrary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const books = await libraryService.getAll();
      setSavedBooks(books);
    } catch (err) {
      setError(err.message || "Failed to load library.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add a book to the library with optimistic update.
   * Rolls back the local state if the API call fails.
   *
   * @param {Object} book - Full normalised book object
   */
  const addBook = useCallback(async (book) => {
    // Optimistic update — add immediately
    setSavedBooks((prev) => [...prev, book]);
    try {
      await libraryService.add(book);
    } catch (err) {
      // Rollback
      setSavedBooks((prev) =>
        prev.filter((b) => b.googleBookId !== book.googleBookId),
      );
      setError(err.message || "Failed to add book to library.");
    }
  }, []);

  /**
   * Remove a book from the library with optimistic update.
   * Rolls back if the API call fails.
   *
   * @param {string} googleBookId - The Google Books volume ID
   */
  const removeBook = useCallback(
    async (googleBookId) => {
      // Snapshot for rollback
      const snapshot = savedBooks;
      // Optimistic update — remove immediately
      setSavedBooks((prev) =>
        prev.filter((b) => b.googleBookId !== googleBookId),
      );
      try {
        await libraryService.remove(googleBookId);
      } catch (err) {
        // Rollback
        setSavedBooks(snapshot);
        setError(err.message || "Failed to remove book from library.");
      }
    },
    [savedBooks],
  );

  /**
   * Clear all local library state.
   * Should be called on logout.
   */
  const clearLibrary = useCallback(() => {
    setSavedBooks([]);
    setError(null);
  }, []);

  return {
    savedBooks,
    savedBookIds,
    isLoading,
    error,
    fetchLibrary,
    addBook,
    removeBook,
    clearLibrary,
  };
};
