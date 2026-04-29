/**
 * notes.service.test.js — Unit tests for the notes API service layer.
 *
 * ApiClient is replaced with a spy-able mock instance so tests never touch
 * the network. Each method is verified for the correct endpoint, HTTP verb,
 * and payload forwarding. Special-character encoding is tested for IDs that
 * contain URL-unsafe characters.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { notesService } from "./notes.service";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

// vi.hoisted ensures mockApiClient is defined before vi.mock factories run,
// avoiding the temporal dead zone error that affects plain const declarations.
const mockApiClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
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

const MOCK_NOTE = {
  _id: "note1",
  googleBookId: "abc123",
  pageNumber: 42,
  title: "Interesting observation",
  content: "The author makes a compelling argument here.",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("notesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getByBook ─────────────────────────────────────────────────────────────

  describe("getByBook", () => {
    it("calls GET /notes/:googleBookId", async () => {
      mockApiClient.get.mockResolvedValue({ data: [MOCK_NOTE] });
      const result = await notesService.getByBook("abc123");
      expect(mockApiClient.get).toHaveBeenCalledWith("/notes/abc123");
      expect(result).toEqual([MOCK_NOTE]);
    });

    it("encodes special characters in the googleBookId", async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });
      await notesService.getByBook("id with spaces");
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/notes/id%20with%20spaces",
      );
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe("create", () => {
    it("calls POST /notes with the full note payload", async () => {
      mockApiClient.post.mockResolvedValue({ data: MOCK_NOTE });
      const noteData = {
        googleBookId: "abc123",
        pageNumber: 42,
        title: "Interesting observation",
        content: "The author makes a compelling argument here.",
      };
      const result = await notesService.create(noteData);
      expect(mockApiClient.post).toHaveBeenCalledWith("/notes", noteData);
      expect(result).toEqual(MOCK_NOTE);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe("update", () => {
    it("calls PATCH /notes/:noteId with the changes", async () => {
      const updated = { ...MOCK_NOTE, content: "Revised content." };
      mockApiClient.patch.mockResolvedValue({ data: updated });
      const result = await notesService.update("note1", {
        content: "Revised content.",
      });
      expect(mockApiClient.patch).toHaveBeenCalledWith("/notes/note1", {
        content: "Revised content.",
      });
      expect(result).toEqual(updated);
    });

    it("encodes special characters in the noteId", async () => {
      mockApiClient.patch.mockResolvedValue({ data: {} });
      await notesService.update("note/with/slashes", { content: "x" });
      expect(mockApiClient.patch).toHaveBeenCalledWith(
        "/notes/note%2Fwith%2Fslashes",
        { content: "x" },
      );
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe("remove", () => {
    it("calls DELETE /notes/:noteId", async () => {
      mockApiClient.delete.mockResolvedValue({ _id: "note1" });
      await notesService.remove("note1");
      expect(mockApiClient.delete).toHaveBeenCalledWith("/notes/note1");
    });

    it("encodes special characters in the noteId", async () => {
      mockApiClient.delete.mockResolvedValue({});
      await notesService.remove("note with spaces");
      expect(mockApiClient.delete).toHaveBeenCalledWith(
        "/notes/note%20with%20spaces",
      );
    });
  });
});
