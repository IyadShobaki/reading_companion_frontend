import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import BookGrid from "../BookGrid/BookGrid";
import Loading from "../Loading/Loading";
import { booksService } from "../../services/books.service";
import { useDebounce } from "../../hooks/useDebounce";
import "./SearchResults.css";

// Module-scope no-op so prop default references are stable across renders
const noop = () => {};

const BATCH_SIZE = 12;

/**
 * SearchResults — displays paginated results for the current URL query param.
 *
 * Reads `?q=` from the URL so search queries are bookmarkable and shareable.
 * The query is debounced before triggering a fetch so that rapid URL changes
 * (e.g., the user typing and submitting quickly) do not fire stale requests.
 *
 * Props:
 *   isLoggedIn          {boolean}  Whether the user is authenticated
 *   savedBookIds        {string[]} IDs of books already in the user's library
 *   onAddToLibrary      {Function} Called with the full book object when adding
 *   onRemoveFromLibrary {Function} Called with googleBookId when removing
 */
function SearchResults({
  isLoggedIn = false,
  savedBookIds = [],
  onPreview = noop,
  onAddToLibrary = noop,
  onRemoveFromLibrary = noop,
}) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const debouncedQuery = useDebounce(query, 300);

  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [startIndex, setStartIndex] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Track the query the current results belong to so Load More requests stay
  // consistent when the query changes mid-flight
  const activeQueryRef = useRef(debouncedQuery);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    activeQueryRef.current = trimmed;

    // Nothing to fetch if the query is empty.
    if (!trimmed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBooks([]);
      setError(null);
      setIsLoading(false);
      setStartIndex(0);
      setHasMore(false);
      return;
    }

    let cancelled = false;

    setIsLoading(true);
    setError(null);
    setStartIndex(0);
    setHasMore(false);

    booksService
      .search(trimmed, { maxResults: BATCH_SIZE, startIndex: 0 })
      .then((data) => {
        if (!cancelled) {
          setBooks(data);
          setHasMore(data.length === BATCH_SIZE);
          setStartIndex(BATCH_SIZE);
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.message || "Failed to load search results.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleLoadMore = useCallback(() => {
    const trimmed = activeQueryRef.current;
    if (!trimmed || isLoadingMore) return;

    setIsLoadingMore(true);

    booksService
      .search(trimmed, { maxResults: BATCH_SIZE, startIndex })
      .then((data) => {
        setBooks((prev) => [...prev, ...data]);
        setHasMore(data.length === BATCH_SIZE);
        setStartIndex((prev) => prev + BATCH_SIZE);
      })
      .catch((err) => {
        setError(err.message || "Failed to load more results.");
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  }, [startIndex, isLoadingMore]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div role="status" aria-label="Loading search results">
          <Loading />
        </div>
      );
    }

    if (error) {
      return (
        <p
          className="search-results__message search-results__message_error"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      );
    }

    if (!debouncedQuery.trim()) {
      return (
        <p className="search-results__message" aria-live="polite">
          Enter a search term to find books.
        </p>
      );
    }

    if (books.length === 0) {
      return (
        <p className="search-results__message" aria-live="polite">
          No results found for &ldquo;{debouncedQuery}&rdquo;.
        </p>
      );
    }

    return (
      <>
        <BookGrid
          books={books}
          isLoggedIn={isLoggedIn}
          savedBookIds={savedBookIds}
          onPreview={onPreview}
          onAddToLibrary={onAddToLibrary}
          onRemoveFromLibrary={onRemoveFromLibrary}
        />
        {hasMore && (
          <div className="search-results__load-more">
            <button
              type="button"
              className="search-results__load-more-btn"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              aria-label="Load more search results"
            >
              {isLoadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
        {error && !isLoading && (
          <p
            className="search-results__message search-results__message_error"
            role="alert"
          >
            {error}
          </p>
        )}
      </>
    );
  };

  return (
    <main className="search-results">
      <h1 className="search-results__heading">
        {debouncedQuery.trim()
          ? `Results for "${debouncedQuery}"`
          : "Search Books"}
      </h1>
      {renderContent()}
    </main>
  );
}

export default SearchResults;
