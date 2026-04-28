/**
 * BookGrid — Renders a responsive grid of BookCard components.
 *
 * Receives an array of normalised book objects and forwards the shared
 * library-action props down to each card. The `isSaved` flag per card is
 * derived by checking whether the book's ID appears in `savedBookIds`.
 *
 * Props:
 *   books               {Object[]} Array of normalised book objects
 *   isLoggedIn          {boolean}  Whether the current user is authenticated
 *   savedBookIds        {string[]} IDs of books currently in the user's library
 *   onAddToLibrary      {Function} Forwarded to BookCard
 *   onRemoveFromLibrary {Function} Forwarded to BookCard
 */

import BookCard from "../BookCard/BookCard";
import "./BookGrid.css";

// Module-scope no-op defaults keep the component stable when props are omitted
const noop = () => {};

function BookGrid({
  books,
  isLoggedIn = false,
  savedBookIds = [],
  onAddToLibrary = noop,
  onRemoveFromLibrary = noop,
}) {
  return (
    <ul className="book-grid">
      {books.map((book) => (
        <li key={book.googleBookId} className="book-grid__item">
          <BookCard
            book={book}
            isLoggedIn={isLoggedIn}
            isSaved={savedBookIds.includes(book.googleBookId)}
            onAddToLibrary={onAddToLibrary}
            onRemoveFromLibrary={onRemoveFromLibrary}
          />
        </li>
      ))}
    </ul>
  );
}

export default BookGrid;
