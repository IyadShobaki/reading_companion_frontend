/**
 * tokenManager - JWT Token management utility
 *
 * Provides a centralized interface for managing JWT tokens stored in localStorage.
 * All authentication tokens are managed through this object to ensure consistency.
 *
 * The JWT token is stored in localStorage with the key "jwt" and is used to
 * authenticate API requests.
 */

export const tokenManager = {
  /**
   * Retrieve the stored JWT token from localStorage
   * @returns {string|null} The JWT token if it exists, null otherwise
   */
  get() {
    return localStorage.getItem("jwt");
  },

  /**
   * Store a JWT token in localStorage
   * Called after successful login/registration
   * @param {string} token - The JWT token to store
   */
  set(token) {
    localStorage.setItem("jwt", token);
  },

  /**
   * Delete the stored JWT token from localStorage
   * Called on logout to clear the session
   */
  remove() {
    localStorage.removeItem("jwt");
  },

  /**
   * Check if a JWT token exists in localStorage
   * @returns {boolean} True if a token exists, false otherwise
   */
  exists() {
    return !!this.get();
  },
};
