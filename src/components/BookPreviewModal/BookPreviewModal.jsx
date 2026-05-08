/**
 * BookPreviewModal — Full-detail modal for a single book.
 *
 * Displays cover, title, authors, description, categories, published date,
 * and availability status. Provides "Start Reading" and Add/Remove Library
 * actions using the same patterns as BookCard.
 *
 * Accessibility:
 *   - role="dialog" + aria-modal="true" + aria-labelledby
 *   - Focus trap: Escape key closes the modal (handled by App via overlay listener)
 *   - Overlay click closes the modal (handled by App via overlay listener)
 *
 * Props:
 *   isOpen              {boolean}  Whether the modal is visible
 *   book                {Object|null} Normalised book object; modal renders nothing useful when null
 *   isLoggedIn          {boolean}  Whether the current user is authenticated
 *   isSaved             {boolean}  Whether the book is in the user's library
 *   onClose             {Function} Called when close button / Escape / overlay is clicked
 *   onAddToLibrary      {Function} Called with the full book object when adding
 *   onRemoveFromLibrary {Function} Called with googleBookId when removing
 */

import { useNavigate } from "react-router-dom";
import { progressStorage } from "../../utils/progressStorage";
import "./BookPreviewModal.css";

const noop = () => {};

function BookPreviewModal({
  isOpen,
  book,
  isLoggedIn = false,
  isSaved = false,
  onClose = noop,
  onAddToLibrary = noop,
  onRemoveFromLibrary = noop,
}) {
  const navigate = useNavigate();

  // Don't render internals when there is no book — keeps DOM clean
  if (!book) {
    return (
      <div
        className={`modal ${isOpen ? "modal_opened" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Book preview"
      />
    );
  }

  const {
    googleBookId,
    title,
    authors,
    description,
    thumbnail,
    categories,
    publishedDate,
    embeddable,
    viewability,
  } = book;

  const authorText = authors.length > 0 ? authors.join(", ") : "Unknown Author";
  const isAccessible = embeddable && viewability !== "NO_PAGES";

  // Show "Continue Reading" when saved progress exists for this book
  const hasProgress = progressStorage.loadProgress(googleBookId) !== null;
  const readingLabel = hasProgress ? "Continue Reading" : "Start Reading";

  const handleStartReading = () => {
    onClose();
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
    <div
      className={`modal ${isOpen ? "modal_opened" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-preview-title"
    >
      <div className="modal__container book-preview-modal__container">
        <button
          type="button"
          className="modal__close-btn"
          onClick={onClose}
          aria-label="Close preview"
        />

        <div className="book-preview-modal__layout">
          {/* Cover */}
          <div className="book-preview-modal__cover-col">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={`Cover of ${title}`}
                className="book-preview-modal__cover"
                loading="lazy"
              />
            ) : (
              <div
                className="book-preview-modal__cover-placeholder"
                aria-hidden="true"
              >
                <span className="book-preview-modal__cover-placeholder-text">
                  {title}
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="book-preview-modal__details">
            <h2 className="book-preview-modal__title" id="book-preview-title">
              {title}
            </h2>
            <p className="book-preview-modal__authors">{authorText}</p>

            {categories.length > 0 && (
              <p className="book-preview-modal__categories">
                {categories.join(", ")}
              </p>
            )}

            {publishedDate && (
              <p className="book-preview-modal__published">
                Published: {publishedDate}
              </p>
            )}

            {!isAccessible && (
              <span className="book-preview-modal__availability">
                Limited Access
              </span>
            )}

            {description && (
              <p className="book-preview-modal__description">{description}</p>
            )}

            <div className="book-preview-modal__actions">
              <button
                type="button"
                className="book-preview-modal__btn book-preview-modal__btn_primary"
                onClick={handleStartReading}
                aria-label={`${readingLabel} ${title}`}
              >
                {readingLabel}
              </button>

              {isLoggedIn && (
                <button
                  type="button"
                  className="book-preview-modal__btn book-preview-modal__btn_secondary"
                  onClick={handleLibraryAction}
                  aria-label={
                    isSaved
                      ? `Remove ${title} from library`
                      : `Add ${title} to library`
                  }
                >
                  {isSaved ? "Remove from Library" : "Add to Library"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookPreviewModal;
