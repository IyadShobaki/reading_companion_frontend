/**
 * BookPreviewModal.test.jsx — Unit tests for the BookPreviewModal component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import BookPreviewModal from "./BookPreviewModal";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FULL_BOOK = {
  googleBookId: "abc123",
  title: "Clean Code",
  authors: ["Robert C. Martin"],
  description: "A handbook of agile software craftsmanship.",
  thumbnail: "https://books.google.com/thumb.jpg",
  categories: ["Computers"],
  publishedDate: "2008-08-01",
  embeddable: true,
  viewability: "PARTIAL",
  publicDomain: false,
  webReaderLink: "",
};

const NO_THUMBNAIL_BOOK = { ...FULL_BOOK, thumbnail: "" };
const NO_DESCRIPTION_BOOK = { ...FULL_BOOK, description: "" };
const NO_CATEGORIES_BOOK = { ...FULL_BOOK, categories: [] };
const NO_DATE_BOOK = { ...FULL_BOOK, publishedDate: "" };
const LIMITED_BOOK = {
  ...FULL_BOOK,
  googleBookId: "limited1",
  embeddable: false,
  viewability: "NO_PAGES",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function LocationDisplay() {
  const loc = useLocation();
  return <span data-testid="location">{loc.pathname}</span>;
}

const renderModal = (props = {}) =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <BookPreviewModal
                isOpen={true}
                book={FULL_BOOK}
                onClose={vi.fn()}
                {...props}
              />
              <LocationDisplay />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BookPreviewModal", () => {
  // ---- Visibility ----------------------------------------------------------

  it("is not visible when isOpen is false", () => {
    const { container } = renderModal({ isOpen: false });
    const modal = container.querySelector(".modal");
    expect(modal).not.toHaveClass("modal_opened");
  });

  it("is visible when isOpen is true", () => {
    const { container } = renderModal({ isOpen: true });
    const modal = container.querySelector(".modal");
    expect(modal).toHaveClass("modal_opened");
  });

  it("renders nothing useful when book is null", () => {
    const { container } = renderModal({ book: null });
    // No title, no buttons — just the bare modal wrapper
    expect(container.querySelector(".book-preview-modal__title")).toBeNull();
    expect(screen.queryByRole("button", { name: /start reading/i })).toBeNull();
  });

  // ---- Content -------------------------------------------------------------

  it("displays the book title", () => {
    renderModal();
    expect(
      screen.getByRole("heading", { name: "Clean Code" }),
    ).toBeInTheDocument();
  });

  it("displays the authors", () => {
    renderModal();
    expect(screen.getByText("Robert C. Martin")).toBeInTheDocument();
  });

  it("displays the description", () => {
    renderModal();
    expect(
      screen.getByText("A handbook of agile software craftsmanship."),
    ).toBeInTheDocument();
  });

  it("does not render description element when description is empty", () => {
    renderModal({ book: NO_DESCRIPTION_BOOK });
    expect(
      screen.queryByText("A handbook of agile software craftsmanship."),
    ).toBeNull();
  });

  it("displays categories when present", () => {
    renderModal();
    expect(screen.getByText("Computers")).toBeInTheDocument();
  });

  it("does not render categories when the list is empty", () => {
    renderModal({ book: NO_CATEGORIES_BOOK });
    expect(screen.queryByText("Computers")).toBeNull();
  });

  it("displays the published date", () => {
    renderModal();
    expect(screen.getByText(/2008-08-01/)).toBeInTheDocument();
  });

  it("does not render published date when it is empty", () => {
    renderModal({ book: NO_DATE_BOOK });
    expect(screen.queryByText(/published/i)).toBeNull();
  });

  it("renders the cover image when a thumbnail URL is present", () => {
    renderModal();
    const img = screen.getByRole("img", { name: /cover of clean code/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", FULL_BOOK.thumbnail);
  });

  it("renders a placeholder when no thumbnail is available", () => {
    const { container } = renderModal({ book: NO_THUMBNAIL_BOOK });
    expect(
      container.querySelector(".book-preview-modal__cover-placeholder"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /cover of/i })).toBeNull();
  });

  // ---- Availability --------------------------------------------------------

  it("does not show Limited Access badge for an accessible book", () => {
    renderModal();
    expect(screen.queryByText("Limited Access")).toBeNull();
  });

  it("shows Limited Access badge for a non-embeddable book", () => {
    renderModal({ book: LIMITED_BOOK });
    expect(screen.getByText("Limited Access")).toBeInTheDocument();
  });

  // ---- Actions -------------------------------------------------------------

  it("always renders the Start Reading button", () => {
    renderModal();
    expect(
      screen.getByRole("button", { name: /start reading clean code/i }),
    ).toBeInTheDocument();
  });

  it("navigates to the reader route and closes modal when Start Reading is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });

    await user.click(
      screen.getByRole("button", { name: /start reading clean code/i }),
    );

    expect(screen.getByTestId("location").textContent).toBe("/reader/abc123");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render library buttons when user is not logged in", () => {
    renderModal({ isLoggedIn: false });
    expect(
      screen.queryByRole("button", { name: /add to library/i }),
    ).toBeNull();
  });

  it("renders Add to Library button when logged in and book is not saved", () => {
    renderModal({ isLoggedIn: true, isSaved: false });
    expect(
      screen.getByRole("button", { name: /add clean code to library/i }),
    ).toBeInTheDocument();
  });

  it("renders Remove from Library button when logged in and book is saved", () => {
    renderModal({ isLoggedIn: true, isSaved: true });
    expect(
      screen.getByRole("button", { name: /remove clean code from library/i }),
    ).toBeInTheDocument();
  });

  it("calls onAddToLibrary with the full book when Add to Library is clicked", async () => {
    const user = userEvent.setup();
    const onAddToLibrary = vi.fn();
    renderModal({ isLoggedIn: true, isSaved: false, onAddToLibrary });

    await user.click(
      screen.getByRole("button", { name: /add clean code to library/i }),
    );

    expect(onAddToLibrary).toHaveBeenCalledWith(FULL_BOOK);
  });

  it("calls onRemoveFromLibrary with the googleBookId when Remove is clicked", async () => {
    const user = userEvent.setup();
    const onRemoveFromLibrary = vi.fn();
    renderModal({ isLoggedIn: true, isSaved: true, onRemoveFromLibrary });

    await user.click(
      screen.getByRole("button", { name: /remove clean code from library/i }),
    );

    expect(onRemoveFromLibrary).toHaveBeenCalledWith("abc123");
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderModal({ onClose });

    await user.click(screen.getByRole("button", { name: /close preview/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ---- Accessibility -------------------------------------------------------

  it("has role=dialog and aria-modal=true", () => {
    const { container } = renderModal();
    const dialog = container.querySelector("[role='dialog']");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("labels the dialog with the book title via aria-labelledby", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    const labelId = dialog.getAttribute("aria-labelledby");
    const labelEl = document.getElementById(labelId);
    expect(labelEl).toHaveTextContent("Clean Code");
  });
});
