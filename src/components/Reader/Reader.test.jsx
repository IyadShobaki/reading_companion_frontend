/**
 * Reader.test.jsx — Unit tests for the Reader page component
 *
 * booksService is mocked so tests are fast and deterministic.
 * MemoryRouter + initialEntries simulates URL params.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Reader from "./Reader";
import { booksService } from "../../services/books.service";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("../../services/books.service", () => ({
  booksService: {
    getById: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_BOOK = {
  googleBookId: "abc123",
  title: "Clean Code",
  authors: ["Robert C. Martin"],
  description: "A handbook of agile software craftsmanship.",
  thumbnail: "https://books.google.com/books/cover.jpg",
  categories: ["Programming"],
  language: "en",
  publishedDate: "2008",
  embeddable: true,
  viewability: "PARTIAL",
  publicDomain: false,
  webReaderLink: "https://play.google.com/books/reader?id=abc123",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Renders <Reader /> at /reader/:bookId */
const renderAt = (bookId = "") =>
  render(
    <MemoryRouter initialEntries={[`/reader/${bookId}`]}>
      <Routes>
        <Route path="/reader/:bookId" element={<Reader />} />
        <Route path="/reader" element={<Reader />} />
      </Routes>
    </MemoryRouter>,
  );

/** Renders <Reader /> with no bookId (bare /reader route) */
const renderNoBook = () =>
  render(
    <MemoryRouter initialEntries={["/reader"]}>
      <Routes>
        <Route path="/reader" element={<Reader />} />
      </Routes>
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Reader", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Fallback — no book selected ─────────────────────────────────────────

  it("shows fallback message when no bookId is in the URL", () => {
    renderNoBook();
    expect(screen.getByText(/no book selected/i)).toBeInTheDocument();
  });

  // ── Loading state ────────────────────────────────────────────────────────

  it("shows loading indicator while fetching book", () => {
    booksService.getById.mockReturnValue(new Promise(() => {})); // never resolves
    renderAt("abc123");
    expect(
      screen.getByRole("status", { name: /loading book/i }),
    ).toBeInTheDocument();
  });

  // ── Success state ────────────────────────────────────────────────────────

  it("renders book title after successful fetch", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(
      screen.getByRole("heading", { name: "Clean Code" }),
    ).toBeInTheDocument();
  });

  it("renders authors after successful fetch", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(screen.getByText("Robert C. Martin")).toBeInTheDocument();
  });

  it("renders published date after successful fetch", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(screen.getByText("2008")).toBeInTheDocument();
  });

  it("renders cover image with alt text", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    const img = screen.getByRole("img", { name: /cover of clean code/i });
    expect(img).toHaveAttribute("src", MOCK_BOOK.thumbnail);
  });

  it("omits cover image when thumbnail is empty", async () => {
    booksService.getById.mockResolvedValue({ ...MOCK_BOOK, thumbnail: "" });
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  // ── Viewer container ─────────────────────────────────────────────────────

  it("renders the book viewer region", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(
      screen.getByRole("region", { name: /book viewer/i }),
    ).toBeInTheDocument();
  });

  // ── Sidebar panels ───────────────────────────────────────────────────────

  it("renders the Notes panel", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(screen.getByRole("region", { name: /notes/i })).toBeInTheDocument();
  });

  it("renders the AI Assistant panel", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(screen.getByRole("complementary")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /ai assistant/i }),
    ).toBeInTheDocument();
  });

  // ── Error state ──────────────────────────────────────────────────────────

  it("shows error message when fetch fails", async () => {
    booksService.getById.mockRejectedValue(
      new Error("Google Books API error: 404"),
    );
    renderAt("badId");
    await act(() => vi.runAllTimersAsync());
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText(/google books api error: 404/i),
    ).toBeInTheDocument();
  });

  // ── Service interaction ──────────────────────────────────────────────────

  it("calls getById with the decoded bookId", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt(encodeURIComponent("abc123"));
    await act(() => vi.runAllTimersAsync());
    expect(booksService.getById).toHaveBeenCalledWith("abc123");
  });
});
