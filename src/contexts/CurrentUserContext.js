import { createContext } from "react";

// Provides the authenticated user's data to any component in the tree
// without prop drilling. Default shape keeps consumers type-safe before login.
export const CurrentUserContext = createContext({ currentUser: null });
