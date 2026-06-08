import { useState, useCallback, useMemo, useRef } from "react";
import { libraryService } from "../services/library.service";
import { useToast } from "./useToast";

/**
 * Manage authenticated library state and optimistic save/remove operations.
 *
 * The hook does not fetch automatically. Callers load the library when a user
 * signs in or opens a view that needs the saved-books list.
 *
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
  const pendingAddIdsRef = useRef(new Set());
  const { showToast } = useToast();

  /**
   * Derived list of Google Books ids for cheap saved-state lookups.
   */
  const savedBookIds = useMemo(
    () => savedBooks.map((book) => book.googleBookId),
    [savedBooks],
  );

  /**
   * Load or reload the library from the backend.
   * @returns {Promise<void>}
   */
  const fetchLibrary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const books = await libraryService.getAll();
      setSavedBooks(books);
    } catch (err) {
      if (err.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else {
        setError(err.message || "Failed to load library.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Optimistically add a book, treating duplicate adds as no-ops.
   *
   * @param {Object} book - Full normalised book object.
   * @returns {Promise<void>}
   */
  const addBook = useCallback(
    async (book) => {
      const { googleBookId } = book;
      const alreadySaved = savedBooks.some(
        (savedBook) => savedBook.googleBookId === googleBookId,
      );

      if (alreadySaved || pendingAddIdsRef.current.has(googleBookId)) {
        return;
      }

      pendingAddIdsRef.current.add(googleBookId);
      setError(null);
      setSavedBooks((prev) =>
        prev.some((savedBook) => savedBook.googleBookId === googleBookId)
          ? prev
          : [...prev, book],
      );

      try {
        await libraryService.add(book);
      } catch (err) {
        setSavedBooks((prev) => prev.filter((savedBook) => savedBook !== book));
        if (err.status === 409) {
          setError("This book is already saved in your library.");
        } else if (err.status === 401) {
          setError("Your session has expired. Please sign in again.");
        } else {
          setError(err.message || "Failed to add book to library.");
        }
      } finally {
        pendingAddIdsRef.current.delete(googleBookId);
      }
    },
    [savedBooks],
  );

  /**
   * Optimistically remove a book, restoring the previous list on API failure.
   *
   * @param {string} googleBookId - Google Books volume id.
   * @returns {Promise<void>}
   */
  const removeBook = useCallback(
    async (googleBookId) => {
      const snapshot = savedBooks;
      setSavedBooks((prev) =>
        prev.filter((book) => book.googleBookId !== googleBookId),
      );

      try {
        await libraryService.remove(googleBookId);
        showToast("Book removed from library.", "success");
      } catch (err) {
        setSavedBooks(snapshot);
        if (err.status === 401) {
          setError("Your session has expired. Please sign in again.");
        } else if (err.status === 403) {
          setError("You don't have permission to remove this book.");
        } else {
          setError(err.message || "Failed to remove book from library.");
        }
      }
    },
    [savedBooks, showToast],
  );

  /**
   * Clear local library state, typically after logout.
   */
  const clearLibrary = useCallback(() => {
    setSavedBooks([]);
    setError(null);
    pendingAddIdsRef.current.clear();
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
