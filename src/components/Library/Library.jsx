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

import { useContext, useEffect, useState, useMemo } from "react";
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

  const [sortBy, setSortBy] = useState("date");

  // Client-side sort — no extra API calls needed
  const sortedBooks = useMemo(() => {
    const copy = [...savedBooks];
    if (sortBy === "title") {
      copy.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "author") {
      copy.sort((a, b) => {
        const authorA = a.authors[0] ?? "";
        const authorB = b.authors[0] ?? "";
        return authorA.localeCompare(authorB);
      });
    }
    // "date" keeps the original save order (newest first from backend)
    return copy;
  }, [savedBooks, sortBy]);

  // Fetch on mount so the list is fresh every time the page is visited
  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  return (
    <main className="library">
      <div className="library__toolbar">
        <div className="library__heading-group">
          <h1 className="library__heading">My Library</h1>
          <div className="library__stat-card">
            <p className="library__stat-value">{savedBooks.length}</p>
            <p className="library__stat-label">Books saved</p>
          </div>
        </div>
        {savedBooks.length > 1 && (
          <label htmlFor="library-sort" className="library__sort-label">
            Sort by
            <select
              id="library-sort"
              className="library__sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Date saved</option>
              <option value="title">Title A–Z</option>
              <option value="author">Author A–Z</option>
            </select>
          </label>
        )}
      </div>

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
          books={sortedBooks}
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
