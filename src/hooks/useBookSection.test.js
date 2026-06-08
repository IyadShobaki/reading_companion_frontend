/**
 * useBookSection.test.js — Unit tests for the useBookSection custom hook
 */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBookSection } from "./useBookSection";
import { booksService } from "../services/books.service";
import { getCached, setCached } from "../utils/bookCache";

// Mock the entire books service module; booksService.fetchSection becomes a spy
vi.mock("../services/books.service", () => ({
  booksService: {
    fetchSection: vi.fn(),
  },
}));

// Mock bookCache so tests control cache hits/misses and can inspect setCached calls
vi.mock("../utils/bookCache", () => ({
  getCached: vi.fn(),
  setCached: vi.fn(),
  clearCached: vi.fn(),
  CACHE_TTL_MS: 86400000,
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
// Tests
// ---------------------------------------------------------------------------

describe("useBookSection", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default to a cache miss so existing fetch-focused tests are unaffected
    getCached.mockReturnValue(null);
  });

  it("starts in loading state with empty books and no error", () => {
    // Keep the promise pending so we can inspect the initial state
    booksService.fetchSection.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useBookSection("trending"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.books).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("resolves books and stops loading on a successful fetch", async () => {
    booksService.fetchSection.mockResolvedValue([MOCK_BOOK]);

    const { result } = renderHook(() => useBookSection("trending"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.books).toEqual([MOCK_BOOK]);
    expect(result.current.error).toBeNull();
  });

  it("sets error and stops loading when the fetch rejects", async () => {
    booksService.fetchSection.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useBookSection("trending"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Network error");
    expect(result.current.books).toEqual([]);
  });

  it("falls back to a default error message when the error has no message", async () => {
    booksService.fetchSection.mockRejectedValue({});

    const { result } = renderHook(() => useBookSection("trending"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Failed to load books.");
  });

  it("returns empty books array (not an error) when the fetch resolves with []", async () => {
    booksService.fetchSection.mockResolvedValue([]);

    const { result } = renderHook(() => useBookSection("philosophy"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.books).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("passes the sectionKey to booksService.fetchSection", async () => {
    booksService.fetchSection.mockResolvedValue([]);

    renderHook(() => useBookSection("romance"));

    await waitFor(() =>
      expect(booksService.fetchSection).toHaveBeenCalledWith("romance"),
    );
  });

  it("re-fetches and resets state when sectionKey changes", async () => {
    booksService.fetchSection.mockResolvedValue([MOCK_BOOK]);

    const { result, rerender } = renderHook(({ key }) => useBookSection(key), {
      initialProps: { key: "trending" },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(booksService.fetchSection).toHaveBeenCalledWith("trending");

    rerender({ key: "new" });

    // Loading should be true again immediately after the key changes
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(booksService.fetchSection).toHaveBeenCalledWith("new");
  });
});

// ---------------------------------------------------------------------------
// Cache behaviour
// ---------------------------------------------------------------------------

describe("useBookSection — cache behaviour", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("uses cached data and never calls fetchSection when the cache is valid", async () => {
    getCached.mockReturnValue([MOCK_BOOK]);

    const { result } = renderHook(() => useBookSection("trending"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.books).toEqual([MOCK_BOOK]);
    expect(booksService.fetchSection).not.toHaveBeenCalled();
  });

  it("returns no error when populating books from the cache", async () => {
    getCached.mockReturnValue([MOCK_BOOK]);

    const { result } = renderHook(() => useBookSection("trending"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
  });

  it("calls fetchSection when getCached returns null (cache miss or expired)", async () => {
    getCached.mockReturnValue(null);
    booksService.fetchSection.mockResolvedValue([MOCK_BOOK]);

    renderHook(() => useBookSection("philosophy"));

    await waitFor(() =>
      expect(booksService.fetchSection).toHaveBeenCalledWith("philosophy"),
    );
  });

  it("writes to cache with the correct key after a successful fetch", async () => {
    getCached.mockReturnValue(null);
    booksService.fetchSection.mockResolvedValue([MOCK_BOOK]);

    renderHook(() => useBookSection("romance"));

    await waitFor(() =>
      expect(setCached).toHaveBeenCalledWith("rc_books_romance", [MOCK_BOOK]),
    );
  });

  it("sets error state and does not write to cache when the fetch fails", async () => {
    getCached.mockReturnValue(null);
    booksService.fetchSection.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useBookSection("technology"));

    await waitFor(() => expect(result.current.error).toBe("Network error"));
    expect(setCached).not.toHaveBeenCalled();
  });
});
