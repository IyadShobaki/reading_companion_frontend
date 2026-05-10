/**
 * RecentlySaved — horizontal scrollable ribbon of recently saved books.
 *
 * Displays up to MAX_ITEMS saved books, excluding the one already featured
 * in the ContinueReading hero so there is no repetition.
 *
 * Renders nothing when the library is loading or there are no eligible books.
 *
 * @param {string|null} excludeId - googleBookId of the book shown in the hero.
 * @param {Function}    onPreview - Opens BookPreviewModal for the clicked book.
 */

import { useContext } from "react";
import { Link } from "react-router-dom";
import { LibraryContext } from "../../contexts/LibraryContext";
import "./RecentlySaved.css";

const MAX_ITEMS = 6;
const noop = () => {};

function RecentlySaved({ excludeId = null, onPreview = noop }) {
  const { savedBooks, isLoading } = useContext(LibraryContext);

  const books = savedBooks
    .filter((b) => b.googleBookId !== excludeId)
    .slice(0, MAX_ITEMS);

  if (isLoading || books.length === 0) return null;

  return (
    <section className="recently-saved" aria-label="Recently saved books">
      <div className="recently-saved__header">
        <h2 className="recently-saved__label">Recently Saved</h2>
        <Link to="/library" className="recently-saved__view-all">
          View library &rarr;
        </Link>
      </div>

      <ul className="recently-saved__list">
        {books.map((book) => {
          const authorText =
            Array.isArray(book.authors) && book.authors.length > 0
              ? book.authors[0]
              : "Unknown Author";

          return (
            <li key={book.googleBookId} className="recently-saved__item">
              <button
                type="button"
                className="recently-saved__btn"
                onClick={() => onPreview(book)}
                aria-label={`Preview ${book.title}`}
              >
                {book.thumbnail ? (
                  <img
                    src={book.thumbnail}
                    alt={`Cover of ${book.title}`}
                    className="recently-saved__cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="recently-saved__cover-placeholder"
                    aria-hidden="true"
                  >
                    <span className="recently-saved__placeholder-initial">
                      {book.title.charAt(0)}
                    </span>
                  </div>
                )}
                <p className="recently-saved__title">{book.title}</p>
                <p className="recently-saved__author">{authorText}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default RecentlySaved;
