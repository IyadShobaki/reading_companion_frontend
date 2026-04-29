/**
 * NotesPanel — right-sidebar notes section for the Reader page.
 *
 * Reads CurrentUserContext to determine if the user is authenticated.
 * Unauthenticated users see a login prompt; no notes are fetched.
 *
 * Authenticated users get:
 *   - A NoteForm at the top to add a new note (pre-filled with currentPage)
 *   - A sort toggle when there are multiple notes (by page number / by date)
 *   - A list of NoteCards with expand/collapse and inline edit/delete
 *   - Loading, error, and empty states
 *
 * All note state is managed locally via useNotes — no context is needed.
 *
 * @param {string} googleBookId - Google Books volume ID scoping these notes.
 * @param {number} currentPage  - Current reader page (auto-fills the add form).
 */

import { useContext, useEffect, useMemo, useState } from "react";
import { CurrentUserContext } from "../../contexts/CurrentUserContext";
import { useNotes } from "../../hooks/useNotes";
import NoteCard from "../NoteCard/NoteCard";
import NoteForm from "../NoteForm/NoteForm";
import Loading from "../Loading/Loading";
import "./NotesPanel.css";

function NotesPanel({ googleBookId, currentPage }) {
  const { currentUser } = useContext(CurrentUserContext);
  const isLoggedIn = Boolean(currentUser);

  const {
    notes,
    isLoading,
    error,
    fetchNotes,
    addNote,
    updateNote,
    removeNote,
  } = useNotes();

  /**
   * Sort preference: "page" (ascending) or "date" (newest-first).
   * Only shown when there are two or more notes.
   */
  const [sortBy, setSortBy] = useState("page");

  // Fetch notes when the panel first mounts for an authenticated user.
  // Re-fetches if googleBookId changes (user navigates to a different book).
  useEffect(() => {
    if (!isLoggedIn || !googleBookId) return;
    fetchNotes(googleBookId);
  }, [isLoggedIn, googleBookId, fetchNotes]);

  /**
   * Sorted copy of notes — recomputed only when notes or sortBy changes.
   * Never mutates the original array from useNotes.
   */
  const sortedNotes = useMemo(() => {
    const copy = [...notes];
    if (sortBy === "page") {
      copy.sort((a, b) => a.pageNumber - b.pageNumber);
    } else {
      // date: newest updatedAt first
      copy.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    return copy;
  }, [notes, sortBy]);

  /** Prepend googleBookId before forwarding to useNotes.addNote. */
  const handleAddNote = async (noteData) => {
    await addNote({ ...noteData, googleBookId });
  };

  // ── Unauthenticated state ───────────────────────────────────────────────

  if (!isLoggedIn) {
    return (
      <div className="notes-panel">
        <p className="notes-panel__login-prompt">
          Log in to save notes while you read.
        </p>
      </div>
    );
  }

  // ── Authenticated state ─────────────────────────────────────────────────

  return (
    <div className="notes-panel">
      {/* Add note form — always visible for authenticated users */}
      <NoteForm currentPage={currentPage} onSubmit={handleAddNote} />

      {/* Error message */}
      {error && (
        <p className="notes-panel__error" role="alert">
          {error}
        </p>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div role="status" aria-label="Loading notes">
          <Loading />
        </div>
      )}

      {/* Sort controls — only shown with 2+ notes */}
      {notes.length > 1 && (
        <div className="notes-panel__sort" role="group" aria-label="Sort notes">
          <button
            type="button"
            className={`notes-panel__sort-btn${
              sortBy === "page" ? " notes-panel__sort-btn_active" : ""
            }`}
            onClick={() => setSortBy("page")}
            aria-pressed={sortBy === "page"}
          >
            By page
          </button>
          <button
            type="button"
            className={`notes-panel__sort-btn${
              sortBy === "date" ? " notes-panel__sort-btn_active" : ""
            }`}
            onClick={() => setSortBy("date")}
            aria-pressed={sortBy === "date"}
          >
            By date
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && notes.length === 0 && (
        <p className="notes-panel__empty">
          No notes yet. Add your first note above.
        </p>
      )}

      {/* Notes list */}
      <ul className="notes-panel__list" aria-label="Notes">
        {sortedNotes.map((note) => (
          <li key={note._id} className="notes-panel__item">
            <NoteCard
              note={note}
              onEdit={(noteId, changes) => updateNote(noteId, changes)}
              onDelete={(noteId) => removeNote(noteId)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NotesPanel;
