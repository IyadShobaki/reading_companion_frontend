/**
 * Library.test.jsx — Unit tests for the Library page component
 *
 * LibraryContext is provided directly to control state without needing
 * a live store or backend. fetchLibrary is a spy so we can assert it
 * is called on mount.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Library from "./Library";
import { LibraryContext } from "../../contexts/LibraryContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BOOK_A = {
  googleBookId: "aaa",
  title: "Clean Code",
  authors: ["Robert C. Martin"],
  thumbnail: "https://example.com/cover.jpg",
  description: "A handbook.",
  categories: [],
  language: "en",
  publishedDate: "2008",
  embeddable: true,
  viewability: "PARTIAL",
  publicDomain: false,
  webReaderLink: "",
};

const BOOK_B = {
  googleBookId: "bbb",
  title: "The Pragmatic Programmer",
  authors: ["David Thomas"],
  thumbnail: "",
  description: "Your journey to mastery.",
  categories: [],
  language: "en",
  publishedDate: "1999",
  embeddable: false,
  viewability: "NO_PAGES",
  publicDomain: false,
  webReaderLink: "",
};

/**
 * Render Library with a custom context value.
 * fetchLibrary defaults to a resolved no-op so tests that don't care
 * about it don't need to supply it explicitly.
 */
const renderLibrary = ({
  savedBooks = [],
  savedBookIds = [],
  isLoading = false,
  error = null,
  fetchLibrary = vi.fn().mockResolvedValue(undefined),
  onPreview = vi.fn(),
  onAddToLibrary = vi.fn(),
  onRemoveFromLibrary = vi.fn(),
} = {}) =>
  render(
    <MemoryRouter>
      <LibraryContext.Provider
        value={{
          savedBooks,
          savedBookIds,
          isLoading,
          error,
          fetchLibrary,
          addBook: vi.fn(),
          removeBook: vi.fn(),
          clearLibrary: vi.fn(),
        }}
      >
        <Library
          onPreview={onPreview}
          onAddToLibrary={onAddToLibrary}
          onRemoveFromLibrary={onRemoveFromLibrary}
        />
      </LibraryContext.Provider>
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Library", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Page structure ────────────────────────────────────────────────────────

  it("renders the page heading", () => {
    renderLibrary();
    expect(
      screen.getByRole("heading", { name: /my library/i }),
    ).toBeInTheDocument();
  });

  it("calls fetchLibrary on mount", () => {
    const fetchLibrary = vi.fn().mockResolvedValue(undefined);
    renderLibrary({ fetchLibrary });
    expect(fetchLibrary).toHaveBeenCalledOnce();
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it("shows loading indicator when isLoading is true", () => {
    renderLibrary({ isLoading: true });
    expect(
      screen.getByRole("status", { name: /loading library/i }),
    ).toBeInTheDocument();
  });

  it("does not show the book grid while loading", () => {
    renderLibrary({ isLoading: true, savedBooks: [BOOK_A] });
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  // ── Error state ───────────────────────────────────────────────────────────

  it("shows an error message when error is set", () => {
    renderLibrary({ error: "Failed to load library." });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/failed to load library/i)).toBeInTheDocument();
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  it("shows the empty state message when savedBooks is empty", () => {
    renderLibrary({ savedBooks: [] });
    expect(screen.getByText(/your library is empty/i)).toBeInTheDocument();
  });

  it("does not show the book grid when savedBooks is empty", () => {
    renderLibrary({ savedBooks: [] });
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  // ── Book grid ─────────────────────────────────────────────────────────────

  it("renders a book card for each saved book", () => {
    renderLibrary({
      savedBooks: [BOOK_A, BOOK_B],
      savedBookIds: ["aaa", "bbb"],
    });
    expect(
      screen.getByRole("heading", { name: "Clean Code" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "The Pragmatic Programmer" }),
    ).toBeInTheDocument();
  });

  it("does not show the empty state when there are saved books", () => {
    renderLibrary({
      savedBooks: [BOOK_A],
      savedBookIds: ["aaa"],
    });
    expect(
      screen.queryByText(/your library is empty/i),
    ).not.toBeInTheDocument();
  });

  // ── Library actions ───────────────────────────────────────────────────────

  it("calls onRemoveFromLibrary when Remove is clicked on a saved book", async () => {
    const onRemoveFromLibrary = vi.fn();
    renderLibrary({
      savedBooks: [BOOK_A],
      savedBookIds: ["aaa"],
      onRemoveFromLibrary,
    });
    await userEvent.click(
      screen.getByRole("button", { name: /remove.*from library/i }),
    );
    expect(onRemoveFromLibrary).toHaveBeenCalledWith("aaa");
  });

  it("calls onPreview when Preview is clicked", async () => {
    const onPreview = vi.fn();
    renderLibrary({
      savedBooks: [BOOK_A],
      savedBookIds: ["aaa"],
      onPreview,
    });
    await userEvent.click(screen.getByRole("button", { name: /preview/i }));
    expect(onPreview).toHaveBeenCalledWith(BOOK_A);
  });
});
