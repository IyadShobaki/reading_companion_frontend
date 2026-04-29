/**
 * useAiPanel.test.js — Unit tests for the useAiPanel custom hook.
 *
 * aiService is mocked at the module level so no network calls are made.
 * renderHook + act from @testing-library/react drive all state assertions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAiPanel, AI_ACTIONS } from "./useAiPanel";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("../services/ai.service", () => ({
  aiService: {
    summarize: vi.fn(),
    explain: vi.fn(),
    context: vi.fn(),
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

  it("starts with no action selected, no response, and no error", () => {
    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));
    expect(result.current.selectedAction).toBeNull();
    expect(result.current.response).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.userInput).toBe("");
  });

  // ── AI_ACTIONS constant ───────────────────────────────────────────────────

  it("exports all four AI action keys", () => {
    expect(AI_ACTIONS).toEqual(["summarize", "explain", "context", "ask"]);
  });

  // ── setSelectedAction ─────────────────────────────────────────────────────

  it("updates selectedAction when setSelectedAction is called", () => {
    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));
    act(() => {
      result.current.setSelectedAction("summarize");
    });
    expect(result.current.selectedAction).toBe("summarize");
  });

  // ── runAction — no action selected ───────────────────────────────────────

  it("does nothing when runAction is called with no selected action", async () => {
    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));
    await act(async () => {
      await result.current.runAction();
    });
    expect(aiService.summarize).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  // ── runAction — summarize ─────────────────────────────────────────────────

  it("calls aiService.summarize with book context and sets response", async () => {
    aiService.summarize.mockResolvedValue({ response: "A great summary." });
    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));

    act(() => {
      result.current.setSelectedAction("summarize");
    });

    await act(async () => {
      await result.current.runAction();
    });

    expect(aiService.summarize).toHaveBeenCalledWith(BOOK_CONTEXT);
    expect(result.current.response).toBe("A great summary.");
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  // ── runAction — explain ───────────────────────────────────────────────────

  it("calls aiService.explain when action is 'explain'", async () => {
    aiService.explain.mockResolvedValue({ response: "An explanation." });
    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));

    act(() => {
      result.current.setSelectedAction("explain");
    });
    await act(async () => {
      await result.current.runAction();
    });

    expect(aiService.explain).toHaveBeenCalledWith(BOOK_CONTEXT);
    expect(result.current.response).toBe("An explanation.");
  });

  // ── runAction — context ───────────────────────────────────────────────────

  it("calls aiService.context when action is 'context'", async () => {
    aiService.context.mockResolvedValue({ response: "Historical context." });
    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));

    act(() => {
      result.current.setSelectedAction("context");
    });
    await act(async () => {
      await result.current.runAction();
    });

    expect(aiService.context).toHaveBeenCalledWith(BOOK_CONTEXT);
    expect(result.current.response).toBe("Historical context.");
  });

  // ── runAction — ask ───────────────────────────────────────────────────────

  it("calls aiService.ask with book context + question", async () => {
    aiService.ask.mockResolvedValue({ response: "Because X." });
    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));

    act(() => {
      result.current.setSelectedAction("ask");
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
  });

  it("sets error and does not call aiService.ask when question is empty", async () => {
    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));

    act(() => {
      result.current.setSelectedAction("ask");
      // userInput remains ""
    });
    await act(async () => {
      await result.current.runAction();
    });

    expect(aiService.ask).not.toHaveBeenCalled();
    expect(result.current.error).toMatch(/enter a question/i);
  });

  // ── runAction — error handling ────────────────────────────────────────────

  it("sets error when the AI service throws", async () => {
    aiService.summarize.mockRejectedValue(new Error("Backend not ready"));
    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));

    act(() => {
      result.current.setSelectedAction("summarize");
    });
    await act(async () => {
      await result.current.runAction();
    });

    expect(result.current.error).toBe("Backend not ready");
    expect(result.current.response).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("clears a previous response before a new request", async () => {
    aiService.summarize
      .mockResolvedValueOnce({ response: "First response." })
      .mockResolvedValueOnce({ response: "Second response." });

    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));
    act(() => {
      result.current.setSelectedAction("summarize");
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
    aiService.summarize.mockResolvedValue({ response: "Some text." });
    const { result } = renderHook(() => useAiPanel(BOOK_CONTEXT));

    act(() => {
      result.current.setSelectedAction("summarize");
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
