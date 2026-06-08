import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Loading from "../Loading/Loading";
import { useAllNotes } from "../../hooks/useAllNotes";
import { booksService } from "../../services/books.service";
import "./AllNotes.css";

/**
 * AllNotes — protected page listing all the user's notes grouped by book.
 *
 * Each book section is collapsible. Clicking a book title navigates to the
 * Reader for that book.
 */
function AllNotes() {
  const { groupedNotes, isLoading, error } = useAllNotes();
  // Map of googleBookId → book title (loaded lazily)
  const [titles, setTitles] = useState({});
  // Track which sections are open (all open by default)
  const [open, setOpen] = useState({});

  // Fetch book titles for each group that we don't already have
  useEffect(() => {
    if (groupedNotes.length === 0) return;

    const missing = groupedNotes
      .map((g) => g.googleBookId)
      .filter((id) => !(id in titles));

    if (missing.length === 0) return;

    Promise.allSettled(
      missing.map((id) =>
        booksService
          .getById(id)
          .then((book) => ({ id, title: book.title }))
          .catch(() => ({ id, title: id })),
      ),
    ).then((results) => {
      const updates = {};
      for (const r of results) {
        if (r.status === "fulfilled") {
          updates[r.value.id] = r.value.title;
        }
      }
      setTitles((prev) => ({ ...prev, ...updates }));
    });
  }, [groupedNotes, titles]);

  const toggleSection = (id) =>
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

  if (isLoading) {
    return (
      <main className="all-notes">
        <div role="status" aria-label="Loading notes">
          <Loading />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="all-notes">
        <p className="all-notes__error" role="alert">
          {error}
        </p>
      </main>
    );
  }

  const totalNotes = groupedNotes.reduce((sum, g) => sum + g.notes.length, 0);

  return (
    <main className="all-notes">
      <div className="all-notes__header-row">
        <h1 className="all-notes__heading">My Notes</h1>
        <div className="all-notes__stat-card">
          <p className="all-notes__stat-value">{totalNotes}</p>
          <p className="all-notes__stat-label">Notes written</p>
        </div>
      </div>

      {groupedNotes.length === 0 ? (
        <p className="all-notes__empty">
          You haven&apos;t written any notes yet. Open a book in the Reader to
          get started.
        </p>
      ) : (
        <ul className="all-notes__book-list">
          {groupedNotes.map(({ googleBookId, notes }) => {
            const bookTitle = titles[googleBookId] ?? googleBookId;
            const isOpen = open[googleBookId] ?? true;

            return (
              <li key={googleBookId} className="all-notes__book-section">
                <button
                  type="button"
                  className="all-notes__book-header"
                  onClick={() => toggleSection(googleBookId)}
                  aria-expanded={isOpen}
                >
                  <span className="all-notes__book-title">{bookTitle}</span>
                  <span className="all-notes__book-count">
                    {notes.length} {notes.length === 1 ? "note" : "notes"}
                  </span>
                  <span
                    className={`all-notes__chevron${isOpen ? " all-notes__chevron_open" : ""}`}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>

                {isOpen && (
                  <ul className="all-notes__note-list">
                    {notes.map((note) => (
                      <li key={note._id} className="all-notes__note">
                        <div className="all-notes__note-meta">
                          <span className="all-notes__note-page">
                            p.{note.pageNumber}
                          </span>
                          {note.title && (
                            <span className="all-notes__note-title">
                              {note.title}
                            </span>
                          )}
                          <span className="all-notes__note-date">
                            {new Date(note.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="all-notes__note-content">
                          {note.content}
                        </p>
                        <Link
                          to={`/reader/${encodeURIComponent(googleBookId)}`}
                          className="all-notes__note-link"
                        >
                          Go to Reader
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

export default AllNotes;
