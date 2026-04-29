/**
 * NoteCard — displays a single note with expand/collapse and edit/delete actions.
 *
 * Content longer than TRUNCATION_THRESHOLD characters is truncated with an
 * expand toggle. Edit mode replaces the card body with an inline NoteForm.
 *
 * @param {Object}   note          - { _id, pageNumber, title, content, updatedAt }
 * @param {Function} onEdit        - Called with (noteId, changes) after edit form submit.
 * @param {Function} onDelete      - Called with (noteId) when Delete is clicked.
 */

import { useState } from "react";
import NoteForm from "../NoteForm/NoteForm";
import "./NoteCard.css";

/** Characters of content to show when collapsed. */
const TRUNCATION_THRESHOLD = 200;

function NoteCard({ note, onEdit, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { _id, pageNumber, title, content } = note;

  const isTruncatable = content.length > TRUNCATION_THRESHOLD;
  const displayContent =
    isExpanded || !isTruncatable
      ? content
      : `${content.slice(0, TRUNCATION_THRESHOLD)}…`;

  /** Forward edit changes to the parent and exit edit mode. */
  const handleEditSubmit = (changes) => {
    onEdit(_id, changes);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <article
        className="note-card note-card_editing"
        aria-label={`Editing note: ${title || "untitled"}`}
      >
        <NoteForm
          currentPage={pageNumber}
          initialValues={{ pageNumber, title, content }}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditing(false)}
        />
      </article>
    );
  }

  return (
    <article className="note-card">
      <header className="note-card__header">
        <span className="note-card__page" aria-label={`Page ${pageNumber}`}>
          p.{pageNumber}
        </span>

        {title && <h3 className="note-card__title">{title}</h3>}

        <div className="note-card__actions">
          <button
            type="button"
            className="note-card__btn"
            onClick={() => setIsEditing(true)}
            aria-label="Edit note"
          >
            Edit
          </button>
          <button
            type="button"
            className="note-card__btn note-card__btn_danger"
            onClick={() => onDelete(_id)}
            aria-label="Delete note"
          >
            Delete
          </button>
        </div>
      </header>

      <p className="note-card__content">{displayContent}</p>

      {isTruncatable && (
        <button
          type="button"
          className="note-card__toggle"
          onClick={() => setIsExpanded((e) => !e)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      )}
    </article>
  );
}

export default NoteCard;
