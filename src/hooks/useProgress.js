import { useContext, useCallback } from "react";
import { CurrentUserContext } from "../contexts/CurrentUserContext";
import { progressService } from "../services/progress.service";
import { progressStorage } from "../utils/progressStorage";

/**
 * useProgress — unified reading-progress manager.
 *
 * Authenticated users: progress is persisted to the backend and mirrored to
 * localStorage so that BookCard / BookPreviewModal can read it synchronously
 * to show "Continue Reading" without waiting for an async API call.
 *
 * Guest users: progress lives entirely in localStorage (progressStorage).
 *
 * Both `loadProgress` and `saveProgress` are safe to call in either mode —
 * the backend is never contacted unless the user is logged in.
 */
export function useProgress() {
  const { currentUser } = useContext(CurrentUserContext);
  const isLoggedIn = Boolean(currentUser);

  /**
   * Load the saved page number for a book.
   *
   * Auth users: fetches from the backend and mirrors the result to
   * localStorage. Falls back to localStorage when no backend record exists
   * or on a non-fatal API error.
   *
   * @param {string} googleBookId
   * @returns {Promise<number|null>}
   */
  const loadProgress = useCallback(
    async (googleBookId) => {
      if (isLoggedIn) {
        try {
          const page = await progressService.getProgress(googleBookId);
          if (page !== null) {
            // Mirror to localStorage so BookCard / BookPreviewModal can read
            // the value synchronously during render.
            progressStorage.saveProgress(googleBookId, page);
            return page;
          }
        } catch {
          // Fall back to localStorage on unexpected API error.
        }
      }
      return progressStorage.loadProgress(googleBookId);
    },
    [isLoggedIn],
  );

  /**
   * Persist the current page number for a book.
   *
   * Always writes to localStorage first so the save is never lost.
   * Auth users: also persists to the backend (best-effort; localStorage is
   * already updated even if the API call fails).
   *
   * @param {string} googleBookId
   * @param {number} pageNumber
   * @returns {Promise<void>}
   */
  const saveProgress = useCallback(
    async (googleBookId, pageNumber) => {
      // Always mirror to localStorage for guest fallback and synchronous reads.
      progressStorage.saveProgress(googleBookId, pageNumber);
      if (isLoggedIn) {
        try {
          await progressService.saveProgress(googleBookId, pageNumber);
        } catch {
          // Best effort — localStorage is already updated.
        }
      }
    },
    [isLoggedIn],
  );

  return { loadProgress, saveProgress };
}
