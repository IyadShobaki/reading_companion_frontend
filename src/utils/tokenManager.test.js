/**
 * tokenManager.test.js — Unit tests for the JWT token manager utility.
 *
 * Uses jsdom's built-in localStorage — no mocking needed.
 * Each test runs in a clean localStorage state via beforeEach.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { tokenManager } from "./tokenManager";

const TOKEN_KEY = "jwt";
const SAMPLE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.sig";

beforeEach(() => {
  localStorage.clear();
});

describe("tokenManager", () => {
  // ── get ───────────────────────────────────────────────────────────────────

  it("get returns null when no token is stored", () => {
    expect(tokenManager.get()).toBeNull();
  });

  it("get returns the stored token", () => {
    localStorage.setItem(TOKEN_KEY, SAMPLE_TOKEN);
    expect(tokenManager.get()).toBe(SAMPLE_TOKEN);
  });

  // ── set ───────────────────────────────────────────────────────────────────

  it("set stores the token under the 'jwt' key", () => {
    tokenManager.set(SAMPLE_TOKEN);
    expect(localStorage.getItem(TOKEN_KEY)).toBe(SAMPLE_TOKEN);
  });

  // ── remove ────────────────────────────────────────────────────────────────

  it("remove deletes the stored token", () => {
    localStorage.setItem(TOKEN_KEY, SAMPLE_TOKEN);
    tokenManager.remove();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  // ── exists ────────────────────────────────────────────────────────────────

  it("exists returns false when no token is stored", () => {
    expect(tokenManager.exists()).toBe(false);
  });

  it("exists returns true when a token is stored", () => {
    tokenManager.set(SAMPLE_TOKEN);
    expect(tokenManager.exists()).toBe(true);
  });
});
