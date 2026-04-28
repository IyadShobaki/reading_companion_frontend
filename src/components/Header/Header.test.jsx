/**
 * Header.test.jsx — Unit tests for the Header component's search behavior.
 *
 * Auth buttons and nav-toggle behavior are integration concerns; here we
 * focus on the search form — the new logic added in Step 4.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Header from "./Header";
import { CurrentUserContext } from "../../contexts/CurrentUserContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Captures the current location so tests can assert on navigation. */
function LocationDisplay() {
  const loc = useLocation();
  return <span data-testid="location">{loc.pathname + loc.search}</span>;
}

const renderHeader = (props = {}) =>
  render(
    <CurrentUserContext.Provider value={{ currentUser: null }}>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <Header
                  handleLoginClick={vi.fn()}
                  handleRegisterClick={vi.fn()}
                  isLoggedIn={false}
                  {...props}
                />
                <LocationDisplay />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </CurrentUserContext.Provider>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Header search", () => {
  it("renders the search input", () => {
    renderHeader();
    expect(
      screen.getByRole("searchbox", { name: /search books/i }),
    ).toBeInTheDocument();
  });

  it("renders the search submit button", () => {
    renderHeader();
    expect(
      screen.getByRole("button", { name: /submit search/i }),
    ).toBeInTheDocument();
  });

  it("navigates to /search?q=… when the form is submitted", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.type(screen.getByRole("searchbox"), "javascript");
    await user.click(screen.getByRole("button", { name: /submit search/i }));

    expect(screen.getByTestId("location").textContent).toBe(
      "/search?q=javascript",
    );
  });

  it("URL-encodes spaces in the search query", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.type(screen.getByRole("searchbox"), "clean code");
    await user.click(screen.getByRole("button", { name: /submit search/i }));

    expect(screen.getByTestId("location").textContent).toBe(
      "/search?q=clean%20code",
    );
  });

  it("does not navigate when the search query is empty", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole("button", { name: /submit search/i }));

    // Should still be on the original path
    expect(screen.getByTestId("location").textContent).toBe("/");
  });

  it("does not navigate when the search query is whitespace only", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.type(screen.getByRole("searchbox"), "   ");
    await user.click(screen.getByRole("button", { name: /submit search/i }));

    expect(screen.getByTestId("location").textContent).toBe("/");
  });

  it("submits the form when Enter is pressed in the search input", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.type(screen.getByRole("searchbox"), "react{Enter}");

    expect(screen.getByTestId("location").textContent).toBe("/search?q=react");
  });
});
