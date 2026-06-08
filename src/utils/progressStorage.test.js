/**
 * progressStorage.test.js — Unit tests for the reading progress localStorage utility.
 *
 * jsdom provides a full localStorage implementation, so tests manipulate
 * it directly to assert storage behaviour. vi.spyOn is used to simulate
 * localStorage failures without affecting other tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { progressStorage } from "./progressStorage";

describe("progressStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── saveProgress ───────────────────────────────────────────────────────────

  describe("saveProgress", () => {
    it("stores the page number as a string at the correct key", () => {
      progressStorage.saveProgress("abc123", 5);
      expect(localStorage.getItem("rc_progress_abc123")).toBe("5");
    });

    it("overwrites an existing entry", () => {
      progressStorage.saveProgress("abc123", 3);
      progressStorage.saveProgress("abc123", 7);
      expect(localStorage.getItem("rc_progress_abc123")).toBe("7");
    });

    it("stores entries for different books independently", () => {
      progressStorage.saveProgress("book1", 2);
      progressStorage.saveProgress("book2", 10);
      expect(localStorage.getItem("rc_progress_book1")).toBe("2");
      expect(localStorage.getItem("rc_progress_book2")).toBe("10");
    });

    it("does not throw when localStorage.setItem throws", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });
      expect(() => progressStorage.saveProgress("abc123", 5)).not.toThrow();
    });
  });

  // ── loadProgress ──────────────────────────────────────────────────────────

  describe("loadProgress", () => {
    it("returns the saved page number as an integer", () => {
      localStorage.setItem("rc_progress_abc123", "5");
      expect(progressStorage.loadProgress("abc123")).toBe(5);
    });

    it("returns null when nothing is saved for that book", () => {
      expect(progressStorage.loadProgress("abc123")).toBeNull();
    });

    it("returns null for a non-numeric stored value", () => {
      localStorage.setItem("rc_progress_abc123", "not-a-number");
      expect(progressStorage.loadProgress("abc123")).toBeNull();
    });

    it("returns null when the stored page is 0", () => {
      localStorage.setItem("rc_progress_abc123", "0");
      expect(progressStorage.loadProgress("abc123")).toBeNull();
    });

    it("returns null when the stored page is negative", () => {
      localStorage.setItem("rc_progress_abc123", "-3");
      expect(progressStorage.loadProgress("abc123")).toBeNull();
    });

    it("returns null when localStorage.getItem throws", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
        throw new Error("SecurityError");
      });
      expect(progressStorage.loadProgress("abc123")).toBeNull();
    });
  });

  // ── clearProgress ─────────────────────────────────────────────────────────

  describe("clearProgress", () => {
    it("removes the stored progress entry for a book", () => {
      localStorage.setItem("rc_progress_abc123", "5");
      progressStorage.clearProgress("abc123");
      expect(localStorage.getItem("rc_progress_abc123")).toBeNull();
    });

    it("does not throw when the entry does not exist", () => {
      expect(() => progressStorage.clearProgress("nonexistent")).not.toThrow();
    });

    it("only removes the entry for the specified book", () => {
      localStorage.setItem("rc_progress_book1", "3");
      localStorage.setItem("rc_progress_book2", "7");
      progressStorage.clearProgress("book1");
      expect(localStorage.getItem("rc_progress_book1")).toBeNull();
      expect(localStorage.getItem("rc_progress_book2")).toBe("7");
    });

    it("does not throw when localStorage.removeItem throws", () => {
      vi.spyOn(Storage.prototype, "removeItem").mockImplementationOnce(() => {
        throw new Error("SecurityError");
      });
      expect(() => progressStorage.clearProgress("abc123")).not.toThrow();
    });
  });
});
