/**
 * authService.test.js — Unit tests for the authentication API service.
 *
 * ApiClient is mocked so no real HTTP requests are made.
 * tokenManager is exercised against jsdom's localStorage directly.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "./authService";

// ---------------------------------------------------------------------------
// Module mock — replace ApiClient with a spy-able singleton
// ---------------------------------------------------------------------------

const mockApiClient = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../utils/apiClient", () => ({
  default: vi.fn(function () {
    return mockApiClient;
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ── signup ────────────────────────────────────────────────────────────────

  it("signup delegates to POST /signup with the provided user data", async () => {
    mockApiClient.post.mockResolvedValue({ data: { _id: "1" } });
    const userData = { email: "a@b.com", password: "secret", name: "Alice" };
    await authService.signup(userData);
    expect(mockApiClient.post).toHaveBeenCalledWith("/signup", userData);
  });

  // ── signin ────────────────────────────────────────────────────────────────

  it("signin stores the token in localStorage when the server returns one", async () => {
    mockApiClient.post.mockResolvedValue({
      token: "jwt-abc",
      data: { _id: "1" },
    });
    await authService.signin({ email: "a@b.com", password: "pass" });
    expect(localStorage.getItem("jwt")).toBe("jwt-abc");
  });

  it("signin does not store a token when the server response has no token", async () => {
    mockApiClient.post.mockResolvedValue({ data: { _id: "1" } });
    await authService.signin({ email: "a@b.com", password: "pass" });
    expect(localStorage.getItem("jwt")).toBeNull();
  });

  // ── getCurrentUser ────────────────────────────────────────────────────────

  it("getCurrentUser returns null immediately when no token is stored", async () => {
    const result = await authService.getCurrentUser();
    expect(result).toBeNull();
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });

  it("getCurrentUser returns user data when the token is valid", async () => {
    localStorage.setItem("jwt", "valid-token");
    mockApiClient.get.mockResolvedValue({ data: { _id: "1", name: "Alice" } });
    const result = await authService.getCurrentUser();
    expect(result).toEqual({ data: { _id: "1", name: "Alice" } });
  });

  it("getCurrentUser removes the token and returns null on a 401 response", async () => {
    localStorage.setItem("jwt", "expired-token");
    const err = new Error("Unauthorized");
    err.status = 401;
    mockApiClient.get.mockRejectedValue(err);
    const result = await authService.getCurrentUser();
    expect(result).toBeNull();
    expect(localStorage.getItem("jwt")).toBeNull();
  });

  // ── updateUser ────────────────────────────────────────────────────────────

  it("updateUser delegates to PATCH /users/me with the provided data", async () => {
    mockApiClient.patch.mockResolvedValue({ data: { name: "Bob" } });
    await authService.updateUser({ name: "Bob" });
    expect(mockApiClient.patch).toHaveBeenCalledWith("/users/me", {
      name: "Bob",
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────

  it("logout removes the token from localStorage", () => {
    localStorage.setItem("jwt", "some-token");
    authService.logout();
    expect(localStorage.getItem("jwt")).toBeNull();
  });
});
