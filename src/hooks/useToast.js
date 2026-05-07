import { useContext } from "react";
import { ToastContext } from "../contexts/ToastContext";

/**
 * useToast — convenience hook to access showToast from ToastContext.
 *
 * @returns {{ showToast: (message: string, type?: "success"|"error"|"info") => void }}
 */
export function useToast() {
  return useContext(ToastContext);
}
