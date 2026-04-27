/**
 * useModal - Custom hook for managing modal state
 *
 * Centralizes modal state management including:
 * - Which modal is currently open
 *
 * This hook prevents prop drilling and keeps modal state organized
 */

import { useState, useCallback } from "react";

export const useModal = () => {
  const [activeModal, setActiveModal] = useState("");

  const openModal = useCallback((modalName) => {
    setActiveModal(modalName);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal("");
  }, []);

  return {
    activeModal,
    openModal,
    closeModal,
  };
};
