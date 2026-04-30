/**
 * ApiClient - HTTP request utility class
 *
 * Provides a centralized, reusable interface for making HTTP requests to the backend API.
 * Features:
 * - Automatic Authorization header injection with JWT token
 * - Consistent error handling
 * - API logging for debugging
 * - Helper methods for common HTTP verbs (GET, POST, PATCH, DELETE)
 */

import { tokenManager } from "./tokenManager";

class ApiClient {
  /**
   * Initialize ApiClient with base URL
   * @param {string} baseUrl - The base URL for the API (e.g., http://localhost:3001)
   */
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an HTTP request to the API
   * Handles:
   * - URL construction (baseUrl + endpoint)
   * - Authorization header injection
   * - JSON serialization
   * - Response parsing
   * - Error handling
   *
   * @param {string} endpoint - The API endpoint (e.g., /items, /users/me)
   * @param {Object} options - Fetch options (method, body, headers, etc.)
   * @returns {Promise<Object>} Parsed JSON response from the server
   * @throws {Error} If the response status is not OK
   */
  async request(endpoint, options = {}) {
    // Construct full URL
    const url = `${this.baseUrl}${endpoint}`;

    // Set up headers
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add JWT token to Authorization header if available
    const token = tokenManager.get();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Log the API request for debugging (dev only)
    if (import.meta.env.DEV) {
      console.log(`[API] ${options.method || "GET"} ${url}`);
    }

    // Make the actual fetch request
    const response = await fetch(url, { ...options, headers });

    // Check if response is successful
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const message = body.message || `Error: ${response.status}`;
      if (import.meta.env.DEV) {
        console.error(`[API Error] ${response.status}: ${message}`);
      }
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    // Parse and return JSON response (204 No Content has no body)
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} Response data
   */
  get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  }

  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data to send
   * @returns {Promise<Object>} Response data
   */
  post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Make a PATCH request (for partial updates)
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Updated data to send
   * @returns {Promise<Object>} Response data
   */
  patch(endpoint, data) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  /**
   * Make a PUT request (for full updates)
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Updated data to send (optional)
   * @returns {Promise<Object>} Response data
   */
  put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} Response data
   */
  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }
}

export default ApiClient;
