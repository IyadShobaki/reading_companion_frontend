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
    summarize: vi.fn(),
    explain: vi.fn(),
    context: vi.fn(),
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

  it("does not show action buttons for guests", () => {
    renderPanel(null);
    expect(
      screen.queryByRole("group", { name: /ai actions/i }),
    ).not.toBeInTheDocument();
  });

  // ── Authenticated — initial state ─────────────────────────────────────────

  it("renders all four action buttons for logged-in users", () => {
    renderPanel(MOCK_USER);
    expect(
      screen.getByRole("button", { name: /summarize/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /explain/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /context/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^ask$/i })).toBeInTheDocument();
  });

  it("shows the hint text when no action is selected", () => {
    renderPanel(MOCK_USER);
    expect(screen.getByText(/select an action above/i)).toBeInTheDocument();
  });

  // ── Action selection / toggle ─────────────────────────────────────────────

  it("marks the clicked action button as active (aria-pressed)", async () => {
    renderPanel(MOCK_USER);
    const btn = screen.getByRole("button", { name: /summarize/i });
    await userEvent.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("de-selects the action when the active button is clicked again", async () => {
    renderPanel(MOCK_USER);
    const btn = screen.getByRole("button", { name: /summarize/i });
    await userEvent.click(btn);
    await userEvent.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("shows the hint text again after de-selecting an action", async () => {
    renderPanel(MOCK_USER);
    const btn = screen.getByRole("button", { name: /summarize/i });
    await userEvent.click(btn);
    await userEvent.click(btn);
    expect(screen.getByText(/select an action above/i)).toBeInTheDocument();
  });

  // ── Ask action ────────────────────────────────────────────────────────────

  it("shows the question input form when Ask is selected", async () => {
    renderPanel(MOCK_USER);
    await userEvent.click(screen.getByRole("button", { name: /^ask$/i }));
    expect(
      screen.getByRole("form", { name: /ask a question/i }),
    ).toBeInTheDocument();
  });

  it("submit button is disabled when question is empty", async () => {
    renderPanel(MOCK_USER);
    // Select the "Ask" action — the action button has aria-pressed
    const actionBtn = screen.getByRole("button", { name: /^ask$/i });
    await userEvent.click(actionBtn);
    // Now a form appears; the submit button inside it is also labeled "Ask"
    // but the textarea is empty so it should be disabled
    const allAskBtns = screen.getAllByRole("button", { name: /^ask$/i });
    // The last one is the submit button inside the form
    const submitBtn = allAskBtns[allAskBtns.length - 1];
    expect(submitBtn).toBeDisabled();
  });

  // ── Summarize action — success ────────────────────────────────────────────

  it("displays the AI response after Summarize runs successfully", async () => {
    aiService.summarize.mockResolvedValue({ response: "This book is great." });
    renderPanel(MOCK_USER);

    await userEvent.click(screen.getByRole("button", { name: /summarize/i }));
    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: /run summarize/i }),
      );
    });

    expect(screen.getByText("This book is great.")).toBeInTheDocument();
  });

  it("shows the response region with accessible label", async () => {
    aiService.summarize.mockResolvedValue({ response: "Summary text." });
    renderPanel(MOCK_USER);

    await userEvent.click(screen.getByRole("button", { name: /summarize/i }));
    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: /run summarize/i }),
      );
    });

    expect(
      screen.getByRole("region", { name: /ai response/i }),
    ).toBeInTheDocument();
  });

  // ── Error state ───────────────────────────────────────────────────────────

  it("shows an error alert when the AI service fails", async () => {
    aiService.summarize.mockRejectedValue(new Error("Backend not ready"));
    renderPanel(MOCK_USER);

    await userEvent.click(screen.getByRole("button", { name: /summarize/i }));
    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: /run summarize/i }),
      );
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/backend not ready/i)).toBeInTheDocument();
  });

  // ── Clear response ────────────────────────────────────────────────────────

  it("clears the response when the Clear button is clicked", async () => {
    aiService.summarize.mockResolvedValue({ response: "Nice summary." });
    renderPanel(MOCK_USER);

    await userEvent.click(screen.getByRole("button", { name: /summarize/i }));
    await act(async () => {
      await userEvent.click(
        screen.getByRole("button", { name: /run summarize/i }),
      );
    });

    expect(screen.getByText("Nice summary.")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: /clear response/i }),
    );
    expect(screen.queryByText("Nice summary.")).not.toBeInTheDocument();
  });
});
