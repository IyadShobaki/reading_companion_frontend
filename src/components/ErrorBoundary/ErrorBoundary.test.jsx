/**
 * ErrorBoundary.test.jsx — Unit tests for the ErrorBoundary class component.
 *
 * Verifies that:
 *   - Children render normally when no error occurs
 *   - The fallback UI is shown when a child throws during render
 *   - The "Try again" button resets the error state and re-renders children
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "./ErrorBoundary";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A component that throws when its `shouldThrow` prop is true.
 */
function Bomb({ shouldThrow = false }) {
  if (shouldThrow) {
    throw new Error("Test render error");
  }
  return <div>Normal content</div>;
}

// React prints the caught error to console.error; suppress it in tests.
let consoleErrorSpy;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ErrorBoundary", () => {
  // ── Happy path ─────────────────────────────────────────────────────────────

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("does not show the fallback UI when there is no error", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  // ── Error state ────────────────────────────────────────────────────────────

  it("renders the fallback heading when a child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders the fallback description message when a child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(
      screen.getByText(/An unexpected error occurred/i),
    ).toBeInTheDocument();
  });

  it("renders a 'Try again' button when a child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });

  it("hides the children when the fallback is shown", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.queryByText("Normal content")).not.toBeInTheDocument();
  });

  // ── Recovery ───────────────────────────────────────────────────────────────

  it("re-renders children after clicking 'Try again'", async () => {
    const user = userEvent.setup();

    // We need a wrapper whose props we can update so the re-render succeeds.
    // After clicking Try again, ErrorBoundary resets hasError to false and
    // calls render() again — the same <Bomb shouldThrow> must not throw now.
    // We achieve this by remounting with shouldThrow=false after the reset.
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    // Confirm fallback is shown.
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Rerender with non-throwing child before clicking so the recovery works.
    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );

    await user.click(screen.getByRole("button", { name: /try again/i }));

    expect(screen.getByText("Normal content")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });
});
