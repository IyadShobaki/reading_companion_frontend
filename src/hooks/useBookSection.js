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
import { getCached, setCached } from "../utils/bookCache";

export function useBookSection(sectionKey) {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Cancellation flag — prevents state updates on an unmounted component
    let cancelled = false;

    const cacheKey = `rc_books_${sectionKey}`;
    const cached = getCached(cacheKey);

    // Cache hit: populate from localStorage without a network request.
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBooks(cached);
      setIsLoading(false);
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    // Cache miss or expired: fetch from the network.
    // Canonical async data-fetching pattern: set loading flag synchronously
    // before the async call so the UI reflects the in-flight state.
    setIsLoading(true);
    setError(null);

    booksService
      .fetchSection(sectionKey)
      .then((data) => {
        if (!cancelled) {
          setCached(cacheKey, data);
          setBooks(data);
        }
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
