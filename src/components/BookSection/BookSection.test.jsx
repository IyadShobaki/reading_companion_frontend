/**
 * BookSection.test.jsx — Unit tests for the BookSection component
 *
 * booksService is mocked so tests are fast and deterministic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BookSection from "./BookSection";
import { booksService } from "../../services/books.service";

// ---------------------------------------------------------------------------
// Module mock — replaces booksService with a controllable spy
// ---------------------------------------------------------------------------

vi.mock("../../services/books.service", () => ({
  booksService: {
    fetchSection: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_BOOK = {
  googleBookId: "vol1",
  title: "Test Book",
  authors: ["Author A"],
  description: "",
  thumbnail: "",
  categories: [],
  language: "en",
  publishedDate: "2020",
  embeddable: true,
  viewability: "PARTIAL",
  publicDomain: false,
  webReaderLink: "",
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const renderSection = (props = {}) =>
  render(
    <MemoryRouter>
      <BookSection title="Trending" sectionKey="trending" {...props} />
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BookSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Clear bookCache localStorage entries so tests don't bleed into each other
    localStorage.clear();
  });

  it("renders the section heading", async () => {
    booksService.fetchSection.mockResolvedValue([]);
    renderSection({ title: "Philosophy", sectionKey: "philosophy" });
    expect(
      screen.getByRole("heading", { name: "Philosophy" }),
    ).toBeInTheDocument();
  });

  it("shows a loading indicator while books are being fetched", () => {
    // Keep the promise pending so loading state persists through the assertion
    booksService.fetchSection.mockReturnValue(new Promise(() => {}));
    renderSection();
    expect(
      screen.getByRole("status", { name: /loading trending/i }),
    ).toBeInTheDocument();
  });

  it("hides the loading indicator after fetch resolves", async () => {
    booksService.fetchSection.mockResolvedValue([MOCK_BOOK]);
    renderSection();
    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );
  });

  it("renders a BookCard for each returned book after a successful fetch", async () => {
    booksService.fetchSection.mockResolvedValue([MOCK_BOOK]);
    renderSection();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /start reading test book/i }),
      ).toBeInTheDocument(),
    );
  });

  it("shows an empty-state message when the fetch resolves with no books", async () => {
    booksService.fetchSection.mockResolvedValue([]);
    renderSection();
    await waitFor(() =>
      expect(
        screen.getByText(/no books available in this section/i),
      ).toBeInTheDocument(),
    );
  });

  it("shows an error message when the fetch rejects", async () => {
    booksService.fetchSection.mockRejectedValue(new Error("API unavailable"));
    renderSection();
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("API unavailable"),
    );
  });

  it("does not render both the error and the empty state simultaneously", async () => {
    booksService.fetchSection.mockRejectedValue(new Error("Fail"));
    renderSection();
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.queryByText(/no books available/i)).not.toBeInTheDocument();
  });

  it("passes isLoggedIn down — library buttons appear for authenticated users", async () => {
    booksService.fetchSection.mockResolvedValue([MOCK_BOOK]);
    renderSection({ isLoggedIn: true });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /add test book to library/i }),
      ).toBeInTheDocument(),
    );
  });

  it("does not show library buttons for guests", async () => {
    booksService.fetchSection.mockResolvedValue([MOCK_BOOK]);
    renderSection({ isLoggedIn: false });
    await waitFor(() =>
      expect(screen.queryByText("Add to Library")).not.toBeInTheDocument(),
    );
  });
});
