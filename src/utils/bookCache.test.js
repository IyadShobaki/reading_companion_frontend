import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getCached, setCached, clearCached, CACHE_TTL_MS } from "./bookCache";

const KEY = "rc_books_trending";
const MOCK_DATA = [{ title: "Book A", googleBookId: "vol1" }];

describe("bookCache", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── getCached ──────────────────────────────────────────────────────────────

  it("getCached returns null when the key is absent", () => {
    expect(getCached(KEY)).toBeNull();
  });

  it("getCached returns the data array when the entry is within the TTL", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ data: MOCK_DATA, timestamp: Date.now() }),
    );
    expect(getCached(KEY)).toEqual(MOCK_DATA);
  });

  it("getCached returns null when the entry is expired", () => {
    const expiredTimestamp = Date.now() - CACHE_TTL_MS - 1;
    localStorage.setItem(
      KEY,
      JSON.stringify({ data: MOCK_DATA, timestamp: expiredTimestamp }),
    );
    expect(getCached(KEY)).toBeNull();
  });

  it("getCached returns null when the stored JSON is corrupted", () => {
    localStorage.setItem(KEY, "not-valid-json{{{");
    expect(getCached(KEY)).toBeNull();
  });

  it("getCached returns null when the data field is missing", () => {
    localStorage.setItem(KEY, JSON.stringify({ timestamp: Date.now() }));
    expect(getCached(KEY)).toBeNull();
  });

  it("getCached returns null when data is not an array", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        data: { title: "not an array" },
        timestamp: Date.now(),
      }),
    );
    expect(getCached(KEY)).toBeNull();
  });

  it("getCached returns null when timestamp is not a number", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ data: MOCK_DATA, timestamp: "yesterday" }),
    );
    expect(getCached(KEY)).toBeNull();
  });

  // ── setCached ──────────────────────────────────────────────────────────────

  it("setCached writes a parseable entry with the correct data and a numeric timestamp", () => {
    setCached(KEY, MOCK_DATA);

    const raw = localStorage.getItem(KEY);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw);
    expect(parsed.data).toEqual(MOCK_DATA);
    expect(typeof parsed.timestamp).toBe("number");
    expect(isFinite(parsed.timestamp)).toBe(true);
  });

  it("setCached overwrites an existing entry", () => {
    setCached(KEY, [{ title: "Old" }]);
    setCached(KEY, [{ title: "New" }]);

    const parsed = JSON.parse(localStorage.getItem(KEY));
    expect(parsed.data).toEqual([{ title: "New" }]);
  });

  // ── clearCached ────────────────────────────────────────────────────────────

  it("clearCached removes the key so getCached returns null", () => {
    setCached(KEY, MOCK_DATA);
    clearCached(KEY);
    expect(getCached(KEY)).toBeNull();
  });

  // ── TTL boundary ───────────────────────────────────────────────────────────

  it("getCached returns null exactly at the TTL boundary (expired at TTL ms elapsed)", () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    setCached(KEY, MOCK_DATA);

    // Advance to exactly TTL ms → entry is now expired
    vi.setSystemTime(now + CACHE_TTL_MS);
    expect(getCached(KEY)).toBeNull();
  });

  it("getCached returns data when just under the TTL", () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    setCached(KEY, MOCK_DATA);

    // Advance to 1 ms before TTL → entry is still valid
    vi.setSystemTime(now + CACHE_TTL_MS - 1);
    expect(getCached(KEY)).toEqual(MOCK_DATA);
  });
});
