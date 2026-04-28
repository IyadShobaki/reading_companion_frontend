/**
 * useGoogleBooksViewer.test.js — unit tests for the viewer lifecycle hook.
 *
 * loadGoogleBooksApi is mocked so no real network request is made.
 * window.google.books.DefaultViewer is replaced with a controllable mock.
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useGoogleBooksViewer } from "./useGoogleBooksViewer";
import { loadGoogleBooksApi } from "../utils/googleBooksLoader";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("../utils/googleBooksLoader", () => ({
  loadGoogleBooksApi: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Viewer mock factory
// ---------------------------------------------------------------------------

/**
 * Creates a mock DefaultViewer instance.
 *
 * @param {"success"|"failure"} loadResult — controls whether onSuccess or onFailure is called
 * @param {number} initialPage
 */
function makeViewerMock(loadResult = "success", initialPage = 1) {
  let _page = initialPage;

  return {
    load: vi.fn((id, notFoundCallback, successCallback) => {
      if (loadResult === "success") {
        successCallback();
      } else {
        notFoundCallback();
      }
    }),
    nextPage: vi.fn(() => {
      _page += 1;
    }),
    previousPage: vi.fn(() => {
      _page = Math.max(1, _page - 1);
    }),
    goToPage: vi.fn((page) => {
      _page = page;
    }),
    getPageNumber: vi.fn(() => _page),
    getPageId: vi.fn(() => `PT${_page}`),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useGoogleBooksViewer", () => {
  let containerEl;
  let containerRef;
  let viewerMock;

  beforeEach(() => {
    containerEl = document.createElement("div");
    document.body.appendChild(containerEl);
    containerRef = { current: containerEl };

    viewerMock = makeViewerMock("success", 1);

    // loadGoogleBooksApi resolves immediately
    loadGoogleBooksApi.mockResolvedValue(undefined);

    // Provide window.google.books
    window.google = {
      books: {
        // Regular function required — arrow functions cannot be called with `new`
        DefaultViewer: vi.fn(function () {
          return viewerMock;
        }),
      },
    };
  });

  afterEach(() => {
    document.body.removeChild(containerEl);
    delete window.google;
    vi.clearAllMocks();
  });

  // ── Initial state ─────────────────────────────────────────────────────────

  it("starts in idle state when no googleBookId is provided", () => {
    const { result } = renderHook(() =>
      useGoogleBooksViewer({
        googleBookId: "",
        embeddable: true,
        viewability: "PARTIAL",
        containerRef,
      }),
    );
    expect(result.current.viewerState).toBe("idle");
  });

  // ── Unavailable states ────────────────────────────────────────────────────

  it("sets viewerState to unavailable when book is not embeddable", async () => {
    const { result } = renderHook(() =>
      useGoogleBooksViewer({
        googleBookId: "abc123",
        embeddable: false,
        viewability: "PARTIAL",
        containerRef,
      }),
    );
    await act(async () => {});
    expect(result.current.viewerState).toBe("unavailable");
  });

  it("sets viewerState to unavailable when viewability is NO_PAGES", async () => {
    const { result } = renderHook(() =>
      useGoogleBooksViewer({
        googleBookId: "abc123",
        embeddable: true,
        viewability: "NO_PAGES",
        containerRef,
      }),
    );
    await act(async () => {});
    expect(result.current.viewerState).toBe("unavailable");
  });

  // ── Success state ─────────────────────────────────────────────────────────

  it("sets viewerState to ready when viewer loads successfully", async () => {
    const { result } = renderHook(() =>
      useGoogleBooksViewer({
        googleBookId: "abc123",
        embeddable: true,
        viewability: "PARTIAL",
        containerRef,
      }),
    );
    await act(async () => {});
    expect(result.current.viewerState).toBe("ready");
  });

  it("sets currentPage from getPageNumber after successful load", async () => {
    viewerMock = makeViewerMock("success", 5);
    window.google.books.DefaultViewer = vi.fn(function () {
      return viewerMock;
    });

    const { result } = renderHook(() =>
      useGoogleBooksViewer({
        googleBookId: "abc123",
        embeddable: true,
        viewability: "PARTIAL",
        containerRef,
      }),
    );
    await act(async () => {});
    expect(result.current.currentPage).toBe(5);
  });

  it("calls DefaultViewer with the container element", async () => {
    renderHook(() =>
      useGoogleBooksViewer({
        googleBookId: "abc123",
        embeddable: true,
        viewability: "PARTIAL",
        containerRef,
      }),
    );
    await act(async () => {});
    expect(window.google.books.DefaultViewer).toHaveBeenCalledWith(containerEl);
  });

  it("calls viewer.load with the googleBookId", async () => {
    renderHook(() =>
      useGoogleBooksViewer({
        googleBookId: "abc123",
        embeddable: true,
        viewability: "PARTIAL",
        containerRef,
      }),
    );
    await act(async () => {});
    expect(viewerMock.load).toHaveBeenCalledWith(
      "abc123",
      expect.any(Function),
      expect.any(Function),
    );
  });

  // ── Failure state ─────────────────────────────────────────────────────────

  it("sets viewerState to failed when viewer.load calls onFailure", async () => {
    viewerMock = makeViewerMock("failure");
    window.google.books.DefaultViewer = vi.fn(function () {
      return viewerMock;
    });

    const { result } = renderHook(() =>
      useGoogleBooksViewer({
        googleBookId: "abc123",
        embeddable: true,
        viewability: "PARTIAL",
        containerRef,
      }),
    );
    await act(async () => {});
    expect(result.current.viewerState).toBe("failed");
  });

  it("sets viewerState to failed when loadGoogleBooksApi rejects", async () => {
    loadGoogleBooksApi.mockRejectedValue(new Error("Script load failed"));

    const { result } = renderHook(() =>
      useGoogleBooksViewer({
        googleBookId: "abc123",
        embeddable: true,
        viewability: "PARTIAL",
        containerRef,
      }),
    );
    await act(async () => {});
    expect(result.current.viewerState).toBe("failed");
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  it("nextPage calls viewer.nextPage and updates currentPage", async () => {
    viewerMock = makeViewerMock("success", 3);
    window.google.books.DefaultViewer = vi.fn(function () {
      return viewerMock;
    });

    const { result } = renderHook(() =>
      useGoogleBooksViewer({
        googleBookId: "abc123",
        embeddable: true,
        viewability: "PARTIAL",
        containerRef,
      }),
    );
    await act(async () => {});
    act(() => result.current.nextPage());
    expect(viewerMock.nextPage).toHaveBeenCalled();
    expect(result.current.currentPage).toBe(4);
  });

  it("prevPage calls viewer.previousPage and updates currentPage", async () => {
    viewerMock = makeViewerMock("success", 3);
    window.google.books.DefaultViewer = vi.fn(function () {
      return viewerMock;
    });

    const { result } = renderHook(() =>
      useGoogleBooksViewer({
        googleBookId: "abc123",
        embeddable: true,
        viewability: "PARTIAL",
        containerRef,
      }),
    );
    await act(async () => {});
    act(() => result.current.prevPage());
    expect(viewerMock.previousPage).toHaveBeenCalled();
    expect(result.current.currentPage).toBe(2);
  });

  it("goToPage calls viewer.goToPage with the given page number", async () => {
    // Uses default beforeEach mock (initialPage 1, loadResult success)
    const { result } = renderHook(() =>
      useGoogleBooksViewer({
        googleBookId: "abc123",
        embeddable: true,
        viewability: "PARTIAL",
        containerRef,
      }),
    );
    await act(async () => {});
    act(() => result.current.goToPage(10));
    expect(viewerMock.goToPage).toHaveBeenCalledWith(10);
  });
});
