import { createContext } from "react";

/**
 * LibraryContext — Provides library state and operations to the component tree.
 *
 * Default shape matches the useLibrary return value so consumers are type-safe
 * before the provider mounts (e.g., in isolated unit tests).
 *
 * Populated in App.jsx via <LibraryContext.Provider value={library}>.
 */
export const LibraryContext = createContext({
  savedBooks: [],
  savedBookIds: [],
  isLoading: false,
  error: null,
  fetchLibrary: () => Promise.resolve(),
  addBook: () => Promise.resolve(),
  removeBook: () => Promise.resolve(),
  clearLibrary: () => {},
});
