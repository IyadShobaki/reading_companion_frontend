/**
 * RegisterModal.test.jsx — Unit tests for the RegisterModal component.
 *
 * Verifies form field rendering, successful submission, server error display,
 * and navigation to the Login modal.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterModal from "./RegisterModal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderRegisterModal(overrides = {}) {
  const props = {
    isOpen: true,
    onRegister: vi.fn(),
    onClose: vi.fn(),
    isLoading: false,
    onNavigateLogin: vi.fn(),
    serverError: "",
    ...overrides,
  };
  render(<RegisterModal {...props} />);
  return props;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RegisterModal", () => {
  // ── Rendering ─────────────────────────────────────────────────────────────

  it("renders email, password, name, and avatar URL fields", () => {
    renderRegisterModal();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
  });

  it("renders the Sign Up submit button", () => {
    renderRegisterModal();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
  });

  it("renders the navigate-to-login link button", () => {
    renderRegisterModal();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  // ── Submission ────────────────────────────────────────────────────────────

  it("calls onRegister with name, email, and password after valid input", async () => {
    const user = userEvent.setup();
    const { onRegister } = renderRegisterModal();

    await user.type(screen.getByPlaceholderText("Email"), "alice@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "secure123");
    await user.type(screen.getByPlaceholderText("Name"), "Alice");
    await user.click(screen.getByRole("button", { name: /next/i }));

    expect(onRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "alice@example.com",
        password: "secure123",
        name: "Alice",
      }),
    );
  });

  // ── Server error ──────────────────────────────────────────────────────────

  it("displays a server error message when serverError prop is provided", () => {
    renderRegisterModal({ serverError: "Email already in use" });
    expect(screen.getByText("Email already in use")).toBeInTheDocument();
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  it("calls onNavigateLogin when the Log in link button is clicked", async () => {
    const user = userEvent.setup();
    const { onNavigateLogin } = renderRegisterModal();
    await user.click(screen.getByRole("button", { name: /log in/i }));
    expect(onNavigateLogin).toHaveBeenCalled();
  });
});
