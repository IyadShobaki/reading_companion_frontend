import { useState, useCallback } from "react";
import { ToastContext } from "../../contexts/ToastContext";
import Toast from "./Toast";

let _nextId = 1;

/**
 * ToastProvider — wraps the app and manages the live toast list.
 *
 * Renders the Toast overlay beside its children so all toasts share a single
 * DOM container at the top of the viewport.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = _nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
