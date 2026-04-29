/**
 * useAiPanel — Custom hook managing AI assistant panel state.
 *
 * Encapsulates all AI interaction state for a single book:
 *   - selectedAction: which AI action is active ("summarize" | "explain" | "context" | "ask" | null)
 *   - userInput:      the free-form question for the "ask" action
 *   - response:       the AI text returned from the last successful call
 *   - isLoading:      true while an AI request is in flight
 *   - error:          error message from the last failed request (null when none)
 *
 * `runAction` dispatches to the correct aiService method based on `selectedAction`.
 * It requires `selectedAction` to be set and — for the "ask" action — a non-empty
 * `userInput`.
 *
 * `clearResponse` resets response and error so the user can start fresh.
 */

import { useState, useCallback } from "react";
import { aiService } from "../services/ai.service";

/** All available AI action keys. */
export const AI_ACTIONS = ["summarize", "explain", "context", "ask"];

/**
 * @param {Object} bookContext - Book metadata passed to every AI request.
 * @param {string} bookContext.googleBookId
 * @param {string} bookContext.title
 * @param {number} bookContext.pageNumber
 *
 * @returns {{
 *   selectedAction: string|null,
 *   userInput: string,
 *   response: string|null,
 *   isLoading: boolean,
 *   error: string|null,
 *   setSelectedAction: (action: string|null) => void,
 *   setUserInput: (value: string) => void,
 *   runAction: () => Promise<void>,
 *   clearResponse: () => void,
 * }}
 */
export const useAiPanel = (bookContext) => {
  const [selectedAction, setSelectedAction] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Execute the selected AI action with the current book context.
   * For the "ask" action, `userInput` must be non-empty.
   * Clears any previous response/error before the request.
   */
  const runAction = useCallback(async () => {
    if (!selectedAction) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const payload = { ...bookContext };

      if (selectedAction === "ask") {
        const trimmed = userInput.trim();
        if (!trimmed) {
          setError("Please enter a question.");
          setIsLoading(false);
          return;
        }
        payload.question = trimmed;
      }

      const data = await aiService[selectedAction](payload);
      // Backend returns { response: "..." }
      setResponse(data?.response ?? "");
    } catch (err) {
      setError(err.message || "AI request failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedAction, userInput, bookContext]);

  /** Reset response and error state without changing the selected action. */
  const clearResponse = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return {
    selectedAction,
    userInput,
    response,
    isLoading,
    error,
    setSelectedAction,
    setUserInput,
    runAction,
    clearResponse,
  };
};
