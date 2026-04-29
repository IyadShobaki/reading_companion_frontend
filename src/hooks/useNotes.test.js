/**
 * useNotes.test.js — Unit tests for the useNotes custom hook.
 *
 * notesService is mocked at the module level so no HTTP requests are made.
 * renderHook + act from @testing-library/react drive all state assertions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotes } from "./useNotes";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("../services/notes.service", () => ({
  notesService: {
    getByBook: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

// Import AFTER the mock is registered so we get the spy references
import { notesService } from "../services/notes.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const GOOGLE_BOOK_ID = "book123";

const MOCK_NOTE_A = {
  _id: "note-a",
  googleBookId: GOOGLE_BOOK_ID,
  pageNumber: 10,
  title: "Chapter insight",
  content: "This chapter reframes the whole argument.",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const MOCK_NOTE_B = {
  _id: "note-b",
  googleBookId: GOOGLE_BOOK_ID,
  pageNumber: 25,
  title: "",
  content: "Key quote on page 25.",
  createdAt: "2024-01-02T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial state ─────────────────────────────────────────────────────────

  it("starts with empty notes, not loading, and no error", () => {
    const { result } = renderHook(() => useNotes());
    expect(result.current.notes).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // ── fetchNotes ────────────────────────────────────────────────────────────

  it("sets isLoading while fetching and clears it on success", async () => {
    notesService.getByBook.mockResolvedValue([MOCK_NOTE_A]);
    const { result } = renderHook(() => useNotes());

    await act(async () => {
      await result.current.fetchNotes(GOOGLE_BOOK_ID);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.notes).toEqual([MOCK_NOTE_A]);
  });

  it("populates notes on successful fetch", async () => {
    notesService.getByBook.mockResolvedValue([MOCK_NOTE_A, MOCK_NOTE_B]);
    const { result } = renderHook(() => useNotes());

    await act(async () => {
      await result.current.fetchNotes(GOOGLE_BOOK_ID);
    });

    expect(result.current.notes).toHaveLength(2);
  });

  it("sets error and clears notes when fetch fails", async () => {
    notesService.getByBook.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useNotes());

    await act(async () => {
      await result.current.fetchNotes(GOOGLE_BOOK_ID);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.notes).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  // ── addNote ───────────────────────────────────────────────────────────────

  it("shows a temp note immediately then replaces with the server note", async () => {
    const serverNote = { ...MOCK_NOTE_A, _id: "server-id" };
    notesService.create.mockResolvedValue(serverNote);

    const { result } = renderHook(() => useNotes());

    await act(async () => {
      await result.current.addNote({
        googleBookId: GOOGLE_BOOK_ID,
        pageNumber: 10,
        title: "Chapter insight",
        content: "This chapter reframes the whole argument.",
      });
    });

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0]._id).toBe("server-id");
  });

  it("rolls back the optimistic add and sets error when create fails", async () => {
    notesService.create.mockRejectedValue(new Error("Save failed"));

    const { result } = renderHook(() => useNotes());

    await act(async () => {
      try {
        await result.current.addNote({
          googleBookId: GOOGLE_BOOK_ID,
          pageNumber: 10,
          content: "Test",
        });
      } catch {
        // expected
      }
    });

    expect(result.current.notes).toHaveLength(0);
    expect(result.current.error).toBe("Save failed");
  });

  // ── updateNote ────────────────────────────────────────────────────────────

  it("updates a note optimistically with the server response", async () => {
    notesService.getByBook.mockResolvedValue([MOCK_NOTE_A]);
    const updatedNote = { ...MOCK_NOTE_A, content: "Revised." };
    notesService.update.mockResolvedValue(updatedNote);

    const { result } = renderHook(() => useNotes());

    await act(async () => {
      await result.current.fetchNotes(GOOGLE_BOOK_ID);
    });

    await act(async () => {
      await result.current.updateNote(MOCK_NOTE_A._id, { content: "Revised." });
    });

    expect(result.current.notes[0].content).toBe("Revised.");
  });

  it("rolls back to the snapshot and sets error when update fails", async () => {
    notesService.getByBook.mockResolvedValue([MOCK_NOTE_A]);
    notesService.update.mockRejectedValue(new Error("Update failed"));

    const { result } = renderHook(() => useNotes());

    await act(async () => {
      await result.current.fetchNotes(GOOGLE_BOOK_ID);
    });

    await act(async () => {
      try {
        await result.current.updateNote(MOCK_NOTE_A._id, { content: "Bad." });
      } catch {
        // expected
      }
    });

    expect(result.current.notes[0].content).toBe(MOCK_NOTE_A.content);
    expect(result.current.error).toBe("Update failed");
  });

  // ── removeNote ────────────────────────────────────────────────────────────

  it("removes a note from the list optimistically", async () => {
    notesService.getByBook.mockResolvedValue([MOCK_NOTE_A, MOCK_NOTE_B]);
    notesService.remove.mockResolvedValue({});

    const { result } = renderHook(() => useNotes());

    await act(async () => {
      await result.current.fetchNotes(GOOGLE_BOOK_ID);
    });

    await act(async () => {
      await result.current.removeNote(MOCK_NOTE_A._id);
    });

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0]._id).toBe(MOCK_NOTE_B._id);
  });

  it("rolls back to the snapshot and sets error when remove fails", async () => {
    notesService.getByBook.mockResolvedValue([MOCK_NOTE_A]);
    notesService.remove.mockRejectedValue(new Error("Delete failed"));

    const { result } = renderHook(() => useNotes());

    await act(async () => {
      await result.current.fetchNotes(GOOGLE_BOOK_ID);
    });

    await act(async () => {
      await result.current.removeNote(MOCK_NOTE_A._id);
    });

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.error).toBe("Delete failed");
  });

  // ── clearNotes ────────────────────────────────────────────────────────────

  it("clears notes and error", async () => {
    notesService.getByBook.mockResolvedValue([MOCK_NOTE_A]);
    const { result } = renderHook(() => useNotes());

    await act(async () => {
      await result.current.fetchNotes(GOOGLE_BOOK_ID);
    });

    act(() => {
      result.current.clearNotes();
    });

    expect(result.current.notes).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
