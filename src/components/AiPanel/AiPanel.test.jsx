/**
 * AiPanel.test.jsx — Unit tests for the AiPanel component.
 *
 * aiService is mocked at the module level. CurrentUserContext controls
 * authenticated vs. guest state. The real useAiPanel hook runs so tests
 * cover the full UI interaction → hook → service path.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AiPanel from "./AiPanel";
import { CurrentUserContext } from "../../contexts/CurrentUserContext";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("../../services/ai.service", () => ({
  aiService: {
    ask: vi.fn(),
  },
}));

import { aiService } from "../../services/ai.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER = { _id: "u1", name: "Ada", email: "ada@example.com" };

const PANEL_PROPS = {
  googleBookId: "book123",
  title: "Clean Code",
  currentPage: 10,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderPanel = (currentUser, props = PANEL_PROPS) =>
  render(
    <CurrentUserContext.Provider value={{ currentUser }}>
      <AiPanel {...props} />
    </CurrentUserContext.Provider>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AiPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Unauthenticated ───────────────────────────────────────────────────────

  it("shows a login prompt when the user is not logged in", () => {
    renderPanel(null);
    expect(
      screen.getByText(/log in to use ai reading tools/i),
    ).toBeInTheDocument();
  });

  it("does not show the question form for guests", () => {
    renderPanel(null);
    expect(
      screen.queryByRole("form", { name: /ask a question/i }),
    ).not.toBeInTheDocument();
  });

  // ── Authenticated — initial state ─────────────────────────────────────────

  it("renders the question form for logged-in users", () => {
    renderPanel(MOCK_USER);
    expect(
      screen.getByRole("form", { name: /ask a question/i }),
    ).toBeInTheDocument();
  });

  it("submit button is disabled when question is empty", () => {
    renderPanel(MOCK_USER);
    expect(screen.getByRole("button", { name: /^ask$/i })).toBeDisabled();
  });

  // ── Ask — success ─────────────────────────────────────────────────────────

  it("displays the AI response after submitting a question", async () => {
    aiService.ask.mockResolvedValue({
      data: { response: "The main theme is clarity." },
    });
    renderPanel(MOCK_USER);

    await userEvent.type(
      screen.getByRole("textbox", { name: /your question/i }),
      "What is the main theme?",
    );
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /^ask$/i }));
    });

    expect(screen.getByText("The main theme is clarity.")).toBeInTheDocument();
  });

  it("shows the response region with accessible label", async () => {
    aiService.ask.mockResolvedValue({
      data: { response: "An insightful answer." },
    });
    renderPanel(MOCK_USER);

    await userEvent.type(
      screen.getByRole("textbox", { name: /your question/i }),
      "Tell me more",
    );
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /^ask$/i }));
    });

    expect(
      screen.getByRole("region", { name: /ai response/i }),
    ).toBeInTheDocument();
  });

  // ── Error state ───────────────────────────────────────────────────────────

  it("shows an error alert when the AI service fails", async () => {
    aiService.ask.mockRejectedValue(new Error("Backend not ready"));
    renderPanel(MOCK_USER);

    await userEvent.type(
      screen.getByRole("textbox", { name: /your question/i }),
      "What happened?",
    );
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /^ask$/i }));
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/backend not ready/i)).toBeInTheDocument();
  });

  // ── Clear response ────────────────────────────────────────────────────────

  it("clears the response when the Clear button is clicked", async () => {
    aiService.ask.mockResolvedValue({ data: { response: "Nice answer." } });
    renderPanel(MOCK_USER);

    await userEvent.type(
      screen.getByRole("textbox", { name: /your question/i }),
      "What does it mean?",
    );
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /^ask$/i }));
    });

    expect(screen.getByText("Nice answer.")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /clear response/i }),
    );
    expect(screen.queryByText("Nice answer.")).not.toBeInTheDocument();
  });
});
