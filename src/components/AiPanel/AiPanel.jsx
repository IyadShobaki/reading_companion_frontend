/**
 * AiPanel — AI chatbot panel for the Reader sidebar.
 *
 * Authenticated users can type a question about the current book and
 * receive an AI-generated answer. Unauthenticated users see a login prompt.
 *
 * All state is managed by useAiPanel — the component is purely presentational
 * relative to the hook.
 *
 * @param {string} googleBookId - Google Books volume ID.
 * @param {string} title        - Book title (sent as context with every request).
 * @param {number} currentPage  - Current reader page (sent as context).
 */

import { useContext } from "react";
import { CurrentUserContext } from "../../contexts/CurrentUserContext";
import { useAiPanel } from "../../hooks/useAiPanel";
import Loading from "../Loading/Loading";
import "./AiPanel.css";

function AiPanel({ googleBookId, title, currentPage }) {
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
  } = useAiPanel({ googleBookId, title, pageNumber: currentPage });

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
