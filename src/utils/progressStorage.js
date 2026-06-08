/**
 * progressStorage — localStorage utility for reading progress.
 *
 * Stores the last-saved page number per book, keyed by googleBookId.
 * All three methods are safe: localStorage errors (private browsing,
 * storage quota exceeded, SecurityError) are silently swallowed so that
 * a broken storage layer never crashes the reading experience.
 *
 * Storage key format:  rc_progress_<googleBookId>
 * Value format:        stringified integer ≥ 1
 */

const STORAGE_PREFIX = "rc_progress_";

function getKey(googleBookId) {
  return `${STORAGE_PREFIX}${googleBookId}`;
}

/**
 * Persist the current page number for a book.
 *
 * @param {string} googleBookId
 * @param {number} pageNumber
 */
function saveProgress(googleBookId, pageNumber) {
  try {
    localStorage.setItem(getKey(googleBookId), String(pageNumber));
  } catch {
    // localStorage unavailable (private browsing, quota exceeded, etc.)
  }
}

/**
 * Retrieve the last saved page number for a book.
 *
 * @param {string} googleBookId
 * @returns {number|null} Saved page number (≥ 1), or null if none found.
 */
function loadProgress(googleBookId) {
  try {
    const raw = localStorage.getItem(getKey(googleBookId));
    if (raw === null) return null;
    const page = parseInt(raw, 10);
    return Number.isNaN(page) || page < 1 ? null : page;
  } catch {
    return null;
  }
}

/**
 * Remove the saved progress for a book.
 *
 * @param {string} googleBookId
 */
function clearProgress(googleBookId) {
  try {
    localStorage.removeItem(getKey(googleBookId));
  } catch {
    // ignore
  }
}

export const progressStorage = { saveProgress, loadProgress, clearProgress };
