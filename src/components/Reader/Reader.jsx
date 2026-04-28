import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import Loading from "../Loading/Loading";
import { booksService } from "../../services/books.service";
import "./Reader.css";

/**
 * Reader — full-screen reading experience for a single book.
 *
 * Reads the `bookId` URL parameter, fetches book metadata from the Google Books
 * API, and renders a three-region layout:
 *
 *   ┌──────────────── metadata header ─────────────────┐
 *   │ cover  │  title · authors · published date        │
 *   ├──────────────────┬────────────────────────────────┤
 *   │                  │  Notes panel                   │
 *   │  Embedded viewer │─────────────────────────────── │
 *   │  (Step 7)        │  AI panel                      │
 *   └──────────────────┴────────────────────────────────┘
 *
 * The embedded viewer and panel interactions are wired in later steps.
 * This component provides the layout scaffold.
 *
 * Route:  /reader/:bookId  (public — no ProtectedRoute wrapper)
 */
function Reader() {
  const { bookId } = useParams();

  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
        {/* Center: embedded viewer placeholder (wired in Step 7) */}
        <section className="reader__viewer-col" aria-label="Book viewer">
          <div className="reader__viewer">
            <p className="reader__viewer-placeholder">Viewer loading…</p>
          </div>
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
