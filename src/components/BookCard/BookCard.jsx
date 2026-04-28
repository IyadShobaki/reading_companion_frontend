/**
 * BookCard — Displays a single book with its cover, metadata, and action buttons.
 *
 * Renders:
 * - Book cover image (or a text placeholder when no thumbnail is available)
 * - Title, authors, and an availability badge for non-embeddable books
 * - "Preview" button — always visible; opens BookPreviewModal
 * - "Start Reading" button — always visible; navigates to the Reader page
 * - "Add to Library" / "Remove from Library" button — only for logged-in users
 *
 * Props:
 *   book              {Object}   Normalised book object from mapBookVolume
 *   isLoggedIn        {boolean}  Whether the current user is authenticated
 *   isSaved           {boolean}  Whether the book is already in the user's library
 *   onPreview         {Function} Called with the full book object to open the preview modal
 *   onAddToLibrary    {Function} Called with the full book object when adding
 *   onRemoveFromLibrary {Function} Called with googleBookId when removing
 */

import { useNavigate } from "react-router-dom";
import "./BookCard.css";

// Module-scope no-op default so prop defaults stay stable across renders
const noop = () => {};

function BookCard({
  book,
  isLoggedIn = false,
  isSaved = false,
  onPreview = noop,
  onAddToLibrary = noop,
  onRemoveFromLibrary = noop,
}) {
  const navigate = useNavigate();

  const { googleBookId, title, authors, thumbnail, embeddable, viewability } =
    book;

  // Join author list; fall back gracefully when the API returns none
  const authorText = authors.length > 0 ? authors.join(", ") : "Unknown Author";

  // A book is considered accessible when it can be embedded AND has pages
  const isAccessible = embeddable && viewability !== "NO_PAGES";

  const handleStartReading = () => {
    navigate(`/reader/${encodeURIComponent(googleBookId)}`);
  };

  const handleLibraryAction = () => {
    if (isSaved) {
      onRemoveFromLibrary(googleBookId);
    } else {
      onAddToLibrary(book);
    }
  };

  return (
    <article className="book-card">
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={`Cover of ${title}`}
          className="book-card__cover"
        />
      ) : (
        // Decorative placeholder shown when no thumbnail URL is available
        <div className="book-card__cover-placeholder" aria-hidden="true">
          <span className="book-card__cover-placeholder-text">{title}</span>
        </div>
      )}

      <div className="book-card__body">
        <h3 className="book-card__title">{title}</h3>
        <p className="book-card__authors">{authorText}</p>

        {/* Availability badge — only shown when the book cannot be read inline */}
        {!isAccessible && (
          <span className="book-card__availability">Limited Access</span>
        )}

        <div className="book-card__actions">
          <button
            type="button"
            className="book-card__btn book-card__btn_secondary"
            onClick={() => onPreview(book)}
            aria-label={`Preview ${title}`}
          >
            Preview
          </button>

          <button
            type="button"
            className="book-card__btn book-card__btn_primary"
            onClick={handleStartReading}
            aria-label={`Start reading ${title}`}
          >
            Start Reading
          </button>

          {isLoggedIn && (
            <button
              type="button"
              className="book-card__btn book-card__btn_secondary"
              onClick={handleLibraryAction}
              aria-label={
                isSaved
                  ? `Remove ${title} from library`
                  : `Add ${title} to library`
              }
            >
              {isSaved ? "Remove" : "Add to Library"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default BookCard;
