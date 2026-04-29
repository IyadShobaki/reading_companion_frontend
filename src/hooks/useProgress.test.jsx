/**
 * useProgress.test.jsx — Unit tests for the useProgress custom hook.
 *
 * progressService and progressStorage are mocked at the module level so no
 * HTTP requests or localStorage access occur.
 *
 * CurrentUserContext is provided via a renderHook wrapper to simulate both
 * guest (no context) and authenticated (context with currentUser) scenarios.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CurrentUserContext } from "../contexts/CurrentUserContext";
import { useProgress } from "./useProgress";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("../services/progress.service", () => ({
  progressService: {
    getProgress: vi.fn(),
    saveProgress: vi.fn(),
  },
}));

vi.mock("../utils/progressStorage", () => ({
  progressStorage: {
    saveProgress: vi.fn(),
    loadProgress: vi.fn(),
    clearProgress: vi.fn(),
  },
}));

// Import AFTER mocks are registered so we get the spy references.
import { progressService } from "../services/progress.service";
import { progressStorage } from "../utils/progressStorage";

// ---------------------------------------------------------------------------
// Wrappers
// ---------------------------------------------------------------------------

const MOCK_USER = { _id: "user1", name: "Test User", email: "test@test.com" };

/** No context provided — CurrentUserContext defaults to { currentUser: null }. */
const guestWrapper = ({ children }) => children;

/** Provides an authenticated user via CurrentUserContext. */
const authWrapper = ({ children }) => (
  <CurrentUserContext.Provider value={{ currentUser: MOCK_USER }}>
    {children}
  </CurrentUserContext.Provider>
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Guest user ─────────────────────────────────────────────────────────────

  describe("guest user", () => {
    it("loadProgress reads from localStorage only", async () => {
      progressStorage.loadProgress.mockReturnValue(5);
      const { result } = renderHook(() => useProgress(), {
        wrapper: guestWrapper,
      });

      let page;
      await act(async () => {
        page = await result.current.loadProgress("abc123");
      });

      expect(progressStorage.loadProgress).toHaveBeenCalledWith("abc123");
      expect(progressService.getProgress).not.toHaveBeenCalled();
      expect(page).toBe(5);
    });

    it("loadProgress returns null when localStorage has no entry", async () => {
      progressStorage.loadProgress.mockReturnValue(null);
      const { result } = renderHook(() => useProgress(), {
        wrapper: guestWrapper,
      });

      let page;
      await act(async () => {
        page = await result.current.loadProgress("abc123");
      });

      expect(page).toBeNull();
    });

    it("saveProgress writes to localStorage only", async () => {
      const { result } = renderHook(() => useProgress(), {
        wrapper: guestWrapper,
      });

      await act(async () => {
        await result.current.saveProgress("abc123", 3);
      });

      expect(progressStorage.saveProgress).toHaveBeenCalledWith("abc123", 3);
      expect(progressService.saveProgress).not.toHaveBeenCalled();
    });
  });

  // ── Authenticated user ────────────────────────────────────────────────────

  describe("authenticated user", () => {
    it("loadProgress fetches from the backend", async () => {
      progressService.getProgress.mockResolvedValue(8);
      const { result } = renderHook(() => useProgress(), {
        wrapper: authWrapper,
      });

      let page;
      await act(async () => {
        page = await result.current.loadProgress("abc123");
      });

      expect(progressService.getProgress).toHaveBeenCalledWith("abc123");
      expect(page).toBe(8);
    });

    it("loadProgress mirrors the backend result to localStorage", async () => {
      progressService.getProgress.mockResolvedValue(8);
      const { result } = renderHook(() => useProgress(), {
        wrapper: authWrapper,
      });

      await act(async () => {
        await result.current.loadProgress("abc123");
      });

      expect(progressStorage.saveProgress).toHaveBeenCalledWith("abc123", 8);
    });

    it("loadProgress falls back to localStorage when backend has no record (null)", async () => {
      progressService.getProgress.mockResolvedValue(null);
      progressStorage.loadProgress.mockReturnValue(3);
      const { result } = renderHook(() => useProgress(), {
        wrapper: authWrapper,
      });

      let page;
      await act(async () => {
        page = await result.current.loadProgress("abc123");
      });

      expect(progressStorage.loadProgress).toHaveBeenCalledWith("abc123");
      expect(page).toBe(3);
    });

    it("loadProgress falls back to localStorage on API error", async () => {
      progressService.getProgress.mockRejectedValue(new Error("Network error"));
      progressStorage.loadProgress.mockReturnValue(2);
      const { result } = renderHook(() => useProgress(), {
        wrapper: authWrapper,
      });

      let page;
      await act(async () => {
        page = await result.current.loadProgress("abc123");
      });

      expect(progressStorage.loadProgress).toHaveBeenCalledWith("abc123");
      expect(page).toBe(2);
    });

    it("saveProgress writes to localStorage and the backend", async () => {
      progressService.saveProgress.mockResolvedValue({
        googleBookId: "abc123",
        pageNumber: 5,
      });
      const { result } = renderHook(() => useProgress(), {
        wrapper: authWrapper,
      });

      await act(async () => {
        await result.current.saveProgress("abc123", 5);
      });

      expect(progressStorage.saveProgress).toHaveBeenCalledWith("abc123", 5);
      expect(progressService.saveProgress).toHaveBeenCalledWith("abc123", 5);
    });

    it("saveProgress still writes to localStorage when the API call fails", async () => {
      progressService.saveProgress.mockRejectedValue(new Error("Offline"));
      const { result } = renderHook(() => useProgress(), {
        wrapper: authWrapper,
      });

      await act(async () => {
        await result.current.saveProgress("abc123", 5);
      });

      expect(progressStorage.saveProgress).toHaveBeenCalledWith("abc123", 5);
    });
  });
});
