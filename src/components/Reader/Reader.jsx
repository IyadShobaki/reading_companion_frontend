import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";

import Loading from "../Loading/Loading";
import NotesPanel from "../NotesPanel/NotesPanel";
import AiPanel from "../AiPanel/AiPanel";
import { booksService } from "../../services/books.service";
import { useProgress } from "../../hooks/useProgress";
import { useToast } from "../../hooks/useToast";
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

  const { loadProgress, saveProgress } = useProgress();
  const { showToast } = useToast();

  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [goToPageInput, setGoToPageInput] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  /**
   * Last page number confirmed saved to backend (or localStorage).
   * null = no progress found (API returned 404).
   */
  const [savedPage, setSavedPage] = useState(null);

  /** Which side panel is currently open — null means no panel. */
  const [activePanel, setActivePanel] = useState(null); // null | "notes" | "ai"

  /** Toggle a panel open/closed; opening one closes the other. */
  const togglePanel = useCallback((panel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);

  /** Close the active panel when the user presses Escape. */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setActivePanel(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!bookId) return;

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setIsLoading(true);
      setError(null);
    });

    booksService
      .getById(decodeURIComponent(bookId))
      .then(async (data) => {
        if (!cancelled) {
          setBook(data);
          // Resume reading — restore last saved page if one exists
          const restoredPage = await loadProgress(data.googleBookId);
          if (restoredPage) {
            setPageNumber(restoredPage);
            setSavedPage(restoredPage);
          }
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
  }, [bookId, loadProgress]);

  const handleNext = () => {
    setPageNumber((p) => p + 1);
    setIsSaved(false);
  };

  const handlePrev = () => {
    setPageNumber((p) => Math.max(1, p - 1));
    setIsSaved(false);
  };

  const handleGoToPage = (evt) => {
    evt.preventDefault();
    const page = parseInt(goToPageInput, 10);
    if (!Number.isNaN(page) && page > 0) {
      setPageNumber(page);
      setGoToPageInput("");
      setIsSaved(false);
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
  const description = book?.description ?? "";
  const categories = book?.categories ?? [];
  const thumbnail = book?.thumbnail ?? "";
  const publishedDate = book?.publishedDate ?? "";
  const googleBookId = book?.googleBookId ?? "";
  const embeddable = book?.embeddable ?? false;
  const viewability = book?.viewability ?? "NO_PAGES";
  const webReaderLink = book?.webReaderLink ?? "";

  const isReadable = embeddable && viewability !== "NO_PAGES";

  const handleSaveProgress = async () => {
    await saveProgress(googleBookId, pageNumber);
    setIsSaved(true);
    setSavedPage(pageNumber);
    showToast("Progress saved.", "success");
  };

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
            loading="lazy"
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
              {/* Page navigation controls */}
              <div
                className="reader__controls"
                role="toolbar"
                aria-label="Page controls"
              >
                <div
                  className="reader__control-group reader__control-group_nav"
                  role="group"
                  aria-label="Page navigation"
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
                </div>

                <div
                  className="reader__control-group reader__control-group_jump"
                  role="group"
                  aria-label="Page jump"
                >
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

                <div
                  className="reader__control-group reader__control-group_progress"
                  role="group"
                  aria-label="Reading progress"
                >
                  <span className="reader__progress-indicator">
                    {savedPage !== null
                      ? `Saved at page ${savedPage}`
                      : "Progress not saved"}
                  </span>
                  <button
                    type="button"
                    className={`reader__control-btn${
                      isSaved ? " reader__control-btn_saved" : ""
                    }`}
                    onClick={handleSaveProgress}
                    aria-label={isSaved ? "Progress saved" : "Save progress"}
                  >
                    {isSaved ? "Saved \u2713" : "Save Progress"}
                  </button>
                </div>

                {/* Panel toggle buttons */}
                <div
                  className="reader__control-group reader__panel-toggles"
                  role="group"
                  aria-label="Reading tools"
                >
                  <button
                    type="button"
                    className={`reader__panel-toggle${
                      activePanel === "notes"
                        ? " reader__panel-toggle_active"
                        : ""
                    }`}
                    onClick={() => togglePanel("notes")}
                    aria-pressed={activePanel === "notes"}
                    aria-label="Toggle notes panel"
                  >
                    📝 Notes
                  </button>
                  <button
                    type="button"
                    className={`reader__panel-toggle${
                      activePanel === "ai" ? " reader__panel-toggle_active" : ""
                    }`}
                    onClick={() => togglePanel("ai")}
                    aria-pressed={activePanel === "ai"}
                    aria-label="Toggle AI assistant panel"
                  >
                    ✨ AI
                  </button>
                </div>
              </div>

              <iframe
                className="reader__viewer"
                title={`Reading ${title}`}
                src={viewerSrc}
                allowFullScreen
              />
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
      </div>

      {/* ── Sliding overlay panel ── */}
      <div
        className={`reader__overlay${activePanel ? " reader__overlay_open" : ""}`}
        role={activePanel ? "region" : undefined}
        aria-label={
          activePanel === "notes" ? "Notes panel" : "AI assistant panel"
        }
        aria-hidden={!activePanel}
      >
        <div className="reader__overlay-header">
          <h2 className="reader__overlay-title">
            {activePanel === "notes" ? "Notes" : "AI Assistant"}
          </h2>
          <button
            type="button"
            className="reader__overlay-close"
            onClick={() => setActivePanel(null)}
            aria-label="Close panel"
          >
            ×
          </button>
        </div>
        <div className="reader__overlay-body">
          {activePanel === "notes" && (
            <NotesPanel googleBookId={googleBookId} currentPage={pageNumber} />
          )}
          {activePanel === "ai" && (
            <AiPanel
              googleBookId={googleBookId}
              title={title}
              currentPage={pageNumber}
              authors={authors}
              description={description}
              categories={categories}
            />
          )}
        </div>
      </div>

      {/* Backdrop — click to close the overlay */}
      {activePanel && (
        <div
          className="reader__backdrop"
          onClick={() => setActivePanel(null)}
          aria-hidden="true"
        />
      )}
    </main>
  );
}

export default Reader;
