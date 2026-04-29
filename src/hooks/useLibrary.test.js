/**
 * useLibrary.test.js — Unit tests for the library state management hook
 *
 * libraryService is mocked so tests are fast and deterministic.
 * renderHook from @testing-library/react lets us exercise the hook
 * in isolation without a full component tree.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLibrary } from "./useLibrary";
import { libraryService } from "../services/library.service";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("../services/library.service", () => ({
  libraryService: {
    getAll: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BOOK_A = {
  googleBookId: "aaa",
  title: "Book A",
  authors: ["Author A"],
  thumbnail: "",
  embeddable: true,
  viewability: "PARTIAL",
};

const BOOK_B = {
  googleBookId: "bbb",
  title: "Book B",
  authors: ["Author B"],
  thumbnail: "",
  embeddable: false,
  viewability: "NO_PAGES",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useLibrary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial state ─────────────────────────────────────────────────────────

  it("starts with an empty library and no loading or error state", () => {
    const { result } = renderHook(() => useLibrary());
    expect(result.current.savedBooks).toEqual([]);
    expect(result.current.savedBookIds).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ── fetchLibrary ──────────────────────────────────────────────────────────

  it("fetchLibrary populates savedBooks on success", async () => {
    libraryService.getAll.mockResolvedValue([BOOK_A, BOOK_B]);
    const { result } = renderHook(() => useLibrary());
    await act(() => result.current.fetchLibrary());
    expect(result.current.savedBooks).toEqual([BOOK_A, BOOK_B]);
    expect(result.current.isLoading).toBe(false);
  });

  it("fetchLibrary sets error on failure", async () => {
    libraryService.getAll.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useLibrary());
    await act(() => result.current.fetchLibrary());
    expect(result.current.error).toBe("Network error");
    expect(result.current.savedBooks).toEqual([]);
  });

  it("fetchLibrary shows a session-expired message on 401", async () => {
    const err = Object.assign(new Error("Unauthorized"), { status: 401 });
    libraryService.getAll.mockRejectedValue(err);
    const { result } = renderHook(() => useLibrary());
    await act(() => result.current.fetchLibrary());
    expect(result.current.error).toBe(
      "Your session has expired. Please sign in again.",
    );
    expect(result.current.savedBooks).toEqual([]);
  });

  it("fetchLibrary sets isLoading true during the fetch", async () => {
    let resolveGetAll;
    libraryService.getAll.mockReturnValue(
      new Promise((res) => {
        resolveGetAll = res;
      }),
    );
    const { result } = renderHook(() => useLibrary());
    act(() => {
      result.current.fetchLibrary();
    });
    expect(result.current.isLoading).toBe(true);
    await act(async () => resolveGetAll([]));
    expect(result.current.isLoading).toBe(false);
  });

  // ── savedBookIds ──────────────────────────────────────────────────────────

  it("savedBookIds contains the googleBookId of each saved book", async () => {
    libraryService.getAll.mockResolvedValue([BOOK_A, BOOK_B]);
    const { result } = renderHook(() => useLibrary());
    await act(() => result.current.fetchLibrary());
    expect(result.current.savedBookIds).toEqual(["aaa", "bbb"]);
  });

  // ── addBook ───────────────────────────────────────────────────────────────

  it("addBook optimistically adds the book before the API resolves", async () => {
    let resolveAdd;
    libraryService.add.mockReturnValue(
      new Promise((res) => {
        resolveAdd = res;
      }),
    );
    const { result } = renderHook(() => useLibrary());
    act(() => {
      result.current.addBook(BOOK_A);
    });
    // Book should appear immediately (optimistic)
    expect(result.current.savedBooks).toContainEqual(BOOK_A);
    await act(async () => resolveAdd(BOOK_A));
  });

  it("addBook calls libraryService.add with the full book object", async () => {
    libraryService.add.mockResolvedValue(BOOK_A);
    const { result } = renderHook(() => useLibrary());
    await act(() => result.current.addBook(BOOK_A));
    expect(libraryService.add).toHaveBeenCalledWith(BOOK_A);
  });

  it("addBook rolls back on API failure", async () => {
    libraryService.add.mockRejectedValue(new Error("Server error"));
    const { result } = renderHook(() => useLibrary());
    await act(() => result.current.addBook(BOOK_A));
    expect(result.current.savedBooks).toEqual([]);
    expect(result.current.error).toBe("Server error");
  });

  it("addBook rolls back and shows a friendly message on 409 (duplicate)", async () => {
    const err = Object.assign(new Error("Conflict"), { status: 409 });
    libraryService.add.mockRejectedValue(err);
    const { result } = renderHook(() => useLibrary());
    await act(() => result.current.addBook(BOOK_A));
    // Rollback — the optimistic add is reversed
    expect(result.current.savedBooks).toEqual([]);
    expect(result.current.error).toBe(
      "This book is already saved in your library.",
    );
  });

  it("addBook shows a session-expired message on 401", async () => {
    const err = Object.assign(new Error("Unauthorized"), { status: 401 });
    libraryService.add.mockRejectedValue(err);
    const { result } = renderHook(() => useLibrary());
    await act(() => result.current.addBook(BOOK_A));
    expect(result.current.savedBooks).toEqual([]);
    expect(result.current.error).toBe(
      "Your session has expired. Please sign in again.",
    );
  });

  // ── removeBook ────────────────────────────────────────────────────────────

  it("removeBook optimistically removes the book before the API resolves", async () => {
    libraryService.getAll.mockResolvedValue([BOOK_A, BOOK_B]);
    let resolveRemove;
    libraryService.remove.mockReturnValue(
      new Promise((res) => {
        resolveRemove = res;
      }),
    );
    const { result } = renderHook(() => useLibrary());
    await act(() => result.current.fetchLibrary());
    act(() => {
      result.current.removeBook("aaa");
    });
    // Should be removed immediately
    expect(result.current.savedBooks.map((b) => b.googleBookId)).not.toContain(
      "aaa",
    );
    await act(async () => resolveRemove({}));
  });

  it("removeBook calls libraryService.remove with the googleBookId", async () => {
    libraryService.getAll.mockResolvedValue([BOOK_A]);
    libraryService.remove.mockResolvedValue({});
    const { result } = renderHook(() => useLibrary());
    await act(() => result.current.fetchLibrary());
    await act(() => result.current.removeBook("aaa"));
    expect(libraryService.remove).toHaveBeenCalledWith("aaa");
  });

  it("removeBook rolls back on API failure", async () => {
    libraryService.getAll.mockResolvedValue([BOOK_A]);
    libraryService.remove.mockRejectedValue(new Error("Remove failed"));
    const { result } = renderHook(() => useLibrary());
    await act(() => result.current.fetchLibrary());
    await act(() => result.current.removeBook("aaa"));
    // Rolled back — book should be there again
    expect(result.current.savedBooks).toContainEqual(BOOK_A);
    expect(result.current.error).toBe("Remove failed");
  });

  it("removeBook rolls back and shows a session-expired message on 401", async () => {
    const err = Object.assign(new Error("Unauthorized"), { status: 401 });
    libraryService.getAll.mockResolvedValue([BOOK_A]);
    libraryService.remove.mockRejectedValue(err);
    const { result } = renderHook(() => useLibrary());
    await act(() => result.current.fetchLibrary());
    await act(() => result.current.removeBook("aaa"));
    expect(result.current.savedBooks).toContainEqual(BOOK_A);
    expect(result.current.error).toBe(
      "Your session has expired. Please sign in again.",
    );
  });

  it("removeBook rolls back and shows a permission message on 403", async () => {
    const err = Object.assign(new Error("Forbidden"), { status: 403 });
    libraryService.getAll.mockResolvedValue([BOOK_A]);
    libraryService.remove.mockRejectedValue(err);
    const { result } = renderHook(() => useLibrary());
    await act(() => result.current.fetchLibrary());
    await act(() => result.current.removeBook("aaa"));
    expect(result.current.savedBooks).toContainEqual(BOOK_A);
    expect(result.current.error).toBe(
      "You don't have permission to remove this book.",
    );
  });

  // ── clearLibrary ──────────────────────────────────────────────────────────

  it("clearLibrary resets savedBooks and error", async () => {
    libraryService.getAll.mockResolvedValue([BOOK_A]);
    const { result } = renderHook(() => useLibrary());
    await act(() => result.current.fetchLibrary());
    act(() => result.current.clearLibrary());
    expect(result.current.savedBooks).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
