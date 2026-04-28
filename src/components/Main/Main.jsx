import BookSection from "../BookSection/BookSection";
import "./Main.css";

/**
 * Section definitions for the home-page book discovery feed.
 * Declared at module scope so the array reference is stable across renders.
 * Each entry maps to a named booksService.fetchSection key.
 */
const BOOK_SECTIONS = [
  { key: "trending", title: "Trending" },
  { key: "new", title: "New Books" },
  { key: "philosophy", title: "Philosophy" },
  { key: "romance", title: "Romance" },
  { key: "technology", title: "Technology" },
];

// Module-scope no-op default keeps the component stable when props are omitted
const noop = () => {};

/**
 * Main — Home page content.
 *
 * Renders one BookSection per category. Data fetching is delegated to
 * each BookSection (via the useBookSection hook) so this component stays
 * a pure layout component.
 *
 * Props:
 *   isLoggedIn          {boolean}  Whether the current user is authenticated
 *   savedBookIds        {string[]} IDs of books in the user's library (Step 9)
 *   onAddToLibrary      {Function} Library add callback (Step 9)
 *   onRemoveFromLibrary {Function} Library remove callback (Step 9)
 */
function Main({
  isLoggedIn = false,
  savedBookIds = [],
  onPreview = noop,
  onAddToLibrary = noop,
  onRemoveFromLibrary = noop,
}) {
  return (
    <main className="main">
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
    </main>
  );
}

export default Main;
