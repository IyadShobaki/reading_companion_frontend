/**
 * apiClient.test.js — Unit tests for the ApiClient HTTP utility.
 *
 * `fetch` is replaced with a vi.fn() stub so no real network requests are made.
 * `tokenManager` is mocked to control Authorization header injection.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import ApiClient from "./apiClient";

// ---------------------------------------------------------------------------
// Module mock — tokenManager
// ---------------------------------------------------------------------------

vi.mock("./tokenManager", () => ({
  tokenManager: {
    get: vi.fn(),
  },
}));

import { tokenManager } from "./tokenManager";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal fetch Response-like object.
 */
function makeFetchResponse(status, body = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ApiClient", () => {
  let client;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    tokenManager.get.mockReturnValue(null);
    client = new ApiClient("http://localhost:3001");
  });

  // ── URL construction ──────────────────────────────────────────────────────

  it("constructs the full URL from baseUrl and endpoint", async () => {
    fetch.mockResolvedValue(makeFetchResponse(200, { data: [] }));
    await client.get("/users/me");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/users/me",
      expect.any(Object),
    );
  });

  // ── Authorization header ──────────────────────────────────────────────────

  it("includes an Authorization header when a token is stored", async () => {
    tokenManager.get.mockReturnValue("my-jwt");
    fetch.mockResolvedValue(makeFetchResponse(200, { data: {} }));
    await client.get("/users/me");
    const [, options] = fetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer my-jwt");
  });

  it("omits the Authorization header when no token is stored", async () => {
    tokenManager.get.mockReturnValue(null);
    fetch.mockResolvedValue(makeFetchResponse(200, { data: {} }));
    await client.get("/users/me");
    const [, options] = fetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  // ── 204 No Content ────────────────────────────────────────────────────────

  it("returns null for a 204 No Content response", async () => {
    fetch.mockResolvedValue(makeFetchResponse(204));
    const result = await client.delete("/items/123");
    expect(result).toBeNull();
  });

  // ── Error handling ────────────────────────────────────────────────────────

  it("throws an error with status set when response is not ok", async () => {
    fetch.mockResolvedValue(makeFetchResponse(404, { message: "Not found" }));
    await expect(client.get("/missing")).rejects.toMatchObject({
      message: "Not found",
      status: 404,
    });
  });

  it("throws an error with a fallback message when body has no message", async () => {
    fetch.mockResolvedValue(makeFetchResponse(500, {}));
    await expect(client.get("/boom")).rejects.toMatchObject({
      status: 500,
    });
  });
});
