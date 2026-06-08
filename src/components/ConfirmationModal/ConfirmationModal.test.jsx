/**
 * ConfirmationModal.test.jsx — Unit tests for the ConfirmationModal component.
 *
 * Verifies that the confirmation message is shown and that the Confirm and
 * Cancel buttons fire the correct callbacks.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmationModal from "./ConfirmationModal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderConfirmationModal(overrides = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onDeleteItem: vi.fn(),
    onCancelDeletingItem: vi.fn(),
    ...overrides,
  };
  render(<ConfirmationModal {...props} />);
  return props;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ConfirmationModal", () => {
  // ── Rendering ─────────────────────────────────────────────────────────────

  it("renders the confirmation message", () => {
    renderConfirmationModal();
    expect(
      screen.getByText(/Are you sure you want to delete/i),
    ).toBeInTheDocument();
  });

  it("renders the delete confirmation button", () => {
    renderConfirmationModal();
    expect(
      screen.getByRole("button", { name: /yes, delete item/i }),
    ).toBeInTheDocument();
  });

  it("renders the cancel button", () => {
    renderConfirmationModal();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  // ── Confirm ───────────────────────────────────────────────────────────────

  it("calls onDeleteItem when the delete button is clicked", async () => {
    const user = userEvent.setup();
    const { onDeleteItem } = renderConfirmationModal();
    await user.click(screen.getByRole("button", { name: /yes, delete item/i }));
    expect(onDeleteItem).toHaveBeenCalledTimes(1);
  });

  // ── Cancel ────────────────────────────────────────────────────────────────

  it("calls onCancelDeletingItem when the Cancel button is clicked", async () => {
    const user = userEvent.setup();
    const { onCancelDeletingItem } = renderConfirmationModal();
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancelDeletingItem).toHaveBeenCalledTimes(1);
  });
});
