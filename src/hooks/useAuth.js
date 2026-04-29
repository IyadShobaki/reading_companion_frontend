/**
 * useAuth - Custom hook for managing user authentication
 *
 * Handles all authentication-related operations including:
 * - User login (signin)
 * - User registration (signup)
 * - Session restoration
 * - Profile updates
 * - Logout
 *
 * Stores authentication state including:
 * - isLoggedIn: whether user is currently authenticated
 * - currentUser: the logged-in user's data
 * - isLoading: whether an auth operation is in progress
 * - error: any error messages from auth operations
 */

import { useState, useCallback } from "react";
import { authService } from "../services/authService";

/**
 * useAuth hook factory
 * @returns {Object} Auth state and methods
 */
export const useAuth = () => {
  // Track if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Store current logged-in user's data (id, name, email, etc.)
  const [currentUser, setCurrentUser] = useState(null);

  // Start as true — assume a session check is pending until restoreSession resolves
  const [isLoading, setIsLoading] = useState(true);

  // Store any error messages that occur during auth operations
  const [error, setError] = useState(null);

  /**
   * Signs in a user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} The logged-in user data
   */
  const signin = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await authService.signin({ email, password });
      if (res?.data) {
        setCurrentUser(res.data);
        setIsLoggedIn(true);
      }
    } catch (err) {
      const errorMsg = err.message || "Sign in failed";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Registers a new user
   * Creates a new account and automatically signs them in
   * @param {Object} credentials - Registration data (email, password, name, etc.)
   */
  const signup = useCallback(async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.signup(credentials);
      const res = await authService.signin({
        email: credentials.email,
        password: credentials.password,
      });
      if (res?.data) {
        setCurrentUser(res.data);
        setIsLoggedIn(true);
      }
    } catch (err) {
      const errorMsg = err.message || "Signup failed";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Restores user session from stored token (on app load)
   * Checks localStorage for JWT token and attempts to re-authenticate
   */
  const restoreSession = useCallback(async () => {
    try {
      const res = await authService.getCurrentUser();
      if (res?.data) {
        setCurrentUser(res.data);
        setIsLoggedIn(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Updates the logged-in user's profile information
   * @param {Object} updatedData - Updated user profile data
   * @returns {Promise<Object>} The updated user data
   */
  const updateProfile = useCallback(async (updatedData) => {
    try {
      setIsLoading(true);
      setError(null);
      // Call the update user service and store updated data
      const { data: updatedUser } = await authService.updateUser(updatedData);
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (err) {
      const errorMsg = err.message || "Failed to update profile";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logs out the current user
   * Clears user data and token from localStorage
   */
  const logout = useCallback(() => {
    // Call logout service (clears token from localStorage)
    authService.logout();
    // Reset all state
    setIsLoggedIn(false);
    setCurrentUser(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Return all auth state and methods
  return {
    isLoggedIn,
    currentUser,
    isLoading,
    error,
    signin,
    signup,
    logout,
    restoreSession,
    updateProfile,
    clearError,
  };
};
