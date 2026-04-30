/**
 * UpdateProfileModal.test.jsx — Unit tests for the UpdateProfileModal component.
 *
 * Verifies pre-population from CurrentUserContext and form submission.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UpdateProfileModal from "./UpdateProfileModal";
import { CurrentUserContext } from "../../contexts/CurrentUserContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_USER = {
  _id: "u1",
  name: "Alice",
  email: "alice@example.com",
  avatar: "https://example.com/avatar.jpg",
};

function renderModal(overrides = {}, currentUser = MOCK_USER) {
  const props = {
    isOpen: true,
    onUpdate: vi.fn().mockResolvedValue({}),
    onClose: vi.fn(),
    isLoading: false,
    serverError: "",
    ...overrides,
  };
  render(
    <CurrentUserContext.Provider value={{ currentUser }}>
      <UpdateProfileModal {...props} />
    </CurrentUserContext.Provider>,
  );
  return props;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UpdateProfileModal", () => {
  // ── Pre-population ────────────────────────────────────────────────────────

  it("pre-populates the Name field with the current user's name", () => {
    renderModal();
    const nameInput = screen.getByPlaceholderText("Name");
    expect(nameInput.value).toBe("Alice");
  });

  it("pre-populates the Avatar URL field with the current user's avatar", () => {
    renderModal();
    // The avatar input shows the current avatar URL
    const avatarInput = screen.getByDisplayValue(
      "https://example.com/avatar.jpg",
    );
    expect(avatarInput).toBeInTheDocument();
  });

  // ── Submission ────────────────────────────────────────────────────────────

  it("calls onUpdate with the edited name when the form is submitted", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderModal();

    const nameInput = screen.getByPlaceholderText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Bob");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Bob" }),
    );
  });

  // ── No current user ───────────────────────────────────────────────────────

  it("renders with empty fields when currentUser is null", () => {
    renderModal({}, null);
    expect(screen.getByPlaceholderText("Name").value).toBe("");
  });
});
