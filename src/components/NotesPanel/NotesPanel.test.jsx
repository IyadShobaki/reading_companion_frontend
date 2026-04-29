/**
 * NotesPanel.test.jsx — Unit tests for the NotesPanel component.
 *
 * notesService is mocked so no network calls are made. CurrentUserContext is
 * injected via Provider to control the authenticated/unauthenticated state.
 * The real useNotes hook runs, which gives coverage of the full fetch → render
 * path without coupling to the hook internals.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotesPanel from "./NotesPanel";
import { CurrentUserContext } from "../../contexts/CurrentUserContext";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------

vi.mock("../../services/notes.service", () => ({
  notesService: {
    getByBook: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { notesService } from "../../services/notes.service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_USER = { _id: "u1", name: "Ada", email: "ada@example.com" };

const MOCK_NOTE_A = {
  _id: "note-a",
  googleBookId: "book1",
  pageNumber: 5,
  title: "Early insight",
  content: "This sets the tone for the whole book.",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-03T00:00:00.000Z",
};

const MOCK_NOTE_B = {
  _id: "note-b",
  googleBookId: "book1",
  pageNumber: 20,
  title: "",
  content: "Interesting point on page 20.",
  createdAt: "2024-01-02T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Render NotesPanel with a controllable CurrentUserContext.
 * @param {Object|null} currentUser - null → guest, object → authenticated
 */
const renderPanel = (currentUser, props = {}) =>
  render(
    <CurrentUserContext.Provider value={{ currentUser }}>
      <NotesPanel googleBookId="book1" currentPage={7} {...props} />
    </CurrentUserContext.Provider>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NotesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Unauthenticated ───────────────────────────────────────────────────────

  it("shows a login prompt when the user is not logged in", () => {
    renderPanel(null);
    expect(screen.getByText(/log in to save notes/i)).toBeInTheDocument();
  });

  it("does not fetch notes when the user is not logged in", () => {
    renderPanel(null);
    expect(notesService.getByBook).not.toHaveBeenCalled();
  });

  it("does not show the add-note form when the user is not logged in", () => {
    renderPanel(null);
    expect(
      screen.queryByRole("form", { name: /add note/i }),
    ).not.toBeInTheDocument();
  });

  // ── Authenticated — initial fetch ─────────────────────────────────────────

  it("calls notesService.getByBook on mount with the correct googleBookId", async () => {
    notesService.getByBook.mockResolvedValue([]);
    renderPanel(MOCK_USER);
    await act(async () => {});
    expect(notesService.getByBook).toHaveBeenCalledWith("book1");
  });

  it("shows the add-note form for authenticated users", async () => {
    notesService.getByBook.mockResolvedValue([]);
    renderPanel(MOCK_USER);
    await act(async () => {});
    expect(screen.getByRole("form", { name: /add note/i })).toBeInTheDocument();
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  it("shows the empty state when there are no notes", async () => {
    notesService.getByBook.mockResolvedValue([]);
    renderPanel(MOCK_USER);
    await act(async () => {});
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
  });

  // ── Error state ───────────────────────────────────────────────────────────

  it("shows an error alert when the fetch fails", async () => {
    notesService.getByBook.mockRejectedValue(new Error("Network failure"));
    renderPanel(MOCK_USER);
    await act(async () => {});
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/network failure/i)).toBeInTheDocument();
  });

  // ── Notes list ────────────────────────────────────────────────────────────

  it("renders a NoteCard for each fetched note", async () => {
    notesService.getByBook.mockResolvedValue([MOCK_NOTE_A, MOCK_NOTE_B]);
    renderPanel(MOCK_USER);
    await act(async () => {});
    expect(screen.getByText("Early insight")).toBeInTheDocument();
    expect(
      screen.getByText("Interesting point on page 20."),
    ).toBeInTheDocument();
  });

  // ── Sort controls ─────────────────────────────────────────────────────────

  it("does not show sort controls when there is only one note", async () => {
    notesService.getByBook.mockResolvedValue([MOCK_NOTE_A]);
    renderPanel(MOCK_USER);
    await act(async () => {});
    expect(
      screen.queryByRole("group", { name: /sort notes/i }),
    ).not.toBeInTheDocument();
  });

  it("shows sort controls when there are two or more notes", async () => {
    notesService.getByBook.mockResolvedValue([MOCK_NOTE_A, MOCK_NOTE_B]);
    renderPanel(MOCK_USER);
    await act(async () => {});
    expect(
      screen.getByRole("group", { name: /sort notes/i }),
    ).toBeInTheDocument();
  });

  it("sorts notes by date when 'By date' is clicked", async () => {
    notesService.getByBook.mockResolvedValue([MOCK_NOTE_A, MOCK_NOTE_B]);
    renderPanel(MOCK_USER);
    await act(async () => {});

    await userEvent.click(screen.getByRole("button", { name: /by date/i }));

    // MOCK_NOTE_A has newer updatedAt (2024-01-03) → should appear first
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Early insight");
  });

  // ── Add note ──────────────────────────────────────────────────────────────

  it("calls notesService.create with googleBookId when a note is submitted", async () => {
    notesService.getByBook.mockResolvedValue([]);
    const newNote = { ...MOCK_NOTE_A, _id: "new-id" };
    notesService.create.mockResolvedValue(newNote);

    renderPanel(MOCK_USER);
    await act(async () => {});

    await userEvent.type(
      screen.getByRole("textbox", { name: /note/i }),
      "My new note",
    );
    await act(async () => {
      await userEvent.click(screen.getByRole("button", { name: /add note/i }));
    });

    expect(notesService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        googleBookId: "book1",
        content: "My new note",
      }),
    );
  });
});
