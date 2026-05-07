/**
 * useAiPanel.test.js — Unit tests for the useAiPanel custom hook.
 *
 * aiService is mocked at the module level so no network calls are made.
 * renderHook + act from @testing-library/react drive all state assertions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAiPanel } from "./useAiPanel";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("../services/ai.service", () => ({
  aiService: {
    ask: vi.fn(),
  },
}));

import { aiService } from "../services/ai.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BOOK_CONTEXT = {
  googleBookId: "book123",
  title: "Clean Code",
  pageNumber: 42,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAiPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial state ─────────────────────────────────────────────────────────

  it("starts with no response, no error, and empty input", () => {
    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));
    expect(result.current.userInput).toBe("");
    expect(result.current.response).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  // ── runAction — ask ───────────────────────────────────────────────────────

  it("calls aiService.ask with book context + question and sets response", async () => {
    aiService.ask.mockResolvedValue({ data: { response: "Because X." } });
    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));

    act(() => {
      result.current.setUserInput("What does this chapter mean?");
    });
    await act(async () => {
      await result.current.runAction();
    });

    expect(aiService.ask).toHaveBeenCalledWith({
      ...BOOK_CONTEXT,
      question: "What does this chapter mean?",
    });
    expect(result.current.response).toBe("Because X.");
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("sets error and does not call aiService.ask when question is empty", async () => {
    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));

    await act(async () => {
      await result.current.runAction();
    });

    expect(aiService.ask).not.toHaveBeenCalled();
    expect(result.current.error).toMatch(/enter a question/i);
  });

  // ── runAction — error handling ────────────────────────────────────────────

  it("sets error when the AI service throws", async () => {
    aiService.ask.mockRejectedValue(new Error("Backend not ready"));
    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));

    act(() => {
      result.current.setUserInput("What is this about?");
    });
    await act(async () => {
      await result.current.runAction();
    });

    expect(result.current.error).toBe("Backend not ready");
    expect(result.current.response).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("clears a previous response before a new request", async () => {
    aiService.ask
      .mockResolvedValueOnce({ data: { response: "First response." } })
      .mockResolvedValueOnce({ data: { response: "Second response." } });

    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));
    act(() => {
      result.current.setUserInput("Question one");
    });

    await act(async () => {
      await result.current.runAction();
    });
    expect(result.current.response).toBe("First response.");

    await act(async () => {
      await result.current.runAction();
    });
    expect(result.current.response).toBe("Second response.");
  });

  // ── clearResponse ─────────────────────────────────────────────────────────

  it("clears response and error when clearResponse is called", async () => {
    aiService.ask.mockResolvedValue({ data: { response: "Some text." } });
    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));

    act(() => {
      result.current.setUserInput("A question");
    });
    await act(async () => {
      await result.current.runAction();
    });
    expect(result.current.response).toBe("Some text.");

    act(() => {
      result.current.clearResponse();
    });
    expect(result.current.response).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
