/**
 * useFormWithValidation.test.js — Unit tests for the form validation hook.
 *
 * Tests state updates, validation logic, isValid gating, and resetForm.
 * Uses renderHook + act; no component mount needed.
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormWithValidation } from "./useFormWithValidation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulate a DOM change event on a named field. */
function changeEvent(name, value) {
  return { target: { name, value } };
}

// Module-scope validators used by tests that exercise field-level error logic.
// Mirrors the rules used by LoginModal / RegisterModal.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEST_VALIDATORS = {
  email: (v) => {
    if (!v || v.trim().length === 0) return "Email is required.";
    if (!EMAIL_REGEX.test(v)) return "Please enter a valid email.";
    return "";
  },
  password: (v) => {
    if (!v || v.trim().length === 0) return "Password is required.";
    if (v.length < 6) return "Password must be at least 6 characters.";
    return "";
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useFormWithValidation", () => {
  // ── handleChange ──────────────────────────────────────────────────────────

  it("handleChange updates the field value", () => {
    const { result } = renderHook(() =>
      useFormWithValidation({ email: "", password: "" }),
    );
    act(() =>
      result.current.handleChange(changeEvent("email", "test@test.com")),
    );
    expect(result.current.values.email).toBe("test@test.com");
  });

  it("handleChange sets a validation error for an invalid email", () => {
    const { result } = renderHook(() =>
      useFormWithValidation({ email: "", password: "" }, [], TEST_VALIDATORS),
    );
    act(() =>
      result.current.handleChange(changeEvent("email", "not-an-email")),
    );
    expect(result.current.errors.email.length).toBeGreaterThan(0);
  });

  it("handleChange clears the error when a valid value is entered", () => {
    const { result } = renderHook(() =>
      useFormWithValidation({ email: "" }, [], TEST_VALIDATORS),
    );
    act(() => result.current.handleChange(changeEvent("email", "bad")));
    act(() =>
      result.current.handleChange(changeEvent("email", "good@example.com")),
    );
    expect(result.current.errors.email).toBe("");
  });

  // ── isValid ───────────────────────────────────────────────────────────────

  it("isValid is false when required fields are empty", () => {
    const { result } = renderHook(() =>
      useFormWithValidation({ email: "", password: "" }),
    );
    expect(result.current.isValid).toBe(false);
  });

  it("isValid is true when all required fields are filled and error-free", () => {
    const { result } = renderHook(() =>
      useFormWithValidation({ email: "", password: "" }),
    );
    act(() =>
      result.current.handleChange(changeEvent("email", "user@example.com")),
    );
    act(() =>
      result.current.handleChange(changeEvent("password", "password123")),
    );
    expect(result.current.isValid).toBe(true);
  });

  it("isValid is false when a field has a validation error", () => {
    const { result } = renderHook(() =>
      useFormWithValidation({ email: "", password: "" }, [], TEST_VALIDATORS),
    );
    act(() => result.current.handleChange(changeEvent("email", "not-valid")));
    act(() => result.current.handleChange(changeEvent("password", "pass")));
    expect(result.current.isValid).toBe(false);
  });

  // ── optional fields ───────────────────────────────────────────────────────

  it("isValid is true when an optional field is empty and required fields are valid", () => {
    const { result } = renderHook(() =>
      useFormWithValidation({ email: "", password: "", avatar: "" }, [
        "avatar",
      ]),
    );
    act(() =>
      result.current.handleChange(changeEvent("email", "user@example.com")),
    );
    act(() => result.current.handleChange(changeEvent("password", "pass123")));
    expect(result.current.isValid).toBe(true);
  });

  // ── resetForm ─────────────────────────────────────────────────────────────

  it("resetForm restores values and errors to their initial state", () => {
    const { result } = renderHook(() =>
      useFormWithValidation({ email: "", password: "" }),
    );
    act(() =>
      result.current.handleChange(changeEvent("email", "user@example.com")),
    );
    act(() => result.current.handleChange(changeEvent("password", "pass123")));
    act(() => result.current.resetForm());
    expect(result.current.values).toEqual({ email: "", password: "" });
    expect(result.current.errors).toEqual({ email: "", password: "" });
  });
});
