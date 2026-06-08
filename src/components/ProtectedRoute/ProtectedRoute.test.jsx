/**
 * ProtectedRoute.test.jsx — Unit tests for the ProtectedRoute component.
 *
 * Verifies that:
 *   - Authenticated users can access the guarded content
 *   - Unauthenticated users are redirected to "/" with the attempted path saved
 *   - A loading spinner is shown while session state is still being resolved
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders a MemoryRouter with a protected /dashboard route.
 * A second route captures the navigation target so tests can assert on
 * redirect behaviour without needing a real router.
 */
function LocationDisplay() {
  const loc = useLocation();
  return (
    <span data-testid="location">
      {loc.pathname}
      {loc.state?.from?.pathname ? `|from:${loc.state.from.pathname}` : ""}
    </span>
  );
}

const renderProtectedRoute = ({
  isLoggedIn = false,
  isLoading = false,
  initialPath = "/dashboard",
} = {}) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<LocationDisplay />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isLoggedIn={isLoggedIn} isLoading={isLoading}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProtectedRoute", () => {
  // ── Authenticated ─────────────────────────────────────────────────────────

  it("renders the children when the user is logged in", () => {
    renderProtectedRoute({ isLoggedIn: true });
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("does not redirect when the user is logged in", () => {
    renderProtectedRoute({ isLoggedIn: true });
    // The protected content is visible — we never ended up on the home route
    expect(screen.queryByTestId("location")).not.toBeInTheDocument();
  });

  // ── Unauthenticated ───────────────────────────────────────────────────────

  it("redirects to '/' when the user is not logged in", () => {
    renderProtectedRoute({ isLoggedIn: false });
    expect(screen.getByTestId("location").textContent).toContain("/");
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("saves the attempted path in redirect state so the user can return after login", () => {
    renderProtectedRoute({ isLoggedIn: false, initialPath: "/dashboard" });
    expect(screen.getByTestId("location").textContent).toContain(
      "from:/dashboard",
    );
  });

  // ── Loading ───────────────────────────────────────────────────────────────

  it("shows the loading indicator while the session check is in flight", () => {
    const { container } = renderProtectedRoute({
      isLoggedIn: false,
      isLoading: true,
    });
    expect(container.querySelector(".loading")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("does not redirect while loading (prevents flash redirect)", () => {
    renderProtectedRoute({ isLoggedIn: false, isLoading: true });
    // The LocationDisplay component would be visible if a redirect happened
    expect(screen.queryByTestId("location")).not.toBeInTheDocument();
  });
});
