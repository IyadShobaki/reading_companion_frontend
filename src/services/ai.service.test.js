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

  // ── ask ───────────────────────────────────────────────────────────────────

  describe("ask", () => {
    it("posts to /ai/ask with book context and the user question", async () => {
      mockApiClient.post.mockResolvedValue({ response: "An answer." });
      const payload = { ...BASE_PAYLOAD, question: "What does this mean?" };
      await aiService.ask(payload);
      expect(mockApiClient.post).toHaveBeenCalledWith("/ai/ask", payload);
    });

    it("includes authors, description, and categories when provided", async () => {
      mockApiClient.post.mockResolvedValue({ response: "An answer." });
      const enriched = {
        ...BASE_PAYLOAD,
        question: "Who wrote this?",
        authors: ["Robert C. Martin"],
        description: "A guide to writing clean code.",
        categories: ["Programming"],
      };
      await aiService.ask(enriched);
      expect(mockApiClient.post).toHaveBeenCalledWith("/ai/ask", enriched);
    });

    it("omits optional fields when they are empty", async () => {
      mockApiClient.post.mockResolvedValue({ response: "An answer." });
      await aiService.ask({
        ...BASE_PAYLOAD,
        question: "Quick question?",
        authors: [],
        description: "",
        categories: [],
      });
      expect(mockApiClient.post).toHaveBeenCalledWith("/ai/ask", {
        ...BASE_PAYLOAD,
        question: "Quick question?",
      });
    });
  });
});
