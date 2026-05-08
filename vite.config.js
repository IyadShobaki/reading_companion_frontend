import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    port: 3001,
  },
  test: {
    // Use jsdom to simulate browser globals (window, document, fetch, etc.)
    environment: "jsdom",
    // Automatically import vi, describe, it, expect in every test file
    globals: true,
    // Load jest-dom matchers globally before every test file
    setupFiles: ["./src/test/setup.js"],
  },
});
