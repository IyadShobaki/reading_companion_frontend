/**
 * AiPanel — AI chatbot panel for the Reader sidebar.
 *
 * Authenticated users can pick a preset prompt or type a free-form question
 * about the current book. Unauthenticated users see a login prompt.
 *
 * Preset buttons pre-fill the textarea so the user can review/edit before
 * submitting. All presets use the single backend POST /ai/ask endpoint.
 *
 * @param {string}   googleBookId  - Google Books volume ID.
 * @param {string}   title         - Book title (sent as context with every request).
 * @param {number}   currentPage   - Current reader page (sent as context).
 * @param {string[]} [authors]     - Author list.
 * @param {string}   [description] - Publisher description / blurb.
 * @param {string[]} [categories]  - Subject categories.
 */

import { useContext, useRef, useCallback } from "react";
import { CurrentUserContext } from "../../contexts/CurrentUserContext";
import { useAiPanel } from "../../hooks/useAiPanel";
import Loading from "../Loading/Loading";
import "./AiPanel.css";

const PRESETS = [
  {
    label: "What is this book about?",
    prompt: "What is this book about?",
  },
  {
    label: "Main characters",
    prompt: "Who are the main characters in this book?",
  },
  {
    label: "Themes",
    prompt: "What are the main themes this book explores?",
  },
];

function AiPanel({
  googleBookId,
  title,
  currentPage,
  authors,
  description,
  categories,
}) {
  const { currentUser } = useContext(CurrentUserContext);
  const isLoggedIn = Boolean(currentUser);

  const {
    userInput,
    response,
    isLoading,
    error,
    setUserInput,
    runAction,
    clearResponse,
  } = useAiPanel({
    googleBookId,
    title,
    pageNumber: currentPage,
    authors,
    description,
    categories,
  });

  const textareaRef = useRef(null);

  const handlePreset = useCallback(
    (prompt) => {
      setUserInput(prompt);
      // Focus textarea so user can review/edit before submitting
      textareaRef.current?.focus();
    },
    [setUserInput],
  );

  const handleSubmit = (evt) => {
    evt.preventDefault();
    runAction();
  };

  // ── Unauthenticated ─────────────────────────────────────────────────────

  if (!isLoggedIn) {
    return (
      <div className="ai-panel">
        <p className="ai-panel__login-prompt">
          Log in to use AI reading tools.
        </p>
      </div>
    );
  }

  // ── Authenticated ────────────────────────────────────────────────────────

  return (
    <div className="ai-panel">
      {/* Preset prompt buttons */}
      <div
        className="ai-panel__presets"
        role="group"
        aria-label="Quick prompts"
      >
        {PRESETS.map(({ label, prompt }) => (
          <button
            key={label}
            type="button"
            className="ai-panel__preset-btn"
            onClick={() => handlePreset(prompt)}
            aria-label={`Use preset: ${label}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Question input */}
      <form
        className="ai-panel__ask-form"
        onSubmit={handleSubmit}
        aria-label="Ask a question"
      >
        <label htmlFor="ai-question" className="ai-panel__ask-label">
          Ask about this book
          <textarea
            id="ai-question"
            ref={textareaRef}
            className="ai-panel__ask-input"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="What would you like to know about this book?"
            rows={3}
            aria-label="Your question"
          />
        </label>
        <button
          type="submit"
          className="ai-panel__submit-btn"
          disabled={isLoading || !userInput.trim()}
        >
          {isLoading ? "Thinking…" : "Ask"}
        </button>
      </form>

      {/* Loading indicator */}
      {isLoading && (
        <div role="status" aria-label="Loading AI response">
          <Loading />
        </div>
      )}

      {/* Error message */}
      {error && !isLoading && (
        <p className="ai-panel__error" role="alert">
          {error}
        </p>
      )}

      {/* Response display */}
      {response && !isLoading && (
        <div
          className="ai-panel__response"
          role="region"
          aria-label="AI response"
        >
          <p className="ai-panel__response-text">{response}</p>
          <button
            type="button"
            className="ai-panel__clear-btn"
            onClick={clearResponse}
            aria-label="Clear response"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

export default AiPanel;
