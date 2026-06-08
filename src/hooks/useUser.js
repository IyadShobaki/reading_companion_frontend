/**
 * useUser — manages the async profile-update mutation.
 *
 * Owns the loading and error state for PATCH /users/me so that
 * useAuth can stay focused on login/logout/session-restore concerns.
 *
 * @param {Function} updateCurrentUser - Stable setter from useAuth that
 *   updates the currentUser in the shared auth state.
 */

import { useState, useCallback } from "react";
import { authService } from "../services/authService";

export const useUser = (updateCurrentUser) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Sends a PATCH /users/me request and updates the shared auth state.
   * @param {Object} updatedData - Fields to update (name, avatar).
   * @returns {Promise<Object>} The updated user data.
   */
  const updateProfile = useCallback(
    async (updatedData) => {
      try {
        setIsLoading(true);
        setError(null);
        const { data: updatedUser } = await authService.updateUser(updatedData);
        updateCurrentUser(updatedUser);
        return updatedUser;
      } catch (err) {
        const errorMsg = err.message || "Failed to update profile";
        setError(errorMsg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [updateCurrentUser],
  );

  const clearError = useCallback(() => setError(null), []);

  return { updateProfile, isLoading, error, clearError };
};
