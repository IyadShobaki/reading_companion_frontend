/**
 * useAiPanel — Custom hook managing AI chatbot panel state.
 *
 * Encapsulates all state for the book chatbot:
 *   - userInput:  the reader's question
 *   - response:   the AI text returned from the last successful call
 *   - isLoading:  true while a request is in flight
 *   - error:      error message from the last failed request (null when none)
 *
 * `runAction` sends the current question to /ai/ask with the book context.
 * `clearResponse` resets response and error so the user can start fresh.
 */

import { useState, useCallback } from "react";
import { aiService } from "../services/ai.service";

/**
 * @param {Object} bookContext - Book metadata passed to every AI request.
 * @param {string} bookContext.googleBookId
 * @param {string} bookContext.title
 * @param {number} bookContext.pageNumber
 *
 * @returns {{
 *   userInput: string,
 *   response: string|null,
 *   isLoading: boolean,
 *   error: string|null,
 *   setUserInput: (value: string) => void,
 *   runAction: () => Promise<void>,
 *   clearResponse: () => void,
 * }}
 */
export const useAiPanel = (bookContext) => {
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Send the current question to the AI. `userInput` must be non-empty.
   * Clears any previous response/error before the request.
   */
  const runAction = useCallback(async () => {
    const trimmed = userInput.trim();
    if (!trimmed) {
      setError("Please enter a question.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const data = await aiService.ask({ ...bookContext, question: trimmed });
      setResponse(data?.data?.response ?? "");
    } catch (err) {
      setError(err.message || "AI request failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [userInput, bookContext]);

  /** Reset response and error state. */
  const clearResponse = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return {
    userInput,
    response,
    isLoading,
    error,
    setUserInput,
    runAction,
    clearResponse,
  };
};
