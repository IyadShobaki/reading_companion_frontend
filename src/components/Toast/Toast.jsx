import { useEffect } from "react";
import "./Toast.css";

const AUTO_DISMISS_MS = 3000;

/**
 * Toast — individual notification pill.
 *
 * Auto-dismisses after AUTO_DISMISS_MS. The parent (ToastProvider) controls
 * the list; this component only calls onDismiss when its timer fires or the
 * close button is clicked.
 *
 * @param {{ id: number, message: string, type: "success"|"error"|"info" }} toast
 * @param {(id: number) => void} onDismiss
 */
function Toast({ toast, onDismiss }) {
  const { id, message, type } = toast;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div className={`toast toast_${type}`} role="status" aria-label={message}>
      <span className="toast__message">{message}</span>
      <button
        type="button"
        className="toast__close"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

export default Toast;
