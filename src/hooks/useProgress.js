import { useContext, useCallback } from "react";
import { CurrentUserContext } from "../contexts/CurrentUserContext";
import { progressService } from "../services/progress.service";
import { progressStorage } from "../utils/progressStorage";

/**
 * Unified reading-progress manager for guests and authenticated users.
 *
 * Authenticated users persist progress to the backend and mirror successful
 * reads/writes to localStorage for synchronous UI reads and offline fallback.
 * Guest users use localStorage only.
 */
export function useProgress() {
  const { currentUser } = useContext(CurrentUserContext);
  const isLoggedIn = Boolean(currentUser);

  /**
   * Load the saved page number for a book.
   *
   * Authenticated users check the backend first so progress saved on another
   * device is restored even when this browser has no local copy. If the API
   * fails, localStorage is used as the offline fallback.
   *
   * @param {string} googleBookId - Google Books volume id.
   * @returns {Promise<number|null>} Saved page number, or null when none exists.
   */
  const loadProgress = useCallback(
    async (googleBookId) => {
      if (isLoggedIn) {
        try {
          const page = await progressService.getProgress(googleBookId);
          if (page !== null) {
            progressStorage.saveProgress(googleBookId, page);
          }
          return page;
        } catch {
          return progressStorage.loadProgress(googleBookId);
        }
      }

      return progressStorage.loadProgress(googleBookId);
    },
    [isLoggedIn],
  );

  /**
   * Persist the current page number for a book.
   *
   * The local copy is written first. Authenticated users then sync to the
   * backend on a best-effort basis; failed API writes leave the local copy.
   *
   * @param {string} googleBookId - Google Books volume id.
   * @param {number} pageNumber - Current page number.
   * @returns {Promise<void>}
   */
  const saveProgress = useCallback(
    async (googleBookId, pageNumber) => {
      progressStorage.saveProgress(googleBookId, pageNumber);
      if (isLoggedIn) {
        try {
          await progressService.saveProgress(googleBookId, pageNumber);
        } catch {
          // Local progress is already saved for offline recovery.
        }
      }
    },
    [isLoggedIn],
  );

  return { loadProgress, saveProgress };
}
