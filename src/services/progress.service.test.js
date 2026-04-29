/**
 * progress.service.test.js — Unit tests for the progress API service layer.
 *
 * ApiClient is replaced with a spy-able mock instance so tests never touch
 * the network. Each method is verified for the correct endpoint, HTTP verb,
 * and payload forwarding. Special-character encoding is tested for IDs that
 * contain URL-unsafe characters.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { progressService } from "./progress.service";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

// vi.hoisted ensures mockApiClient is defined before vi.mock factories run,
// avoiding the temporal dead zone error that affects plain const declarations.
const mockApiClient = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
}));

vi.mock("../utils/apiClient", () => ({
  default: vi.fn(function () {
    return mockApiClient;
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("progressService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getProgress ───────────────────────────────────────────────────────────

  describe("getProgress", () => {
    it("calls GET /progress/:googleBookId and returns the page number", async () => {
      mockApiClient.get.mockResolvedValue({
        data: { googleBookId: "abc123", pageNumber: 5 },
      });
      const result = await progressService.getProgress("abc123");
      expect(mockApiClient.get).toHaveBeenCalledWith("/progress/abc123");
      expect(result).toBe(5);
    });

    it("returns null when the backend responds with 404", async () => {
      const err = new Error("Not Found");
      err.status = 404;
      mockApiClient.get.mockRejectedValue(err);
      const result = await progressService.getProgress("abc123");
      expect(result).toBeNull();
    });

    it("re-throws non-404 errors", async () => {
      const err = new Error("Internal Server Error");
      err.status = 500;
      mockApiClient.get.mockRejectedValue(err);
      await expect(progressService.getProgress("abc123")).rejects.toThrow(
        "Internal Server Error",
      );
    });

    it("encodes special characters in the googleBookId", async () => {
      mockApiClient.get.mockResolvedValue({
        data: { googleBookId: "id with spaces", pageNumber: 1 },
      });
      await progressService.getProgress("id with spaces");
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/progress/id%20with%20spaces",
      );
    });
  });

  // ── saveProgress ──────────────────────────────────────────────────────────

  describe("saveProgress", () => {
    it("calls PUT /progress/:googleBookId with the page number", async () => {
      const mockData = { googleBookId: "abc123", pageNumber: 7 };
      mockApiClient.put.mockResolvedValue({ data: mockData });
      const result = await progressService.saveProgress("abc123", 7);
      expect(mockApiClient.put).toHaveBeenCalledWith("/progress/abc123", {
        pageNumber: 7,
      });
      expect(result).toEqual(mockData);
    });

    it("encodes special characters in the googleBookId", async () => {
      mockApiClient.put.mockResolvedValue({
        data: { googleBookId: "id/with/slashes", pageNumber: 3 },
      });
      await progressService.saveProgress("id/with/slashes", 3);
      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/progress/id%2Fwith%2Fslashes",
        { pageNumber: 3 },
      );
    });
  });
});
