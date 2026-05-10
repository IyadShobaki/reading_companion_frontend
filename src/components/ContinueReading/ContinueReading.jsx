/**
 * ContinueReading — hero section for the home-page dashboard.
 *
 * Features the single most relevant book for the user to return to:
 *   - Prefers the most-recently-saved book that has local reading progress.
 *   - Falls back to the most-recently-saved book when none have progress.
 *   - Renders nothing when the user has no saved books or the library is loading.
 *
 * @param {Function} onPreview - Opens BookPreviewModal for the featured book.
 */

import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LibraryContext } from "../../contexts/LibraryContext";
import { progressStorage } from "../../utils/progressStorage";
import "./ContinueReading.css";

const noop = () => {};

function ContinueReading({ onPreview = noop }) {
  const { savedBooks, isLoading } = useContext(LibraryContext);
  const navigate = useNavigate();

  if (isLoading || savedBooks.length === 0) return null;

  // Prefer the most-recently-saved book that already has local progress
  const booksWithProgress = savedBooks.filter(
    (b) => progressStorage.loadProgress(b.googleBookId) !== null,
  );
  const book = booksWithProgress[0] ?? savedBooks[0];
  const savedPage = progressStorage.loadProgress(book.googleBookId);

  const authorText =
    Array.isArray(book.authors) && book.authors.length > 0
      ? book.authors.join(", ")
      : "Unknown Author";

  const handleRead = () => {
    navigate(`/reader/${encodeURIComponent(book.googleBookId)}`);
  };

  return (
    <section className="continue-reading" aria-label="Continue reading">
      <h2 className="continue-reading__label">
        {savedPage ? "Continue Reading" : "Pick Up Where You Left Off"}
      </h2>

      <div className="continue-reading__card">
        {book.thumbnail ? (
          <img
            src={book.thumbnail}
            alt={`Cover of ${book.title}`}
            className="continue-reading__cover"
          />
        ) : (
          <div
            className="continue-reading__cover-placeholder"
            aria-hidden="true"
          >
            <span className="continue-reading__placeholder-text">
              {book.title}
            </span>
          </div>
        )}

        <div className="continue-reading__meta">
          <h3 className="continue-reading__title">{book.title}</h3>
          <p className="continue-reading__authors">{authorText}</p>

          {book.description && (
            <p className="continue-reading__description">{book.description}</p>
          )}

          {savedPage !== null && (
            <p className="continue-reading__page">
              Last saved &mdash; page {savedPage}
            </p>
          )}

          <div className="continue-reading__actions">
            <button
              type="button"
              className="continue-reading__btn continue-reading__btn_primary"
              onClick={handleRead}
            >
              {savedPage ? "Continue Reading" : "Start Reading"}
            </button>
            <button
              type="button"
              className="continue-reading__btn continue-reading__btn_secondary"
              onClick={() => onPreview(book)}
            >
              Book Details
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContinueReading;
