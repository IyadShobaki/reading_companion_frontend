/**
 * LoginModal.test.jsx — Unit tests for the LoginModal component.
 *
 * Verifies form field rendering, successful submission, server error display,
 * and navigation to the Register modal.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginModal from "./LoginModal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderLoginModal(overrides = {}) {
  const props = {
    isOpen: true,
    onLogin: vi.fn(),
    onClose: vi.fn(),
    isLoading: false,
    onNavigateRegister: vi.fn(),
    serverError: "",
    ...overrides,
  };
  render(<LoginModal {...props} />);
  return props;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LoginModal", () => {
  // ── Rendering ─────────────────────────────────────────────────────────────

  it("renders the email and password input fields", () => {
    renderLoginModal();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("renders the Log In submit button", () => {
    renderLoginModal();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("renders the navigate-to-register link button", () => {
    renderLoginModal();
    expect(
      screen.getByRole("button", { name: /register/i }),
    ).toBeInTheDocument();
  });

  // ── Submission ────────────────────────────────────────────────────────────

  it("calls onLogin with email and password after valid input", async () => {
    const user = userEvent.setup();
    const { onLogin } = renderLoginModal();

    await user.type(screen.getByPlaceholderText("Email"), "user@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(onLogin).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
  });

  // ── Server error ──────────────────────────────────────────────────────────

  it("displays a server error message when serverError prop is provided", () => {
    renderLoginModal({ serverError: "Invalid email or password" });
    expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
  });

  it("does not display an error container when serverError is empty", () => {
    renderLoginModal({ serverError: "" });
    expect(
      screen.queryByText(/Invalid email or password/i),
    ).not.toBeInTheDocument();
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  it("calls onNavigateRegister when the Register link button is clicked", async () => {
    const user = userEvent.setup();
    const { onNavigateRegister } = renderLoginModal();
    await user.click(screen.getByRole("button", { name: /register/i }));
    expect(onNavigateRegister).toHaveBeenCalled();
  });
});
