/**
 * useAuth.test.js — Unit tests for the useAuth custom hook.
 *
 * authService is mocked so tests are fast and deterministic.
 * renderHook + act are used to exercise state transitions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { authService } from "../services/authService";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("../services/authService", () => ({
  authService: {
    signin: vi.fn(),
    signup: vi.fn(),
    getCurrentUser: vi.fn(),
    updateUser: vi.fn(),
    logout: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER = { _id: "u1", name: "Alice", email: "alice@example.com" };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── initial state ─────────────────────────────────────────────────────────

  it("starts with isLoading=true, isLoggedIn=false, and no user", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.currentUser).toBeNull();
    expect(result.current.error).toBeNull();
  });

  // ── signin ────────────────────────────────────────────────────────────────

  it("signin sets currentUser and isLoggedIn on success", async () => {
    authService.signin.mockResolvedValue({ data: MOCK_USER });
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signin("alice@example.com", "pass123"));
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.currentUser).toEqual(MOCK_USER);
    expect(result.current.isLoading).toBe(false);
  });

  it("signin sets error and rethrows on failure", async () => {
    const err = new Error("Invalid credentials");
    authService.signin.mockRejectedValue(err);
    const { result } = renderHook(() => useAuth());
    let thrownError;
    await act(async () => {
      try {
        await result.current.signin("bad@email.com", "wrong");
      } catch (e) {
        thrownError = e;
      }
    });
    expect(thrownError).toBe(err);
    expect(result.current.error).toBe("Invalid credentials");
    expect(result.current.isLoggedIn).toBe(false);
  });

  // ── signup ────────────────────────────────────────────────────────────────

  it("signup auto-signs-in and sets currentUser on success", async () => {
    authService.signup.mockResolvedValue({});
    authService.signin.mockResolvedValue({ data: MOCK_USER });
    const { result } = renderHook(() => useAuth());
    await act(() =>
      result.current.signup({
        email: "alice@example.com",
        password: "pass123",
        name: "Alice",
      }),
    );
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.currentUser).toEqual(MOCK_USER);
  });

  // ── restoreSession ────────────────────────────────────────────────────────

  it("restoreSession sets currentUser and isLoggedIn when token is valid", async () => {
    authService.getCurrentUser.mockResolvedValue({ data: MOCK_USER });
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.restoreSession());
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.currentUser).toEqual(MOCK_USER);
    expect(result.current.isLoading).toBe(false);
  });

  it("restoreSession sets isLoading=false even when getCurrentUser returns null (no token / 401)", async () => {
    authService.getCurrentUser.mockResolvedValue(null);
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.restoreSession());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoggedIn).toBe(false);
  });

  // ── logout ────────────────────────────────────────────────────────────────

  it("logout resets isLoggedIn, currentUser, and error", async () => {
    authService.signin.mockResolvedValue({ data: MOCK_USER });
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signin("alice@example.com", "pass"));
    act(() => result.current.logout());
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.currentUser).toBeNull();
    expect(result.current.error).toBeNull();
    expect(authService.logout).toHaveBeenCalled();
  });

  // ── clearError ────────────────────────────────────────────────────────────

  it("clearError sets error back to null", async () => {
    const err = new Error("Oops");
    authService.signin.mockRejectedValue(err);
    const { result } = renderHook(() => useAuth());
    await act(() => result.current.signin("x@y.com", "pass").catch(() => {}));
    expect(result.current.error).toBe("Oops");
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
