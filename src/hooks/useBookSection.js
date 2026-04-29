/**
 * useBookSection — fetches and manages books for a single named home-page section.
 *
 * Encapsulates the loading/error/data lifecycle so BookSection stays a
 * pure rendering component with no async concerns.
 *
 * @param {string} sectionKey - One of the section keys recognised by booksService
 *   (e.g. "trending", "new", "philosophy", "romance", "technology")
 * @returns {{ books: Object[], isLoading: boolean, error: string|null }}
 */

import { useState, useEffect } from "react";
import { booksService } from "../services/books.service";

export function useBookSection(sectionKey) {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cancellation flag — prevents state updates on an unmounted component
    let cancelled = false;

    // Canonical async data-fetching pattern: set loading flag synchronously
    // before the async call so the UI reflects the in-flight state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError(null);

    booksService
      .fetchSection(sectionKey)
      .then((data) => {
        if (!cancelled) setBooks(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load books.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sectionKey]);

  return { books, isLoading, error };
}
