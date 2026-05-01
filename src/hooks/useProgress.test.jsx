import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CurrentUserContext } from "../contexts/CurrentUserContext";
import { useProgress } from "./useProgress";

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

import { progressService } from "../services/progress.service";
import { progressStorage } from "../utils/progressStorage";

const MOCK_USER = { _id: "user1", name: "Test User", email: "test@test.com" };

const guestWrapper = ({ children }) => children;

const authWrapper = ({ children }) => (
  <CurrentUserContext.Provider value={{ currentUser: MOCK_USER }}>
    {children}
  </CurrentUserContext.Provider>
);

describe("useProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  describe("authenticated user", () => {
    it("loadProgress checks the backend even without local progress", async () => {
      progressService.getProgress.mockResolvedValue(8);
      progressStorage.loadProgress.mockReturnValue(null);
      const { result } = renderHook(() => useProgress(), {
        wrapper: authWrapper,
      });

      let page;
      await act(async () => {
        page = await result.current.loadProgress("abc123");
      });

      expect(progressService.getProgress).toHaveBeenCalledWith("abc123");
      expect(progressStorage.loadProgress).not.toHaveBeenCalled();
      expect(progressStorage.saveProgress).toHaveBeenCalledWith("abc123", 8);
      expect(page).toBe(8);
    });

    it("loadProgress returns null when the backend has no record", async () => {
      progressService.getProgress.mockResolvedValue(null);
      progressStorage.loadProgress.mockReturnValue(3);
      const { result } = renderHook(() => useProgress(), {
        wrapper: authWrapper,
      });

      let page;
      await act(async () => {
        page = await result.current.loadProgress("abc123");
      });

      expect(progressService.getProgress).toHaveBeenCalledWith("abc123");
      expect(progressStorage.loadProgress).not.toHaveBeenCalled();
      expect(progressStorage.saveProgress).not.toHaveBeenCalled();
      expect(page).toBeNull();
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
