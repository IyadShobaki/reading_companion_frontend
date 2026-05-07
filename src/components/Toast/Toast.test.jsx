/**
 * Toast.test.jsx — Unit tests for the Toast notification component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import Toast from "./Toast";

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const makeToast = (overrides = {}) => ({
    id: 1,
    message: "Test notification",
    type: "info",
    ...overrides,
  });

  it("renders the toast message", () => {
    render(<Toast toast={makeToast()} onDismiss={() => {}} />);
    expect(screen.getByText("Test notification")).toBeInTheDocument();
  });

  it("applies the correct modifier class for success type", () => {
    const { container } = render(
      <Toast toast={makeToast({ type: "success" })} onDismiss={() => {}} />,
    );
    expect(container.firstChild).toHaveClass("toast_success");
  });

  it("applies the correct modifier class for error type", () => {
    const { container } = render(
      <Toast toast={makeToast({ type: "error" })} onDismiss={() => {}} />,
    );
    expect(container.firstChild).toHaveClass("toast_error");
  });

  it("calls onDismiss when the close button is clicked", () => {
    const onDismiss = vi.fn();
    render(<Toast toast={makeToast({ id: 42 })} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledWith(42);
  });

  it("calls onDismiss automatically after 3 seconds", () => {
    const onDismiss = vi.fn();
    render(<Toast toast={makeToast({ id: 7 })} onDismiss={onDismiss} />);
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onDismiss).toHaveBeenCalledWith(7);
  });

  it("does not call onDismiss before the timer fires", () => {
    const onDismiss = vi.fn();
    render(<Toast toast={makeToast({ id: 3 })} onDismiss={onDismiss} />);
    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
