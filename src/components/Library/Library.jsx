/**
 * Library — Displays the authenticated user's saved books.
 *
 * Reads library state from LibraryContext so it stays in sync with
 * the rest of the app without prop drilling. Triggers a fresh fetch
 * on mount so the list is always up to date when the page loads.
 *
 * Layout:
 *   ┌──────────────────────────────────────┐
 *   │  h1 "My Library"                     │
 *   │  BookGrid  (or empty / loading /     │
 *   │            error state)              │
 *   └──────────────────────────────────────┘
 *
 * Route: /library  (protected — requires login)
 */

import { useContext, useEffect } from "react";
import { LibraryContext } from "../../contexts/LibraryContext";
import BookGrid from "../BookGrid/BookGrid";
import Loading from "../Loading/Loading";
import "./Library.css";

// Module-scope no-op keeps prop defaults stable
const noop = () => {};

/**
 * Props:
 *   onPreview           {Function} Open BookPreviewModal for a book
 *   onAddToLibrary      {Function} Add a book (passed through to BookGrid)
 *   onRemoveFromLibrary {Function} Remove a book
 */
function Library({
  onPreview = noop,
  onAddToLibrary = noop,
  onRemoveFromLibrary = noop,
}) {
  const { savedBooks, savedBookIds, isLoading, error, fetchLibrary } =
    useContext(LibraryContext);

  // Fetch on mount so the list is fresh every time the page is visited
  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  return (
    <main className="library">
      <h1 className="library__heading">My Library</h1>

      {/* Loading */}
      {isLoading && (
        <div role="status" aria-label="Loading library">
          <Loading />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <p className="library__error" role="alert">
          {error}
        </p>
      )}

      {/* Empty state */}
      {!isLoading && !error && savedBooks.length === 0 && (
        <p className="library__empty">
          Your library is empty. Save books from the home or search pages to see
          them here.
        </p>
      )}

      {/* Book grid */}
      {!isLoading && !error && savedBooks.length > 0 && (
        <BookGrid
          books={savedBooks}
          isLoggedIn
          savedBookIds={savedBookIds}
          onPreview={onPreview}
          onAddToLibrary={onAddToLibrary}
          onRemoveFromLibrary={onRemoveFromLibrary}
        />
      )}
    </main>
  );
}

export default Library;
