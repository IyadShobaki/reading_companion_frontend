/**
 * BookSection — Displays a titled section of books fetched for a given category.
 *
 * Delegates data fetching to the useBookSection hook so this component
 * is only responsible for rendering: loading indicator, error message,
 * empty-state feedback, or the BookGrid of results.
 *
 * Props:
 *   title               {string}   Human-readable section heading (e.g. "Trending")
 *   sectionKey          {string}   Key forwarded to booksService.fetchSection
 *   isLoggedIn          {boolean}  Forwarded to BookGrid → BookCard
 *   savedBookIds        {string[]} Forwarded to BookGrid → BookCard
 *   onAddToLibrary      {Function} Forwarded to BookGrid → BookCard
 *   onRemoveFromLibrary {Function} Forwarded to BookGrid → BookCard
 */

import { useBookSection } from "../../hooks/useBookSection";
import BookGrid from "../BookGrid/BookGrid";
import Loading from "../Loading/Loading";
import "./BookSection.css";

const noop = () => {};

function BookSection({
  title,
  sectionKey,
  isLoggedIn = false,
  savedBookIds = [],
  onPreview = noop,
  onAddToLibrary = noop,
  onRemoveFromLibrary = noop,
}) {
  const { books, isLoading, error } = useBookSection(sectionKey);

  return (
    <section className="book-section">
      <h2 className="book-section__title">{title}</h2>

      {isLoading && (
        /* role="status" announces loading activity to screen readers */
        <div
          className="book-section__loading"
          role="status"
          aria-label={`Loading ${title}`}
        >
          <Loading />
        </div>
      )}

      {!isLoading && error && (
        <p className="book-section__error" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      {!isLoading && !error && books.length === 0 && (
        <p className="book-section__empty" aria-live="polite">
          No books available in this section right now.
        </p>
      )}

      {!isLoading && !error && books.length > 0 && (
        <BookGrid
          books={books}
          isLoggedIn={isLoggedIn}
          savedBookIds={savedBookIds}
          onPreview={onPreview}
          onAddToLibrary={onAddToLibrary}
          onRemoveFromLibrary={onRemoveFromLibrary}
        />
      )}
    </section>
  );
}

export default BookSection;
