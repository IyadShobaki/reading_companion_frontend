/**
 * authService - Authentication API service
 *
 * Handles all authentication-related API calls:
 * - User registration (signup)
 * - User login (signin)
 * - Session restoration
 * - Current user fetching
 * - User profile updates
 * - Logout
 *
 * This service abstracts away the HTTP details and provides clean methods
 * for the rest of the app to use.
 */

import ApiClient from "../utils/apiClient";
import { tokenManager } from "../utils/tokenManager";

const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL ?? "");

export const authService = {
  /**
   * Register a new user
   * Creates a new account on the backend
   * @param {Object} userData - Registration data (email, password, name, etc.)
   * @returns {Promise<Object>} Server response
   */
  async signup(userData) {
    return apiClient.post("/signup", userData);
  },

  /**
   * Sign in a user
   * Authenticates user with email and password
   * Stores JWT token on success
   * @param {Object} credentials - Email and password
   * @returns {Promise<Object>} Server response containing token
   */
  async signin(credentials) {
    const res = await apiClient.post("/signin", credentials);
    if (res?.token) {
      tokenManager.set(res.token);
    }
    return res;
  },

  /**
   * Get the currently logged-in user's data
   * Requires a valid JWT token to be stored
   * @returns {Promise<Object|null>} User data if authenticated, null otherwise
   */
  async getCurrentUser() {
    const token = tokenManager.get();
    if (!token) return null;

    try {
      return await apiClient.get("/users/me");
    } catch (err) {
      if (err.status === 401) {
        tokenManager.remove();
      }
      return null;
    }
  },

  /**
   * Update the current user's profile information
   * Requires authentication
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Updated user data
   */
  async updateUser(userData) {
    return apiClient.patch("/users/me", userData);
  },

  logout() {
    tokenManager.remove();
  },
};
