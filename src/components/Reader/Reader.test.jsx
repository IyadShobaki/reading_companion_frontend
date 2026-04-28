/**
 * Reader.test.jsx — Unit tests for the Reader page component
 *
 * booksService is mocked so tests are fast and deterministic.
 * MemoryRouter + initialEntries simulates URL params.
 * The viewer is a plain <iframe> — no external script mocking needed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Reader from "./Reader";
import { booksService } from "../../services/books.service";
import { progressStorage } from "../../utils/progressStorage";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("../../services/books.service", () => ({
  booksService: {
    getById: vi.fn(),
  },
}));

vi.mock("../../utils/progressStorage", () => ({
  progressStorage: {
    saveProgress: vi.fn(),
    loadProgress: vi.fn(),
    clearProgress: vi.fn(),
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

const renderAt = (bookId = "") =>
  render(
    <MemoryRouter initialEntries={[`/reader/${bookId}`]}>
      <Routes>
        <Route path="/reader/:bookId" element={<Reader />} />
        <Route path="/reader" element={<Reader />} />
      </Routes>
    </MemoryRouter>,
  );

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
    // Default: no saved progress
    progressStorage.loadProgress.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -- Fallback -------------------------------------------------------------

  it("shows fallback message when no bookId is in the URL", () => {
    renderNoBook();
    expect(screen.getByText(/no book selected/i)).toBeInTheDocument();
  });

  // -- Loading --------------------------------------------------------------

  it("shows loading indicator while fetching book", () => {
    booksService.getById.mockReturnValue(new Promise(() => {}));
    renderAt("abc123");
    expect(
      screen.getByRole("status", { name: /loading book/i }),
    ).toBeInTheDocument();
  });

  // -- Success: metadata ----------------------------------------------------

  it("renders book title after successful fetch", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(
      screen.getByRole("heading", { name: "Clean Code" }),
    ).toBeInTheDocument();
  });

  it("renders authors", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(screen.getByText("Robert C. Martin")).toBeInTheDocument();
  });

  it("renders published date", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(screen.getByText("2008")).toBeInTheDocument();
  });

  it("renders cover image with alt text", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(
      screen.getByRole("img", { name: /cover of clean code/i }),
    ).toHaveAttribute("src", MOCK_BOOK.thumbnail);
  });

  it("omits cover image when thumbnail is empty", async () => {
    booksService.getById.mockResolvedValue({ ...MOCK_BOOK, thumbnail: "" });
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  // -- Viewer: iframe -------------------------------------------------------

  it("renders the book viewer region", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(
      screen.getByRole("region", { name: /book viewer/i }),
    ).toBeInTheDocument();
  });

  it("renders an iframe with the correct embed src on page 1", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    const iframe = screen.getByTitle(/reading clean code/i);
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe.src).toContain("id=abc123");
    expect(iframe.src).toContain("pg=PA1");
    expect(iframe.src).toContain("output=embed");
  });

  it("shows unavailable message when book is not embeddable", async () => {
    booksService.getById.mockResolvedValue({ ...MOCK_BOOK, embeddable: false });
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(
      screen.getByText(/not available for embedded preview/i),
    ).toBeInTheDocument();
    expect(screen.queryByTitle(/reading/i)).not.toBeInTheDocument();
  });

  it("shows unavailable message when viewability is NO_PAGES", async () => {
    booksService.getById.mockResolvedValue({
      ...MOCK_BOOK,
      viewability: "NO_PAGES",
    });
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(
      screen.getByText(/not available for embedded preview/i),
    ).toBeInTheDocument();
  });

  // -- Page controls --------------------------------------------------------

  it("renders page controls toolbar", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(
      screen.getByRole("toolbar", { name: /page controls/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Page 1")).toBeInTheDocument();
  });

  it("Next button increments page and updates iframe src", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    await userEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    expect(screen.getByTitle(/reading clean code/i).src).toContain("pg=PA2");
  });

  it("Prev button decrements page", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    await userEvent.click(screen.getByRole("button", { name: /next page/i }));
    await userEvent.click(screen.getByRole("button", { name: /next page/i }));
    await userEvent.click(
      screen.getByRole("button", { name: /previous page/i }),
    );
    expect(screen.getByText("Page 2")).toBeInTheDocument();
  });

  it("Prev button does not go below page 1", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    await userEvent.click(
      screen.getByRole("button", { name: /previous page/i }),
    );
    expect(screen.getByText("Page 1")).toBeInTheDocument();
  });

  it("Go to page form navigates to the given page", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    await userEvent.type(screen.getByLabelText(/page number/i), "7");
    await userEvent.click(screen.getByRole("button", { name: /go to page/i }));
    expect(screen.getByText("Page 7")).toBeInTheDocument();
    expect(screen.getByTitle(/reading clean code/i).src).toContain("pg=PA7");
  });

  // -- Sidebar panels -------------------------------------------------------

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
    expect(
      screen.getByRole("region", { name: /ai assistant/i }),
    ).toBeInTheDocument();
  });

  // -- Error ----------------------------------------------------------------

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

  // -- Service interaction --------------------------------------------------

  it("calls getById with the decoded bookId", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt(encodeURIComponent("abc123"));
    await act(() => vi.runAllTimersAsync());
    expect(booksService.getById).toHaveBeenCalledWith("abc123");
  });

  // -- Reading progress: restore --------------------------------------------

  it("resumes from saved progress page when book loads", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    progressStorage.loadProgress.mockReturnValue(8);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(screen.getByText("Page 8")).toBeInTheDocument();
    expect(screen.getByTitle(/reading clean code/i).src).toContain("pg=PA8");
  });

  it("calls loadProgress with the book's googleBookId", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(progressStorage.loadProgress).toHaveBeenCalledWith("abc123");
  });

  it("starts at page 1 when no progress is saved", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    progressStorage.loadProgress.mockReturnValue(null);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(screen.getByText("Page 1")).toBeInTheDocument();
  });

  // -- Reading progress: save -----------------------------------------------

  it("renders a Save Progress button in the controls toolbar", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    expect(
      screen.getByRole("button", { name: /save progress/i }),
    ).toBeInTheDocument();
  });

  it("clicking Save Progress calls saveProgress with the current page", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    await userEvent.click(screen.getByRole("button", { name: /next page/i }));
    await userEvent.click(
      screen.getByRole("button", { name: /save progress/i }),
    );
    expect(progressStorage.saveProgress).toHaveBeenCalledWith("abc123", 2);
  });

  it("Save Progress button shows saved indicator after clicking", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    await userEvent.click(
      screen.getByRole("button", { name: /save progress/i }),
    );
    expect(
      screen.getByRole("button", { name: /progress saved/i }),
    ).toBeInTheDocument();
  });

  it("saved indicator resets after navigating to the next page", async () => {
    booksService.getById.mockResolvedValue(MOCK_BOOK);
    renderAt("abc123");
    await act(() => vi.runAllTimersAsync());
    await userEvent.click(
      screen.getByRole("button", { name: /save progress/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(
      screen.getByRole("button", { name: /save progress/i }),
    ).toBeInTheDocument();
  });
});
