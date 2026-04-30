/**
 * useModal.test.js — Unit tests for the useModal custom hook.
 *
 * Tests modal open/close state transitions using renderHook + act.
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useModal } from "./useModal";

describe("useModal", () => {
  // ── initial state ─────────────────────────────────────────────────────────

  it("starts with activeModal as an empty string", () => {
    const { result } = renderHook(() => useModal());
    expect(result.current.activeModal).toBe("");
  });

  // ── openModal ─────────────────────────────────────────────────────────────

  it("openModal sets activeModal to the provided name", () => {
    const { result } = renderHook(() => useModal());
    act(() => result.current.openModal("login"));
    expect(result.current.activeModal).toBe("login");
  });

  // ── closeModal ────────────────────────────────────────────────────────────

  it("closeModal resets activeModal to an empty string", () => {
    const { result } = renderHook(() => useModal());
    act(() => result.current.openModal("register"));
    act(() => result.current.closeModal());
    expect(result.current.activeModal).toBe("");
  });

  // ── single modal ──────────────────────────────────────────────────────────

  it("opening a second modal replaces the first (only one active at a time)", () => {
    const { result } = renderHook(() => useModal());
    act(() => result.current.openModal("login"));
    act(() => result.current.openModal("register"));
    expect(result.current.activeModal).toBe("register");
  });
});
