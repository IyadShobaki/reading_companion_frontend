/**
 * aiService - API service for AI assistant actions.
 *
 * Communicates with the protected backend AI endpoints:
 *   POST /ai/summarize - summarize the current book context
 *   POST /ai/explain   - explain a passage or concept
 *   POST /ai/context   - provide historical/literary context
 *   POST /ai/ask       - answer a free-form user question
 *
 * All requests carry optional book context so the AI can give relevant answers.
 * Authentication is injected automatically by ApiClient via the stored JWT.
 */

import ApiClient from "../utils/apiClient";

/** Shared ApiClient instance; reads base URL from Vite env at module load. */
const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL ?? "");

export const aiService = {
  /**
   * Summarize the book at the current page.
   *
   * @param {Object} payload
   * @param {string} payload.googleBookId - Google Books volume ID.
   * @param {string} payload.title        - Book title.
   * @param {number} payload.pageNumber   - Current reader page.
   * @returns {Promise<{response: string}>} AI-generated summary.
   */
  async summarize({ googleBookId, title, pageNumber }) {
    return apiClient.post("/ai/summarize", { googleBookId, title, pageNumber });
  },

  /**
   * Explain a concept or passage from the book.
   *
   * @param {Object} payload
   * @param {string} payload.googleBookId - Google Books volume ID.
   * @param {string} payload.title        - Book title.
   * @param {number} payload.pageNumber   - Current reader page.
   * @returns {Promise<{response: string}>} AI-generated explanation.
   */
  async explain({ googleBookId, title, pageNumber }) {
    return apiClient.post("/ai/explain", { googleBookId, title, pageNumber });
  },

  /**
   * Provide historical or literary context for the book at the current page.
   *
   * @param {Object} payload
   * @param {string} payload.googleBookId - Google Books volume ID.
   * @param {string} payload.title        - Book title.
   * @param {number} payload.pageNumber   - Current reader page.
   * @returns {Promise<{response: string}>} AI-generated context.
   */
  async context({ googleBookId, title, pageNumber }) {
    return apiClient.post("/ai/context", { googleBookId, title, pageNumber });
  },

  /**
   * Answer a free-form question about the book.
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
