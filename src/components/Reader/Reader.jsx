import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import Loading from "../Loading/Loading";
import { booksService } from "../../services/books.service";
import "./Reader.css";

/**
 * Reader — full-screen reading experience for a single book.
 *
 * Reads the `bookId` URL parameter, fetches book metadata, then embeds the
 * book using Google Books' iframe embed URL:
 *
 *   https://books.google.com/books?id={googleBookId}&pg=PA{pageNumber}&output=embed
 *
 * Page navigation is driven by React state — changing `pageNumber` updates the
 * iframe `src`, which Google Books responds to by rendering that page.
 *
 *   ┌──────────────── metadata header ─────────────────┐
 *   │ cover  │  title · authors · published date        │
 *   ├──────────────────┬────────────────────────────────┤
 *   │                  │  Notes panel                   │
 *   │  iframe viewer   │─────────────────────────────── │
 *   │  + nav controls  │  AI panel                      │
 *   └──────────────────┴────────────────────────────────┘
 *
 * Route:  /reader/:bookId  (public — no ProtectedRoute wrapper)
 */
function Reader() {
  const { bookId } = useParams();

  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [goToPageInput, setGoToPageInput] = useState("");

  useEffect(() => {
    if (!bookId) return;

    let cancelled = false;

    setIsLoading(true);
    setError(null);

    booksService
      .getById(decodeURIComponent(bookId))
      .then((data) => {
        if (!cancelled) {
          setBook(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load book.");
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  const handleNext = () => setPageNumber((p) => p + 1);
  const handlePrev = () => setPageNumber((p) => Math.max(1, p - 1));

  const handleGoToPage = (evt) => {
    evt.preventDefault();
    const page = parseInt(goToPageInput, 10);
    if (!Number.isNaN(page) && page > 0) {
      setPageNumber(page);
      setGoToPageInput("");
    }
  };

  // ── No bookId in URL ───────────────────────────────────────────────────────
  if (!bookId) {
    return (
      <main className="reader">
        <p className="reader__fallback">
          No book selected. Go back and choose a book to read.
        </p>
      </main>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="reader">
        <div role="status" aria-label="Loading book">
          <Loading />
        </div>
      </main>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="reader">
        <p className="reader__error" role="alert">
          {error}
        </p>
      </main>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const title = book?.title ?? "";
  const authors = book?.authors ?? [];
  const thumbnail = book?.thumbnail ?? "";
  const publishedDate = book?.publishedDate ?? "";
  const googleBookId = book?.googleBookId ?? "";
  const embeddable = book?.embeddable ?? false;
  const viewability = book?.viewability ?? "NO_PAGES";
  const webReaderLink = book?.webReaderLink ?? "";

  const isReadable = embeddable && viewability !== "NO_PAGES";

  const viewerSrc = `https://books.google.com/books?id=${encodeURIComponent(googleBookId)}&pg=PA${pageNumber}&output=embed`;

  return (
    <main className="reader">
      {/* ── Metadata header ── */}
      <header className="reader__header">
        {thumbnail && (
          <img
            className="reader__cover"
            src={thumbnail}
            alt={`Cover of ${title}`}
          />
        )}
        <div className="reader__meta">
          <h1 className="reader__title">{title}</h1>
          {authors.length > 0 && (
            <p className="reader__authors">{authors.join(", ")}</p>
          )}
          {publishedDate && (
            <p className="reader__published">{publishedDate}</p>
          )}
        </div>
      </header>

      {/* ── Body: viewer + sidebar ── */}
      <div className="reader__body">
        {/* Center: embedded viewer */}
        <section className="reader__viewer-col" aria-label="Book viewer">
          {isReadable ? (
            <>
              <iframe
                className="reader__viewer"
                title={`Reading ${title}`}
                src={viewerSrc}
                allowFullScreen
              />

              {/* Page navigation controls */}
              <div
                className="reader__controls"
                role="toolbar"
                aria-label="Page controls"
              >
                <button
                  type="button"
                  className="reader__control-btn"
                  onClick={handlePrev}
                  aria-label="Previous page"
                >
                  ← Prev
                </button>

                <span
                  className="reader__page-indicator"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  Page {pageNumber}
                </span>

                <button
                  type="button"
                  className="reader__control-btn"
                  onClick={handleNext}
                  aria-label="Next page"
                >
                  Next →
                </button>

                <form
                  className="reader__go-to-form"
                  onSubmit={handleGoToPage}
                  aria-label="Go to page"
                >
                  <label
                    htmlFor="reader-go-to-page"
                    className="reader__go-to-label"
                  >
                    Go to
                  </label>
                  <input
                    id="reader-go-to-page"
                    type="number"
                    className="reader__go-to-input"
                    value={goToPageInput}
                    onChange={(e) => setGoToPageInput(e.target.value)}
                    min="1"
                    aria-label="Page number"
                  />
                  <button
                    type="submit"
                    className="reader__control-btn"
                    aria-label="Go to page"
                  >
                    Go
                  </button>
                </form>
              </div>
            </>
          ) : (
            <p className="reader__viewer-message">
              This book is not available for embedded preview.
              {webReaderLink && (
                <>
                  {" "}
                  Try{" "}
                  <a
                    href={webReaderLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    opening on Google Play Books
                  </a>
                  .
                </>
              )}
            </p>
          )}
        </section>

        {/* Right: Notes and AI panels */}
        <aside className="reader__sidebar">
          <section
            className="reader__panel reader__panel_notes"
            aria-labelledby="reader-notes-heading"
          >
            <h2 className="reader__panel-heading" id="reader-notes-heading">
              Notes
            </h2>
            <div className="reader__panel-body">
              <p className="reader__panel-placeholder">
                Your notes will appear here.
              </p>
            </div>
          </section>

          <section
            className="reader__panel reader__panel_ai"
            aria-labelledby="reader-ai-heading"
          >
            <h2 className="reader__panel-heading" id="reader-ai-heading">
              AI Assistant
            </h2>
            <div className="reader__panel-body">
              <p className="reader__panel-placeholder">
                AI tools will appear here.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default Reader;
