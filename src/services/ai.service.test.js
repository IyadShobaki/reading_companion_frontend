/**
 * ai.service.test.js — Unit tests for the AI assistant service layer.
 *
 * ApiClient is replaced with a spy-able mock so tests never touch the network.
 * Each method is verified for the correct endpoint, HTTP verb, and payload.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiService } from "./ai.service";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

// vi.hoisted ensures mockApiClient exists before vi.mock factories run.
const mockApiClient = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock("../utils/apiClient", () => ({
  default: vi.fn(function () {
    return mockApiClient;
  }),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_PAYLOAD = {
  googleBookId: "abc123",
  title: "Clean Code",
  pageNumber: 42,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("aiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── summarize ─────────────────────────────────────────────────────────────

  describe("summarize", () => {
    it("posts to /ai/summarize with book context", async () => {
      mockApiClient.post.mockResolvedValue({ response: "A summary." });
      const result = await aiService.summarize(BASE_PAYLOAD);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/ai/summarize",
        BASE_PAYLOAD,
      );
      expect(result).toEqual({ response: "A summary." });
    });
  });

  // ── explain ───────────────────────────────────────────────────────────────

  describe("explain", () => {
    it("posts to /ai/explain with book context", async () => {
      mockApiClient.post.mockResolvedValue({ response: "An explanation." });
      await aiService.explain(BASE_PAYLOAD);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/ai/explain",
        BASE_PAYLOAD,
      );
    });
  });

  // ── context ───────────────────────────────────────────────────────────────

  describe("context", () => {
    it("posts to /ai/context with book context", async () => {
      mockApiClient.post.mockResolvedValue({ response: "Historical context." });
      await aiService.context(BASE_PAYLOAD);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/ai/context",
        BASE_PAYLOAD,
      );
    });
  });

  // ── ask ───────────────────────────────────────────────────────────────────

  describe("ask", () => {
    it("posts to /ai/ask with book context and the user question", async () => {
      mockApiClient.post.mockResolvedValue({ response: "An answer." });
      const payload = { ...BASE_PAYLOAD, question: "What does this mean?" };
      await aiService.ask(payload);
      expect(mockApiClient.post).toHaveBeenCalledWith("/ai/ask", payload);
    });
  });
});
