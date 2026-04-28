/**
 * googleBooksLoader.js — singleton loader for the Google Books Embedded Viewer API.
 *
 * Injects the `jsapi.js` script once and resolves when `window.google.books`
 * is ready to use. Subsequent calls return the same cached Promise.
 *
 * Usage:
 *   import { loadGoogleBooksApi } from "../utils/googleBooksLoader";
 *   await loadGoogleBooksApi();
 *   const viewer = new window.google.books.DefaultViewer(containerEl);
 *
 * Testing:
 *   Mock this module with vi.mock so no real network request is made:
 *   vi.mock("../utils/googleBooksLoader", () => ({
 *     loadGoogleBooksApi: vi.fn(() => Promise.resolve()),
 *   }));
 */

const SCRIPT_URL = "https://www.google.com/books/jsapi.js";

// Cached promise — ensures the script is injected exactly once per page session.
let _loadPromise = null;

/**
 * Ensures the Google Books Embedded Viewer API is ready.
 * Safe to call multiple times — returns the same Promise after the first call.
 *
 * @returns {Promise<void>} Resolves when `window.google.books` is available.
 */
export function loadGoogleBooksApi() {
  // Return the cached promise if loading is already in progress or done.
  if (_loadPromise) return _loadPromise;

  // If the API is already on the window (e.g. SSR or hot-reload), resolve immediately.
  if (window.google?.books) {
    _loadPromise = Promise.resolve();
    return _loadPromise;
  }

  _loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      try {
        // `google.books.load()` triggers the asynchronous download of the Books module.
        // `setOnLoadCallback` registers the function to call once it's ready.
        window.google.books.load();
        window.google.books.setOnLoadCallback(resolve);
      } catch (err) {
        reject(err);
      }
    };

    script.onerror = () =>
      reject(new Error("Failed to load Google Books API script."));

    document.body.appendChild(script);
  });

  return _loadPromise;
}

/**
 * Resets the cached load promise.
 * Exported for use in tests only — do not call in production code.
 * @internal
 */
export function _resetLoader() {
  _loadPromise = null;
}
