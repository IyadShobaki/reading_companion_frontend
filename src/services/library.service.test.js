/**
 * library.service.test.js — Unit tests for the library API service
 *
 * ApiClient is mocked so tests never touch the network. Each method is
 * verified for the correct endpoint, HTTP method, and payload forwarding.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { libraryService } from "./library.service";

// ---------------------------------------------------------------------------
// Module mock — replace ApiClient with a spy-able instance
// ---------------------------------------------------------------------------

// vi.hoisted runs before vi.mock factories, making mockApiClient available
// in the factory closure without a temporal dead zone error.
const mockApiClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../utils/apiClient", () => ({
  default: vi.fn(function () {
    return mockApiClient;
  }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_BOOK = {
  googleBookId: "abc123",
  title: "Clean Code",
  authors: ["Robert C. Martin"],
  thumbnail: "https://books.google.com/books/cover.jpg",
  embeddable: true,
  viewability: "PARTIAL",
};

// Backend representation — array fields are comma-joined strings
const MOCK_BOOK_BACKEND = {
  ...MOCK_BOOK,
  authors: "Robert C. Martin",
  categories: "",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("libraryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getAll ────────────────────────────────────────────────────────────────

  describe("getAll", () => {
    it("calls GET /library", async () => {
      // Backend returns comma-joined strings; service normalises back to arrays
      mockApiClient.get.mockResolvedValue({ data: [MOCK_BOOK_BACKEND] });
      const result = await libraryService.getAll();
      expect(mockApiClient.get).toHaveBeenCalledWith("/library");
      // normalizeFromBackend converts strings → arrays
      expect(result).toEqual([{ ...MOCK_BOOK, categories: [] }]);
    });
  });

  // ── add ───────────────────────────────────────────────────────────────────

  describe("add", () => {
    it("calls POST /library with the full book object", async () => {
      mockApiClient.post.mockResolvedValue({ data: MOCK_BOOK });
      const result = await libraryService.add(MOCK_BOOK);
      // normalizeForBackend converts array fields to comma-joined strings
      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/library",
        MOCK_BOOK_BACKEND,
      );
      expect(result).toEqual(MOCK_BOOK);
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe("remove", () => {
    it("calls DELETE /library/:googleBookId (encoded)", async () => {
      mockApiClient.delete.mockResolvedValue(null);
      await libraryService.remove("abc123");
      expect(mockApiClient.delete).toHaveBeenCalledWith("/library/abc123");
    });

    it("encodes special characters in the googleBookId", async () => {
      mockApiClient.delete.mockResolvedValue(null);
      await libraryService.remove("id with spaces");
      expect(mockApiClient.delete).toHaveBeenCalledWith(
        "/library/id%20with%20spaces",
      );
    });
  });
});
