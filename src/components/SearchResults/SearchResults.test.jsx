/**
 * SearchResults.test.jsx — Unit tests for the SearchResults page component
 *
 * booksService is mocked so tests are fast and deterministic.
 * react-router-dom's MemoryRouter + initialEntries simulates URL params.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SearchResults from "./SearchResults";
import { booksService } from "../../services/books.service";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("../../services/books.service", () => ({
  booksService: {
    search: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_BOOK = {
  googleBookId: "vol1",
  title: "Clean Code",
  authors: ["Robert C. Martin"],
  description: "",
  thumbnail: "",
  categories: [],
  language: "en",
  publishedDate: "2008",
  embeddable: true,
  viewability: "PARTIAL",
  publicDomain: false,
  webReaderLink: "",
};

// ---------------------------------------------------------------------------
// Helper — renders SearchResults at a given search URL
// ---------------------------------------------------------------------------

const renderAt = (search = "") =>
  render(
    <MemoryRouter initialEntries={[`/search${search}`]}>
      <Routes>
        <Route path="/search" element={<SearchResults />} />
      </Routes>
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SearchResults", () => {
  beforeEach(() => {
    // shouldAdvanceTime: true lets waitFor poll even while fake timers are active
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it("shows empty-query prompt when there is no q param", () => {
    renderAt();
    expect(
      screen.getByText("Enter a search term to find books."),
    ).toBeInTheDocument();
    expect(booksService.search).not.toHaveBeenCalled();
  });

  it("shows the query in the heading when q param is present", async () => {
    booksService.search.mockResolvedValue([MOCK_BOOK]);
    renderAt("?q=javascript");

    // Flush debounce timer + React state updates together
    await act(() => vi.runAllTimersAsync());

    expect(
      screen.getByRole("heading", { name: /results for "javascript"/i }),
    ).toBeInTheDocument();
  });

  it("shows loading state while fetching", async () => {
    // Never-resolving promise keeps the component in loading state
    booksService.search.mockReturnValue(new Promise(() => {}));
    renderAt("?q=javascript");

    // Advance past the debounce delay — fetch is pending so isLoading stays true
    await act(() => vi.runAllTimersAsync());

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders book cards after a successful fetch", async () => {
    booksService.search.mockResolvedValue([MOCK_BOOK]);
    renderAt("?q=clean+code");

    await act(() => vi.runAllTimersAsync());

    expect(screen.getAllByText("Clean Code").length).toBeGreaterThan(0);
  });

  it("shows no-results message when the API returns an empty array", async () => {
    booksService.search.mockResolvedValue([]);
    renderAt("?q=xyznotabook");

    await act(() => vi.runAllTimersAsync());

    expect(screen.getByText(/no results found for/i)).toBeInTheDocument();
  });

  it("shows an error message when the API call fails", async () => {
    booksService.search.mockRejectedValue(new Error("Network error"));
    renderAt("?q=javascript");

    await act(() => vi.runAllTimersAsync());

    expect(screen.getByRole("alert")).toHaveTextContent("Network error");
  });

  it("does not call search for a whitespace-only query", () => {
    renderAt("?q=   ");
    expect(booksService.search).not.toHaveBeenCalled();
  });

  it("calls booksService.search with the decoded query string", async () => {
    booksService.search.mockResolvedValue([]);
    renderAt("?q=clean%20code");

    await act(() => vi.runAllTimersAsync());

    expect(booksService.search).toHaveBeenCalledWith("clean code", {
      maxResults: 12,
      startIndex: 0,
    });
  });

  it("shows the Load more button when a full batch is returned", async () => {
    // Return exactly BATCH_SIZE (12) books so hasMore becomes true
    const fullBatch = Array.from({ length: 12 }, (_, i) => ({
      ...MOCK_BOOK,
      googleBookId: `vol${i}`,
      title: `Book ${i}`,
    }));
    booksService.search.mockResolvedValue(fullBatch);
    renderAt("?q=react");

    await act(() => vi.runAllTimersAsync());

    expect(
      screen.getByRole("button", { name: /load more/i }),
    ).toBeInTheDocument();
  });

  it("does not show the Load more button when fewer than 12 results are returned", async () => {
    booksService.search.mockResolvedValue([MOCK_BOOK]);
    renderAt("?q=singlebook");

    await act(() => vi.runAllTimersAsync());

    expect(
      screen.queryByRole("button", { name: /load more/i }),
    ).not.toBeInTheDocument();
  });
});
