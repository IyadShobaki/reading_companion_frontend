import { createContext } from "react";

/**
 * ToastContext — Provides a showToast function to any component in the tree.
 *
 * showToast(message, type?) queues a toast notification.
 * type: "success" | "error" | "info"  (defaults to "info")
 *
 * Populated in App.jsx via <ToastProvider>.
 */
export const ToastContext = createContext({
  showToast: () => {},
});
