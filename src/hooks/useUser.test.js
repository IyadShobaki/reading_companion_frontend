/**
 * useUser.test.js — Unit tests for the useUser custom hook.
 *
 * authService is mocked so tests are fast and deterministic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUser } from "./useUser";
import { authService } from "../services/authService";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("../services/authService", () => ({
  authService: {
    updateUser: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER = { _id: "u1", name: "Bob", email: "bob@example.com" };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updateProfile calls authService.updateUser with the provided data", async () => {
    authService.updateUser.mockResolvedValue({ data: MOCK_USER });
    const updateCurrentUser = vi.fn();
    const { result } = renderHook(() => useUser(updateCurrentUser));

    await act(() => result.current.updateProfile({ name: "Bob" }));

    expect(authService.updateUser).toHaveBeenCalledWith({ name: "Bob" });
  });

  it("updateProfile calls updateCurrentUser with the returned user on success", async () => {
    authService.updateUser.mockResolvedValue({ data: MOCK_USER });
    const updateCurrentUser = vi.fn();
    const { result } = renderHook(() => useUser(updateCurrentUser));

    await act(() => result.current.updateProfile({ name: "Bob" }));

    expect(updateCurrentUser).toHaveBeenCalledWith(MOCK_USER);
  });

  it("updateProfile sets error and rethrows on failure", async () => {
    const err = new Error("Network error");
    authService.updateUser.mockRejectedValue(err);
    const updateCurrentUser = vi.fn();
    const { result } = renderHook(() => useUser(updateCurrentUser));

    let thrownError;
    await act(async () => {
      try {
        await result.current.updateProfile({ name: "Bob" });
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toBe(err);
    expect(result.current.error).toBe("Network error");
    expect(updateCurrentUser).not.toHaveBeenCalled();
  });

  it("clearError resets error to null", async () => {
    authService.updateUser.mockRejectedValue(new Error("Oops"));
    const updateCurrentUser = vi.fn();
    const { result } = renderHook(() => useUser(updateCurrentUser));

    await act(() => result.current.updateProfile({}).catch(() => {}));
    expect(result.current.error).toBe("Oops");

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
