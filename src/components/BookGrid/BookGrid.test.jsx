/**
 * BookGrid.test.jsx — Unit tests for the BookGrid component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import BookGrid from "./BookGrid";

// progressStorage is used by BookCard — mock so tests aren't localStorage-dependent
vi.mock("../../utils/progressStorage", () => ({
  progressStorage: { loadProgress: vi.fn(() => null) },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeBook = (id, title) => ({
  googleBookId: id,
  title,
  authors: ["Author"],
  description: "",
  thumbnail: "",
  categories: [],
  language: "en",
  publishedDate: "2020",
  embeddable: true,
  viewability: "PARTIAL",
  publicDomain: false,
  webReaderLink: "",
});

const BOOKS = [
  makeBook("id1", "Book One"),
  makeBook("id2", "Book Two"),
  makeBook("id3", "Book Three"),
];

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const renderGrid = (props = {}) =>
  render(
    <MemoryRouter>
      <BookGrid books={BOOKS} {...props} />
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BookGrid", () => {
  it("renders one BookCard for each book in the array", () => {
    renderGrid();
    // Each card has a "Start Reading <title>" button
    expect(
      screen.getByRole("button", { name: /start reading book one/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start reading book two/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start reading book three/i }),
    ).toBeInTheDocument();
  });

  it("renders an empty list when books is an empty array", () => {
    render(
      <MemoryRouter>
        <BookGrid books={[]} />
      </MemoryRouter>,
    );
    // No list items
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("marks a card as saved when its id is in savedBookIds", () => {
    renderGrid({ isLoggedIn: true, savedBookIds: ["id2"] });
    // "id2" → Book Two → Remove button should be visible
    expect(
      screen.getByRole("button", { name: /remove book two from library/i }),
    ).toBeInTheDocument();
    // Other books → Add to Library
    expect(
      screen.getByRole("button", { name: /add book one to library/i }),
    ).toBeInTheDocument();
  });

  it("does not show library buttons when isLoggedIn is false", () => {
    renderGrid({ isLoggedIn: false });
    expect(screen.queryByText("Add to Library")).not.toBeInTheDocument();
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });

  it("calls onAddToLibrary with the correct book when the add button is clicked", async () => {
    const onAddToLibrary = vi.fn();
    const { getByRole } = render(
      <MemoryRouter>
        <BookGrid
          books={BOOKS}
          isLoggedIn={true}
          savedBookIds={[]}
          onAddToLibrary={onAddToLibrary}
        />
      </MemoryRouter>,
    );

    await userEvent.click(
      getByRole("button", { name: /add book one to library/i }),
    );

    expect(onAddToLibrary).toHaveBeenCalledWith(BOOKS[0]);
  });
});
