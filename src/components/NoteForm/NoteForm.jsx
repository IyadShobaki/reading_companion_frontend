/**
 * NoteForm — controlled form for creating and editing notes.
 *
 * Used in two modes:
 *   - Add mode:  no `initialValues`; resets after submit; no Cancel button.
 *   - Edit mode: `initialValues` pre-populates fields; Cancel button shown.
 *
 * Page number is pre-filled with `currentPage` but remains editable.
 * Title is optional; content is required.
 *
 * @param {number}   currentPage    - Current reader page (default for new notes).
 * @param {Object}   [initialValues]- { pageNumber, title, content } for edit mode.
 * @param {Function} onSubmit       - Called with { pageNumber, title, content }.
 * @param {Function} [onCancel]     - If provided, a Cancel button is shown.
 */

import { useState, useEffect } from "react";
import "./NoteForm.css";

function NoteForm({ currentPage, initialValues, onSubmit, onCancel }) {
  const [pageNumber, setPageNumber] = useState(
    initialValues?.pageNumber ?? currentPage ?? 1,
  );
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [contentError, setContentError] = useState("");

  // Sync form when initialValues change (e.g. user clicks Edit on a different note)
  useEffect(() => {
    if (initialValues) {
      setPageNumber(initialValues.pageNumber ?? currentPage ?? 1);
      setTitle(initialValues.title ?? "");
      setContent(initialValues.content ?? "");
      setContentError("");
    }
  }, [initialValues, currentPage]);

  const isEditMode = Boolean(initialValues);

  const handleSubmit = (evt) => {
    evt.preventDefault();

    if (!content.trim()) {
      setContentError("Note content is required.");
      return;
    }

    // Parse and clamp page number — fall back to 1 if invalid
    const page = parseInt(String(pageNumber), 10);
    const safePage = Number.isNaN(page) || page < 1 ? 1 : page;

    onSubmit({
      pageNumber: safePage,
      title: title.trim(),
      content: content.trim(),
    });

    if (!isEditMode) {
      // Reset add-mode fields after submit
      setTitle("");
      setContent("");
      setContentError("");
    }
  };

  const isValid = content.trim().length > 0;

  return (
    <form
      className="note-form"
      onSubmit={handleSubmit}
      aria-label={isEditMode ? "Edit note" : "Add note"}
      noValidate
    >
      <div className="note-form__row">
        <label htmlFor="note-page" className="note-form__label">
          Page
          <input
            id="note-page"
            type="number"
            name="pageNumber"
            className="note-form__input note-form__input_page"
            value={pageNumber}
            min="1"
            onChange={(e) => setPageNumber(e.target.value)}
            aria-label="Page number"
          />
        </label>

        <label
          htmlFor="note-title"
          className="note-form__label note-form__label_grow"
        >
          Title (optional)
          <input
            id="note-title"
            type="text"
            name="title"
            className="note-form__input"
            value={title}
            placeholder="Short title…"
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
      </div>

      <label htmlFor="note-content" className="note-form__label">
        Note
        <textarea
          id="note-content"
          name="content"
          className={`note-form__textarea${
            contentError ? " note-form__textarea_error" : ""
          }`}
          value={content}
          placeholder="Write your note…"
          rows={3}
          onChange={(e) => {
            setContent(e.target.value);
            if (e.target.value.trim()) setContentError("");
          }}
          required
          aria-describedby={contentError ? "note-content-error" : undefined}
        />
      </label>

      {contentError && (
        <p id="note-content-error" className="note-form__error" role="alert">
          {contentError}
        </p>
      )}

      <div className="note-form__actions">
        <button
          type="submit"
          className="note-form__btn note-form__btn_primary"
          disabled={!isValid}
        >
          {isEditMode ? "Save changes" : "Add note"}
        </button>

        {onCancel && (
          <button
            type="button"
            className="note-form__btn note-form__btn_secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default NoteForm;
