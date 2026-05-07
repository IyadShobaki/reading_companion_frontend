/**
 * aiService - API service for the AI reading chatbot.
 *
 * Communicates with the protected backend AI endpoint:
 *   POST /ai/ask - answer a question about the current book
 *
 * Authentication is injected automatically by ApiClient via the stored JWT.
 */

import ApiClient from "../utils/apiClient";

/** Shared ApiClient instance; reads base URL from Vite env at module load. */
const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL ?? "");

export const aiService = {
  /**
   * Answer a question about the book at the current page.
   *
   * @param {Object} payload
   * @param {string} payload.googleBookId - Google Books volume ID.
   * @param {string} payload.title        - Book title.
   * @param {number} payload.pageNumber   - Current reader page.
   * @param {string} payload.question     - The user's question (required).
   * @returns {Promise<{response: string}>} AI-generated answer.
   */
  async ask({ googleBookId, title, pageNumber, question }) {
    return apiClient.post("/ai/ask", {
      googleBookId,
      title,
      pageNumber,
      question,
    });
  },
};
