import { useContext, useMemo } from "react";
import BookSection from "../BookSection/BookSection";
import ContinueReading from "../ContinueReading/ContinueReading";
import RecentlySaved from "../RecentlySaved/RecentlySaved";
import { LibraryContext } from "../../contexts/LibraryContext";
import { progressStorage } from "../../utils/progressStorage";
import "./Main.css";

/**
 * Section definitions for the home-page book discovery feed.
 * Declared at module scope so the array reference is stable across renders.
 * Each entry maps to a named booksService.fetchSection key.
 */
const BOOK_SECTIONS = [
  { key: "new", title: "New Books" },
  { key: "philosophy", title: "Philosophy" },
  { key: "romance", title: "Romance" },
  { key: "technology", title: "Technology" },
];

// Module-scope no-op default keeps the component stable when props are omitted
const noop = () => {};

/**
 * Main — Home page dashboard.
 *
 * Authenticated users see:
 *   1. ContinueReading hero — the most relevant book to return to.
 *   2. RecentlySaved ribbon — the 6 most recently saved books.
 *   3. Category discovery sections.
 *
 * Guests see:
 *   1. A hero welcome banner with sign-up / log-in CTAs.
 *   2. Category discovery sections.
 */
function Main({
  isLoggedIn = false,
  savedBookIds = [],
  onPreview = noop,
  onAddToLibrary = noop,
  onRemoveFromLibrary = noop,
  onLoginClick = noop,
  onRegisterClick = noop,
}) {
  const { savedBooks } = useContext(LibraryContext);

  // Determine which book the ContinueReading hero will show so RecentlySaved
  // can exclude it and avoid duplication.
  const continueBookId = useMemo(() => {
    if (!isLoggedIn || savedBooks.length === 0) return null;
    const withProgress = savedBooks.filter(
      (b) => progressStorage.loadProgress(b.googleBookId) !== null,
    );
    return (withProgress[0] ?? savedBooks[0]).googleBookId;
  }, [isLoggedIn, savedBooks]);

  return (
    <main className="main">
      {isLoggedIn ? (
        /* ── Authenticated dashboard ─────────────────────────── */
        <>
          <ContinueReading onPreview={onPreview} />
          <RecentlySaved excludeId={continueBookId} onPreview={onPreview} />
          <div className="main__discovery">
            {BOOK_SECTIONS.map(({ key, title }) => (
              <BookSection
                key={key}
                sectionKey={key}
                title={title}
                isLoggedIn={isLoggedIn}
                savedBookIds={savedBookIds}
                onPreview={onPreview}
                onAddToLibrary={onAddToLibrary}
                onRemoveFromLibrary={onRemoveFromLibrary}
              />
            ))}
          </div>
        </>
      ) : (
        /* ── Guest discovery feed ────────────────────────────── */
        <>
          <section className="main__guest-hero" aria-label="Welcome">
            <h1 className="main__guest-heading">Your reading companion.</h1>
            <p className="main__guest-sub">
              Discover books, track your progress, take notes, and chat with AI
              about what you&apos;re reading.
            </p>
            <div className="main__guest-actions">
              <button
                type="button"
                className="main__guest-btn main__guest-btn_primary"
                onClick={onRegisterClick}
              >
                Get started — it&apos;s free
              </button>
              <button
                type="button"
                className="main__guest-btn main__guest-btn_secondary"
                onClick={onLoginClick}
              >
                Log in
              </button>
            </div>
          </section>

          {BOOK_SECTIONS.map(({ key, title }) => (
            <BookSection
              key={key}
              sectionKey={key}
              title={title}
              isLoggedIn={isLoggedIn}
              savedBookIds={savedBookIds}
              onPreview={onPreview}
              onAddToLibrary={onAddToLibrary}
              onRemoveFromLibrary={onRemoveFromLibrary}
            />
          ))}
        </>
      )}
    </main>
  );
}

export default Main;
