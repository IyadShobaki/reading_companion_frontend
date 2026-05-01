import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "./ErrorBoundary";

function Bomb({ shouldThrow = false }) {
  if (shouldThrow) {
    throw new Error("Test render error");
  }
  return <div>Normal content</div>;
}

let consoleErrorSpy;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  vi.unstubAllEnvs();
});

const hasCustomErrorBoundaryLog = () =>
  consoleErrorSpy.mock.calls.some(
    ([message]) => message === "ErrorBoundary caught an error:",
  );

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Normal content")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("renders fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    expect(screen.queryByText("Normal content")).not.toBeInTheDocument();
  });

  it("logs caught errors in development mode", () => {
    vi.stubEnv("DEV", true);

    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(hasCustomErrorBoundaryLog()).toBe(true);
  });

  it("does not emit the custom ErrorBoundary log outside development", () => {
    vi.stubEnv("DEV", false);

    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(hasCustomErrorBoundaryLog()).toBe(false);
  });

  it("re-renders children after clicking 'Try again'", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

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
