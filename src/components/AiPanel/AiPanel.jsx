/**
 * AiPanel — AI assistant panel for the Reader sidebar.
 *
 * Displays four AI action buttons (Summarize, Explain, Context, Ask).
 * The "Ask" action reveals a text input for the user's question.
 * Responses are displayed in a scrollable region below the controls.
 *
 * Unauthenticated users see a login prompt — no AI actions are shown.
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
import { useAiPanel, AI_ACTIONS } from "../../hooks/useAiPanel";
import Loading from "../Loading/Loading";
import "./AiPanel.css";

/** Human-readable labels for each action key. */
const ACTION_LABELS = {
  summarize: "Summarize",
  explain: "Explain",
  context: "Context",
  ask: "Ask",
};

function AiPanel({ googleBookId, title, currentPage }) {
  const { currentUser } = useContext(CurrentUserContext);
  const isLoggedIn = Boolean(currentUser);

  const {
    selectedAction,
    userInput,
    response,
    isLoading,
    error,
    setSelectedAction,
    setUserInput,
    runAction,
    clearResponse,
  } = useAiPanel({ googleBookId, title, pageNumber: currentPage });

  /**
   * Toggle action selection — clicking the active action de-selects it and
   * clears any existing response so the panel returns to a clean state.
   */
  const handleActionClick = (action) => {
    if (selectedAction === action) {
      setSelectedAction(null);
      clearResponse();
    } else {
      setSelectedAction(action);
      clearResponse();
    }
  };

  const handleAskSubmit = (evt) => {
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
      {/* Action selector buttons */}
      <div className="ai-panel__actions" role="group" aria-label="AI actions">
        {AI_ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            className={`ai-panel__action-btn${
              selectedAction === action ? " ai-panel__action-btn_active" : ""
            }`}
            onClick={() => handleActionClick(action)}
            aria-pressed={selectedAction === action}
          >
            {ACTION_LABELS[action]}
          </button>
        ))}
      </div>

      {/* Question input — only shown when "Ask" is selected */}
      {selectedAction === "ask" && (
        <form
          className="ai-panel__ask-form"
          onSubmit={handleAskSubmit}
          aria-label="Ask a question"
        >
          <label htmlFor="ai-question" className="ai-panel__ask-label">
            Your question
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
      )}

      {/* Run button for non-Ask actions */}
      {selectedAction && selectedAction !== "ask" && (
        <button
          type="button"
          className="ai-panel__submit-btn"
          onClick={runAction}
          disabled={isLoading}
          aria-label={`Run ${ACTION_LABELS[selectedAction]}`}
        >
          {isLoading ? "Thinking…" : ACTION_LABELS[selectedAction]}
        </button>
      )}

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

      {/* Placeholder when no action is selected */}
      {!selectedAction && !response && !error && (
        <p className="ai-panel__hint">
          Select an action above to get AI insights about this book.
        </p>
      )}
    </div>
  );
}

export default AiPanel;
