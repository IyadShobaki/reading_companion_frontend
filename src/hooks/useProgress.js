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
   * Auth users: checks localStorage first. If localStorage has no entry the
   * book is new on this device — the backend call is skipped to avoid a
   * spurious 404. If localStorage has a value, the backend is queried so the
   * latest page (e.g. saved from another session) is returned and mirrored
   * back to localStorage. Falls back to the local value on API error.
   *
   * Guest users: reads from localStorage only.
   *
   * Cross-device sync is preserved because every backend save always mirrors
   * the result to localStorage on the current device.
   *
   * @param {string} googleBookId
   * @returns {Promise<number|null>}
   */
  const loadProgress = useCallback(
    async (googleBookId) => {
      if (isLoggedIn) {
        // Only call the backend when localStorage already holds progress for
        // this book. A null entry means the book is new here — skip the
        // backend to avoid a needless 404 ("Start Reading", not "Continue").
        const localPage = progressStorage.loadProgress(googleBookId);
        if (localPage !== null) {
          try {
            const page = await progressService.getProgress(googleBookId);
            if (page !== null) {
              // Mirror latest backend page to localStorage.
              progressStorage.saveProgress(googleBookId, page);
              return page;
            }
          } catch {
            // Fall back to local value on unexpected API error.
          }
          return localPage;
        }
        return null;
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
