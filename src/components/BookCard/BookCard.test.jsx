/**
 * BookCard.test.jsx — Unit tests for the BookCard component
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import BookCard from "./BookCard";

// ---------------------------------------------------------------------------
// Mock progressStorage so tests control the "has progress" state
// ---------------------------------------------------------------------------

const mockLoadProgress = vi.hoisted(() => vi.fn(() => null));

vi.mock("../../utils/progressStorage", () => ({
  progressStorage: { loadProgress: mockLoadProgress },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A fully populated book with a thumbnail and embeddable access. */
const READABLE_BOOK = {
  googleBookId: "abc123",
  title: "Clean Code",
  authors: ["Robert C. Martin"],
  description: "A handbook of agile software craftsmanship.",
  thumbnail: "https://books.google.com/thumb.jpg",
  categories: ["Computers"],
  language: "en",
  publishedDate: "2008-08-01",
  embeddable: true,
  viewability: "PARTIAL",
  publicDomain: false,
  webReaderLink: "",
};

/** A book with no thumbnail and limited (non-embeddable) access. */
const LIMITED_BOOK = {
  ...READABLE_BOOK,
  googleBookId: "lim1",
  title: "No Preview Book",
  thumbnail: "",
  embeddable: false,
  viewability: "NO_PAGES",
};

/** A book with no authors listed. */
const NO_AUTHOR_BOOK = {
  ...READABLE_BOOK,
  googleBookId: "noauth1",
  title: "Authorless Book",
  authors: [],
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Renders BookCard inside a MemoryRouter (required because BookCard uses
 * useNavigate internally for the "Start Reading" button).
 */
const renderCard = (props = {}) =>
  render(
    <MemoryRouter>
      <BookCard book={READABLE_BOOK} {...props} />
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BookCard", () => {
  beforeEach(() => {
    mockLoadProgress.mockReturnValue(null); // no progress by default
  });

  // ---- Metadata rendering --------------------------------------------------

  it("renders the book title", () => {
    renderCard();
    expect(screen.getByText("Clean Code")).toBeInTheDocument();
  });

  it("renders the authors as a comma-separated string", () => {
    renderCard();
    expect(screen.getByText("Robert C. Martin")).toBeInTheDocument();
  });

  it("renders 'Unknown Author' when the authors array is empty", () => {
    renderCard({ book: NO_AUTHOR_BOOK });
    expect(screen.getByText("Unknown Author")).toBeInTheDocument();
  });

  it("renders the cover image with an accessible alt text", () => {
    renderCard();
    const img = screen.getByRole("img", { name: /cover of clean code/i });
    expect(img).toHaveAttribute("src", "https://books.google.com/thumb.jpg");
  });

  it("renders a placeholder instead of an img when thumbnail is empty", () => {
    const { container } = renderCard({ book: LIMITED_BOOK });
    // No <img> element should be present
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    // The cover-placeholder div is rendered instead
    expect(
      container.querySelector(".book-card__cover-placeholder"),
    ).toBeInTheDocument();
  });

  // ---- Availability badge --------------------------------------------------

  it("does NOT show the 'Limited Access' badge for an embeddable book", () => {
    renderCard();
    expect(screen.queryByText("Limited Access")).not.toBeInTheDocument();
  });

  it("shows 'Limited Access' badge when the book is not embeddable", () => {
    renderCard({ book: LIMITED_BOOK });
    expect(screen.getByText("Limited Access")).toBeInTheDocument();
  });

  // ---- Start Reading / Continue Reading button ----------------------------

  it("renders a 'Start Reading' button when no progress is saved", () => {
    mockLoadProgress.mockReturnValue(null);
    renderCard();
    expect(
      screen.getByRole("button", { name: /start reading clean code/i }),
    ).toBeInTheDocument();
  });

  it("renders 'Continue Reading' when progress is saved for the book", () => {
    mockLoadProgress.mockReturnValue(5); // page 5 saved
    renderCard();
    expect(
      screen.getByRole("button", { name: /continue reading clean code/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Start Reading")).not.toBeInTheDocument();
  });

  it("renders the reading button for non-embeddable books too", () => {
    renderCard({ book: LIMITED_BOOK });
    expect(
      screen.getByRole("button", { name: /start reading/i }),
    ).toBeInTheDocument();
  });

  // ---- Library buttons (guests should not see them) -----------------------

  it("does NOT render the library button when isLoggedIn is false", () => {
    renderCard({ isLoggedIn: false });
    expect(screen.queryByText("Add to Library")).not.toBeInTheDocument();
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });

  it("shows 'Add to Library' when logged in and book is not saved", () => {
    renderCard({ isLoggedIn: true, isSaved: false });
    expect(
      screen.getByRole("button", { name: /add clean code to library/i }),
    ).toBeInTheDocument();
  });

  it("shows 'Remove' when logged in and book is already saved", () => {
    renderCard({ isLoggedIn: true, isSaved: true });
    expect(
      screen.getByRole("button", { name: /remove clean code from library/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Add to Library")).not.toBeInTheDocument();
  });

  // ---- Library callbacks --------------------------------------------------

  it("calls onAddToLibrary with the full book object when 'Add to Library' is clicked", async () => {
    const onAddToLibrary = vi.fn();
    renderCard({ isLoggedIn: true, isSaved: false, onAddToLibrary });

    await userEvent.click(
      screen.getByRole("button", { name: /add clean code to library/i }),
    );

    expect(onAddToLibrary).toHaveBeenCalledTimes(1);
    expect(onAddToLibrary).toHaveBeenCalledWith(READABLE_BOOK);
  });

  it("calls onRemoveFromLibrary with the googleBookId when 'Remove' is clicked", async () => {
    const onRemoveFromLibrary = vi.fn();
    renderCard({ isLoggedIn: true, isSaved: true, onRemoveFromLibrary });

    await userEvent.click(
      screen.getByRole("button", { name: /remove clean code from library/i }),
    );

    expect(onRemoveFromLibrary).toHaveBeenCalledTimes(1);
    expect(onRemoveFromLibrary).toHaveBeenCalledWith("abc123");
  });

  it("does not throw when library callbacks are not provided", async () => {
    renderCard({ isLoggedIn: true, isSaved: false });
    // Should not throw — default noop is used
    await expect(
      userEvent.click(
        screen.getByRole("button", { name: /add clean code to library/i }),
      ),
    ).resolves.not.toThrow();
  });
});
